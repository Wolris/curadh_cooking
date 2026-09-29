# Repository Rules

These rules are mandatory for any AI assistant, coding agent, or automation working in this repository.

## 1. Project owner and authority

- Project owner: Jim.
- Jim's latest explicit direction controls intent and priority.
- Do not substitute a diet ideology, generic wellness rule, or named sensitivity framework for Jim's stated product intent.
- Do not maintain competing canonical versions of the same decision.

Canonical owners:

- `AGENTS.md` — repository and agent rules.
- `docs/design/DESIGN_BIBLE.md` — canonical product/design truth.
- `docs/roadmap/ACTIVE_TODO.md` — sole current execution queue.
- `docs/roadmap/PROCESS.md` — task lifecycle.
- `docs/roadmap/BACKLOG.md` — approved future work.
- `docs/PROJECT_STATUS.md` — concise current-state / fresh-chat memory.
- `docs/architecture/` — accepted architecture decisions.
- `recipes/` — recipe evidence and approved recipe records.

## 2. Startup and execution lock

When task state is unknown, stale, or materially changed:

1. read fresh `docs/roadmap/ACTIVE_TODO.md`;
2. recover exactly one `CURRENT EXECUTION LOCK`;
3. load only the specific Design Bible section, ADR, recipe evidence, or source material needed for that lock;
4. execute the lock rather than stopping at discovery when the next safe step is available.

A response may stop when:

- the atomic lock is complete;
- Jim must make a genuine product/recipe decision;
- a manual cooking/taste/tolerance test is required;
- a permission or safety boundary blocks continuation; or
- bounded recovery establishes a concrete blocker.

## 3. Scope and roadmap discipline

- Keep exactly one current execution lock.
- Do not create a second active queue in issues, chat, README, or another document.
- New approved future work goes to `BACKLOG.md` unless Jim explicitly promotes it.
- Do not silently weaken or remove a named requirement.
- Do not opportunistically redesign unrelated parts of the product.
- Completion of one lock does not imply completion of its parent feature.

## 4. Product fidelity

Preserve these principles:

- Personalization is more important than compliance with a named diet.
- Named mappings are starting points, not commandments.
- A person's explicit ingredient-level setting overrides a mapping default.
- The model must be able to represent hard avoids, soft concerns, accepted exceptions, preferences, and unknowns.
- Recipe fit must be explainable at ingredient level.
- Preparation, quantity, brand/form, storage/freshness, and substitutions may matter and must not be erased by an overly simple tag model.
- Recipe presentation prioritizes cooking information over narrative filler.
- Tools and time are first-class recipe constraints.
- Nutrition and sensitivity information must remain distinguishable from taste preference.

If implementation convenience conflicts with an accepted product principle, surface the conflict instead of silently changing the experience.

## 5. Health, safety, and privacy

- This project may organize food-sensitivity information, but it must not present itself as diagnosing, treating, or guaranteeing safety for a medical condition.
- Do not turn a mapping into a universal claim that an ingredient is safe or unsafe for everyone.
- Preserve source/provenance and uncertainty for sensitivity mappings.
- Do not commit real household diagnoses, symptom histories, medical records, private family notes, or identifiable personal food profiles.
- Use synthetic profiles and examples in repository fixtures/tests.
- Runtime secrets and private user data belong outside Git.

## 6. Recipe-source and copyright discipline

- External recipe discovery should preserve the original source and link.
- Store structured facts needed for cooking and product analysis: ingredient list, quantities when available, method summary, timing, yield, tools, and attribution.
- Do not copy an author's long narrative or republish substantial copyrighted recipe-page prose.
- Prefer original Curadh Cooking instructions when a recipe has been independently developed and tested here.

## 7. Data/model discipline

- Keep `Profile`, `Mapping`, `Ingredient`, `Recipe`, `Variant`, `Cook Run`, `Result evidence`, and recipe/profile fit as distinct concepts.
- A Recipe is the repeatable formula/instructions; a Cook Run is one actual execution. Do not overwrite one with the other.
- Canonical means current proven/recommended recipe, not perfected forever. Known improvement opportunities may coexist with Canonical status.
- A Variant is an intentional experiment/change and does not replace the canonical Recipe until evidence supports promotion.
- Preserve partial historical evidence without inventing missing recipe details.
- Named mappings provide defaults; explicit profile overrides take precedence.
- Do not reduce all sensitivities or cooking results to a single hidden score.
- Keep provenance/confidence available wherever a rule came from outside direct user preference.
- Do not infer a person's medical status from their food choices.
- Do not add external AI services, nutrition APIs, scraping infrastructure, accounts, or public sharing until a real requirement and architecture decision justify them.

## 8. Engineering style

- Bootstrap/product documentation may be committed directly to `main`.
- After bootstrap, use focused feature branches for implementation unless Jim explicitly directs otherwise.
- Favor small, focused changes and readable names over clever abstractions.
- Do not generalize a one-off pattern until at least two real consumers prove the abstraction.
- Use explicit schemas and typed contracts once implementation begins.
- No secrets in source.

## 9. Validation and evidence

A passing build proves only that the build passed.

For software behavior, use the smallest appropriate combination of unit, integration, component, browser, and manual validation.

For recipes:

- a drafted formula is not a tested recipe;
- a successful bake proves that batch worked, not that it is universally tolerated;
- Jim's reported cooking observations are evidence for recipe quality and process;
- tolerance/sensitivity results remain personal observations, not universal medical claims.

When handing manual recipe validation to Jim, provide exact quantities, method, expected visual/tactile cues, and a short reportable test matrix.

## 10. Git safety

- Never force-push, rewrite shared history, delete branches, tag releases, or create releases without explicit approval.
- Before updating an existing file through an API/connector, fetch its current content/SHA first.
- Do not merge implementation PRs without Jim's approval or an explicit repository rule that makes a clean validation result sufficient.

## 11. Fresh-chat continuity

- Prefer repository evidence over remembered chat narrative.
- A fresh chat should recover the project from `ACTIVE_TODO.md`, `PROJECT_STATUS.md`, the relevant Design Bible section, and only the necessary ADR/recipe record.
- Keep `PROJECT_STATUS.md` concise; it is project memory, not a transcript.
