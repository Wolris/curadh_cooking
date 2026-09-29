# ACTIVE TODO

## Current phase

**MVP implementation — recipe library + Cook Run evidence.**

## CURRENT EXECUTION LOCK

**AWAITING AUTOMATED + OWNER KITCHEN VALIDATION — Recipe 0002 Homemade Chicken Soup.**

Branch:

- `feature/recipe-0002-chicken-soup`
- stacked on `feature/recipe-0001-v1` because Recipe/Cook Run scaffolding is still in PR #1

### Recipe 0002 scope

Add the user-supplied Homemade Chicken Soup as a **Draft** recipe and adapt it for:

- Instant Pot pressure cooking;
- Cuisinart blender / food processor carrot puree;
- instant-read thermometer verification;
- profile-first POTS / MCAS notes rather than a universal safe/unsafe label.

Source recipe facts preserved:

- chicken parts are the broth base;
- carrots are cooked with the chicken;
- onion, celery, and parsley are aromatics;
- soup is strained and surface fat may be skimmed;
- cooked carrots are pureed back into the broth.

The Curadh Cooking adaptation uses an original pressure-cooker method rather than copying the source wording.

### POTS / MCAS fact-check

Current evidence summary:

- POTS care often uses increased oral fluid and sodium when clinically appropriate; one universal sodium dose is not correct for every person.
- MCAS does not have one evidence-based universal food-avoid list; individual triggers and profile overrides matter.
- Histamine already present in food is heat-stable; pressure cooking is not a histamine-destruction claim.
- Freshness/storage can matter for biogenic amines; prompt cooling/freezing remains relevant.
- Poultry must reach at least 165°F / 74°C and leftovers should be chilled promptly.

The recipe record preserves reviewed source links and uncertainty.

### Implemented Recipe 0002 draft

Initial validation batch:

- 2 1/2 to 3 lb bone-in chicken thighs/drumsticks;
- 6 to 8 carrots;
- optional onion/celery/parsley according to profile;
- 4 to 6 cups water, never exceeding the pressure-cook fill limit;
- 2 tsp salt to start, adjusted after cooking according to taste/profile.

Equipment/settings:

- Instant Pot Pressure Cook / Manual;
- High pressure;
- 20 minutes;
- 15-minute natural release, then vent remaining pressure;
- Cuisinart carrot puree starts with 1 cup broth;
- chicken verified at 165°F / 74°C minimum.

Result markers:

- broth flavor;
- carrot body / texture;
- chicken tenderness;
- salt balance;
- aromatic balance;
- overall soup usefulness.

### Automated validation target

- API lists both Recipe 0001 and Recipe 0002;
- Recipe 0002 loads as Draft;
- Instant Pot, Cuisinart, and thermometer settings render correctly;
- browser recipe detail exposes the pressure time, release, Cuisinart guidance, and profile-first POTS/MCAS note;
- existing Recipe 0001 Cook Run flow remains green.

### Owner kitchen validation requested

Cook Recipe 0002 as written, then report:

1. **Broth flavor** — hit / mixed / miss
2. **Carrot body / texture** — hit / mixed / miss
3. **Chicken tenderness** — hit / mixed / miss
4. **Salt balance** — hit / mixed / miss
5. **Aromatic balance** — hit / mixed / miss
6. **Overall soup usefulness** — hit / mixed / miss

Also report any deviation that matters:

- actual chicken weight;
- actual water amount;
- any omitted aromatic;
- salt added after cooking;
- pressure/release change;
- Cuisinart puree adjustment;
- profile-specific tolerance observation.

Do **not** promote Recipe 0002 from Draft to Tested until an actual Cook Run is reported.

## Dependency / existing merge gate

PR #1 — `Establish Curadh Cooking MVP and Recipe 0001 Cook Run flow` — remains unmerged and still requires Jim's browser/experience approval before merge.

## Recently closed

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
