import { motion } from "framer-motion";
import React from "react";

import { GenericLabel } from "@quenti/components";
import { cleanSpaces } from "@quenti/core/evaluator";
import { getRandom } from "@quenti/lib/array";

import { HStack, Stack } from "@chakra-ui/react";

import { TermAudio } from "../../../../components/terms/term-audio";
import { useAutoplayTermAudio } from "../../../../hooks/use-autoplay-term-audio";
import { useLearnContext } from "../../../../stores/use-learn-store";
import {
  answerAudioProps,
  answerAutoplayTerm,
} from "../../../../utils/term-audio-props";
import { AnswerCard } from "./answer-card";

export const CorrectState: React.FC<{ guess: string }> = ({ guess }) => {
  const feedbackBank = useLearnContext((s) => s.feedbackBank);
  const roundTimeline = useLearnContext((s) => s.roundTimeline);
  const roundCounter = useLearnContext((s) => s.roundCounter);

  const active = roundTimeline[roundCounter]!;

  const [remark] = React.useState(getRandom(feedbackBank.correct));

  useAutoplayTermAudio(
    answerAutoplayTerm(active.answerMode, active.term),
    "correct",
  );

  return (
    <motion.div
      initial={{
        translateY: -16,
        opacity: 0.5,
      }}
      animate={{
        translateY: 0,
        opacity: 1,
      }}
    >
      <Stack spacing="2" pb="4">
        <GenericLabel evaluation>{remark}</GenericLabel>
        <HStack spacing="1" align="center">
          <AnswerCard text={cleanSpaces(guess)} correct />
          <TermAudio
            {...answerAudioProps(active.answerMode, active.term)}
            size="xs"
          />
        </HStack>
      </Stack>
    </motion.div>
  );
};
