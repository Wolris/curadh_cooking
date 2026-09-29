# ACTIVE TODO

## Current phase

**MVP implementation — recipe library + Cook Run evidence.**

## CURRENT EXECUTION LOCK

**IMPLEMENT CONFIGURABLE RECIPE -> FROZEN COOK RUN SNAPSHOT -> PREP-FIRST COOK MODE.**

Branch:

- `feature/recipe-0002-chicken-soup`
- this work is a direct result of Recipe 0002 site-story review;
- Recipe 0002 remains **Draft** and its kitchen-validation gate remains intact.

### Accepted site-story findings

The Recipe 0002 review established these requirements:

1. Ingredient rows can expose supported **include / omit** choices.
2. Ingredient rows can expose supported **form choices** such as fresh/raw versus prepared/pre-chopped/packaged forms.
3. Supported conversions are authored per recipe/ingredient; do not invent universal sprig/clove/stalk conversions.
4. Ingredient/form choices may expose calm profile-aware advisories, including a reminder to inspect packaged ingredients when relevant.
5. Prep is part of a Cook Run and normally occurs before cooking.
6. Optional prep operations, such as peeling when explicitly optional, can be disabled and then disappear from the generated run.
7. Equipment/method choices, such as Cuisinart versus knife, can change prep instructions and estimated active time.
8. **Start Cook Run** freezes the selected recipe configuration into that run.
9. Cook Mode shows stage/progress and allows previous/next navigation.
10. The complete configured Recipe remains reachable during a run, with an obvious return to the same run position.
11. During a run the cook can record added/substituted/skipped ingredients, changed amounts/settings, and observations without silently rewriting the Recipe.
12. Simple tool/action/ingredient icons are accepted as a later visual layer, not a prerequisite for the structured workflow.

### Implementation progress

Implemented on this branch:

- Slice A foundation: typed recipe selections, recipe configuration storage, immutable Cook Run configuration snapshot, and persisted generated run position;
- Slice B proving data: Recipe 0002 include/omit choices, authored parsley prepared-form alternative, optional carrot peeling, Cuisinart/knife carrot prep choices, calm advisories, and method-specific prep estimates;
- Slice C initial UI: reversible ingredient/form/prep controls on Recipe 0002 with planned prep-time feedback;
- Slice D initial Cook Mode: server-generated prep-first run plan, omission-aware instructions, Prep/Cook progress, and snapshot-driven navigation;
- recipe inspection during an active run now preserves the run and exposes a Return to Cooking Run path.

Still intentionally open under the same lock:

- complete the focused UX-definition pass before additional feature UI implementation;
- complete automated/browser validation on the latest head;
- implement structured live ingredient-change affordances from the accepted UX model;
- owner browser/story review on desktop and mobile/kitchen scale;
- reconcile any review findings before resuming Recipe 0002 kitchen validation.

### UX-definition gate

The focused UX-definition pass is complete in `docs/design/COOK_RUN_UX_DEFINITION.md`.

It defines:

- end-to-end Recipe -> Configure -> Snapshot -> Prep -> Cook -> Evaluate flow;
- active-run Recipe inspection and return path;
- use-case/state matrix for pre-run configuration versus mid-run reality;
- low-fidelity screen/state maps;
- feature goals;
- interaction risks and mitigations;
- next-slice implementation decisions;
- owner-review questions.

Development may resume only from those accepted interaction decisions; do not extend the generic settings-style UI opportunistically.

### Ordered implementation slices

#### Slice A — domain contract + persistence foundation

- represent supported ingredient configuration choices;
- represent optional prep operations and preparation-method choices;
- add recipe-provided prep-time estimates for supported methods;
- persist a Cook Run configuration snapshot at start;
- preserve post-start deviations separately from that snapshot.

#### Slice B — Recipe 0002 configuration seed

Use the chicken soup as the concrete proving case:

- onion/celery/parsley can expose intentional omit/include behavior where supported;
- parsley can expose an authored prepared-form alternative instead of requiring only sprigs;
- carrots expose prep choices needed to distinguish Cuisinart versus knife workflow;
- optional peeling can be represented independently from the carrot ingredient itself;
- relevant ingredient/form advisories remain profile-aware and non-alarmist.

#### Slice C — recipe-detail configuration UI

- ingredient rows expose the supported controls without becoming separate workflows;
- selected forms show the correct quantity/form language;
- equipment/prep method choices update the planned prep/time story before the run starts;
- omitted ingredients and disabled optional prep are visually reversible.

#### Slice D — prep-first generated Cook Run

- Start Cook Run freezes the configuration;
- generated run begins with Prep;
- disabled/omitted choices do not produce irrelevant instructions;
- progress distinguishes Prep from Cook;
- previous/next remains available.

#### Slice E — recipe/run navigation + live deviations

- View Recipe from an active run;
- Return to Cooking Run at the preserved position;
- configured ingredients remain visible from the recipe;
- structured run changes include add, substitute, skip, changed amount, setting/prep change, and observation.

#### Slice F — validation and owner review

Automated validation must prove:

- configuration choices are returned by the Recipe API;
- a started run preserves its own snapshot;
- later UI/config changes do not silently rewrite the active run;
- Recipe 0002 generates prep before cook steps;
- omitted ingredients/disabled prep do not appear in generated instructions;
- live substitutions/deviations remain Cook Run events;
- Recipe 0001 existing Cook Run behavior remains green.

Owner browser review then verifies that Recipe 0002 tells the complete configure -> prep -> cook story.

After that review, return to the existing Recipe 0002 kitchen-validation gate. Recipe 0002 must remain Draft until an actual Cook Run is completed and reported.

## Dependency / existing merge gate

PR #1 — `Establish Curadh Cooking MVP and Recipe 0001 Cook Run flow` — remains unmerged and still requires Jim's browser/experience approval before merge.

## Recently closed

### Recipe 0001 — Oatmeal Sandwich Bread — CANONICAL / SUCCESS

Successful markers:

- moisture — target hit;
- flexibility — target hit;
- density/lightness — target hit;
- flavor — target hit;
- sandwich usefulness — successful;
- crust — successful with warm butter finish.

Known improvement opportunity:

- loaf height/scale was roughly half the height of earlier GF loaves.

Actual successful Breadman evidence:

- White / Light / 1.5 lb;
- mixer blade removed at first rest;
- batter smoothed with rubber spatula;
- later machine spin/rest occurred without blade;
- no extra milk added;
- no supplemental oven heat;
- about 2 Tbsp melted butter applied to all six sides while warm.
