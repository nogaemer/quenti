import { z } from "zod";

export const ZImportUploadTokenSchema = z.object({
  importId: z.string().cuid2(),
  filename: z.string().min(1).max(255),
});

export type TImportUploadTokenSchema = z.infer<typeof ZImportUploadTokenSchema>;
