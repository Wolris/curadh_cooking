DROP INDEX IF EXISTS idx_cook_run_events_run;

ALTER TABLE cook_run_events RENAME TO cook_run_events_old;

CREATE TABLE cook_run_events (
  id TEXT PRIMARY KEY,
  cook_run_id TEXT NOT NULL REFERENCES cook_runs(id) ON DELETE CASCADE,
  step_id TEXT REFERENCES recipe_steps(id),
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'observation',
      'substitution',
      'ingredient-skip',
      'ingredient-add',
      'amount-change',
      'setting-change',
      'intervention',
      'note'
    )
  ),
  text TEXT NOT NULL,
  structured_data_json TEXT,
  created_at TEXT NOT NULL
);

INSERT INTO cook_run_events (
  id,
  cook_run_id,
  step_id,
  event_type,
  text,
  structured_data_json,
  created_at
)
SELECT
  id,
  cook_run_id,
  step_id,
  event_type,
  text,
  structured_data_json,
  created_at
FROM cook_run_events_old;

DROP TABLE cook_run_events_old;

CREATE INDEX idx_cook_run_events_run
  ON cook_run_events(cook_run_id, created_at);
