import type { StudySetAnswerMode } from "@quenti/prisma/client";

import type { AutoplayTerm } from "../hooks/use-autoplay-term-audio";

/**
 * Minimal shape needed to derive TermAudio / useAutoplayTermAudio props from
 * a studiable term. `StudiableTermWithDistractors` should satisfy this once
 * `wordAudioUrl` / `definitionAudioUrl` / `wordLang` / `definitionLang` exist
 * on the term model.
 */
export interface TermAudioSource {
  word?: string | null;
  definition?: string | null;
  wordAudioUrl?: string | null;
  definitionAudioUrl?: string | null;
  wordLang?: string | null;
  definitionLang?: string | null;
}

/**
 * A resolved Question's answerMode is always "Word" or "Definition" at
 * runtime - use-learn-store.ts's nextRound() rolls a set-level "Both" into
 * one of the two per-question when it builds the round timeline. The shared
 * Question type still declares answerMode as the full StudySetAnswerMode
 * though, so callers here just pass that type through and we normalize
 * defensively instead of forcing a cast at every call site.
 */
function normalize(answerMode: StudySetAnswerMode): "Word" | "Definition" {
  return answerMode === "Word" ? "Word" : "Definition";
}

/**
 * The prompt side is whatever ISN'T being asked for. If the user has to
 * answer with the Definition, the prompt shown is the Word/Term side, and
 * vice versa. Mirrors the label logic already in interaction-card.tsx.
 */
export function promptAudioProps(
  answerMode: StudySetAnswerMode,
  term: TermAudioSource,
) {
  const resolved = normalize(answerMode);
  return sideProps(resolved === "Definition" ? "word" : "definition", term);
}

/** The answer side is exactly the answerMode. */
export function answerAudioProps(
  answerMode: StudySetAnswerMode,
  term: TermAudioSource,
) {
  const resolved = normalize(answerMode);
  return sideProps(resolved === "Definition" ? "definition" : "word", term);
}

function sideProps(side: "word" | "definition", term: TermAudioSource) {
  if (side === "word") {
    return {
      wordAudioUrl: term.wordAudioUrl,
      word: term.word,
      wordLang: term.wordLang,
    };
  }
  return {
    definitionAudioUrl: term.definitionAudioUrl,
    definition: term.definition,
    definitionLang: term.definitionLang,
  };
}

/**
 * useAutoplayTermAudio only ever plays whatever is in the `word*` slot of
 * an AutoplayTerm - so to autoplay the ANSWER side (whichever side that is
 * for this question), we remap it into that slot here.
 */
export function answerAutoplayTerm(
  answerMode: StudySetAnswerMode,
  term: TermAudioSource,
): AutoplayTerm {
  if (normalize(answerMode) === "Definition") {
    return {
      wordAudioUrl: term.definitionAudioUrl,
      word: term.definition,
      wordLang: term.definitionLang,
    };
  }
  return {
    wordAudioUrl: term.wordAudioUrl,
    word: term.word,
    wordLang: term.wordLang,
  };
}
