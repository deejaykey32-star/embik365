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
 * Oblicza dokładne zakresy indeksów słów dla 12 paciorków różańca:
 * - 0: Duży paciorek (Rozważanie i Ojcze nasz)
 * - 1..10: 10 małych paciorków (Zdrowaś Maryjo ze wstawką po słowie Jezus)
 * - 11: Kolejny duży paciorek (Chwała Ojcu i O mój Jezu)
 */
export function calculateRosarySegments(
  introParts: string[],
  smallBeads: { text: string; dopowiedzenie: string }[],
  conclusionParts: string[],
  cleanWords: string[]
): RosaryBeadSegment[] {
  const segments: RosaryBeadSegment[] = [];

  // 1. Krok 1 (Duży paciorek): Rozważanie i Ojcze nasz
  const introNorm = normalizePolishTextForSpeech(introParts.join(' \n\n'));
  const introWordsCount = extractCleanWordsForKaraoke(introNorm).length;

  segments.push({
    beadIndex: 0,
    beadType: 'large_intro',
    label: 'Rozważanie & Ojcze nasz',
    subLabel: 'Krok 1: Rozważanie Tajemnicy oraz Modlitwa Pańska',
    startWordIdx: 0,
    endWordIdx: Math.max(0, introWordsCount - 1)
  });

  let currentStart = introWordsCount;

  // 2. 10 Małych paciorków: Zdrowaś Maryjo ze wstawką po słowie Jezus
  for (let i = 0; i < smallBeads.length && i < 10; i++) {
    const bead = smallBeads[i];
    const beadNorm = normalizePolishTextForSpeech(bead.text);
    const beadWordsCount = extractCleanWordsForKaraoke(beadNorm).length;
    const endWordIdx = Math.min(cleanWords.length - 1, currentStart + beadWordsCount - 1);

    segments.push({
      beadIndex: i + 1,
      beadType: 'small_decade',
      label: `Zdrowaś Maryjo #${i + 1} z 10`,
      subLabel: `Paciorek #${i + 1} z 10`,
      insertion: bead.dopowiedzenie,
      startWordIdx: currentStart,
      endWordIdx: Math.max(currentStart, endWordIdx)
    });

    currentStart = endWordIdx + 1;
  }

  // 3. Krok 3 (Duży paciorek): Chwała Ojcu i O mój Jezu
  segments.push({
    beadIndex: 11,
    beadType: 'large_conclusion',
    label: 'Chwała Ojcu & O mój Jezu',
    subLabel: 'Krok 3: Modlitwa Uwielbienia oraz Modlitwa Fatimska',
    startWordIdx: Math.min(currentStart, cleanWords.length - 1),
    endWordIdx: Math.max(0, cleanWords.length - 1)
  });

  return segments;
}

/**
 * Zwraca treść radiową dla wybranej stacji i numeru dnia.
 * Zawiera KOMPLETNĄ treść całych modlitw (Ojcze nasz, 10 x Zdrowaś Maryjo z dopowiedzeniami,
 * Chwała Ojcu, Modlitwa fatimska oraz modlitwy końcowe), z pełnym tekstem słownym
 * bez skrótów i cyfr, zsynchronizowanym z lektorem AI i napisami karaoke.
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

    const introParts = [
      `Nowy Różaniec Historii Zbawienia. Dzień ${dayOrdSpoken} ze stu siedemdziesięciu pięciu.`,
      `Etap ${stageOrdSpoken}: ${mystery.stageTitle}.`,
      `Część ${partOrdSpoken}: ${mystery.partTitle}.`,
      `Tajemnica: ${mystery.t}. ${mystery.sub}.`,
      `Fragment Pisma Świętego: ${bibRefSpoken}.`,
      `Rozważanie: ${mystery.med}`,
      `Modlitwa Pańska: ${OJCZE_NASZ_PELNY}`
    ];

    const conclusionParts = [
      CHWALA_OJCU_PELNE,
      MODLITWA_FATIMSKA_PELNA,
      mystery.prayer ? `Modlitwa na zakończenie: ${mystery.prayer}` : ''
    ].filter(Boolean);

    const speechParts = [
      ...introParts,
      ...dopowiedzeniaList,
      ...conclusionParts
    ];

    const rawSpeechText = speechParts.join(' \n\n');
    const speechText = normalizePolishTextForSpeech(rawSpeechText);

    const displayContent = [
      `📖 Źródło: ${mystery.ref} (${bibRefSpoken})`,
      `\n✨ Rozważanie:\n${mystery.med}`,
      `\n🙏 Modlitwa Pańska:\n${OJCZE_NASZ_PELNY}`,
      `\n📿 Dziesiątka Różańca Świętego:\n` + dopowiedzeniaList.join('\n\n'),
      `\n✨ ${CHWALA_OJCU_PELNE}`,
      `\n🕊️ ${MODLITWA_FATIMSKA_PELNA}`,
      mystery.prayer ? `\n🙏 Modlitwa końcowa:\n${mystery.prayer}` : ''
    ].join('\n');

    const cleanWords = extractCleanWordsForKaraoke(speechText);
    const rosarySegments = calculateRosarySegments(introParts, smallBeadsData, conclusionParts, cleanWords);

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

    const speechParts = [
      `Widoki na Raj. Dzień ${dayOrdSpoken} z trzystu sześćdziesięciu pięciu. ${spokenDate}.`,
      cleanTitle,
      cleanContent
    ];

    const rawSpeechText = speechParts.join(' \n\n');
    const speechText = normalizePolishTextForSpeech(rawSpeechText);
    const cleanWords = extractCleanWordsForKaraoke(speechText);

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
      words: cleanWords
    };
  }

  if (stationId === 'biblia365') {
    const bibliaEntry = getBibliaEntryForDayAndYear(safeDay, bibliaYear);
    const cleanContent = stripHtml(bibliaEntry.content || '').trim();
    const headlineTitle = `${bibliaEntry.bookTitle} (Rozdział ${bibliaEntry.chapter}) – ${bibliaEntry.title || bibliaEntry.passage}`;

    const dayOrdSpoken = numberToPolishOrdinal(safeDay, 'm');
    const chapterOrdSpoken = numberToPolishOrdinal(bibliaEntry.chapter, 'm');
    const bibRefSpoken = expandBiblicalReference(bibliaEntry.passage);

    const speechParts = [
      `Biblia trzysta sześćdziesiąt pięć i Apokryfy. Dzień ${dayOrdSpoken}.`,
      `Księga: ${bibliaEntry.bookTitle}, rozdział ${chapterOrdSpoken}. Fragment: ${bibRefSpoken}.`,
      bibliaEntry.title ? `Temat: ${bibliaEntry.title}.` : '',
      cleanContent
    ].filter(Boolean);

    const rawSpeechText = speechParts.join(' \n\n');
    const speechText = normalizePolishTextForSpeech(rawSpeechText);
    const cleanWords = extractCleanWordsForKaraoke(speechText);

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
      words: cleanWords
    };
  }

  // rhz365 (Pierwotny)
  const rhzEntry = RHZ365_FULL_DATA[safeDay] || RHZ365_FULL_DATA[1];
  const cleanPassage = stripHtml(rhzEntry.passage || '').trim();
  const cleanExplanation = stripHtml(rhzEntry.explanation || '').trim();
  const cleanOurFather = stripHtml(rhzEntry.ourFather || OJCZE_NASZ_PELNY).replace(/10 Osobnych Modlitw.*$/i, '').trim();

  const introParts = [
    `Różaniec Historii Zbawienia. Dzień ${dayOrdSpoken} z trzystu sześćdziesięciu pięciu. ${spokenDate}.`,
    rhzEntry.stageTitle,
    `Słowo Boże: ${cleanPassage}`,
    `Rozważanie: ${cleanExplanation}`,
    `Modlitwa Pańska: ${cleanOurFather || OJCZE_NASZ_PELNY}`
  ];

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

  const conclusionParts = [
    cleanGloryBe || CHWALA_OJCU_PELNE,
    cleanFatima || MODLITWA_FATIMSKA_PELNA,
    callsText ? `Wezwania do czynu: ${callsText}` : ''
  ].filter(Boolean);

  const speechParts = [
    ...introParts,
    ...beadsList,
    ...conclusionParts
  ];

  const rawSpeechText = speechParts.join(' \n\n');
  const speechText = normalizePolishTextForSpeech(rawSpeechText);
  const cleanWords = extractCleanWordsForKaraoke(speechText);
  const rosarySegments = calculateRosarySegments(introParts, smallBeadsData, conclusionParts, cleanWords);

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
    rosarySegments
  };
}
