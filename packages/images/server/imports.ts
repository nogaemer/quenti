import jwt from "jsonwebtoken";

import { env } from "@quenti/env/server";

/**
 * Deterministic key for an imported audio asset. Scoped per-user and
 * per-import so re-running an import (or two imports for different books)
 * never collides.
 */
export const getImportAssetKey = (
  userId: string,
  importId: string,
  filename: string,
) => `assets/${userId}/imports/${importId}/${encodeURIComponent(filename)}`;

export const getPresignedImportAssetJwt = (
  userId: string,
  importId: string,
  filename: string,
) => {
  if (!env.QUENTI_ENCRYPTION_KEY) return "";

  const key = getImportAssetKey(userId, importId, filename);

  return jwt.sign({ sub: key }, env.QUENTI_ENCRYPTION_KEY, {
    expiresIn: "120s",
  });
};

/**
 * No HeadObjectCommand round-trip here on purpose: unlike class/org logos,
 * we know the key exists the moment the upload endpoint accepted the PUT,
 * and doing a Head check per term (hundreds per import) would be wasteful.
 */
export const getImportAssetUrl = (key: string) =>
  `${env.ASSETS_BUCKET_URL}/${key}`;
