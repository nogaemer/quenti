import { Flex, Stack, Switch, Text } from "@chakra-ui/react";

import { useAudioAutoplayStore } from "../../../hooks/use-autoplay-term-audio";

/**
 * Per-session mute toggle for term audio autoplay. Backed by the shared
 * Zustand store in use-autoplay-term-audio.ts, so it applies immediately
 * to any currently-mounted card without a page reload, and resets to
 * enabled on next load (not persisted - "per-session" as requested).
 */
export const AudioAutoplaySection = () => {
  const autoplayEnabled = useAudioAutoplayStore((s) => s.autoplayEnabled);
  const setAutoplayEnabled = useAudioAutoplayStore((s) => s.setAutoplayEnabled);

  return (
    <Stack spacing="4">
      <Flex justifyContent="space-between" alignItems="center" gap="4">
        <Stack spacing="0">
          <Text fontWeight={600}>Autoplay audio</Text>
          <Text fontSize="sm" color="gray.500">
            Automatically play word pronunciation after answering
          </Text>
        </Stack>
        <Switch
          isChecked={autoplayEnabled}
          onChange={(e) => setAutoplayEnabled(e.target.checked)}
        />
      </Flex>
    </Stack>
  );
};
