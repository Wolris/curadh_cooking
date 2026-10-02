import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export type CuradhDb = InstanceType<typeof Database>;

const now = () => new Date().toISOString();

const recipe0002Configuration = {
  version: 1,
  choices: [
    {
      key: "yellow-onion.include",
      kind: "toggle",
      label: "Yellow onion",
      ingredientId: "yellow-onion",
      defaultValue: true,
      advisory: "Be aware of tolerance: this ingredient may work differently for different profiles. Omit or substitute it when it does not fit the selected profile."
    },
    {
      key: "celery.include",
      kind: "toggle",
      label: "Celery",
      ingredientId: "celery",
      defaultValue: true,
      advisory: "Be aware of tolerance: this ingredient may work differently for different profiles. Omit or substitute it when it does not fit the selected profile."
    },
    {
      key: "parsley.include",
      kind: "toggle",
      label: "Parsley",
      ingredientId: "parsley",
      defaultValue: true,
      advisory: "Be aware of tolerance: this ingredient may work differently for different profiles. Omit or substitute it when it does not fit the selected profile."
    },
    {
      key: "parsley.form",
      kind: "select",
      label: "Parsley form",
      ingredientId: "parsley",
      defaultValue: "fresh",
      options: [
        {
          value: "fresh",
          label: "Fresh parsley",
          quantity: "8 to 10 sprigs",
          form: null
        },
        {
          value: "prepared",
          label: "Prepared / pre-chopped parsley",
          quantity: "2 tsp",
          form: "prepared or pre-chopped",
          estimate: true,
          estimateNote: "Unverified recipe estimate: about 2 tsp prepared parsley for the fresh sprigs used here. Actual volume varies with sprig size, chop, and packing.",
          advisory: "Be aware of tolerance: if using a commercial prepared product, check its ingredient list, sodium, additives, and freshness against the selected profile."
        }
      ]
    },
    {
      key: "carrots.peel",
      kind: "toggle",
      label: "Peel carrots",
      ingredientId: "carrots",
      defaultValue: true
    },
    {
      key: "carrots.prep",
      kind: "select",
      label: "Carrot prep method",
      ingredientId: "carrots",
      defaultValue: "cuisinart",
      options: [
        {
          value: "cuisinart",
          label: "Cuisinart / food processor",
          activeMinutes: 2
        },
        {
          value: "knife",
          label: "Knife",
          activeMinutes: 5
        }
      ]
    }
  ]
};

function ensureRecipe0002Configuration(db: CuradhDb) {
  db.prepare(`
    UPDATE recipe_variants
    SET configuration_json = ?
    WHERE id = 'recipe-0002-v1'
  `).run(JSON.stringify(recipe0002Configuration));
}


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


function seedRecipe0002(db: CuradhDb) {
  const existing = db.prepare("SELECT 1 FROM recipes WHERE id = ?").get("recipe-0002");
  if (existing) return;

  const createdAt = now();

  db.transaction(() => {
    db.prepare(`
      INSERT INTO recipes (
        id, slug, title, status, summary, known_result_summary,
        known_improvement, canonical_variant_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "recipe-0002",
      "homemade-chicken-soup",
      "Homemade Chicken Soup",
      "draft",
      "A simple chicken-and-carrot soup adapted from the source recipe for an Instant Pot, with the cooked carrots pureed in a Cuisinart and returned to the broth.",
      "The source method is established, but this Instant Pot + Cuisinart adaptation has not yet been validated in the Curadh Cooking kitchen.",
      "First Cook Run should validate broth strength, carrot-puree body, salt balance, aromatic balance, and actual profile fit.",
      "recipe-0002-v1",
      createdAt,
      createdAt
    );

    db.prepare(`
      INSERT INTO recipe_variants (id, recipe_id, label, status, yield_text, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      "recipe-0002-v1",
      "recipe-0002",
      "V1 — Instant Pot + Cuisinart adaptation",
      "draft",
      "About 6 bowls",
      "POTS: soup can be a useful fluid/sodium vehicle, but salt should follow the selected profile or clinician target. MCAS: do not apply a universal avoid list; omit individual triggers, use fresh ingredients, and chill leftovers promptly. Pressure cooking is not treated as a way to destroy pre-existing histamine.",
      createdAt
    );

    const ingredients = [
      ["bone-in-chicken-parts", "Bone-in chicken thighs and/or drumsticks", "Legs and thighs are preferred for broth flavor."],
      ["carrots", "Carrots", null],
      ["yellow-onion", "Yellow onion", null],
      ["celery", "Celery", null],
      ["parsley", "Parsley", null]
    ] as const;

    const insertIngredient = db.prepare(
      "INSERT OR IGNORE INTO ingredients (id, canonical_name, notes) VALUES (?, ?, ?)"
    );
    for (const ingredient of ingredients) insertIngredient.run(...ingredient);

    const variantIngredients = [
      ["bone-in-chicken-parts", "2 1/2 to 3 lb", "bone-in thighs and/or drumsticks", 1, 0],
      ["carrots", "6 to 8 medium", "peeled; cut in large pieces", 2, 0],
      ["yellow-onion", "1 large", "quartered", 3, 1],
      ["celery", "2 to 3 stalks", "cut in half", 4, 1],
      ["parsley", "8 to 10 sprigs", null, 5, 1],
      ["salt", "2 tsp to start", "fine salt; adjust after cooking", 6, 0]
    ] as const;

    const insertVariantIngredient = db.prepare(`
      INSERT INTO variant_ingredients (
        variant_id, ingredient_id, quantity_text, form_text, position, optional
      ) VALUES ('recipe-0002-v1', ?, ?, ?, ?, ?)
    `);
    for (const ingredient of variantIngredients) insertVariantIngredient.run(...ingredient);

    const steps = [
      "Put the chicken, carrots, onion, celery, parsley, and 2 tsp salt into the Instant Pot.",
      "Add 4 to 6 cups cold water, using only enough to nearly cover the ingredients without crossing the pressure-cook fill limit for your Instant Pot.",
      "Lock the lid and cook on High Pressure for 20 minutes.",
      "When the cook ends, allow 15 minutes of natural pressure release, then carefully release the remaining pressure.",
      "Check the thickest chicken piece with an instant-read thermometer; poultry must reach at least 165°F / 74°C before serving.",
      "Lift out the chicken and set it aside.",
      "Strain the broth into a large bowl or second pot. Keep the cooked carrots; discard the spent onion, celery, and parsley unless you intentionally want to retain them.",
      "Skim excess surface fat if desired.",
      "Puree the cooked carrots in the Cuisinart with 1 cup of strained broth until smooth. Add another 1/2 to 1 cup broth only if needed to make the puree move cleanly.",
      "Stir the carrot puree back into the remaining broth.",
      "Remove bones, skin, and cartilage from the chicken, then return as much shredded chicken to the soup as desired.",
      "Taste and adjust salt. Follow the selected profile or clinician-set sodium target rather than treating one salt amount as universally correct for POTS.",
      "Serve hot. Refrigerate or freeze leftovers promptly; use shallow containers for faster cooling."
    ];

    const insertStep = db.prepare(`
      INSERT INTO recipe_steps (id, variant_id, position, instruction, stage_key)
      VALUES (?, 'recipe-0002-v1', ?, ?, ?)
    `);
    steps.forEach((instruction, index) => {
      const position = index + 1;
      insertStep.run(
        `recipe-0002-v1-step-${position}`,
        position,
        instruction,
        position <= 5 ? "pressure-cook" : position <= 10 ? "strain-puree" : "finish"
      );
    });

    const insertEquipment = db.prepare(
      "INSERT OR IGNORE INTO equipment (id, name) VALUES (?, ?)"
    );
    insertEquipment.run("instant-pot", "Instant Pot pressure cooker");
    insertEquipment.run("cuisinart", "Cuisinart blender / food processor");
    insertEquipment.run("instant-read-thermometer", "Instant-read food thermometer");

    const insertSetting = db.prepare(`
      INSERT INTO variant_equipment_settings (
        variant_id, equipment_id, setting_key, setting_value
      ) VALUES ('recipe-0002-v1', ?, ?, ?)
    `);
    [
      ["instant-pot", "Program", "Pressure Cook / Manual"],
      ["instant-pot", "Pressure", "High"],
      ["instant-pot", "Cook time", "20 minutes"],
      ["instant-pot", "Release", "15 minutes natural, then vent remaining pressure"],
      ["cuisinart", "Carrot puree", "Start with 1 cup broth; add more only as needed"],
      ["instant-read-thermometer", "Chicken minimum", "165°F / 74°C"]
    ].forEach((setting) => insertSetting.run(...setting));

    const markers = [
      ["broth-flavor", "Broth flavor", "Chicken-forward and savory rather than watery."],
      ["carrot-body", "Carrot body / texture", "Lightly velvety body without becoming a carrot puree soup."],
      ["chicken-tenderness", "Chicken tenderness", "Tender and easy to pull from the bone."],
      ["salt-balance", "Salt balance", "Pleasant at the table and adjustable to the selected profile."],
      ["aromatic-balance", "Aromatic balance", "Onion, celery, and parsley support rather than dominate the broth."],
      ["soup-usefulness", "Overall soup usefulness", "Worth repeating as a practical meal / broth base."]
    ] as const;

    const insertMarker = db.prepare(`
      INSERT INTO result_markers (id, recipe_id, marker_key, label, description, position)
      VALUES (?, 'recipe-0002', ?, ?, ?, ?)
    `);
    markers.forEach((marker, index) =>
      insertMarker.run(`recipe-0002-marker-${marker[0]}`, marker[0], marker[1], marker[2], index + 1)
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
  seedRecipe0002(db);
  ensureRecipe0002Configuration(db);
  return db;
}
