# ACTIVE TODO

## Current phase

**Product definition through the first concrete recipe.**

The project is intentionally starting with a real recipe before locking the application schema or UI architecture.

## CURRENT EXECUTION LOCK

**AWAITING KITCHEN VALIDATION — Recipe 0001 Reconstruction V3: arrowroot/flax yeast sandwich bread.**

Recovered recipe history:

- household GF V1 was denser, did not use cassava, and used more eggs;
- household GF V2 was less dense and used yeast;
- the Breadman managed the rise as part of its program;
- therefore the project recipe currently being reconstructed is V3.

Owner target:

- sandwich + toast loaf;
- soft/fluffy relative to prior gluten-free loaves;
- between moist and dry, leaning dry;
- flexible rather than crumbly;
- lighter than V2 if possible;
- mostly neutral/savory;
- soft crust;
- Breadman process.

Available candidate ingredients:

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

Current draft:

- `recipes/drafts/0001-arrowroot-flax-sandwich-bread-v3.md`

The earlier generated quick-bread draft was superseded before baking because it incorrectly treated yeast as a new variable rather than recovered V2 evidence.

### Current validation request

Bake Reconstruction V3 using the same successful V2 Breadman yeast cycle if remembered; otherwise prefer the machine's Gluten-Free cycle if available.

After the loaf is completely cool, report:

1. lift/density versus remembered V1/V2;
2. crumb/flexibility;
3. moisture/gumminess;
4. sandwich + toast performance;
5. flavor + crust;
6. exact Breadman cycle and visible rise/collapse behavior;
7. any hydration adjustment;
8. approximate loaf height/shape;
9. next-morning slicing behavior if available.

### Acceptance for this lock

- owner requirements captured — DONE;
- ingredient inventory captured — DONE;
- prior-version evidence corrected — DONE;
- bounded V3 formula drafted — DONE;
- Breadman process and doneness cues documented — DONE;
- ingredient roles documented — DONE;
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
