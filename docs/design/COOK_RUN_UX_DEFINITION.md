# Curadh Cooking — Configurable Recipe / Cook Run UX Definition

## Purpose

This document defines the interaction model for configurable recipes and Cook Runs before additional UI implementation.

It is a supporting design artifact. Canonical product decisions belong in `docs/design/DESIGN_BIBLE.md`; execution order belongs in `docs/roadmap/ACTIVE_TODO.md`.

The proving case is Recipe 0002 — Homemade Chicken Soup.

---

## 1. End-to-end task flow

### Primary path

```text
Recipe Library
    |
    v
Recipe Detail
    |
    +--> Review ingredients / equipment / method
    |
    +--> Configure supported ingredient choices
    |      - include / omit
    |      - fresh / prepared / packaged form
    |      - quantity/form guidance
    |      - optional prep
    |      - preparation method / equipment
    |
    +--> Review resulting prep/time assumptions
    |
    v
Start Cook Run
    |
    +--> Freeze recipe configuration into Cook Run snapshot
    |
    v
Prep
    |
    +--> Previous / Next
    +--> View Recipe
    +--> Record a change / observation
    |
    v
Cook
    |
    +--> Previous / Next
    +--> View Recipe
    +--> Record a change / observation
    |
    v
Finish Cook Run
    |
    +--> Evaluate result markers
    +--> Review deviations / observations
    |
    v
Save Run Evidence
    |
    +--> Recipe remains unchanged
    +--> Later explicit decision may revise recipe / create Variant
```

### Recipe inspection during an active run

```text
Cook Mode
   |
   +--> View Recipe
           |
           +--> Pinned configured ingredient list
           +--> Full method / equipment context
           +--> Active-run indicator
           |
           +--> Return to Cooking Run
                   |
                   +--> Same run
                   +--> Same current step
                   +--> Same recorded events
```

### Change after Start Cook Run

```text
Something differs from the plan
    |
    +--> Added ingredient
    +--> Substituted ingredient
    +--> Skipped ingredient
    +--> Changed amount
    +--> Changed preparation / setting
    +--> Observation only
    |
    v
Record Cook Run event
    |
    +--> Preserve original frozen snapshot
    +--> Preserve what actually happened
    +--> Do NOT silently alter reusable Recipe
```

---

## 2. Use-case and state matrix

| User action | Before run | During run | Persistent effect | Generated instructions |
| --- | --- | --- | --- | --- |
| Omit an authored optional ingredient | Supported configuration choice | If changed later, record as skip/deviation | Snapshot stores planned omission; later change stored as event | Omitted ingredient should not appear in generated steps |
| Re-enable an omitted ingredient | Reversible until Start Cook Run | Treat as run change if already started | New pre-run selection or run event | Pre-run regeneration restores relevant steps |
| Select authored ingredient form | Supported configuration choice | Changing later is a run substitution/form change | Snapshot stores selected form | Quantity/form/prep language must match selected form |
| Switch fresh to prepared/commercial | Supported when recipe defines it | Record if changed after start | Snapshot or run event | Show authored conversion and contextual advisory |
| Change carrot prep tool | Supported configuration choice | Record method change after start | Snapshot stores intended method | Prep instruction and estimate change |
| Disable optional peeling | Supported configuration choice | Record prep change if decided during run | Snapshot stores planned state | Peeling step disappears when disabled |
| Substitute an ingredient ad hoc | Not necessarily authored | Yes | Run event only unless explicitly promoted later | Current snapshot remains historical truth |
| Add an unplanned ingredient | Not normally part of configuration | Yes | Run event | Does not automatically rewrite future steps unless a later feature explicitly supports live replanning |
| Change amount mid-run | Not necessarily authored | Yes | Run event | Snapshot remains original plan |
| View recipe | Yes | Yes | None | Active run remains intact |
| Move backward/forward | N/A | Yes | Current run position | No mutation of recipe or evidence |
| Finish run | N/A | Yes | Saves result evidence | Closes run only after user confirms results |

### State distinction

The UI must keep three concepts distinguishable:

1. **Recipe default** — reusable authored recipe.
2. **Run plan** — frozen configured snapshot created at Start Cook Run.
3. **Run reality** — deviations and observations recorded after cooking starts.

These may match, but they are not interchangeable.

---

## 3. Low-fidelity screen / state map

### A. Recipe detail — default

```text
-------------------------------------------------
Homemade Chicken Soup                       DRAFT
Summary / result target

[ Planned prep: ~2 min ]

[ Start Cook Run ]

INGREDIENTS
-------------------------------------------------
2 lb   Chicken
3      Carrots
       [x] Peel carrots
       Prep with [ Cuisinart / food processor v ]

1      Yellow onion
       [x] Include
       (small tolerance/profile note)

2      Celery stalks
       [x] Include
       (small tolerance/profile note)

8–10   Parsley sprigs
       [x] Include
       Form [ Fresh parsley v ]

...

KITCHEN SETTINGS
...

METHOD
...
-------------------------------------------------
```

Principle: configuration controls live beside the thing they affect.

### B. Recipe detail — ingredient omitted

```text
Celery                     [ ] Include
2 stalks, trimmed           visually de-emphasized
ⓘ Optional for this soup. Omit when it does not
  fit the selected profile or current tolerance.
```

The ingredient remains visible and reversible before the run starts.

### C. Recipe detail — prepared form selected

```text
Parsley                    [x] Include
2 tsp prepared/pre-chopped parsley
Form [ Prepared / pre-chopped v ]

ⓘ If using a commercial prepared product, check
  ingredients, sodium, additives, and freshness
  against the selected profile.
```

The visible ingredient line should reflect the actual selected form. The control is not merely metadata below stale recipe text.

### D. Cook Mode — prep

```text
[ View Recipe ]     Homemade Chicken Soup     RUN ACTIVE

PREP 1 OF 4

Peel the carrots, then cut them into pieces
suitable for the Cuisinart / food processor.

[ Previous ]                         [ Next step ]

-----------------------------------------------
Something changed?
[ Add ] [ Substitute ] [ Skip ] [ Amount ]
[ Setting / prep ] [ Observation ]
-----------------------------------------------
```

The current instruction is primary. Recording reality is available without competing visually with the instruction.

### E. Cook Mode — cooking

```text
[ View Recipe ]     Homemade Chicken Soup     RUN ACTIVE

COOK 2 OF 7 · Pressure cook

Lock the lid and pressure cook on High for
20 minutes.

[ Previous ]                         [ Next step ]

Something changed? ...
```

Prep and Cook are distinct stages inside one continuous run.

### F. Recipe while run is active

```text
-------------------------------------------------
COOK RUN IS STILL ACTIVE
Your configured recipe is pinned for this run.
[ Return to Cooking Run ]
-------------------------------------------------

Homemade Chicken Soup

INGREDIENTS — PINNED FOR THIS RUN
...
```

The user must never wonder whether opening the recipe ended or modified the run.

### G. Record a substitution

```text
SUBSTITUTION

Planned:
1 yellow onion

Actually used:
[ 1/2 ] [ white onion ]
+ Add another ingredient
[ 1/2 ] [ red onion ]

Optional note:
[________________________________________]

[ Cancel ]                   [ Record change ]
```

This is the target interaction direction. The current generic event textarea is acceptable scaffolding, not the final structured interaction.

---

## 4. Feature goals

### Goal 1 — Adapt the plan before cooking

A cook can adjust supported choices without manually rewriting the recipe in their head.

Success means the visible recipe, time estimate, prep steps, and Cook Run plan agree with the selected configuration.

### Goal 2 — Freeze intention at the moment cooking begins

Starting a run creates a trustworthy historical record of what the cook intended to do.

Success means later recipe edits or configuration changes cannot rewrite that history.

### Goal 3 — Make prep explicit

The cook should not discover chopping, peeling, measuring, or equipment setup only after cooking has already begun.

Success means required prep appears before heating/cooking unless the recipe explicitly defines interleaving.

### Goal 4 — Keep orientation during execution

The cook can always answer:

- What stage am I in?
- What step am I on?
- What did I just do?
- What comes next?
- What ingredients did I plan to use?
- How do I get back to the active run?

### Goal 5 — Capture reality without making cooking bureaucratic

Recording a substitution or skipped ingredient should be faster than writing a diary.

Success means common deviations have structured quick actions, with freeform notes available when needed.

### Goal 6 — Preserve learning

Cook Run evidence can inform future recipe changes without automatically mutating the recipe.

---

## 5. Interaction risks and mitigations

### Risk — configuration overload

If every ingredient exposes multiple controls by default, the recipe becomes a settings form instead of a cooking document.

**Mitigation:** Show controls only for authored meaningful choices. Keep simple ingredients simple. Prefer progressive disclosure for secondary options.

### Risk — hidden state

If ingredient text says one thing while a control silently changes the actual run, users cannot trust the page.

**Mitigation:** The primary ingredient presentation must update to reflect the selected form, quantity, inclusion state, and relevant prep.

### Risk — recipe/run ambiguity

Users may not understand whether a change modifies the reusable recipe or only this cooking session.

**Mitigation:** Before run = configure recipe for this run. After Start Cook Run = record what actually happened. Use different language and presentation.

### Risk — treating all omissions as safe

Some ingredients can be omitted with little effect; others are structurally important.

**Mitigation:** Recipe authors explicitly define supported omission. A run can still record an unsupported skip, but the configuration UI should not imply every ingredient is safely optional.

### Risk — false precision in timing

Preparation speed varies substantially by cook, quantity, equipment, mobility, and familiarity.

**Mitigation:** Use recipe-authored approximate active-time estimates or ranges. Do not pretend the system can universally predict exact prep duration.

### Risk — authored alternative versus ad-hoc substitution

A tested alternative is different from “this is what I happened to have.”

**Mitigation:** Authored alternatives live in Recipe configuration. Ad-hoc substitutions live in Cook Run evidence until deliberately promoted.

### Risk — too much medical-warning language

Frequent alerts can create anxiety and imply universal medical rules.

**Mitigation:** Advisories remain small, contextual, profile-aware, and non-alarmist. Explicit profile choices outrank generic mapping advisories.

### Risk — changes during a run invalidate later steps

A substitution may affect future instructions.

**Mitigation for current MVP:** Record the deviation faithfully but do not promise automatic live replanning. Recipes with known authored alternatives can generate the correct plan before Start Cook Run. Live replanning is a later capability requiring explicit rules.

### Risk — kitchen interaction cost

Hands may be wet/dirty, attention divided, phone screen small, and timers/processes may be active.

**Mitigation:** Large targets, minimal typing for common changes, persistent orientation, simple previous/next navigation, and text labels in addition to icons.

### Risk — interruption / re-entry

The cook may lock the phone, leave the page, or return after an interruption.

**Mitigation:** Run state and current position are persistent data, not transient component state. Resume behavior should become an explicit follow-on validation item.

---

## 6. Decisions for the next implementation slice

1. Keep the current snapshot architecture.
2. Do not add more generic configuration controls until Recipe 0002 demonstrates a concrete need.
3. Replace the generic “Type + textarea” deviation experience incrementally with structured quick actions.
4. Start with the highest-value structured actions:
   - Substitute ingredient;
   - Skip ingredient;
   - Add ingredient;
   - Change amount;
   - Change setting/prep;
   - Observation.
5. Preserve freeform notes as a fallback.
6. Do not implement automatic mid-run recipe replanning in this slice.
7. Keep the active-run Recipe view read-only with respect to the frozen snapshot; run changes are recorded as evidence.
8. Treat mobile/kitchen usability as a validation requirement before visual polish.
9. Defer iconography until the interaction hierarchy is validated with text.

---

## 7. Owner review questions for the first UX prototype

The next browser review should answer:

1. Do ingredient controls feel like part of the recipe rather than a settings panel?
2. Is it obvious which ingredients are optional versus simply changeable?
3. Does the selected ingredient form read naturally in the main ingredient list?
4. Is the prep estimate useful without feeling overly precise?
5. Does Start Cook Run feel like a clear transition from planning to execution?
6. Is Prep-first sequencing natural?
7. Can the cook inspect the full recipe and confidently return to the same run?
8. Is recording a substitution materially faster than writing a note?
9. Is the distinction between planned recipe and actual run understandable without explanation?
10. On mobile, can the cook operate the primary controls comfortably in a real kitchen context?


---

## 8. Owner review findings — persistent recipe context, estimates, and persistence

The first owner browser review exposed several interaction requirements that supersede the assumption that a separate View Recipe action is sufficient during Cook Mode.

### Cook Mode keeps recipe context visible

On layouts with sufficient width, the active instruction and recipe context should coexist.

The preferred desktop pattern is:

- primary active instruction/work area;
- a recipe-context panel/rail to the right.

Mobile should preserve the same information hierarchy through a compact, collapsible, drawer, or stacked treatment rather than trying to maintain a desktop two-column layout.

### Prep uses the ingredient list as progress/navigation

During Prep:

- the recipe-context area is ingredient-oriented;
- ingredients/prep items appear in preparation order;
- the current item is highlighted;
- completed prep items are visibly checked off;
- selecting **Next step** marks the current prep item complete and advances;
- completed state must be persistent run state, not merely a transient visual effect;
- where multiple prep operations belong to one ingredient, the UI should preserve enough structure to show what remains.

The goal is to let the cook answer, at a glance, **what ingredient am I preparing, what is already ready, and what comes next?**

### Cook uses an interactive step outline

During Cook:

- the recipe-context area switches from ingredient-oriented prep progress to cooking-step orientation;
- every cooking step has a concise excerpt;
- the active step is highlighted and expanded;
- inactive steps remain compact but interactive;
- selecting another step jumps the run to that step and expands it;
- moving with Previous / Next updates the same persistent run position.

The current full instruction remains the primary work surface; the outline is orientation and navigation.

### Estimated conversions are allowed when explicitly framed

Recipe-authored and verified conversions remain preferred.

However, when a user asks for an alternate unit or practical substitution and no verified conversion exists, Curadh Cooking may provide a **relative, unverified estimate** when useful.

Requirements:

- label it clearly as an estimate;
- explain that ingredient size, density, brand, preparation, or packing can change the result when relevant;
- never silently promote an estimated conversion into canonical recipe data;
- allow later kitchen evidence to verify or replace the estimate.

The product should prefer **useful uncertainty** over refusing to help when an approximate answer is appropriate.

### Tolerance notices

Sensitivity messaging should default to **tolerance-awareness guidance**, not medical-warning language.

A useful pattern is:

> Be aware of tolerance: this ingredient or form may work differently for different profiles. Omit or substitute it when it does not fit the selected profile.

Specific sourced considerations may still be shown, but the UI should not imply diagnosis or universal safety/unsafety.

### Cook Run persistence and recovery

A successfully recorded run event must be durable.

For the current local MVP:

- Cook Runs and run events are stored in the local SQLite database;
- browser refresh, server restart, or navigation must not make an active run effectively unreachable;
- the app needs an **active run recovery/resume path**;
- persisted current step, completed prep/step progress, frozen snapshot, and recorded deviations must be restored.

A failed save must produce visible error feedback. Silent failure is unacceptable during cooking.

### Structured change prototype finding

The first structured change prototype exposed a schema/persistence defect: newly added action types such as **Add** were accepted by the frontend contract but rejected by the older SQLite CHECK constraint.

The fix must:

- migrate the stored event-type constraint;
- test every supported structured action type;
- surface server persistence errors visibly;
- preserve successfully recorded events through active-run recovery.


### Run-note correction and navigation placement

Owner review added three concrete requirements:

- every run note/change is bound to the exact generated run step where it was recorded;
- an existing run note can be edited, have its type corrected, or be deleted without changing the frozen Recipe/Run plan;
- Previous / Next navigation is repeated immediately after the run-note area, before Finish Cook Run, because that is where attention naturally lands after entering feedback.

When a note is edited from a later point in the run, the original step association remains intact unless a future explicit move-note interaction is designed.
