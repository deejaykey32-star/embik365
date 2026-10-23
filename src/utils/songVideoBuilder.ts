/**
 * Czysta logika teledysku "piosenka dnia": tekst piosenki z wpisu sekcji,
 * prompt dla Lyrii, synchronizacja linii z muzyką, metadane YouTube i wybór formatu MP4.
 */
import type { SongStationId } from './lyriaSongService';

export interface SongStyle {
  /** Opis muzyczny dla Lyrii (po angielsku – model najlepiej go rozumie). */
  musicStyle: string;
  /** Nazwa sekcji pokazywana w filmie i w metadanych. */
  displayName: string;
  youtubeTags: string[];
}

export const SONG_STYLE_BY_STATION: Record<SongStationId, SongStyle> = {
  wnr365: {
    displayName: 'WnR365 – Widoki na Raj',
    musicStyle: 'contemplative Christian worship ballad, warm piano and strings, gentle female vocal, hopeful, 72 bpm',
    youtubeTags: ['WnR365', 'Widoki na Raj', 'rozważanie dnia', 'piosenka religijna'],
  },
  rhz365: {
    displayName: 'RHZ365 – Różaniec Historii Zbawienia',
    musicStyle: 'meditative Marian hymn, choir pads, organ and acoustic guitar, calm male and female vocal duet, 66 bpm',
    youtubeTags: ['RHZ365', 'Różaniec', 'Historia Zbawienia', 'modlitwa śpiewana'],
  },
  nowyrhz: {
    displayName: 'nowyRHZ365 – Różaniec Historii Zbawienia',
    musicStyle: 'modern acoustic rosary song, fingerpicked guitar, soft percussion, prayerful male vocal, 70 bpm',
    youtubeTags: ['nowyRHZ365', 'Różaniec', 'modlitwa śpiewana', 'piosenka dnia'],
  },
  biblia365: {
    displayName: 'Biblia365',
    musicStyle: 'cinematic biblical folk song, cello, harp and frame drum, solemn expressive vocal, 76 bpm',
    youtubeTags: ['Biblia365', 'Pismo Święte', 'czytanie dnia', 'piosenka biblijna'],
  },
};

export type LyricSectionKind = 'verse' | 'chorus';

export interface LyricSection {
  kind: LyricSectionKind;
  lines: string[];
}

export interface SongLyrics {
  title: string;
  sections: LyricSection[];
}

export interface LyricLineTiming {
  lineIndex: number;
  start: number;
  end: number;
}

export interface YouTubeMetadata {
  title: string;
  description: string;
  tags: string[];
}

const MAX_LYRIC_LINE_CHARS = 48;
const LINES_PER_VERSE = 4;
const YOUTUBE_TITLE_MAX_CHARS = 100;

/** Usuwa znaczniki HTML i nadmiarowe białe znaki z tekstu źródłowego. */
export function stripMarkup(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const SONG_SOURCE_SECTION_TYPES = ['meditation', 'scripture', 'general'];

/**
 * Wybiera treść dnia na tekst piosenki: pierwszą sekcję z rozważaniem lub czytaniem,
 * z pominięciem zapowiedzi radiowej i stałych modlitw. Usuwa wiodące znaczniki dat, np. "-[08.11.2025]".
 */
export function selectSongSourceText(
  sections: ReadonlyArray<{ type: string; text: string }> | undefined,
  fallbackText: string
): string {
  const contentSection = sections?.find(
    section => SONG_SOURCE_SECTION_TYPES.includes(section.type) && section.text.trim()
  );
  const sourceText = contentSection ? contentSection.text : fallbackText;
  return sourceText.replace(/^\s*-?\s*\[[^\]]*\]\s*/, '');
}

/** Dzieli tekst na krótkie, śpiewne linie: najpierw po zdaniach, potem po przecinkach i słowach. */
export function splitIntoLyricLines(text: string, maxChars: number = MAX_LYRIC_LINE_CHARS): string[] {
  const sentences = stripMarkup(text)
    .split(/(?<=[.!?;:])\s+/)
    .map(sentence => sentence.trim())
    .filter(Boolean);

  const lines: string[] = [];
  for (const sentence of sentences) {
    const phrases = sentence.length <= maxChars ? [sentence] : sentence.split(/(?<=,)\s+/);
    for (const phrase of phrases) {
      let currentLine = '';
      for (const word of phrase.split(' ')) {
        const candidate = currentLine ? `${currentLine} ${word}` : word;
        if (candidate.length > maxChars && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = candidate;
        }
      }
      if (currentLine) lines.push(currentLine);
    }
  }
  return lines;
}

/**
 * Buduje strukturę piosenki: Zwrotka 1 – Refren – Zwrotka 2 – Refren.
 * Zwrotki to początek tekstu dnia, refren to jego zakończenie (zwykle puenta lub modlitwa).
 */
export function buildSongLyrics(title: string, sourceText: string): SongLyrics {
  const allLines = splitIntoLyricLines(sourceText);
  const verseLineCount = LINES_PER_VERSE * 2;

  const verseLines = allLines.slice(0, verseLineCount);
  const remainingLines = allLines.slice(verseLineCount);
  const chorusLines = remainingLines.length >= 2
    ? remainingLines.slice(-LINES_PER_VERSE)
    : [title.trim()].filter(Boolean);

  const firstVerse = verseLines.slice(0, LINES_PER_VERSE);
  const secondVerse = verseLines.slice(LINES_PER_VERSE);

  const sections: LyricSection[] = [];
  if (firstVerse.length) sections.push({ kind: 'verse', lines: firstVerse });
  if (chorusLines.length) sections.push({ kind: 'chorus', lines: chorusLines });
  if (secondVerse.length) {
    sections.push({ kind: 'verse', lines: secondVerse });
    if (chorusLines.length) sections.push({ kind: 'chorus', lines: chorusLines });
  }
  return { title: title.trim(), sections };
}

/** Formatuje tekst w notacji znaczników sekcji, którą rozumie Lyria ([Verse], [Chorus]). */
export function formatLyricsForLyria(lyrics: SongLyrics): string {
  return lyrics.sections
    .map(section => `[${section.kind === 'verse' ? 'Verse' : 'Chorus'}]\n${section.lines.join('\n')}`)
    .join('\n\n');
}

/**
 * Odwrotność formatLyricsForLyria – czyta tekst edytowany przez użytkownika.
 * Linie przed pierwszym znacznikiem traktowane są jako zwrotka.
 */
export function parseLyriaLyrics(title: string, taggedText: string): SongLyrics {
  const sections: LyricSection[] = [];
  let current: LyricSection | null = null;

  for (const rawLine of taggedText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const tagMatch = line.match(/^\[(verse|chorus|zwrotka|refren)[^\]]*\]$/i);
    if (tagMatch) {
      const kind: LyricSectionKind = /chorus|refren/i.test(tagMatch[1]) ? 'chorus' : 'verse';
      current = { kind, lines: [] };
      sections.push(current);
      continue;
    }
    if (!current) {
      current = { kind: 'verse', lines: [] };
      sections.push(current);
    }
    current.lines.push(line);
  }
  return { title: title.trim(), sections: sections.filter(section => section.lines.length) };
}

/** Płaska lista linii w kolejności śpiewania (z powtórzeniami refrenu) – do napisów w filmie. */
export function flattenLyricLines(lyrics: SongLyrics): string[] {
  return lyrics.sections.flatMap(section => section.lines);
}

export function buildLyriaPrompt(stationId: SongStationId, lyrics: SongLyrics): string {
  const style = SONG_STYLE_BY_STATION[stationId];
  return [
    `Create a complete song in Polish titled "${lyrics.title}".`,
    `Style: ${style.musicStyle}.`,
    'Short instrumental intro, then sing exactly these lyrics, clearly articulated, then a short outro.',
    '',
    formatLyricsForLyria(lyrics),
  ].join('\n');
}

/**
 * Rozkłada linie tekstu na czas utworu proporcjonalnie do ich długości,
 * pomijając instrumentalne intro i outro.
 */
export function computeLyricLineTimings(
  lines: string[],
  durationSeconds: number,
  introSeconds: number = 8,
  outroSeconds: number = 6
): LyricLineTiming[] {
  if (!lines.length || durationSeconds <= 0) return [];

  const singingStart = Math.min(introSeconds, durationSeconds * 0.2);
  const singingEnd = Math.max(singingStart, durationSeconds - Math.min(outroSeconds, durationSeconds * 0.2));
  const singingDuration = singingEnd - singingStart;
  const totalWeight = lines.reduce((sum, line) => sum + Math.max(line.length, 1), 0);

  let cursor = singingStart;
  return lines.map((line, lineIndex) => {
    const lineDuration = (Math.max(line.length, 1) / totalWeight) * singingDuration;
    const timing = { lineIndex, start: cursor, end: cursor + lineDuration };
    cursor += lineDuration;
    return timing;
  });
}

/** Zwraca indeks linii śpiewanej w danej chwili lub -1 (intro/outro). */
export function findActiveLineIndex(timings: LyricLineTiming[], currentTime: number): number {
  const active = timings.find(timing => currentTime >= timing.start && currentTime < timing.end);
  return active ? active.lineIndex : -1;
}

export function buildYouTubeMetadata(
  stationId: SongStationId,
  lyrics: SongLyrics,
  displayDate: string,
  reference?: string
): YouTubeMetadata {
  const style = SONG_STYLE_BY_STATION[stationId];
  const sectionTag = style.youtubeTags[0];
  const fullTitle = `${lyrics.title} | ${sectionTag} – piosenka dnia (${displayDate})`;
  const title = fullTitle.length > YOUTUBE_TITLE_MAX_CHARS
    ? `${fullTitle.slice(0, YOUTUBE_TITLE_MAX_CHARS - 1)}…`
    : fullTitle;

  const description = [
    `${style.displayName} – piosenka dnia, ${displayDate}.`,
    reference ? `Fragment: ${reference}` : '',
    '',
    'Tekst:',
    flattenLyricLines(lyrics).join('\n'),
    '',
    'Muzyka i wokal wygenerowane przez AI (Google Lyria).',
    style.youtubeTags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' '),
  ].filter((line, index, all) => line !== '' || all[index - 1] !== '').join('\n');

  return { title, description, tags: style.youtubeTags };
}

const MP4_MIME_CANDIDATES = [
  'video/mp4;codecs=avc1.640028,mp4a.40.2',
  'video/mp4;codecs=avc1,mp4a.40.2',
  'video/mp4',
];
const WEBM_FALLBACK_MIME = 'video/webm;codecs=vp9,opus';

/** Wybiera format nagrania: MP4 (H.264/AAC) dla YouTube, a gdy przeglądarka go nie wspiera – WebM. */
export function pickRecordingMimeType(isTypeSupported: (mime: string) => boolean): string {
  return MP4_MIME_CANDIDATES.find(mime => isTypeSupported(mime)) ?? WEBM_FALLBACK_MIME;
}

/** Bezpieczna nazwa pliku MP4, np. "biblia365-dzien-042-piosenka.mp4". */
export function buildSongVideoFileName(stationId: SongStationId, dayNumber: number, extension: string): string {
  return `${stationId}-dzien-${String(dayNumber).padStart(3, '0')}-piosenka.${extension}`;
}
