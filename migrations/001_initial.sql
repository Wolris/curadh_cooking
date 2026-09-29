CREATE TABLE recipes (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'tested', 'canonical')),
  summary TEXT NOT NULL,
  known_result_summary TEXT NOT NULL,
  known_improvement TEXT,
  canonical_variant_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE recipe_variants (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  status TEXT NOT NULL,
  yield_text TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE ingredients (
  id TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL UNIQUE,
  notes TEXT
);

CREATE TABLE variant_ingredients (
  variant_id TEXT NOT NULL REFERENCES recipe_variants(id) ON DELETE CASCADE,
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id),
  quantity_text TEXT NOT NULL,
  form_text TEXT,
  position INTEGER NOT NULL,
  optional INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (variant_id, ingredient_id)
);

CREATE TABLE recipe_steps (
  id TEXT PRIMARY KEY,
  variant_id TEXT NOT NULL REFERENCES recipe_variants(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  stage_key TEXT
);

CREATE TABLE equipment (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE variant_equipment_settings (
  variant_id TEXT NOT NULL REFERENCES recipe_variants(id) ON DELETE CASCADE,
  equipment_id TEXT NOT NULL REFERENCES equipment(id),
  setting_key TEXT NOT NULL,
  setting_value TEXT NOT NULL,
  PRIMARY KEY (variant_id, equipment_id, setting_key)
);

CREATE TABLE result_markers (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  marker_key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  UNIQUE (recipe_id, marker_key)
);

CREATE TABLE cook_runs (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id),
  variant_id TEXT NOT NULL REFERENCES recipe_variants(id),
  profile_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'abandoned')),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  current_step_id TEXT REFERENCES recipe_steps(id),
  notes TEXT
);

CREATE TABLE cook_run_events (
  id TEXT PRIMARY KEY,
  cook_run_id TEXT NOT NULL REFERENCES cook_runs(id) ON DELETE CASCADE,
  step_id TEXT REFERENCES recipe_steps(id),
  event_type TEXT NOT NULL CHECK (
    event_type IN ('observation', 'substitution', 'setting-change', 'intervention', 'note')
  ),
  text TEXT NOT NULL,
  structured_data_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE cook_run_results (
  cook_run_id TEXT NOT NULL REFERENCES cook_runs(id) ON DELETE CASCADE,
  result_marker_id TEXT NOT NULL REFERENCES result_markers(id),
  outcome TEXT NOT NULL CHECK (outcome IN ('hit', 'mixed', 'miss', 'not-observed')),
  note TEXT,
  PRIMARY KEY (cook_run_id, result_marker_id)
);

CREATE INDEX idx_recipe_variants_recipe ON recipe_variants(recipe_id);
CREATE INDEX idx_recipe_steps_variant ON recipe_steps(variant_id, position);
CREATE INDEX idx_cook_runs_recipe ON cook_runs(recipe_id, started_at DESC);
CREATE INDEX idx_cook_run_events_run ON cook_run_events(cook_run_id, created_at);
