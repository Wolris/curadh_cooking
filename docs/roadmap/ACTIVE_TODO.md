# ACTIVE TODO

## Current phase

**MVP implementation — first end-to-end Recipe/Cook Run slice.**

## CURRENT EXECUTION LOCK

**AWAITING OWNER/BROWSER VALIDATION — Production scaffold + Recipe 0001 Cook Run vertical slice.**

PR:

- #1 — `Establish Curadh Cooking MVP and Recipe 0001 Cook Run flow`
- branch: `feature/recipe-0001-v1`

### Implemented flow

**Recipe library -> Oatmeal Sandwich Bread -> Start Cook Run -> Cook Mode -> record observation/deviation -> finish -> result markers -> saved Recipe history.**

Implemented architecture:

- React + Vite + TypeScript web client;
- Node + Fastify + TypeScript API;
- SQLite runtime persistence;
- version-controlled SQL migrations;
- shared Zod contracts;
- modular monolith;
- no external AI dependency for the first usable Cook Mode.

### Automated validation

Latest CI branch validation before the local-validator update: **PASS**

- TypeScript typecheck — PASS
- API/domain tests — PASS
- production build — PASS
- Playwright browser vertical flow — PASS

Latest owner-local full validation: **BLOCKED BY PLAYWRIGHT DEV-SERVER STARTUP**

- pull/install/typecheck/test/build — PASS
- Playwright Chromium install — PASS
- Playwright timed out waiting for its configured local web servers before the E2E test started
- normal manual development uses web 5174 + API 3101
- automated E2E is now isolated on dedicated web 5274 + API 3102
- E2E ports are non-reusable so a true collision fails explicitly instead of silently attaching to another project
- port 3001 was confirmed to belong to another local service (`GET /api/health` returned 404)
- normal Curadh API default moved to 3101; owner-local browser review should use 5174 -> 3101
- owner-local rerun required

The browser automation proves:

- Recipe 0001 loads;
- proven White / Light / 1.5 lb settings render;
- a Cook Run can start;
- a live observation can be recorded and persisted;
- result markers save independently;
- `Height / rise = mixed` can coexist with `Flavor = hit`;
- the completed run appears in Recipe history.

### Local validation entrypoint

Windows validation now mirrors the established Mundane Adventures workflow:

- `validate.cmd` — full pull/install/typecheck/test/build/browser validation;
- `validate.cmd quick` — typecheck/test/build without pull/install/browser;
- `validate.cmd browser` — ensures Playwright Chromium is installed, then runs browser validation;
- `validate.cmd -Branch <name>` — fetch/switch/pull the requested branch before validating;
- archived logs live under ignored `validation-logs/`, with `latest.txt` as the handoff/debug artifact;
- `package-lock.json` is ignored while this scaffold intentionally uses `npm install --no-package-lock`;
- the validator reports start/end branch + commit, working-tree state, individual step results, and preserves failure exit codes.

### Owner/browser validation requested

Review the current functional scaffolding, not final visual design.

1. Home communicates a goal-first starting point and exposes Oatmeal Sandwich Bread.
2. Recipe detail foregrounds useful cooking facts, proven settings, known successes, and the height improvement opportunity without lifestyle-blog filler.
3. Start Cook Run enters a clear step-oriented Cook Mode.
4. Record a live observation/deviation and verify it appears in the run notes.
5. Finish the run and record independent results — especially one successful marker and one mixed marker.
6. Save results and verify the completed run appears in Recent Cook Runs.
7. Report whether this interaction model feels like the right foundation for the eventual goal + ingredients + profile + tools + time experience.

### Merge gate

Do not merge PR #1 until Jim approves the browser/experience review.

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
