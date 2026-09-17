import { RosaryVariant } from '../types';
import { RhzDayEntry } from './rhz365Data';

export interface RosaryBeadItem {
  id: string;
  stepIndex: number;
  type: 'cross' | 'large_transparent' | 'small' | 'chalice';
  colorType: 'transparent' | 'red' | 'green' | 'blue' | 'white' | 'black' | 'cyan' | 'magenta' | 'yellow' | 'chalice' | 'cross';
  label: string;
  subLabel?: string;
  letter?: 'I' | 'N' | 'L' | 'O' | 'V' | 'E';
  prayerName: string;
  prayerText: string;
  dopowiedzenie?: string;
  colorSymbolism: string;
  x: number;
  y: number;
  radius: number;
  labelAlign?: 'left' | 'right' | 'top' | 'bottom';
  badgeNumber?: string;
}

export interface RosaryModelDefinition {
  id: RosaryVariant;
  title: string;
  shortName: string;
  description: string;
  beadsCountLabel: string;
  colorModel: 'RGBA' | 'CMYK';
  layoutType: 'circle_full' | 'line' | 'circle_decade';
  viewBox: string;
  width: number;
  height: number;
  beads: RosaryBeadItem[];
}

export const COMMON_PRAYERS = {
  cross: {
    name: 'Znak Krzyża & Wierzę w Boga (Credo)',
    text: 'W imię Ojca i Syna, i Ducha Świętego. Amen. • Wierzę w Boga, Ojca Wszechmogącego, Stworzyciela nieba i ziemi. I w Jezusa Chrystusa, Syna Jego Jedynego, Pana naszego, który się począł z Ducha Świętego, narodził się z Maryi Panny, umęczon pod Ponckim Piłatem, ukrzyżowan, umarł i pogrzebion. Zstąpił do piekieł, trzeciego dnia zmartwychwstał. Wstąpił na niebiosa, siedzi po prawicy Boga Ojca Wszechmogącego. Stamtąd przyjdzie sądzić żywych i umarłych. Wierzę w Ducha Świętego, święty Kościół powszechny, świętych obcowanie, grzechów odpuszczenie, ciała zmartwychwstanie, żywot wieczny. Amen.'
  },
  ourFather: {
    name: 'Ojcze Nasz (Modlitwa Pańska)',
    text: 'Ojcze nasz, któryś jest w niebie, święć się imię Twoje; przyjdź królestwo Twoje; bądź wola Twoja jako w niebie, tak i na ziemi. Chleba naszego powszedniego daj nam dzisiaj; i odpuść nam nasze winy, jako i my odpuszczamy naszym winowajcom; i nie wódź nas na pokuszenie, ale nas zbaw ode złego. Amen.'
  },
  hailMaryFaith: {
    name: 'Zdrowaś Maryjo — O pomnożenie Wiary',
    text: 'Zdrowaś Maryjo, łaski pełna, Pan z Tobą, błogosławionaś Ty między niewiastami i błogosławiony owoc żywota Twojego, Jezus. Święta Maryjo, Matko Boża, módl się za nami grzesznymi teraz i w godzinę śmierci naszej. Amen.'
  },
  hailMaryHope: {
    name: 'Zdrowaś Maryjo — O umocnienie Nadziei',
    text: 'Zdrowaś Maryjo, łaski pełna, Pan z Tobą, błogosławionaś Ty między niewiastami i błogosławiony owoc żywota Twojego, Jezus. Święta Maryjo, Matko Boża, módl się za nami grzesznymi teraz i w godzinę śmierci naszej. Amen.'
  },
  hailMaryLove: {
    name: 'Zdrowaś Maryjo — O rozpalenie Miłości',
    text: 'Zdrowaś Maryjo, łaski pełna, Pan z Tobą, błogosławionaś Ty między niewiastami i błogosławiony owoc żywota Twojego, Jezus. Święta Maryjo, Matko Boża, módl się za nami grzesznymi teraz i w godzinę śmierci naszej. Amen.'
  },
  gloryBe: {
    name: 'Chwała Ojcu & Modlitwa Fatimska',
    text: 'Chwała Ojcu i Synowi, i Duchowi Świętemu, jak była na początku, teraz i zawsze, i na wieki wieków. Amen. • O mój Jezu, przebacz nam nasze grzechy, zachowaj nas od ognia piekielnego, zaprowadź wszystkie dusze do nieba i dopomóż szczególnie tym, którzy najbardziej potrzebują Twojego miłosierdzia.'
  },
  chalice: {
    name: 'Łącznik: Kielich z Hostią (Eucharystia)',
    text: 'Dzięki Ci czynimy, Panie Jezu Chryste, za dar Twojego Ciała i Krwi w Najświętszym Sakramencie Ołtarza. Otwieramy serca na rozważenie Tajemnic Twojego Odkupienia.'
  },
  decadeBead: (num: number, mysteryTitle?: string) => ({
    name: `Zdrowaś Maryjo (${num}/10) — ${mysteryTitle || 'Tajemnica Różańca'}`,
    text: 'Zdrowaś Maryjo, łaski pełna, Pan z Tobą, błogosławionaś Ty między niewiastami i błogosławiony owoc żywota Twojego, Jezus. Święta Maryjo, Matko Boża, módl się za nami grzesznymi teraz i w godzinę śmierci naszej. Amen.'
  })
};

// Color theological symbolism dictionary
export const COLOR_SYMBOLISM = {
  transparent: 'Czystość, łaska uświęcająca, przejrzystość intencji przed obliczem Boga (Kryształ Ducha)',
  red: 'Czerwień Rubinu (Red): Boska Miłość (Caritas), Krew Przenajświętsza, Odkupienie na Krzyżu',
  green: 'Zieleń Szmaragdu (Green): Nadzieja (Spes), Życie wieczne, odnowienie stworzenia',
  blue: 'Niebieski Szafir (Blue): Wiara (Fides), Niebiosa, czystość i opieka Matki Bożej',
  white: 'Biel Perły (White / Alpha): Niewinność, Zmartwychwstanie, Światłość Boga, Hostia Święta',
  black: 'Czerń Onyksu (Black / Key): Pokora, uniżenie, cień Golgoty i przezwyciężenie mroku grzechu',
  cyan: 'Cyjan (Cyan): Przejrzyste wody chrztu, tchnienie Ducha Świętego, orzeźwienie łaski',
  magenta: 'Magenta: Królewski majestat Chrystusa, męczeństwo i godność Dzieci Bożych',
  yellow: 'Żółty / Złoto (Yellow): Chwała Zmartwychwstałego, Boska Mądrość, słońce sprawiedliwości',
  cross: 'Drzewo Życia, zwycięstwo Zbawiciela nad śmiercią i grzechem',
  chalice: 'Kielich Nowego i Wiecznego Przymierza, Źródło i Szczyt życia chrześcijańskiego'
};

// Generator for Variant 1: 6 dużych przezroczystych paciorków i 50 małych w modelu RGBA
export function generateFull50Rgba(mysteryTitle?: string): RosaryModelDefinition {
  const beads: RosaryBeadItem[] = [];
  let step = 0;

  // 1. Cross at bottom
  beads.push({
    id: 'crux',
    stepIndex: step++,
    type: 'cross',
    colorType: 'cross',
    label: 'Krzyżyk',
    subLabel: 'Wierzę w Boga',
    prayerName: COMMON_PRAYERS.cross.name,
    prayerText: COMMON_PRAYERS.cross.text,
    colorSymbolism: COLOR_SYMBOLISM.cross,
    x: 300,
    y: 810,
    radius: 18,
    labelAlign: 'bottom',
    badgeNumber: 'CRUX'
  });

  // 2. Large transparent "I"
  beads.push({
    id: 'pendant_large_i',
    stepIndex: step++,
    type: 'large_transparent',
    colorType: 'transparent',
    letter: 'I',
    label: 'Koralik przezroczysty "I"',
    subLabel: 'Ojcze nasz',
    prayerName: COMMON_PRAYERS.ourFather.name,
    prayerText: COMMON_PRAYERS.ourFather.text,
    colorSymbolism: COLOR_SYMBOLISM.transparent,
    x: 300,
    y: 745,
    radius: 18,
    labelAlign: 'right',
    badgeNumber: '#1'
  });

  // 3. Small beads: Red, Green, Blue
  beads.push({
    id: 'pendant_red',
    stepIndex: step++,
    type: 'small',
    colorType: 'red',
    label: 'Koralik Czerwony (Red)',
    subLabel: 'Zdrowaś Maryjo (Miłość)',
    prayerName: COMMON_PRAYERS.hailMaryLove.name,
    prayerText: COMMON_PRAYERS.hailMaryLove.text,
    colorSymbolism: COLOR_SYMBOLISM.red,
    x: 300,
    y: 698,
    radius: 12,
    labelAlign: 'right',
    badgeNumber: '#2'
  });

  beads.push({
    id: 'pendant_green',
    stepIndex: step++,
    type: 'small',
    colorType: 'green',
    label: 'Koralik Zielony (Green)',
    subLabel: 'Zdrowaś Maryjo (Nadzieja)',
    prayerName: COMMON_PRAYERS.hailMaryHope.name,
    prayerText: COMMON_PRAYERS.hailMaryHope.text,
    colorSymbolism: COLOR_SYMBOLISM.green,
    x: 300,
    y: 658,
    radius: 12,
    labelAlign: 'right',
    badgeNumber: '#3'
  });

  beads.push({
    id: 'pendant_blue',
    stepIndex: step++,
    type: 'small',
    colorType: 'blue',
    label: 'Koralik Niebieski (Blue)',
    subLabel: 'Zdrowaś Maryjo (Wiara)',
    prayerName: COMMON_PRAYERS.hailMaryFaith.name,
    prayerText: COMMON_PRAYERS.hailMaryFaith.text,
    colorSymbolism: COLOR_SYMBOLISM.blue,
    x: 300,
    y: 618,
    radius: 12,
    labelAlign: 'right',
    badgeNumber: '#4'
  });

  // 4. Large transparent "N"
  beads.push({
    id: 'pendant_large_n',
    stepIndex: step++,
    type: 'large_transparent',
    colorType: 'transparent',
    letter: 'N',
    label: 'Koralik przezroczysty "N"',
    subLabel: 'Chwała Ojcu',
    prayerName: COMMON_PRAYERS.gloryBe.name,
    prayerText: COMMON_PRAYERS.gloryBe.text,
    colorSymbolism: COLOR_SYMBOLISM.transparent,
    x: 300,
    y: 565,
    radius: 18,
    labelAlign: 'right',
    badgeNumber: '#5'
  });

  // 5. Chalice / Trójnik
  beads.push({
    id: 'chalice',
    stepIndex: step++,
    type: 'chalice',
    colorType: 'chalice',
    label: 'Łącznik: Kielich z Hostią',
    subLabel: 'Eucharystia',
    prayerName: COMMON_PRAYERS.chalice.name,
    prayerText: COMMON_PRAYERS.chalice.text,
    colorSymbolism: COLOR_SYMBOLISM.chalice,
    x: 300,
    y: 495,
    radius: 22,
    labelAlign: 'bottom',
    badgeNumber: '#6'
  });

  // 6. The main loop: 5 decades of 10 beads + 4 large transparent beads ("L", "O", "V", "E")
  // Center of loop: (300, 275), radius: 195
  const cx = 300;
  const cy = 275;
  const r = 195;

  // Decade colors for RGBA:
  // Dec 1: 10x Black (Onyks)
  // Large 'L'
  // Dec 2: 10x Red (Rubin)
  // Large 'O'
  // Dec 3: 10x Green (Szmaragd)
  // Large 'V'
  // Dec 4: 10x Blue (Szafir)
  // Large 'E'
  // Dec 5: 10x White (Perła)
  const decades = [
    { name: 'I Dziesiątek: 10x Czarne (Onyks)', color: 'black' as const, colorDesc: 'Czarne (Onyks)', letter: 'L' as const },
    { name: 'II Dziesiątek: 10x Czerwone (Rubin)', color: 'red' as const, colorDesc: 'Czerwone (Rubin)', letter: 'O' as const },
    { name: 'III Dziesiątek: 10x Zielone (Szmaragd)', color: 'green' as const, colorDesc: 'Zielone (Szmaragd)', letter: 'V' as const },
    { name: 'IV Dziesiątek: 10x Niebieskie (Szafir)', color: 'blue' as const, colorDesc: 'Niebieskie (Szafir)', letter: 'E' as const },
    { name: 'V Dziesiątek: 10x Białe (Perła)', color: 'white' as const, colorDesc: 'Białe (Perła)', letter: undefined }
  ];

  // We distribute total 50 small + 4 large beads around the circle perimeter from 90° (bottom left) clockwise to 90° (bottom right).
  // Chalice is at angle 90° (bottom).
  // Total slots: 55 positions (10 small, 1 large, 10 small, 1 large, 10 small, 1 large, 10 small, 1 large, 10 small).
  const startAngle = 12; // degrees (just clockwise of bottom chalice)
  const totalSweep = 336; // leaving gap at bottom for chalice connection
  const totalSlots = 54;
  let slotIndex = 0;

  decades.forEach((decade, dIdx) => {
    // 10 small beads
    for (let i = 1; i <= 10; i++) {
      const angleDeg = startAngle + (slotIndex / totalSlots) * totalSweep;
      const angleRad = (angleDeg * Math.PI) / 180;
      const bx = cx - r * Math.sin(angleRad);
      const by = cy + r * Math.cos(angleRad);

      beads.push({
        id: `bead_d${dIdx + 1}_${i}`,
        stepIndex: step++,
        type: 'small',
        colorType: decade.color,
        label: `${decade.colorDesc} #${i}`,
        subLabel: `Zdrowaś Maryjo ${i}/10`,
        prayerName: COMMON_PRAYERS.decadeBead(i, mysteryTitle).name,
        prayerText: COMMON_PRAYERS.decadeBead(i, mysteryTitle).text,
        colorSymbolism: COLOR_SYMBOLISM[decade.color],
        x: bx,
        y: by,
        radius: 8.5,
        badgeNumber: `${i}`
      });
      slotIndex++;
    }

    // Large bead between decades (if not the last decade)
    if (decade.letter) {
      const angleDeg = startAngle + (slotIndex / totalSlots) * totalSweep;
      const angleRad = (angleDeg * Math.PI) / 180;
      const bx = cx - r * Math.sin(angleRad);
      const by = cy + r * Math.cos(angleRad);

      beads.push({
        id: `large_loop_${decade.letter}`,
        stepIndex: step++,
        type: 'large_transparent',
        colorType: 'transparent',
        letter: decade.letter,
        label: `Koralik przezroczysty "${decade.letter}"`,
        subLabel: 'Ojcze nasz / Chwała Ojcu',
        prayerName: `Ojcze nasz / Chwała Ojcu — Koralik "${decade.letter}"`,
        prayerText: COMMON_PRAYERS.ourFather.text,
        colorSymbolism: COLOR_SYMBOLISM.transparent,
        x: bx,
        y: by,
        radius: 17,
        badgeNumber: decade.letter
      });
      slotIndex++;
    }
  });

  return {
    id: 'full_50_rgba',
    title: '1. Pełny Różaniec RGBA (6 dużych przezroczystych + 50 małych)',
    shortName: '50+6 RGBA',
    description: 'Tradycyjny pełny różaniec z 6 dużymi przezroczystymi paciorkami (I-N-L-O-V-E) oraz 50 małymi w modelu barw RGBA (Czarne, Czerwone, Zielone, Niebieskie, Białe).',
    beadsCountLabel: '6 dużych transparentnych (I•N•L•O•V•E) + 50 małych paciorków RGBA',
    colorModel: 'RGBA',
    layoutType: 'circle_full',
    viewBox: '0 0 600 880',
    width: 600,
    height: 880,
    beads
  };
}

// Generator for Variant 2: 6 dużych przezroczystych paciorków i 50 małych w modelu CMYK
export function generateFull50Cmyk(mysteryTitle?: string): RosaryModelDefinition {
  const beads: RosaryBeadItem[] = [];
  let step = 0;

  // Pendant
  beads.push({
    id: 'crux',
    stepIndex: step++,
    type: 'cross',
    colorType: 'cross',
    label: 'Biały Krzyżyk',
    subLabel: 'Wierzę w Boga',
    prayerName: COMMON_PRAYERS.cross.name,
    prayerText: COMMON_PRAYERS.cross.text,
    colorSymbolism: COLOR_SYMBOLISM.cross,
    x: 300,
    y: 810,
    radius: 18,
    labelAlign: 'bottom',
    badgeNumber: 'CRUX'
  });

  beads.push({
    id: 'pendant_large_i',
    stepIndex: step++,
    type: 'large_transparent',
    colorType: 'transparent',
    letter: 'I',
    label: 'Koralik przezroczysty "I"',
    subLabel: 'Ojcze nasz',
    prayerName: COMMON_PRAYERS.ourFather.name,
    prayerText: COMMON_PRAYERS.ourFather.text,
    colorSymbolism: COLOR_SYMBOLISM.transparent,
    x: 300,
    y: 745,
    radius: 18,
    labelAlign: 'right',
    badgeNumber: '#1'
  });

  beads.push({
    id: 'pendant_cyan',
    stepIndex: step++,
    type: 'small',
    colorType: 'cyan',
    label: 'Koralik Cyjan (Cyan)',
    subLabel: 'Zdrowaś Maryjo (Tchnienie Ducha)',
    prayerName: COMMON_PRAYERS.hailMaryLove.name,
    prayerText: COMMON_PRAYERS.hailMaryLove.text,
    colorSymbolism: COLOR_SYMBOLISM.cyan,
    x: 300,
    y: 698,
    radius: 12,
    labelAlign: 'right',
    badgeNumber: '#2'
  });

  beads.push({
    id: 'pendant_magenta',
    stepIndex: step++,
    type: 'small',
    colorType: 'magenta',
    label: 'Koralik Magenta (Magenta)',
    subLabel: 'Zdrowaś Maryjo (Królewski Majestat)',
    prayerName: COMMON_PRAYERS.hailMaryHope.name,
    prayerText: COMMON_PRAYERS.hailMaryHope.text,
    colorSymbolism: COLOR_SYMBOLISM.magenta,
    x: 300,
    y: 658,
    radius: 12,
    labelAlign: 'right',
    badgeNumber: '#3'
  });

  beads.push({
    id: 'pendant_yellow',
    stepIndex: step++,
    type: 'small',
    colorType: 'yellow',
    label: 'Koralik Żółty (Yellow)',
    subLabel: 'Zdrowaś Maryjo (Boska Mądrość)',
    prayerName: COMMON_PRAYERS.hailMaryFaith.name,
    prayerText: COMMON_PRAYERS.hailMaryFaith.text,
    colorSymbolism: COLOR_SYMBOLISM.yellow,
    x: 300,
    y: 618,
    radius: 12,
    labelAlign: 'right',
    badgeNumber: '#4'
  });

  beads.push({
    id: 'pendant_large_n',
    stepIndex: step++,
    type: 'large_transparent',
    colorType: 'transparent',
    letter: 'N',
    label: 'Koralik przezroczysty "N"',
    subLabel: 'Chwała Ojcu',
    prayerName: COMMON_PRAYERS.gloryBe.name,
    prayerText: COMMON_PRAYERS.gloryBe.text,
    colorSymbolism: COLOR_SYMBOLISM.transparent,
    x: 300,
    y: 565,
    radius: 18,
    labelAlign: 'right',
    badgeNumber: '#5'
  });

  beads.push({
    id: 'chalice',
    stepIndex: step++,
    type: 'chalice',
    colorType: 'chalice',
    label: 'Łącznik: Kielich z Hostią',
    subLabel: 'Eucharystia',
    prayerName: COMMON_PRAYERS.chalice.name,
    prayerText: COMMON_PRAYERS.chalice.text,
    colorSymbolism: COLOR_SYMBOLISM.chalice,
    x: 300,
    y: 495,
    radius: 22,
    labelAlign: 'bottom',
    badgeNumber: '#6'
  });

  // Loop decades in CMYK:
  // 10x White (Białe / Paper)
  // Large 'L'
  // 10x Cyan (Cyjan)
  // Large 'O'
  // 10x Magenta (Purpura)
  // Large 'V'
  // 10x Yellow (Żółte)
  // Large 'E'
  // 10x Black (Czarne / Key)
  const cx = 300;
  const cy = 275;
  const r = 195;

  const cmykDecades = [
    { name: 'I Dziesiątek: 10x Białe (Paper)', color: 'white' as const, colorDesc: 'Białe', letter: 'L' as const },
    { name: 'II Dziesiątek: 10x Cyjan (Cyan)', color: 'cyan' as const, colorDesc: 'Cyjan', letter: 'O' as const },
    { name: 'III Dziesiątek: 10x Magenta', color: 'magenta' as const, colorDesc: 'Magenta', letter: 'V' as const },
    { name: 'IV Dziesiątek: 10x Żółte (Yellow)', color: 'yellow' as const, colorDesc: 'Żółte', letter: 'E' as const },
    { name: 'V Dziesiątek: 10x Czarne (Key)', color: 'black' as const, colorDesc: 'Czarne', letter: undefined }
  ];

  const startAngle = 12;
  const totalSweep = 336;
  const totalSlots = 54;
  let slotIndex = 0;

  cmykDecades.forEach((decade, dIdx) => {
    for (let i = 1; i <= 10; i++) {
      const angleDeg = startAngle + (slotIndex / totalSlots) * totalSweep;
      const angleRad = (angleDeg * Math.PI) / 180;
      const bx = cx - r * Math.sin(angleRad);
      const by = cy + r * Math.cos(angleRad);

      beads.push({
        id: `cmyk_bead_d${dIdx + 1}_${i}`,
        stepIndex: step++,
        type: 'small',
        colorType: decade.color,
        label: `${decade.colorDesc} #${i}`,
        subLabel: `Zdrowaś Maryjo ${i}/10`,
        prayerName: COMMON_PRAYERS.decadeBead(i, mysteryTitle).name,
        prayerText: COMMON_PRAYERS.decadeBead(i, mysteryTitle).text,
        colorSymbolism: COLOR_SYMBOLISM[decade.color],
        x: bx,
        y: by,
        radius: 8.5,
        badgeNumber: `${i}`
      });
      slotIndex++;
    }

    if (decade.letter) {
      const angleDeg = startAngle + (slotIndex / totalSlots) * totalSweep;
      const angleRad = (angleDeg * Math.PI) / 180;
      const bx = cx - r * Math.sin(angleRad);
      const by = cy + r * Math.cos(angleRad);

      beads.push({
        id: `cmyk_large_loop_${decade.letter}`,
        stepIndex: step++,
        type: 'large_transparent',
        colorType: 'transparent',
        letter: decade.letter,
        label: `Koralik przezroczysty "${decade.letter}"`,
        subLabel: 'Ojcze nasz / Chwała Ojcu',
        prayerName: `Ojcze nasz / Chwała Ojcu — Koralik "${decade.letter}"`,
        prayerText: COMMON_PRAYERS.ourFather.text,
        colorSymbolism: COLOR_SYMBOLISM.transparent,
        x: bx,
        y: by,
        radius: 17,
        badgeNumber: decade.letter
      });
      slotIndex++;
    }
  });

  return {
    id: 'full_50_cmyk',
    title: '2. Pełny Różaniec CMYK (6 dużych przezroczystych + 50 małych)',
    shortName: '50+6 CMYK',
    description: 'Tradycyjny pełny różaniec z 6 dużymi przezroczystymi paciorkami (I-N-L-O-V-E) oraz 50 małymi w poligraficznym modelu barw CMYK (Białe, Cyjan, Magenta, Żółte, Czarne).',
    beadsCountLabel: '6 dużych transparentnych (I•N•L•O•V•E) + 50 małych paciorków CMYK',
    colorModel: 'CMYK',
    layoutType: 'circle_full',
    viewBox: '0 0 600 880',
    width: 600,
    height: 880,
    beads
  };
}

// Generator for Variant 3: 2 duże paciorki i 13 małych w jednej linii w modelu RGBA
export function generateLine13Rgba(mysteryTitle?: string): RosaryModelDefinition {
  const beads: RosaryBeadItem[] = [];
  let step = 0;

  // Exact vertical linear configuration from reference photos 3 & 4:
  // Crux: Krzyżyk at y = 990
  beads.push({
    id: 'line_rgba_cross',
    stepIndex: step++,
    type: 'cross',
    colorType: 'cross',
    label: 'Krzyżyk',
    subLabel: 'Wierzę w Boga',
    prayerName: COMMON_PRAYERS.cross.name,
    prayerText: COMMON_PRAYERS.cross.text,
    colorSymbolism: COLOR_SYMBOLISM.cross,
    x: 220,
    y: 990,
    radius: 19,
    labelAlign: 'right',
    badgeNumber: 'CRUX'
  });

  // #1: Duży przezroczysty "I"
  beads.push({
    id: 'line_rgba_bead_1',
    stepIndex: step++,
    type: 'large_transparent',
    colorType: 'transparent',
    letter: 'I',
    label: 'Koralik przezroczysty z literą "I"',
    subLabel: 'Ojcze nasz',
    prayerName: COMMON_PRAYERS.ourFather.name,
    prayerText: COMMON_PRAYERS.ourFather.text,
    colorSymbolism: COLOR_SYMBOLISM.transparent,
    x: 220,
    y: 915,
    radius: 17,
    labelAlign: 'right',
    badgeNumber: '#1'
  });

  // #2: Czerwony (Red)
  beads.push({
    id: 'line_rgba_bead_2',
    stepIndex: step++,
    type: 'small',
    colorType: 'red',
    label: 'Koralik Czerwony (Red)',
    subLabel: 'Zdrowaś Maryjo (Miłość)',
    prayerName: COMMON_PRAYERS.hailMaryLove.name,
    prayerText: COMMON_PRAYERS.hailMaryLove.text,
    colorSymbolism: COLOR_SYMBOLISM.red,
    x: 220,
    y: 860,
    radius: 12,
    labelAlign: 'right',
    badgeNumber: '#2'
  });

  // #3: Zielony (Green)
  beads.push({
    id: 'line_rgba_bead_3',
    stepIndex: step++,
    type: 'small',
    colorType: 'green',
    label: 'Koralik Zielony (Green)',
    subLabel: 'Zdrowaś Maryjo (Nadzieja)',
    prayerName: COMMON_PRAYERS.hailMaryHope.name,
    prayerText: COMMON_PRAYERS.hailMaryHope.text,
    colorSymbolism: COLOR_SYMBOLISM.green,
    x: 220,
    y: 810,
    radius: 12,
    labelAlign: 'right',
    badgeNumber: '#3'
  });

  // #4: Niebieski (Blue)
  beads.push({
    id: 'line_rgba_bead_4',
    stepIndex: step++,
    type: 'small',
    colorType: 'blue',
    label: 'Koralik Niebieski (Blue)',
    subLabel: 'Zdrowaś Maryjo (Wiara)',
    prayerName: COMMON_PRAYERS.hailMaryFaith.name,
    prayerText: COMMON_PRAYERS.hailMaryFaith.text,
    colorSymbolism: COLOR_SYMBOLISM.blue,
    x: 220,
    y: 760,
    radius: 12,
    labelAlign: 'right',
    badgeNumber: '#4'
  });

  // #5: Duży przezroczysty "N"
  beads.push({
    id: 'line_rgba_bead_5',
    stepIndex: step++,
    type: 'large_transparent',
    colorType: 'transparent',
    letter: 'N',
    label: 'Koralik przezroczysty z literą "N"',
    subLabel: 'Chwała Ojcu',
    prayerName: COMMON_PRAYERS.gloryBe.name,
    prayerText: COMMON_PRAYERS.gloryBe.text,
    colorSymbolism: COLOR_SYMBOLISM.transparent,
    x: 220,
    y: 695,
    radius: 17,
    labelAlign: 'right',
    badgeNumber: '#5'
  });

  // #6: Kielich z Hostią
  beads.push({
    id: 'line_rgba_bead_6',
    stepIndex: step++,
    type: 'chalice',
    colorType: 'chalice',
    label: 'Łącznik: Kielich z Hostią (Trójnik)',
    subLabel: 'Eucharystia',
    prayerName: COMMON_PRAYERS.chalice.name,
    prayerText: COMMON_PRAYERS.chalice.text,
    colorSymbolism: COLOR_SYMBOLISM.chalice,
    x: 220,
    y: 620,
    radius: 22,
    labelAlign: 'right',
    badgeNumber: '#6'
  });

  // 10 decade beads in line (RGBA sequence):
  // #7: 1. Koralik Przezroczysty (przy kielichu)
  // #8: 2. Koralik Biały
  // #9: 3. Koralik Czerwony (Red)
  // #10: 4. Koralik Zielony (Green)
  // #11: 5. Koralik Niebieski (Blue)
  // #12: 6. Koralik Czerwony (Red 2)
  // #13: 7. Koralik Zielony (Green 2)
  // #14: 8. Koralik Niebieski (Blue 2)
  // #15: 9. Koralik Czarny (Onyks)
  // #16: 10. Koralik Przezroczysty (końcowy)
  const lineRgbaBeads = [
    { num: 1, label: '1. Koralik Przezroczysty (przy kielichu)', color: 'transparent' as const, badge: '#7' },
    { num: 2, label: '2. Koralik Biały (Perła)', color: 'white' as const, badge: '#8' },
    { num: 3, label: '3. Koralik Czerwony (Rubin)', color: 'red' as const, badge: '#9' },
    { num: 4, label: '4. Koralik Zielony (Szmaragd)', color: 'green' as const, badge: '#10' },
    { num: 5, label: '5. Koralik Niebieski (Szafir)', color: 'blue' as const, badge: '#11' },
    { num: 6, label: '6. Koralik Cyjan (Cyan)', color: 'cyan' as const, badge: '#12' },
    { num: 7, label: '7. Koralik Magenta (Purpura)', color: 'magenta' as const, badge: '#13' },
    { num: 8, label: '8. Koralik Żółty (Yellow)', color: 'yellow' as const, badge: '#14' },
    { num: 9, label: '9. Koralik Czarny (Onyks)', color: 'black' as const, badge: '#15' },
    { num: 10, label: '10. Koralik Przezroczysty (końcowy)', color: 'transparent' as const, badge: '#16' }
  ];

  let currentY = 540;
  lineRgbaBeads.forEach((b) => {
    beads.push({
      id: `line_rgba_decade_${b.num}`,
      stepIndex: step++,
      type: b.color === 'transparent' ? 'large_transparent' : 'small',
      colorType: b.color,
      label: b.label,
      subLabel: `Zdrowaś Maryjo (${b.num}/10)`,
      prayerName: COMMON_PRAYERS.decadeBead(b.num, mysteryTitle).name,
      prayerText: COMMON_PRAYERS.decadeBead(b.num, mysteryTitle).text,
      colorSymbolism: COLOR_SYMBOLISM[b.color],
      x: 220,
      y: currentY,
      radius: b.color === 'transparent' ? 14 : 11.5,
      labelAlign: 'right',
      badgeNumber: b.badge
    });
    currentY -= 50;
  });

  return {
    id: 'line_13_rgba',
    title: '3. Różaniec w Linii RGBA (2 duże + 13 małych paciorków)',
    shortName: 'Linia 2+13 RGBA',
    description: 'Pionowy układ liniowy z 2 dużymi paciorkami transparentnymi ("I" i "N") oraz 13 małymi paciorkami (3 na wisiorku + 10 w dziesiątku) w modelu RGBA.',
    beadsCountLabel: '2 duże przezroczyste ("I", "N") + 13 małych paciorków RGBA w jednej linii',
    colorModel: 'RGBA',
    layoutType: 'line',
    viewBox: '0 0 650 1080',
    width: 650,
    height: 1080,
    beads
  };
}

// Generator for Variant 4: 2 duże paciorki przezroczyste i 13 małych w jednej linii w modelu CMYK
export function generateLine13Cmyk(mysteryTitle?: string): RosaryModelDefinition {
  const beads: RosaryBeadItem[] = [];
  let step = 0;

  // Vertical line matching reference photos 3 and 4:
  beads.push({
    id: 'line_cmyk_cross',
    stepIndex: step++,
    type: 'cross',
    colorType: 'cross',
    label: 'Krzyżyk czarny (Heban)',
    subLabel: 'Wierzę w Boga',
    prayerName: COMMON_PRAYERS.cross.name,
    prayerText: COMMON_PRAYERS.cross.text,
    colorSymbolism: COLOR_SYMBOLISM.cross,
    x: 220,
    y: 990,
    radius: 19,
    labelAlign: 'right',
    badgeNumber: 'CRUX'
  });

  beads.push({
    id: 'line_cmyk_bead_1',
    stepIndex: step++,
    type: 'large_transparent',
    colorType: 'transparent',
    letter: 'I',
    label: 'Koralik przezroczysty z literą "I"',
    subLabel: 'Ojcze nasz',
    prayerName: COMMON_PRAYERS.ourFather.name,
    prayerText: COMMON_PRAYERS.ourFather.text,
    colorSymbolism: COLOR_SYMBOLISM.transparent,
    x: 220,
    y: 915,
    radius: 17,
    labelAlign: 'right',
    badgeNumber: '#1'
  });

  beads.push({
    id: 'line_cmyk_bead_2',
    stepIndex: step++,
    type: 'small',
    colorType: 'cyan',
    label: 'Koralik Cyjan (Cyan)',
    subLabel: 'Zdrowaś Maryjo (Tchnienie Ducha)',
    prayerName: COMMON_PRAYERS.hailMaryLove.name,
    prayerText: COMMON_PRAYERS.hailMaryLove.text,
    colorSymbolism: COLOR_SYMBOLISM.cyan,
    x: 220,
    y: 860,
    radius: 12,
    labelAlign: 'right',
    badgeNumber: '#2'
  });

  beads.push({
    id: 'line_cmyk_bead_3',
    stepIndex: step++,
    type: 'small',
    colorType: 'magenta',
    label: 'Koralik Magenta (Magenta)',
    subLabel: 'Zdrowaś Maryjo (Królewski Majestat)',
    prayerName: COMMON_PRAYERS.hailMaryHope.name,
    prayerText: COMMON_PRAYERS.hailMaryHope.text,
    colorSymbolism: COLOR_SYMBOLISM.magenta,
    x: 220,
    y: 810,
    radius: 12,
    labelAlign: 'right',
    badgeNumber: '#3'
  });

  beads.push({
    id: 'line_cmyk_bead_4',
    stepIndex: step++,
    type: 'small',
    colorType: 'yellow',
    label: 'Koralik Żółty (Yellow)',
    subLabel: 'Zdrowaś Maryjo (Boska Mądrość)',
    prayerName: COMMON_PRAYERS.hailMaryFaith.name,
    prayerText: COMMON_PRAYERS.hailMaryFaith.text,
    colorSymbolism: COLOR_SYMBOLISM.yellow,
    x: 220,
    y: 760,
    radius: 12,
    labelAlign: 'right',
    badgeNumber: '#4'
  });

  beads.push({
    id: 'line_cmyk_bead_5',
    stepIndex: step++,
    type: 'large_transparent',
    colorType: 'transparent',
    letter: 'N',
    label: 'Koralik przezroczysty z literą "N"',
    subLabel: 'Chwała Ojcu',
    prayerName: COMMON_PRAYERS.gloryBe.name,
    prayerText: COMMON_PRAYERS.gloryBe.text,
    colorSymbolism: COLOR_SYMBOLISM.transparent,
    x: 220,
    y: 695,
    radius: 17,
    labelAlign: 'right',
    badgeNumber: '#5'
  });

  beads.push({
    id: 'line_cmyk_bead_6',
    stepIndex: step++,
    type: 'chalice',
    colorType: 'chalice',
    label: 'Łącznik: Kielich z Hostią (Trójnik)',
    subLabel: 'Eucharystia',
    prayerName: COMMON_PRAYERS.chalice.name,
    prayerText: COMMON_PRAYERS.chalice.text,
    colorSymbolism: COLOR_SYMBOLISM.chalice,
    x: 220,
    y: 620,
    radius: 22,
    labelAlign: 'right',
    badgeNumber: '#6'
  });

  // Exactly matching the CMYK sequence in IMG-20260827-WA0005.jpg / IMG-20260827-WA0008.jpg:
  // #7: 1. Koralik Przezroczysty (przy kielichu)
  // #8: 2. Koralik Czarny
  // #9: 3. Koralik Żółty (Yellow)
  // #10: 4. Koralik Magenta
  // #11: 5. Koralik Cyjan (Cyan)
  // #12: 6. Koralik Niebieski (Blue)
  // #13: 7. Koralik Zielony (Green)
  // #14: 8. Koralik Czerwony (Red)
  // #15: 9. Koralik Biały
  // #16: 10. Koralik Przezroczysty (końcowy / powrót do trójnika)
  const lineCmykBeads = [
    { num: 1, label: '1. Koralik Przezroczysty (przy kielichu)', color: 'transparent' as const, badge: '#7' },
    { num: 2, label: '2. Koralik Czarny (Key)', color: 'black' as const, badge: '#8' },
    { num: 3, label: '3. Koralik Żółty (Yellow)', color: 'yellow' as const, badge: '#9' },
    { num: 4, label: '4. Koralik Magenta', color: 'magenta' as const, badge: '#10' },
    { num: 5, label: '5. Koralik Cyjan (Cyan)', color: 'cyan' as const, badge: '#11' },
    { num: 6, label: '6. Koralik Niebieski (Blue)', color: 'blue' as const, badge: '#12' },
    { num: 7, label: '7. Koralik Zielony (Green)', color: 'green' as const, badge: '#13' },
    { num: 8, label: '8. Koralik Czerwony (Red)', color: 'red' as const, badge: '#14' },
    { num: 9, label: '9. Koralik Biały (Paper)', color: 'white' as const, badge: '#15' },
    { num: 10, label: '10. Koralik Przezroczysty (końcowy)', color: 'transparent' as const, badge: '#16' }
  ];

  let currentY = 540;
  lineCmykBeads.forEach((b) => {
    beads.push({
      id: `line_cmyk_decade_${b.num}`,
      stepIndex: step++,
      type: b.color === 'transparent' ? 'large_transparent' : 'small',
      colorType: b.color,
      label: b.label,
      subLabel: `Zdrowaś Maryjo (${b.num}/10)`,
      prayerName: COMMON_PRAYERS.decadeBead(b.num, mysteryTitle).name,
      prayerText: COMMON_PRAYERS.decadeBead(b.num, mysteryTitle).text,
      colorSymbolism: COLOR_SYMBOLISM[b.color],
      x: 220,
      y: currentY,
      radius: b.color === 'transparent' ? 14 : 11.5,
      labelAlign: 'right',
      badgeNumber: b.badge
    });
    currentY -= 50;
  });

  return {
    id: 'line_13_cmyk',
    title: '4. Różaniec w Linii CMYK (2 duże + 13 małych paciorków)',
    shortName: 'Linia 2+13 CMYK',
    description: 'Pionowy układ liniowy z 2 dużymi paciorkami transparentnymi ("I" i "N") oraz 13 małymi paciorkami w pełnym spektrum CMYK + RGB.',
    beadsCountLabel: '2 duże przezroczyste ("I", "N") + 13 małych paciorków CMYK w jednej linii',
    colorModel: 'CMYK',
    layoutType: 'line',
    viewBox: '0 0 650 1080',
    width: 650,
    height: 1080,
    beads
  };
}

// Generator for Variant 5: 2 duże paciorki przezroczyste i 13 małych w okręgu w modelu RGBA
export function generateCircle13Rgba(mysteryTitle?: string): RosaryModelDefinition {
  const beads: RosaryBeadItem[] = [];
  let step = 0;

  // Pendant section
  beads.push({
    id: 'circle_rgba_cross',
    stepIndex: step++,
    type: 'cross',
    colorType: 'cross',
    label: 'Krzyżyk',
    subLabel: 'Wierzę w Boga',
    prayerName: COMMON_PRAYERS.cross.name,
    prayerText: COMMON_PRAYERS.cross.text,
    colorSymbolism: COLOR_SYMBOLISM.cross,
    x: 300,
    y: 840,
    radius: 19,
    labelAlign: 'bottom',
    badgeNumber: 'CRUX'
  });

  beads.push({
    id: 'circle_rgba_bead_i',
    stepIndex: step++,
    type: 'large_transparent',
    colorType: 'transparent',
    letter: 'I',
    label: 'Koralik przezroczysty z literą "I"',
    subLabel: 'Ojcze nasz',
    prayerName: COMMON_PRAYERS.ourFather.name,
    prayerText: COMMON_PRAYERS.ourFather.text,
    colorSymbolism: COLOR_SYMBOLISM.transparent,
    x: 300,
    y: 770,
    radius: 17,
    labelAlign: 'right',
    badgeNumber: '#1'
  });

  beads.push({
    id: 'circle_rgba_red',
    stepIndex: step++,
    type: 'small',
    colorType: 'red',
    label: 'Koralik Czerwony (Red)',
    subLabel: 'Zdrowaś Maryjo (Miłość)',
    prayerName: COMMON_PRAYERS.hailMaryLove.name,
    prayerText: COMMON_PRAYERS.hailMaryLove.text,
    colorSymbolism: COLOR_SYMBOLISM.red,
    x: 300,
    y: 715,
    radius: 12,
    labelAlign: 'right',
    badgeNumber: '#2'
  });

  beads.push({
    id: 'circle_rgba_green',
    stepIndex: step++,
    type: 'small',
    colorType: 'green',
    label: 'Koralik Zielony (Green)',
    subLabel: 'Zdrowaś Maryjo (Nadzieja)',
    prayerName: COMMON_PRAYERS.hailMaryHope.name,
    prayerText: COMMON_PRAYERS.hailMaryHope.text,
    colorSymbolism: COLOR_SYMBOLISM.green,
    x: 300,
    y: 668,
    radius: 12,
    labelAlign: 'right',
    badgeNumber: '#3'
  });

  beads.push({
    id: 'circle_rgba_blue',
    stepIndex: step++,
    type: 'small',
    colorType: 'blue',
    label: 'Koralik Niebieski (Blue)',
    subLabel: 'Zdrowaś Maryjo (Wiara)',
    prayerName: COMMON_PRAYERS.hailMaryFaith.name,
    prayerText: COMMON_PRAYERS.hailMaryFaith.text,
    colorSymbolism: COLOR_SYMBOLISM.blue,
    x: 300,
    y: 620,
    radius: 12,
    labelAlign: 'right',
    badgeNumber: '#4'
  });

  beads.push({
    id: 'circle_rgba_bead_n',
    stepIndex: step++,
    type: 'large_transparent',
    colorType: 'transparent',
    letter: 'N',
    label: 'Koralik przezroczysty z literą "N"',
    subLabel: 'Chwała Ojcu',
    prayerName: COMMON_PRAYERS.gloryBe.name,
    prayerText: COMMON_PRAYERS.gloryBe.text,
    colorSymbolism: COLOR_SYMBOLISM.transparent,
    x: 300,
    y: 560,
    radius: 17,
    labelAlign: 'right',
    badgeNumber: '#5'
  });

  beads.push({
    id: 'circle_rgba_chalice',
    stepIndex: step++,
    type: 'chalice',
    colorType: 'chalice',
    label: 'Łącznik / Trójnik (Kielich)',
    subLabel: 'Eucharystia',
    prayerName: COMMON_PRAYERS.chalice.name,
    prayerText: COMMON_PRAYERS.chalice.text,
    colorSymbolism: COLOR_SYMBOLISM.chalice,
    x: 300,
    y: 485,
    radius: 22,
    labelAlign: 'bottom',
    badgeNumber: '#6'
  });

  // Circle decade (10 beads arranged in an ellipse/circle matching IMG-20260827-WA0009 / WA0010)
  // Center of circle: (300, 240), Radius: 180
  const cx = 300;
  const cy = 240;
  const r = 180;

  const circleRgbaBeads = [
    { num: 1, label: '1. Koralik Przezroczysty (przy kielichu)', color: 'transparent' as const, badge: '#7', angle: 20 },
    { num: 2, label: '2. Koralik Biały (Perła)', color: 'white' as const, badge: '#8', angle: 55 },
    { num: 3, label: '3. Koralik Czerwony (Rubin)', color: 'red' as const, badge: '#9', angle: 90 },
    { num: 4, label: '4. Koralik Zielony (Szmaragd)', color: 'green' as const, badge: '#10', angle: 130 },
    { num: 5, label: '5. Koralik Niebieski (Szafir)', color: 'blue' as const, badge: '#11', angle: 165 },
    { num: 6, label: '6. Koralik Cyjan (Cyan)', color: 'cyan' as const, badge: '#12', angle: 195 },
    { num: 7, label: '7. Koralik Magenta (Purpura)', color: 'magenta' as const, badge: '#13', angle: 230 },
    { num: 8, label: '8. Koralik Żółty (Yellow)', color: 'yellow' as const, badge: '#14', angle: 270 },
    { num: 9, label: '9. Koralik Czarny (Onyks)', color: 'black' as const, badge: '#15', angle: 305 },
    { num: 10, label: '10. Koralik Przezroczysty (końcowy)', color: 'transparent' as const, badge: '#16', angle: 340 }
  ];

  circleRgbaBeads.forEach((b) => {
    const angleRad = (b.angle * Math.PI) / 180;
    const bx = cx - r * Math.sin(angleRad);
    const by = cy + r * Math.cos(angleRad);

    beads.push({
      id: `circle_rgba_decade_${b.num}`,
      stepIndex: step++,
      type: b.color === 'transparent' ? 'large_transparent' : 'small',
      colorType: b.color,
      label: b.label,
      subLabel: `Zdrowaś Maryjo (${b.num}/10)`,
      prayerName: COMMON_PRAYERS.decadeBead(b.num, mysteryTitle).name,
      prayerText: COMMON_PRAYERS.decadeBead(b.num, mysteryTitle).text,
      colorSymbolism: COLOR_SYMBOLISM[b.color],
      x: bx,
      y: by,
      radius: b.color === 'transparent' ? 14 : 12,
      labelAlign: bx < 300 ? 'left' : 'right',
      badgeNumber: b.badge
    });
  });

  return {
    id: 'circle_13_rgba',
    title: '5. Różaniec w Okręgu RGBA (2 duże + 13 małych paciorków)',
    shortName: 'Okrąg 2+13 RGBA',
    description: 'Dziesiątek różańca ułożony w eleganckim okręgu nad wisiorkiem z 2 dużymi paciorkami ("I", "N") i 13 małymi paciorkami w modelu RGBA.',
    beadsCountLabel: '2 duże przezroczyste ("I", "N") + 13 małych paciorków RGBA w okręgu',
    colorModel: 'RGBA',
    layoutType: 'circle_decade',
    viewBox: '0 0 650 920',
    width: 650,
    height: 920,
    beads
  };
}

// Generator for Variant 6: 2 duże paciorki przezroczyste i 13 małych w okręgu w modelu CMYK
export function generateCircle13Cmyk(mysteryTitle?: string): RosaryModelDefinition {
  const beads: RosaryBeadItem[] = [];
  let step = 0;

  // Pendant section
  beads.push({
    id: 'circle_cmyk_cross',
    stepIndex: step++,
    type: 'cross',
    colorType: 'cross',
    label: 'Biały Krzyżyk',
    subLabel: 'Wierzę w Boga',
    prayerName: COMMON_PRAYERS.cross.name,
    prayerText: COMMON_PRAYERS.cross.text,
    colorSymbolism: COLOR_SYMBOLISM.cross,
    x: 300,
    y: 840,
    radius: 19,
    labelAlign: 'bottom',
    badgeNumber: 'CRUX'
  });

  beads.push({
    id: 'circle_cmyk_bead_i',
    stepIndex: step++,
    type: 'large_transparent',
    colorType: 'transparent',
    letter: 'I',
    label: 'Koralik przezroczysty z literą "I"',
    subLabel: 'Ojcze nasz',
    prayerName: COMMON_PRAYERS.ourFather.name,
    prayerText: COMMON_PRAYERS.ourFather.text,
    colorSymbolism: COLOR_SYMBOLISM.transparent,
    x: 300,
    y: 770,
    radius: 17,
    labelAlign: 'right',
    badgeNumber: '#1'
  });

  beads.push({
    id: 'circle_cmyk_cyan',
    stepIndex: step++,
    type: 'small',
    colorType: 'cyan',
    label: 'Koralik Cyjan (Cyan)',
    subLabel: 'Zdrowaś Maryjo (Tchnienie Ducha)',
    prayerName: COMMON_PRAYERS.hailMaryLove.name,
    prayerText: COMMON_PRAYERS.hailMaryLove.text,
    colorSymbolism: COLOR_SYMBOLISM.cyan,
    x: 300,
    y: 715,
    radius: 12,
    labelAlign: 'right',
    badgeNumber: '#2'
  });

  beads.push({
    id: 'circle_cmyk_magenta',
    stepIndex: step++,
    type: 'small',
    colorType: 'magenta',
    label: 'Koralik Magenta (Magenta)',
    subLabel: 'Zdrowaś Maryjo (Królewski Majestat)',
    prayerName: COMMON_PRAYERS.hailMaryHope.name,
    prayerText: COMMON_PRAYERS.hailMaryHope.text,
    colorSymbolism: COLOR_SYMBOLISM.magenta,
    x: 300,
    y: 668,
    radius: 12,
    labelAlign: 'right',
    badgeNumber: '#3'
  });

  beads.push({
    id: 'circle_cmyk_yellow',
    stepIndex: step++,
    type: 'small',
    colorType: 'yellow',
    label: 'Koralik Żółty (Yellow)',
    subLabel: 'Zdrowaś Maryjo (Boska Mądrość)',
    prayerName: COMMON_PRAYERS.hailMaryFaith.name,
    prayerText: COMMON_PRAYERS.hailMaryFaith.text,
    colorSymbolism: COLOR_SYMBOLISM.yellow,
    x: 300,
    y: 620,
    radius: 12,
    labelAlign: 'right',
    badgeNumber: '#4'
  });

  beads.push({
    id: 'circle_cmyk_bead_n',
    stepIndex: step++,
    type: 'large_transparent',
    colorType: 'transparent',
    letter: 'N',
    label: 'Koralik przezroczysty z literą "N"',
    subLabel: 'Chwała Ojcu',
    prayerName: COMMON_PRAYERS.gloryBe.name,
    prayerText: COMMON_PRAYERS.gloryBe.text,
    colorSymbolism: COLOR_SYMBOLISM.transparent,
    x: 300,
    y: 560,
    radius: 17,
    labelAlign: 'right',
    badgeNumber: '#5'
  });

  beads.push({
    id: 'circle_cmyk_chalice',
    stepIndex: step++,
    type: 'chalice',
    colorType: 'chalice',
    label: 'Łącznik / Trójnik (Kielich)',
    subLabel: 'Eucharystia',
    prayerName: COMMON_PRAYERS.chalice.name,
    prayerText: COMMON_PRAYERS.chalice.text,
    colorSymbolism: COLOR_SYMBOLISM.chalice,
    x: 300,
    y: 485,
    radius: 22,
    labelAlign: 'bottom',
    badgeNumber: '#6'
  });

  // Circle decade in CMYK matching 1-to-1 Variant 4 (Linia CMYK):
  // #7: 1. Koralik Przezroczysty
  // #8: 2. Koralik Czarny (Key)
  // #9: 3. Koralik Żółty (Yellow)
  // #10: 4. Koralik Magenta
  // #11: 5. Koralik Cyjan (Cyan)
  // #12: 6. Koralik Niebieski (Blue)
  // #13: 7. Koralik Zielony (Green)
  // #14: 8. Koralik Czerwony (Red)
  // #15: 9. Koralik Biały (Paper)
  // #16: 10. Koralik Przezroczysty (końcowy)
  const cx = 300;
  const cy = 240;
  const r = 180;

  const circleCmykBeads = [
    { num: 1, label: '1. Koralik Przezroczysty (przy kielichu)', color: 'transparent' as const, badge: '#7', angle: 20 },
    { num: 2, label: '2. Koralik Czarny (Key)', color: 'black' as const, badge: '#8', angle: 55 },
    { num: 3, label: '3. Koralik Żółty (Yellow)', color: 'yellow' as const, badge: '#9', angle: 90 },
    { num: 4, label: '4. Koralik Magenta (Magenta)', color: 'magenta' as const, badge: '#10', angle: 130 },
    { num: 5, label: '5. Koralik Cyjan (Cyan)', color: 'cyan' as const, badge: '#11', angle: 165 },
    { num: 6, label: '6. Koralik Niebieski (Blue)', color: 'blue' as const, badge: '#12', angle: 195 },
    { num: 7, label: '7. Koralik Zielony (Green)', color: 'green' as const, badge: '#13', angle: 230 },
    { num: 8, label: '8. Koralik Czerwony (Red)', color: 'red' as const, badge: '#14', angle: 270 },
    { num: 9, label: '9. Koralik Biały (Paper)', color: 'white' as const, badge: '#15', angle: 305 },
    { num: 10, label: '10. Koralik Przezroczysty (końcowy)', color: 'transparent' as const, badge: '#16', angle: 340 }
  ];

  circleCmykBeads.forEach((b) => {
    const angleRad = (b.angle * Math.PI) / 180;
    const bx = cx - r * Math.sin(angleRad);
    const by = cy + r * Math.cos(angleRad);

    beads.push({
      id: `circle_cmyk_decade_${b.num}`,
      stepIndex: step++,
      type: b.color === 'transparent' ? 'large_transparent' : 'small',
      colorType: b.color,
      label: b.label,
      subLabel: `Zdrowaś Maryjo (${b.num}/10)`,
      prayerName: COMMON_PRAYERS.decadeBead(b.num, mysteryTitle).name,
      prayerText: COMMON_PRAYERS.decadeBead(b.num, mysteryTitle).text,
      colorSymbolism: COLOR_SYMBOLISM[b.color],
      x: bx,
      y: by,
      radius: b.color === 'transparent' ? 14 : 12,
      labelAlign: bx < 300 ? 'left' : 'right',
      badgeNumber: b.badge
    });
  });

  return {
    id: 'circle_13_cmyk',
    title: '6. Różaniec w Okręgu CMYK (2 duże + 13 małych paciorków)',
    shortName: 'Okrąg 2+13 CMYK',
    description: 'Dziesiątek różańca w okręgu nad wisiorkiem z 2 dużymi paciorkami ("I", "N") i 13 małymi paciorkami w pełnym spektrum CMYK.',
    beadsCountLabel: '2 duże przezroczyste ("I", "N") + 13 małych paciorków CMYK w okręgu',
    colorModel: 'CMYK',
    layoutType: 'circle_decade',
    viewBox: '0 0 650 920',
    width: 650,
    height: 920,
    beads
  };
}

export function getRosaryModel(variant: RosaryVariant, mysteryTitle?: string, rhzEntry?: RhzDayEntry): RosaryModelDefinition {
  let model: RosaryModelDefinition;
  switch (variant) {
    case 'full_50_rgba':
      model = generateFull50Rgba(mysteryTitle);
      break;
    case 'full_50_cmyk':
      model = generateFull50Cmyk(mysteryTitle);
      break;
    case 'line_13_rgba':
      model = generateLine13Rgba(mysteryTitle);
      break;
    case 'line_13_cmyk':
      model = generateLine13Cmyk(mysteryTitle);
      break;
    case 'circle_13_rgba':
      model = generateCircle13Rgba(mysteryTitle);
      break;
    case 'circle_13_cmyk':
      model = generateCircle13Cmyk(mysteryTitle);
      break;
    default:
      model = generateFull50Rgba(mysteryTitle);
      break;
  }

  if (rhzEntry && rhzEntry.smallBeads && rhzEntry.smallBeads.length > 0) {
    let smallBeadCounter = 0;
    model.beads = model.beads.map((bead) => {
      if (bead.type === 'small' && smallBeadCounter < 10) {
        const rhzBead = rhzEntry.smallBeads[smallBeadCounter];
        smallBeadCounter++;
        if (rhzBead) {
          return {
            ...bead,
            prayerName: `Zdrowaś Maryjo #${rhzBead.beadNumber} — ${rhzEntry.stageTitle}`,
            prayerText: rhzBead.text || bead.prayerText,
            dopowiedzenie: rhzBead.dopowiedzenie
          };
        }
      }
      return bead;
    });
  }

  return model;
}
