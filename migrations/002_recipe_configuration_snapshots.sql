ALTER TABLE recipe_variants ADD COLUMN configuration_json TEXT;
ALTER TABLE cook_runs ADD COLUMN configuration_snapshot_json TEXT;
ALTER TABLE cook_runs ADD COLUMN current_step_key TEXT;
