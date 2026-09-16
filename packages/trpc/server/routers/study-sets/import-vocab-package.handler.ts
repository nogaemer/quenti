import { getImportAssetUrl } from "@quenti/images/server";

import { TRPCError } from "@trpc/server";

import { MAX_TERM } from "../../common/constants";
import { profanity } from "../../common/profanity";
import type { NonNullableUserContext } from "../../lib/types";
import type { TImportVocabPackageSchema } from "./import-vocab-package.schema";

type ImportVocabPackageOptions = {
  ctx: NonNullableUserContext;
  input: TImportVocabPackageSchema;
};

type LessonKey = string;

interface LessonGroup {
  lektion: string;
  lektionsTeil: string;
  terms: TImportVocabPackageSchema["terms"];
}

const lessonKey = (lektion: string, lektionsTeil: string): LessonKey =>
  `${lektion}\u0000${lektionsTeil}`;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 200) || "book";

async function findOrCreateFolder(
  ctx: NonNullableUserContext,
  userId: string,
  title: string,
) {
  const existing = await ctx.prisma.folder.findFirst({
    where: { userId, title },
    select: { id: true },
  });
  if (existing) return existing.id;

  const baseSlug = slugify(title);
  let slug = baseSlug;

  for (let attempt = 0; attempt <= 5; attempt++) {
    try {
      const created = await ctx.prisma.folder.create({
        data: { userId, title, slug, description: "" },
        select: { id: true },
      });
      return created.id;
    } catch (e) {
      if (attempt === 5) throw e;
      slug = `${baseSlug}-${attempt + 1}`;
    }
  }

  // Unreachable, satisfies TS control-flow analysis.
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
}

async function findOrCreateStudySet(
  ctx: NonNullableUserContext,
  userId: string,
  folderId: string,
  title: string,
) {
  const existingLink = await ctx.prisma.studySetsOnFolders.findFirst({
    where: { folderId, studySet: { title, userId } },
    select: { studySetId: true },
  });
  if (existingLink) return existingLink.studySetId;

  const studySet = await ctx.prisma.studySet.create({
    data: {
      userId,
      title: title.slice(0, 255),
      description: "",
      created: true,
      cortexStale: true,
      folders: { create: { folderId } },
    },
    select: { id: true },
  });

  return studySet.id;
}

export const importVocabPackageHandler = async ({
  ctx,
  input,
}: ImportVocabPackageOptions) => {
  const userId = ctx.session.user.id;

  const groups = new Map<LessonKey, LessonGroup>();
  for (const term of input.terms) {
    const key = lessonKey(term.lektion, term.lektionsTeil);
    const group = groups.get(key);
    if (group) {
      group.terms.push(term);
    } else {
      groups.set(key, {
        lektion: term.lektion,
        lektionsTeil: term.lektionsTeil,
        terms: [term],
      });
    }
  }

  if (!groups.size) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No terms to import.",
    });
  }

  const folderId = await findOrCreateFolder(ctx, userId, input.bookTitle);

  const results: {
    lektion: string;
    lektionsTeil: string;
    studySetId: string;
    created: number;
    updated: number;
  }[] = [];

  for (const group of Array.from(groups.values())) {
    const setTitle = `${group.lektion} – ${group.lektionsTeil}`.slice(0, 255);
    const studySetId = await findOrCreateStudySet(
      ctx,
      userId,
      folderId,
      setTitle,
    );

    const matIds = group.terms.map((t) => t.matId);

    const { createdCount, updatedCount } = await ctx.prisma.$transaction(
      async (tx) => {
        const existing = await tx.term.findMany({
          where: { studySetId, externalId: { in: matIds } },
          select: { id: true, externalId: true },
        });
        const existingByExternalId = new Map(
          existing.map((t) => [t.externalId as string, t.id]),
        );

        let createdCount = 0;
        let updatedCount = 0;

        for (let i = 0; i < group.terms.length; i++) {
          const term = group.terms[i]!;
          const audioKey = term.wordAudioFilename
            ? input.audioKeys[term.wordAudioFilename]
            : undefined;
          const wordAudioUrl = audioKey ? getImportAssetUrl(audioKey) : null;

          const data = {
            word: profanity.censor(term.word.slice(0, MAX_TERM)),
            definition: profanity.censor(term.definition.slice(0, MAX_TERM)),
            exampleSentence: term.exampleSentence?.slice(0, 500) ?? null,
            wordAudioUrl,
            rank: i,
          };

          const existingId = existingByExternalId.get(term.matId);
          if (existingId) {
            await tx.term.update({ where: { id: existingId }, data });
            updatedCount++;
          } else {
            await tx.term.create({
              data: {
                ...data,
                studySetId,
                externalId: term.matId,
                authorId: userId,
              },
            });
            createdCount++;
          }
        }

        return { createdCount, updatedCount };
      },
    );

    results.push({
      lektion: group.lektion,
      lektionsTeil: group.lektionsTeil,
      studySetId,
      created: createdCount,
      updated: updatedCount,
    });
  }

  return results;
};

export default importVocabPackageHandler;
