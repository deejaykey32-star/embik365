import type { BibliaYearEntry } from '../data/bibliaTypes';
import { numberToPolishOrdinal } from './polishSpeechNormalizer';

/**
 * Przygotowanie tekstu Biblia365 dla lektora i generatora MP4.
 *
 * Lektor odczytuje TYLKO nazwę księgi i numer rozdziału (raz, na początku),
 * a następnie sam tekst rozdziału – bez numerów wersetów, nagłówków markdown,
 * sigli typu «« Mt 1 »» i bez powtarzania tytułu – oraz komentarz.
 */

const FEMININE_ORDINAL_NOUNS = /^(Księga|Ewangelia|Apokalipsa)\b/i;

/** "1 List św. Piotra" -> "Pierwszy List świętego Piotra", "2 Księga Kronik" -> "Druga Księga Kronik" */
export function getSpokenBookTitle(bookTitle: string): string {
  let t = (bookTitle || '').trim();
  const lead = t.match(/^(\d+)\s+(.*)$/);
  if (lead) {
    const n = parseInt(lead[1], 10);
    const rest = lead[2];
    const gender = FEMININE_ORDINAL_NOUNS.test(rest) ? 'f' : 'm';
    const ord = numberToPolishOrdinal(n, gender);
    t = `${ord.charAt(0).toUpperCase()}${ord.slice(1)} ${rest}`;
  }
  return t
    .replace(/\bTestamenty 12 Patriarchów\b/, 'Testamenty Dwunastu Patriarchów')
    .replace(/(?<!\p{L})wg\s+/gu, 'według ')
    .replace(/(?<!\p{L})św\.\s*/gu, 'świętego ')
    .replace(/\s+-\s+/g, ', ');
}

/** "rozdział pierwszy" / dla Psalmów "psalm pierwszy" */
export function getSpokenChapterLabel(entry: Pick<BibliaYearEntry, 'bookTitle' | 'chapter'>): string {
  const isPsalms = /Psalm/i.test(entry.bookTitle) && !/Salomona/i.test(entry.bookTitle);
  return `${isPsalms ? 'psalm' : 'rozdział'} ${numberToPolishOrdinal(entry.chapter, 'm')}`;
}

/** Jedyna zapowiedź lektora: nazwa księgi i rozdział */
export function getBibliaSpokenIntro(entry: BibliaYearEntry): string {
  return `${getSpokenBookTitle(entry.bookTitle)}, ${getSpokenChapterLabel(entry)}.`;
}

/** Rozdziela treść wpisu na tekst biblijny (sekcja 1) i komentarz (sekcje 2+) */
export function splitBibliaContent(content: string): { scripture: string; commentary: string } {
  const c = content || '';
  const idx = c.search(/\n##\s*2\.\s/);
  if (idx === -1) return { scripture: c, commentary: '' };
  return { scripture: c.slice(0, idx), commentary: c.slice(idx) };
}

/** Sam tekst rozdziału: bez nagłówków, numerów wersetów, sigli i znaków krytycznych */
export function cleanScriptureForSpeech(scripture: string): string {
  return (scripture || '')
    .split('\n')
    .filter(line => !/^\s*#/.test(line))
    .join('\n')
    .replace(/<werset[^>]*>?/gi, ' ')
    .replace(/«««?[^»]*»»»?/g, ' ')
    .replace(/\*\*\s*\d+[a-z]?\s*\*\*/gi, ' ')
    .replace(/^\s*\d+[a-z]?\s+(?=\p{Lu})/gmu, '')
    .replace(/\(\s*\)|<\s*>|\[\s*\]/g, ' ')
    .replace(/[<>\[\]]/g, '')
    .replace(/^\s*-{3,}\s*$/gm, '')
    .replace(/[*_]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();
}

/** Komentarz: nagłówki jako krótkie tytuły zdań, bez numeracji, markdown i obcych alfabetów */
export function cleanCommentaryForSpeech(commentary: string): string {
  return (commentary || '')
    .split('\n')
    .map(line => {
      const h = line.match(/^\s*#{1,6}\s*(?:\d+\.\s*)?(.*)$/);
      if (h) {
        const title = h[1].replace(/[*_]/g, '').trim();
        return title ? `\n${title.replace(/[.:]$/, '')}.\n` : '';
      }
      return line
        .replace(/^\s*(?:\d+\.|[-•*])\s+/, '')
        .replace(/^\s*>\s?/, '');
    })
    .join('\n')
    .replace(/^\s*-{3,}\s*$/gm, '')
    .replace(/[Ͱ-Ͽἀ-῿֐-׿]+/g, ' ')
    .replace(/\(\s*[,;\s]*\)/g, ' ')
    .replace(/[*_]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();
}

export interface BibliaSpeechParts {
  intro: string;
  scripture: string;
  commentary: string;
}

export function getBibliaSpeechParts(entry: BibliaYearEntry): BibliaSpeechParts {
  const { scripture, commentary } = splitBibliaContent(entry.content);
  return {
    intro: getBibliaSpokenIntro(entry),
    scripture: cleanScriptureForSpeech(scripture),
    commentary: cleanCommentaryForSpeech(commentary)
  };
}

/** Pełny tekst dla lektora w czytniku */
export function buildBibliaSpeechText(entry: BibliaYearEntry): string {
  const p = getBibliaSpeechParts(entry);
  return [p.intro, p.scripture, p.commentary].filter(Boolean).join('\n\n');
}
