import { useEffect, useMemo, useState } from "react";
import type { CookRunEventType, ResultOutcome } from "../shared/contracts";

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
};

type Step = {
  id: string;
  position: number;
  instruction: string;
  stageKey?: string | null;
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
  };
  resultMarkers: ResultMarker[];
  runs: RunHistory[];
};

type ActiveRun = {
  id: string;
  status: string;
  startedAt: string;
  currentStepId?: string | null;
};

type RunEvent = {
  id: string;
  stepId?: string | null;
  eventType: CookRunEventType;
  text: string;
  createdAt: string;
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init
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

export function App() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const [runEvents, setRunEvents] = useState<RunEvent[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [eventType, setEventType] = useState<CookRunEventType>("observation");
  const [eventText, setEventText] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [resultValues, setResultValues] = useState<Record<string, ResultOutcome>>({});
  const [resultNotes, setResultNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const currentStep = recipe?.variant.steps[currentStepIndex] ?? null;

  useEffect(() => {
    requestJson<RecipeSummary[]>("/api/recipes")
      .then(setRecipes)
      .catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)));
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

  async function openRecipe(slug: string) {
    setError(null);
    const detail = await requestJson<RecipeDetail>(`/api/recipes/${slug}`);
    setRecipe(detail);
    setActiveRun(null);
    setRunEvents([]);
    setCurrentStepIndex(0);
    setFinishing(false);
  }

  async function startCookRun() {
    if (!recipe) return;
    setError(null);

    const run = await requestJson<ActiveRun>("/api/cook-runs", {
      method: "POST",
      body: JSON.stringify({
        recipeId: recipe.id,
        variantId: recipe.variant.id
      })
    });

    setActiveRun(run);
    setRunEvents([]);
    setCurrentStepIndex(0);
    setFinishing(false);
  }

  async function moveStep(nextIndex: number) {
    if (!recipe || !activeRun) return;
    const bounded = Math.max(0, Math.min(recipe.variant.steps.length - 1, nextIndex));
    const step = recipe.variant.steps[bounded];

    await requestJson<{ ok: true }>(`/api/cook-runs/${activeRun.id}`, {
      method: "PATCH",
      body: JSON.stringify({ currentStepId: step.id })
    });

    setCurrentStepIndex(bounded);
    setActiveRun({ ...activeRun, currentStepId: step.id });
  }

  async function refreshRun() {
    if (!activeRun) return;
    const run = await requestJson<ActiveRun & { events: RunEvent[] }>(
      `/api/cook-runs/${activeRun.id}`
    );
    setActiveRun(run);
    setRunEvents(run.events);
  }

  async function addEvent() {
    if (!activeRun || !eventText.trim()) return;
    setError(null);

    await requestJson(`/api/cook-runs/${activeRun.id}/events`, {
      method: "POST",
      body: JSON.stringify({
        stepId: currentStep?.id ?? null,
        eventType,
        text: eventText.trim()
      })
    });

    setEventText("");
    await refreshRun();
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
    setRunEvents([]);
    setFinishing(false);
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
              <h2 id="recipe-library">Proven starting points</h2>
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

  if (activeRun) {
    return (
      <main className="shell cook-shell">
        <header className="compact-header">
          <button className="text-button" onClick={() => void openRecipe(recipe.slug)}>
            ← Recipe
          </button>
          <div>
            <p className="eyebrow">Cook Mode</p>
            <h1>{recipe.title}</h1>
          </div>
          <span className="run-badge">Run active</span>
        </header>

        {error && <p className="error" role="alert">{error}</p>}

        {!finishing ? (
          <>
            <section className="cook-stage" aria-labelledby="current-step">
              <p className="step-count">
                Step {currentStepIndex + 1} of {recipe.variant.steps.length}
                {currentStep?.stageKey ? ` · ${currentStep.stageKey}` : ""}
              </p>
              <h2 id="current-step">{currentStep?.instruction}</h2>

              <div className="step-actions">
                <button
                  className="secondary"
                  disabled={currentStepIndex === 0}
                  onClick={() => void moveStep(currentStepIndex - 1)}
                >
                  Previous
                </button>
                <button
                  disabled={currentStepIndex === recipe.variant.steps.length - 1}
                  onClick={() => void moveStep(currentStepIndex + 1)}
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

              <label>
                Type
                <select
                  value={eventType}
                  onChange={(event) => setEventType(event.target.value as CookRunEventType)}
                >
                  <option value="observation">Observation</option>
                  <option value="substitution">Substitution</option>
                  <option value="setting-change">Setting change</option>
                  <option value="intervention">Intervention</option>
                  <option value="note">Note</option>
                </select>
              </label>

              <label>
                Observation or change
                <textarea
                  value={eventText}
                  onChange={(event) => setEventText(event.target.value)}
                  placeholder="Example: The batter is thicker than the last time."
                  rows={3}
                />
              </label>

              <button onClick={() => void addEvent()} disabled={!eventText.trim()}>
                Record observation
              </button>

              {runEvents.length > 0 && (
                <div className="event-log" aria-label="Cook Run observations">
                  <h3>Run notes</h3>
                  {runEvents.map((event) => (
                    <article key={event.id}>
                      <span>{event.eventType}</span>
                      <p>{event.text}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <button className="finish-button" onClick={() => setFinishing(true)}>
              Finish Cook Run
            </button>
          </>
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

  return (
    <main className="shell">
      <header className="compact-header">
        <button className="text-button" onClick={goHome}>← Recipes</button>
        <div>
          <p className="eyebrow">Canonical recipe</p>
          <h1>{recipe.title}</h1>
        </div>
        <span className="status">{recipe.status}</span>
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      <section className="recipe-intro">
        <p>{recipe.summary}</p>
        <div className="result-summary">
          <strong>What we know works</strong>
          <p>{recipe.knownResultSummary}</p>
        </div>
        {recipe.knownImprovement && (
          <div className="improvement">
            <strong>Worth improving</strong>
            <p>{recipe.knownImprovement}</p>
          </div>
        )}
        <button className="primary-large" onClick={() => void startCookRun()}>
          Start Cook Run
        </button>
      </section>

      <div className="recipe-columns">
        <section className="panel" aria-labelledby="ingredients">
          <p className="eyebrow">Formula</p>
          <h2 id="ingredients">Ingredients</h2>
          <ul className="ingredient-list">
            {recipe.variant.ingredients.map((ingredient) => (
              <li key={ingredient.id}>
                <strong>{ingredient.quantity}</strong>
                <span>
                  {ingredient.name}
                  {ingredient.form ? `, ${ingredient.form}` : ""}
                  {ingredient.optional ? " — optional finish" : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel" aria-labelledby="settings">
          <p className="eyebrow">Proven setup</p>
          <h2 id="settings">Kitchen settings</h2>
          <dl className="settings-list">
            {recipe.variant.equipmentSettings.map((setting) => (
              <div key={setting.settingKey}>
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
      </section>

      <section className="panel" aria-labelledby="history">
        <p className="eyebrow">Evidence, not folklore</p>
        <h2 id="history">Recent Cook Runs</h2>
        {completedRuns.length === 0 ? (
          <p>No app-recorded Cook Runs yet. Recipe 0001's original V3 evidence is preserved in the project record.</p>
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
