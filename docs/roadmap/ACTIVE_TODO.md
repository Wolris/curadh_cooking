# ACTIVE TODO

## Current phase

**MVP implementation — first end-to-end Recipe/Cook Run slice.**

Product-definition and initial architecture are now sufficiently grounded by Recipe 0001 to begin implementation.

## CURRENT EXECUTION LOCK

**IMPLEMENT — Production scaffold + Recipe 0001 Cook Run vertical slice.**

Accepted architecture:

- React + Vite + TypeScript web client;
- Node + Fastify + TypeScript API;
- SQLite runtime persistence;
- version-controlled SQL migrations;
- shared Zod contracts;
- modular monolith;
- no external AI dependency for the first usable Cook Mode.

Canonical architecture owners:

- `docs/architecture/ADR-0003-mvp-web-architecture.md`
- `docs/architecture/MVP_DOMAIN_MODEL.md`

### Required vertical flow

**Recipe library -> Oatmeal Sandwich Bread -> Start Cook Run -> Cook Mode -> record observation/deviation -> finish -> result markers -> saved Recipe history.**

### Acceptance

- repository has runnable TypeScript web/API scaffold;
- SQLite database initializes through version-controlled migration(s);
- Recipe 0001 is seeded as development/product evidence without private profile data;
- recipe library lists Recipe 0001;
- Recipe 0001 detail exposes ingredients, proven Breadman settings, steps, successful result summary, and known height improvement opportunity;
- Start Cook Run creates a persisted active run;
- Cook Mode supports current step/stage navigation;
- Cook Mode can record at least one observation/deviation event during the run;
- run completion records recipe-specific result markers independently so one mixed marker does not mark the whole recipe failed;
- completed run appears in Recipe 0001 history;
- automated validation covers domain/API behavior;
- browser validation covers the complete vertical flow;
- no real private household profile/medical data is committed.

### Scope boundary

Do not add in this lock:

- external recipe search;
- external AI/reasoning provider;
- full Profile/Mapping UI;
- public sharing/accounts;
- nutrition database;
- sophisticated pantry inventory;
- unrelated design polish.

## Recently closed

### Initial MVP architecture — ACCEPTED

- TypeScript modular monolith;
- React/Vite client;
- Fastify REST API;
- SQLite + migrations;
- shared Zod contracts;
- first domain model derived from Recipe 0001;
- contextual reasoning preserved as a future seam rather than an MVP dependency.

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
