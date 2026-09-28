# Curadh Cooking — Design Bible

## 1. Product vision

Curadh Cooking is a practical cooking and recipe-discovery system that adapts recipes to a real person instead of forcing the person into a rigid diet identity.

The experience should help answer:

- What can I make with what I have?
- How well does a recipe fit this person's current profile?
- Which ingredient causes a concern, and why?
- Can I substitute something that fits better?
- How long will this take?
- What equipment do I need?
- What nutritional information matters?
- Where did this recipe or sensitivity rule come from?

The product should feel like a useful kitchen tool, not a lifestyle blog and not a medical oracle.

## 2. Core design principles

### Profile first, mapping second

Named approaches such as low-histamine, low-FODMAP, vegan, gluten-free, dairy-free, or POTS-oriented nutrition can seed defaults.

They do not define the person.

An explicit profile setting wins over a named mapping when they conflict.

### Adjustable strictness, not religious compliance

A user may want to follow a mapping closely, loosely, or only use it as a warning layer. The model must support exceptions without treating them as errors.

### Explain ingredient-level fit

Do not hide decisions behind one unexplained recipe score.

A useful result can say, in product terms:

- this ingredient matches the profile;
- this ingredient is a soft concern from a selected mapping;
- this ingredient is explicitly accepted by this profile;
- this ingredient is explicitly avoided;
- this ingredient is unknown or evidence is uncertain;
- this substitution may fit better.

### Context can matter

The ingredient model must leave room for context such as:

- amount;
- preparation method;
- fresh versus stored/processed form;
- brand or packaged form;
- substitution;
- user-specific notes.

Do not force every rule into a context-free yes/no ingredient tag.

### Food first

A recipe page should foreground:

1. title and yield;
2. total / active time;
3. ingredients with quantities;
4. tools;
5. method;
6. substitutions;
7. profile-fit notes;
8. nutrition when available/useful;
9. source / provenance.

Personal essays, SEO filler, and unrelated narrative are not part of the Curadh Cooking recipe format.

## 3. Core product objects

### Profile

Represents one person's cooking-related configuration without requiring a diagnosis.

Expected dimensions:

- named mappings enabled;
- mapping strictness or advisory level;
- explicit ingredient overrides;
- hard avoids;
- soft concerns;
- accepted exceptions;
- preferences/dislikes;
- nutrition targets or considerations;
- notes that are private to that profile.

Repository fixtures must use synthetic profiles only.

### Mapping

A named set of defaults or advisories such as low-histamine, low-FODMAP, vegan, gluten-free, or another dietary/sensitivity framework.

A mapping should retain:

- name;
- version/date where useful;
- source/provenance;
- rule or ingredient association;
- confidence/uncertainty when known;
- optional context/quantity notes.

Mappings do not outrank explicit profile settings.

### Ingredient

A canonical food/ingredient identity with aliases and room for structured context.

Potential properties include:

- canonical name;
- aliases;
- category;
- common forms;
- nutrition reference;
- mapping associations;
- substitution relationships;
- storage/preparation notes;
- source provenance.

Do not prematurely lock the full schema before Recipe 0001 pressure-tests it.

### Recipe

A recipe is structured cooking information:

- title;
- status/version;
- yield;
- ingredients and quantities;
- tools;
- ordered method;
- active/total time;
- temperature;
- substitutions;
- nutrition;
- source/provenance;
- profile-fit analysis;
- testing notes.

### Recipe/Profile Fit

A derived explanation of how a recipe interacts with one profile.

It is not a permanent universal safety rating.

The explanation should be traceable to ingredient-level profile settings and/or mapping rules.

## 4. Recipe lifecycle

Initial recipe statuses:

- **Draft** — formula exists but has not been cooked/tested.
- **Tested** — at least one documented kitchen test has occurred.
- **Canonical** — Jim has approved the recipe as the current household/project version.

A canonical recipe may still gain later revisions. Preserve meaningful test notes rather than pretending the first success is final truth.

## 5. Recipe discovery

The eventual discovery flow should support combinations of:

- dish/meal intent;
- available ingredients;
- excluded ingredients;
- profile fit;
- time available;
- tools/equipment;
- nutritional constraints;
- desired substitutions.

External sources should be attributed and linked. Curadh Cooking should extract/normalize useful cooking facts rather than reproducing long source-page narrative.

## 6. MVP direction

The first usable product should grow from concrete recipes rather than an abstract taxonomy.

Likely MVP capabilities:

- create/edit an individual profile;
- enable named mappings as adjustable defaults;
- add explicit ingredient overrides;
- maintain a personal recipe library;
- ingredient lookup;
- explain recipe/profile fit;
- suggest substitutions;
- filter by ingredients, tools, and time;
- find external recipes and normalize the useful facts;
- retain source/provenance.

The exact app architecture and implementation stack are intentionally not locked during the Recipe 0001 discovery gate.

## 7. Initial exclusions

Do not treat these as current MVP commitments:

- diagnosis or treatment recommendations;
- claims that a recipe is medically safe for a condition;
- public social/community features;
- public profile sharing;
- automatic meal plans;
- grocery purchasing;
- paid nutrition databases;
- large-scale scraping infrastructure;
- AI-generated medical interpretations.

## 8. Seed recipe: Recipe 0001

The first canonical recipe will be a reconstructed wheat-free bread based on Jim's remembered concept, including arrowroot, flaxseed, eggs, honey, and other wheat-free flour(s).

Its job is larger than producing one loaf: it will expose what the recipe model actually needs for quantities, ingredient forms, substitutions, tools, timing, observations, and profile-fit notes.

Do not finalize Recipe 0001 until Jim supplies the desired bread characteristics and current ingredient inventory, then cooks/tests an agreed draft.
