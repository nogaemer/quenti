import {
  getImportAssetKey,
  getPresignedImportAssetJwt,
} from "@quenti/images/server";

import type { NonNullableUserContext } from "../../lib/types";
import type { TImportUploadTokenSchema } from "./import-upload-token.schema";

type ImportUploadTokenOptions = {
  ctx: NonNullableUserContext;
  input: TImportUploadTokenSchema;
};

/**
 * Mints a short-lived key + JWT for one audio file. The browser uploads
 * directly to /api/assets/import-audio with this token; matId/filename
 * mapping happens client-side before calling importVocabPackage.
 */
export const importUploadTokenHandler = async ({
  ctx,
  input,
}: ImportUploadTokenOptions) => {
  const userId = ctx.session.user.id;

  const key = getImportAssetKey(userId, input.importId, input.filename);
  const token = getPresignedImportAssetJwt(
    userId,
    input.importId,
    input.filename,
  );

  return { key, token };
};

export default importUploadTokenHandler;
