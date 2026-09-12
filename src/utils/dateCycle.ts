import { CycleDate } from '../types';

export const POLISH_MONTHS = [
  { id: 1, nameNominative: 'Styczeń', nameGenitive: 'stycznia', days: 31 },
  { id: 2, nameNominative: 'Luty', nameGenitive: 'lutego', days: 29 }, // supports leap
  { id: 3, nameNominative: 'Marzec', nameGenitive: 'marca', days: 31 },
  { id: 4, nameNominative: 'Kwiecień', nameGenitive: 'kwietnia', days: 30 },
  { id: 5, nameNominative: 'Maj', nameGenitive: 'maja', days: 31 },
  { id: 6, nameNominative: 'Czerwiec', nameGenitive: 'czerwca', days: 30 },
  { id: 7, nameNominative: 'Lipiec', nameGenitive: 'lipca', days: 31 },
  { id: 8, nameNominative: 'Sierpień', nameGenitive: 'sierpnia', days: 31 },
  { id: 9, nameNominative: 'Wrzesień', nameGenitive: 'września', days: 30 },
  { id: 10, nameNominative: 'Październik', nameGenitive: 'października', days: 31 },
  { id: 11, nameNominative: 'Listopad', nameGenitive: 'listopada', days: 30 },
  { id: 12, nameNominative: 'Grudzień', nameGenitive: 'grudnia', days: 31 },
];

/**
 * Builds the 366-day cycle starting on December 25th (Day 1) and ending on December 24th (Day 366).
 */
export function generateCycleCalendar(isLeapYear: boolean = true): CycleDate[] {
  const days: CycleDate[] = [];
  let currentDayNumber = 1;

  // 1. December 25 to December 31
  for (let d = 25; d <= 31; d++) {
    const key = `12-${d.toString().padStart(2, '0')}`;
    days.push({
      dayNumber: currentDayNumber++,
      day: d,
      month: 12,
      monthName: 'grudnia',
      dateKey: key,
      displayDate: `${d} grudnia`,
      isCycleStart: d === 25,
      season: 'Okres Narodzenia Pańskiego'
    });
  }

  // 2. January 1 to December 24
  for (let m = 1; m <= 12; m++) {
    const monthObj = POLISH_MONTHS.find(item => item.id === m)!;
    const maxDays = (m === 2 && !isLeapYear) ? 28 : (m === 12 ? 24 : monthObj.days);

    for (let d = 1; d <= maxDays; d++) {
      const key = `${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      let season = 'Okres Zwykły';
      if (m === 1 && d <= 12) season = 'Okres Narodzenia Pańskiego';
      else if ((m === 3 || m === 4) && d >= 1) season = 'Wielki Post i Wielkanoc';
      else if (m === 5) season = 'Miesiąc Maryjny';
      else if (m === 6) season = 'Miesiąc Najświętszego Serca';
      else if (m === 10) season = 'Miesiąc Różańcowy';
      else if (m === 11) season = 'Pamięć o Zmarłych i Świętych';
      else if (m === 12 && d <= 24) season = 'Adwent';

      days.push({
        dayNumber: currentDayNumber++,
        day: d,
        month: m,
        monthName: monthObj.nameGenitive,
        dateKey: key,
        displayDate: `${d} ${monthObj.nameGenitive}`,
        isCycleEnd: m === 12 && d === 24,
        season
      });
    }
  }

  return days;
}

export const CYCLE_DAYS = generateCycleCalendar(true);

/**
 * Finds the CycleDate for a given month and day.
 */
export function getCycleDate(month: number, day: number): CycleDate {
  const key = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  const found = CYCLE_DAYS.find(cd => cd.dateKey === key);
  return found || CYCLE_DAYS[0];
}

/**
 * Finds the CycleDate for a given dayNumber (1 to 366).
 */
export function getCycleDateByDayNumber(dayNumber: number): CycleDate {
  const bounded = Math.max(1, Math.min(CYCLE_DAYS.length, dayNumber));
  return CYCLE_DAYS[bounded - 1] || CYCLE_DAYS[0];
}

/**
 * Gets today's cycle date based on the user's current date.
 */
export function getTodayCycleDate(): CycleDate {
  const now = new Date();
  const m = now.getMonth() + 1; // 1-12
  const d = now.getDate();
  return getCycleDate(m, d);
}

/**
 * Formats date key e.g. "12-25" into display title.
 */
export function formatDateKey(dateKey: string): string {
  const parts = dateKey.split('-');
  if (parts.length !== 2) return dateKey;
  const m = parseInt(parts[0], 10);
  const d = parseInt(parts[1], 10);
  const monthObj = POLISH_MONTHS.find(item => item.id === m);
  return `${d} ${monthObj?.nameGenitive || ''}`;
}
