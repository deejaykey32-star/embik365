import { WNR365_FULL_DATA } from '../data/wnr365Data';
import { RHZ365_FULL_DATA } from '../data/rhz365Data';
import { getBibliaEntryForDayAndYear } from '../data/biblia365Data';
import { NOWY_RHZ_MYSTERIES, NowyRhzMystery } from '../data/nowyRhzData';
import {
  normalizePolishTextForSpeech,
  extractCleanWordsForKaraoke,
  numberToPolishOrdinal,
  expandBiblicalReference
} from './polishSpeechNormalizer';

export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export type RadioStationId = 'nowyrhz' | 'wnr365' | 'biblia365' | 'rhz365';

export interface RadioStationMeta {
  id: RadioStationId;
  name: string;
  shortName: string;
  badge: string;
  themeColor: string;
  tagline: string;
  description: string;
  totalDays: number;
  shareSlug: string;
  channelName: string;
  gradient: string;
}

export const RADIO_STATIONS: RadioStationMeta[] = [
  {
    id: 'nowyrhz',
    name: 'Nowy Różaniec Historii Zbawienia',
    shortName: 'Nowy RHZ',
    badge: '175 Dni Modlitwy',
    themeColor: '#d97706', // amber-600
    tagline: '7 etapów × 5 części × 5 tajemnic w pętli 24/7',
    description: 'Kompletny cykl 175 tajemnic różańca z Pismem Świętym, rozważaniem, 10 dopowiedzeniami do każdego Zdrowaś Maryjo oraz modlitwą końcową.',
    totalDays: 175,
    shareSlug: 'nowyrhz',
    channelName: 'Stacja 1: Nowy RHZ',
    gradient: 'from-amber-500/20 via-amber-600/10 to-transparent'
  },
  {
    id: 'wnr365',
    name: 'Widoki na Raj (WnR365)',
    shortName: 'Widoki na Raj',
    badge: '365 Dni Refleksji',
    themeColor: '#0284c7', // sky-600
    tagline: 'Codzienne myśli, medytacje i duchowe drogowskazy',
    description: 'Roczny cykl wpisów blogowych Dominika Kuty – refleksje o wieczności, wierze, łasce i poszukiwaniu głębi w codzienności.',
    totalDays: 365,
    shareSlug: 'wnr365',
    channelName: 'Stacja 2: Widoki na Raj',
    gradient: 'from-sky-500/20 via-sky-600/10 to-transparent'
  },
  {
    id: 'biblia365',
    name: 'Biblia365 & Apokryfy',
    shortName: 'Biblia i Apokryfy',
    badge: '365 Dni Słowa',
    themeColor: '#16a34a', // emerald-600
    tagline: 'Lektura Pisma Świętego z wczesnochrześcijańskimi apokryfami',
    description: 'Codzienna czytelnia Słowa Bożego: Stary i Nowy Testament, psalmy oraz apokryfy z budującym komentarzem duchowym.',
    totalDays: 365,
    shareSlug: 'biblia365',
    channelName: 'Stacja 3: Biblia i Apokryfy',
    gradient: 'from-emerald-500/20 via-emerald-600/10 to-transparent'
  },
  {
    id: 'rhz365',
    name: 'Pierwotny Różaniec HZ (RHZ365)',
    shortName: 'Pierwotny RHZ',
    badge: '365 Dni Kontemplacji',
    themeColor: '#9333ea', // purple-600
    tagline: '365-dniowy modlitewnik różańcowy z rozważaniami',
    description: 'Klasyczny, całoroczny modlitewnik różańcowy prowadzący przez całą historię zbawienia, czytania biblijne, dopowiedzenia i akty zawierzenia.',
    totalDays: 365,
    shareSlug: 'rhz365',
    channelName: 'Stacja 4: RHZ365 Klasyczny',
    gradient: 'from-purple-500/20 via-purple-600/10 to-transparent'
  }
];

export interface RosaryBeadSegment {
  beadIndex: number; // 0: Rozważanie & Ojcze nasz, 1..10: Zdrowaś Maryjo 1..10, 11: Chwała Ojcu & O mój Jezu
  beadType: 'large_intro' | 'small_decade' | 'large_conclusion';
  label: string;
  subLabel?: string;
  insertion?: string; // wstawka po słowie Jezus
  startWordIdx: number;
  endWordIdx: number;
}

export interface RadioSection {
  id: string;
  title: string;
  type: 'intro' | 'scripture' | 'meditation' | 'our_father' | 'hail_mary' | 'glory_be' | 'fatima' | 'conclusion' | 'general';
  beadIndex?: number; // 0, 1..10, 11 dla różańca
  text: string;
  startWordIdx: number;
  endWordIdx: number;
}

export interface RadioBroadcastItem {
  stationId: RadioStationId;
  stationName: string;
  dayNumber: number;
  totalDays: number;
  displayDate: string;
  headlineTitle: string;
  subtitle: string;
  stageName?: string;
  partName?: string;
  reference?: string;
  speechText: string;
  displayContent: string;
  words: string[];
  lineBreakWordIndices?: number[];
  sections?: RadioSection[];
  rosarySegments?: RosaryBeadSegment[];
}

// Stałe formuły modlitewne w pełnym brzmieniu liturgicznym
export const OJCZE_NASZ_PELNY = 
  'Ojcze nasz, któryś jest w niebie, święć się imię Twoje; przyjdź królestwo Twoje; bądź wola Twoja jako w niebie tak i na ziemi. Chleba naszego powszedniego daj nam dzisiaj; i odpuść nam nasze winy, jako i my odpuszczamy naszym winowajcom; i nie wódź nas na pokuszenie, ale nas zbaw ode złego. Amen.';

export const CHWALA_OJCU_PELNE = 
  'Chwała Ojcu i Synowi, i Duchowi Świętemu, jak była na początku, teraz i zawsze, i na wieki wieków. Amen.';

export const MODLITWA_FATIMSKA_PELNA = 
  'O mój Jezu, przebacz nam nasze grzechy, zachowaj nas od ognia piekielnego, zaprowadź wszystkie dusze do nieba i dopomóż szczególnie tym, którzy najbardziej potrzebują Twojego miłosierdzia.';

/**
 * Buduje kompletną modlitwę Zdrowaś Maryjo z dopowiedzeniem oraz drugą częścią Święta Maryjo
 */
export function buildFullHailMary(dopowiedzenie: string): string {
  const cleanDop = (dopowiedzenie || '').trim().replace(/\.+$/, '');
  return `Zdrowaś Maryjo, łaski pełna, Pan z Tobą, błogosławionaś Ty między niewiastami i błogosławiony owoc żywota Twojego, Jezus, ${cleanDop}. Święta Maryjo, Matko Boża, módl się za nami grzesznymi, teraz i w godzinę śmierci naszej. Amen.`;
}

/**
 * Oblicza dokładne zakresy indeksów słów dla 12 paciorków różańca na podstawie sekcji
 */
export function calculateRosarySegmentsFromSections(
  sections: RadioSection[],
  smallBeadsData: { text: string; dopowiedzenie: string }[],
  cleanWordsCount: number
): RosaryBeadSegment[] {
  const segments: RosaryBeadSegment[] = [];

  // 1. Krok 1 (Duży paciorek): Informacje wstępne, Rozważanie i Ojcze nasz (beadIndex === 0)
  const introSections = sections.filter(s => s.beadIndex === 0);
  const introStart = introSections.length > 0 ? introSections[0].startWordIdx : 0;
  const introEnd = introSections.length > 0 ? introSections[introSections.length - 1].endWordIdx : 0;

  segments.push({
    beadIndex: 0,
    beadType: 'large_intro',
    label: 'Rozważanie & Ojcze nasz',
    subLabel: 'Krok 1: Rozważanie Tajemnicy oraz Modlitwa Pańska',
    startWordIdx: introStart,
    endWordIdx: introEnd
  });

  // 2. 10 Małych paciorków: Zdrowaś Maryjo 1..10 (beadIndex === 1..10)
  for (let b = 1; b <= 10; b++) {
    const beadSec = sections.find(s => s.beadIndex === b);
    const dop = smallBeadsData[b - 1]?.dopowiedzenie || '';
    if (beadSec) {
      segments.push({
        beadIndex: b,
        beadType: 'small_decade',
        label: `Zdrowaś Maryjo #${b} z 10`,
        subLabel: `Paciorek #${b} z 10`,
        insertion: dop,
        startWordIdx: beadSec.startWordIdx,
        endWordIdx: beadSec.endWordIdx
      });
    }
  }

  // 3. Krok 3 (Duży paciorek): Chwała Ojcu i O mój Jezu (beadIndex === 11)
  const conclSections = sections.filter(s => s.beadIndex === 11);
  const conclStart = conclSections.length > 0 ? conclSections[0].startWordIdx : (segments[segments.length - 1]?.endWordIdx ?? 0) + 1;
  const conclEnd = Math.max(conclStart, cleanWordsCount - 1);

  segments.push({
    beadIndex: 11,
    beadType: 'large_conclusion',
    label: 'Chwała Ojcu & O mój Jezu',
    subLabel: 'Krok 3: Modlitwa Uwielbienia oraz Modlitwa Fatimska',
    startWordIdx: conclStart,
    endWordIdx: conclEnd
  });

  return segments;
}

/**
 * Zwraca treść radiową dla wybranej stacji i numeru dnia.
 * Zawiera KOMPLETNĄ treść całych modlitw (Ojcze nasz, 10 x Zdrowaś Maryjo z dopowiedzeniami,
 * Chwała Ojcu, Modlitwa fatimska oraz modlitwy końcowe), z pełnym tekstem słownym
 * bez skrótów i cyfr, zsynchronizowanym z lektorem AI i napisami karaoke.
 * 
 * KAŻDA MODLITWA (Informacje wstępne, Rozważanie, Ojcze nasz, każde Zdrowaś Maryjo x 10,
 * Chwała Ojcu, O mój Jezu) zaczyna się od nowej linii, posiada dokładne granice indeksów słów
 * oraz nie powoduje znikania przeczytanego tekstu w generatorze wideo MP4.
 */
export function getRadioBroadcastItem(
  stationId: RadioStationId,
  dayNumber: number,
  bibliaYear: 1 | 2 | 3 | 4 = 1
): RadioBroadcastItem {
  const station = RADIO_STATIONS.find(s => s.id === stationId) || RADIO_STATIONS[0];
  const totalDays = station.totalDays;
  const safeDay = Math.max(1, Math.min(totalDays, dayNumber));

  if (stationId === 'nowyrhz') {
    const mystery = NOWY_RHZ_MYSTERIES[safeDay - 1] || NOWY_RHZ_MYSTERIES[0];
    const headlineTitle = `${mystery.t} – ${mystery.sub}`;
    const subtitle = `Etap ${mystery.stage}: ${mystery.stageTitle} • Część ${mystery.part}: ${mystery.partTitle}`;
    
    const bibRefSpoken = expandBiblicalReference(mystery.ref);
    const dayOrdSpoken = numberToPolishOrdinal(safeDay, 'm');
    const stageOrdSpoken = numberToPolishOrdinal(mystery.stage, 'm');
    const partOrdSpoken = numberToPolishOrdinal(mystery.part, 'f');

    // 10 pełnych modlitw Zdrowaś Maryjo z dopowiedzeniami
    const smallBeadsData = mystery.cl.map((cl) => ({
      text: buildFullHailMary(cl),
      dopowiedzenie: cl
    }));
    const dopowiedzeniaList = smallBeadsData.map(b => b.text);

    // KROK 1: Informacje wstępne, Rozważanie, Ojcze nasz - każda sekcja zaczyna się od nowej linii!
    const introInfoText = [
      `Nowy Różaniec Historii Zbawienia. Dzień ${dayOrdSpoken} ze stu siedemdziesięciu pięciu.`,
      `Etap ${stageOrdSpoken}: ${mystery.stageTitle}.`,
      `Część ${partOrdSpoken}: ${mystery.partTitle}.`,
      `Tajemnica: ${mystery.t}. ${mystery.sub}.`,
      `Fragment Pisma Świętego: ${bibRefSpoken}.`
    ].join(' ');

    const rozwazanieText = `Rozważanie: ${mystery.med}`;
    const ojczeNaszText = `Modlitwa Pańska: ${OJCZE_NASZ_PELNY}`;
    const chwalaOjcuText = CHWALA_OJCU_PELNE;
    const oMojJezuText = MODLITWA_FATIMSKA_PELNA;
    const modlitwaKoncowaText = mystery.prayer ? `Modlitwa na zakończenie: ${mystery.prayer}` : '';

    interface SectionDef {
      id: string;
      title: string;
      type: RadioSection['type'];
      beadIndex?: number;
      rawText: string;
    }

    const sectionDefs: SectionDef[] = [
      { id: 'intro', title: 'Informacje wstępne', type: 'intro', beadIndex: 0, rawText: introInfoText },
      { id: 'meditation', title: 'Rozważanie', type: 'meditation', beadIndex: 0, rawText: rozwazanieText },
      { id: 'our_father', title: 'Modlitwa Pańska (Ojcze nasz)', type: 'our_father', beadIndex: 0, rawText: ojczeNaszText },
      ...smallBeadsData.map((b, idx) => ({
        id: `hail_mary_${idx + 1}`,
        title: `Zdrowaś Maryjo #${idx + 1}`,
        type: 'hail_mary' as const,
        beadIndex: idx + 1,
        rawText: b.text
      })),
      { id: 'glory_be', title: 'Chwała Ojcu', type: 'glory_be', beadIndex: 11, rawText: chwalaOjcuText },
      { id: 'fatima', title: 'O mój Jezu', type: 'fatima', beadIndex: 11, rawText: oMojJezuText },
      ...(modlitwaKoncowaText ? [{ id: 'conclusion', title: 'Modlitwa na zakończenie', type: 'conclusion' as const, beadIndex: 11, rawText: modlitwaKoncowaText }] : [])
    ];

    const cleanWords: string[] = [];
    const lineBreakWordIndices: number[] = [];
    const sections: RadioSection[] = [];
    const normalizedSectionTexts: string[] = [];

    for (let sIdx = 0; sIdx < sectionDefs.length; sIdx++) {
      const def = sectionDefs[sIdx];
      const normText = normalizePolishTextForSpeech(def.rawText);
      normalizedSectionTexts.push(normText);
      const sWords = extractCleanWordsForKaraoke(normText);
      const startWordIdx = cleanWords.length;

      if (cleanWords.length > 0 && sWords.length > 0) {
        lineBreakWordIndices.push(startWordIdx); // Każda kolejna modlitwa/sekcja zaczyna się od nowej linii!
      }

      for (const w of sWords) {
        cleanWords.push(w);
      }

      const endWordIdx = Math.max(startWordIdx, cleanWords.length - 1);
      sections.push({
        id: def.id,
        title: def.title,
        type: def.type,
        beadIndex: def.beadIndex,
        text: normText,
        startWordIdx,
        endWordIdx
      });
    }

    const speechText = normalizedSectionTexts.join('\n\n');
    const rosarySegments = calculateRosarySegmentsFromSections(sections, smallBeadsData, cleanWords.length);

    const displayContent = [
      `📖 Źródło: ${mystery.ref} (${bibRefSpoken})`,
      `\n✨ Rozważanie:\n${mystery.med}`,
      `\n🙏 Modlitwa Pańska:\n${OJCZE_NASZ_PELNY}`,
      `\n📿 Dziesiątka Różańca Świętego:\n` + dopowiedzeniaList.join('\n\n'),
      `\n✨ ${CHWALA_OJCU_PELNE}`,
      `\n🕊️ ${MODLITWA_FATIMSKA_PELNA}`,
      mystery.prayer ? `\n🙏 Modlitwa końcowa:\n${mystery.prayer}` : ''
    ].join('\n');

    return {
      stationId: 'nowyrhz',
      stationName: station.name,
      dayNumber: safeDay,
      totalDays: 175,
      displayDate: `Dzień ${safeDay} ze 175`,
      headlineTitle,
      subtitle,
      stageName: mystery.stageTitle,
      partName: mystery.partTitle,
      reference: mystery.ref,
      speechText,
      displayContent,
      words: cleanWords,
      lineBreakWordIndices,
      sections,
      rosarySegments
    };
  }

  if (stationId === 'wnr365') {
    const entry = WNR365_FULL_DATA[safeDay] || WNR365_FULL_DATA[1];
    const cleanContent = stripHtml(entry.content || entry.page1 || '').replace(/https?:\/\/[^\s]+/g, '').trim();
    const rawTitle = entry.title || `Dzień ${safeDay}`;
    const cleanTitle = rawTitle.replace(/^Widoki na Raj\s*—\s*WnR365\s*\([^)]*\)\s*—\s*WnR365\s*—\s*Widoki na Raj\s*-\s*\([^)]*\)\s*-\s*—\s*/i, '').trim();

    const dayOrdSpoken = numberToPolishOrdinal(safeDay, 'm');
    const spokenDate = normalizePolishTextForSpeech(entry.displayDate || '');

    const introInfoText = `Widoki na Raj. Dzień ${dayOrdSpoken} z trzystu sześćdziesięciu pięciu. ${spokenDate}.`;
    const titleText = cleanTitle;
    const contentParagraphs = cleanContent.split(/\n+/).map(p => p.trim()).filter(Boolean);

    interface SectionDef {
      id: string;
      title: string;
      type: RadioSection['type'];
      rawText: string;
    }

    const sectionDefs: SectionDef[] = [
      { id: 'intro', title: 'Informacje wstępne', type: 'intro', rawText: introInfoText },
      { id: 'title', title: 'Tytuł wpisu', type: 'general', rawText: titleText },
      ...contentParagraphs.map((p, idx) => ({
        id: `para_${idx + 1}`,
        title: `Akapit ${idx + 1}`,
        type: 'general' as const,
        rawText: p
      }))
    ];

    const cleanWords: string[] = [];
    const lineBreakWordIndices: number[] = [];
    const sections: RadioSection[] = [];
    const normalizedSectionTexts: string[] = [];

    for (let sIdx = 0; sIdx < sectionDefs.length; sIdx++) {
      const def = sectionDefs[sIdx];
      const normText = normalizePolishTextForSpeech(def.rawText);
      normalizedSectionTexts.push(normText);
      const sWords = extractCleanWordsForKaraoke(normText);
      const startWordIdx = cleanWords.length;

      if (cleanWords.length > 0 && sWords.length > 0) {
        lineBreakWordIndices.push(startWordIdx);
      }

      for (const w of sWords) {
        cleanWords.push(w);
      }

      const endWordIdx = Math.max(startWordIdx, cleanWords.length - 1);
      sections.push({
        id: def.id,
        title: def.title,
        type: def.type,
        text: normText,
        startWordIdx,
        endWordIdx
      });
    }

    const speechText = normalizedSectionTexts.join('\n\n');

    return {
      stationId: 'wnr365',
      stationName: station.name,
      dayNumber: safeDay,
      totalDays: 365,
      displayDate: entry.displayDate,
      headlineTitle: cleanTitle,
      subtitle: `Widoki na Raj • Blog duchowy Dominika Kuty`,
      reference: entry.displayDate,
      speechText,
      displayContent: cleanContent,
      words: cleanWords,
      lineBreakWordIndices,
      sections
    };
  }

  if (stationId === 'biblia365') {
    const bibliaEntry = getBibliaEntryForDayAndYear(safeDay, bibliaYear);
    const cleanContent = stripHtml(bibliaEntry.content || '').trim();
    const headlineTitle = `${bibliaEntry.bookTitle} (Rozdział ${bibliaEntry.chapter}) – ${bibliaEntry.title || bibliaEntry.passage}`;

    const dayOrdSpoken = numberToPolishOrdinal(safeDay, 'm');
    const chapterOrdSpoken = numberToPolishOrdinal(bibliaEntry.chapter, 'm');
    const bibRefSpoken = expandBiblicalReference(bibliaEntry.passage);

    const introInfoText = `Biblia trzysta sześćdziesiąt pięć i Apokryfy. Dzień ${dayOrdSpoken}. Księga: ${bibliaEntry.bookTitle}, rozdział ${chapterOrdSpoken}. Fragment: ${bibRefSpoken}.`;
    const titleText = bibliaEntry.title ? `Temat: ${bibliaEntry.title}.` : '';
    const contentParagraphs = cleanContent.split(/\n+/).map(p => p.trim()).filter(Boolean);

    interface SectionDef {
      id: string;
      title: string;
      type: RadioSection['type'];
      rawText: string;
    }

    const sectionDefs: SectionDef[] = [
      { id: 'intro', title: 'Informacje wstępne', type: 'intro', rawText: introInfoText },
      ...(titleText ? [{ id: 'title', title: 'Temat', type: 'general' as const, rawText: titleText }] : []),
      ...contentParagraphs.map((p, idx) => ({
        id: `para_${idx + 1}`,
        title: `Akapit ${idx + 1}`,
        type: 'general' as const,
        rawText: p
      }))
    ];

    const cleanWords: string[] = [];
    const lineBreakWordIndices: number[] = [];
    const sections: RadioSection[] = [];
    const normalizedSectionTexts: string[] = [];

    for (let sIdx = 0; sIdx < sectionDefs.length; sIdx++) {
      const def = sectionDefs[sIdx];
      const normText = normalizePolishTextForSpeech(def.rawText);
      normalizedSectionTexts.push(normText);
      const sWords = extractCleanWordsForKaraoke(normText);
      const startWordIdx = cleanWords.length;

      if (cleanWords.length > 0 && sWords.length > 0) {
        lineBreakWordIndices.push(startWordIdx);
      }

      for (const w of sWords) {
        cleanWords.push(w);
      }

      const endWordIdx = Math.max(startWordIdx, cleanWords.length - 1);
      sections.push({
        id: def.id,
        title: def.title,
        type: def.type,
        text: normText,
        startWordIdx,
        endWordIdx
      });
    }

    const speechText = normalizedSectionTexts.join('\n\n');

    return {
      stationId: 'biblia365',
      stationName: station.name,
      dayNumber: safeDay,
      totalDays: 365,
      displayDate: `Dzień ${safeDay} • Rok ${bibliaYear}`,
      headlineTitle,
      subtitle: `${bibliaEntry.category} • Fragment: ${bibliaEntry.passage}`,
      reference: bibliaEntry.passage,
      speechText,
      displayContent: cleanContent,
      words: cleanWords,
      lineBreakWordIndices,
      sections
    };
  }

  // rhz365 (Pierwotny)
  const rhzEntry = RHZ365_FULL_DATA[safeDay] || RHZ365_FULL_DATA[1];
  const cleanPassage = stripHtml(rhzEntry.passage || '').trim();
  const cleanExplanation = stripHtml(rhzEntry.explanation || '').trim();
  const cleanOurFather = stripHtml(rhzEntry.ourFather || OJCZE_NASZ_PELNY).replace(/10 Osobnych Modlitw.*$/i, '').trim();
  const cleanGloryBe = stripHtml(rhzEntry.gloryBe || CHWALA_OJCU_PELNE).trim();
  const cleanFatima = stripHtml(rhzEntry.fatimaPrayer || MODLITWA_FATIMSKA_PELNA).trim();
  const callsText = (rhzEntry.callsToAction || []).map(c => stripHtml(c)).join(' ');
  const dayOrdSpoken = numberToPolishOrdinal(safeDay, 'm');
  const spokenDate = normalizePolishTextForSpeech(rhzEntry.displayDate || '');

  // 10 modlitw Zdrowaś Maryjo ze wstawkami
  const smallBeadsData = (rhzEntry.smallBeads || []).map((b, idx) => {
    const cleanBeadText = stripHtml(b.text || '').trim();
    const fullText = (cleanBeadText.toLowerCase().startsWith('zdrowaś maryjo') && cleanBeadText.toLowerCase().includes('święta maryjo'))
      ? cleanBeadText
      : buildFullHailMary(b.dopowiedzenie || cleanBeadText);
    return {
      text: fullText,
      dopowiedzenie: b.dopowiedzenie || `Dopowiedzenie #${idx + 1}`
    };
  });
  const beadsList = smallBeadsData.map(b => b.text);

  const introInfoText = [
    `Różaniec Historii Zbawienia. Dzień ${dayOrdSpoken} z trzystu sześćdziesięciu pięciu. ${spokenDate}.`,
    rhzEntry.stageTitle
  ].join(' ');
  const slowoBozeText = `Słowo Boże: ${cleanPassage}`;
  const rozwazanieText = `Rozważanie: ${cleanExplanation}`;
  const ojczeNaszText = `Modlitwa Pańska: ${cleanOurFather || OJCZE_NASZ_PELNY}`;
  const chwalaOjcuText = cleanGloryBe || CHWALA_OJCU_PELNE;
  const oMojJezuText = cleanFatima || MODLITWA_FATIMSKA_PELNA;
  const wezwaniaText = callsText ? `Wezwania do czynu: ${callsText}` : '';

  interface SectionDef {
    id: string;
    title: string;
    type: RadioSection['type'];
    beadIndex?: number;
    rawText: string;
  }

  const sectionDefs: SectionDef[] = [
    { id: 'intro', title: 'Informacje wstępne', type: 'intro', beadIndex: 0, rawText: introInfoText },
    { id: 'scripture', title: 'Słowo Boże', type: 'scripture', beadIndex: 0, rawText: slowoBozeText },
    { id: 'meditation', title: 'Rozważanie', type: 'meditation', beadIndex: 0, rawText: rozwazanieText },
    { id: 'our_father', title: 'Modlitwa Pańska (Ojcze nasz)', type: 'our_father', beadIndex: 0, rawText: ojczeNaszText },
    ...smallBeadsData.map((b, idx) => ({
      id: `hail_mary_${idx + 1}`,
      title: `Zdrowaś Maryjo #${idx + 1}`,
      type: 'hail_mary' as const,
      beadIndex: idx + 1,
      rawText: b.text
    })),
    { id: 'glory_be', title: 'Chwała Ojcu', type: 'glory_be', beadIndex: 11, rawText: chwalaOjcuText },
    { id: 'fatima', title: 'O mój Jezu', type: 'fatima', beadIndex: 11, rawText: oMojJezuText },
    ...(wezwaniaText ? [{ id: 'conclusion', title: 'Wezwania do czynu', type: 'conclusion' as const, beadIndex: 11, rawText: wezwaniaText }] : [])
  ];

  const cleanWords: string[] = [];
  const lineBreakWordIndices: number[] = [];
  const sections: RadioSection[] = [];
  const normalizedSectionTexts: string[] = [];

  for (let sIdx = 0; sIdx < sectionDefs.length; sIdx++) {
    const def = sectionDefs[sIdx];
    const normText = normalizePolishTextForSpeech(def.rawText);
    normalizedSectionTexts.push(normText);
    const sWords = extractCleanWordsForKaraoke(normText);
    const startWordIdx = cleanWords.length;

    if (cleanWords.length > 0 && sWords.length > 0) {
      lineBreakWordIndices.push(startWordIdx); // Każda kolejna modlitwa/sekcja zaczyna się od nowej linii!
    }

    for (const w of sWords) {
      cleanWords.push(w);
    }

    const endWordIdx = Math.max(startWordIdx, cleanWords.length - 1);
    sections.push({
      id: def.id,
      title: def.title,
      type: def.type,
      beadIndex: def.beadIndex,
      text: normText,
      startWordIdx,
      endWordIdx
    });
  }

  const speechText = normalizedSectionTexts.join('\n\n');
  const rosarySegments = calculateRosarySegmentsFromSections(sections, smallBeadsData, cleanWords.length);

  const displayContent = [
    `📖 Słowo Boże:\n${cleanPassage}`,
    `\n✨ Rozważanie:\n${cleanExplanation}`,
    `\n🙏 Modlitwa Pańska:\n${cleanOurFather || OJCZE_NASZ_PELNY}`,
    `\n📿 Dziesiątka Różańca Świętego:\n` + beadsList.join('\n\n'),
    `\n✨ ${cleanGloryBe || CHWALA_OJCU_PELNE}`,
    `\n🕊️ ${cleanFatima || MODLITWA_FATIMSKA_PELNA}`,
    callsText ? `\n🔥 Wezwania do czynu:\n${callsText}` : ''
  ].join('\n');

  return {
    stationId: 'rhz365',
    stationName: station.name,
    dayNumber: safeDay,
    totalDays: 365,
    displayDate: rhzEntry.displayDate,
    headlineTitle: rhzEntry.stageTitle,
    subtitle: `Pierwotny Różaniec Historii Zbawienia 365`,
    reference: rhzEntry.displayDate,
    speechText,
    displayContent,
    words: cleanWords,
    lineBreakWordIndices,
    sections,
    rosarySegments
  };
}
