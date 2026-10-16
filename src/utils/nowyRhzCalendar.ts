import { NowyRhzMystery, NOWY_RHZ_MYSTERIES, TAJEMNICA_ZERO } from '../data/nowyRhzData';
import { NOWY_RHZ_CYCLE_2_MYSTERIES } from '../data/nowyRhzCycle2Data';
import { CycleDate } from '../types';

export interface NowyRhzBreakInfo {
  breakIndex: 1 | 2;
  dayInBreak: number;
  totalBreakDays: number;
  title: string;
  subtitle: string;
  description: string;
  nextCycleDate: string;
}

export interface NowyRhzCalendarStatus {
  cycle: 1 | 2;
  isBreak: boolean;
  dayInCycle: number; // 1..175 (jeśli isBreak: false)
  breakInfo?: NowyRhzBreakInfo;
  mystery: NowyRhzMystery;
  displayLabel: string;
  cycleName: string;
}

/**
 * Zwraca numer dnia w roku według 365-dniowego cyklu (1..365),
 * gdzie Dzień 1 = 25 grudnia, a 29 lutego jest pomijany (traktowany jak 28 lutego).
 */
export function getSpiritualDayNumber(month: number, day: number): number {
  let m = month;
  let d = day;
  // 29 lutego pomijany – traktowany jak 28 lutego
  if (m === 2 && d === 29) {
    d = 28;
  }

  // 25 - 31 grudnia -> dni 1..7
  if (m === 12 && d >= 25) {
    return d - 24;
  }

  // Miesiące standardowego roku 365 dni (luty = 28 dni)
  const monthDays = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let dayNumber = 7; // Za 25-31 grudnia
  for (let i = 1; i < m; i++) {
    dayNumber += monthDays[i];
  }
  dayNumber += d;

  return Math.max(1, Math.min(365, dayNumber));
}

/**
 * Główna funkcja kalendarza Nowego RHZ:
 * - Cykl 1: 25 grudnia – 17 czerwca (175 dni, dni roku 1..175)
 * - Przerwa 1: 18 czerwca – 24 czerwca (7 dni, dni roku 176..182)
 * - Cykl 2: 25 czerwca – 16 grudnia (175 dni, dni roku 183..357)
 * - Przerwa 2: 17 grudnia – 24 grudnia (8 dni, dni roku 358..365)
 * - Od 25 grudnia powtórzenie Cyklu 1.
 * Rok jest ignorowany – decyduje tylko dzień i miesiąc. 29 lutego pominięty.
 */
export function getNowyRhzCalendarStatus(month: number, day: number): NowyRhzCalendarStatus {
  const dayNumber = getSpiritualDayNumber(month, day);

  // 1. Cykl 1: 25 grudnia do 17 czerwca (175 dni)
  if (dayNumber >= 1 && dayNumber <= 175) {
    const dayInCycle = dayNumber;
    const mystery = NOWY_RHZ_MYSTERIES.find(m => m.day === dayInCycle) || NOWY_RHZ_MYSTERIES[dayInCycle] || NOWY_RHZ_MYSTERIES[0];
    return {
      cycle: 1,
      isBreak: false,
      dayInCycle,
      mystery,
      displayLabel: `Cykl 1 • Dzień ${dayInCycle} ze 175 (25 XII – 17 VI)`,
      cycleName: 'Cykl 1: Od Stworzenia do Paruzji (Narodzenie – Czerwiec)'
    };
  }

  // 2. Przerwa 1: 18 czerwca do 24 czerwca (7 dni)
  if (dayNumber >= 176 && dayNumber <= 182) {
    const dayInBreak = dayNumber - 175;
    const breakInfo: NowyRhzBreakInfo = {
      breakIndex: 1,
      dayInBreak,
      totalBreakDays: 7,
      title: 'Letnia Przerwa Modlitewna (7 dni)',
      subtitle: `Dzień ${dayInBreak} z 7 dni przerwy (18 – 24 czerwca)`,
      description: 'Czas dziękczynienia za owoce Cyklu 1, wyciszenia i modlitwy przygotowawczej. Cykl 2 rozpocznie się 25 czerwca (kolejnych 7 ksiąg historycznych, brakujące tematy mądrościowe i prorockie, nowe rozważania życia Jezusa i Maryi oraz dzieje Kościoła).',
      nextCycleDate: '25 czerwca (Cykl 2)'
    };
    return {
      cycle: 1,
      isBreak: true,
      dayInCycle: 175,
      breakInfo,
      mystery: TAJEMNICA_ZERO,
      displayLabel: `Przerwa Letnia • Dzień ${dayInBreak}/7 (do 24 VI)`,
      cycleName: 'Letnia Przerwa Modlitewna (18 – 24 czerwca)'
    };
  }

  // 3. Cykl 2: 25 czerwca do 16 grudnia (175 dni)
  if (dayNumber >= 183 && dayNumber <= 357) {
    const dayInCycle = dayNumber - 182;
    const mystery = NOWY_RHZ_CYCLE_2_MYSTERIES.find(m => m.day === dayInCycle) || NOWY_RHZ_CYCLE_2_MYSTERIES[dayInCycle - 1] || NOWY_RHZ_CYCLE_2_MYSTERIES[0];
    return {
      cycle: 2,
      isBreak: false,
      dayInCycle,
      mystery,
      displayLabel: `Cykl 2 • Dzień ${dayInCycle} ze 175 (25 VI – 16 XII)`,
      cycleName: 'Cykl 2: Księgi Uzupełniające i Świadkowie Wieków (Czerwiec – Grudzień)'
    };
  }

  // 4. Przerwa 2: 17 grudnia do 24 grudnia (8 dni)
  const dayInBreak = dayNumber - 357;
  const breakInfo: NowyRhzBreakInfo = {
    breakIndex: 2,
    dayInBreak,
    totalBreakDays: 8,
    title: 'Adwentowa Przerwa Przedświąteczna (8 dni)',
    subtitle: `Dzień ${dayInBreak} z 8 dni przerwy (17 – 24 grudnia)`,
    description: 'Czas bezpośredniego przygotowania serc na Uroczystość Narodzenia Pańskiego wraz z Wielkimi Antyfonami Adwentowymi. Od 25 grudnia rozpocznie się powtórzenie Cyklu 1 (od Stworzenia Świata do Paruzji).',
    nextCycleDate: '25 grudnia (Cykl 1)'
  };
  return {
    cycle: 2,
    isBreak: true,
    dayInCycle: 175,
    breakInfo,
    mystery: TAJEMNICA_ZERO,
    displayLabel: `Przerwa Adwentowa • Dzień ${dayInBreak}/8 (do 24 XII)`,
    cycleName: 'Adwentowa Przerwa Przedświąteczna (17 – 24 grudnia)'
  };
}

/**
 * Zwraca tajemnicę dla wybranego cyklu (1 lub 2) i dnia (0..175).
 * 0 = Tajemnica 0 (Modlitwy Wstępne).
 */
export function getNowyRhzMystery(cycle: 1 | 2, day: number): NowyRhzMystery {
  if (day <= 0) {
    return TAJEMNICA_ZERO;
  }
  const safeDay = Math.max(1, Math.min(175, day));
  if (cycle === 2) {
    return NOWY_RHZ_CYCLE_2_MYSTERIES.find(m => m.day === safeDay) || NOWY_RHZ_CYCLE_2_MYSTERIES[safeDay - 1] || NOWY_RHZ_CYCLE_2_MYSTERIES[0];
  }
  return NOWY_RHZ_MYSTERIES.find(m => m.day === safeDay) || NOWY_RHZ_MYSTERIES[safeDay] || NOWY_RHZ_MYSTERIES[0];
}

/**
 * Pobiera listę tajemnic dla danego cyklu (0..175 lub 1..175).
 */
export function getNowyRhzMysteriesList(cycle: 1 | 2, includeIntro: boolean = true): NowyRhzMystery[] {
  const list = cycle === 2 ? NOWY_RHZ_CYCLE_2_MYSTERIES : NOWY_RHZ_MYSTERIES.filter(m => m.day > 0);
  if (includeIntro) {
    return [TAJEMNICA_ZERO, ...list];
  }
  return list;
}

/**
 * Zwraca sformatowaną datę kalendarzową (np. "25 XII", "17 VI") dla danego dnia cyklu.
 */
export function getDateFormattedForCycleDay(cycle: 1 | 2, dayInCycle: number): string {
  if (dayInCycle <= 0) return 'Wstęp';
  const monthNames = ['', 'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];

  if (cycle === 1) {
    // 25 - 31 XII (dni 1..7)
    if (dayInCycle <= 7) {
      const d = 24 + dayInCycle;
      return `${d} XII (${d} ${monthNames[12]})`;
    }
    // Dni od 1 stycznia
    let rem = dayInCycle - 7;
    const months = [
      { m: 1, name: 'I', days: 31 },
      { m: 2, name: 'II', days: 28 }, // 29 II pomijany
      { m: 3, name: 'III', days: 31 },
      { m: 4, name: 'IV', days: 30 },
      { m: 5, name: 'V', days: 31 },
      { m: 6, name: 'VI', days: 17 }  // do 17 czerwca
    ];
    for (const mon of months) {
      if (rem <= mon.days) {
        return `${rem} ${mon.name} (${rem} ${monthNames[mon.m]})`;
      }
      rem -= mon.days;
    }
    return '17 VI (17 czerwca)';
  } else {
    // Cykl 2: od 25 czerwca do 16 grudnia (175 dni)
    // 25 - 30 VI (dni 1..6)
    if (dayInCycle <= 6) {
      const d = 24 + dayInCycle;
      return `${d} VI (${d} ${monthNames[6]})`;
    }
    let rem = dayInCycle - 6;
    const months = [
      { m: 7, name: 'VII', days: 31 },
      { m: 8, name: 'VIII', days: 31 },
      { m: 9, name: 'IX', days: 30 },
      { m: 10, name: 'X', days: 31 },
      { m: 11, name: 'XI', days: 30 },
      { m: 12, name: 'XII', days: 16 } // do 16 grudnia
    ];
    for (const mon of months) {
      if (rem <= mon.days) {
        return `${rem} ${mon.name} (${rem} ${monthNames[mon.m]})`;
      }
      rem -= mon.days;
    }
    return '16 XII (16 grudnia)';
  }
}

export interface NowyRhz365DayDetails {
  day365: number;
  cycle: 1 | 2;
  isBreak: boolean;
  dayInCycle: number;
  dayInBreak?: number;
  totalBreakDays?: number;
  breakTitle?: string;
  dateFormatted: string;
  month: number;
  dayOfMonth: number;
  mystery: NowyRhzMystery;
  displayShort: string;
  cycleLabel: string;
}

/**
 * Zwraca sformatowaną datę dla danego dnia w roku (1..365),
 * gdzie Dzień 1 = 25 XII, Dzień 175 = 17 VI, Dni 176..182 = 18–24 VI,
 * Dzień 183 = 25 VI, Dzień 357 = 16 XII, Dni 358..365 = 17–24 XII.
 */
export function getDateFormattedFor365Day(day365: number): string {
  if (day365 <= 0) return 'Modlitwy Wstępne';
  const safeDay = Math.max(1, Math.min(365, day365));
  const monthNames = [
    '', 'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
    'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'
  ];

  // 1..7 -> 25 - 31 grudnia
  if (safeDay <= 7) {
    const d = 24 + safeDay;
    return `${d} XII (${d} ${monthNames[12]})`;
  }

  // Dni 8..365 zaczynając od 1 stycznia
  let rem = safeDay - 7;
  const months = [
    { m: 1, name: 'I', days: 31 },
    { m: 2, name: 'II', days: 28 }, // 29 II pomijany
    { m: 3, name: 'III', days: 31 },
    { m: 4, name: 'IV', days: 30 },
    { m: 5, name: 'V', days: 31 },
    { m: 6, name: 'VI', days: 30 },
    { m: 7, name: 'VII', days: 31 },
    { m: 8, name: 'VIII', days: 31 },
    { m: 9, name: 'IX', days: 30 },
    { m: 10, name: 'X', days: 31 },
    { m: 11, name: 'XI', days: 30 },
    { m: 12, name: 'XII', days: 24 } // do 24 grudnia (Wigilia)
  ];

  for (const mon of months) {
    if (rem <= mon.days) {
      return `${rem} ${mon.name} (${rem} ${monthNames[mon.m]})`;
    }
    rem -= mon.days;
  }
  return '24 XII (24 grudnia)';
}

/**
 * Zwraca pełne szczegóły dla dowolnego z 365 dni nowegoRHZ365:
 * Dni 1..175 -> Cykl 1 (25 XII – 17 VI)
 * Dni 176..182 -> Letnia Przerwa (18–24 VI, 7 dni)
 * Dni 183..357 -> Cykl 2 (25 VI – 16 XII, 175 tajemnic)
 * Dni 358..365 -> Adwentowa Przerwa (17–24 XII, 8 dni)
 */
export function getDayDetails365(day365: number): NowyRhz365DayDetails {
  if (day365 <= 0) {
    return {
      day365: 0,
      cycle: 1,
      isBreak: false,
      dayInCycle: 0,
      dateFormatted: 'Wprowadzenie',
      month: 0,
      dayOfMonth: 0,
      mystery: TAJEMNICA_ZERO,
      displayShort: 'Tajemnica 0 (Wstęp)',
      cycleLabel: 'Modlitwy Wstępne Różańca Świętego'
    };
  }

  const safeDay = Math.max(1, Math.min(365, day365));
  const dateFormatted = getDateFormattedFor365Day(safeDay);

  // 1. Cykl 1: dni 1..175 (25 XII – 17 VI)
  if (safeDay <= 175) {
    const dayInCycle = safeDay;
    const mystery = NOWY_RHZ_MYSTERIES.find(m => m.day === dayInCycle) || NOWY_RHZ_MYSTERIES[dayInCycle] || NOWY_RHZ_MYSTERIES[0];
    return {
      day365: safeDay,
      cycle: 1,
      isBreak: false,
      dayInCycle,
      dateFormatted,
      month: 0,
      dayOfMonth: 0,
      mystery,
      displayShort: `Cykl 1 • Dzień ${dayInCycle} ze 175`,
      cycleLabel: 'Cykl 1 (25 XII – 17 VI)'
    };
  }

  // 2. Letnia Przerwa: dni 176..182 (18 VI – 24 VI, 7 dni)
  if (safeDay <= 182) {
    const dayInBreak = safeDay - 175;
    return {
      day365: safeDay,
      cycle: 1,
      isBreak: true,
      dayInCycle: 175,
      dayInBreak,
      totalBreakDays: 7,
      breakTitle: 'Letnia Przerwa Modlitewna',
      dateFormatted,
      month: 6,
      dayOfMonth: 17 + dayInBreak,
      mystery: TAJEMNICA_ZERO,
      displayShort: `Letnia Przerwa • Dzień ${dayInBreak} z 7`,
      cycleLabel: 'Letnia Przerwa (18–24 VI)'
    };
  }

  // 3. Cykl 2: dni 183..357 (25 VI – 16 XII, 175 dni)
  if (safeDay <= 357) {
    const dayInCycle = safeDay - 182;
    const mystery = NOWY_RHZ_CYCLE_2_MYSTERIES.find(m => m.day === dayInCycle) || NOWY_RHZ_CYCLE_2_MYSTERIES[dayInCycle - 1] || NOWY_RHZ_CYCLE_2_MYSTERIES[0];
    return {
      day365: safeDay,
      cycle: 2,
      isBreak: false,
      dayInCycle,
      dateFormatted,
      month: 0,
      dayOfMonth: 0,
      mystery,
      displayShort: `Cykl 2 • Dzień ${dayInCycle} ze 175`,
      cycleLabel: 'Cykl 2 (25 VI – 16 XII)'
    };
  }

  // 4. Adwentowa Przerwa: dni 358..365 (17 XII – 24 XII, 8 dni)
  const dayInBreak = safeDay - 357;
  return {
    day365: safeDay,
    cycle: 2,
    isBreak: true,
    dayInCycle: 175,
    dayInBreak,
    totalBreakDays: 8,
    breakTitle: 'Adwentowa Przerwa Przedświąteczna',
    dateFormatted,
    month: 12,
    dayOfMonth: 16 + dayInBreak,
    mystery: TAJEMNICA_ZERO,
    displayShort: `Adwentowa Przerwa • Dzień ${dayInBreak} z 8`,
    cycleLabel: 'Adwentowa Przerwa (17–24 XII)'
  };
}
