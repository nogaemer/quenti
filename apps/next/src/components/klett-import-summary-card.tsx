import * as React from "react";

import {
  Badge,
  Box,
  Card,
  CardBody,
  CardHeader,
  Collapse,
  Divider,
  HStack,
  Heading,
  Icon,
  List,
  ListItem,
  Stack,
  Stat,
  StatGroup,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  useDisclosure,
} from "@chakra-ui/react";

import { IconChevronDown, IconChevronUp, IconMusic } from "@tabler/icons-react";

import { KlettImportSummary, formatBookTitle } from "../utils/klett-importer";

export interface KlettImportSummaryCardProps {
  summary: KlettImportSummary;
}

/**
 * Chakra UI preview card for a parsed Klett Vokabeltrainer import.
 * Shows the book title, lesson/term counts, audio found/missing stats,
 * and an expandable list of missing audio filenames.
 */
export const KlettImportSummaryCard: React.FC<KlettImportSummaryCardProps> = ({
  summary,
}) => {
  const { isOpen, onToggle } = useDisclosure();
  const hasMissingAudio = summary.missingAudioFilenames.length > 0;

  return (
    <Card variant="outline" borderRadius="xl" overflow="hidden">
      <CardHeader pb={2}>
        <Stack spacing={1}>
          <HStack justify="space-between" align="start">
            <Heading size="md">{formatBookTitle(summary.book)}</Heading>
            <Badge colorScheme={hasMissingAudio ? "orange" : "green"}>
              {hasMissingAudio ? "Audio incomplete" : "Audio complete"}
            </Badge>
          </HStack>
          <Text fontSize="sm" color="gray.500">
            {summary.lessons} lesson{summary.lessons === 1 ? "" : "s"} imported
            from Vokabeltrainer export
          </Text>
        </Stack>
      </CardHeader>

      <CardBody pt={0}>
        <StatGroup mb={4}>
          <Stat>
            <StatLabel>Terms</StatLabel>
            <StatNumber>{summary.terms}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Audio found</StatLabel>
            <StatNumber color="green.500">{summary.audioFound}</StatNumber>
            <StatHelpText mb={0}>
              <Icon as={IconMusic} boxSize={3} mr={1} />
              matched by filename
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Audio missing</StatLabel>
            <StatNumber
              color={summary.audioMissing > 0 ? "red.500" : "gray.400"}
            >
              {summary.audioMissing}
            </StatNumber>
          </Stat>
        </StatGroup>

        {hasMissingAudio && (
          <>
            <Divider mb={3} />
            <Box>
              <HStack
                as="button"
                onClick={onToggle}
                justify="space-between"
                width="100%"
                px={1}
                py={1}
                borderRadius="md"
                _hover={{ bg: "gray.50" }}
              >
                <Text fontSize="sm" fontWeight="medium">
                  Missing audio files ({summary.missingAudioFilenames.length})
                </Text>
                <Icon
                  as={isOpen ? IconChevronUp : IconChevronDown}
                  boxSize={4}
                />
              </HStack>

              <Collapse in={isOpen} animateOpacity>
                <List spacing={1} mt={2} maxH="240px" overflowY="auto" px={1}>
                  {summary.missingAudioFilenames.map((filename) => (
                    <ListItem
                      key={filename}
                      fontSize="sm"
                      fontFamily="mono"
                      color="gray.600"
                    >
                      {filename}
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          </>
        )}
      </CardBody>
    </Card>
  );
};

export default KlettImportSummaryCard;
