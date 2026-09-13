import { SectionId, CycleDate } from '../types';
import { CYCLE_DAYS, POLISH_MONTHS, getCycleDateByDayNumber, getCycleDate, getTodayCycleDate } from './dateCycle';

/**
 * Remove Polish diacritics and normalize text for URL slugs.
 */
export function removeDiacritics(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/ą/g, 'a')
    .replace(/ć/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ł/g, 'l')
    .replace(/ń/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ź/g, 'z')
    .replace(/ż/g, 'z')
    .replace(/[^a-z0-9_-]/g, '-');
}

/**
 * Map month names to month number (1-12)
 */
const MONTH_SLUG_MAP: Record<string, number> = {
  'stycznia': 1, 'styczen': 1, 'january': 1, 'jan': 1, '01': 1, '1': 1,
  'lutego': 2, 'luty': 2, 'february': 2, 'feb': 2, '02': 2, '2': 2,
  'marca': 3, 'marzec': 3, 'march': 3, 'mar': 3, '03': 3, '3': 3,
  'kwietnia': 4, 'kwiecien': 4, 'april': 4, 'apr': 4, '04': 4, '4': 4,
  'maja': 5, 'maj': 5, 'may': 5, '05': 5, '5': 5,
  'czerwca': 6, 'czerwiec': 6, 'june': 6, 'jun': 6, '06': 6, '6': 6,
  'lipca': 7, 'lipiec': 7, 'july': 7, 'jul': 7, '07': 7, '7': 7,
  'sierpnia': 8, 'sierpien': 8, 'august': 8, 'aug': 8, '08': 8, '8': 8,
  'wrzesnia': 9, 'wrzesien': 9, 'september': 9, 'sep': 9, '09': 9, '9': 9,
  'pazdziernika': 10, 'pazdziernik': 10, 'october': 10, 'oct': 10, '10': 10,
  'listopada': 11, 'listopad': 11, 'november': 11, 'nov': 11, '11': 11,
  'grudnia': 12, 'grudzien': 12, 'december': 12, 'dec': 12, '12': 12
};

/**
 * Map of aliases to valid SectionId
 */
const SECTION_SLUG_MAP: Record<string, SectionId> = {
  'info365': 'info365',
  'info': 'info365',
  'wstep': 'info365',
  'przewodnik': 'info365',
  'home': 'info365',

  'wnr365': 'wnr365',
  'wnr': 'wnr365',
  'wnr366': 'wnr365',
  'widoki-na-raj': 'wnr365',
  'widokinaraj': 'wnr365',
  'blog': 'wnr365',

  'rhz365': 'rhz365',
  'rhz': 'rhz365',
  'rozaniec-historii-zbawienia': 'rhz365',
  'rozaniec': 'rhz365',
  'modlitwa': 'rhz365',

  'biblia365': 'biblia365',
  'biblia': 'biblia365',
  'pismo-swiete': 'biblia365',
  'apokryfy': 'biblia365',

  'ebook_wnr': 'ebook_wnr',
  'ebook-wnr': 'ebook_wnr',
  'ebook-wnr365': 'ebook_wnr',
  'ksiega-wnr': 'ebook_wnr',

  'ebook_rhz': 'ebook_rhz',
  'ebook-rhz': 'ebook_rhz',
  'ebook-rhz365': 'ebook_rhz',
  'modlitewnik-rhz': 'ebook_rhz',

  'ebook_biblia': 'ebook_biblia',
  'ebook-biblia': 'ebook_biblia',
  'ebook-biblia365': 'ebook_biblia',
  'ksiega-biblia': 'ebook_biblia',

  'bio365': 'bio365',
  'bio': 'bio365',
  'biografia': 'bio365',
  'ja-i-moja-zona': 'bio365'
};

/**
 * Convert a CycleDate to a clean readable URL slug e.g. "25-grudnia"
 */
export function getCanonicalDateSlug(date: CycleDate): string {
  const monthObj = POLISH_MONTHS.find(m => m.id === date.month);
  const rawMonthName = monthObj ? monthObj.nameGenitive : 'grudnia';
  const cleanMonthName = removeDiacritics(rawMonthName);
  return `${date.day}-${cleanMonthName}`;
}

/**
 * Parse any date slug format e.g. "25-grudnia", "13-wrzesnia", "dzien-1", "12-25", "25"
 */
export function parseDaySlug(slug: string): CycleDate | null {
  if (!slug) return null;
  const raw = slug.trim().toLowerCase();
  const clean = removeDiacritics(raw);

  // 1. "dzien-X", "day-X", "d-X", "dX"
  const dayNumMatch = clean.match(/^(?:dzien|day|d)[-_\s]*(\d{1,3})$/);
  if (dayNumMatch) {
    const num = parseInt(dayNumMatch[1], 10);
    if (num >= 1 && num <= 366) {
      return getCycleDateByDayNumber(num);
    }
  }

  // 2. DateKey format "MM-DD" e.g. "12-25" or "01-01"
  const dateKeyMatch = clean.match(/^(\d{1,2})[-_](\d{1,2})$/);
  if (dateKeyMatch) {
    const m = parseInt(dateKeyMatch[1], 10);
    const d = parseInt(dateKeyMatch[2], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return getCycleDate(m, d);
    }
  }

  // 3. Named Polish format "DD-monthName" e.g. "25-grudnia", "13-wrzesnia"
  const namedMatch = clean.match(/^(\d{1,2})[-_]([a-z]+)$/);
  if (namedMatch) {
    const d = parseInt(namedMatch[1], 10);
    const monthStr = namedMatch[2];
    const monthNum = MONTH_SLUG_MAP[monthStr];
    if (monthNum && d >= 1 && d <= 31) {
      return getCycleDate(monthNum, d);
    }
  }

  // 4. Standalone number (day number 1..366)
  if (/^\d{1,3}$/.test(clean)) {
    const num = parseInt(clean, 10);
    if (num >= 1 && num <= 366) {
      return getCycleDateByDayNumber(num);
    }
  }

  return null;
}

/**
 * Parse section slug into SectionId
 */
export function parseSectionSlug(slug: string): SectionId | null {
  if (!slug) return null;
  const clean = removeDiacritics(slug);
  return SECTION_SLUG_MAP[clean] || null;
}

export interface ParsedRoute {
  sectionId: SectionId;
  date: CycleDate;
  subview?: 'kalendarz' | 'pobierz' | 'lektor' | 'admin' | 'kody-qr' | 'rozaniec' | 'pdf' | string;
  pdfId?: string;
  flipbookPage?: number;
}

/**
 * Parses current window URL location (pathname, hash or query) into section, date & subview
 */
export function parseUrlRoute(): ParsedRoute {
  let pathStr = '';
  
  // 1. Inspect pathname e.g. /wnr365/25-grudnia or /rhz365/13-wrzesnia
  if (window.location.pathname && window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
    pathStr = window.location.pathname.replace(/^\//, '');
  }
  
  // 2. Fallback to hash route e.g. #/wnr365/25-grudnia or #wnr365/12-25
  if (!pathStr && window.location.hash) {
    pathStr = window.location.hash.replace(/^#\/?/, '');
  } else if (!pathStr && window.location.search) {
    const params = new URLSearchParams(window.location.search);
    const sec = params.get('section') || params.get('s');
    const day = params.get('day') || params.get('date') || params.get('d');
    const sub = params.get('view') || params.get('v');
    const page = params.get('page') || params.get('p');
    const pdf = params.get('pdf');

    if (sec || day) {
      const sectionId = parseSectionSlug(sec || '') || 'info365';
      const date = parseDaySlug(day || '') || getTodayCycleDate();
      return {
        sectionId,
        date,
        subview: sub || undefined,
        pdfId: pdf || undefined,
        flipbookPage: page ? parseInt(page, 10) : undefined
      };
    }
  }

  const parts = pathStr.split('/').map(p => p.trim()).filter(Boolean);

  let sectionId: SectionId = 'info365';
  let date: CycleDate = getTodayCycleDate();
  let subview: string | undefined = undefined;
  let pdfId: string | undefined = undefined;
  let flipbookPage: number | undefined = undefined;

  if (parts.length > 0) {
    const firstSec = parseSectionSlug(parts[0]);
    if (firstSec) {
      sectionId = firstSec;
      if (parts.length > 1) {
        const foundDate = parseDaySlug(parts[1]);
        if (foundDate) {
          date = foundDate;
          if (parts.length > 2) {
            subview = parts[2];
            if (parts[2] === 'pdf' && parts[3]) {
              pdfId = parts[3];
            } else if (/^(?:strona|page)[-_]?(\d+)$/i.test(parts[2])) {
              const m = parts[2].match(/\d+/);
              if (m) flipbookPage = parseInt(m[0], 10);
            }
          }
        } else {
          // Second part might be a subview directly e.g. /info365/admin or /info365/kalendarz
          subview = parts[1];
          if (parts[1] === 'pdf' && parts[2]) {
            pdfId = parts[2];
          }
        }
      }
    } else {
      // First part could be day slug or admin
      const foundDate = parseDaySlug(parts[0]);
      if (foundDate) {
        date = foundDate;
        if (parts.length > 1) {
          const secondSec = parseSectionSlug(parts[1]);
          if (secondSec) sectionId = secondSec;
          else subview = parts[1];
        }
      } else if (parts[0] === 'admin' || parts[0] === 'panel') {
        subview = 'admin';
      } else if (parts[0] === 'kalendarz' || parts[0] === 'calendar') {
        subview = 'kalendarz';
      } else if (parts[0] === 'pobierz' || parts[0] === 'download') {
        subview = 'pobierz';
      } else if (parts[0] === 'kody-qr' || parts[0] === 'qr') {
        subview = 'kody-qr';
      }
    }
  }

  return { sectionId, date, subview, pdfId, flipbookPage };
}

/**
 * Builds the canonical URL pathname string for given section, date, subview
 * Format: /sekcja/dzień (e.g. /wnr365/25-grudnia or /rhz365/13-wrzesnia)
 */
export function buildUrlSlug(route: {
  sectionId: SectionId;
  date?: CycleDate;
  subview?: string;
  pdfId?: string;
  flipbookPage?: number;
}): string {
  const parts: string[] = [route.sectionId];

  if (route.date && route.sectionId !== 'info365') {
    parts.push(getCanonicalDateSlug(route.date));
  } else if (route.date && route.subview) {
    parts.push(getCanonicalDateSlug(route.date));
  }

  if (route.pdfId) {
    parts.push('pdf', route.pdfId);
  } else if (route.flipbookPage) {
    parts.push(`strona-${route.flipbookPage}`);
  } else if (route.subview) {
    parts.push(route.subview);
  }

  return `/${parts.join('/')}`;
}

/**
 * Updates browser URL pathname without causing a page reload
 * Resulting URL format: widokinaraj.pl/sekcja/dzień
 */
export function updateBrowserUrlSlug(route: {
  sectionId: SectionId;
  date?: CycleDate;
  subview?: string;
  pdfId?: string;
  flipbookPage?: number;
}): void {
  if (typeof window === 'undefined') return;
  const path = buildUrlSlug(route);
  if (window.location.pathname !== path || window.location.hash) {
    window.history.replaceState(null, '', path);
  }
}

/**
 * Copy current full URL with slug to user clipboard
 */
export async function copyCurrentPageUrl(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  } catch {
    return false;
  }
}
