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

### Draft-first site workflow

A new or materially adapted recipe should enter the site as **Draft** before kitchen validation.

Draft is not a hidden authoring state. A Draft recipe should be fully viewable and cookable through the normal recipe-detail and Cook Mode flow so the site itself can be used to verify that the recipe tells the complete cooking story:

1. save the proposed formula/method as Draft;
2. review the Draft in the site for missing quantities, tools, settings, sequence, cues, profile notes, and validation targets;
3. start a Cook Run from that Draft;
4. record deviations/observations while cooking;
5. complete the planned result markers;
6. promote to **Tested** only after an actual documented kitchen run;
7. promote to **Canonical** only when Jim explicitly approves it as the current proven/recommended version.

A successful Cook Run does not silently promote status. Status changes are explicit lifecycle decisions.

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


## 12. Recipe configuration, prep, and Cook Run snapshots

Recipe 0002 site-story review established that a recipe cannot be treated as one static ingredient list followed by one static sequence of cooking steps. The reusable Recipe should expose intentional configuration choices before cooking, and a Cook Run should preserve the exact choices used for that execution.

### Recipe configuration before cooking

The recipe detail view should support structured choices within the ingredient experience without turning every ingredient into a separate workflow.

An ingredient row may expose:

- **include / omit** when the recipe explicitly allows omission or has a supported omission path;
- **form / preparation choice** when the recipe supports equivalent practical forms, such as a fresh/raw form versus a pre-chopped, dried, prepared, or packaged form;
- **quantity / form guidance** appropriate to the selected form;
- **profile / tolerance advisory** explaining why a person may prefer to omit, substitute, or inspect a packaged ingredient.

These are related controls in one ingredient system, but they are not the same decision. Omitting an ingredient is different from selecting a different supported form.

Alternative forms and conversions are authored recipe knowledge, not universal automatic conversions. A recipe may explicitly support a relationship such as fresh parsley versus a measured prepared form, but the product should not assume that every sprig, clove, stalk, bunch, or package has one universal volume conversion.

### Profile-aware advisories, not medical alarms

Ingredient advisories should remain calm, local, and actionable.

For sensitivity-oriented guidance:

- do not label an ingredient universally safe or unsafe for POTS, MCAS, or another condition;
- explain that a person may omit or substitute an ingredient when their own profile calls for it;
- when switching to a packaged/commercial form, surface a small advisory when ingredients, sodium, additives, freshness, or processing may matter to the selected profile;
- allow explicit profile-level acceptance to remain authoritative over a generic mapping advisory.

Warnings are meant to support a cooking choice, not frighten the cook or imply diagnosis.

### Prep is part of the recipe and part of the run

A Cook Run begins with **Prep**, not with the first heating/cooking instruction.

Prep may include:

- washing;
- peeling;
- trimming;
- chopping;
- measuring;
- opening/draining;
- assembling equipment;
- other recipe-specific preparation.

Optional prep operations may be toggled off when the recipe explicitly supports doing so. Disabled prep operations should disappear from the generated Cook Run rather than remain as irrelevant instructions.

### Equipment/method choices affect prep and time

Available equipment is a first-class constraint.

A recipe may offer more than one supported preparation method for the same ingredient, for example:

- food processor / Cuisinart;
- knife;
- peeler;
- blender;
- Instant Pot versus conventional pot where the recipe supports both.

The selected method may change:

- the generated prep instruction;
- active prep time;
- the displayed estimated recipe time;
- the tools shown for the run.

A future Kitchen Profile may supply defaults such as owned equipment, but recipe-level configuration must remain overrideable.

### Start Cook Run freezes a snapshot

**Recipe configuration → Start Cook Run snapshot → Run observations** is the canonical execution model.

When the user selects **Start Cook Run**, the system must preserve the recipe configuration used for that run, including relevant:

- included/omitted ingredients;
- selected ingredient forms;
- selected preparation methods;
- enabled/disabled optional prep operations;
- planned equipment/settings;
- generated prep/cook sequence;
- planned time assumptions.

Subsequent changes to the reusable Recipe must not retroactively alter an in-progress or completed Cook Run.

Changes made after the run starts are recorded as Cook Run evidence rather than silently mutating the Recipe snapshot.

### Prep-first Cook Mode

The generated Cook Run should lead the cook through all required Prep stages before the first cook/heating stage unless the recipe explicitly defines an interleaved workflow.

Cook Mode should communicate stage and position, for example:

- Prep 2 of 6;
- Cook 1 of 7.

The cook must be able to move backward or forward through the run without losing the current run state.

### Recipe remains reachable during an active run

An active Cook Run must not trap the user in one instruction.

The cook should be able to:

- view the complete recipe;
- inspect the configured ingredient list;
- review previous or upcoming steps;
- return to the same active run position.

Leaving Cook Mode to inspect the Recipe does not end or reset the run. The UI should provide a persistent and obvious **Return to Cooking Run** path while a run is active.

### Record reality during the run

During Cook Mode, the user should be able to record structured changes such as:

- added an ingredient;
- substituted an ingredient;
- skipped an ingredient;
- changed an amount;
- changed a setting or preparation method;
- recorded a freeform observation.

For example, replacing one yellow onion with half a white onion plus half a red onion belongs to the Cook Run evidence. It does not automatically rewrite the reusable Recipe.

At review/completion, the product may surface these deviations as candidates for a future recipe revision or Variant, but promotion remains an explicit decision.

### Visual icon layer

Simple icons for common tools/actions/ingredients are an accepted future interface layer, including examples such as knife, peeler, food processor/Cuisinart, Instant Pot, conventional pot, boiling water, and frequently used ingredients.

Icons reinforce scanability; they do not replace text instructions or become a dependency for the underlying structured model.


## 13. Configurable Recipe / Cook Run interaction model

The structured product model is now sufficiently defined to support focused interaction design before additional UI development.

The supporting task flow, state matrix, low-fidelity screen/state map, risks, and owner-review questions live in `docs/design/COOK_RUN_UX_DEFINITION.md`.

### Canonical state model

The interface must keep these three states conceptually distinct:

1. **Recipe default** — the reusable authored recipe and its supported choices.
2. **Run plan** — the frozen configured snapshot created when Start Cook Run is selected.
3. **Run reality** — deviations and observations recorded after cooking begins.

Before Start Cook Run, supported choices configure the intended run. After Start Cook Run, changes are recorded as run evidence rather than silently changing the frozen plan or reusable Recipe.

### Interaction hierarchy

Recipe configuration should feel like part of reading the recipe, not a separate settings form.

- Controls live beside the ingredient or preparation decision they affect.
- Only meaningful authored choices receive controls.
- The visible ingredient presentation updates to reflect selected form, quantity, inclusion state, and relevant prep.
- Optional ingredients remain visible and reversible before the run begins.
- Ingredients that are not safely/authored as optional should not receive an omission control merely because the system can record a later skip.

Cook Mode prioritizes the current instruction, orientation, and forward progress. Recording reality is secondary but immediately reachable.

### Structured run changes

The intended structured change set is:

- substitute ingredient;
- skip ingredient;
- add ingredient;
- change amount;
- change setting/preparation;
- record an observation.

Freeform notes remain available as a fallback.

An authored Recipe alternative is different from an ad-hoc Cook Run substitution. Run changes do not become Recipe alternatives without a later explicit promotion decision.

### Current MVP boundary

The MVP should faithfully record mid-run changes but does not promise automatic live replanning of all future instructions after an ad-hoc substitution.

Supported authored alternatives can generate the correct plan before Start Cook Run. Generalized live replanning is a later capability requiring explicit dependency rules.

### Kitchen usability

Mobile/kitchen use is a validation requirement before visual polish.

The interaction should assume:

- divided attention;
- wet or dirty hands;
- small screens;
- interruptions;
- a need for large touch targets;
- minimal typing for common changes;
- persistent stage/step orientation;
- reliable re-entry into an active run.

Icons may improve scanning later, but text labels remain the primary semantic layer until the interaction hierarchy is proven.


## 14. Persistent Cook Mode context, useful estimates, and run recovery

Owner review of the first configurable Cook Mode prototype established the following canonical interaction decisions.

### Recipe context is visible during Cook Mode

A separate **View Recipe** route remains useful, but it is not sufficient as the primary orientation mechanism.

On desktop or other sufficiently wide layouts, Cook Mode should pair the active instruction with a persistent recipe-context rail/panel.

During **Prep**, that context is ingredient-oriented:

- show the preparation sequence;
- highlight the current ingredient/prep item;
- visibly check completed prep items;
- Next step completes the current prep item and advances.

During **Cook**, that context is step-oriented:

- show a concise excerpt for each cooking step;
- highlight and expand the active step;
- keep other steps compact and interactive;
- selecting a step jumps the run to that point.

Mobile preserves the same information architecture in a compact/collapsible form rather than requiring a permanent side rail.

### Run progress is persistent state

Current position and completion are Cook Run data, not temporary component decoration.

An active run must be recoverable after refresh/re-entry with:

- frozen run snapshot;
- current stage/step;
- completed prep/step progress;
- recorded deviations/observations.

### Useful estimates are allowed

Verified or recipe-authored conversions are preferred, but Curadh Cooking may provide a clearly labeled **unverified estimate** when a user explicitly asks for a practical conversion or substitution and no verified value exists.

The estimate must communicate uncertainty and must not silently become canonical recipe data.

### Tolerance-awareness language

Default ingredient advisories should communicate **be aware of tolerance** rather than functioning as medical warnings.

They may explain why a form or ingredient deserves attention, but they must not imply universal safety, diagnosis, or treatment.

### Persistence errors are visible

A Cook Run interaction that fails to save must show the user that it failed. Silent persistence failure is unacceptable.
