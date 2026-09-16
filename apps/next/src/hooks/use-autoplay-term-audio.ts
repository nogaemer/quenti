import React from "react";
import { create } from "zustand";

/**
 * useAutoplayTermAudio
 * ---------------------
 * Automatically plays the word-side audio for a term whenever the term or
 * the study outcome changes. Only one clip (an <audio> element or a
 * SpeechSynthesisUtterance) is ever active at once - a new play request
 * cancels whatever is currently playing first.
 *
 * Autoplay-enabled state is stored in a small Zustand store so it can be
 * shared across the app (e.g. a settings toggle in a header) without prop
 * drilling, but it can also be overridden per-call via the `autoplayEnabled`
 * option for components that manage their own mute state.
 *
 * Browsers block audio/TTS playback until the user has interacted with the
 * page at least once. Call `unlock()` (exported here, and also returned
 * from the hook) from the first click/keydown listener in the session -
 * e.g. in a top-level layout `useEffect` - to prime playback. Until then,
 * play attempts that get rejected by the browser are swallowed silently
 * instead of throwing.
 */

export type TermAudioOutcome = "correct" | "incorrect" | "skipped";

export interface AutoplayTerm {
  wordAudioUrl?: string | null;
  definitionAudioUrl?: string | null;
  /** Word text, used as the TTS fallback when no audio URL is present. */
  word?: string | null;
  /** BCP-47 language code for the TTS fallback, e.g. "es-ES", "de-DE". */
  wordLang?: string | null;
}

interface AudioAutoplayState {
  autoplayEnabled: boolean;
  unlocked: boolean;
  setAutoplayEnabled: (enabled: boolean) => void;
  unlock: () => void;
}

/**
 * Shared Zustand store for autoplay/mute state. Consumers can read
 * `autoplayEnabled` directly (e.g. for a settings switch) or let
 * `useAutoplayTermAudio` read it internally by omitting the
 * `autoplayEnabled` option.
 */
export const useAudioAutoplayStore = create<AudioAutoplayState>((set) => ({
  autoplayEnabled: true,
  unlocked: false,
  setAutoplayEnabled: (enabled) => set({ autoplayEnabled: enabled }),
  unlock: () => {
    if (typeof window === "undefined") return;

    // Prime the HTMLMediaElement autoplay gate with a near-silent, near-zero
    // length clip played synchronously inside the user gesture.
    try {
      const primer = new Audio(
        "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
      );
      primer.volume = 0;
      void primer.play().catch(() => undefined);
    } catch {
      // Ignore - some browsers may not support the data URI or Audio ctor.
    }

    // Priming SpeechSynthesis just requires having been called once inside
    // a user gesture; an empty utterance is enough on most engines.
    try {
      if (window.speechSynthesis) {
        const primer = new SpeechSynthesisUtterance("");
        window.speechSynthesis.speak(primer);
        window.speechSynthesis.cancel();
      }
    } catch {
      // Ignore.
    }

    set({ unlocked: true });
  },
}));

/** Module-level singleton so only one clip ever plays across the whole app. */
let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

function stopCurrentPlayback() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio = null;
  }
  if (currentUtterance) {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    currentUtterance = null;
  }
}

function playUrl(url: string) {
  stopCurrentPlayback();

  const audio = new Audio(url);
  currentAudio = audio;

  audio.onended = () => {
    if (currentAudio === audio) currentAudio = null;
  };
  audio.onerror = () => {
    if (currentAudio === audio) currentAudio = null;
  };

  // Don't throw on autoplay-block rejections; just drop the clip.
  audio.play().catch(() => {
    if (currentAudio === audio) currentAudio = null;
  });
}

function playTts(text: string, lang: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  stopCurrentPlayback();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  currentUtterance = utterance;

  utterance.onend = () => {
    if (currentUtterance === utterance) currentUtterance = null;
  };
  utterance.onerror = () => {
    if (currentUtterance === utterance) currentUtterance = null;
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch {
    // Some browsers throw synchronously if speech is blocked; swallow it.
    currentUtterance = null;
  }
}

export interface UseAutoplayTermAudioOptions {
  /**
   * Overrides the shared store's autoplayEnabled flag for this call site.
   * Omit to read from `useAudioAutoplayStore` instead.
   */
  autoplayEnabled?: boolean;
}

export interface UseAutoplayTermAudioResult {
  /** Manually (re)play the current term's word-side audio. */
  play: () => void;
  /** Cancel whatever clip is currently playing. */
  cancel: () => void;
  /** Call on the first user click/keypress in the session to unlock audio. */
  unlock: () => void;
  autoplayEnabled: boolean;
}

export function useAutoplayTermAudio(
  term: AutoplayTerm | null | undefined,
  outcome: TermAudioOutcome | null | undefined,
  options?: UseAutoplayTermAudioOptions,
): UseAutoplayTermAudioResult {
  const storeAutoplayEnabled = useAudioAutoplayStore((s) => s.autoplayEnabled);
  const storeUnlock = useAudioAutoplayStore((s) => s.unlock);

  const autoplayEnabled =
    options?.autoplayEnabled !== undefined
      ? options.autoplayEnabled
      : storeAutoplayEnabled;

  const play = React.useCallback(() => {
    if (!term) return;

    if (term.wordAudioUrl) {
      playUrl(term.wordAudioUrl);
      return;
    }

    if (term.wordLang && term.word) {
      playTts(term.word, term.wordLang);
    }
  }, [term]);

  const cancel = React.useCallback(() => {
    stopCurrentPlayback();
  }, []);

  // Autoplay whenever the term or outcome changes.
  React.useEffect(() => {
    if (!autoplayEnabled) return;
    if (!term) return;
    if (!outcome) return;

    play();

    return () => {
      // A new term/outcome (or unmount) should cut off the previous clip.
      stopCurrentPlayback();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, outcome, autoplayEnabled]);

  return {
    play,
    cancel,
    unlock: storeUnlock,
    autoplayEnabled,
  };
}
