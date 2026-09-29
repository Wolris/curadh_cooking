import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export type CuradhDb = InstanceType<typeof Database>;

const now = () => new Date().toISOString();

function runMigrations(db: CuradhDb) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const migrationDir = path.resolve("migrations");
  const migrationFiles = fs
    .readdirSync(migrationDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  const hasMigration = db.prepare(
    "SELECT 1 FROM schema_migrations WHERE name = ?"
  );
  const recordMigration = db.prepare(
    "INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)"
  );

  for (const name of migrationFiles) {
    if (hasMigration.get(name)) continue;
    const sql = fs.readFileSync(path.join(migrationDir, name), "utf8");
    db.transaction(() => {
      db.exec(sql);
      recordMigration.run(name, now());
    })();
  }
}

function seedRecipe0001(db: CuradhDb) {
  const existing = db.prepare("SELECT 1 FROM recipes WHERE id = ?").get("recipe-0001");
  if (existing) return;

  const createdAt = now();

  db.transaction(() => {
    db.prepare(`
      INSERT INTO recipes (
        id, slug, title, status, summary, known_result_summary,
        known_improvement, canonical_variant_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "recipe-0001",
      "oatmeal-sandwich-bread",
      "Oatmeal Sandwich Bread",
      "canonical",
      "A wheat-free Breadman sandwich loaf built around oat flour, arrowroot, cassava, cornstarch, flax, eggs, and yeast.",
      "The documented V3 bake hit moisture, flexibility, density/lightness, flavor, sandwich-use, and crust goals.",
      "Loaf height was roughly half the height of earlier GF loaves; improve scale without sacrificing the successful eating qualities.",
      "recipe-0001-v3",
      createdAt,
      createdAt
    );

    db.prepare(`
      INSERT INTO recipe_variants (id, recipe_id, label, status, yield_text, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      "recipe-0001-v3",
      "recipe-0001",
      "V3 — first fully documented success",
      "canonical",
      "1 Breadman loaf",
      "Proven on White / Light / 1.5 lb.",
      createdAt
    );

    const ingredients = [
      ["oat-flour", "Oat flour", "Finely ground; rolled oats may be blended first."],
      ["arrowroot", "Arrowroot starch/flour", null],
      ["cassava-flour", "Cassava flour", null],
      ["cornstarch", "Cornstarch", null],
      ["flax-meal", "Ground flaxseed meal", null],
      ["baking-powder", "Baking powder", null],
      ["salt", "Fine salt", null],
      ["active-dry-yeast", "Active dry yeast", null],
      ["eggs", "Large eggs", null],
      ["milk", "Milk", null],
      ["honey", "Honey", null],
      ["olive-oil", "Olive oil", null],
      ["apple-cider-vinegar", "Apple cider vinegar", null],
      ["butter", "Butter", "Optional but strongly recommended soft-crust finish."]
    ] as const;

    const insertIngredient = db.prepare(
      "INSERT INTO ingredients (id, canonical_name, notes) VALUES (?, ?, ?)"
    );
    for (const ingredient of ingredients) insertIngredient.run(...ingredient);

    const variantIngredients = [
      ["oat-flour", "1 cup", "finely ground", 1, 0],
      ["arrowroot", "3/4 cup", null, 2, 0],
      ["cassava-flour", "1/2 cup", null, 3, 0],
      ["cornstarch", "6 Tbsp", null, 4, 0],
      ["flax-meal", "3 Tbsp", null, 5, 0],
      ["baking-powder", "1 tsp", null, 6, 0],
      ["salt", "1 tsp", null, 7, 0],
      ["active-dry-yeast", "2 tsp", null, 8, 0],
      ["eggs", "2", null, 9, 0],
      ["milk", "3/4 cup + 2 Tbsp", null, 10, 0],
      ["honey", "1 Tbsp + 1 tsp", null, 11, 0],
      ["olive-oil", "2 Tbsp", null, 12, 0],
      ["apple-cider-vinegar", "2 tsp", null, 13, 0],
      ["butter", "about 2 Tbsp", "soft-crust finish", 14, 1]
    ] as const;

    const insertVariantIngredient = db.prepare(`
      INSERT INTO variant_ingredients (
        variant_id, ingredient_id, quantity_text, form_text, position, optional
      ) VALUES ('recipe-0001-v3', ?, ?, ?, ?, ?)
    `);
    for (const ingredient of variantIngredients) insertVariantIngredient.run(...ingredient);

    const steps = [
      "Bring the eggs and milk reasonably close to room temperature.",
      "Add milk, eggs, honey, olive oil, and apple cider vinegar to the Breadman pan.",
      "Whisk oat flour, arrowroot, cassava, cornstarch, flax, baking powder, and salt together thoroughly.",
      "Add the dry blend over the wet ingredients.",
      "Add active dry yeast according to the Breadman's normal yeast-loading convention.",
      "Select White / Light / 1.5 lb and start the machine.",
      "During initial mixing, scrape the sides and corners if needed so no dry pockets remain.",
      "At the first rest, remove the mixer blade and gently smooth the batter with a rubber spatula.",
      "Leave the blade out; allow later machine spin/punch/rest behavior to occur without the blade.",
      "Let the Breadman complete the remaining rise and bake cycle without supplemental oven heat.",
      "Remove the loaf from the Breadman pan after baking.",
      "For the proven soft-crust finish, melt about 2 Tbsp butter gently and coat all six sides of the warm loaf.",
      "Cool in normal loaf orientation on a wire rack until completely cool before slicing."
    ];

    const insertStep = db.prepare(`
      INSERT INTO recipe_steps (id, variant_id, position, instruction, stage_key)
      VALUES (?, 'recipe-0001-v3', ?, ?, ?)
    `);
    steps.forEach((instruction, index) => {
      const position = index + 1;
      insertStep.run(
        `recipe-0001-v3-step-${position}`,
        position,
        instruction,
        position <= 7 ? "mix" : position <= 10 ? "rise-bake" : "finish"
      );
    });

    db.prepare("INSERT INTO equipment (id, name) VALUES (?, ?)").run(
      "breadman",
      "Breadman bread machine"
    );

    const insertSetting = db.prepare(`
      INSERT INTO variant_equipment_settings (
        variant_id, equipment_id, setting_key, setting_value
      ) VALUES ('recipe-0001-v3', 'breadman', ?, ?)
    `);
    [
      ["Program", "White"],
      ["Crust", "Light"],
      ["Loaf size", "1.5 lb"]
    ].forEach((setting) => insertSetting.run(...setting));

    const markers = [
      ["moisture", "Moisture", "Soft but not gummy; target leans slightly dry."],
      ["flexibility", "Flexibility", "A sandwich slice holds together and bends rather than crumbling."],
      ["density-lightness", "Density / lightness", "Light enough for sandwich use without returning to the dense earlier GF loaves."],
      ["flavor", "Flavor", "Neutral/savory and enjoyable."],
      ["height-rise", "Height / rise", "Loaf scale and rise; V3 succeeded overall but this marker remains improvable."],
      ["crust", "Crust", "Soft enough for the household while still structurally sound."],
      ["sandwich-use", "Sandwich use", "Slices and handles successfully as sandwich/toast bread."]
    ] as const;

    const insertMarker = db.prepare(`
      INSERT INTO result_markers (id, recipe_id, marker_key, label, description, position)
      VALUES (?, 'recipe-0001', ?, ?, ?, ?)
    `);
    markers.forEach((marker, index) =>
      insertMarker.run(`recipe-0001-marker-${marker[0]}`, marker[0], marker[1], marker[2], index + 1)
    );
  })();
}

export function openDatabase(dbPath = process.env.CURADH_DB_PATH ?? path.resolve("data/curadh-cooking.sqlite")) {
  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  runMigrations(db);
  seedRecipe0001(db);
  return db;
}
