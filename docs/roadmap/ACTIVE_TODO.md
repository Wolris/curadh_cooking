# ACTIVE TODO

## Current phase

**Recipe 0001 proven — transition into MVP product architecture.**

Recipe 0001 is now the first canonical Curadh Cooking recipe and its successful V3 Cook Run is preserved as separate evidence.

## CURRENT EXECUTION LOCK

**DECISION GATE — choose the initial internal MVP web architecture and persistence shape.**

Canonical product inputs now available:

- Recipe 0001 — `recipes/0001-oatmeal-sandwich-bread.md`;
- successful V3 Cook Run — `recipes/results/0001-v3-2026-09-28.md`;
- Recipe / Variant / Cook Run / Result distinction — ADR-0002;
- goal-first experience journey — Design Bible;
- profile-first mapping precedence — ADR-0001.

### Architecture decision must support

- goal-first find/build flow;
- recipe library;
- ingredients-on-hand context;
- Profile + Mapping + explicit overrides;
- Ingredient lookup;
- Recipe + Variant + Cook Run + Result evidence;
- equipment/tool settings;
- structured Cook Mode state;
- live deviations/observations;
- recipe/result history;
- source/provenance;
- internal/private use first;
- a clean future seam for contextual reasoning assistance without requiring it for the first usable build.

### Decision boundaries

Do not:

- design a public social network;
- require external AI for basic cooking flows;
- overbuild multi-user/community infrastructure before internal use proves the model;
- collapse Recipe and Cook Run evidence;
- encode medical guarantees;
- choose a complex distributed architecture without demonstrated need.

### Acceptance

- select initial web/app stack;
- select MVP persistence approach;
- define minimum domain schema from Recipe 0001 evidence;
- define first implementable vertical slice;
- record material architecture decisions;
- update roadmap to the first implementation lock.

## Recently closed

### Recipe 0001 — Oatmeal Sandwich Bread — CANONICAL / SUCCESS

Closure basis: Jim-reported kitchen validation on 2026-09-28.

Successful markers:

- moisture — target hit;
- flexibility — target hit;
- density/lightness — target hit; significantly lighter than earlier GF loaves;
- flavor — target hit; delicious;
- sandwich usefulness — successful;
- crust — successful with warm butter finish.

Known improvement opportunity:

- loaf height/scale was roughly half the height of earlier GF loaves.

The height result does not count against Recipe 0001 as a successful repeatable recipe.

Actual successful Breadman evidence:

- White / Light / 1.5 lb;
- mixer blade removed at first rest;
- batter smoothed with rubber spatula;
- later machine spin/rest occurred without blade;
- no extra milk added;
- no supplemental oven heat;
- about 2 Tbsp melted butter applied to all six sides while warm.

### Repository bootstrap — DONE

- project principles established;
- repository rules established;
- Design Bible established;
- project memory/status established;
- ADR-0001 profile-first mapping precedence accepted;
- recipe lifecycle established.
