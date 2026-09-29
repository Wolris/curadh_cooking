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

Choose the initial internal MVP web architecture and persistence shape, then define the first implementation vertical slice.

## Repository visibility

GitHub currently reports this repository as **public**. Treat repository fixtures/profile examples as non-personal/synthetic until repository visibility is changed.

## Startup

1. read fresh `AGENTS.md`;
2. read fresh `docs/roadmap/ACTIVE_TODO.md`;
3. load only the relevant Design Bible/ADR/recipe material for the current lock;
4. execute that lock.
