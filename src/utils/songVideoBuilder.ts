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

/**
 * Koduje AudioBuffer do standardowego 16-bitowego PCM WAV (odtwarzalnego natywnie we wszystkich przeglądarkach).
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const numFrames = buffer.length;
  const dataByteCount = numFrames * blockAlign;
  const headerByteCount = 44;
  const totalByteCount = headerByteCount + dataByteCount;

  const arrayBuffer = new ArrayBuffer(totalByteCount);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataByteCount, true);
  writeString(8, 'WAVE');

  // fmt chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data chunk
  writeString(36, 'data');
  view.setUint32(40, dataByteCount, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/** Konwertuje Blob na Base64 string */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const STATION_CHORDS: Record<SongStationId, number[][]> = {
  wnr365: [
    [146.83, 220.00, 293.66, 369.99], // Dmaj
    [196.00, 246.94, 293.66, 392.00], // Gmaj
    [123.47, 185.00, 220.00, 293.66], // Bmin
    [110.00, 164.81, 220.00, 277.18], // Amaj
  ],
  nowyrhz: [
    [110.00, 164.81, 220.00, 261.63], // Amin
    [174.61, 220.00, 261.63, 349.23], // Fmaj
    [130.81, 196.00, 261.63, 329.63], // Cmaj
    [196.00, 246.94, 293.66, 392.00], // Gmaj
  ],
  biblia365: [
    [98.00, 146.83, 196.00, 246.94],  // Gmaj
    [82.41, 123.47, 164.81, 196.00],  // Emin
    [130.81, 196.00, 261.63, 329.63], // Cmaj
    [146.83, 220.00, 293.66, 369.99], // Dmaj
  ],
  rhz365: [
    [87.31, 130.81, 174.61, 220.00],  // Fmaj
    [116.54, 174.61, 233.08, 293.66], // Bbmaj
    [130.81, 196.00, 261.63, 329.63], // Cmaj
    [146.83, 220.00, 293.66, 349.23], // Dmin
  ],
};

/**
 * Syntetyzuje bogaty, harmonijny podkład instrumentalny dopasowany do stylu stacji
 * za pomocą Web Audio OfflineAudioContext (zajmuje ułamek sekundy).
 */
export async function synthesizeStationAccompaniment(
  stationId: SongStationId,
  durationSeconds: number,
  sampleRate: number = 44100
): Promise<AudioBuffer | null> {
  const OfflineCtxClass =
    typeof OfflineAudioContext !== 'undefined'
      ? OfflineAudioContext
      : typeof window !== 'undefined'
      ? (window as any).OfflineAudioContext || (window as any).webkitOfflineAudioContext
      : null;

  if (!OfflineCtxClass) return null;

  const totalFrames = Math.max(1, Math.round(durationSeconds * sampleRate));
  const offlineCtx = new OfflineCtxClass(2, totalFrames, sampleRate);
  const chords = STATION_CHORDS[stationId] || STATION_CHORDS.wnr365;
  const chordDuration = 3.6; // sekundy na akord

  const fadeInEnd = Math.min(2.0, durationSeconds * 0.1);
  const fadeOutStart = Math.max(fadeInEnd, durationSeconds - 2.5);

  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.0001, 0);
  masterGain.gain.linearRampToValueAtTime(0.42, fadeInEnd);
  masterGain.gain.setValueAtTime(0.42, fadeOutStart);
  masterGain.gain.linearRampToValueAtTime(0.0001, durationSeconds);
  masterGain.connect(offlineCtx.destination);

  // Filtr dolnoprzepustowy nadający ciepłe, sakralne brzmienie
  const filter = offlineCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(stationId === 'rhz365' ? 950 : 1400, 0);
  filter.Q.setValueAtTime(1.0, 0);
  filter.connect(masterGain);

  let currentTime = 0;
  let chordIndex = 0;

  while (currentTime < durationSeconds) {
    const chord = chords[chordIndex % chords.length];
    const dur = Math.min(chordDuration, durationSeconds - currentTime);

    // 1. Pad / ciągły akord tła
    chord.forEach((freq, noteIdx) => {
      const padOsc = offlineCtx.createOscillator();
      padOsc.type = stationId === 'rhz365' ? 'triangle' : 'sine';
      padOsc.frequency.setValueAtTime(freq, currentTime);

      const padGain = offlineCtx.createGain();
      const baseGain = 0.08 / (chord.length || 1);
      const attackEnd = Math.min(currentTime + 0.4, currentTime + dur * 0.5);
      const releaseStart = Math.max(attackEnd, currentTime + dur - 0.5);

      padGain.gain.setValueAtTime(0.0001, currentTime);
      padGain.gain.linearRampToValueAtTime(baseGain, attackEnd);
      padGain.gain.setValueAtTime(baseGain, releaseStart);
      padGain.gain.linearRampToValueAtTime(0.0001, currentTime + dur);

      padOsc.connect(padGain);
      padGain.connect(filter);
      padOsc.start(currentTime);
      padOsc.stop(currentTime + dur);

      // 2. Arpeggio / dźwięki fortepianowe / szarpnięcia strun
      const noteDelay = noteIdx * 0.45;
      const noteStartTime = currentTime + noteDelay;
      if (noteStartTime < durationSeconds) {
        const arpOsc = offlineCtx.createOscillator();
        arpOsc.type = stationId === 'nowyrhz' ? 'triangle' : 'sine';
        arpOsc.frequency.setValueAtTime(freq * (noteIdx === 0 ? 1 : 2), noteStartTime);

        const arpGain = offlineCtx.createGain();
        const noteAttackEnd = Math.min(noteStartTime + 0.03, durationSeconds);
        const noteDecayEnd = Math.min(noteStartTime + 1.8, durationSeconds);

        arpGain.gain.setValueAtTime(0.0001, noteStartTime);
        arpGain.gain.linearRampToValueAtTime(0.12, noteAttackEnd);
        arpGain.gain.linearRampToValueAtTime(0.0001, Math.max(noteAttackEnd + 0.05, noteDecayEnd));

        arpOsc.connect(arpGain);
        arpGain.connect(filter);
        arpOsc.start(noteStartTime);
        arpOsc.stop(Math.min(durationSeconds, noteDecayEnd + 0.05));
      }
    });

    currentTime += chordDuration;
    chordIndex++;
  }

  try {
    return await offlineCtx.startRendering();
  } catch (err) {
    console.warn('[SongBuilder] Błąd renderowania podkładu muzycznego:', err);
    return null;
  }
}

/**
 * Łączy ścieżkę wokalną (TTS) z podkładem muzycznym w jeden zbalansowany bufor dźwiękowy.
 * Wykorzystuje bezpośrednie mieszanie Float32Array z interpolacją liniową próbkowania.
 */
export async function mixVocalAndMusicBuffers(
  vocalBuffer: AudioBuffer,
  musicBuffer: AudioBuffer,
  vocalGainValue: number = 0.95,
  musicGainValue: number = 0.38
): Promise<AudioBuffer> {
  const AudioCtxClass =
    typeof AudioContext !== 'undefined'
      ? AudioContext
      : typeof window !== 'undefined'
      ? (window as any).AudioContext || (window as any).webkitAudioContext
      : null;

  if (!AudioCtxClass) return vocalBuffer;

  const audioCtx = new AudioCtxClass();
  const sampleRate = vocalBuffer.sampleRate || 44100;
  const numChannels = Math.max(vocalBuffer.numberOfChannels, musicBuffer.numberOfChannels, 2);
  const totalLength = Math.max(
    vocalBuffer.length,
    Math.round(musicBuffer.length * (sampleRate / (musicBuffer.sampleRate || sampleRate)))
  );

  const mixed = audioCtx.createBuffer(numChannels, totalLength, sampleRate);
  const rateRatio = (musicBuffer.sampleRate || sampleRate) / sampleRate;

  for (let c = 0; c < numChannels; c++) {
    const mixedData = mixed.getChannelData(c);
    const vChan = vocalBuffer.getChannelData(Math.min(c, vocalBuffer.numberOfChannels - 1));
    const mChan = musicBuffer.getChannelData(Math.min(c, musicBuffer.numberOfChannels - 1));

    // Dodanie wokalu
    for (let i = 0; i < vChan.length; i++) {
      mixedData[i] += vChan[i] * vocalGainValue;
    }

    // Dodanie muzyki z interpolacją
    for (let i = 0; i < totalLength; i++) {
      const srcIdx = i * rateRatio;
      const idxFloor = Math.floor(srcIdx);
      if (idxFloor < mChan.length) {
        const frac = srcIdx - idxFloor;
        const s1 = mChan[idxFloor];
        const s2 = idxFloor + 1 < mChan.length ? mChan[idxFloor + 1] : s1;
        const interp = s1 + frac * (s2 - s1);
        mixedData[i] += interp * musicGainValue;
      }
    }

    // Zabezpieczenie przed przesterowaniem (soft clipping)
    for (let i = 0; i < totalLength; i++) {
      mixedData[i] = Math.max(-1, Math.min(1, mixedData[i]));
    }
  }

  audioCtx.close().catch(() => undefined);
  return mixed;
}


