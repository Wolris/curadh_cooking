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

  const completedRuns = useMemo(
    () => recipe?.runs.filter((run) => run.status === "completed") ?? [],
    [recipe]
  );

  const configuration = recipe?.variant.configuration ?? null;
  const runSteps = useMemo<RunPlanStep[]>(() => {
    if (activeRun?.snapshot?.steps) return activeRun.snapshot.steps;
    return (recipe?.variant.steps ?? []).map((step) => ({
      key: step.id,
      sourceStepId: step.id,
      stage: "cook",
      stageKey: step.stageKey,
      instruction: step.instruction
    }));
  }, [activeRun?.snapshot, recipe?.variant.steps]);

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

  async function openRecipe(slug: string) {
    setError(null);
    const detail = await requestJson<RecipeDetail>(`/api/recipes/${slug}`);
    setRecipe(detail);
    setSelections(defaultsFor(detail.variant.configuration));
    setActiveRun(null);
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
    if (!activeRun) return;
    const run = await requestJson<ActiveRun & { events: RunEvent[] }>(
      `/api/cook-runs/${activeRun.id}`
    );
    setActiveRun(run);
    setRunEvents(run.events);
  }

  async function saveEvent() {
    if (!activeRun || !eventText.trim()) return;
    const runStepKey = editingRunStepKey ?? currentRunStep?.key ?? null;
    if (!runStepKey) {
      setError("A Cook Run note must be tied to a run step.");
      return;
    }

    setError(null);

    try {
      if (editingEventId) {
        await requestJson(`/api/cook-runs/${activeRun.id}/events/${editingEventId}`, {
          method: "PATCH",
          body: JSON.stringify({
            eventType,
            text: eventText.trim(),
            runStepKey
          })
        });
      } else {
        await requestJson(`/api/cook-runs/${activeRun.id}/events`, {
          method: "POST",
          body: JSON.stringify({
            stepId: currentRunStep?.sourceStepId ?? null,
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
    if (!activeRun) return;
    setError(null);

    try {
      await requestJson(`/api/cook-runs/${activeRun.id}/events/${event.id}`, {
        method: "DELETE"
      });
      if (editingEventId === event.id) cancelEventEdit();
      setRunEvents((current) => current.filter((item) => item.id !== event.id));
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
                onClick={() => void moveStep(currentStepIndex + 1)}
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
                <strong>{formatDate(run.completedAt ?? run.startedAt)}</strong>
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
