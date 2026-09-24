import { prisma } from "@quenti/prisma";
import { Prisma, type Term } from "@quenti/prisma/client";

export const bulkUpdateTerms = async (
  terms: Pick<
    Term,
    | "id"
    | "word"
    | "definition"
    | "wordRichText"
    | "definitionRichText"
    | "rank"
    | "wordAudioUrl"
    | "definitionAudioUrl"
    | "exampleSentence"
  >[],
  studySetId: string,
) => {
  const vals = terms.map((term) => [
    term.id,
    term.word,
    term.definition,
    term.wordRichText,
    term.definitionRichText,
    term.rank,
    term.wordAudioUrl,
    term.definitionAudioUrl,
    term.exampleSentence,
    studySetId,
  ]);

  const formatted = vals.map((x) => Prisma.sql`(${Prisma.join(x)})`);
  const query = Prisma.sql`
    INSERT INTO Term (id, word, definition, wordRichText, definitionRichText, \`rank\`, wordAudioUrl, definitionAudioUrl, exampleSentence, studySetId)
    VALUES ${Prisma.join(formatted)}
      ON DUPLICATE KEY UPDATE word = VALUES(word), definition = VALUES(definition), wordRichText = VALUES(wordRichText), definitionRichText = VALUES(definitionRichText), wordAudioUrl = VALUES(wordAudioUrl), definitionAudioUrl = VALUES(definitionAudioUrl), exampleSentence = VALUES(exampleSentence)
  `;

  await prisma.$executeRaw(query);
};
