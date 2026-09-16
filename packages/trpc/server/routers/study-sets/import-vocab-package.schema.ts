import { z } from "zod";

export const ZImportTermSchema = z.object({
  lektion: z.string().min(1).max(255),
  lektionsTeil: z.string().min(1).max(255),
  matId: z.string().min(1).max(255),
  word: z.string().max(1000),
  definition: z.string().max(1000),
  exampleSentence: z.string().max(500).nullable(),
  wordAudioFilename: z.string().max(255).nullable(),
});

export const ZImportVocabPackageSchema = z.object({
  bookTitle: z.string().min(1).max(255),
  terms: z.array(ZImportTermSchema).min(1).max(2000),
  // wordAudioFilename -> S3 key returned by the import-audio upload endpoint
  audioKeys: z.record(z.string(), z.string()),
});

export type TImportTermSchema = z.infer<typeof ZImportTermSchema>;
export type TImportVocabPackageSchema = z.infer<
  typeof ZImportVocabPackageSchema
>;
