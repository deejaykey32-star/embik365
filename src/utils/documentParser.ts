import JSZip from 'jszip';
import { SectionId } from '../types';
import { getCycleDateByDayNumber, POLISH_MONTHS } from './dateCycle';

export interface ParsedDayEntry {
  dayNumber: number;
  dateKey: string;
  sectionId: SectionId;
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
 * Extracts plain text lines from a DOCX file using JSZip
 */
async function extractTextFromDocx(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  const docXmlStr = await zip.file('word/document.xml')?.async('text');
  if (!docXmlStr) return '';

  const paragraphs = docXmlStr.match(/<w:p [^>]*>.*?<\/w:p>|<w:p>.*?<\/w:p>/g) || [];
  const lines: string[] = [];

  for (const p of paragraphs) {
    const textMatches = p.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    if (textMatches) {
      const lineText = textMatches.map(m => m.replace(/<[^>]+>/g, '')).join('').trim();
      if (lineText) {
        lines.push(lineText);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Extracts text lines from an ePUB file using JSZip
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

  htmlFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  const parser = new DOMParser();
  const lines: string[] = [];

  for (const item of htmlFiles) {
    const doc = parser.parseFromString(item.content, 'text/html');
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

  // Strict regex pattern for day headings (e.g. "DZIEŃ 1 — 25 GRUDNIA" or "DZIEŃ 2 — 26 GRUDNIA")
  const dayHeaderRegex = /^(?:#+\s*)?(?:DZIEŃ|DAY|DZIEN|ROZDZIAŁ|ROZDZIAL|WPIS)\s*(\d{1,3})/i;

  let currentDayNum: number | null = null;
  let currentHeaderExtra = '';
  let currentLines: string[] = [];

  const finalizeDay = () => {
    if (currentDayNum !== null && currentDayNum >= 1 && currentDayNum <= 366) {
      const cycleDate = getCycleDateByDayNumber(currentDayNum);
      const dateKey = cycleDate.dateKey;
      const entryKey = `${sectionId}-${dateKey}`;

      let mystery: string | undefined;
      let intention: string | undefined;
      let prayer: string | undefined;
      const bodyLines: string[] = [];

      for (const line of currentLines) {
        if (line.startsWith('Widoki na Raj') || line.startsWith('WnR365 — Widoki na Raj')) {
          continue; // ignore repetitive header lines
        }

        if (line.toLowerCase().startsWith('tajemnica:') || line.toLowerCase().startsWith('tajemnica ')) {
          mystery = line.replace(/^tajemnica:?\s*/i, '').trim();
        } else if (line.toLowerCase().startsWith('intencja:') || line.toLowerCase().startsWith('intencja ')) {
          intention = line.replace(/^intencja:?\s*/i, '').trim();
        } else if (line.toLowerCase().startsWith('modlitwa:') || line.toLowerCase().startsWith('modlitwa serca:')) {
          prayer = line.replace(/^modlitwa\s*(serca)?:?\s*/i, '').trim();
        } else {
          bodyLines.push(line);
        }
      }

      // Extract clear title if available
      let extractedTitle = '';
      if (bodyLines.length > 0) {
        const firstLine = bodyLines[0];
        // e.g. "[28.05.2012] Powtórne Narodziny"
        if (/^\[\d{2}\.\d{2}\.\d{4}\]/i.test(firstLine)) {
          extractedTitle = firstLine.replace(/^\[\d{2}\.\d{2}\.\d{4}\]\s*/i, '').trim();
        } else if (firstLine.length < 80 && !firstLine.endsWith('.')) {
          extractedTitle = firstLine;
        }
      }

      if (!extractedTitle && currentHeaderExtra && !/^\d{1,2}\s+[a-z]+/i.test(currentHeaderExtra)) {
        extractedTitle = currentHeaderExtra;
      }

      const displayTitle = extractedTitle 
        ? `Dzień ${currentDayNum} (${cycleDate.displayDate}): ${extractedTitle}`
        : `Dzień ${currentDayNum} – ${cycleDate.displayDate}`;

      parsedEntries[entryKey] = {
        dayNumber: currentDayNum,
        dateKey,
        sectionId,
        title: displayTitle,
        mystery,
        intention,
        content: bodyLines.join('\n\n') || extractedTitle || `Rozważanie na dzień ${currentDayNum}`,
        prayer
      };
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const match = line.match(dayHeaderRegex);

    if (match) {
      finalizeDay();
      currentDayNum = parseInt(match[1], 10);
      currentHeaderExtra = line.replace(dayHeaderRegex, '').replace(/^[\s\-—–:]+/, '').trim();
      currentLines = [];
    } else if (currentDayNum !== null) {
      currentLines.push(line);
    }
  }

  finalizeDay();

  const totalDays = Object.keys(parsedEntries).length;

  if (onProgress) onProgress(`Rozpoznano ${totalDays} wpisów dziennych!`, 55);

  if (totalDays === 0) {
    return {
      success: false,
      totalDaysFound: 0,
      entries: {},
      logMessage: `Nie odnaleziono nagłówków dni (np. "Dzień 1", "Dzień 2") w pliku ${file.name}.`
    };
  }

  return {
    success: true,
    totalDaysFound: totalDays,
    entries: parsedEntries,
    logMessage: `Pomyślnie rozpoznano i sparsowano ${totalDays} wpisów dziennych dla sekcji ${sectionId}.`
  };
}
