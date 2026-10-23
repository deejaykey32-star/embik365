import { describe, it, expect } from 'vitest';
import {
  stripMarkup,
  selectSongSourceText,
  splitIntoLyricLines,
  buildSongLyrics,
  formatLyricsForLyria,
  parseLyriaLyrics,
  flattenLyricLines,
  buildLyriaPrompt,
  computeLyricLineTimings,
  findActiveLineIndex,
  computeLyricWordTimings,
  findActiveWordIndex,
  buildYouTubeMetadata,
  pickRecordingMimeType,
  buildSongVideoFileName,
  SONG_STYLE_BY_STATION,
} from './songVideoBuilder';

const SAMPLE_TEXT =
  'Na początku Bóg stworzył niebo i ziemię. Ziemia zaś była bezładem i pustkowiem. ' +
  'Ciemność była nad powierzchnią bezmiaru wód, a Duch Boży unosił się nad wodami. ' +
  'Wtedy Bóg rzekł: Niechaj się stanie światłość! I stała się światłość. ' +
  'Bóg widząc, że światłość jest dobra, oddzielił ją od ciemności. ' +
  'I nazwał Bóg światłość dniem, a ciemność nazwał nocą. ' +
  'I tak upłynął wieczór i poranek – dzień pierwszy. ' +
  'Chwała Tobie, Panie, za dar stworzenia. Niech wszystko, co żyje, chwali Pana. Amen.';

describe('stripMarkup', () => {
  it('removes HTML tags, entities and extra whitespace', () => {
    expect(stripMarkup('<p>Ala&nbsp;ma</p>\n\n<b>kota</b>')).toBe('Ala ma kota');
  });
});

describe('selectSongSourceText', () => {
  it('skips intro and prayer sections and picks the first content section', () => {
    const sections = [
      { type: 'intro', text: 'Dzień trzysta trzeci.' },
      { type: 'meditation', text: 'Rozważanie dnia.' },
      { type: 'our_father', text: 'Ojcze nasz…' },
    ];
    expect(selectSongSourceText(sections, 'fallback')).toBe('Rozważanie dnia.');
  });

  it('removes a leading date marker', () => {
    expect(selectSongSourceText([{ type: 'general', text: '-[08.11.2025] Bóg mieszka bliżej' }], ''))
      .toBe('Bóg mieszka bliżej');
  });

  it('uses the fallback text when there is no content section', () => {
    expect(selectSongSourceText(undefined, 'pełny tekst')).toBe('pełny tekst');
    expect(selectSongSourceText([{ type: 'intro', text: 'zapowiedź' }, { type: 'general', text: '  ' }], 'pełny tekst'))
      .toBe('pełny tekst');
  });
});

describe('splitIntoLyricLines', () => {
  it('keeps every line within the length limit', () => {
    const lines = splitIntoLyricLines(SAMPLE_TEXT, 40);
    expect(lines.length).toBeGreaterThan(5);
    lines.forEach(line => expect(line.length).toBeLessThanOrEqual(40));
  });

  it('does not lose any words', () => {
    const lines = splitIntoLyricLines(SAMPLE_TEXT, 30);
    expect(lines.join(' ').split(' ')).toEqual(stripMarkup(SAMPLE_TEXT).split(' '));
  });

  it('returns an empty list for empty text', () => {
    expect(splitIntoLyricLines('   ')).toEqual([]);
  });
});

describe('buildSongLyrics', () => {
  it('builds verse–chorus–verse–chorus with the ending as chorus for 2-verse texts', () => {
    const text2Verses =
      'Na początku Bóg stworzył niebo i ziemię.\n' +
      'Ziemia zaś była bezładem i pustkowiem.\n' +
      'Wtedy Bóg rzekł: Niech stanie się światłość!\n' +
      'I stała się światłość.\n' +
      'Bóg widząc, że światłość jest dobra.\n' +
      'Oddzielił ją od ciemności.\n' +
      'Chwała Tobie, Panie, za dar niebios.\n' +
      'Amen.';
    const lyrics = buildSongLyrics('Dzień pierwszy', text2Verses);
    expect(lyrics.sections.map(section => section.kind)).toEqual(['verse', 'chorus', 'verse', 'chorus']);
    expect(lyrics.sections[0].lines[0]).toContain('Na początku');
    expect(lyrics.sections[1].lines.join(' ')).toContain('Amen.');
    expect(lyrics.sections[1]).toEqual(lyrics.sections[3]);
  });

  it('preserves the entire text without discarding lines for longer texts', () => {
    const lyrics = buildSongLyrics('Stworzenie świata', SAMPLE_TEXT);
    const flattened = flattenLyricLines(lyrics);
    const sourceLines = splitIntoLyricLines(SAMPLE_TEXT);
    // Każda linia tekstu źródłowego musi znaleźć się w utworze (nie jest obcinany do 42 sekund)
    sourceLines.forEach(line => {
      expect(flattened).toContain(line);
    });
    expect(lyrics.sections.length).toBeGreaterThanOrEqual(4);
  });

  it('falls back to the title as chorus for short texts', () => {
    const lyrics = buildSongLyrics('Tytuł', 'Krótki tekst.');
    expect(lyrics.sections).toEqual([
      { kind: 'verse', lines: ['Krótki tekst.'] },
      { kind: 'chorus', lines: ['Tytuł'] },
    ]);
  });
});

describe('formatLyricsForLyria / parseLyriaLyrics', () => {
  it('round-trips the song structure', () => {
    const lyrics = buildSongLyrics('Dzień pierwszy', SAMPLE_TEXT);
    const tagged = formatLyricsForLyria(lyrics);
    expect(tagged.startsWith('[Verse]\n')).toBe(true);
    expect(tagged).toContain('[Chorus]');
    expect(parseLyriaLyrics('Dzień pierwszy', tagged)).toEqual(lyrics);
  });

  it('accepts Polish tags and untagged leading lines', () => {
    const lyrics = parseLyriaLyrics('T', 'linia bez znacznika\n\n[Refren]\nla la\n[Zwrotka 2]\nraz dwa');
    expect(lyrics.sections).toEqual([
      { kind: 'verse', lines: ['linia bez znacznika'] },
      { kind: 'chorus', lines: ['la la'] },
      { kind: 'verse', lines: ['raz dwa'] },
    ]);
  });

  it('drops empty sections', () => {
    expect(parseLyriaLyrics('T', '[Verse]\n\n[Chorus]\nok').sections).toEqual([{ kind: 'chorus', lines: ['ok'] }]);
  });
});

describe('buildLyriaPrompt', () => {
  it('contains the section style, title and tagged lyrics', () => {
    const lyrics = buildSongLyrics('Dzień pierwszy', SAMPLE_TEXT);
    const prompt = buildLyriaPrompt('biblia365', lyrics);
    expect(prompt).toContain('"Dzień pierwszy"');
    expect(prompt).toContain(SONG_STYLE_BY_STATION.biblia365.musicStyle);
    expect(prompt).toContain(formatLyricsForLyria(lyrics));
  });
});

describe('computeLyricLineTimings / findActiveLineIndex', () => {
  it('spreads lines over the singing window proportionally to length', () => {
    const timings = computeLyricLineTimings(['aaaa', 'aaaaaaaa'], 100, 10, 10);
    expect(timings[0]).toMatchObject({ lineIndex: 0, start: 10 });
    expect(timings[0].end).toBeCloseTo(10 + 80 / 3);
    expect(timings[1].start).toBeCloseTo(timings[0].end);
    expect(timings[1].end).toBeCloseTo(90);
  });

  it('caps intro and outro for very short songs', () => {
    const timings = computeLyricLineTimings(['a'], 10, 8, 6);
    expect(timings[0].start).toBe(2);
    expect(timings[0].end).toBe(8);
  });

  it('returns no timings for empty input', () => {
    expect(computeLyricLineTimings([], 120)).toEqual([]);
    expect(computeLyricLineTimings(['a'], 0)).toEqual([]);
  });

  it('finds the active line, or -1 during intro and outro', () => {
    const timings = computeLyricLineTimings(['aa', 'bb'], 100, 10, 10);
    expect(findActiveLineIndex(timings, 5)).toBe(-1);
    expect(findActiveLineIndex(timings, 20)).toBe(0);
    expect(findActiveLineIndex(timings, 60)).toBe(1);
    expect(findActiveLineIndex(timings, 95)).toBe(-1);
  });
});

describe('computeLyricWordTimings / findActiveWordIndex', () => {
  it('calculates word-by-word timings for karaoke synchronization', () => {
    const lines = ['Święty Boże', 'Święty Mocny'];
    const lineTimings = [
      { lineIndex: 0, start: 10, end: 20 },
      { lineIndex: 1, start: 20, end: 30 },
    ];
    const wordTimings = computeLyricWordTimings(lines, lineTimings);
    expect(wordTimings.length).toBe(4);
    expect(wordTimings[0].word).toBe('Święty');
    expect(wordTimings[0].start).toBe(10);
    expect(wordTimings[1].word).toBe('Boże');
    expect(wordTimings[1].end).toBeCloseTo(20);
    expect(wordTimings[2].word).toBe('Święty');
    expect(wordTimings[2].start).toBeCloseTo(20);
    expect(wordTimings[3].word).toBe('Mocny');
    expect(wordTimings[3].end).toBeCloseTo(30);
  });

  it('correctly tracks active word index matching current audio playback', () => {
    const lines = ['Jezu ufam Tobie'];
    const lineTimings = [{ lineIndex: 0, start: 5, end: 15 }];
    const wordTimings = computeLyricWordTimings(lines, lineTimings);

    expect(findActiveWordIndex(wordTimings, 2)).toBe(-1); // przed utworem
    expect(findActiveWordIndex(wordTimings, 6)).toBe(0);  // "Jezu"
    expect(findActiveWordIndex(wordTimings, 14)).toBe(2); // "Tobie"
  });
});

describe('buildYouTubeMetadata', () => {
  it('builds title, description with lyrics and section tags', () => {
    const lyrics = buildSongLyrics('Dzień pierwszy', SAMPLE_TEXT);
    const metadata = buildYouTubeMetadata('wnr365', lyrics, '23 października', 'Rdz 1');
    expect(metadata.title).toBe('Dzień pierwszy | WnR365 – piosenka dnia (23 października)');
    expect(metadata.description).toContain('Fragment: Rdz 1');
    expect(metadata.description).toContain(flattenLyricLines(lyrics)[0]);
    expect(metadata.description).toContain('#WidokinaRaj');
    expect(metadata.description).not.toMatch(/\n\n\n/);
    expect(metadata.tags).toEqual(SONG_STYLE_BY_STATION.wnr365.youtubeTags);
  });

  it('truncates titles to the YouTube limit of 100 characters', () => {
    const lyrics = buildSongLyrics('x'.repeat(150), 'Tekst.');
    const metadata = buildYouTubeMetadata('rhz365', lyrics, '1 stycznia');
    expect(metadata.title.length).toBe(100);
    expect(metadata.title.endsWith('…')).toBe(true);
    expect(metadata.description).not.toContain('Fragment:');
  });
});

describe('pickRecordingMimeType', () => {
  it('prefers H.264/AAC MP4', () => {
    expect(pickRecordingMimeType(() => true)).toBe('video/mp4;codecs=avc1.640028,mp4a.40.2');
  });

  it('uses generic MP4 when only that is supported', () => {
    expect(pickRecordingMimeType(mime => mime === 'video/mp4')).toBe('video/mp4');
  });

  it('falls back to WebM when MP4 is unsupported', () => {
    expect(pickRecordingMimeType(() => false)).toBe('video/webm;codecs=vp9,opus');
  });
});

describe('buildSongVideoFileName', () => {
  it('pads the day number', () => {
    expect(buildSongVideoFileName('biblia365', 42, 'mp4')).toBe('biblia365-dzien-042-piosenka.mp4');
  });
});
