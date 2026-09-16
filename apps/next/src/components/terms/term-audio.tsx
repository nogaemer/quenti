import React from "react";

import {
  ButtonGroup,
  HStack,
  IconButton,
  useColorModeValue,
} from "@chakra-ui/react";

import { IconVolume, IconVolume2 } from "@tabler/icons-react";

/**
 * TermAudio
 * ---------
 * Two speaker icon buttons for a vocabulary term: one for the word-side
 * audio, one for the definition-side audio. Each button plays either a
 * provided audio URL, or falls back to the Web Speech API
 * (SpeechSynthesisUtterance) using a supplied language code. If neither an
 * audio URL nor a fallback language + text is available for a given side,
 * the button is not rendered.
 *
 * Styling mirrors the ghost/gray icon-button pattern used in
 * `date-picker.tsx` (ButtonGroup size="xs" variant="ghost" colorScheme="gray",
 * color gray.700 / dark gray.300).
 */

type PlaybackState = "idle" | "loading" | "playing";

interface AudioSideProps {
  /** Direct audio URL for this side, if one exists. */
  audioUrl?: string | null;
  /** BCP-47 language code to use for TTS fallback, e.g. "es-ES", "de-DE". */
  lang?: string | null;
  /** Text to speak when falling back to TTS (e.g. the word or definition). */
  fallbackText?: string | null;
  /** Accessible label for the icon button. */
  label: string;
  size?: "xs" | "sm" | "md";
}

const AudioSideButton: React.FC<AudioSideProps> = ({
  audioUrl,
  lang,
  fallbackText,
  label,
  size = "xs",
}) => {
  const [state, setState] = React.useState<PlaybackState>("idle");

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);
  const mountedRef = React.useRef(true);

  // Hooks must run unconditionally (before any early return below).
  const iconColor = useColorModeValue("gray.700", "gray.300");
  const activeColor = useColorModeValue("blue.600", "blue.300");

  const cleanup = React.useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.oncanplaythrough = null;
      audioRef.current = null;
    }
    if (utteranceRef.current) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      utteranceRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  const setSafeState = (next: PlaybackState) => {
    if (mountedRef.current) setState(next);
  };

  const playUrl = (url: string) => {
    cleanup();
    setSafeState("loading");

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.oncanplaythrough = () => {
      setSafeState("playing");
    };
    audio.onended = () => {
      setSafeState("idle");
      audioRef.current = null;
    };
    audio.onerror = () => {
      setSafeState("idle");
      audioRef.current = null;
    };

    audio.play().catch(() => {
      // Autoplay/interaction restrictions or load failure - fail silently.
      setSafeState("idle");
      audioRef.current = null;
    });
  };

  const playTts = (text: string, ttsLang: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    cleanup();
    setSafeState("loading");

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = ttsLang;
    utteranceRef.current = utterance;

    utterance.onstart = () => setSafeState("playing");
    utterance.onend = () => {
      setSafeState("idle");
      utteranceRef.current = null;
    };
    utterance.onerror = () => {
      setSafeState("idle");
      utteranceRef.current = null;
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleClick = () => {
    if (state === "loading" || state === "playing") {
      cleanup();
      setSafeState("idle");
      return;
    }

    if (audioUrl) {
      playUrl(audioUrl);
      return;
    }

    if (lang && fallbackText) {
      playTts(fallbackText, lang);
    }
  };

  const hasSource = !!audioUrl || !!(lang && fallbackText);
  if (!hasSource) return null;

  const isActive = state === "playing" || state === "loading";

  return (
    <IconButton
      aria-label={label}
      icon={isActive ? <IconVolume2 size={16} /> : <IconVolume size={16} />}
      onClick={handleClick}
      isLoading={state === "loading"}
      variant="ghost"
      colorScheme="gray"
      size={size}
      color={isActive ? activeColor : iconColor}
      sx={
        state === "playing"
          ? {
              animation: "term-audio-pulse 1.1s ease-in-out infinite",
              "@keyframes term-audio-pulse": {
                "0%": { opacity: 1 },
                "50%": { opacity: 0.45 },
                "100%": { opacity: 1 },
              },
            }
          : undefined
      }
    />
  );
};

export interface TermAudioProps {
  /** Direct audio URL for the word side, if one exists. */
  wordAudioUrl?: string | null;
  /** Direct audio URL for the definition side, if one exists. */
  definitionAudioUrl?: string | null;
  /** The word text, used as TTS fallback content. */
  word?: string | null;
  /** The definition text, used as TTS fallback content. */
  definition?: string | null;
  /** BCP-47 language code for the word-side TTS fallback, e.g. "es-ES". */
  wordLang?: string | null;
  /** BCP-47 language code for the definition-side TTS fallback, e.g. "de-DE". */
  definitionLang?: string | null;
  size?: "xs" | "sm" | "md";
}

export const TermAudio: React.FC<TermAudioProps> = ({
  wordAudioUrl,
  definitionAudioUrl,
  word,
  definition,
  wordLang,
  definitionLang,
  size = "xs",
}) => {
  return (
    <HStack spacing="1">
      <ButtonGroup size={size} variant="ghost" colorScheme="gray" spacing="0">
        <AudioSideButton
          audioUrl={wordAudioUrl}
          lang={wordLang}
          fallbackText={word}
          label="Play word audio"
          size={size}
        />
        <AudioSideButton
          audioUrl={definitionAudioUrl}
          lang={definitionLang}
          fallbackText={definition}
          label="Play definition audio"
          size={size}
        />
      </ButtonGroup>
    </HStack>
  );
};
