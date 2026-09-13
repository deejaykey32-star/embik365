import JSZip from 'jszip';
import { SectionId } from '../types';
import { getCycleDateByDayNumber, POLISH_MONTHS } from './dateCycle';

export interface ParsedDayEntry {
  dayNumber: number;
  dateKey: string;
  title: string;
  subtitle?: string;
  mystery?: string;
  intention?: string;
  content: string;
  prayer?: string;
}

export interface ParseDocumentResult {
  success: boolean;
  totalDaysFound: number;
  entries: Record<string, ParsedDayEntry>;
  logMessage: string;
}

/**
 * Extracts plain text from a DOCX file buffer using JSZip
 */
async function extractTextFromDocx(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  const docXmlStr = await zip.file('word/document.xml')?.async('text');
  if (!docXmlStr) return '';

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(docXmlStr, 'application/xml');
  const paragraphNodes = Array.from(xmlDoc.getElementsByTagName('w:p'));

  const lines: string[] = [];

  for (const p of paragraphNodes) {
    const textNodes = Array.from(p.getElementsByTagName('w:t'));
    const lineText = textNodes.map(t => t.textContent || '').join('').trim();
    if (lineText) {
      lines.push(lineText);
    }
  }

  return lines.join('\n');
}

/**
 * Extracts text from an ePUB file buffer using JSZip
 */
async function extractTextFromEpub(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  const htmlFiles: { name: string; content: string }[] = [];

  for (const relativePath of Object.keys(zip.files)) {
    if (relativePath.endsWith('.html') || relativePath.endsWith('.xhtml') || relativePath.endsWith('.htm')) {
      const content = await zip.files[relativePath].async('text');
      htmlFiles.push({ name: relativePath, content });
    }
  }

  // Sort files by name to maintain order
  htmlFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  const parser = new DOMParser();
  const lines: string[] = [];

  for (const item of htmlFiles) {
    const doc = parser.parseFromString(item.content, 'text/html');
    // Extract block elements & text
    const elements = Array.from(doc.body.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, li'));
    if (elements.length > 0) {
      for (const el of elements) {
        const txt = el.textContent?.trim();
        if (txt) lines.push(txt);
      }
    } else {
      const text = doc.body.textContent?.trim();
      if (text) lines.push(text);
    }
  }

  return lines.join('\n');
}

/**
 * Reads text from a plain text or markdown file
 */
async function extractTextFromTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Helper to match date string (e.g. "25 grudnia", "1 stycznia") to dayNumber
 */
function findDayNumberFromDateString(dateStr: string): number | null {
  const match = dateStr.match(/(\d{1,2})\s+([a-zA-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ]+)/i);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const monthName = match[2].toLowerCase();

  const monthObj = POLISH_MONTHS.find(m =>
    m.nameGenitive.toLowerCase() === monthName ||
    m.nameNominative.toLowerCase() === monthName
  );

  if (!monthObj) return null;

  const m = monthObj.id;
  // Calculate dayNumber in 366-day cycle starting Dec 25 (Day 1)
  if (m === 12 && day >= 25) {
    return day - 24; // Dec 25 -> 1, Dec 31 -> 7
  }

  // Jan 1 is Day 8
  let days = 7;
  for (let month = 1; month < m; month++) {
    const mo = POLISH_MONTHS.find(item => item.id === month)!;
    days += mo.days;
  }
  days += day;
  return days <= 366 ? days : null;
}

/**
 * Main parser function: converts document file to parsed day entries
 */
export async function parseDocumentIntoDayEntries(
  file: File,
  sectionId: SectionId,
  onProgress?: (stage: string, percent: number) => void
): Promise<ParseDocumentResult> {
  const ext = file.name.toLowerCase().split('.').pop() || '';
  let fullText = '';

  try {
    if (onProgress) onProgress('Odczytywanie pliku dokumentu...', 15);

    if (ext === 'docx' || ext === 'doc') {
      fullText = await extractTextFromDocx(file);
    } else if (ext === 'epub') {
      fullText = await extractTextFromEpub(file);
    } else {
      fullText = await extractTextFromTextFile(file);
    }
  } catch (err: any) {
    return {
      success: false,
      totalDaysFound: 0,
      entries: {},
      logMessage: `Błąd podczas odczytu pliku ${file.name}: ${err.message}`
    };
  }

  if (!fullText || fullText.trim().length === 0) {
    return {
      success: false,
      totalDaysFound: 0,
      entries: {},
      logMessage: `Plik ${file.name} nie zawiera możliwej do odczytania treści tekstowej.`
    };
  }

  if (onProgress) onProgress('Analizowanie nagłówków rozdziałów i dni...', 35);

  const rawLines = fullText.split('\n').map(l => l.trim()).filter(Boolean);
  const parsedEntries: Record<string, ParsedDayEntry> = {};

  // Regex patterns for day headings
  const dayPatterns = [
    // Dzień 1, Dzień 01, Dzień 1: Tytuł, Dzień 1 - Tytuł, Day 1
    /^(?:#+\s*)?(?:Dzień|Day|Dzien|Rozdział|Rozdzial|Wpis)\s*(\d{1,3})(?:\s*[:\-–—]\s*|\s+)(.*)/i,
    /^(?:#+\s*)?(?:Dzień|Day|Dzien|Rozdział|Rozdzial|Wpis)\s*(\d{1,3})$/i,
    // [Dzień 1] or [1]
    /^\[(?:Dzień|Day)?\s*(\d{1,3})\](?:\s*[:\-–—]\s*|\s+)(.*)/i,
    // 1. Dzień / 1. Rozdział
    /^(\d{1,3})\.\s+(?:Dzień|Day|Rozdział)(?:\s*[:\-–—]\s*|\s+)(.*)/i
  ];

  let currentDayNumber: number | null = null;
  let currentTitle = '';
  let currentContentLines: string[] = [];

  const finalizeDay = () => {
    if (currentDayNumber !== null && currentDayNumber >= 1 && currentDayNumber <= 366) {
      const cycleDate = getCycleDateByDayNumber(currentDayNumber);
      const dateKey = cycleDate.dateKey;
      const entryKey = `${sectionId}-${dateKey}`;

      let mystery: string | undefined;
      let intention: string | undefined;
      let prayer: string | undefined;
      const cleanContentLines: string[] = [];

      for (const line of currentContentLines) {
        if (line.toLowerCase().startsWith('tajemnica:') || line.toLowerCase().startsWith('tajemnica ')) {
          mystery = line.replace(/^tajemnica:?\s*/i, '').trim();
        } else if (line.toLowerCase().startsWith('intencja:') || line.toLowerCase().startsWith('intencja ')) {
          intention = line.replace(/^intencja:?\s*/i, '').trim();
        } else if (line.toLowerCase().startsWith('modlitwa:') || line.toLowerCase().startsWith('modlitwa serca:')) {
          prayer = line.replace(/^modlitwa\s*(serca)?:?\s*/i, '').trim();
        } else {
          cleanContentLines.push(line);
        }
      }

      const contentText = cleanContentLines.join('\n\n');
      const fallbackTitle = `Dzień ${currentDayNumber} – ${cycleDate.displayDate}`;

      parsedEntries[entryKey] = {
        dayNumber: currentDayNumber,
        dateKey,
        title: currentTitle ? `Dzień ${currentDayNumber}: ${currentTitle}` : fallbackTitle,
        mystery,
        intention,
        content: contentText || (currentTitle ? currentTitle : `Rozważanie na dzień ${currentDayNumber}`),
        prayer
      };
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    let matchedDay: number | null = null;
    let extractedTitle = '';

    for (const pattern of dayPatterns) {
      const match = line.match(pattern);
      if (match) {
        matchedDay = parseInt(match[1], 10);
        extractedTitle = match[2] ? match[2].trim() : '';
        break;
      }
    }

    // Check if line contains a Polish date like "25 grudnia"
    if (matchedDay === null) {
      const dayFromDate = findDayNumberFromDateString(line);
      if (dayFromDate !== null) {
        matchedDay = dayFromDate;
        extractedTitle = line;
      }
    }

    if (matchedDay !== null) {
      // Finalize previous day
      finalizeDay();
      currentDayNumber = matchedDay;
      currentTitle = extractedTitle;
      currentContentLines = [];
    } else if (currentDayNumber !== null) {
      currentContentLines.push(line);
    }
  }

  // Finalize last day
  finalizeDay();

  const totalDays = Object.keys(parsedEntries).length;

  if (onProgress) onProgress(`Rozpoznano ${totalDays} wpisów dziennych!`, 55);

  if (totalDays === 0) {
    return {
      success: false,
      totalDaysFound: 0,
      entries: {},
      logMessage: `Nie odnaleziono nagłówków dni (np. "Dzień 1", "Dzień 2", "Rozdział 1") w pliku ${file.name}.`
    };
  }

  return {
    success: true,
    totalDaysFound: totalDays,
    entries: parsedEntries,
    logMessage: `Pomyślnie rozpoznano i sparsowano ${totalDays} wpisów dziennych dla sekcji ${sectionId}.`
  };
}
