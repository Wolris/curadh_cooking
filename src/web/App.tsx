import { useEffect, useMemo, useState } from "react";
import type {
  CookRunEventType,
  RecipeSelectionValue,
  ResultOutcome
} from "../shared/contracts";

type RecipeSummary = {
  id: string;
  slug: string;
  title: string;
  status: string;
  summary: string;
  knownResultSummary: string;
  knownImprovement?: string | null;
};

type Ingredient = {
  id: string;
  name: string;
  quantity: string;
  form?: string | null;
  optional: number;
  position?: number;
};

type Step = {
  id: string;
  position: number;
  instruction: string;
  stageKey?: string | null;
};

type RecipeChoiceOption = {
  value: string;
  label: string;
  quantity?: string;
  form?: string | null;
  advisory?: string;
  estimate?: boolean;
  estimateNote?: string;
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

type EquipmentSetting = {
  equipment: string;
  settingKey: string;
  settingValue: string;
};

type ResultMarker = {
  id: string;
  markerKey: string;
  label: string;
  description?: string | null;
  position: number;
};

type RunResult = {
  resultMarkerId: string;
  label: string;
  outcome: ResultOutcome;
  note?: string | null;
};

type RunHistory = {
  id: string;
  status: string;
  startedAt: string;
  completedAt?: string | null;
  results: RunResult[];
};

type RunPlanStep = {
  key: string;
  sourceStepId?: string;
  stage: "prep" | "cook";
  stageKey?: string | null;
  ingredientId?: string;
  label?: string;
  instruction: string;
};

type CookRunSnapshot = {
  version: number;
  selections: Record<string, RecipeSelectionValue>;
  configuredIngredients: Ingredient[];
  estimatedPrepMinutes?: number | null;
  steps: RunPlanStep[];
};

type RecipeDetail = RecipeSummary & {
  canonicalVariantId: string;
  variant: {
    id: string;
    label: string;
    status: string;
    yieldText?: string | null;
    notes?: string | null;
    ingredients: Ingredient[];
    steps: Step[];
    equipmentSettings: EquipmentSetting[];
    configuration?: RecipeConfiguration | null;
  };
  resultMarkers: ResultMarker[];
  runs: RunHistory[];
};

type ActiveRun = {
  id: string;
  status: string;
  startedAt: string;
  currentStepId?: string | null;
  currentStepKey?: string | null;
  completedStepKeys?: string[];
  snapshot?: CookRunSnapshot | null;
};

type ActiveRunReference = {
  id: string;
  recipeSlug: string;
};

type RunEvent = {
  id: string;
  stepId?: string | null;
  runStepKey?: string | null;
  eventType: CookRunEventType;
  text: string;
  createdAt: string;
};

type CompletedRunDetail = ActiveRun & {
  completedAt?: string | null;
  events: RunEvent[];
  results: RunResult[];
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ? JSON.stringify(payload.error) : `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function defaultsFor(configuration?: RecipeConfiguration | null) {
  return Object.fromEntries(
    (configuration?.choices ?? []).map((choice) => [choice.key, choice.defaultValue])
  );
}

const runChangeActions: Array<{
  type: CookRunEventType;
  label: string;
  prompt: string;
  placeholder: string;
}> = [
  {
    type: "observation",
    label: "Observation",
    prompt: "What did you notice?",
    placeholder: "Example: The broth looks cloudier than expected."
  },
  {
    type: "substitution",
    label: "Substitute",
    prompt: "What did you substitute?",
    placeholder: "Example: I used 1/2 white onion + 1/2 red onion instead of 1 yellow onion."
  },
  {
    type: "ingredient-skip",
    label: "Skip",
    prompt: "What did you skip?",
    placeholder: "Example: I skipped the celery."
  },
  {
    type: "ingredient-add",
    label: "Add",
    prompt: "What did you add?",
    placeholder: "Example: I added another 1/2 cup of water."
  },
  {
    type: "amount-change",
    label: "Amount",
    prompt: "What amount changed?",
    placeholder: "Example: I used 1 tsp salt instead of 2 tsp."
  },
  {
    type: "setting-change",
    label: "Setting / prep",
    prompt: "What setting or prep method changed?",
    placeholder: "Example: I chopped the carrots by hand instead of using the food processor."
  }
];

function runChangeLabel(type: CookRunEventType) {
  return runChangeActions.find((action) => action.type === type)?.label ?? type;
}

export function App() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [selections, setSelections] = useState<Record<string, RecipeSelectionValue>>({});
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const [completedRunEdit, setCompletedRunEdit] = useState<CompletedRunDetail | null>(null);
  const [completedRunEventStepKey, setCompletedRunEventStepKey] = useState<string>("");
  const [viewingRecipeDuringRun, setViewingRecipeDuringRun] = useState(false);
  const [runEvents, setRunEvents] = useState<RunEvent[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [eventType, setEventType] = useState<CookRunEventType>("observation");
  const [eventText, setEventText] = useState("");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingRunStepKey, setEditingRunStepKey] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [resultValues, setResultValues] = useState<Record<string, ResultOutcome>>({});
  const [resultNotes, setResultNotes] = useState<Record<string, string>>({});
  const [completedResultValues, setCompletedResultValues] = useState<Record<string, ResultOutcome>>({});
  const [completedResultNotes, setCompletedResultNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const [recipeList, active] = await Promise.all([
          requestJson<RecipeSummary[]>("/api/recipes"),
          requestJson<ActiveRunReference | null>("/api/cook-runs/active/latest")
        ]);

        if (cancelled) return;
        setRecipes(recipeList);

        if (active) {
          await resumeActiveRun(active);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : String(cause));
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!recipe) return;
    setResultValues(
      Object.fromEntries(recipe.resultMarkers.map((marker) => [marker.id, "not-observed"]))
    );
  }, [recipe?.id]);

  const historyRuns = useMemo(
    () =>
      recipe?.runs.filter(
        (run) => run.status === "completed" || run.status === "abandoned"
      ) ?? [],
    [recipe]
  );

  const configuration = recipe?.variant.configuration ?? null;
  const runSteps = useMemo<RunPlanStep[]>(() => {
    const snapshotSteps = activeRun?.snapshot?.steps ?? completedRunEdit?.snapshot?.steps;
    if (snapshotSteps) return snapshotSteps;
    return (recipe?.variant.steps ?? []).map((step) => ({
      key: step.id,
      sourceStepId: step.id,
      stage: "cook",
      stageKey: step.stageKey,
      instruction: step.instruction
    }));
  }, [activeRun?.snapshot, completedRunEdit?.snapshot, recipe?.variant.steps]);

  const currentRunStep = runSteps[currentStepIndex] ?? null;

  function runStepLabel(runStepKey?: string | null) {
    if (!runStepKey) return "Unknown step";
    const step = runSteps.find((item) => item.key === runStepKey);
    if (!step) return "Earlier step";
    const sameStage = runSteps.filter((item) => item.stage === step.stage);
    const index = sameStage.findIndex((item) => item.key === step.key) + 1;
    return `${step.stage === "prep" ? "Prep" : "Cook"} ${index}`;
  }

  const carrotPrepMinutes = useMemo(() => {
    const choice = configuration?.choices.find((item) => item.key === "carrots.prep");
    const selected = selections["carrots.prep"];
    return choice?.options?.find((option) => option.value === selected)?.activeMinutes ?? null;
  }, [configuration, selections]);

  async function resumeActiveRun(reference: ActiveRunReference) {
    const [detail, run] = await Promise.all([
      requestJson<RecipeDetail>(`/api/recipes/${reference.recipeSlug}`),
      requestJson<ActiveRun & { events: RunEvent[] }>(`/api/cook-runs/${reference.id}`)
    ]);

    const restoredSteps: RunPlanStep[] =
      run.snapshot?.steps ??
      detail.variant.steps.map((step) => ({
        key: step.id,
        sourceStepId: step.id,
        stage: "cook" as const,
        stageKey: step.stageKey,
        instruction: step.instruction
      }));

    const currentKey = run.currentStepKey ?? run.currentStepId ?? restoredSteps[0]?.key;
    const restoredIndex = Math.max(
      0,
      restoredSteps.findIndex((step) => step.key === currentKey)
    );

    setRecipe(detail);
    setSelections(run.snapshot?.selections ?? defaultsFor(detail.variant.configuration));
    setActiveRun(run);
    setViewingRecipeDuringRun(false);
    setRunEvents(run.events);
    setCurrentStepIndex(restoredIndex);
    setEditingEventId(null);
    setEditingRunStepKey(null);
    setEventType("observation");
    setEventText("");
    setFinishing(false);
  }

  async function openCompletedRun(runId: string) {
    if (!recipe) return;
    setError(null);

    try {
      const run = await requestJson<CompletedRunDetail>(`/api/cook-runs/${runId}`);
      const steps =
        run.snapshot?.steps ??
        recipe.variant.steps.map((step) => ({
          key: step.id,
          sourceStepId: step.id,
          stage: "cook" as const,
          stageKey: step.stageKey,
          instruction: step.instruction
        }));

      setCompletedRunEdit(run);
      setCompletedRunEventStepKey("");
      setCompletedResultValues(
        Object.fromEntries(
          recipe.resultMarkers.map((marker) => [
            marker.id,
            run.results.find((result) => result.resultMarkerId === marker.id)?.outcome ??
              "not-observed"
          ])
        )
      );
      setCompletedResultNotes(
        Object.fromEntries(
          recipe.resultMarkers.map((marker) => [
            marker.id,
            run.results.find((result) => result.resultMarkerId === marker.id)?.note ?? ""
          ])
        )
      );
      setEditingEventId(null);
      setEditingRunStepKey(null);
      setEventType("observation");
      setEventText("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  async function closeCompletedRunEditor() {
    if (!recipe) {
      setCompletedRunEdit(null);
      return;
    }
    const slug = recipe.slug;
    setCompletedRunEdit(null);
    setEditingEventId(null);
    setEditingRunStepKey(null);
    setEventType("observation");
    setEventText("");
    await openRecipe(slug);
  }

  async function saveCompletedResults() {
    if (!recipe || !completedRunEdit) return;
    setError(null);

    try {
      await requestJson(`/api/cook-runs/${completedRunEdit.id}/results`, {
        method: "PUT",
        body: JSON.stringify({
          results: recipe.resultMarkers.map((marker) => ({
            resultMarkerId: marker.id,
            outcome: completedResultValues[marker.id] ?? "not-observed",
            note: completedResultNotes[marker.id] ?? ""
          }))
        })
      });

      const refreshed = await requestJson<CompletedRunDetail>(
        `/api/cook-runs/${completedRunEdit.id}`
      );
      setCompletedRunEdit(refreshed);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  async function openRecipe(slug: string) {
    setError(null);
    const detail = await requestJson<RecipeDetail>(`/api/recipes/${slug}`);
    setRecipe(detail);
    setSelections(defaultsFor(detail.variant.configuration));
    setActiveRun(null);
    setCompletedRunEdit(null);
    setViewingRecipeDuringRun(false);
    setRunEvents([]);
    setCurrentStepIndex(0);
    setEditingEventId(null);
    setEditingRunStepKey(null);
    setEventText("");
    setFinishing(false);
  }

  async function startCookRun() {
    if (!recipe) return;
    setError(null);

    const run = await requestJson<ActiveRun>("/api/cook-runs", {
      method: "POST",
      body: JSON.stringify({
        recipeId: recipe.id,
        variantId: recipe.variant.id,
        selections
      })
    });

    setActiveRun(run);
    setViewingRecipeDuringRun(false);
    setRunEvents([]);
    setCurrentStepIndex(0);
    setEditingEventId(null);
    setEditingRunStepKey(null);
    setEventText("");
    setFinishing(false);
  }

  async function moveStep(nextIndex: number, completeCurrent = false) {
    if (!activeRun || runSteps.length === 0) return;
    const bounded = Math.max(0, Math.min(runSteps.length - 1, nextIndex));
    const step = runSteps[bounded];
    const completedStepKeys =
      completeCurrent && currentRunStep
        ? Array.from(
            new Set([...(activeRun.completedStepKeys ?? []), currentRunStep.key])
          )
        : activeRun.completedStepKeys ?? [];

    const progress = activeRun.snapshot
      ? {
          currentStepKey: step.key,
          ...(completeCurrent ? { completedStepKeys } : {})
        }
      : {
          currentStepId: step.sourceStepId ?? step.key,
          ...(completeCurrent ? { completedStepKeys } : {})
        };

    await requestJson<{ ok: true }>(`/api/cook-runs/${activeRun.id}`, {
      method: "PATCH",
      body: JSON.stringify(progress)
    });

    setCurrentStepIndex(bounded);
    setActiveRun({
      ...activeRun,
      completedStepKeys,
      currentStepKey: activeRun.snapshot ? step.key : activeRun.currentStepKey,
      currentStepId: !activeRun.snapshot ? step.sourceStepId ?? step.key : activeRun.currentStepId
    });
  }

  async function advanceStep() {
    await moveStep(currentStepIndex + 1, true);
  }

  async function refreshRun() {
    const target = activeRun ?? completedRunEdit;
    if (!target) return;

    const run = await requestJson<CompletedRunDetail>(
      `/api/cook-runs/${target.id}`
    );

    if (activeRun) {
      setActiveRun(run);
      setRunEvents(run.events);
    } else {
      setCompletedRunEdit(run);
    }
  }

  async function saveEvent() {
    const editableRun = activeRun ?? completedRunEdit;
    if (!editableRun || !eventText.trim()) return;
    const runStepKey =
      editingRunStepKey ??
      (activeRun ? currentRunStep?.key : completedRunEventStepKey) ??
      null;
    if (!runStepKey) {
      setError("A Cook Run note must be tied to a run step.");
      return;
    }

    setError(null);

    try {
      if (editingEventId) {
        await requestJson(`/api/cook-runs/${editableRun.id}/events/${editingEventId}`, {
          method: "PATCH",
          body: JSON.stringify({
            eventType,
            text: eventText.trim(),
            runStepKey
          })
        });
      } else {
        await requestJson(`/api/cook-runs/${editableRun.id}/events`, {
          method: "POST",
          body: JSON.stringify({
            stepId:
              runSteps.find((step) => step.key === runStepKey)?.sourceStepId ?? null,
            runStepKey,
            eventType,
            text: eventText.trim(),
            structuredData: {
              action: eventType,
              runStepKey
            }
          })
        });
      }

      setEventText("");
      setEditingEventId(null);
      setEditingRunStepKey(null);
      setEventType("observation");
      await refreshRun();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  function editEvent(event: RunEvent) {
    setEditingEventId(event.id);
    setEditingRunStepKey(event.runStepKey ?? null);
    setEventType(event.eventType);
    setEventText(event.text);
  }

  function cancelEventEdit() {
    setEditingEventId(null);
    setEditingRunStepKey(null);
    setEventType("observation");
    setEventText("");
  }

  async function deleteEvent(event: RunEvent) {
    const editableRun = activeRun ?? completedRunEdit;
    if (!editableRun) return;
    setError(null);

    try {
      await requestJson(`/api/cook-runs/${editableRun.id}/events/${event.id}`, {
        method: "DELETE"
      });
      if (editingEventId === event.id) cancelEventEdit();
      if (activeRun) {
        setRunEvents((current) => current.filter((item) => item.id !== event.id));
      } else {
        setCompletedRunEdit((current) =>
          current
            ? { ...current, events: current.events.filter((item) => item.id !== event.id) }
            : current
        );
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  function beginCompletedStepNote(runStepKey: string) {
    setCompletedRunEventStepKey(runStepKey);
    setEditingEventId(null);
    setEditingRunStepKey(null);
    setEventType("observation");
    setEventText("");

    requestAnimationFrame(() => {
      document
        .getElementById(`completed-step-${runStepKey}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function jumpToCompletedResults() {
    requestAnimationFrame(() => {
      document
        .getElementById("completed-run-results")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function jumpToRunStage(stage: "prep" | "cook") {
    const index = runSteps.findIndex((step) => step.stage === stage);
    if (index < 0) return;
    setFinishing(false);
    await moveStep(index);
  }

  function openRunResults() {
    setFinishing(true);
    requestAnimationFrame(() => {
      document
        .getElementById("result-check")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function cancelRun() {
    if (!recipe || !activeRun) return;

    const confirmed = window.confirm(
      "Cancel this Cook Run? Saved notes, progress, and the frozen run plan will be kept. Anything currently typed but not recorded will not be saved."
    );
    if (!confirmed) return;

    setError(null);
    try {
      await requestJson(`/api/cook-runs/${activeRun.id}/cancel`, {
        method: "POST"
      });
      await openRecipe(recipe.slug);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  async function finishRun() {
    if (!recipe || !activeRun) return;
    setError(null);

    await requestJson(`/api/cook-runs/${activeRun.id}/complete`, {
      method: "POST",
      body: JSON.stringify({
        results: recipe.resultMarkers.map((marker) => ({
          resultMarkerId: marker.id,
          outcome: resultValues[marker.id] ?? "not-observed",
          note: resultNotes[marker.id] ?? ""
        }))
      })
    });

    await openRecipe(recipe.slug);
  }

  function goHome() {
    setRecipe(null);
    setActiveRun(null);
    setCompletedRunEdit(null);
    setViewingRecipeDuringRun(false);
    setRunEvents([]);
    setFinishing(false);
  }

  function setChoice(key: string, value: RecipeSelectionValue) {
    setSelections((current) => ({ ...current, [key]: value }));
  }

  function ingredientPresentation(ingredient: Ingredient) {
    if (!configuration) return ingredient;
    const includeChoice = configuration.choices.find(
      (choice) => choice.ingredientId === ingredient.id && choice.kind === "toggle" && choice.key.endsWith(".include")
    );
    if (includeChoice && selections[includeChoice.key] === false) {
      return { ...ingredient, omitted: true as const };
    }

    const formChoice = configuration.choices.find(
      (choice) => choice.ingredientId === ingredient.id && choice.key.endsWith(".form")
    );
    if (!formChoice) return ingredient;
    const selected = String(selections[formChoice.key] ?? formChoice.defaultValue);
    const option = formChoice.options?.find((item) => item.value === selected);
    return {
      ...ingredient,
      quantity: option?.quantity ?? ingredient.quantity,
      form: option?.form ?? ingredient.form,
      advisory: option?.advisory,
      estimateNote: option?.estimate ? option.estimateNote : undefined
    };
  }

  if (!recipe) {
    return (
      <main className="shell">
        <header className="hero">
          <p className="eyebrow">Curadh Cooking</p>
          <h1>What are you trying to make?</h1>
          <p>
            Start with the result you want. Recipes can then meet that goal with the
            ingredients, tools, time, and food profile that actually matter.
          </p>
        </header>

        {error && <p className="error" role="alert">{error}</p>}

        <section aria-labelledby="recipe-library">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Recipe library</p>
              <h2 id="recipe-library">Recipes and drafts</h2>
            </div>
          </div>

          <div className="card-grid">
            {recipes.map((item) => (
              <button
                className="recipe-card"
                key={item.id}
                onClick={() => void openRecipe(item.slug)}
              >
                <span className="status">{item.status}</span>
                <strong>{item.title}</strong>
                <span>{item.summary}</span>
                <span className="success-note">{item.knownResultSummary}</span>
              </button>
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (completedRunEdit) {
    const completedSteps = runSteps;
    const cancelled = completedRunEdit.status === "abandoned";
    const completedEventsByStep = new Map<string, RunEvent[]>();
    for (const step of completedSteps) {
      completedEventsByStep.set(
        step.key,
        completedRunEdit.events.filter((event) => event.runStepKey === step.key)
      );
    }

    const renderCompletedInlineEditor = (runStepKey: string) => (
      <div className="inline-note-editor">
        <div className="run-change-actions" role="group" aria-label="Completed run note type">
          {runChangeActions.map((action) => (
            <button
              key={action.type}
              type="button"
              className={eventType === action.type ? "change-action active" : "change-action"}
              aria-pressed={eventType === action.type}
              onClick={() => setEventType(action.type)}
            >
              {action.label}
            </button>
          ))}
        </div>

        <label>
          {runChangeActions.find((action) => action.type === eventType)?.prompt ?? "What happened?"}
          <textarea
            aria-label="Completed run change details"
            value={eventText}
            onChange={(event) => setEventText(event.target.value)}
            placeholder={
              runChangeActions.find((action) => action.type === eventType)?.placeholder ??
              "Describe what changed."
            }
            rows={4}
          />
        </label>

        <div className="event-log-actions">
          <button
            onClick={() => void saveEvent()}
            disabled={!eventText.trim()}
          >
            {editingEventId
              ? "Save note changes"
              : `Add ${runChangeLabel(eventType).toLowerCase()} note`}
          </button>
          <button type="button" className="text-button" onClick={cancelEventEdit}>
            Cancel
          </button>
        </div>
      </div>
    );

    return (
      <main className="shell">
        <header className="compact-header">
          <button className="text-button" onClick={() => void closeCompletedRunEditor()}>
            ← Back to recipe
          </button>
          <div>
            <p className="eyebrow">{cancelled ? "Cancelled Cook Run" : "Completed Cook Run"}</p>
            <h1>Edit run evidence</h1>
            <p>{formatDate(completedRunEdit.completedAt ?? completedRunEdit.startedAt)}</p>
          </div>
          <span className="run-badge">{cancelled ? "Cancelled" : "Completed"}</span>
        </header>

        {error && <p className="error" role="alert">{error}</p>}

        <div className="correction-note">
          <strong>This corrects the historical evidence only.</strong>
          <span>
            The frozen run plan and original run status are preserved while notes can be corrected in place.
          </span>
        </div>

        <div className="completed-run-editor">
          <div>
            <section className="panel run-transcript" aria-labelledby="completed-run-notes">
              <p className="eyebrow">What actually happened</p>
              <h2 id="completed-run-notes">Run notes</h2>
              <p>Read the full run in order. Add or edit evidence exactly where it happened.</p>

              {completedSteps.map((step) => {
                const events = completedEventsByStep.get(step.key) ?? [];
                const isDraftHere =
                  !editingEventId && completedRunEventStepKey === step.key;
                return (
                  <section
                    key={step.key}
                    id={`completed-step-${step.key}`}
                    className="run-transcript-step"
                  >
                    <div className="run-transcript-step-heading">
                      <div>
                        <span>{runStepLabel(step.key)}</span>
                        <strong>{step.label ?? step.instruction}</strong>
                      </div>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => beginCompletedStepNote(step.key)}
                      >
                        Add note here
                      </button>
                    </div>

                    {events.length === 0 && !isDraftHere && (
                      <p className="muted-note">No run notes recorded for this step.</p>
                    )}

                    <div className="event-log" aria-label={`Notes for ${runStepLabel(step.key)}`}>
                      {events.map((event) => (
                        <article key={event.id} className="run-note-card">
                          {editingEventId === event.id ? (
                            renderCompletedInlineEditor(event.runStepKey ?? step.key)
                          ) : (
                            <>
                              <div className="event-log-meta">
                                <span>{runChangeLabel(event.eventType)}</span>
                                <span>{runStepLabel(event.runStepKey)}</span>
                              </div>
                              <p className="run-note-text">{event.text}</p>
                              <div className="event-log-actions">
                                <button
                                  type="button"
                                  className="text-button"
                                  onClick={() => editEvent(event)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="text-button danger-text"
                                  onClick={() => void deleteEvent(event)}
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </article>
                      ))}
                    </div>

                    {isDraftHere && (
                      <div className="run-note-card draft-note-card">
                        <div className="event-log-meta">
                          <span>New note</span>
                          <span>{runStepLabel(step.key)}</span>
                        </div>
                        {renderCompletedInlineEditor(step.key)}
                      </div>
                    )}
                  </section>
                );
              })}
            </section>

            {!cancelled && (
              <section className="panel" id="completed-run-results" aria-labelledby="completed-run-results-heading">
                <p className="eyebrow">Submitted outcome</p>
                <h2 id="completed-run-results-heading">Result markers</h2>
                <p>Correct ratings or notes without reopening the Cook Run.</p>

                <div className="result-list">
                  {recipe.resultMarkers.map((marker) => (
                    <fieldset key={marker.id} id={`completed-result-${marker.id}`}>
                      <legend>{marker.label}</legend>
                      {marker.description && <p>{marker.description}</p>}
                      <label>
                        Outcome
                        <select
                          aria-label={`Completed ${marker.label} outcome`}
                          value={completedResultValues[marker.id] ?? "not-observed"}
                          onChange={(event) =>
                            setCompletedResultValues({
                              ...completedResultValues,
                              [marker.id]: event.target.value as ResultOutcome
                            })
                          }
                        >
                          <option value="hit">Hit</option>
                          <option value="mixed">Mixed / could improve</option>
                          <option value="miss">Miss</option>
                          <option value="not-observed">Not observed</option>
                        </select>
                      </label>
                      <label>
                        Note
                        <input
                          aria-label={`Completed ${marker.label} note`}
                          value={completedResultNotes[marker.id] ?? ""}
                          onChange={(event) =>
                            setCompletedResultNotes({
                              ...completedResultNotes,
                              [marker.id]: event.target.value
                            })
                          }
                        />
                      </label>
                    </fieldset>
                  ))}
                </div>

                <button onClick={() => void saveCompletedResults()}>
                  Save result corrections
                </button>
              </section>
            )}
          </div>

          <aside className="panel completed-run-plan" aria-label="Run Plan">
            <p className="eyebrow">Run navigation</p>
            <h2>Run Plan</h2>
            <ol className="run-outline">
              {completedSteps.map((step, index) => (
                <li key={step.key}>
                  <button
                    type="button"
                    className="outline-step"
                    onClick={() => beginCompletedStepNote(step.key)}
                  >
                    <span className="outline-marker">{index + 1}</span>
                    <span className="outline-copy">
                      <strong>{runStepLabel(step.key)}</strong>
                      <small>{step.instruction}</small>
                    </span>
                  </button>
                </li>
              ))}
              {!cancelled && (
                <li>
                  <button
                    type="button"
                    className="outline-step section-jump"
                    onClick={jumpToCompletedResults}
                  >
                    <span className="outline-marker">✓</span>
                    <span className="outline-copy">
                      <strong>Results</strong>
                      <small>Jump to submitted result markers</small>
                    </span>
                  </button>
                </li>
              )}
            </ol>
          </aside>
        </div>
      </main>
    );
  }


  if (activeRun && !viewingRecipeDuringRun) {
    const prepSteps = runSteps.filter((step) => step.stage === "prep");
    const cookSteps = runSteps.filter((step) => step.stage === "cook");
    const prepCount = prepSteps.length;
    const cookCount = cookSteps.length;
    const sameStageSteps = runSteps.filter((step) => step.stage === currentRunStep?.stage);
    const stageIndex = sameStageSteps.findIndex((step) => step.key === currentRunStep?.key) + 1;
    const stageTotal = currentRunStep?.stage === "prep" ? prepCount : cookCount;
    const completedStepKeys = new Set(activeRun.completedStepKeys ?? []);
    const fallbackPrepIngredientIds: Record<string, string> = {
      "prep-carrots": "carrots",
      "prep-onion": "yellow-onion",
      "prep-celery": "celery",
      "prep-parsley": "parsley"
    };
    const excerpt = (instruction: string) =>
      instruction.length > 86 ? `${instruction.slice(0, 83)}…` : instruction;

    return (
      <main className="shell cook-shell">
        <header className="compact-header">
          <button className="text-button" onClick={() => setViewingRecipeDuringRun(true)}>
            View Recipe
          </button>
          <div>
            <p className="eyebrow">Cook Mode</p>
            <h1>{recipe.title}</h1>
          </div>
          <span className="run-badge">Run active</span>
        </header>

        {error && <p className="error" role="alert">{error}</p>}

        {!finishing ? (
          <div className="cook-layout">
            <div className="cook-main">
            <section className="cook-stage" aria-labelledby="current-step">
              <p className="step-count">
                {currentRunStep?.stage === "prep" ? "Prep" : "Cook"} {stageIndex} of {stageTotal}
                {currentRunStep?.stageKey ? ` · ${currentRunStep.stageKey}` : ""}
              </p>
              <h2 id="current-step">{currentRunStep?.instruction}</h2>

              <div className="step-actions">
                <button
                  className="secondary"
                  disabled={currentStepIndex === 0}
                  onClick={() => void moveStep(currentStepIndex - 1)}
                >
                  Previous
                </button>
                <button
                  disabled={currentStepIndex === runSteps.length - 1}
                  onClick={() => void advanceStep()}
                >
                  Next step
                </button>
              </div>
            </section>

            <section className="panel" aria-labelledby="what-happened">
              <p className="eyebrow">Reality differs sometimes</p>
              <h2 id="what-happened">What happened?</h2>
              <p>
                Record the thing that matters. This becomes evidence for this Cook Run;
                it does not silently rewrite the recipe.
              </p>

              <div className="run-change-actions" role="group" aria-label="Record a Cook Run change">
                {runChangeActions.map((action) => (
                  <button
                    key={action.type}
                    type="button"
                    className={eventType === action.type ? "change-action active" : "change-action"}
                    aria-pressed={eventType === action.type}
                    onClick={() => setEventType(action.type)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>

              {editingEventId && (
                <div className="editing-note-banner">
                  <span>Editing note from {runStepLabel(editingRunStepKey)}</span>
                  <button type="button" className="text-button" onClick={cancelEventEdit}>
                    Cancel edit
                  </button>
                </div>
              )}

              <label>
                {runChangeActions.find((action) => action.type === eventType)?.prompt ?? "What happened?"}
                <textarea
                  aria-label="Change details"
                  value={eventText}
                  onChange={(event) => setEventText(event.target.value)}
                  placeholder={
                    runChangeActions.find((action) => action.type === eventType)?.placeholder ??
                    "Describe what changed."
                  }
                  rows={3}
                />
              </label>

              <button onClick={() => void saveEvent()} disabled={!eventText.trim()}>
                {editingEventId
                  ? "Save note changes"
                  : `Record ${runChangeLabel(eventType).toLowerCase()}`}
              </button>

              {runEvents.length > 0 && (
                <div className="event-log" aria-label="Cook Run observations">
                  <h3>Run notes</h3>
                  {runEvents.map((event) => (
                    <article key={event.id}>
                      <div className="event-log-meta">
                        <span>{runChangeLabel(event.eventType)}</span>
                        <span>{runStepLabel(event.runStepKey)}</span>
                      </div>
                      <p>{event.text}</p>
                      <div className="event-log-actions">
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => editEvent(event)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-button danger-text"
                          onClick={() => void deleteEvent(event)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <div className="step-actions step-actions-after-notes" aria-label="Cook Run navigation after notes">
              <button
                className="secondary"
                disabled={currentStepIndex === 0}
                onClick={() => void moveStep(currentStepIndex - 1)}
              >
                Previous
              </button>
              <button
                disabled={currentStepIndex === runSteps.length - 1}
                onClick={() => void advanceStep()}
              >
                Next step
              </button>
            </div>

            <button className="finish-button" onClick={() => setFinishing(true)}>
              Finish Cook Run
            </button>
            </div>

            <aside className="panel cook-context" aria-label="Recipe context">
              <p className="eyebrow">Recipe progress</p>
              {currentRunStep?.stage === "prep" ? (
                <>
                  <h2>Prep ingredients</h2>
                  <ol className="run-outline prep-outline">
                    {prepSteps.map((step, index) => {
                      const globalIndex = runSteps.findIndex((item) => item.key === step.key);
                      const ingredientId =
                        step.ingredientId ?? fallbackPrepIngredientIds[step.key];
                      const ingredient = activeRun.snapshot?.configuredIngredients.find(
                        (item) => item.id === ingredientId
                      );
                      const label =
                        step.label ??
                        ingredient?.name ??
                        step.key.replace(/^prep-/, "").replace(/-/g, " ");
                      const current = step.key === currentRunStep.key;
                      const completed = completedStepKeys.has(step.key);

                      return (
                        <li key={step.key}>
                          <button
                            type="button"
                            className={[
                              "outline-step",
                              current ? "current" : "",
                              completed ? "completed" : ""
                            ].filter(Boolean).join(" ")}
                            aria-current={current ? "step" : undefined}
                            onClick={() => void moveStep(globalIndex)}
                          >
                            <span className="outline-marker">{completed ? "✓" : index + 1}</span>
                            <span className="outline-copy">
                              <strong>{label}</strong>
                              {ingredient && (
                                <small>
                                  {ingredient.quantity}
                                  {ingredient.form ? ` · ${ingredient.form}` : ""}
                                </small>
                              )}
                              {current && <small>{step.instruction}</small>}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </>
              ) : (
                <>
                  <h2>Cooking steps</h2>
                  <ol className="run-outline cook-outline">
                    {cookSteps.map((step, index) => {
                      const globalIndex = runSteps.findIndex((item) => item.key === step.key);
                      const current = step.key === currentRunStep?.key;
                      const completed = completedStepKeys.has(step.key);

                      return (
                        <li key={step.key}>
                          <button
                            type="button"
                            className={[
                              "outline-step",
                              current ? "current" : "",
                              completed ? "completed" : ""
                            ].filter(Boolean).join(" ")}
                            aria-current={current ? "step" : undefined}
                            onClick={() => void moveStep(globalIndex)}
                          >
                            <span className="outline-marker">{completed ? "✓" : index + 1}</span>
                            <span className="outline-copy">
                              <strong>Step {index + 1}</strong>
                              <small>{current ? step.instruction : excerpt(step.instruction)}</small>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </>
              )}
            </aside>
          </div>
        ) : (
          <section className="panel results-panel" aria-labelledby="result-check">
            <p className="eyebrow">Compare with the goal</p>
            <h2 id="result-check">How did this run turn out?</h2>
            <p>
              One mixed result does not make the whole recipe a failure. Record each
              dimension independently.
            </p>

            <div className="result-list">
              {recipe.resultMarkers.map((marker) => (
                <fieldset key={marker.id}>
                  <legend>{marker.label}</legend>
                  {marker.description && <p>{marker.description}</p>}
                  <label>
                    Outcome
                    <select
                      aria-label={`${marker.label} outcome`}
                      value={resultValues[marker.id] ?? "not-observed"}
                      onChange={(event) =>
                        setResultValues({
                          ...resultValues,
                          [marker.id]: event.target.value as ResultOutcome
                        })
                      }
                    >
                      <option value="hit">Hit</option>
                      <option value="mixed">Mixed / could improve</option>
                      <option value="miss">Miss</option>
                      <option value="not-observed">Not observed</option>
                    </select>
                  </label>
                  <label>
                    Note
                    <input
                      aria-label={`${marker.label} note`}
                      value={resultNotes[marker.id] ?? ""}
                      onChange={(event) =>
                        setResultNotes({
                          ...resultNotes,
                          [marker.id]: event.target.value
                        })
                      }
                    />
                  </label>
                </fieldset>
              ))}
            </div>

            <div className="step-actions">
              <button className="secondary" onClick={() => setFinishing(false)}>
                Back to cooking
              </button>
              <button onClick={() => void finishRun()}>Save results</button>
            </div>
          </section>
        )}
      </main>
    );
  }

  const isDraft = recipe.status === "draft";
  const isTested = recipe.status === "tested";
  const lifecycleLabel = isDraft ? "Draft recipe" : isTested ? "Tested recipe" : "Canonical recipe";
  const ingredientSource =
    activeRun?.snapshot?.configuredIngredients ?? recipe.variant.ingredients;

  return (
    <main className="shell">
      {activeRun && viewingRecipeDuringRun && (
        <div className="active-run-banner">
          <div>
            <strong>Cook Run is still active</strong>
            <span>Your configured recipe is pinned for this run.</span>
          </div>
          <button onClick={() => setViewingRecipeDuringRun(false)}>
            Return to Cooking Run
          </button>
        </div>
      )}

      <header className="compact-header">
        <button className="text-button" onClick={activeRun ? () => setViewingRecipeDuringRun(false) : goHome}>
          {activeRun ? "← Cooking Run" : "← Recipes"}
        </button>
        <div>
          <p className="eyebrow">{lifecycleLabel}</p>
          <h1>{recipe.title}</h1>
        </div>
        <span className="status">{recipe.status}</span>
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      <section className="recipe-intro">
        <p>{recipe.summary}</p>
        <div className="result-summary">
          <strong>{isDraft ? "What we know so far" : "What we know works"}</strong>
          <p>{recipe.knownResultSummary}</p>
        </div>
        {recipe.knownImprovement && (
          <div className="improvement">
            <strong>{isDraft ? "What this Cook Run needs to test" : "Worth improving"}</strong>
            <p>{recipe.knownImprovement}</p>
          </div>
        )}
        {!activeRun && (
          <>
            {carrotPrepMinutes !== null && (
              <p className="planned-time">
                Planned prep: about {carrotPrepMinutes} minutes with the selected carrot method.
              </p>
            )}
            <button className="primary-large" onClick={() => void startCookRun()}>
              Start Cook Run
            </button>
          </>
        )}
      </section>

      <div className="recipe-columns">
        <section className="panel" aria-labelledby="ingredients">
          <p className="eyebrow">{activeRun ? "Pinned for this run" : "Configure before cooking"}</p>
          <h2 id="ingredients">Ingredients</h2>
          <ul className="ingredient-list configurable-ingredients">
            {ingredientSource.map((rawIngredient) => {
              const ingredient = activeRun ? rawIngredient : ingredientPresentation(rawIngredient);
              const includeChoice = !activeRun
                ? configuration?.choices.find(
                    (choice) =>
                      choice.ingredientId === rawIngredient.id &&
                      choice.kind === "toggle" &&
                      choice.key.endsWith(".include")
                  )
                : undefined;
              const formChoice = !activeRun
                ? configuration?.choices.find(
                    (choice) =>
                      choice.ingredientId === rawIngredient.id &&
                      choice.kind === "select" &&
                      choice.key.endsWith(".form")
                  )
                : undefined;
              const presentation = ingredient as Ingredient & {
                omitted?: boolean;
                advisory?: string;
                estimateNote?: string;
              };

              return (
                <li key={rawIngredient.id} className={presentation.omitted ? "ingredient-omitted" : ""}>
                  <div>
                    <strong>{presentation.quantity}</strong>
                    <span>
                      {presentation.name}
                      {presentation.form ? `, ${presentation.form}` : ""}
                    </span>
                  </div>

                  {!activeRun && (includeChoice || formChoice) && (
                    <div className="ingredient-controls">
                      {includeChoice && (
                        <label className="inline-toggle">
                          <input
                            type="checkbox"
                            aria-label={`${rawIngredient.name} include`}
                            checked={selections[includeChoice.key] !== false}
                            onChange={(event) => setChoice(includeChoice.key, event.target.checked)}
                          />
                          Include
                        </label>
                      )}
                      {formChoice && selections[`${rawIngredient.id}.include`] !== false && (
                        <label>
                          Form
                          <select
                            aria-label={`${rawIngredient.name} form`}
                            value={String(selections[formChoice.key] ?? formChoice.defaultValue)}
                            onChange={(event) => setChoice(formChoice.key, event.target.value)}
                          >
                            {formChoice.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      {includeChoice?.advisory && <p className="advisory">ⓘ {includeChoice.advisory}</p>}
                      {presentation.estimateNote && (
                        <p className="estimate-note">≈ Estimate: {presentation.estimateNote}</p>
                      )}
                      {presentation.advisory && <p className="advisory">ⓘ {presentation.advisory}</p>}
                    </div>
                  )}

                  {!activeRun && rawIngredient.id === "carrots" && configuration && (
                    <div className="ingredient-controls">
                      <label className="inline-toggle">
                        <input
                          type="checkbox"
                          checked={selections["carrots.peel"] !== false}
                          onChange={(event) => setChoice("carrots.peel", event.target.checked)}
                        />
                        Peel carrots
                      </label>
                      <label>
                        Prep with
                        <select
                          aria-label="Carrot prep method"
                          value={String(selections["carrots.prep"] ?? "cuisinart")}
                          onChange={(event) => setChoice("carrots.prep", event.target.value)}
                        >
                          {configuration.choices
                            .find((choice) => choice.key === "carrots.prep")
                            ?.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}{option.activeMinutes ? ` · ~${option.activeMinutes} min` : ""}
                              </option>
                            ))}
                        </select>
                      </label>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel" aria-labelledby="settings">
          <p className="eyebrow">{isDraft ? "Planned setup" : "Proven setup"}</p>
          <h2 id="settings">Kitchen settings</h2>
          <dl className="settings-list">
            {recipe.variant.equipmentSettings.map((setting) => (
              <div key={`${setting.equipment}-${setting.settingKey}`}>
                <dt>{setting.settingKey}</dt>
                <dd>{setting.settingValue}</dd>
              </div>
            ))}
          </dl>
          <p>{recipe.variant.notes}</p>
        </section>
      </div>

      <section className="panel" aria-labelledby="method">
        <p className="eyebrow">Method</p>
        <h2 id="method">Steps</h2>
        <ol className="method-list">
          {recipe.variant.steps.map((step) => (
            <li key={step.id}>{step.instruction}</li>
          ))}
        </ol>
        {configuration && !activeRun && (
          <p className="advisory">
            ⓘ Your Cook Run will add the selected prep steps before these cooking steps and remove instructions for omitted optional ingredients.
          </p>
        )}
      </section>

      <section className="panel" aria-labelledby="history">
        <p className="eyebrow">Evidence, not folklore</p>
        <h2 id="history">Recent Cook Runs</h2>
        {completedRuns.length === 0 ? (
          <p>
            {isDraft
              ? "No completed Cook Runs yet. This recipe stays Draft until the planned test is cooked and its result markers are recorded."
              : "No app-recorded Cook Runs yet. Existing recipe evidence is preserved in the project record."}
          </p>
        ) : (
          <div className="history-list">
            {completedRuns.map((run) => (
              <article key={run.id}>
                <div className="history-run-header">
                  <strong>{formatDate(run.completedAt ?? run.startedAt)}</strong>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => void openCompletedRun(run.id)}
                  >
                    Edit run
                  </button>
                </div>
                <div className="marker-row">
                  {run.results.map((result) => (
                    <span key={result.label} className={`marker marker-${result.outcome}`}>
                      {result.label}: {result.outcome}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
