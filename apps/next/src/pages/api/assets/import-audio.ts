import { PutObjectCommand } from "@aws-sdk/client-s3";
import jwt from "jsonwebtoken";
import type { NextApiRequest, NextApiResponse } from "next";

import { getServerAuthSession } from "@quenti/auth";
import { env } from "@quenti/env/server";
import { ASSETS_BUCKET, S3 } from "@quenti/images/server";

// adjust to your actual authOptions path

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_BYTES = 5 * 1024 * 1024; // 5MB per clip is generous for word-level audio
const ALLOWED_CONTENT_TYPES = new Set(["audio/mpeg", "audio/mp3"]);

async function readBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of req) {
    total += (chunk as Buffer).length;
    if (total > MAX_BYTES) throw new Error("PAYLOAD_TOO_LARGE");
    chunks.push(chunk as Buffer);
  }

  return Buffer.concat(chunks);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", "PUT");
    return res.status(405).end();
  }

  if (!S3) {
    return res.status(503).json({ error: "Asset storage is not configured." });
  }

  const session = await getServerAuthSession({ req, res });
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  if (!token) {
    return res.status(401).json({ error: "Missing upload token" });
  }

  let key: string;
  try {
    const payload = jwt.verify(token, env.QUENTI_ENCRYPTION_KEY) as {
      sub: string;
    };
    key = payload.sub;
  } catch {
    return res.status(401).json({ error: "Invalid or expired upload token" });
  }

  // Defense in depth: the JWT already proves the key was minted for this
  // import, but double-check the caller owns the userId segment of it.
  if (!key.startsWith(`assets/${session.user.id}/imports/`)) {
    return res.status(403).json({ error: "Token does not match caller" });
  }

  const contentType = req.headers["content-type"] ?? "";
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return res.status(415).json({ error: "Unsupported audio content type" });
  }

  let body: Buffer;
  try {
    body = await readBody(req);
  } catch {
    return res.status(413).json({ error: "File too large" });
  }

  await S3.send(
    new PutObjectCommand({
      Bucket: ASSETS_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return res.status(200).json({ key });
}
