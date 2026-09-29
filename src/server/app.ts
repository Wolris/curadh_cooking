import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import {
  completeCookRunSchema,
  createCookRunEventSchema,
  startCookRunSchema,
  updateCookRunEventSchema,
  updateCookRunSchema,
  type RecipeSelectionValue
} from "../shared/contracts.js";
import { openDatabase, type CuradhDb } from "./db.js";

type BuildServerOptions = {
  dbPath?: string;
};

type RecipeChoiceOption = {
  value: string;
  label: string;
  quantity?: string;
  form?: string | null;
  advisory?: string;
  activeMinutes?: number;
};

type RecipeChoice = {
  key: string;
  kind: "toggle" | "select";
  label: string;
  ingredientId?: string;
  defaultValue: RecipeSelectionValue;
  advisory?: string;
  options?: RecipeChoiceOption[];
};

type RecipeConfiguration = {
  version: number;
  choices: RecipeChoice[];
};

type RecipeIngredient = {
  id: string;
  name: string;
  quantity: string;
  form?: string | null;
  optional: number;
  position: number;
};

type RecipeStep = {
  id: string;
  position: number;
  instruction: string;
  stageKey?: string | null;
};

function parseConfiguration(value: unknown): RecipeConfiguration | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return JSON.parse(value) as RecipeConfiguration;
}

function getRecipeDetail(db: CuradhDb, slug: string) {
  const recipe = db.prepare(`
    SELECT id, slug, title, status, summary,
           known_result_summary AS knownResultSummary,
           known_improvement AS knownImprovement,
           canonical_variant_id AS canonicalVariantId
    FROM recipes
    WHERE slug = ?
  `).get(slug) as Record<string, unknown> | undefined;

  if (!recipe) return null;

  const variant = db.prepare(`
    SELECT id, label, status, yield_text AS yieldText, notes, configuration_json AS configurationJson
    FROM recipe_variants
    WHERE id = ?
  `).get(recipe.canonicalVariantId) as Record<string, unknown>;

  const ingredients = db.prepare(`
    SELECT i.id, i.canonical_name AS name, vi.quantity_text AS quantity,
           vi.form_text AS form, vi.optional, vi.position
    FROM variant_ingredients vi
    JOIN ingredients i ON i.id = vi.ingredient_id
    WHERE vi.variant_id = ?
    ORDER BY vi.position
  `).all(variant.id);

  const steps = db.prepare(`
    SELECT id, position, instruction, stage_key AS stageKey
    FROM recipe_steps
    WHERE variant_id = ?
    ORDER BY position
  `).all(variant.id);

  const equipmentSettings = db.prepare(`
    SELECT e.name AS equipment, ves.setting_key AS settingKey,
           ves.setting_value AS settingValue
    FROM variant_equipment_settings ves
    JOIN equipment e ON e.id = ves.equipment_id
    WHERE ves.variant_id = ?
    ORDER BY ves.setting_key
  `).all(variant.id);

  const resultMarkers = db.prepare(`
    SELECT id, marker_key AS markerKey, label, description, position
    FROM result_markers
    WHERE recipe_id = ?
    ORDER BY position
  `).all(recipe.id);

  const runs = db.prepare(`
    SELECT id, status, started_at AS startedAt, completed_at AS completedAt
    FROM cook_runs
    WHERE recipe_id = ?
    ORDER BY started_at DESC
  `).all(recipe.id) as Array<Record<string, unknown>>;

  const resultQuery = db.prepare(`
    SELECT rm.label, crr.outcome, crr.note
    FROM cook_run_results crr
    JOIN result_markers rm ON rm.id = crr.result_marker_id
    WHERE crr.cook_run_id = ?
    ORDER BY rm.position
  `);

  const configuration = parseConfiguration(variant.configurationJson);
  delete variant.configurationJson;

  return {
    ...recipe,
    variant: {
      ...variant,
      ingredients,
      steps,
      equipmentSettings,
      configuration
    },
    resultMarkers,
    runs: runs.map((run) => ({
      ...run,
      results: resultQuery.all(run.id)
    }))
  };
}

function resolveSelections(
  configuration: RecipeConfiguration | null,
  requested: Record<string, RecipeSelectionValue> | undefined
) {
  const selections: Record<string, RecipeSelectionValue> = {};
  for (const choice of configuration?.choices ?? []) {
    const candidate = requested?.[choice.key] ?? choice.defaultValue;
    if (choice.kind === "toggle") {
      selections[choice.key] = typeof candidate === "boolean" ? candidate : Boolean(choice.defaultValue);
      continue;
    }
    const allowed = new Set((choice.options ?? []).map((option) => option.value));
    selections[choice.key] =
      typeof candidate === "string" && allowed.has(candidate)
        ? candidate
        : choice.defaultValue;
  }
  return selections;
}

function buildChickenSoupSnapshot(
  ingredients: RecipeIngredient[],
  recipeSteps: RecipeStep[],
  configuration: RecipeConfiguration,
  selections: Record<string, RecipeSelectionValue>
) {
  const included = (key: string) => selections[key] !== false;
  const carrotPrep = selections["carrots.prep"] === "knife" ? "knife" : "cuisinart";
  const peelCarrots = selections["carrots.peel"] !== false;
  const parsleyForm = selections["parsley.form"] === "prepared" ? "prepared" : "fresh";

  const configuredIngredients = ingredients
    .filter((ingredient) => {
      if (ingredient.id === "yellow-onion") return included("yellow-onion.include");
      if (ingredient.id === "celery") return included("celery.include");
      if (ingredient.id === "parsley") return included("parsley.include");
      return true;
    })
    .map((ingredient) => {
      if (ingredient.id !== "parsley" || parsleyForm !== "prepared") return ingredient;
      return {
        ...ingredient,
        quantity: "2 tsp",
        form: "prepared or pre-chopped"
      };
    });

  const prepSteps: Array<{ key: string; stage: "prep"; instruction: string }> = [
    {
      key: "prep-carrots",
      stage: "prep",
      instruction: peelCarrots
        ? `Peel the carrots, then ${carrotPrep === "cuisinart"
            ? "cut them into pieces suitable for the Cuisinart / food processor."
            : "chop them into large pieces with a knife."}`
        : carrotPrep === "cuisinart"
          ? "Scrub the carrots well, leave the peel on, and cut them into pieces suitable for the Cuisinart / food processor."
          : "Scrub the carrots well, leave the peel on, and chop them into large pieces with a knife."
    }
  ];

  if (included("yellow-onion.include")) {
    prepSteps.push({
      key: "prep-onion",
      stage: "prep",
      instruction: "Peel the yellow onion and cut it into quarters."
    });
  }

  if (included("celery.include")) {
    prepSteps.push({
      key: "prep-celery",
      stage: "prep",
      instruction: "Rinse and trim the celery, then cut the stalks in half."
    });
  }

  if (included("parsley.include")) {
    prepSteps.push({
      key: "prep-parsley",
      stage: "prep",
      instruction:
        parsleyForm === "prepared"
          ? "Measure 2 tsp prepared or pre-chopped parsley."
          : "Rinse 8 to 10 parsley sprigs; leave them whole for the broth."
    });
  }

  const aromaticNames = [
    included("yellow-onion.include") ? "onion" : null,
    included("celery.include") ? "celery" : null,
    included("parsley.include") ? "parsley" : null
  ].filter(Boolean) as string[];

  const addList = ["chicken", "carrots", ...aromaticNames, "2 tsp salt"];
  const spentList = aromaticNames.length ? aromaticNames.join(", ") : "any spent aromatics";

  const cookSteps = recipeSteps.map((step) => {
    let instruction = step.instruction;
    if (step.position === 1) {
      instruction = `Put the ${addList.join(", ")} into the Instant Pot.`;
    }
    if (step.position === 7) {
      instruction = `Strain the broth into a large bowl or second pot. Keep the cooked carrots; discard ${spentList} unless you intentionally want to retain them.`;
    }
    return {
      key: `cook-${step.position}`,
      sourceStepId: step.id,
      stage: "cook" as const,
      stageKey: step.stageKey ?? null,
      instruction
    };
  });

  const prepOption = configuration.choices
    .find((choice) => choice.key === "carrots.prep")
    ?.options?.find((option) => option.value === carrotPrep);

  return {
    version: 1,
    selections,
    configuredIngredients,
    estimatedPrepMinutes: prepOption?.activeMinutes ?? null,
    steps: [...prepSteps, ...cookSteps]
  };
}

function buildCookRunSnapshot(
  recipeId: string,
  ingredients: RecipeIngredient[],
  steps: RecipeStep[],
  configuration: RecipeConfiguration | null,
  requested: Record<string, RecipeSelectionValue> | undefined
) {
  if (!configuration) return null;
  const selections = resolveSelections(configuration, requested);
  if (recipeId === "recipe-0002") {
    return buildChickenSoupSnapshot(ingredients, steps, configuration, selections);
  }
  return { version: 1, selections, configuredIngredients: ingredients, estimatedPrepMinutes: null, steps };
}

export function buildServer(options: BuildServerOptions = {}) {
  const db = openDatabase(options.dbPath);
  const app = Fastify({ logger: false });

  app.addHook("onClose", async () => {
    db.close();
  });

  app.get("/api/health", async () => ({ status: "ok" }));

  app.get("/api/recipes", async () => {
    return db.prepare(`
      SELECT id, slug, title, status, summary,
             known_result_summary AS knownResultSummary,
             known_improvement AS knownImprovement
      FROM recipes
      ORDER BY title
    `).all();
  });

  app.get<{ Params: { slug: string } }>("/api/recipes/:slug", async (request, reply) => {
    const detail = getRecipeDetail(db, request.params.slug);
    if (!detail) return reply.code(404).send({ error: "Recipe not found" });
    return detail;
  });

  app.post("/api/cook-runs", async (request, reply) => {
    const parsed = startCookRunSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const variant = db.prepare(`
      SELECT configuration_json AS configurationJson
      FROM recipe_variants WHERE id = ? AND recipe_id = ?
    `).get(parsed.data.variantId, parsed.data.recipeId) as { configurationJson?: string | null } | undefined;

    if (!variant) return reply.code(400).send({ error: "Recipe/variant mismatch" });

    const ingredients = db.prepare(`
      SELECT i.id, i.canonical_name AS name, vi.quantity_text AS quantity,
             vi.form_text AS form, vi.optional, vi.position
      FROM variant_ingredients vi
      JOIN ingredients i ON i.id = vi.ingredient_id
      WHERE vi.variant_id = ?
      ORDER BY vi.position
    `).all(parsed.data.variantId) as RecipeIngredient[];

    const steps = db.prepare(`
      SELECT id, position, instruction, stage_key AS stageKey
      FROM recipe_steps
      WHERE variant_id = ?
      ORDER BY position
    `).all(parsed.data.variantId) as RecipeStep[];

    const configuration = parseConfiguration(variant.configurationJson);
    const snapshot = buildCookRunSnapshot(
      parsed.data.recipeId,
      ingredients,
      steps,
      configuration,
      parsed.data.selections
    );

    const firstStep = snapshot?.steps[0] as { key?: string; sourceStepId?: string; id?: string } | undefined;
    const legacyFirstStep = !snapshot
      ? db.prepare(`
          SELECT id FROM recipe_steps WHERE variant_id = ? ORDER BY position LIMIT 1
        `).get(parsed.data.variantId) as { id: string } | undefined
      : undefined;

    const id = randomUUID();
    const startedAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO cook_runs (
        id, recipe_id, variant_id, status, started_at, current_step_id,
        current_step_key, configuration_snapshot_json
      ) VALUES (?, ?, ?, 'active', ?, ?, ?, ?)
    `).run(
      id,
      parsed.data.recipeId,
      parsed.data.variantId,
      startedAt,
      firstStep?.sourceStepId ?? legacyFirstStep?.id ?? null,
      firstStep?.key ?? null,
      snapshot ? JSON.stringify(snapshot) : null
    );

    return reply.code(201).send({
      id,
      status: "active",
      startedAt,
      currentStepId: firstStep?.sourceStepId ?? legacyFirstStep?.id ?? null,
      currentStepKey: firstStep?.key ?? null,
      snapshot
    });
  });

  app.get<{ Params: { id: string } }>("/api/cook-runs/:id", async (request, reply) => {
    const run = db.prepare(`
      SELECT id, recipe_id AS recipeId, variant_id AS variantId, status,
             started_at AS startedAt, completed_at AS completedAt,
             current_step_id AS currentStepId, current_step_key AS currentStepKey,
             configuration_snapshot_json AS configurationSnapshotJson, notes
      FROM cook_runs WHERE id = ?
    `).get(request.params.id) as Record<string, unknown> | undefined;

    if (!run) return reply.code(404).send({ error: "Cook Run not found" });

    const rawEvents = db.prepare(`
      SELECT id, step_id AS stepId, run_step_key AS runStepKey,
             event_type AS eventType, text,
             structured_data_json AS structuredDataJson, created_at AS createdAt
      FROM cook_run_events
      WHERE cook_run_id = ?
      ORDER BY created_at, rowid
    `).all(request.params.id) as Array<Record<string, unknown>>;

    const snapshot =
      typeof run.configurationSnapshotJson === "string" && run.configurationSnapshotJson
        ? JSON.parse(run.configurationSnapshotJson)
        : null;
    delete run.configurationSnapshotJson;

    const events = rawEvents.map((event) => {
      const structuredData =
        typeof event.structuredDataJson === "string" && event.structuredDataJson
          ? JSON.parse(event.structuredDataJson)
          : null;
      const runStepKey =
        typeof event.runStepKey === "string" && event.runStepKey
          ? event.runStepKey
          : typeof structuredData?.runStepKey === "string"
            ? structuredData.runStepKey
            : event.stepId ?? null;
      const { structuredDataJson, ...rest } = event;
      return { ...rest, runStepKey, structuredData };
    });

    return { ...run, snapshot, events };
  });

  app.patch<{ Params: { id: string } }>("/api/cook-runs/:id", async (request, reply) => {
    const parsed = updateCookRunSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const result = db.prepare(`
      UPDATE cook_runs
      SET current_step_id = COALESCE(?, current_step_id),
          current_step_key = COALESCE(?, current_step_key)
      WHERE id = ? AND status = 'active'
    `).run(
      parsed.data.currentStepId ?? null,
      parsed.data.currentStepKey ?? null,
      request.params.id
    );

    if (!result.changes) return reply.code(404).send({ error: "Active Cook Run not found" });
    return { ok: true };
  });

  function runContainsStep(
    run: { variantId: string; snapshotJson?: string | null },
    runStepKey: string
  ) {
    if (run.snapshotJson) {
      const snapshot = JSON.parse(run.snapshotJson) as {
        steps?: Array<{ key?: string }>;
      };
      return Boolean(snapshot.steps?.some((step) => step.key === runStepKey));
    }

    return Boolean(
      db.prepare(
        "SELECT 1 FROM recipe_steps WHERE variant_id = ? AND id = ?"
      ).get(run.variantId, runStepKey)
    );
  }

  app.post<{ Params: { id: string } }>("/api/cook-runs/:id/events", async (request, reply) => {
    const parsed = createCookRunEventSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const activeRun = db.prepare(`
      SELECT variant_id AS variantId,
             configuration_snapshot_json AS snapshotJson
      FROM cook_runs
      WHERE id = ? AND status = 'active'
    `).get(request.params.id) as { variantId: string; snapshotJson?: string | null } | undefined;

    if (!activeRun) return reply.code(404).send({ error: "Active Cook Run not found" });
    if (!runContainsStep(activeRun, parsed.data.runStepKey)) {
      return reply.code(400).send({ error: "Run note step does not belong to this Cook Run" });
    }

    const id = randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO cook_run_events (
        id, cook_run_id, step_id, run_step_key, event_type, text,
        structured_data_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      request.params.id,
      parsed.data.stepId ?? null,
      parsed.data.runStepKey,
      parsed.data.eventType,
      parsed.data.text,
      parsed.data.structuredData ? JSON.stringify(parsed.data.structuredData) : null,
      createdAt
    );

    return reply.code(201).send({
      id,
      runStepKey: parsed.data.runStepKey,
      createdAt
    });
  });

  app.patch<{ Params: { id: string; eventId: string } }>(
    "/api/cook-runs/:id/events/:eventId",
    async (request, reply) => {
      const parsed = updateCookRunEventSchema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

      const run = db.prepare(`
        SELECT variant_id AS variantId,
               configuration_snapshot_json AS snapshotJson
        FROM cook_runs
        WHERE id = ?
      `).get(request.params.id) as { variantId: string; snapshotJson?: string | null } | undefined;

      if (!run) return reply.code(404).send({ error: "Cook Run not found" });
      if (!runContainsStep(run, parsed.data.runStepKey)) {
        return reply.code(400).send({ error: "Run note step does not belong to this Cook Run" });
      }

      const existing = db.prepare(`
        SELECT structured_data_json AS structuredDataJson
        FROM cook_run_events
        WHERE id = ? AND cook_run_id = ?
      `).get(request.params.eventId, request.params.id) as
        | { structuredDataJson?: string | null }
        | undefined;

      if (!existing) return reply.code(404).send({ error: "Cook Run note not found" });

      const structuredData =
        existing.structuredDataJson
          ? JSON.parse(existing.structuredDataJson) as Record<string, unknown>
          : {};

      const result = db.prepare(`
        UPDATE cook_run_events
        SET event_type = ?, text = ?, run_step_key = ?, structured_data_json = ?
        WHERE id = ? AND cook_run_id = ?
      `).run(
        parsed.data.eventType,
        parsed.data.text,
        parsed.data.runStepKey,
        JSON.stringify({
          ...structuredData,
          action: parsed.data.eventType,
          runStepKey: parsed.data.runStepKey
        }),
        request.params.eventId,
        request.params.id
      );

      if (!result.changes) return reply.code(404).send({ error: "Cook Run note not found" });
      return { ok: true };
    }
  );

  app.delete<{ Params: { id: string; eventId: string } }>(
    "/api/cook-runs/:id/events/:eventId",
    async (request, reply) => {
      const result = db.prepare(
        "DELETE FROM cook_run_events WHERE id = ? AND cook_run_id = ?"
      ).run(request.params.eventId, request.params.id);

      if (!result.changes) return reply.code(404).send({ error: "Cook Run note not found" });
      return { ok: true };
    }
  );

  app.post<{ Params: { id: string } }>("/api/cook-runs/:id/complete", async (request, reply) => {
    const parsed = completeCookRunSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const run = db.prepare(
      "SELECT recipe_id AS recipeId FROM cook_runs WHERE id = ? AND status = 'active'"
    ).get(request.params.id) as { recipeId: string } | undefined;

    if (!run) return reply.code(404).send({ error: "Active Cook Run not found" });

    const markerBelongs = db.prepare(
      "SELECT 1 FROM result_markers WHERE id = ? AND recipe_id = ?"
    );
    const insertResult = db.prepare(`
      INSERT INTO cook_run_results (cook_run_id, result_marker_id, outcome, note)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(cook_run_id, result_marker_id)
      DO UPDATE SET outcome = excluded.outcome, note = excluded.note
    `);

    try {
      db.transaction(() => {
        for (const result of parsed.data.results) {
          if (!markerBelongs.get(result.resultMarkerId, run.recipeId)) {
            throw new Error("Result marker does not belong to this recipe");
          }
          insertResult.run(
            request.params.id,
            result.resultMarkerId,
            result.outcome,
            result.note || null
          );
        }

        db.prepare(`
          UPDATE cook_runs
          SET status = 'completed', completed_at = ?
          WHERE id = ?
        `).run(new Date().toISOString(), request.params.id);
      })();
    } catch (error) {
      return reply.code(400).send({
        error: error instanceof Error ? error.message : "Could not complete Cook Run"
      });
    }

    return { ok: true };
  });

  return app;
}
