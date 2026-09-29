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


## Recipe 0003

**Whole-Milk Yogurt — Euro Cuisine** is a **Draft** recipe for the 7-jar maker.

V1 uses:

- 4 cups whole milk;
- one 3 g Yogourmet Original sachet;
- 3.5 g unflavored gelatin for a firmer refrigerated set;
- milk heated to 180°F / 82°C or first boil;
- cooling to 108–112°F / 42–44°C, with Yogourmet's warm-not-hot finger cue as the no-thermometer fallback;
- 5–8 hours incubation with individual jar lids off;
- immediate capping/refrigeration followed by about 8 hours of cold set.

The first kitchen result is pending full refrigerated evaluation. Do not promote beyond Draft until set, creaminess, tang, smoothness, whey separation, and overall usefulness are reported.

## Core experience

The first navigation/experience model follows the real Recipe 0001 journey:

**Goal → desired result → ingredients/profile/tools/time → find/build solution → Cook Mode → live observation/deviation → evaluate result → save evidence / improve recipe.**

Final top-level nav labels are intentionally not locked yet.

Cook Mode is a core product direction. MVP should first support structured recipe state, deviations, observations, troubleshooting knowledge, and result capture. A freeform contextual reasoning layer can be added through a clean seam later; basic Cook Mode must not depend on external AI.

## Current execution lock

Implement the Recipe 0002 site-review findings as the next MVP foundation:

**configurable Recipe -> frozen Cook Run snapshot -> prep-first Cook Mode -> structured live deviations.**

The first proving case is Homemade Chicken Soup. Recipe 0002 remains Draft; kitchen validation resumes only after the configure/prep/run experience is ready for owner browser review.

Canonical design detail is in Design Bible §12 and the ordered slices are in `docs/roadmap/ACTIVE_TODO.md`.

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
