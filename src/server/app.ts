import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import {
  completeCookRunSchema,
  createCookRunEventSchema,
  startCookRunSchema,
  updateCookRunSchema
} from "../shared/contracts.js";
import { openDatabase, type CuradhDb } from "./db.js";

type BuildServerOptions = {
  dbPath?: string;
};

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
    SELECT id, label, status, yield_text AS yieldText, notes
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

  return {
    ...recipe,
    variant: {
      ...variant,
      ingredients,
      steps,
      equipmentSettings
    },
    resultMarkers,
    runs: runs.map((run) => ({
      ...run,
      results: resultQuery.all(run.id)
    }))
  };
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
      SELECT 1 FROM recipe_variants WHERE id = ? AND recipe_id = ?
    `).get(parsed.data.variantId, parsed.data.recipeId);

    if (!variant) return reply.code(400).send({ error: "Recipe/variant mismatch" });

    const firstStep = db.prepare(`
      SELECT id FROM recipe_steps WHERE variant_id = ? ORDER BY position LIMIT 1
    `).get(parsed.data.variantId) as { id: string } | undefined;

    const id = randomUUID();
    const startedAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO cook_runs (
        id, recipe_id, variant_id, status, started_at, current_step_id
      ) VALUES (?, ?, ?, 'active', ?, ?)
    `).run(
      id,
      parsed.data.recipeId,
      parsed.data.variantId,
      startedAt,
      firstStep?.id ?? null
    );

    return reply.code(201).send({
      id,
      status: "active",
      startedAt,
      currentStepId: firstStep?.id ?? null
    });
  });

  app.get<{ Params: { id: string } }>("/api/cook-runs/:id", async (request, reply) => {
    const run = db.prepare(`
      SELECT id, recipe_id AS recipeId, variant_id AS variantId, status,
             started_at AS startedAt, completed_at AS completedAt,
             current_step_id AS currentStepId, notes
      FROM cook_runs WHERE id = ?
    `).get(request.params.id) as Record<string, unknown> | undefined;

    if (!run) return reply.code(404).send({ error: "Cook Run not found" });

    const events = db.prepare(`
      SELECT id, step_id AS stepId, event_type AS eventType, text,
             structured_data_json AS structuredDataJson, created_at AS createdAt
      FROM cook_run_events
      WHERE cook_run_id = ?
      ORDER BY created_at, rowid
    `).all(request.params.id);

    return { ...run, events };
  });

  app.patch<{ Params: { id: string } }>("/api/cook-runs/:id", async (request, reply) => {
    const parsed = updateCookRunSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const result = db.prepare(`
      UPDATE cook_runs SET current_step_id = ?
      WHERE id = ? AND status = 'active'
    `).run(parsed.data.currentStepId, request.params.id);

    if (!result.changes) return reply.code(404).send({ error: "Active Cook Run not found" });
    return { ok: true };
  });

  app.post<{ Params: { id: string } }>("/api/cook-runs/:id/events", async (request, reply) => {
    const parsed = createCookRunEventSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const activeRun = db.prepare(
      "SELECT 1 FROM cook_runs WHERE id = ? AND status = 'active'"
    ).get(request.params.id);

    if (!activeRun) return reply.code(404).send({ error: "Active Cook Run not found" });

    const id = randomUUID();
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO cook_run_events (
        id, cook_run_id, step_id, event_type, text, structured_data_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      request.params.id,
      parsed.data.stepId ?? null,
      parsed.data.eventType,
      parsed.data.text,
      parsed.data.structuredData ? JSON.stringify(parsed.data.structuredData) : null,
      createdAt
    );

    return reply.code(201).send({ id, createdAt });
  });

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
