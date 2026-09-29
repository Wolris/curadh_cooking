# ADR-0002 — Recipe, Variant, and Cook Run evidence are distinct

**Status:** Accepted  
**Date:** 2026-09-28

## Context

Recipe 0001 became successful through iterative reconstruction and live cooking observations.

The successful V3 run also contained conditions that should not be confused with the abstract recipe alone:

- Breadman White / Light / 1.5 lb;
- mixer blade removed at first rest;
- later machine spin/rest occurred with no blade;
- batter was thicker than the remembered prior version;
- no extra hydration was added;
- butter was applied to all six sides;
- eating-quality targets succeeded;
- loaf height remained an improvement opportunity.

Future cooks may follow the same recipe differently and get different results. Those differences are useful evidence.

## Decision

Curadh Cooking distinguishes at least these concepts:

### Recipe

The current repeatable cooking instructions/formula someone can choose to make.

A Recipe can be Canonical while still having known improvement opportunities.

### Variant

An intentional change to the recipe or process intended to test or produce a meaningfully different outcome.

A Variant does not replace the canonical Recipe until evidence supports promotion.

### Cook Run

One person's execution of a Recipe or Variant at a specific time.

A Cook Run may record:

- actual equipment/settings;
- substitutions;
- deviations from the instructions;
- live adjustments;
- observations during cooking;
- outcome/result markers;
- notes.

### Result evidence

Structured observations produced by a Cook Run, such as:

- moisture;
- flexibility;
- density/lightness;
- flavor;
- rise/height;
- crust;
- usefulness for the stated goal;
- freeform observations.

Result evidence may be incomplete. Older runs such as historical V1/V2 may still contribute known facts even when their full formulas were not preserved.

## Consequences

- One imperfect dimension does not automatically make an otherwise successful Recipe non-canonical.
- A future JD run can contribute evidence without rewriting Jim's successful run.
- Recipe improvement can target one marker, such as height, while explicitly protecting already-successful markers.
- The app should show what result is based on direct evidence versus recovered/incomplete history.
- Community/shared evidence can eventually aggregate outcomes without pretending every cook executed the same process identically.
