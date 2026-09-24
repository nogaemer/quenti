/**
 * Client-side importer for Klett "Vokabeltrainer" zip exports.
 *
 * Accepts either:
 *  - the full desktop app export (start.exe, DLLs, assets/... — everything
 *    except assets/json/*.json and assets/json/medium/*.mp3 is ignored), or
 *  - a stripped-down zip that only contains the assets/json folder.
 *
 * No heavy deps beyond `jszip` (already a Quenti dependency for other
 * bulk-import flows).
 */
import JSZip from "jszip";

// ---------------------------------------------------------------------------
// Types matching the (abbreviated) Klett JSON shape
// ---------------------------------------------------------------------------

interface KlettSide {
  lan: string | null;
  text: string | null;
  status: string | null;
  swDefinition: string | null;
  swTonAbgleichwort: string | null;
  swTonDefinition: string | null;
  me: unknown;
  swTonAbgleichwortAvailable: boolean;
  swTonDefinitionAvailable: boolean;
}

interface KlettEntry {
  matId: string;
  titelNr: string;
  band: string;
  lektion: string;
  lektionsTeil: string;
  ubNummer: number;
  seite: number;
  pos: number;
  vorderSeite: KlettSide;
  rueckSeite: KlettSide;
  wordList?: KlettSide[];
}

interface KlettLektionsTeil {
  name: string;
  entryList: KlettEntry[];
}

interface KlettLektion {
  name: string;
  lektionsTeilList: KlettLektionsTeil[];
}

interface KlettRoot {
  lektionList: KlettLektion[];
  id: number;
  title: string;
  seiteAvailable?: boolean;
  flexSigns?: { description: string; chars: string }[];
  sprachrichtung?: number;
}

// ---------------------------------------------------------------------------
// Public output types
// ---------------------------------------------------------------------------

export interface FlattenedTerm {
  lektion: string;
  lektionsTeil: string;
  matId: string;
  word: string;
  definition: string;
  exampleSentence: string | null;
  wordAudioFilename: string | null;
}

export interface KlettImportSummary {
  book: string;
  lessons: number;
  terms: number;
  audioFound: number;
  audioMissing: number;
  flattened: FlattenedTerm[];
  /** Deduplicated, sorted list of missing audio basenames — for UI display. */
  missingAudioFilenames: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VOKABEL_JSON_RE = /vokabeltrainer.*\.json$/i;

function basename(path: string | null | undefined): string | null {
  if (!path) return null;
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/");
  const name = parts[parts.length - 1];
  return name || null;
}

function nonEmptyOrNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/**
 * Locates the first zip entry whose basename matches `vokabelTrainer*.json`
 * (case-insensitive), regardless of how deep it is nested in the archive.
 */
function findVokabelTrainerEntry(zip: JSZip): JSZip.JSZipObject | null {
  const candidates = Object.values(zip.files).filter(
    (f) => !f.dir && VOKABEL_JSON_RE.test(basename(f.name) ?? f.name),
  );
  if (candidates.length === 0) return null;
  // Prefer the shortest path (closest to zip root) in case multiple matches exist.
  candidates.sort((a, b) => a.name.length - b.name.length);
  return candidates[0] ?? null;
}

/**
 * Collects all mp3 files that live under an `assets/json/medium/` or a
 * root-level `medium/` folder, keyed by lower-cased basename for O(1) lookups.
 */
function collectMediumAudioFiles(zip: JSZip): Set<string> {
  const found = new Set<string>();
  const MEDIUM_DIR_RE = /(^|\/)(assets\/json\/medium|medium)\/[^/]+\.mp3$/i;
  Object.values(zip.files).forEach((f) => {
    if (f.dir) return;
    const normalized = f.name.replace(/\\/g, "/");
    if (MEDIUM_DIR_RE.test(normalized)) {
      const name = basename(normalized);
      if (name) found.add(name.toLowerCase());
    }
  });
  return found;
}

function flattenEntries(root: KlettRoot): FlattenedTerm[] {
  const flattened: FlattenedTerm[] = [];

  for (const lektion of root.lektionList ?? []) {
    for (const teil of lektion.lektionsTeilList ?? []) {
      for (const entry of teil.entryList ?? []) {
        const word = entry.vorderSeite?.text ?? "";
        const definition = entry.rueckSeite?.text ?? "";
        const exampleSentence = nonEmptyOrNull(entry.vorderSeite?.swDefinition);
        const wordAudioFilename = basename(
          entry.vorderSeite?.swTonAbgleichwort,
        );

        flattened.push({
          lektion: entry.lektion ?? lektion.name,
          lektionsTeil: entry.lektionsTeil ?? teil.name,
          matId: entry.matId,
          word,
          definition,
          exampleSentence,
          wordAudioFilename,
        });
      }
    }
  }

  return flattened;
}

export function formatBookTitle(raw: string): string {
  return raw.replace(/^\d+_/, "").replace(/_/g, " ");
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export class KlettImportError extends Error {}

/**
 * Parses a Klett "Vokabeltrainer" zip export (full app dump or just the
 * assets/json folder) and returns a flattened, audio-cross-referenced
 * summary ready for review or conversion into Quenti sets.
 */
export async function importKlettZip(file: File): Promise<KlettImportSummary> {
  const zip = await JSZip.loadAsync(file);

  const jsonEntry = findVokabelTrainerEntry(zip);
  if (!jsonEntry) {
    throw new KlettImportError(
      "No vokabelTrainer*.json file found in this zip. Make sure you exported the Vokabeltrainer data (assets/json folder).",
    );
  }

  let root: KlettRoot;
  try {
    const raw = await jsonEntry.async("string");
    root = JSON.parse(raw) as KlettRoot;
  } catch (err) {
    throw new KlettImportError(
      `Found ${jsonEntry.name} but could not parse it as JSON: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  if (!Array.isArray(root.lektionList)) {
    throw new KlettImportError(
      "Parsed JSON does not have the expected 'lektionList' structure.",
    );
  }

  const flattened = flattenEntries(root);
  const availableAudio = collectMediumAudioFiles(zip);

  let audioFound = 0;
  let audioMissing = 0;
  const missingSet = new Set<string>();

  for (const term of flattened) {
    if (!term.wordAudioFilename) continue;
    if (availableAudio.has(term.wordAudioFilename.toLowerCase())) {
      audioFound++;
    } else {
      audioMissing++;
      missingSet.add(term.wordAudioFilename);
    }
  }

  return {
    book: root.title ?? "Unknown book",
    lessons: root.lektionList.length,
    terms: flattened.length,
    audioFound,
    audioMissing,
    flattened,
    missingAudioFilenames: Array.from(missingSet).sort(),
  };
}
