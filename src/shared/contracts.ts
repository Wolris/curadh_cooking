import { z } from "zod";

export const cookRunEventTypeSchema = z.enum([
  "observation",
  "substitution",
  "ingredient-skip",
  "ingredient-add",
  "amount-change",
  "setting-change",
  "intervention",
  "note"
]);

export const resultOutcomeSchema = z.enum([
  "hit",
  "mixed",
  "miss",
  "not-observed"
]);

export const recipeSelectionValueSchema = z.union([z.string(), z.boolean()]);

export const startCookRunSchema = z.object({
  recipeId: z.string().min(1),
  variantId: z.string().min(1),
  selections: z.record(z.string(), recipeSelectionValueSchema).optional()
});

export const updateCookRunSchema = z.object({
  currentStepId: z.string().min(1).nullable().optional(),
  currentStepKey: z.string().min(1).nullable().optional()
}).refine(
  (value) => value.currentStepId !== undefined || value.currentStepKey !== undefined,
  { message: "A current step identifier is required" }
);

export const createCookRunEventSchema = z.object({
  stepId: z.string().min(1).nullable().optional(),
  runStepKey: z.string().min(1),
  eventType: cookRunEventTypeSchema,
  text: z.string().trim().min(1),
  structuredData: z.record(z.string(), z.unknown()).optional()
});

export const updateCookRunEventSchema = z.object({
  eventType: cookRunEventTypeSchema,
  text: z.string().trim().min(1),
  runStepKey: z.string().min(1)
});

export const completeCookRunSchema = z.object({
  results: z.array(
    z.object({
      resultMarkerId: z.string().min(1),
      outcome: resultOutcomeSchema,
      note: z.string().trim().optional()
    })
  ).min(1)
});

export type CookRunEventType = z.infer<typeof cookRunEventTypeSchema>;
export type RecipeSelectionValue = z.infer<typeof recipeSelectionValueSchema>;
export type ResultOutcome = z.infer<typeof resultOutcomeSchema>;
