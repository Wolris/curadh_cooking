# ACTIVE TODO

## Current phase

**Product definition through the first concrete recipe.**

The project is intentionally starting with a real recipe before locking the application schema or UI architecture.

## CURRENT EXECUTION LOCK

**REQUIREMENTS GATE — Recipe 0001: reconstruct the wheat-free arrowroot/flax bread.**

Known remembered concept:

- arrowroot;
- flaxseed;
- eggs;
- honey;
- one or more other wheat-free flours.

### Required owner input

Before drafting the formula, Jim must provide:

1. the target bread characteristics;
2. the ingredients currently available / preferred for this bake.

### Acceptance for this lock

- capture desired loaf/use characteristics;
- capture available ingredients and any ingredients Jim wants excluded;
- draft one bounded first formula with weights and useful volume equivalents;
- specify pan/tool requirements, method, bake temperature, timing, and doneness cues;
- explain the role of each important ingredient;
- separate required ingredients from optional/substitution candidates;
- provide a small, reportable bake-test matrix;
- revise from Jim's kitchen evidence;
- only after Jim approves the result, create the canonical `recipes/0001-...` record.

### Scope boundary

Do **not** begin application implementation or lock a broad ingredient/profile schema before Recipe 0001 gives us concrete recipe data to model.

## Recently closed

### Repository bootstrap — DONE

- project principles established;
- repository rules established;
- Design Bible established;
- project memory/status established;
- profile-first mapping precedence recorded as ADR-0001;
- recipe lifecycle established.

## Next after Recipe 0001

1. derive the minimum Recipe + Ingredient schema from the approved bread record;
2. define the minimum Profile + Mapping model around that concrete recipe;
3. decide the initial web stack and local/internal deployment shape;
4. build the first recipe-library/ingredient-lookup slice.
