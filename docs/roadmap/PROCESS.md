# Roadmap Process

## One-lock rule

`ACTIVE_TODO.md` owns exactly one `CURRENT EXECUTION LOCK`.

Do not run parallel implementation tracks unless Jim explicitly changes this rule.

## Lock lifecycle

### 1. Requirements / evidence

Gather only what is needed to execute the lock.

For a recipe, this can include:

- desired result;
- ingredient inventory;
- equipment;
- constraints;
- prior attempts;
- manual observations.

For software, this can include:

- relevant Design Bible section;
- accepted ADR;
- current source/tests;
- external source evidence when genuinely required.

### 2. Execute

Produce the smallest coherent artifact that can be validated.

### 3. Validate

Software validation should match the behavior changed.

Recipe validation should use a short kitchen test matrix and Jim's reported observations. A formula is not promoted to Canonical before owner approval.

### 4. Reconcile

Update the canonical artifact, close the lock, and promote exactly one successor when the next step is executable.

## Branching

Bootstrap documentation may land directly on `main`.

After bootstrap, implementation work should use focused feature branches unless Jim directs otherwise.

## Backlog

Approved future work that is not the current lock belongs in `BACKLOG.md`.
