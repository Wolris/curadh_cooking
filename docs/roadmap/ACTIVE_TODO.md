# ACTIVE TODO

## Current phase

**Product definition through the first concrete recipe.**

The project is intentionally starting with a real recipe before locking the application schema or UI architecture.

## CURRENT EXECUTION LOCK

**AWAITING KITCHEN VALIDATION — Recipe 0001 Draft V1: arrowroot/flax sandwich bread.**

Owner requirements captured:

- sandwich + toast loaf;
- soft/fluffy relative to prior gluten-free loaves;
- between moist and dry, leaning dry;
- flexible rather than crumbly;
- substantially less dense than prior versions;
- mostly neutral/savory;
- soft crust;
- quick-bread method in a Breadman/bread machine.

Available candidate ingredients captured:

- arrowroot;
- flaxseed/meal;
- cassava flour;
- tigernut flour;
- almond flour;
- oatmeal/oat flour;
- cornstarch;
- eggs;
- honey/maple;
- baking powder;
- baking soda;
- active yeast;
- salt;
- olive oil;
- butter;
- apple cider vinegar;
- milk;
- coconut oil;
- coconut milk.

Draft V1 lives at:

- `recipes/drafts/0001-arrowroot-flax-sandwich-bread-v1.md`

### Current validation request

Bake Draft V1 without introducing additional substitutions unless an ingredient is unavailable.

After the loaf is completely cool, report:

1. lift/density;
2. crumb/flexibility;
3. moisture/gumminess;
4. sandwich + toast performance;
5. flavor + crust;
6. whether hydration needed adjustment during mixing;
7. approximate loaf height / any collapse;
8. next-morning slicing behavior if available.

### Acceptance for this lock

- owner requirements captured — DONE;
- ingredients captured — DONE;
- bounded first formula drafted — DONE;
- pan/tool method, timing and doneness cues documented — DONE;
- ingredient roles documented — DONE;
- required versus deferred ingredients documented — DONE;
- reportable bake-test matrix documented — DONE;
- kitchen validation — PENDING;
- revise from Jim's evidence — PENDING;
- promote an approved recipe to Canonical only after owner approval — PENDING.

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
