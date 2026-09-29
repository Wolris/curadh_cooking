# MVP Domain Model — Initial

This is the minimum domain shape justified by Recipe 0001 and the accepted Design Bible. It is intentionally smaller than the eventual product.

## Recipe

Current proven/recommended instructions.

Minimum fields:

- id
- slug
- title
- status: draft | tested | canonical
- summary
- known result summary
- known improvement opportunities
- canonicalVariantId
- createdAt
- updatedAt

## RecipeVariant

An intentional formula/process version.

Minimum fields:

- id
- recipeId
- label
- status
- notes
- yieldText
- createdAt

A Recipe points to the currently canonical Variant.

## Ingredient

Canonical ingredient identity.

Minimum fields:

- id
- canonicalName
- notes

Aliases, nutrition, detailed form taxonomy, and substitution graphs are deferred until additional recipes prove the need.

## VariantIngredient

One ingredient requirement in one Variant.

Minimum fields:

- variantId
- ingredientId
- quantityValue
- quantityUnit
- formText
- position
- optional

For MVP, quantityUnit may preserve human-friendly units such as cup, Tbsp, tsp, each. Do not force all user-facing recipes into grams.

## RecipeStep

Ordered cooking instruction.

Minimum fields:

- id
- variantId
- position
- instruction
- stageKey (optional)

## Equipment

Reusable kitchen tool/appliance identity.

Minimum fields:

- id
- name

## VariantEquipmentSetting

Known/recommended setting for a Variant.

Examples from Recipe 0001:

- Breadman program = White
- crust = Light
- loaf size = 1.5 lb

Minimum fields:

- variantId
- equipmentId
- settingKey
- settingValue

## CookRun

One actual execution.

Minimum fields:

- id
- recipeId
- variantId
- profileId (nullable during early MVP)
- status: active | completed | abandoned
- startedAt
- completedAt
- currentStepId (nullable)
- notes

## CookRunEvent

Chronological evidence from a run.

Use one event stream rather than inventing a table for every early observation type.

Minimum fields:

- id
- cookRunId
- stepId (nullable)
- eventType: observation | substitution | setting-change | intervention | note
- text
- structuredDataJson (nullable)
- createdAt

Examples:

- batter thicker than prior run;
- mixer blade removed at first rest;
- no additional milk added;
- butter applied to all six sides.

## ResultMarker

Defines a result dimension meaningful to a Recipe.

Minimum fields:

- id
- recipeId
- key
- label
- description
- position

Recipe 0001 examples:

- moisture
- flexibility
- density-lightness
- flavor
- height-rise
- crust
- sandwich-use

Do not assume every recipe uses the same markers.

## CookRunResult

One run's evidence for one ResultMarker.

Minimum fields:

- cookRunId
- resultMarkerId
- outcome: hit | mixed | miss | not-observed
- note

This keeps "height could improve" separate from "recipe failed."

## Profile

A person's cooking-related configuration.

Minimum fields for the initial model:

- id
- displayName
- notes
- createdAt
- updatedAt

Real private Profile records belong in the runtime database, never seed fixtures committed to this public repository.

## Mapping

A named dietary/sensitivity framework.

Minimum fields:

- id
- key
- name
- sourceLabel
- sourceUrl
- versionLabel
- notes

## ProfileMapping

Connects a Profile to a Mapping.

Do not lock a complicated numeric strictness score yet.

Minimum fields:

- profileId
- mappingId
- mode: advisory | preferred

Explicit ingredient overrides remain authoritative.

## ProfileIngredientRule

Personal ingredient-level rule.

Minimum fields:

- profileId
- ingredientId
- stance: avoid | caution | allow | prefer
- note

## MappingIngredientRule

Evidence from a Mapping.

Minimum fields:

- mappingId
- ingredientId
- stance: avoid | caution | allow
- conditionText
- confidenceText
- sourceNote

These rules are advisory inputs, not universal medical truth.

## PantryItem

Simple ingredients-on-hand context.

Minimum fields:

- ingredientId
- available
- note

Precise inventory quantities/expiration are deferred.

## First vertical slice

Prove this loop end to end with Recipe 0001:

**Recipe library -> Oatmeal Sandwich Bread -> Start Cook Run -> step through Cook Mode -> record an observation/deviation -> finish -> record result markers -> view the saved Cook Run in Recipe history.**

The first slice deliberately does not require:

- external recipe search;
- external AI;
- full Profile/Mapping UI;
- public sharing;
- sophisticated pantry inventory;
- nutrition databases.

Those can build on the proven Recipe/Cook Run foundation.
