# ACTIVE TODO

## Current phase

**MVP implementation — recipe library + Cook Run evidence.**

## CURRENT EXECUTION LOCK

**RECONCILE OWNER REVIEW INTO A PERSISTENT, RECIPE-ORIENTED COOK MODE.**

Branch:

- `feature/recipe-0002-chicken-soup`
- Recipe 0002 remains **Draft**;
- no further kitchen validation until this lock reaches owner-review readiness.

### Verified foundation already implemented

- configurable Recipe 0002 ingredient/form/prep choices;
- frozen Cook Run configuration snapshot;
- prep-first generated run;
- omission-aware generated instructions;
- previous/next run navigation;
- active-run Recipe inspection/return path;
- structured quick-action prototype for Observation, Substitute, Skip, Add, Amount, and Setting / prep;
- local SQLite persistence for Cook Runs/events.

### Owner-review findings now controlling this lock

1. **Fix structured event persistence.**
   - migrate SQLite event-type constraints so every supported structured action can save;
   - specifically prove Add with the reported `1 tsp garlic powder` example;
   - surface save failures in the UI instead of silently doing nothing.

2. **Add persistent Recipe context inside Cook Mode.**
   - desktop: recipe context visible to the right of the active instruction;
   - mobile: compact/collapsible equivalent rather than forced two-column layout.

3. **Prep context becomes a persistent ingredient/prep checklist.**
   - preparation-order list;
   - current item highlighted;
   - completed items checked;
   - Next step marks the current prep item complete and advances;
   - completion survives refresh/re-entry.

4. **Cook context becomes an interactive step outline.**
   - concise excerpt for every cooking step;
   - current step highlighted and expanded;
   - inactive steps compact;
   - selecting an excerpt jumps to that run step;
   - Previous / Next and direct-jump navigation remain synchronized.

5. **Implement active Cook Run recovery.**
   - detect/recover an active local run after refresh/re-entry;
   - restore frozen snapshot, current step, completed progress, and run events;
   - do not require re-entering successfully saved feedback.

6. **Refine conversions/substitution assistance.**
   - verified/authored conversion remains preferred;
   - when explicitly requested, allow a clearly labeled relative/unverified estimate;
   - explain uncertainty where ingredient size/density/form matters;
   - estimated values do not silently become canonical recipe data.

7. **Refine sensitivity messaging.**
   - default to small **be aware of tolerance** notices;
   - keep profile-specific omission/substitution actionable;
   - do not frame advisories as universal medical safety warnings.

8. **Complete structured live-change interaction.**
   - preserve quick actions: Observation, Substitute, Skip, Add, Amount, Setting / prep;
   - freeform detail remains available;
   - every run note/change is tied to the exact generated run step where it was recorded, including Prep steps;
   - allow an existing run note/change to be **edited**, including changing its type;
   - allow an existing run note/change to be **deleted**;
   - editing/deleting changes Cook Run evidence only and never rewrites the frozen Recipe snapshot;
   - duplicate Previous / Next navigation immediately after the run-note area so the likely next action is available where attention already is;
   - keep Finish Cook Run visually and behaviorally distinct from ordinary step progression;
   - ingredient pickers/quantity structure may be added only where they lower cooking friction;
   - no generalized automatic mid-run replanning yet.

9. **Validate the complete owner-review story.**
   Automated:
   - all structured event types persist;
   - active run recovery works;
   - prep completion persists;
   - direct step jump persists/synchronizes;
   - Recipe 0001 remains green.
   
   Owner browser review:
   - desktop context rail;
   - mobile/kitchen-scale treatment;
   - prep checklist behavior;
   - cooking-step outline behavior;
   - structured change capture;
   - tolerance notice tone;
   - estimated-conversion presentation.

10. **Resume Recipe 0002 kitchen validation only after owner UI approval.**
    - complete a real Cook Run;
    - record result markers;
    - reconcile evidence;
    - status promotion remains explicit.

### Implementation progress after owner review

Implemented and automated:

- structured Add / Skip / Amount / Substitute / Setting-prep / Observation event types persist through SQLite migrations;
- run-note save failures surface visibly;
- every new run note is bound to a validated generated run-step key, including Prep steps;
- run notes can be edited, reclassified, and deleted without altering the frozen Recipe/Run plan;
- Previous / Next navigation is repeated below run notes, before Finish Cook Run;
- Cook Mode now includes a persistent recipe-context rail on wide layouts and a stacked equivalent on narrower layouts;
- Prep context shows preparation-order items, highlights the current item, and checks completed items;
- Next step persists completion before advancing;
- Cook context shows compact step excerpts, expands the active step, and supports direct step jumping;
- active local Cook Runs recover after refresh/re-entry with snapshot, current position, completed progress, and saved notes;
- prepared-parsley alternate units are explicitly labeled as an unverified estimate;
- ingredient advisories use tolerance-awareness language rather than universal medical-warning language.

Automated coverage proves:

- invalid run-note step associations are rejected;
- note type correction and deletion work;
- Prep completion survives refresh;
- saved run notes survive refresh;
- active run recovery restores the correct step;
- direct Cook-step jump synchronizes the run position;
- Recipe 0001 remains green.

Next gate under this same lock:

- owner browser review of desktop and mobile/kitchen-scale behavior;
- reconcile owner findings;
- only then resume Recipe 0002 kitchen validation.

### Supporting UX owner

`docs/design/COOK_RUN_UX_DEFINITION.md` owns the detailed task flow, state matrix, low-fidelity states, review findings, and risks for this lock.

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
