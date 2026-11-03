import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import { SectionEntry, SectionMeta } from '../types';
import { getWnrEntryForDay } from '../data/wnr365Data';
import { cleanParagraphsFromEnters } from './textFormatter';

// Memory cache for QR code card images to avoid repeated fetches
const qrImageCache = new Map<string, string>();

async function fetchQrImageBase64(imgPath: string): Promise<string | null> {
  if (qrImageCache.has(imgPath)) return qrImageCache.get(imgPath)!;
  try {
    const url = (typeof window !== 'undefined' && imgPath.startsWith('/'))
      ? `${window.location.origin}${imgPath}`
      : imgPath;
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuf = await res.arrayBuffer();
    const contentType = res.headers.get('content-type');
    const mime = contentType || (imgPath.match(/\.jpe?g$/i) ? 'image/jpeg' : 'image/png');
    const base64 = arrayBufferToBase64(arrayBuf);
    const dataUrl = `data:${mime};base64,${base64}`;
    qrImageCache.set(imgPath, dataUrl);
    return dataUrl;
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
  onProgress?: (current: number, total: number, message: string) => void;
}

// Helper to convert ArrayBuffer to Base64 in fast chunks for jsPDF font embedding
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

// Helper to sanitize text for XML (DOCX & ePUB)
function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
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

// Decode HTML entities that may appear in content
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d{1,6});/gi, (_: string, num: string) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-f]{1,6});/gi, (_: string, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}

// Content block types for structured rendering of markdown content in PDF, DOCX, ePUB
interface ContentBlock {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'hr' | 'blockquote' | 'paragraph' | 'bullet';
  text: string;
  segments: Array<{ text: string; bold?: boolean; italic?: boolean }>;
}

// Parse inline **bold** and *italic* formatting into segments
function parseInlineFormatting(text: string): Array<{ text: string; bold?: boolean; italic?: boolean }> {
  const segments: Array<{ text: string; bold?: boolean; italic?: boolean }> = [];
  const regex = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.substring(lastIndex, match.index) });
    }
    if (match[1]) {
      segments.push({ text: match[1], bold: true });
    } else if (match[2]) {
      segments.push({ text: match[2], italic: true });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.substring(lastIndex) });
  }
  return segments.length > 0 ? segments : [{ text }];
}

// Strip markdown bold/italic markers from text (for PDF where inline formatting is limited)
function stripMarkdownInline(text: string): string {
  return (text || '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1');
}

// Parse raw markdown content into typed blocks for structured rendering
function parseMarkdownToBlocks(rawContent: string): ContentBlock[] {
  if (!rawContent) return [];
  const decoded = decodeHtmlEntities(rawContent)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  const normalized = decoded
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/([^\n])\n(#{1,4}\s+[^\n]+)/g, '$1\n\n$2')
    .replace(/(#{1,4}\s+[^\n]+)\n([^\n#])/g, '$1\n\n$2')
    .replace(/([^\n])\n(---\s*)\n/g, '$1\n\n$2\n');

  const rawChunks = normalized.split(/\n\s*\n+/);
  const blocks: ContentBlock[] = [];

  for (const chunk of rawChunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('#### ')) {
      const t = trimmed.replace(/^####\s+/, '').trim();
      blocks.push({ type: 'h4', text: t, segments: parseInlineFormatting(t) });
    } else if (trimmed.startsWith('### ')) {
      const t = trimmed.replace(/^###\s+/, '').trim();
      blocks.push({ type: 'h3', text: t, segments: parseInlineFormatting(t) });
    } else if (trimmed.startsWith('## ')) {
      const t = trimmed.replace(/^##\s+/, '').trim();
      blocks.push({ type: 'h2', text: t, segments: parseInlineFormatting(t) });
    } else if (trimmed.startsWith('# ')) {
      const t = trimmed.replace(/^#\s+/, '').trim();
      blocks.push({ type: 'h1', text: t, segments: parseInlineFormatting(t) });
    } else if (trimmed === '---' || trimmed === '***') {
      blocks.push({ type: 'hr', text: '', segments: [] });
    } else if (trimmed.startsWith('>')) {
      const qText = trimmed.replace(/^>\s*/gm, ' ').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
      blocks.push({ type: 'blockquote', text: qText, segments: parseInlineFormatting(qText) });
    } else if (/^[*\-]\s+/.test(trimmed) && !trimmed.startsWith('**')) {
      const items = trimmed.split(/\n\s*[*\-]\s+/);
      for (const item of items) {
        const it = item.replace(/^[*\-]\s+/, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
        if (it) blocks.push({ type: 'bullet', text: it, segments: parseInlineFormatting(it) });
      }
    } else {
      const pText = trimmed.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim();
      if (pText) blocks.push({ type: 'paragraph', text: pText, segments: parseInlineFormatting(pText) });
    }
  }
  return blocks;
}

// Convert content blocks to DOCX XML with proper heading styles and inline bold/italic formatting
function blocksToDocxXml(blocks: ContentBlock[]): string {
  const makeRuns = (segs: ContentBlock['segments'], baseBold = false, baseItalic = false, fontSize = '24', color = '000000') => {
    return segs.map(seg => {
      const t = escapeXml(seg.text);
      const bTag = (seg.bold || baseBold) ? '<w:b/><w:bCs/>' : '';
      const iTag = (seg.italic || baseItalic) ? '<w:i/><w:iCs/>' : '';
      return `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>${bTag}${iTag}<w:sz w:val="${fontSize}"/><w:szCs w:val="${fontSize}"/><w:color w:val="${color}"/></w:rPr><w:t xml:space="preserve">${t}</w:t></w:r>`;
    }).join('');
  };

  return blocks.map(block => {
    switch (block.type) {
      case 'h1':
        return `<w:p><w:pPr><w:pStyle w:val="Heading1"/><w:spacing w:before="360" w:after="200"/><w:jc w:val="center"/></w:pPr>${makeRuns(block.segments, true, false, '32')}</w:p>`;
      case 'h2':
        return `<w:p><w:pPr><w:pStyle w:val="Heading2"/><w:spacing w:before="280" w:after="160"/><w:jc w:val="left"/></w:pPr>${makeRuns(block.segments, true, false, '26')}</w:p>`;
      case 'h3':
        return `<w:p><w:pPr><w:pStyle w:val="Heading3"/><w:spacing w:before="200" w:after="120"/><w:jc w:val="left"/></w:pPr>${makeRuns(block.segments, true, false, '24')}</w:p>`;
      case 'h4':
        return `<w:p><w:pPr><w:spacing w:before="200" w:after="100"/><w:jc w:val="left"/></w:pPr>${makeRuns(block.segments, true, true, '24')}</w:p>`;
      case 'hr':
        return `<w:p><w:pPr><w:spacing w:before="200" w:after="200"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman"/><w:sz w:val="20"/><w:color w:val="999999"/></w:rPr><w:t>\u2022 \u2022 \u2022</w:t></w:r></w:p>`;
      case 'blockquote':
        return `<w:p><w:pPr><w:ind w:left="480" w:right="480"/><w:spacing w:line="276" w:lineRule="auto" w:before="120" w:after="120"/><w:jc w:val="both"/></w:pPr>${makeRuns(block.segments, false, true, '24', '333333')}</w:p>`;
      case 'bullet':
        return `<w:p><w:pPr><w:ind w:left="480" w:hanging="240"/><w:spacing w:line="276" w:lineRule="auto" w:after="80"/><w:jc w:val="both"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:color w:val="000000"/></w:rPr><w:t xml:space="preserve">\u2022 </w:t></w:r>${makeRuns(block.segments)}</w:p>`;
      default:
        return `<w:p><w:pPr><w:ind w:firstLine="360"/><w:spacing w:line="276" w:lineRule="auto" w:after="120"/><w:jc w:val="both"/></w:pPr>${makeRuns(block.segments)}</w:p>`;
    }
  }).join('\n');
}

// Convert content blocks to ePUB XHTML with proper HTML tags and inline bold/italic
function blocksToEpubHtml(blocks: ContentBlock[]): string {
  const formatSegs = (segs: ContentBlock['segments']) => {
    return segs.map(seg => {
      const t = escapeXml(seg.text);
      if (seg.bold && seg.italic) return `<strong><em>${t}</em></strong>`;
      if (seg.bold) return `<strong>${t}</strong>`;
      if (seg.italic) return `<em>${t}</em>`;
      return t;
    }).join('');
  };

  return blocks.map((block, idx) => {
    switch (block.type) {
      case 'h1': return `<h1>${formatSegs(block.segments)}</h1>`;
      case 'h2': return `<h2>${formatSegs(block.segments)}</h2>`;
      case 'h3': return `<h3>${formatSegs(block.segments)}</h3>`;
      case 'h4': return `<h4>${formatSegs(block.segments)}</h4>`;
      case 'hr': return '<hr/>';
      case 'blockquote': return `<blockquote><p style="text-indent: 0;">${formatSegs(block.segments)}</p></blockquote>`;
      case 'bullet': return `<p class="bullet">\u2022 ${formatSegs(block.segments)}</p>`;
      default: return `<p${idx === 0 ? ' class="first"' : ''}>${formatSegs(block.segments)}</p>`;
    }
  }).join('\n');
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
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const [regRes, boldRes, italRes] = await Promise.all([
      fetch(`${baseUrl}/fonts/PTSerif-Regular.ttf`),
      fetch(`${baseUrl}/fonts/PTSerif-Bold.ttf`),
      fetch(`${baseUrl}/fonts/PTSerif-Italic.ttf`)
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

// Cache for daily online reading QR codes to avoid regenerating identical codes
const dayQrCodeCache = new Map<string, string>();
async function getDayQrCodeDataUrl(dayUrl: string): Promise<string | null> {
  if (dayQrCodeCache.has(dayUrl)) return dayQrCodeCache.get(dayUrl)!;
  try {
    const dataUrl = await QRCode.toDataURL(dayUrl, { width: 140, margin: 1 });
    dayQrCodeCache.set(dayUrl, dataUrl);
    return dataUrl;
  } catch (e) {
    return null;
  }
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
  const isBiblia = meta.id === 'biblia365' || meta.id === 'ebook_biblia';
  const isNowyRhz = meta.id === 'nowyRHZ' || meta.id === 'ebook_nowyrhz';
  const isRhz = meta.id === 'rhz365' || meta.id === 'ebook_rhz';

  let rawTitle = meta.name || 'Droga365';

  if (isNowyRhz) {
    rawTitle = `${meta.name || 'NowyRHZ365'} – Kompletne Dwa Cykle (365 Dni)`;
  } else if (isRhz) {
    rawTitle = `${meta.name || 'RHZ365'} – Modlitewnik (365 Dni)`;
  } else if (isBiblia) {
    if (options.exportScope === 'season' && options.selectedSeason) {
      const seasonStr = SEASON_LABELS_PL[options.selectedSeason] || 'Tom Sezonowy';
      rawTitle += ` – Rok ${yr} – ${seasonStr}`;
    } else if (options.exportScope === 'year') {
      rawTitle += ` – Rok ${yr} (Tom Roczny 365 Dni)`;
    } else {
      rawTitle += ` – Rok ${yr}`;
    }
  } else {
    if (options.exportScope === 'season' && options.selectedSeason) {
      const seasonStr = SEASON_LABELS_PL[options.selectedSeason] || 'Tom Sezonowy';
      rawTitle += ` – ${seasonStr}`;
    } else if (options.exportScope === 'year') {
      rawTitle += ' (Tom Roczny 365 Dni)';
    }
  }

  const bookTitle = processText(rawTitle);
  const defaultSub = isNowyRhz ? 'Nowy Różaniec Historii Zbawienia – 365 Dni' : (isRhz ? 'Różaniec Historii Zbawienia' : (isBiblia ? 'Kanoniczny Cykl Czytań Biblia365' : 'Droga365'));
  const bookSubtitle = processText(meta.subtitle || defaultSub);

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
  const seriesHeader = isNowyRhz
    ? 'NOWY RÓŻANIEC HISTORII ZBAWIENIA • DROGA365'
    : isRhz
    ? 'RÓŻANIEC HISTORII ZBAWIENIA • DROGA365'
    : (isBiblia ? 'BIBLIA365 • DROGA365' : 'WIDOKI NA RAJ • DROGA365');
  doc.text(seriesHeader, pageWidth / 2, 85, { align: 'center' });

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
  const scopeDesc = isNowyRhz
    ? 'Wydanie Kompletne: Dwa Cykle • 365 Dni (Tom A5)'
    : isRhz
    ? 'Wydanie Roczne: 365 Dni Modlitwy'
    : options.exportScope === 'season'
    ? (isBiblia ? `Wydanie Sezonowe: Rok ${yr} • ${SEASON_LABELS_PL[options.selectedSeason || 'zima'] || ''}` : `Wydanie Sezonowe: ${SEASON_LABELS_PL[options.selectedSeason || 'zima'] || ''}`)
    : options.exportScope === 'year'
    ? (isBiblia ? `Wydanie Roczne: Rok ${yr} • 365 Czytań` : 'Wydanie Roczne: 365 Dni')
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
    'Projekt typograficzny i skład POD: ' + (isNowyRhz ? 'System NowyRHZ365 / Droga365' : isRhz ? 'System RHZ365 / Droga365' : isBiblia ? 'System Biblia365 / Droga365' : 'System WidokiNaRaj365 / Droga365'),
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

  const totalEntries = entriesToProcess.length;
  let currentY = topMargin + 10;

  // Process entries
  for (let idx = 0; idx < totalEntries; idx++) {
    const currentEntry = entriesToProcess[idx];
    const epoka = currentEntry.stageTitle || '';
    const czesc = currentEntry.partTitle || '';
    const dayNum = currentEntry.dayNumber || (idx + 1);
    const tajemnica = currentEntry.mystery || currentEntry.title || `Dzień ${dayNum}`;
    const nazwa = currentEntry.sub || '';
    const dayHeading = nazwa ? `DZIEŃ ${dayNum} • TAJEMNICA: ${tajemnica} — ${nazwa}` : `DZIEŃ ${dayNum} • TAJEMNICA: ${tajemnica}`;
    const sanitizedTitle = processText(dayHeading);

    // Progress reporting
    if (idx % 5 === 0 || idx === totalEntries - 1) {
      if (options.onProgress) {
        const pct = Math.round(((idx + 1) / totalEntries) * 100);
        options.onProgress(idx + 1, totalEntries, `Skład stron A5 (12 pt Times New Roman): ${idx + 1} z ${totalEntries} (${pct}%)...`);
      }
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Continuous layout: remove forced empty page breaks between days
    if (idx === 0) {
      doc.addPage();
      pageNumber++;
      currentY = topMargin + 10;
    } else {
      const neededSpace = 55; // mm for header + intro
      if (currentY + neededSpace > pageHeight - bottomMargin) {
        addHeaderFooter(doc, pageNumber, bookTitle, sanitizedTitle, pageWidth, pageHeight, topMargin, bottomMargin, fontFamily, gutterMargin, outerMargin, epoka, czesc, dayNum, tajemnica);
        doc.addPage();
        pageNumber++;
        currentY = topMargin + 10;
      } else {
        currentY += 8; // Odstęp typograficzny między dniami bez linii i ozdobników
      }
    }

    let curLeft = getLeftMargin(pageNumber);
    const lineHeight12 = 12 * 0.352778 * 1.15; // 4.868 mm

    // 1. Nagłówek: Epoka & Część - jednolity Times New Roman, bold, 11pt, czarny, bez ozdobników
    if (epoka || czesc) {
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      const epokaText = processText([
        epoka ? `EPOKA: ${epoka.toUpperCase()}` : '',
        czesc ? `CZĘŚĆ: ${czesc.toUpperCase()}` : ''
      ].filter(Boolean).join(' • '));
      const epokaLines = doc.splitTextToSize(epokaText, getContentWidth());
      for (const el of epokaLines) {
        doc.text(el, curLeft, currentY);
        currentY += 4.6;
      }
    }

    // 2. Nagłówek: Dzień, Tajemnica & Nazwa - jednolity Times New Roman, bold, 12pt, czarny
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const dayTajLines = doc.splitTextToSize(sanitizedTitle, getContentWidth());
    for (const dtLine of dayTajLines) {
      doc.text(dtLine, curLeft, currentY);
      currentY += 5.2;
    }
    currentY += 3;

    // Funkcja pomocnicza: renderowanie wyjustowanych akapitów (12pt Times New Roman, normal, czarny, bez kursywy)
    // Usuwa nadmiarowe przejścia do nowej linii (Enter) wewnątrz zdań i zapewnia równomierne justowanie do prawej i lewej
    const renderJustifiedParagraphs = (rawText: string, isBoldTitle = false) => {
      if (!rawText) return;
      const paragraphs = cleanParagraphsFromEnters(stripHtml(rawText));
      for (const para of paragraphs) {
        const plainText = processText(stripMarkdownInline(para));
        if (!plainText) continue;

        doc.setFont(fontFamily, isBoldTitle ? 'bold' : 'normal');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setLineHeightFactor(1.15);

        const paraLines = doc.splitTextToSize(plainText, getContentWidth());
        let remainingLines = [...paraLines];

        while (remainingLines.length > 0) {
          if (currentY + lineHeight12 > pageHeight - bottomMargin) {
            addHeaderFooter(doc, pageNumber, bookTitle, sanitizedTitle, pageWidth, pageHeight, topMargin, bottomMargin, fontFamily, gutterMargin, outerMargin, epoka, czesc, dayNum, tajemnica);
            doc.addPage();
            pageNumber++;
            curLeft = getLeftMargin(pageNumber);
            currentY = topMargin + 10;
          }
          const availableHeight = (pageHeight - bottomMargin) - currentY;
          const linesThatFit = Math.max(1, Math.floor(availableHeight / lineHeight12));
          const chunk = remainingLines.slice(0, linesThatFit);
          const isEndOfPara = chunk.length === remainingLines.length;

          if (isEndOfPara) {
            doc.text(chunk, curLeft, currentY, { maxWidth: getContentWidth(), align: 'justify' });
            currentY += chunk.length * lineHeight12;
            remainingLines = [];
          } else {
            doc.text([...chunk, ''], curLeft, currentY, { maxWidth: getContentWidth(), align: 'justify' });
            currentY += chunk.length * lineHeight12;
            remainingLines = remainingLines.slice(linesThatFit);
            addHeaderFooter(doc, pageNumber, bookTitle, sanitizedTitle, pageWidth, pageHeight, topMargin, bottomMargin, fontFamily, gutterMargin, outerMargin, epoka, czesc, dayNum, tajemnica);
            doc.addPage();
            pageNumber++;
            curLeft = getLeftMargin(pageNumber);
            currentY = topMargin + 10;
          }
        }
        currentY += 2.8;
      }
    };

    // 3. Pismo Święte (Cytaty) - jednolite 12pt Times New Roman, normal (bez kursywy!), wyjustowane obustronnie
    if (currentEntry.passage || currentEntry.apocryphaPassage) {
      renderJustifiedParagraphs(currentEntry.passage || currentEntry.apocryphaPassage || '');
      currentY += 1.5;
    }

    // 4. Treść główna / Rozważanie - jednolite 12pt Times New Roman, normal, wyjustowane obustronnie
    if (currentEntry.content) {
      renderJustifiedParagraphs(currentEntry.content);
      currentY += 1.5;
    }

    // 5. Modlitwa - jednolite 12pt Times New Roman, normal (bez kursywy!), wyjustowane obustronnie
    if (currentEntry.prayer) {
      renderJustifiedParagraphs(`Modlitwa: ${stripHtml(currentEntry.prayer)}`);
      currentY += 2.0;
    }

    // QR codes are completely removed everywhere per user request!
    addHeaderFooter(doc, pageNumber, bookTitle, sanitizedTitle, pageWidth, pageHeight, topMargin, bottomMargin, fontFamily, gutterMargin, outerMargin, epoka, czesc, dayNum, tajemnica);
  }
  return doc.output('blob');
}

// Running headers and page numbers in pure black (#000000) with precise odd/even alternating alignment
function addHeaderFooter(
  doc: jsPDF,
  pageNum: number,
  bookTitle: string,
  chapterTitle: string,
  width: number,
  height: number,
  topM: number,
  bottomMargin: number,
  fontFamily: string = 'TimesNewRoman',
  gutterM: number = 18,
  outerM: number = 12,
  epoka: string = '',
  czesc: string = '',
  dayNum: number = 0,
  tajemnica: string = ''
) {
  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0); // Pure black

  const isOdd = pageNum % 2 !== 0;
  const curLeft = isOdd ? gutterM : outerM;
  const contentW = width - gutterM - outerM;
  const curCenter = curLeft + contentW / 2;

  // Footer: Page Number centered perfectly under the text block
  doc.text(String(pageNum), curCenter, height - bottomMargin + 8, { align: 'center' });

  // Running header: page 5 and above
  if (pageNum >= 5) {
    let headerText = '';
    if (isOdd) {
      // Odd pages: Dzień & Tajemnica
      headerText = (dayNum && tajemnica)
        ? `DZIEŃ ${dayNum} • ${tajemnica}`
        : chapterTitle;
    } else {
      // Even pages: Epoka & Część
      headerText = (epoka || czesc)
        ? [epoka, czesc].filter(Boolean).join(' • ')
        : bookTitle;
    }
    if (headerText.length > 55) {
      headerText = headerText.substring(0, 52) + '...';
    }
    doc.text(headerText.toUpperCase(), curCenter, topM - 6, { align: 'center' });
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(curLeft, topM - 3, curLeft + contentW, topM - 3);
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
  const isBiblia = meta.id === 'biblia365' || meta.id === 'ebook_biblia';
  const isNowyRhz = meta.id === 'nowyRHZ' || meta.id === 'ebook_nowyrhz';
  const isRhz = meta.id === 'rhz365' || meta.id === 'ebook_rhz';

  let rawTitle = meta.name || 'Droga365';

  if (isNowyRhz) {
    rawTitle = `${meta.name || 'NowyRHZ365'} – Kompletne Dwa Cykle (365 Dni)`;
  } else if (isRhz) {
    rawTitle = `${meta.name || 'RHZ365'} – Modlitewnik (365 Dni)`;
  } else if (isBiblia) {
    if (options.exportScope === 'season' && options.selectedSeason) {
      const seasonStr = SEASON_LABELS_PL[options.selectedSeason] || 'Tom Sezonowy';
      rawTitle += ` – Rok ${yr} – ${seasonStr}`;
    } else if (options.exportScope === 'year') {
      rawTitle += ` – Rok ${yr} (Tom Roczny 365 Czytań)`;
    } else {
      rawTitle += ` – Rok ${yr}`;
    }
  } else {
    if (options.exportScope === 'season' && options.selectedSeason) {
      const seasonStr = SEASON_LABELS_PL[options.selectedSeason] || 'Tom Sezonowy';
      rawTitle += ` – ${seasonStr}`;
    } else if (options.exportScope === 'year') {
      rawTitle += ' (Tom Roczny 365 Dni)';
    }
  }

  const bookTitle = escapeXml(rawTitle);
  const defaultSub = isNowyRhz ? 'Nowy Różaniec Historii Zbawienia – 365 Dni' : (isRhz ? 'Różaniec Historii Zbawienia' : (isBiblia ? 'Kanoniczny Cykl Czytań Biblia365' : 'Droga365'));
  const bookSubtitle = escapeXml(meta.subtitle || defaultSub);

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

  // 4. word/styles.xml (Times New Roman, 12 pt = 24 half-pt, interlinia 1.15 = 276, Pure Black #000000, Wyjustowanie obustronne)
  zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
        <w:color w:val="000000"/>
        <w:lang w:val="pl-PL"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:line="276" w:lineRule="auto" w:after="120"/>
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
    const epoka = curEntry.stageTitle || '';
    const czesc = curEntry.partTitle || '';
    const dayNum = curEntry.dayNumber || (idx + 1);
    const tajemnica = curEntry.mystery || curEntry.title || `Dzień ${dayNum}`;
    const nazwa = curEntry.sub || '';
    const paragraphs = cleanParagraphsFromEnters(stripHtml(curEntry.content || ''));

    const paragraphsXml = paragraphs.map(p => `
      <w:p>
        <w:pPr>
          <w:ind w:firstLine="360"/>
          <w:spacing w:line="276" w:lineRule="auto" w:after="120"/>
          <w:jc w:val="both"/>
        </w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:color w:val="000000"/></w:rPr>
          <w:t>${escapeXml(p)}</w:t>
        </w:r>
      </w:p>`).join('');

    const passageParagraphs = curEntry.passage
      ? cleanParagraphsFromEnters(stripHtml(curEntry.passage))
      : [];
    const passageXml = passageParagraphs.map(p => `
      <w:p>
        <w:pPr><w:spacing w:line="276" w:lineRule="auto" w:after="120"/><w:jc w:val="both"/></w:pPr>
        <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:color w:val="000000"/></w:rPr><w:t>${escapeXml(p)}</w:t></w:r>
      </w:p>`).join('');

    const prayerParagraphs = curEntry.prayer
      ? cleanParagraphsFromEnters(`Modlitwa: ${stripHtml(curEntry.prayer)}`)
      : [];
    const prayerXml = prayerParagraphs.map(p => `
      <w:p>
        <w:pPr><w:spacing w:line="276" w:lineRule="auto" w:before="120" w:after="180"/><w:jc w:val="both"/></w:pPr>
        <w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:color w:val="000000"/></w:rPr><w:t>${escapeXml(p)}</w:t></w:r>
      </w:p>`).join('');

    const headerXml = `
      ${epoka || czesc ? `
      <w:p>
        <w:pPr><w:spacing w:before="360" w:after="60"/><w:jc w:val="both"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="000000"/></w:rPr>
          <w:t>${escapeXml([epoka ? `EPOKA: ${epoka.toUpperCase()}` : '', czesc ? `CZĘŚĆ: ${czesc.toUpperCase()}` : ''].filter(Boolean).join(' • '))}</w:t>
        </w:r>
      </w:p>` : ''}
      <w:p>
        <w:pPr><w:spacing w:before="60" w:after="160"/><w:jc w:val="both"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/><w:color w:val="000000"/></w:rPr>
          <w:t>${escapeXml(`DZIEŃ ${dayNum} • TAJEMNICA: ${tajemnica}${nazwa ? ` — ${nazwa}` : ''}`)}</w:t>
        </w:r>
      </w:p>
    `;

    chaptersXml += `
      ${headerXml}
      ${passageXml}
      ${paragraphsXml}
      ${prayerXml}
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
        <w:rPr><w:rFonts w:ascii="Times New Roman"/><w:sz w:val="22"/><w:color w:val="000000"/></w:rPr>
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
  const isBiblia = meta.id === 'biblia365' || meta.id === 'ebook_biblia';
  const isNowyRhz = meta.id === 'nowyRHZ' || meta.id === 'ebook_nowyrhz';
  const isRhz = meta.id === 'rhz365' || meta.id === 'ebook_rhz';

  let rawTitle = meta.name || 'Droga365';

  if (isNowyRhz) {
    rawTitle = `${meta.name || 'NowyRHZ365'} – Kompletne Dwa Cykle (365 Dni)`;
  } else if (isRhz) {
    rawTitle = `${meta.name || 'RHZ365'} – Modlitewnik (365 Dni)`;
  } else if (isBiblia) {
    if (options.exportScope === 'season' && options.selectedSeason) {
      const seasonStr = SEASON_LABELS_PL[options.selectedSeason] || 'Tom Sezonowy';
      rawTitle += ` – Rok ${yr} – ${seasonStr}`;
    } else if (options.exportScope === 'year') {
      rawTitle += ` – Rok ${yr} (Tom Roczny 365 Czytań)`;
    } else {
      rawTitle += ` – Rok ${yr}`;
    }
  } else {
    if (options.exportScope === 'season' && options.selectedSeason) {
      const seasonStr = SEASON_LABELS_PL[options.selectedSeason] || 'Tom Sezonowy';
      rawTitle += ` – ${seasonStr}`;
    } else if (options.exportScope === 'year') {
      rawTitle += ' (Tom Roczny 365 Dni)';
    }
  }

  const bookTitle = escapeXml(rawTitle);
  const defaultSub = isNowyRhz ? 'Nowy Różaniec Historii Zbawienia – 365 Dni' : (isRhz ? 'Różaniec Historii Zbawienia' : (isBiblia ? 'Kanoniczny Cykl Czytań Biblia365' : 'Droga365'));
  const bookSubtitle = escapeXml(meta.subtitle || defaultSub);
  const bookId = `urn:uuid:${(meta.id || 'book').replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;

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

  // 3. OEBPS/style.css (12 pt Times New Roman, interlinia 1.15, Pure Black #000000, Wyjustowane obustronnie)
  zip.file('OEBPS/style.css', `
body {
  font-family: 'Times New Roman', Times, Georgia, serif;
  font-size: 12pt;
  line-height: 1.15;
  margin: 4%;
  padding: 0;
  color: #000000;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}
h1 {
  font-family: 'Times New Roman', Times, Georgia, serif;
  font-size: 1.5em;
  color: #000000;
  text-align: center;
  margin-top: 1.2em;
  margin-bottom: 0.5em;
  line-height: 1.15;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
h2 {
  font-family: 'Times New Roman', Times, Georgia, serif;
  font-size: 1.1em;
  color: #000000;
  text-align: center;
  font-weight: normal;
  font-style: normal;
  margin-bottom: 1.2em;
  line-height: 1.15;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
p {
  font-family: 'Times New Roman', Times, Georgia, serif;
  font-size: 12pt;
  line-height: 1.15;
  color: #000000;
  margin-top: 0;
  margin-bottom: 0.35em;
  text-align: justify;
  text-justify: inter-word;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}
p.first {
  text-indent: 0;
}
.chapter-content {
  font-family: 'Times New Roman', Times, Georgia, serif;
  font-size: 12pt;
  line-height: 1.15;
  max-width: 100%;
}
.prayer-box {
  margin: 1.2em 0;
  text-align: justify;
  font-family: 'Times New Roman', Times, Georgia, serif;
  font-size: 12pt;
  line-height: 1.15;
  color: #000000;
  box-sizing: border-box;
  max-width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
.prayer-box p {
  font-family: 'Times New Roman', Times, Georgia, serif;
  font-size: 12pt;
  line-height: 1.15;
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
    const epoka = curEntry.stageTitle || '';
    const czesc = curEntry.partTitle || '';
    const dayNum = curEntry.dayNumber || (idx + 1);
    const tajemnica = curEntry.mystery || curEntry.title || `Dzień ${dayNum}`;
    const nazwa = curEntry.sub || '';
    const fullHeading = nazwa ? `DZIEŃ ${dayNum} • TAJEMNICA: ${tajemnica} — ${nazwa}` : `DZIEŃ ${dayNum} • TAJEMNICA: ${tajemnica}`;
    const chapTitle = escapeXml(fullHeading);

    manifestItems.push(`<item id="${chapId}" href="${chapFileName}" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="${chapId}"/>`);

    ncxNavPoints.push(`
    <navPoint id="navpoint-${idx + 2}" playOrder="${idx + 2}">
      <navLabel><text>${chapTitle}</text></navLabel>
      <content src="${chapFileName}"/>
    </navPoint>`);

    htmlNavItems.push(`<li><a href="${chapFileName}">${chapTitle}</a></li>`);

    const passageHtml = curEntry.passage
      ? cleanParagraphsFromEnters(stripHtml(curEntry.passage))
          .map((p, pIdx) => `<p class="${pIdx === 0 ? 'first' : ''}">${escapeXml(p)}</p>`)
          .join('\n')
      : '';

    const paragraphsHtml = cleanParagraphsFromEnters(stripHtml(curEntry.content || ''))
      .map((p, pIdx) => `<p class="${pIdx === 0 && !passageHtml ? 'first' : ''}">${escapeXml(p)}</p>`)
      .join('\n');

    const prayerHtml = curEntry.prayer ? `
    <div class="prayer-box">
      <p class="first" style="font-weight: bold; margin-bottom: 0.3em;">Modlitwa:</p>
      ${cleanParagraphsFromEnters(stripHtml(curEntry.prayer)).map(p => `<p>${escapeXml(p)}</p>`).join('\n')}
    </div>` : '';

    const chapterXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${chapTitle}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  ${epoka || czesc ? `<div class="epoka-header" style="font-weight: bold; color: #000000; text-transform: uppercase; margin-top: 1em; font-size: 11pt; text-align: left;">${escapeXml([epoka ? `EPOKA: ${epoka}` : '', czesc ? `CZĘŚĆ: ${czesc}` : ''].filter(Boolean).join(' • '))}</div>` : ''}
  <h1 style="font-size: 12pt; text-align: left; font-weight: bold; margin-top: 0.3em; margin-bottom: 0.8em;">${chapTitle}</h1>
  ${passageHtml}
  
  <div class="chapter-content">
    ${paragraphsHtml}
  </div>

  ${prayerHtml}
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
    <dc:publisher>${isNowyRhz ? 'Nowy RHZ365 – Dominik Kuta' : isRhz ? 'RHZ365 – Dominik Kuta' : (isBiblia ? 'Biblia365 – Dominik Kuta' : 'Widoki na Raj – Dominik Kuta')}</dc:publisher>
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
