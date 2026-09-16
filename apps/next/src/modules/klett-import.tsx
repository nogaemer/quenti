// apps/next/src/modules/klett-import.tsx
//
// All the actual logic for the Klett Vokabeltrainer import flow lives here,
// dynamically loaded (ssr: false) by pages/import.tsx — same split as
// modules/internal-create + pages/create.tsx.
import { createId } from "@paralleldrive/cuid2";
import JSZip from "jszip";
import NextLink from "next/link";
import * as React from "react";

import { api } from "@quenti/trpc";

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Heading,
  Input,
  Link,
  Progress,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";

import { KlettImportSummaryCard } from "../components/klett-import-summary-card";
import {
  type FlattenedTerm,
  KlettImportError,
  type KlettImportSummary,
  formatBookTitle,
  importKlettZip,
} from "../utils/klett-importer";

// ---------------------------------------------------------------------------
// Concurrency-limited task runner.
//
// Audio upload tokens are 120s JWTs, so we can't mint all of them upfront —
// each token is requested immediately before its matching upload, not in a
// batch. A bounded worker pool (4-6 concurrent) keeps that request-then-use
// pairing tight while still parallelizing across hundreds of files.
// ---------------------------------------------------------------------------
async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const poolSize = Math.max(1, Math.min(limit, items.length));
  const runners = Array.from({ length: poolSize }, async () => {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      await worker(items[index]!, index);
    }
  });
  await Promise.all(runners);
}

// Mirrors the medium-audio matching logic in klett-importer.ts, but keeps
// the actual JSZip.JSZipObject (not just the filename) so we can pull bytes
// out of the archive on demand.
const MEDIUM_DIR_RE = /(^|\/)(assets\/json\/medium|medium)\/[^/]+\.mp3$/i;

function buildAudioEntryIndex(zip: JSZip): Map<string, JSZip.JSZipObject> {
  const index = new Map<string, JSZip.JSZipObject>();
  Object.values(zip.files).forEach((entry) => {
    if (entry.dir) return;
    const normalized = entry.name.replace(/\\/g, "/");
    if (!MEDIUM_DIR_RE.test(normalized)) return;
    const parts = normalized.split("/");
    const base = parts[parts.length - 1];
    if (base) index.set(base.toLowerCase(), entry);
  });
  return index;
}

interface ImportResultRow {
  lektion: string;
  lektionsTeil: string;
  studySetId: string;
  created: number;
  updated: number;
}

type Stage =
  | "idle"
  | "parsing"
  | "parsed"
  | "uploading"
  | "importing"
  | "done"
  | "error";

const AUDIO_UPLOAD_CONCURRENCY = 5;

export const InternalKlettImport: React.FC = () => {
  const [stage, setStage] = React.useState<Stage>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // We keep the raw File, not the JSZip instance, across the parse step.
  // importKlettZip() fully encapsulates its own JSZip.loadAsync() call and
  // never hands the archive back out, so there is nothing to "keep" from
  // that step even if we wanted to — the summary is derived data only.
  // Re-deriving a fresh JSZip from the File right before step 4 (instead of
  // trying to thread a zip instance through component state) means:
  //   - no risk of holding a second large in-memory decompressed structure
  //     around for the entire time the user is looking at the summary card
  //   - React state stays serializable-ish and easy to reason about
  //     (a File is a stable, cheap-to-hold reference; a JSZip instance with
  //     open internal buffers is not something you want sitting in state)
  //   - the cost is one extra archive decompression (JSZip.loadAsync is
  //     lazy per-entry, so this is just re-reading the central directory,
  //     not re-inflating every file) which is negligible next to a network
  //     upload loop that already takes seconds per file
  const [file, setFile] = React.useState<File | null>(null);
  const [summary, setSummary] = React.useState<KlettImportSummary | null>(null);

  const [audioDone, setAudioDone] = React.useState(0);
  const [audioTotal, setAudioTotal] = React.useState(0);
  const [results, setResults] = React.useState<ImportResultRow[] | null>(null);

  const createUploadToken =
    api.studySets.createImportAssetUploadToken.useMutation();
  const importVocabPackage = api.studySets.importVocabPackage.useMutation();

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setErrorMessage(null);
    setResults(null);
    setSummary(null);
    setStage("parsing");

    try {
      const parsed = await importKlettZip(selected);
      setFile(selected);
      setSummary(parsed);
      setStage("parsed");
    } catch (err) {
      if (err instanceof KlettImportError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to parse the zip.",
        );
      }
      setFile(null);
      setStage("error");
    }
  };

  const handleConfirmImport = async () => {
    if (!file || !summary) return;

    const importId = createId(); // real cuid2 — satisfies z.string().cuid2() on the server
    const termsWithAudio = summary.flattened.filter(
      (t): t is FlattenedTerm & { wordAudioFilename: string } =>
        !!t.wordAudioFilename,
    );

    setAudioDone(0);
    setAudioTotal(termsWithAudio.length);
    setStage("uploading");

    const zip = await JSZip.loadAsync(file);
    const audioIndex = buildAudioEntryIndex(zip);
    const audioKeys: Record<string, string> = {};

    await runWithConcurrency(
      termsWithAudio,
      AUDIO_UPLOAD_CONCURRENCY,
      async (term) => {
        const filename = term.wordAudioFilename;
        try {
          const entry = audioIndex.get(filename.toLowerCase());
          if (!entry) {
            throw new Error(`"${filename}" not present in zip's medium/ dir`);
          }

          const bytes = await entry.async("arraybuffer");

          // Request the token immediately before the upload it belongs to —
          // it's only valid for 120s, so minting it any earlier (e.g. all
          // upfront) risks it expiring before this specific PUT goes out.
          const { key, token } = await createUploadToken.mutateAsync({
            importId,
            filename,
          });

          const res = await fetch("/api/assets/import-audio", {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "audio/mpeg",
            },
            body: bytes,
          });

          if (!res.ok) {
            throw new Error(`Upload responded with status ${res.status}`);
          }

          audioKeys[filename] = key;
        } catch (err) {
          // Don't abort the whole import over one bad clip — log and move on.
          // eslint-disable-next-line no-console
          console.error(`Skipping audio for "${filename}":`, err);
        } finally {
          setAudioDone((n) => n + 1);
        }
      },
    );

    setStage("importing");

    try {
      const importResults = await importVocabPackage.mutateAsync({
        bookTitle: formatBookTitle(summary.book),
        terms: summary.flattened,
        audioKeys,
      });
      setResults(importResults);
      setStage("done");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Import failed on the server.",
      );
      setStage("error");
    }
  };

  const isBusy =
    stage === "parsing" || stage === "uploading" || stage === "importing";

  return (
    <VStack align="stretch" spacing={6} py={8}>
      <Heading size="lg">Import from Klett Vokabeltrainer</Heading>

      <Box>
        <Input
          type="file"
          accept=".zip"
          disabled={isBusy}
          onChange={handleFileSelected}
        />
      </Box>

      {stage === "parsing" && <Text color="gray.500">Parsing zip…</Text>}

      {errorMessage && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Import failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Box>
        </Alert>
      )}

      {summary && stage !== "error" && (
        <Stack spacing={4}>
          <KlettImportSummaryCard summary={summary} />
          {(stage === "parsed" ||
            stage === "uploading" ||
            stage === "importing") && (
            <Button
              alignSelf="start"
              colorScheme="blue"
              isLoading={stage === "uploading" || stage === "importing"}
              loadingText={
                stage === "uploading" ? "Uploading audio…" : "Importing…"
              }
              onClick={handleConfirmImport}
              isDisabled={stage === "uploading" || stage === "importing"}
            >
              Confirm import
            </Button>
          )}
        </Stack>
      )}

      {(stage === "uploading" || (stage === "importing" && audioTotal > 0)) && (
        <Box>
          <Text fontSize="sm" mb={1} color="gray.600">
            {audioDone} / {audioTotal} audio files uploaded
          </Text>
          <Progress
            value={audioTotal === 0 ? 100 : (audioDone / audioTotal) * 100}
            size="sm"
            borderRadius="full"
            colorScheme="blue"
          />
        </Box>
      )}

      {stage === "importing" && (
        <Text color="gray.500">Creating study sets on the server…</Text>
      )}

      {results && results.length > 0 && (
        <Stack spacing={3}>
          <Heading size="md">Import results</Heading>
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>Lesson</Th>
                <Th>Part</Th>
                <Th isNumeric>Created</Th>
                <Th isNumeric>Updated</Th>
              </Tr>
            </Thead>
            <Tbody>
              {results.map((row, i) => (
                <Tr key={`${row.studySetId}-${i}`}>
                  <Td>{row.lektion}</Td>
                  <Td>{row.lektionsTeil}</Td>
                  <Td isNumeric>{row.created}</Td>
                  <Td isNumeric>{row.updated}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          {/*
            Quenti's study set route is a bare top-level cuid2 segment
            (`/:id(c[a-z0-9]{24})`), not `/sets/:id` — matching that here.
          */}
          <Link
            as={NextLink}
            href={`/${results[0]!.studySetId}`}
            color="blue.500"
          >
            Open first created set →
          </Link>
        </Stack>
      )}
    </VStack>
  );
};

export default InternalKlettImport;
