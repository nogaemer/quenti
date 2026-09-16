import { z } from "zod";

export const ZAddSchema = z.object({
  studySetId: z.string(),
  term: z.object({
    rank: z.number().min(0),
    word: z.string(),
    definition: z.string(),
    wordRichText: z.string().optional(),
    definitionRichText: z.string().optional(),
    wordAudioUrl: z.string().optional(),
    definitionAudioUrl: z.string().optional(),
    exampleSentence: z.string().optional(),
  }),
});

export type TAddSchema = z.infer<typeof ZAddSchema>;
