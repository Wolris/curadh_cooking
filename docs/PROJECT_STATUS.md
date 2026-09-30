# Project Status / Fresh-Chat Memory

## Project

**Curadh Cooking**  
Repository: `Wolris/curadh_cooking`

## Purpose

Build a practical, profile-first recipe library, recipe-discovery, and cooking-support web project centered on individualized food sensitivities/preferences, ingredients on hand, desired results, nutrition, tools, time, and real Cook Run evidence.

Named frameworks such as low-histamine, low-FODMAP, vegan, gluten-free, or POTS-oriented nutrition are adjustable mappings/defaults, not rigid identities. Explicit profile-level ingredient choices take precedence.

The product is goal-first and intentionally avoids lifestyle-blog filler.

## Canonical product principles

- profile first, mapping second;
- goal first, taxonomy second;
- ingredient-level overrides beat mapping defaults;
- explain why an ingredient is flagged;
- Recipe, Variant, Cook Run, and Result evidence are distinct;
- canonical means current proven recipe, not perfected forever;
- preserve partial evidence without inventing missing details;
- tools/settings and live deviations matter;
- cooking results should compare with the original desired outcome;
- retain provenance/uncertainty;
- do not make medical safety guarantees;
- structured food information first.

## Recipe 0001

**Oatmeal Sandwich Bread** is the first canonical recipe.

Successful documented V3 run:

- moisture: target hit;
- flexibility: target hit;
- density/lightness: target hit and much lighter than earlier GF loaves;
- flavor: target hit / delicious;
- sandwich use: successful;
- crust: successful with butter finish;
- height: roughly half earlier GF loaf height — explicit improvement opportunity, not a failed result.

Proven run settings:

- Breadman White / Light / 1.5 lb;
- blade removed at first rest;
- batter gently smoothed;
- later machine spin/rest occurred with no blade;
- no extra hydration added;
- no supplemental oven heat;
- about 2 Tbsp butter applied to all six sides while warm.

Canonical recipe: `recipes/0001-oatmeal-sandwich-bread.md`  
Run evidence: `recipes/results/0001-v3-2026-09-28.md`

## Core experience

The first navigation/experience model follows the real Recipe 0001 journey:

**Goal → desired result → ingredients/profile/tools/time → find/build solution → Cook Mode → live observation/deviation → evaluate result → save evidence / improve recipe.**

Final top-level nav labels are intentionally not locked yet.

Cook Mode is a core product direction. MVP should first support structured recipe state, deviations, observations, troubleshooting knowledge, and result capture. A freeform contextual reasoning layer can be added through a clean seam later; basic Cook Mode must not depend on external AI.

## Current execution lock

Owner-review implementation for the configurable Cook Mode is now **merge-ready pending Jim's final browser/experience approval**.

Implemented and automated:

- structured run notes persist and failed saves surface visibly;
- every run note is bound to its generated run step, including Prep;
- run notes can be edited, reclassified, and deleted;
- Previous / Next is repeated below run notes before Finish Cook Run;
- Cook Mode has a persistent recipe-context rail on wide layouts and stacked treatment on narrow layouts;
- Prep context highlights the current ingredient/prep item and checks completed items;
- Next step persists completion before advancing;
- Cook context shows interactive step excerpts with current-step expansion and direct jumping;
- active local Cook Runs recover after refresh/re-entry with snapshot, step, completion, and notes;
- unverified unit alternatives can be labeled explicitly as estimates;
- ingredient advisories use tolerance-awareness language.

Full TypeScript/API/build/browser validation passes on the combined implementation.

Completed-run correction and the final usability pass are implemented and fully validated:

- Recent Cook Runs -> Edit run;
- full run-note text remains readable;
- note edits happen inline at the step where the evidence lives;
- clicking a completed-run Run Plan step opens a blank inline note at that point;
- sticky viewport-height Run Plan with Results as the final section;
- active Run Plan supports Prep / Cooking / Results section jumps plus direct step navigation;
- cancelled runs require confirmation, preserve their evidence, and remain reachable in history;
- submitted result markers remain correctable without reopening the run;
- completed/cancelled state and frozen snapshots remain preserved.

Full TypeScript/API/unit/build/browser validation passes on the final implementation.

Merge preparation:

1. Jim performs final desktop/mobile browser review and explicitly approves merge.
2. Merge PR #1 to `main`.
3. Retarget stacked PR #2 to `main`.
4. Reverify PR #2 diff and CI.
5. Merge PR #2 only with Jim's explicit approval.

After landing, Recipe 0002 remains Draft until its existing Cook Run evidence is reconciled and status promotion is explicitly approved.

Canonical design detail is in Design Bible §§12–14 and `docs/design/COOK_RUN_UX_DEFINITION.md`.

## Repository visibility

GitHub currently reports this repository as **public**. Treat repository fixtures/profile examples as non-personal/synthetic until repository visibility is changed.

## Startup

1. read fresh `AGENTS.md`;
2. read fresh `docs/roadmap/ACTIVE_TODO.md`;
3. load only the relevant Design Bible/ADR/recipe material for the current lock;
4. execute that lock.


## Accepted MVP architecture

- React + Vite + TypeScript
- Node + Fastify + TypeScript
- SQLite with version-controlled migrations
- shared Zod contracts
- modular monolith
- future contextual reasoning seam; external AI is not required for initial Cook Mode

See `docs/architecture/ADR-0003-mvp-web-architecture.md` and `docs/architecture/MVP_DOMAIN_MODEL.md`.
