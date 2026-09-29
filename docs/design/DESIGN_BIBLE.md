# Curadh Cooking — Design Bible

## 1. Product vision

Curadh Cooking is a practical cooking and recipe-discovery system that adapts recipes to a real person instead of forcing the person into a rigid diet identity.

The experience should help answer:

- What can I make with what I have?
- What result am I actually trying to get?
- How well does a recipe fit this person's current profile?
- Which ingredient causes a concern, and why?
- Can I substitute something that fits better?
- How long will this take?
- What equipment do I need?
- What should I do if the food behaves differently while I am cooking?
- What happened when I made it, and should that change the recipe?
- Where did this recipe or sensitivity rule come from?

The product should feel like a useful kitchen tool, not a lifestyle blog and not a medical oracle.

## 2. Core design principles

### Profile first, mapping second

Named approaches such as low-histamine, low-FODMAP, vegan, gluten-free, dairy-free, or POTS-oriented nutrition can seed defaults.

They do not define the person.

An explicit profile setting wins over a named mapping when they conflict.

### Adjustable strictness, not religious compliance

A user may want to follow a mapping closely, loosely, or only use it as a warning layer. The model must support exceptions without treating them as errors.

### Goal first

The product should begin with the outcome someone wants, not force them to browse taxonomy first.

A useful request may combine:

- what they want to make;
- the qualities they want from it;
- ingredients they have;
- ingredients they want to avoid;
- the profile they are cooking for;
- available tools;
- available time.

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

### Successful does not mean perfected

A recipe may be worth repeating and recommending even when one dimension can still improve.

Canonical means **current proven recipe**, not "no future changes allowed."

Improvements should protect dimensions that already work instead of reopening the entire formula without evidence.

### Food first

A recipe page should foreground:

1. title and useful result summary;
2. yield / scale;
3. total / active time;
4. ingredients with quantities;
5. tools;
6. method;
7. substitutions;
8. profile-fit notes;
9. known result evidence / tradeoffs;
10. nutrition when available/useful;
11. source / provenance.

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

### Recipe

A repeatable formula/instruction set someone can choose to make.

A Recipe includes:

- title;
- status/version;
- yield / scale;
- ingredients and quantities;
- tools/settings;
- ordered method;
- active/total time;
- temperature;
- substitutions;
- nutrition when available;
- source/provenance;
- profile-fit analysis;
- known result summary;
- known improvement opportunities.

### Variant

An intentional change to a Recipe or process used to test or target a different outcome.

A Variant does not replace the canonical Recipe merely because it exists.

### Cook Run

One actual execution of a Recipe or Variant.

A Cook Run may capture:

- who cooked it, when sharing/persistence supports that;
- selected recipe/variant;
- actual equipment/settings;
- substitutions;
- deviations;
- live adjustments;
- observations during cooking;
- final result evidence.

### Result evidence

Structured and freeform observations about one Cook Run.

Result markers may differ by recipe. Recipe 0001 demonstrated useful markers such as:

- moisture;
- flexibility;
- density/lightness;
- flavor;
- height/rise;
- crust;
- usefulness for the intended goal.

Incomplete evidence is still evidence. Historical attempts can preserve known observations without pretending their missing details are known.

### Recipe/Profile Fit

A derived explanation of how a recipe interacts with one profile.

It is not a permanent universal safety rating.

The explanation should be traceable to ingredient-level profile settings and/or mapping rules.

## 4. Recipe lifecycle

Initial recipe statuses:

- **Draft** — formula exists but has not been cooked/tested.
- **Tested** — at least one documented kitchen test has occurred.
- **Canonical** — approved as the current proven/recommended project version.

Canonical does not mean perfected. A canonical recipe may retain known improvement opportunities and may later be replaced by a better proven variant.

Cook Runs retain their own evidence even after the canonical Recipe changes.

## 5. Core experience journey

The first product experience is based on the actual Recipe 0001 journey.

### 1. Start with the goal

Ask what the person wants to make or accomplish.

Examples:

- sandwich bread;
- quick dinner;
- something soft and neutral;
- use these vegetables before they spoil.

Capture desired result qualities when they matter.

### 2. Combine the real constraints

Bring together, without forcing a strict order:

- ingredients on hand;
- ingredients excluded or unavailable;
- selected Profile / sensitivity preferences;
- available tools/equipment;
- available time;
- nutrition requirements when relevant.

### 3. Find or build a solution

Return useful candidate recipes or a bounded recipe proposal.

Explain:

- why it fits;
- conflicts/concerns;
- substitutions;
- what is known versus uncertain;
- expected result/tradeoffs.

### 4. Enter Cook Mode

Once cooking starts, browsing gives way to execution.

Cook Mode should know:

- the selected recipe/variant;
- current step/stage;
- ingredient quantities;
- tools/settings;
- selected profile;
- known result evidence;
- deviations already made during this run.

It should make the recipe easy to follow and make it easy to record when reality differs from the instructions.

### 5. Handle reality

A cook should be able to report observations such as:

- batter is thicker than expected;
- I selected the wrong machine setting;
- I substituted an ingredient;
- it rose and collapsed;
- the center still seems wet.

The system should use current recipe context, current run state, and known evidence to give bounded next-step guidance while recording the deviation/observation.

### 6. Evaluate the result

At completion, ask only for useful markers rather than demanding a diary.

Compare the result with the original goal.

### 7. Save the evidence

A Cook Run can strengthen confidence in the current Recipe, reveal a tradeoff, or motivate a Variant.

Do not silently rewrite the recipe from one person's run.

## 6. Navigation principle

The **journey is canonical before the final navigation labels are**.

Do not prematurely force the app into a conventional recipe-site sitemap.

The IA should make the following easy to reach:

- start/find something to cook;
- recipes;
- ingredients/pantry context;
- profiles;
- tools/kitchen context;
- active Cook Mode;
- result/history evidence.

Whether those become top-level tabs, contextual routes, or a mixture is a later interface decision.

## 7. Cook Mode and contextual intelligence

The product should support live cooking help. This is **not a pipe dream for MVP**, but the capability should be layered.

### MVP-safe core

The first Cook Mode can be useful without an open-ended AI system by supporting:

- step-by-step recipe state;
- timers/checkpoints;
- actual equipment/settings;
- structured deviations and substitutions;
- observation prompts;
- recipe-specific troubleshooting rules;
- known result evidence from prior Cook Runs;
- recording the resolution/outcome.

### Contextual reasoning layer

The data model should preserve enough context that a reasoning layer can later answer open-ended questions using:

- the current recipe;
- current step/stage;
- current run deviations;
- profile constraints;
- equipment;
- prior result evidence.

The reasoning layer must not invent medical guarantees or erase uncertainty.

Do not make external AI infrastructure a prerequisite for the first usable recipe library/cook flow, but do not design the model in a way that prevents this capability.

## 8. Recipe discovery

Discovery should support combinations of:

- dish/meal intent;
- desired result qualities;
- available ingredients;
- excluded ingredients;
- profile fit;
- time available;
- tools/equipment;
- nutritional constraints;
- desired substitutions.

External sources should be attributed and linked. Curadh Cooking should extract/normalize useful cooking facts rather than reproducing long source-page narrative.

## 9. MVP direction

The first usable product should grow from concrete recipes rather than an abstract taxonomy.

MVP capabilities should target:

- a personal recipe library;
- Recipe + Variant + Cook Run + Result evidence;
- a goal-first find/build flow;
- create/edit an individual profile;
- adjustable named mappings;
- explicit ingredient overrides;
- ingredient lookup;
- ingredients-on-hand context;
- tools/equipment context;
- explain recipe/profile fit;
- suggest substitutions;
- filter by ingredients, tools, and time;
- Cook Mode with structured live observations/deviations;
- recipe/result history;
- retain source/provenance.

External recipe search and a freeform reasoning assistant can be layered onto this core once the internal model/flow is proven.

## 10. Initial exclusions

Do not treat these as current MVP commitments:

- diagnosis or treatment recommendations;
- claims that a recipe is medically safe for a condition;
- public social-network features;
- public profile sharing;
- automatic meal plans;
- grocery purchasing;
- paid nutrition databases;
- large-scale scraping infrastructure;
- AI-generated medical interpretations.

Sharing recipe/result evidence with invited people is a possible future capability and does not require building a public social network.

## 11. Seed recipe: Recipe 0001

The first canonical recipe is **Oatmeal Sandwich Bread**.

The documented V3 run on 2026-09-28 hit the requested moisture, flexibility, density/lightness, and flavor goals and is worth repeating.

Known improvement opportunity:

- loaf height/scale was roughly half the height of earlier GF loaves.

That height result does not invalidate the successful recipe. Future variants should target height while protecting the successful eating-quality markers.

Recipe 0001 established the need for:

- goal qualities;
- ingredient inventory;
- equipment/settings;
- live observations;
- deviations;
- result markers;
- historical/incomplete evidence;
- variants;
- Cook Runs distinct from Recipes.
