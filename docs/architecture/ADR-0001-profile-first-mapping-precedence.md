# ADR-0001 — Profile-first mapping precedence

**Status:** Accepted  
**Date:** 2026-09-28

## Context

Curadh Cooking may use named frameworks such as low-histamine, low-FODMAP, vegan, gluten-free, or POTS-oriented nutrition as useful starting points.

The product must not assume that selecting one of those labels means the user follows every associated rule rigidly. Individual people may tolerate, prefer, avoid, or intentionally accept ingredients differently.

## Decision

1. Named mappings provide defaults/advisories.
2. Explicit profile settings override mapping defaults.
3. Ingredient-level fit remains explainable; the system must be able to say which mapping or profile setting produced a flag.
4. The product will not reduce all profile compatibility to one opaque universal score.
5. Mapping provenance and uncertainty are preserved where relevant.
6. The model leaves room for context such as amount, preparation, form, storage/freshness, and substitutions.
7. Food preference/tolerance configuration must not be used to infer a medical diagnosis.

## Consequences

- Recipe evaluation is derived per profile rather than stored as a universal safe/unsafe attribute.
- A future user can select a broad mapping and then loosen or tighten it without forking the entire mapping.
- Ingredient and recipe schemas must support overrides and provenance.
- Recipe 0001 should be used to discover the minimum concrete fields before over-designing the schema.
