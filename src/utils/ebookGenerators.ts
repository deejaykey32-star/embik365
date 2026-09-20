import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import { SectionEntry, SectionMeta } from '../types';
import { getWnrEntryForDay } from '../data/wnr365Data';

// Memory cache for QR code card images to avoid repeated fetches
const qrImageCache = new Map<string, string>();

async function fetchQrImageBase64(imgPath: string): Promise<string | null> {
  if (qrImageCache.has(imgPath)) return qrImageCache.get(imgPath)!;
  try {
    const res = await fetch(imgPath);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        qrImageCache.set(imgPath, dataUrl);
        resolve(dataUrl);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Could not load QR image:', imgPath, err);
    return null;
  }
}

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'epub';
  size?: '6x9' | 'a5';
  language?: string;
  languageName?: string;
  authorName?: string;
  includeCopyright?: boolean;
  includePrayer?: boolean;
  exportScope?: 'single' | 'season' | 'year';
  selectedSeason?: 'zima' | 'wiosna' | 'lato' | 'jesien';
  selectedYear?: 1 | 2 | 3 | 4;
  allYearEntries?: SectionEntry[];
}

// Helper to convert ArrayBuffer to Base64 for jsPDF font embedding
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to sanitize text for XML (DOCX & ePUB)
function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper to clean HTML tags for text PDF & Word exports
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<div class='qr-code-embed-card[\s\S]*?<div class='mt-2.5 font-bold[^>]*>([^<]+)<\/div>[\s\S]*?<div class='text-\[11px\][^>]*>([^<]+)<\/div>[\s\S]*?<\/div><\/div>/gi, '\n[Załączony Materiał Wideo / QR: $1 ($2)]\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

// Fallback ASCII sanitizer if custom font cannot be loaded
export function sanitizeTextForPdfFallback(text: string): string {
  if (!text) return '';
  return text
    .replace(/„/g, '"')
    .replace(/”/g, '"')
    .replace(/“/g, '"')
    .replace(/«/g, '"')
    .replace(/»/g, '"')
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/•/g, '*')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .replace(/ś/g, 's')
    .replace(/Ś/g, 'S')
    .replace(/ć/g, 'c')
    .replace(/Ć/g, 'C')
    .replace(/ę/g, 'e')
    .replace(/Ę/g, 'E')
    .replace(/ą/g, 'a')
    .replace(/Ą/g, 'A')
    .replace(/ń/g, 'n')
    .replace(/Ń/g, 'N')
    .replace(/ó/g, 'o')
    .replace(/Ó/g, 'O')
    .replace(/ż/g, 'z')
    .replace(/Ż/g, 'Z')
    .replace(/ź/g, 'z')
    .replace(/Ź/g, 'Z');
}

// Download file trigger helper in browser
export function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

const SEASON_LABELS_PL: Record<string, string> = {
  zima: 'Tom 1 – Zima (91 Dni)',
  wiosna: 'Tom 2 – Wiosna (91 Dni)',
  lato: 'Tom 3 – Lato (91 Dni)',
  jesien: 'Tom 4 – Jesień (92 Dni)'
};

// Cache for loaded TTF font Base64 strings in memory
let fontCache: { reg?: string; bold?: string; ital?: string } | null = null;

async function fetchPdfFonts(): Promise<{ reg?: string; bold?: string; ital?: string }> {
  if (fontCache) return fontCache;
  try {
    const [regRes, boldRes, italRes] = await Promise.all([
      fetch('/fonts/PTSerif-Regular.ttf'),
      fetch('/fonts/PTSerif-Bold.ttf'),
      fetch('/fonts/PTSerif-Italic.ttf')
    ]);

    if (regRes.ok && boldRes.ok && italRes.ok) {
      const [regBuf, boldBuf, italBuf] = await Promise.all([
        regRes.arrayBuffer(),
        boldRes.arrayBuffer(),
        italRes.arrayBuffer()
      ]);
      fontCache = {
        reg: arrayBufferToBase64(regBuf),
        bold: arrayBufferToBase64(boldBuf),
        ital: arrayBufferToBase64(italBuf)
      };
      return fontCache;
    }
  } catch (e) {
    console.warn('Could not fetch custom TTF fonts for jsPDF:', e);
  }
  return {};
}

// -------------------------------------------------------------
// 1. GENERATOR PDF DLA DRUKU NA ŻĄDANIE (POD) - AMAZON KDP & EMPIK
// Standard A5 (148x210 mm), Czcionka 12 pt Times New Roman, Kolor Czarny (#000000), Wyjustowanie
// -------------------------------------------------------------
export async function generatePodPdf(
  entry: SectionEntry,
  meta: SectionMeta,
  options: ExportOptions
): Promise<Blob> {
  const is6x9 = options.size === '6x9';
  // Default A5: 148 mm x 210 mm | 6x9 in: 152.4 mm x 228.6 mm
  const pageWidth = is6x9 ? 152.4 : 148;
  const pageHeight = is6x9 ? 228.6 : 210;

  const doc = new jsPDF({
    unit: 'mm',
    format: [pageWidth, pageHeight],
    orientation: 'portrait'
  });

  // Try embedding custom Times New Roman (PT Serif) TTF fonts for 100% Polish UTF-8 diacritics
  const fonts = await fetchPdfFonts();
  let fontLoaded = false;

  if (fonts.reg && fonts.bold && fonts.ital) {
    doc.addFileToVFS('TimesNewRoman-Regular.ttf', fonts.reg);
    doc.addFont('TimesNewRoman-Regular.ttf', 'TimesNewRoman', 'normal');

    doc.addFileToVFS('TimesNewRoman-Bold.ttf', fonts.bold);
    doc.addFont('TimesNewRoman-Bold.ttf', 'TimesNewRoman', 'bold');

    doc.addFileToVFS('TimesNewRoman-Italic.ttf', fonts.ital);
    doc.addFont('TimesNewRoman-Italic.ttf', 'TimesNewRoman', 'italic');

    fontLoaded = true;
  }

  const fontFamily = fontLoaded ? 'TimesNewRoman' : 'times';
  const processText = (str: string) => fontLoaded ? (str || '') : sanitizeTextForPdfFallback(str);

  const author = processText(options.authorName || 'Dominik Kuta');
  const yr = options.selectedYear || 1;
  let rawTitle = meta.name || 'Biblia365';

  if (options.exportScope === 'season' && options.selectedSeason) {
    const seasonStr = SEASON_LABELS_PL[options.selectedSeason] || 'Tom Sezonowy';
    rawTitle += ` – Rok ${yr} – ${seasonStr}`;
  } else if (options.exportScope === 'year') {
    rawTitle += ` – Rok ${yr} (Tom Roczny 365 Dni)`;
  } else {
    rawTitle += ` – Rok ${yr}`;
  }

  const bookTitle = processText(rawTitle);
  const bookSubtitle = processText(meta.subtitle || 'Kanoniczny Cykl Czytań Biblia365');

  // Margins for Print-On-Demand (POD KDP & Empik A5 Trade Paperback)
  const gutterMargin = 18; // 18 mm inside margin for book binding
  const outerMargin = 12;  // 12 mm outside margin
  const topMargin = 18;    // 18 mm top margin with running header
  const bottomMargin = 18; // 18 mm bottom margin with page number

  let pageNumber = 1;

  const getLeftMargin = (pNum: number) => {
    return pNum % 2 !== 0 ? gutterMargin : outerMargin;
  };
  const getContentWidth = () => pageWidth - gutterMargin - outerMargin;

  // Set default text color to PURE BLACK (#000000)
  doc.setTextColor(0, 0, 0);

  // PAGE 1: Strona Przedtytułowa
  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  const frontTitleLines = doc.splitTextToSize(bookTitle.toUpperCase(), getContentWidth());
  doc.text(frontTitleLines, pageWidth / 2, 65, { align: 'center' });
  doc.setFontSize(10);
  doc.text('BIBLIA365 • DROGA365', pageWidth / 2, 85, { align: 'center' });

  // PAGE 2: Verso (dedykacja)
  doc.addPage();
  pageNumber++;
  doc.setFontSize(10);
  doc.setFont(fontFamily, 'italic');
  doc.setTextColor(0, 0, 0);
  const dedication = processText('„Twoje słowo jest lampą dla moich stóp i światłem na mojej ścieżce.” (Ps 119, 105)');
  doc.text(doc.splitTextToSize(dedication, getContentWidth() - 10), pageWidth / 2, 100, { align: 'center' });

  // PAGE 3: Strona Tytułowa
  doc.addPage();
  pageNumber++;
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text(author.toUpperCase(), pageWidth / 2, 45, { align: 'center' });

  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  const titleLines = doc.splitTextToSize(bookTitle, getContentWidth());
  doc.text(titleLines, pageWidth / 2, 68, { align: 'center' });

  doc.setFont(fontFamily, 'italic');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  if (bookSubtitle) {
    const subLines = doc.splitTextToSize(bookSubtitle, getContentWidth());
    doc.text(subLines, pageWidth / 2, 92, { align: 'center' });
  }

  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(10);
  const scopeDesc = options.exportScope === 'season'
    ? `Wydanie Sezonowe: Rok ${yr} • ${SEASON_LABELS_PL[options.selectedSeason || 'zima'] || ''}`
    : options.exportScope === 'year'
    ? `Wydanie Roczne: Rok ${yr} • 365 Czytań`
    : `Wpis Dnia Cyklu`;
  doc.text(processText(scopeDesc), pageWidth / 2, 118, { align: 'center' });

  doc.setFontSize(9);
  doc.text('WYDANIE PRINT-ON-DEMAND (POD KDP & EMPIK)', pageWidth / 2, pageHeight - 35, { align: 'center' });
  doc.text('Przygotowane dla Amazon KDP, Empik Selfpublishing & Ridero', pageWidth / 2, pageHeight - 28, { align: 'center' });

  // PAGE 4: Strona Redakcyjna / Copyright
  doc.addPage();
  pageNumber++;
  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  const leftX4 = getLeftMargin(pageNumber);

  const copyrightText = [
    `Copyright © ${new Date().getFullYear()} by ${author}`,
    'Wszelkie prawa zastrzeżone.',
    '',
    'Tytuł dzieła: ' + bookTitle,
    'Autor i opracowanie tekstu: ' + author,
    'Projekt typograficzny i skład POD: System Biblia365 / Droga365',
    '',
    'Wydanie I – Druk na Żądanie (Print-On-Demand)',
    'Dystrybucja i publikacja: Amazon KDP, Empik Selfpublishing, Legimi, Ridero.',
    'Format publikacji: Format A5 / 6x9" Trade Paperback zgodny ze standardem POD 0 zł na start.',
    '',
    'Numer ISBN (Paperback A5): [Przydzielany bezpłatnie w panelu Amazon KDP lub Empik]',
    'Numer ISBN (E-book ePUB): [Przydzielany bezpłatnie w panelu wydawcy]',
    '',
    'Żadna część tej publikacji nie może być powielana bez zgody autora,',
    'z wyjątkiem krótkich cytatów w recenzjach lub rozważaniach modlitewnych.'
  ];
  let curY = pageHeight - 110;
  copyrightText.forEach(line => {
    const cLines = doc.splitTextToSize(processText(line), getContentWidth());
    doc.text(cLines, leftX4, curY);
    curY += cLines.length * 4.2;
  });

  // Determine list of entries to process
  const entriesToProcess: SectionEntry[] = (options.allYearEntries && options.allYearEntries.length > 0)
    ? options.allYearEntries
    : [entry];

  // Process entries
  for (let idx = 0; idx < entriesToProcess.length; idx++) {
    const currentEntry = entriesToProcess[idx];

    doc.addPage();
    pageNumber++;

    let curLeft = getLeftMargin(pageNumber);
    const chapterTitleRaw = currentEntry.title || `Dzień ${currentEntry.dayNumber || idx + 1}`;
    const sanitizedTitle = processText(chapterTitleRaw);

    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);

    // Split Chapter Title so it NEVER overflows right margin
    const titleLines = doc.splitTextToSize(sanitizedTitle, getContentWidth());
    let currentY = 30;
    for (const tLine of titleLines) {
      doc.text(tLine, curLeft, currentY);
      currentY += 5.8;
    }

    doc.setLineWidth(0.3);
    doc.setDrawColor(0, 0, 0);
    doc.line(curLeft, currentY + 1, curLeft + getContentWidth(), currentY + 1);
    currentY += 8;

    // Passage
    if (currentEntry.passage || currentEntry.apocryphaPassage) {
      doc.setFont(fontFamily, 'italic');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const passText = processText(`Fragment: ${currentEntry.passage || ''} ${currentEntry.apocryphaPassage ? `| Apokryf: ${currentEntry.apocryphaPassage}` : ''}`);
      const passLines = doc.splitTextToSize(passText, getContentWidth());
      for (const pLine of passLines) {
        if (currentY + 5.2 > pageHeight - bottomMargin) {
          addHeaderFooter(doc, pageNumber, bookTitle, sanitizedTitle, pageWidth, pageHeight, topMargin, bottomMargin, fontFamily);
          doc.addPage();
          pageNumber++;
          curLeft = getLeftMargin(pageNumber);
          currentY = topMargin + 10;
        }
        doc.text(pLine, curLeft, currentY);
        currentY += 5.2;
      }
      currentY += 4;
    }

    // Mystery
    if (currentEntry.mystery) {
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const mystText = processText(`Tajemnica: ${currentEntry.mystery}`);
      const mystLines = doc.splitTextToSize(mystText, getContentWidth());
      for (const mLine of mystLines) {
        if (currentY + 5.2 > pageHeight - bottomMargin) {
          addHeaderFooter(doc, pageNumber, bookTitle, sanitizedTitle, pageWidth, pageHeight, topMargin, bottomMargin, fontFamily);
          doc.addPage();
          pageNumber++;
          curLeft = getLeftMargin(pageNumber);
          currentY = topMargin + 10;
        }
        doc.text(mLine, curLeft, currentY);
        currentY += 5.2;
      }
      currentY += 2;
    }

    // Intention
    if (currentEntry.intention) {
      doc.setFont(fontFamily, 'italic');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const intText = processText(`Intencja: ${currentEntry.intention}`);
      const intLines = doc.splitTextToSize(intText, getContentWidth());
      for (const iLine of intLines) {
        if (currentY + 5.2 > pageHeight - bottomMargin) {
          addHeaderFooter(doc, pageNumber, bookTitle, sanitizedTitle, pageWidth, pageHeight, topMargin, bottomMargin, fontFamily);
          doc.addPage();
          pageNumber++;
          curLeft = getLeftMargin(pageNumber);
          currentY = topMargin + 10;
        }
        doc.text(iLine, curLeft, currentY);
        currentY += 5.2;
      }
      currentY += 4;
    }

    // Body Paragraphs: 12 pt Times New Roman, Pure Black (#000000), Wyjustowane obustronnie!
    const rawParagraphs = stripHtml(currentEntry.content || '')
      .split('\n')
      .filter(p => p.trim().length > 0);

    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(12); // Exact 12 pt specified by user
    doc.setTextColor(0, 0, 0); // Pure black
    const lineHeight = 5.8; // 5.8 mm leading for 12 pt font

    for (const rawPara of rawParagraphs) {
      const sanitizedPara = processText(rawPara);
      const paraLines: string[] = doc.splitTextToSize(sanitizedPara, getContentWidth());

      for (let lIdx = 0; lIdx < paraLines.length; lIdx++) {
        const line = paraLines[lIdx];
        const isLastLine = lIdx === paraLines.length - 1;

        if (currentY + lineHeight > pageHeight - bottomMargin) {
          addHeaderFooter(doc, pageNumber, bookTitle, sanitizedTitle, pageWidth, pageHeight, topMargin, bottomMargin, fontFamily);
          doc.addPage();
          pageNumber++;
          curLeft = getLeftMargin(pageNumber);
          currentY = topMargin + 10;
        }

        doc.setFont(fontFamily, 'normal');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);

        if (!isLastLine && line.trim().indexOf(' ') !== -1) {
          // Justify full lines left and right
          doc.text(line, curLeft, currentY, { align: 'justify', maxWidth: getContentWidth() });
        } else {
          // Last line of paragraph rests naturally to the left
          doc.text(line, curLeft, currentY);
        }

        currentY += lineHeight;
      }
      currentY += 3.2; // Spacing after paragraph
    }

    // Prayer Box (12 pt Italic, Pure Black text, Justified)
    if (currentEntry.prayer && options.includePrayer !== false) {
      doc.setFont(fontFamily, 'italic');
      doc.setFontSize(11);
      const sanitizedPrayer = processText(stripHtml(currentEntry.prayer));
      const prayerLines: string[] = doc.splitTextToSize(sanitizedPrayer, getContentWidth() - 10);
      const prayerBoxHeight = prayerLines.length * 5.2 + 16;

      if (currentY + prayerBoxHeight > pageHeight - bottomMargin) {
        addHeaderFooter(doc, pageNumber, bookTitle, sanitizedTitle, pageWidth, pageHeight, topMargin, bottomMargin, fontFamily);
        doc.addPage();
        pageNumber++;
        curLeft = getLeftMargin(pageNumber);
        currentY = topMargin + 10;
      }

      curLeft = getLeftMargin(pageNumber);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.setFillColor(252, 250, 245);
      doc.roundedRect(curLeft, currentY, getContentWidth(), prayerBoxHeight, 2, 2, 'FD');

      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('MODLITWA SERCA', curLeft + getContentWidth() / 2, currentY + 6, { align: 'center' });

      doc.setFont(fontFamily, 'italic');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      let pY = currentY + 12;
      for (let pIdx = 0; pIdx < prayerLines.length; pIdx++) {
        const pLine = prayerLines[pIdx];
        const isLastPLine = pIdx === prayerLines.length - 1;
        if (!isLastPLine && pLine.trim().indexOf(' ') !== -1) {
          doc.text(pLine, curLeft + 5, pY, { align: 'justify', maxWidth: getContentWidth() - 10 });
        } else {
          doc.text(pLine, curLeft + 5, pY);
        }
        pY += 5.2;
      }

      currentY += prayerBoxHeight + 6;
    }

    // 1. Embed special video/audio/resource QR cards (Materiały Dodatkowe 1..27)
    const wnrEntry = (meta.id === 'wnr365' || meta.id === 'ebook_wnr' || currentEntry.sectionId === 'wnr365' || currentEntry.sectionId === 'ebook_wnr')
      ? getWnrEntryForDay(currentEntry.dayNumber)
      : null;
    const badgesToEmbed = (currentEntry.qrBadges && currentEntry.qrBadges.length > 0)
      ? currentEntry.qrBadges
      : (wnrEntry?.qrBadges || []);

    if (badgesToEmbed && badgesToEmbed.length > 0) {
      for (const badge of badgesToEmbed) {
        let badgeDataUrl: string | null = null;
        if (badge.image) {
          badgeDataUrl = await fetchQrImageBase64(badge.image);
        }
        const targetUrl = (badge as any).url || (badge as any).link || (badge as any).shortUrl || 'https://wnr365.pages.dev';
        if (!badgeDataUrl) {
          try {
            badgeDataUrl = await QRCode.toDataURL(targetUrl, { width: 300, margin: 1 });
          } catch (e) {}
        }

        if (badgeDataUrl) {
          const cardW = 72; // mm
          const cardH = 99; // mm (800x1100 ratio)
          if (currentY + cardH + 10 > pageHeight - bottomMargin) {
            addHeaderFooter(doc, pageNumber, bookTitle, sanitizedTitle, pageWidth, pageHeight, topMargin, bottomMargin, fontFamily);
            doc.addPage();
            pageNumber++;
            curLeft = getLeftMargin(pageNumber);
            currentY = topMargin + 10;
          }

          const cardX = curLeft + (getContentWidth() - cardW) / 2;
          doc.addImage(badgeDataUrl, 'PNG', cardX, currentY, cardW, cardH);
          if (targetUrl) {
            doc.link(cardX, currentY, cardW, cardH, { url: targetUrl });
          }
          currentY += cardH + 6;
        }
      }
    }

    // 2. Official Day Online Reading QR Code Box for all entries
    const dayUrl = (meta.id === 'rhz365' || currentEntry.sectionId === 'rhz365')
      ? `https://wnr365.pages.dev/r/${currentEntry.dayNumber}`
      : (meta.id === 'biblia365' || currentEntry.sectionId === 'biblia365')
      ? `https://wnr365.pages.dev/b/${currentEntry.dayNumber}`
      : `https://wnr365.pages.dev/w/${currentEntry.dayNumber}`;

    let dayQrDataUrl: string | null = null;
    try {
      dayQrDataUrl = await QRCode.toDataURL(dayUrl, { width: 250, margin: 1 });
    } catch (e) {}

    if (dayQrDataUrl) {
      const boxH = 26;
      if (currentY + boxH + 6 > pageHeight - bottomMargin) {
        addHeaderFooter(doc, pageNumber, bookTitle, sanitizedTitle, pageWidth, pageHeight, topMargin, bottomMargin, fontFamily);
        doc.addPage();
        pageNumber++;
        curLeft = getLeftMargin(pageNumber);
        currentY = topMargin + 10;
      }

      curLeft = getLeftMargin(pageNumber);
      doc.setDrawColor(180, 160, 140);
      doc.setLineWidth(0.3);
      doc.setFillColor(252, 250, 245);
      doc.roundedRect(curLeft, currentY, getContentWidth(), boxH, 2, 2, 'FD');

      doc.addImage(dayQrDataUrl, 'PNG', curLeft + 3, currentY + 3, 20, 20);
      doc.link(curLeft + 3, currentY + 3, 20, 20, { url: dayUrl });

      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text('KOD QR DO ROZWAŻANIA ONLINE', curLeft + 26, currentY + 7);

      doc.setFont(fontFamily, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      doc.text('Zeskanuj smartfonem lub kliknij, aby otworzyć wersję cyfrową:', curLeft + 26, currentY + 13);

      doc.setFont(fontFamily, 'italic');
      doc.setFontSize(8);
      doc.setTextColor(180, 83, 9); // Amber-700
      doc.text(dayUrl, curLeft + 26, currentY + 19);
      doc.link(curLeft + 26, currentY + 15, getContentWidth() - 30, 6, { url: dayUrl });

      currentY += boxH + 6;
    }

    addHeaderFooter(doc, pageNumber, bookTitle, sanitizedTitle, pageWidth, pageHeight, topMargin, bottomMargin, fontFamily);
  }

  return doc.output('blob');
}

// Running headers and page numbers in pure black (#000000)
function addHeaderFooter(
  doc: jsPDF,
  pageNum: number,
  bookTitle: string,
  chapterTitle: string,
  width: number,
  height: number,
  topM: number,
  bottomM: number,
  fontFamily: string = 'TimesNewRoman'
) {
  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0); // Pure black

  // Footer: Page Number centered
  doc.text(String(pageNum), width / 2, height - bottomM + 8, { align: 'center' });

  // Running header: page 5 and above
  if (pageNum >= 5) {
    const isOdd = pageNum % 2 !== 0;
    let headerText = isOdd ? chapterTitle : bookTitle;
    if (headerText.length > 38) {
      headerText = headerText.substring(0, 35) + '...';
    }
    doc.text(headerText.toUpperCase(), width / 2, topM - 6, { align: 'center' });
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(16, topM - 3, width - 16, topM - 3);
  }
}

// -------------------------------------------------------------
// 2. GENERATOR MICROSOFT WORD (DOCX) - KDP & EMPIK POD FORMAT (A5, 12 pt Times New Roman, Czarny #000000, Wyjustowanie)
// -------------------------------------------------------------
export async function generatePodDocx(
  entry: SectionEntry,
  meta: SectionMeta,
  options: ExportOptions
): Promise<Blob> {
  const zip = new JSZip();
  const author = escapeXml(options.authorName || 'Dominik Kuta');
  const yr = options.selectedYear || 1;
  let rawTitle = meta.name || 'Biblia365';

  if (options.exportScope === 'season' && options.selectedSeason) {
    const seasonStr = SEASON_LABELS_PL[options.selectedSeason] || 'Tom Sezonowy';
    rawTitle += ` – Rok ${yr} – ${seasonStr}`;
  } else if (options.exportScope === 'year') {
    rawTitle += ` – Rok ${yr} (Tom Roczny 365 Czytań)`;
  } else {
    rawTitle += ` – Rok ${yr}`;
  }

  const bookTitle = escapeXml(rawTitle);
  const bookSubtitle = escapeXml(meta.subtitle || 'Kanoniczny Cykl Czytań Biblia365');

  // 1. [Content_Types].xml
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`);

  // 2. _rels/.rels
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  // 3. word/_rels/document.xml.rels
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

  // 4. word/styles.xml (Times New Roman, 12 pt = 24 half-pt, Pure Black #000000, Wyjustowanie obustronne)
  zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:color w:val="000000"/>
        <w:lang w:val="pl-PL"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:line="288" w:lineRule="auto" w:after="140"/>
        <w:wordWrap/>
        <w:jc w:val="both"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
</w:styles>`);

  const entriesToProcess: SectionEntry[] = (options.allYearEntries && options.allYearEntries.length > 0)
    ? options.allYearEntries
    : [entry];

  let chaptersXml = '';

  for (let idx = 0; idx < entriesToProcess.length; idx++) {
    const curEntry = entriesToProcess[idx];
    const chapterTitle = escapeXml(curEntry.title || `Dzień ${curEntry.dayNumber || idx + 1}`);
    const paragraphs = stripHtml(curEntry.content || '').split('\n').filter(p => p.trim().length > 0);

    const paragraphsXml = paragraphs.map(p => `
      <w:p>
        <w:pPr>
          <w:ind w:firstLine="360"/>
          <w:spacing w:line="288" w:after="140"/>
          <w:jc w:val="both"/>
        </w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Times New Roman"/><w:sz w:val="24"/><w:color w:val="000000"/></w:rPr>
          <w:t>${escapeXml(p)}</w:t>
        </w:r>
      </w:p>`).join('');

    const prayerXml = curEntry.prayer ? `
      <w:p>
        <w:pPr><w:spacing w:before="360" w:after="100"/><w:jc w:val="center"/></w:pPr>
        <w:r><w:rPr><w:rFonts w:ascii="Times New Roman"/><w:b/><w:sz w:val="22"/><w:color w:val="000000"/></w:rPr><w:t>--- MODLITWA SERCA ---</w:t></w:r>
      </w:p>
      <w:p>
        <w:pPr><w:spacing w:after="280"/><w:jc w:val="both"/></w:pPr>
        <w:r><w:rPr><w:rFonts w:ascii="Times New Roman"/><w:i/><w:sz w:val="24"/><w:color w:val="000000"/></w:rPr><w:t>${escapeXml(stripHtml(curEntry.prayer))}</w:t></w:r>
      </w:p>` : '';

    const wnrDocx = (meta.id === 'wnr365' || meta.id === 'ebook_wnr' || curEntry.sectionId === 'wnr365' || curEntry.sectionId === 'ebook_wnr')
      ? getWnrEntryForDay(curEntry.dayNumber)
      : null;
    const docxBadges = (curEntry.qrBadges && curEntry.qrBadges.length > 0)
      ? curEntry.qrBadges
      : (wnrDocx?.qrBadges || []);

    let qrXml = '';
    if (docxBadges && docxBadges.length > 0) {
      for (const badge of docxBadges) {
        qrXml += `
          <w:p>
            <w:pPr><w:spacing w:before="240" w:after="80"/><w:jc w:val="left"/></w:pPr>
            <w:r><w:rPr><w:rFonts w:ascii="Times New Roman"/><w:b/><w:sz w:val="22"/><w:color w:val="B45309"/></w:rPr><w:t>[MATERIAŁ DODATKOWY - KOD QR: ${escapeXml(badge.title)}]</w:t></w:r>
          </w:p>
          <w:p>
            <w:pPr><w:spacing w:after="160"/><w:jc w:val="left"/></w:pPr>
            <w:r><w:rPr><w:rFonts w:ascii="Times New Roman"/><w:sz w:val="20"/><w:color w:val="1D4ED8"/></w:rPr><w:t>Odnośnik: ${escapeXml((badge as any).link || (badge as any).url || (badge as any).shortUrl || '')}</w:t></w:r>
          </w:p>
        `;
      }
    }

    const docxDayUrl = (meta.id === 'rhz365' || curEntry.sectionId === 'rhz365')
      ? `https://wnr365.pages.dev/r/${curEntry.dayNumber}`
      : (meta.id === 'biblia365' || curEntry.sectionId === 'biblia365')
      ? `https://wnr365.pages.dev/b/${curEntry.dayNumber}`
      : `https://wnr365.pages.dev/w/${curEntry.dayNumber}`;

    qrXml += `
      <w:p>
        <w:pPr><w:spacing w:before="200" w:after="140"/><w:jc w:val="left"/></w:pPr>
        <w:r><w:rPr><w:rFonts w:ascii="Times New Roman"/><w:b/><w:sz w:val="18"/><w:color w:val="4B5563"/></w:rPr><w:t>[KOD QR DO ROZWAŻANIA ONLINE: ${escapeXml(docxDayUrl)}]</w:t></w:r>
      </w:p>
    `;

    chaptersXml += `
      ${idx > 0 ? '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' : ''}
      <w:p>
        <w:pPr><w:spacing w:before="360" w:after="240"/><w:jc w:val="left"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Times New Roman"/><w:b/><w:sz w:val="28"/><w:color w:val="000000"/></w:rPr>
          <w:t>${chapterTitle}</w:t>
        </w:r>
      </w:p>
      ${curEntry.passage ? `
      <w:p>
        <w:pPr><w:spacing w:after="180"/><w:jc w:val="left"/></w:pPr>
        <w:r><w:rPr><w:rFonts w:ascii="Times New Roman"/><w:i/><w:sz w:val="20"/><w:color w:val="000000"/></w:rPr><w:t>Fragment: ${escapeXml(curEntry.passage)}</w:t></w:r>
      </w:p>` : ''}
      ${paragraphsXml}
      ${prayerXml}
      ${qrXml}
    `;
  }

  // 5. word/document.xml (A5 dimensions: w=8390 dxa = 148 mm, h=11906 dxa = 210 mm)
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <!-- TITLE PAGE -->
    <w:p>
      <w:pPr><w:spacing w:before="1800" w:after="300"/><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Times New Roman"/><w:sz w:val="26"/><w:color w:val="000000"/></w:rPr>
        <w:t>${author.toUpperCase()}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="400" w:after="400"/><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Times New Roman"/><w:b/><w:sz w:val="38"/><w:color w:val="000000"/></w:rPr>
        <w:t>${bookTitle}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="2000"/><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Times New Roman"/><w:i/><w:sz w:val="22"/><w:color w:val="000000"/></w:rPr>
        <w:t>${bookSubtitle}</w:t>
      </w:r>
    </w:p>
    
    <!-- PAGE BREAK TO COPYRIGHT PAGE -->
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>

    <!-- COPYRIGHT PAGE -->
    <w:p>
      <w:pPr><w:spacing w:before="3000" w:after="100"/><w:jc w:val="left"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Times New Roman"/><w:sz w:val="18"/><w:color w:val="000000"/></w:rPr>
        <w:t>Copyright © ${new Date().getFullYear()} by ${author}. Wszelkie prawa zastrzeżone.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="100"/><w:jc w:val="left"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Times New Roman"/><w:sz w:val="18"/><w:color w:val="000000"/></w:rPr>
        <w:t>${bookTitle} – Wydanie Format A5 POD KDP & Empik.</w:t>
      </w:r>
    </w:p>

    <!-- PAGE BREAK TO CHAPTERS -->
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>

    ${chaptersXml}

    <!-- Format A5 Paperback page settings (148x210 mm = 8390 x 11906 dxa) with POD mirror margins -->
    <w:sectPr>
      <w:pgSz w:w="8390" w:h="11906"/>
      <w:pgMar w:top="1020" w:bottom="1020" w:left="1200" w:right="800" w:gutter="240" w:header="500" w:footer="500"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file('word/document.xml', documentXml);

  return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

// -------------------------------------------------------------
// 3. GENERATOR STANDARDOWEGO EPUB 3 - LEGIMI, EMPIK GO, KINDLE
// Format A5 layout, Czcionka 12 pt Times New Roman, Kolor Czarny (#000000), Wyjustowanie
// -------------------------------------------------------------
export async function generateEpub(
  entry: SectionEntry,
  meta: SectionMeta,
  options: ExportOptions
): Promise<Blob> {
  const zip = new JSZip();
  const author = escapeXml(options.authorName || 'Dominik Kuta');
  const yr = options.selectedYear || 1;
  let rawTitle = meta.name || 'Biblia365';

  if (options.exportScope === 'season' && options.selectedSeason) {
    const seasonStr = SEASON_LABELS_PL[options.selectedSeason] || 'Tom Sezonowy';
    rawTitle += ` – Rok ${yr} – ${seasonStr}`;
  } else if (options.exportScope === 'year') {
    rawTitle += ` – Rok ${yr} (Tom Roczny 365 Czytań)`;
  } else {
    rawTitle += ` – Rok ${yr}`;
  }

  const bookTitle = escapeXml(rawTitle);
  const bookSubtitle = escapeXml(meta.subtitle || 'Kanoniczny Cykl Czytań Biblia365');
  const bookId = `urn:uuid:biblia365-yr-${yr}-${options.selectedSeason || 'all'}-${Date.now()}`;

  const entriesToProcess: SectionEntry[] = (options.allYearEntries && options.allYearEntries.length > 0)
    ? options.allYearEntries
    : [entry];

  // 1. mimetype
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  zip.file('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

  // 3. OEBPS/style.css (12 pt Times New Roman, Pure Black #000000, Wyjustowane obustronnie)
  zip.file('OEBPS/style.css', `
body {
  font-family: 'Times New Roman', Times, Georgia, serif;
  font-size: 12pt;
  line-height: 1.6;
  margin: 4%;
  padding: 0;
  color: #000000;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}
h1 {
  font-size: 1.5em;
  color: #000000;
  text-align: center;
  margin-top: 1.2em;
  margin-bottom: 0.5em;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
h2 {
  font-size: 1.1em;
  color: #000000;
  text-align: center;
  font-weight: normal;
  font-style: italic;
  margin-bottom: 1.2em;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
p {
  font-size: 12pt;
  color: #000000;
  text-indent: 1.5em;
  margin-top: 0;
  margin-bottom: 0.4em;
  text-align: justify;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
p.first {
  text-indent: 0;
}
.chapter-content {
  max-width: 100%;
}
.prayer-box {
  border: 1px solid #000000;
  background-color: #fdfbf7;
  padding: 1.2em;
  margin: 2em 0;
  border-radius: 4px;
  text-align: justify;
  font-style: italic;
  color: #000000;
  box-sizing: border-box;
  max-width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
.prayer-title {
  font-weight: bold;
  font-style: normal;
  color: #000000;
  text-align: center;
  margin-bottom: 0.6em;
  font-size: 0.95em;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.copyright {
  font-size: 0.85em;
  color: #000000;
  margin-top: 3em;
  border-top: 1px solid #000000;
  padding-top: 1em;
}
`);

  // Build chapter files and TOC items
  const manifestItems: string[] = [];
  const spineItems: string[] = [];
  const ncxNavPoints: string[] = [];
  const htmlNavItems: string[] = [];

  manifestItems.push('<item id="style" href="style.css" media-type="text/css"/>');
  manifestItems.push('<item id="titlepage" href="titlepage.xhtml" media-type="application/xhtml+xml"/>');
  spineItems.push('<itemref idref="titlepage"/>');

  for (let idx = 0; idx < entriesToProcess.length; idx++) {
    const curEntry = entriesToProcess[idx];
    const chapId = `chap_${idx + 1}`;
    const chapFileName = `chapter_${idx + 1}.xhtml`;
    const chapTitle = escapeXml(curEntry.title || `Dzień ${curEntry.dayNumber || idx + 1}`);

    manifestItems.push(`<item id="${chapId}" href="${chapFileName}" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="${chapId}"/>`);

    ncxNavPoints.push(`
    <navPoint id="navpoint-${idx + 2}" playOrder="${idx + 2}">
      <navLabel><text>${chapTitle}</text></navLabel>
      <content src="${chapFileName}"/>
    </navPoint>`);

    htmlNavItems.push(`<li><a href="${chapFileName}">${chapTitle}</a></li>`);

    const paragraphsHtml = stripHtml(curEntry.content || '')
      .split('\n')
      .filter(p => p.trim().length > 0)
      .map((p, pIdx) => `<p class="${pIdx === 0 ? 'first' : ''}">${escapeXml(p)}</p>`)
      .join('\n');

    const prayerHtml = curEntry.prayer ? `
    <div class="prayer-box">
      <div class="prayer-title">Modlitwa Serca</div>
      <p style="text-indent: 0;">${escapeXml(stripHtml(curEntry.prayer))}</p>
    </div>` : '';

    const dayNum = curEntry.dayNumber || (idx + 1);
    const wnrEntry = getWnrEntryForDay(dayNum);
    const badgesToEmbed = curEntry.qrBadges || wnrEntry?.qrBadges || [];
    const dayUrl = `https://wnr365.pages.dev/wnr365?day=${dayNum}`;

    const qrMaterialsHtml = badgesToEmbed.length > 0 ? `
    <div style="margin-top: 2em; padding: 1em; border: 1px solid #d97706; background-color: #fffbeb; border-radius: 6px;">
      <h3 style="color: #92400e; font-size: 1.1em; margin-bottom: 0.8em; text-align: center;">Materiały Dodatkowe i Kody QR (Wersja 1:1)</h3>
      ${badgesToEmbed.map((b: any) => `
        <div style="margin-bottom: 1em; padding-bottom: 0.8em; border-bottom: 1px dashed #fcd34d; text-align: center;">
          <p style="font-weight: bold; margin-bottom: 0.2em;">${escapeXml(b.title)}</p>
          ${b.subtitle ? `<p style="font-size: 0.85em; color: #4b5563; margin-bottom: 0.4em;">${escapeXml(b.subtitle)}</p>` : ''}
          <p style="text-indent: 0;"><a href="${b.link || b.url || b.shortUrl || ''}" style="color: #b45309; font-weight: bold; text-decoration: underline;">Otwórz materiał: ${escapeXml(b.link || b.url || b.shortUrl || '')}</a></p>
        </div>
      `).join('')}
    </div>` : '';

    const onlineQrHtml = `
    <div style="margin-top: 2em; border-top: 1px solid #e5e7eb; padding-top: 1em; text-align: center; font-size: 0.85em; color: #6b7280;">
      <p style="text-indent: 0;">Pełne rozważanie i nagrania w serwisie:</p>
      <p style="text-indent: 0;"><a href="${dayUrl}" style="color: #b45309; font-weight: bold;">${dayUrl}</a></p>
    </div>`;

    const chapterXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${chapTitle}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h1>${chapTitle}</h1>
  ${curEntry.passage ? `<h2>Fragment: ${escapeXml(curEntry.passage)}</h2>` : ''}
  
  <div class="chapter-content">
    ${paragraphsHtml}
  </div>

  ${prayerHtml}
  ${qrMaterialsHtml}
  ${onlineQrHtml}
</body>
</html>`;

    zip.file(`OEBPS/${chapFileName}`, chapterXhtml);
  }

  manifestItems.push('<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>');
  manifestItems.push('<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>');

  // 4. OEBPS/content.opf
  zip.file('OEBPS/content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${bookTitle}</dc:title>
    <dc:creator>${author}</dc:creator>
    <dc:identifier id="BookID">${bookId}</dc:identifier>
    <dc:language>${options.language || 'pl'}</dc:language>
    <dc:publisher>Biblia365 – Dominik Kuta</dc:publisher>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join('\n    ')}
  </spine>
</package>`);

  // 5. OEBPS/toc.ncx
  zip.file('OEBPS/toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookId}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${bookTitle}</text></docTitle>
  <navMap>
    <navPoint id="navpoint-1" playOrder="1">
      <navLabel><text>Strona tytułowa</text></navLabel>
      <content src="titlepage.xhtml"/>
    </navPoint>
    ${ncxNavPoints.join('\n')}
  </navMap>
</ncx>`);

  // 6. OEBPS/nav.xhtml
  zip.file('OEBPS/nav.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Spis treści</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Spis treści - ${bookTitle}</h1>
    <ol>
      <li><a href="titlepage.xhtml">Strona Tytułowa</a></li>
      ${htmlNavItems.join('\n      ')}
    </ol>
  </nav>
</body>
</html>`);

  // 7. OEBPS/titlepage.xhtml
  zip.file('OEBPS/titlepage.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${bookTitle}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <div style="text-align: center; margin-top: 25%;">
    <p style="text-indent: 0; font-size: 1.1em; color: #000000;">${author}</p>
    <h1 style="font-size: 2.2em; margin: 0.5em 0; color: #000000;">${bookTitle}</h1>
    <h2 style="color: #000000;">${bookSubtitle}</h2>
    <p style="text-indent: 0; font-size: 0.9em; color: #000000;">Liczba Rozdziałów / Czytań: ${entriesToProcess.length}</p>
  </div>
  <div class="copyright">
    <p style="text-indent: 0;">Copyright © ${new Date().getFullYear()} by ${author}.</p>
    <p style="text-indent: 0;">Przygotowane do publikacji POD i E-book: Legimi, Empik Go, Apple Books, Amazon KDP (0 zł na start).</p>
  </div>
</body>
</html>`);

  return await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
}
