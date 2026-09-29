import { z } from "zod";

export const cookRunEventTypeSchema = z.enum([
  "observation",
  "substitution",
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

export const startCookRunSchema = z.object({
  recipeId: z.string().min(1),
  variantId: z.string().min(1)
});

export const updateCookRunSchema = z.object({
  currentStepId: z.string().min(1).nullable()
});

export const createCookRunEventSchema = z.object({
  stepId: z.string().min(1).nullable().optional(),
  eventType: cookRunEventTypeSchema,
  text: z.string().trim().min(1),
  structuredData: z.record(z.string(), z.unknown()).optional()
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
export type ResultOutcome = z.infer<typeof resultOutcomeSchema>;
