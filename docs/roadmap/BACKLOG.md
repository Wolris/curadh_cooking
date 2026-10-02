# BACKLOG

Approved future work not currently active.

## Product/model

- Profile model with adjustable named mappings;
- ingredient-level overrides: hard avoid, soft concern, accepted exception, preference, unknown;
- provenance/confidence for mapping rules;
- context-aware ingredient rules where needed;
- substitution relationships and user-approved substitutions;
- nutrition representation without conflating nutrition with sensitivity fit;
- shared Cook Run evidence from invited friends/household members without requiring a public social network.

## Recipe experience

- personal recipe library;
- concise recipe detail with no narrative filler;
- ingredient lookup;
- search by ingredients on hand;
- desired-result qualities;
- time filter;
- tool/equipment filter;
- profile-fit explanation;
- substitution suggestions;
- Recipe / Variant / Cook Run / Result history;
- compare future runs against known successful result markers;
- experiment/variant promotion flow.

## Cook Mode

- step/stage state;
- timers/checkpoints;
- equipment/settings;
- substitutions/deviations;
- live observation capture;
- recipe-specific troubleshooting guidance;
- contextual rescue suggestions;
- outcome/result capture;
- later freeform contextual reasoning assistant using recipe + run + profile context.

## Discovery

- external recipe search;
- normalize useful recipe facts while preserving source attribution/link;
- compare discovered recipes against a profile;
- avoid republishing substantial copyrighted narrative/source prose.

## Engineering / operations

- local/internal deployment;
- private profile storage;
- authentication only when needed;
- backup/export strategy;
- validation tooling;
- future reasoning-provider abstraction if/when external AI is introduced.

## Deferred growth

- public accounts;
- public social-network/community features;
- automatic meal planning;
- grocery-list/purchasing integrations;
- paid nutrition/sensitivity data sources.


## Identity, persistence, and profile foundation

This is approved future foundation work after the current Cook Run interaction is proven locally.

Keep these concepts separate:

- **Account / auth identity** — who can sign in;
- **Cooking Profile** — ingredient tolerances, mappings, overrides, preferences, nutrition considerations;
- **Kitchen Profile** — available equipment, preferred units, preparation defaults, and later pantry/context;
- **Cook Run actor/ownership** — who performed and owns a run;
- **Recipe/library ownership** — personal/shared recipe data.

Planned sequence:

1. prove Profile and Kitchen Profile domain models locally;
2. attach Cook Runs and recipe/library data to explicit owners/profiles;
3. choose hosted persistence/sync architecture for multi-device use;
4. add authentication, with Google sign-in as an intended option;
5. add session/account lifecycle;
6. add versioned Terms of Use / Privacy Policy acceptance before public account use;
7. support data export, deletion, and backup/recovery;
8. later support invited household/shared access without requiring a public social network.

Do not make Google identity itself the Cooking Profile or Kitchen Profile.
