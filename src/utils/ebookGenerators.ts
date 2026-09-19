import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { SectionEntry, SectionMeta } from '../types';

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'epub';
  size?: '6x9' | 'a5';
  language?: string;
  languageName?: string;
  authorName?: string;
  includeCopyright?: boolean;
  includePrayer?: boolean;
  exportScope?: 'single' | 'year';
  selectedYear?: 1 | 2 | 3 | 4;
  allYearEntries?: SectionEntry[];
}

// Helper to sanitize text for PDF standard fonts (Times / Helvetica)
// Translates Polish diacritics and special unicode quotes/dashes into clean Latin text
// preventing WinAnsi encoding corruptions like [, B, D, | in jsPDF.
export function sanitizeTextForPdf(text: string): string {
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

// Helper to sanitize text for XML (DOCX & ePUB)
function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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

// -------------------------------------------------------------
// 1. GENERATOR PDF DLA DRUKU NA ŻĄDANIE (POD) - AMAZON KDP & EMPIK
// -------------------------------------------------------------
export async function generatePodPdf(
  entry: SectionEntry,
  meta: SectionMeta,
  options: ExportOptions
): Promise<Blob> {
  const isA5 = options.size === 'a5';
  // 6x9 inches in mm: 152.4 x 228.6 | A5 in mm: 148 x 210
  const pageWidth = isA5 ? 148 : 152.4;
  const pageHeight = isA5 ? 210 : 228.6;

  const doc = new jsPDF({
    unit: 'mm',
    format: [pageWidth, pageHeight],
    orientation: 'portrait'
  });

  const author = sanitizeTextForPdf(options.authorName || 'Dominik Kuta');
  const selectedYearText = options.selectedYear ? ` - Rok ${options.selectedYear}` : '';
  const bookTitle = sanitizeTextForPdf((meta.name || 'Biblia365') + selectedYearText);
  const bookSubtitle = sanitizeTextForPdf(meta.subtitle || 'Cykl Czytan Biblia365');

  // Margins for Print-On-Demand (POD)
  const gutterMargin = 20; // 0.8 in inside margin for book binding
  const outerMargin = 14;  // 0.55 in outside margin
  const topMargin = 20;    // top margin with running header
  const bottomMargin = 18; // bottom margin with page number

  let pageNumber = 1;

  const getLeftMargin = (pNum: number) => {
    return pNum % 2 !== 0 ? gutterMargin : outerMargin;
  };
  const getContentWidth = () => pageWidth - gutterMargin - outerMargin;

  // Render Front Matter (Half-title, Title Page, Copyright)
  // PAGE 1: Strona Przedtytułowa
  doc.setFont('times', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(80, 80, 80);
  doc.text(bookTitle.toUpperCase(), pageWidth / 2, 70, { align: 'center' });
  doc.setFontSize(10);
  doc.text('BIBLIA365 * DROGA365', pageWidth / 2, 80, { align: 'center' });

  // PAGE 2: Verso (dedykacja)
  doc.addPage();
  pageNumber++;
  doc.setFontSize(9);
  doc.setFont('times', 'italic');
  doc.setTextColor(100, 100, 100);
  const dedication = sanitizeTextForPdf('„Twoje slowo jest lampa dla moich stop i swiatlem na mojej sciezce.” (Ps 119, 105)');
  doc.text(doc.splitTextToSize(dedication, 90), pageWidth / 2, 100, { align: 'center' });

  // PAGE 3: Strona Tytułowa
  doc.addPage();
  pageNumber++;
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(50, 50, 50);
  doc.text(author.toUpperCase(), pageWidth / 2, 50, { align: 'center' });

  doc.setFontSize(22);
  doc.setTextColor(20, 20, 20);
  const titleLines = doc.splitTextToSize(bookTitle, getContentWidth());
  doc.text(titleLines, pageWidth / 2, 75, { align: 'center' });

  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  if (bookSubtitle) {
    doc.text(doc.splitTextToSize(bookSubtitle, getContentWidth()), pageWidth / 2, 95, { align: 'center' });
  }

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text(`Wydanie Roczne: Rok ${options.selectedYear || 1} * 365 Czytan`, pageWidth / 2, 120, { align: 'center' });

  doc.setFontSize(9);
  doc.text('WYDANIE PRINT-ON-DEMAND (POD)', pageWidth / 2, pageHeight - 35, { align: 'center' });
  doc.text('Przygotowane dla Amazon KDP, Empik Selfpublishing & Ridero', pageWidth / 2, pageHeight - 28, { align: 'center' });

  // PAGE 4: Strona Redakcyjna / Copyright
  doc.addPage();
  pageNumber++;
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  const leftX4 = getLeftMargin(pageNumber);

  const copyrightText = [
    `Copyright (c) ${new Date().getFullYear()} by ${author}`,
    'Wszelkie prawa zastrzezone.',
    '',
    'Tytul dziela: ' + bookTitle,
    'Autor i opracowanie tekstu: ' + author,
    'Projekt typograficzny i sklad POD: System Biblia365 / Droga365',
    '',
    'Wydanie I - Druk na Zadaie (Print-On-Demand)',
    'Dystrybucja i publikacja: Amazon KDP, Empik Selfpublishing, Legimi, Ridero.',
    'Format publikacji: Paperback 6x9" / A5 Trade Paperback zgodny ze standardem POD.',
    '',
    'Numer ISBN (Paperback): [Przydzielany bezplatnie w panelu Amazon KDP lub Empik]',
    'Numer ISBN (E-book ePUB): [Przydzielany bezplatnie w panelu wydawcy]',
    '',
    'Zadna czesc tej publikacji nie moze byc powielana bez zgody autora,',
    'z wyjatkiem krotkich cytatow w recenzjach lub rozważaniach modlitewnych.'
  ];
  let curY = pageHeight - 110;
  copyrightText.forEach(line => {
    doc.text(line, leftX4, curY);
    curY += 4.2;
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

    const leftX = getLeftMargin(pageNumber);
    const chapterTitle = sanitizeTextForPdf(currentEntry.title || `Dzien ${idx + 1}`);

    doc.setFont('times', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(20, 20, 20);
    doc.text(chapterTitle, leftX, 38);

    doc.setLineWidth(0.3);
    doc.setDrawColor(180, 180, 180);
    doc.line(leftX, 42, leftX + getContentWidth(), 42);

    let currentY = 52;

    if (currentEntry.passage || currentEntry.apocryphaPassage) {
      doc.setFont('times', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(70, 70, 70);
      const passText = sanitizeTextForPdf(`Fragment: ${currentEntry.passage || ''} ${currentEntry.apocryphaPassage ? `| Apokryf: ${currentEntry.apocryphaPassage}` : ''}`);
      doc.text(doc.splitTextToSize(passText, getContentWidth()), leftX, currentY);
      currentY += 10;
    }

    if (currentEntry.mystery || currentEntry.intention) {
      doc.setFont('times', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      if (currentEntry.mystery) {
        doc.text(sanitizeTextForPdf(`Tajemnica: ${currentEntry.mystery}`), leftX, currentY);
        currentY += 6;
      }
      if (currentEntry.intention) {
        doc.setFont('times', 'italic');
        doc.text(sanitizeTextForPdf(`Intencja: ${currentEntry.intention}`), leftX, currentY);
        currentY += 8;
      }
    }

    // Paragraphs
    const rawParagraphs = (currentEntry.content || '').split('\n').filter(p => p.trim().length > 0);

    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    const lineHeight = 5.0;

    for (const rawPara of rawParagraphs) {
      const sanitizedPara = sanitizeTextForPdf(rawPara);
      const lines = doc.splitTextToSize(sanitizedPara, getContentWidth());
      const neededHeight = lines.length * lineHeight + 4;

      if (currentY + neededHeight > pageHeight - bottomMargin) {
        addHeaderFooter(doc, pageNumber, bookTitle, chapterTitle, pageWidth, pageHeight, topMargin, bottomMargin);
        doc.addPage();
        pageNumber++;
        currentY = topMargin + 10;
      }

      const curLeft = getLeftMargin(pageNumber);
      doc.text(lines, curLeft, currentY);
      currentY += lines.length * lineHeight + 3.5;
    }

    // Prayer box
    if (currentEntry.prayer && options.includePrayer !== false) {
      const sanitizedPrayer = sanitizeTextForPdf(currentEntry.prayer);
      const prayerLines = doc.splitTextToSize(sanitizedPrayer, getContentWidth() - 10);
      const prayerBoxHeight = prayerLines.length * 4.8 + 18;

      if (currentY + prayerBoxHeight > pageHeight - bottomMargin) {
        addHeaderFooter(doc, pageNumber, bookTitle, chapterTitle, pageWidth, pageHeight, topMargin, bottomMargin);
        doc.addPage();
        pageNumber++;
        currentY = topMargin + 10;
      }

      const curLeft = getLeftMargin(pageNumber);
      doc.setDrawColor(190, 160, 110);
      doc.setLineWidth(0.4);
      doc.setFillColor(252, 250, 245);
      doc.roundedRect(curLeft, currentY, getContentWidth(), prayerBoxHeight, 2, 2, 'FD');

      doc.setFont('times', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(140, 90, 30);
      doc.text('MODLITWA SERCA', curLeft + getContentWidth() / 2, currentY + 7, { align: 'center' });

      doc.setFont('times', 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(40, 40, 40);
      doc.text(prayerLines, curLeft + 5, currentY + 14);

      currentY += prayerBoxHeight + 8;
    }

    addHeaderFooter(doc, pageNumber, bookTitle, chapterTitle, pageWidth, pageHeight, topMargin, bottomMargin);
  }

  return doc.output('blob');
}

// Running headers and page numbers
function addHeaderFooter(
  doc: jsPDF,
  pageNum: number,
  bookTitle: string,
  chapterTitle: string,
  width: number,
  height: number,
  topM: number,
  bottomM: number
) {
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);

  // Footer: Page Number centered
  doc.text(String(pageNum), width / 2, height - bottomM + 8, { align: 'center' });

  // Running header: only for page 5 and above
  if (pageNum >= 5) {
    const isOdd = pageNum % 2 !== 0;
    const headerText = isOdd ? chapterTitle : bookTitle;
    doc.text(headerText.toUpperCase().substring(0, 45), width / 2, topM - 6, { align: 'center' });
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(18, topM - 3, width - 18, topM - 3);
  }
}

// -------------------------------------------------------------
// 2. GENERATOR MICROSOFT WORD (DOCX) - KDP & EMPIK POD FORMAT
// -------------------------------------------------------------
export async function generatePodDocx(
  entry: SectionEntry,
  meta: SectionMeta,
  options: ExportOptions
): Promise<Blob> {
  const zip = new JSZip();
  const author = escapeXml(options.authorName || 'Dominik Kuta');
  const selectedYearText = options.selectedYear ? ` – Rok ${options.selectedYear}` : '';
  const bookTitle = escapeXml((meta.name || 'Biblia365') + selectedYearText);
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

  // 4. word/styles.xml
  zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Georgia" w:hAnsi="Georgia" w:cs="Georgia"/>
        <w:sz w:val="22"/>
        <w:lang w:val="pl-PL"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:line="276" w:lineRule="auto" w:after="160"/>
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
    const chapterTitle = escapeXml(curEntry.title || `Dzień ${idx + 1}`);
    const paragraphs = (curEntry.content || '').split('\n').filter(p => p.trim().length > 0);

    const paragraphsXml = paragraphs.map(p => `
      <w:p>
        <w:pPr>
          <w:ind w:firstLine="360"/>
          <w:spacing w:line="300" w:after="140"/>
          <w:jc w:val="both"/>
        </w:pPr>
        <w:r>
          <w:rPr><w:sz w:val="22"/></w:rPr>
          <w:t>${escapeXml(p)}</w:t>
        </w:r>
      </w:p>`).join('');

    const prayerXml = curEntry.prayer ? `
      <w:p>
        <w:pPr><w:spacing w:before="400" w:after="100"/><w:jc w:val="center"/></w:pPr>
        <w:r><w:rPr><w:b/><w:sz w:val="20"/><w:color w:val="995511"/></w:rPr><w:t>--- MODLITWA SERCA ---</w:t></w:r>
      </w:p>
      <w:p>
        <w:pPr><w:spacing w:after="300"/><w:jc w:val="center"/></w:pPr>
        <w:r><w:rPr><w:i/><w:sz w:val="22"/><w:color w:val="333333"/></w:rPr><w:t>${escapeXml(curEntry.prayer)}</w:t></w:r>
      </w:p>` : '';

    chaptersXml += `
      ${idx > 0 ? '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' : ''}
      <w:p>
        <w:pPr><w:spacing w:before="400" w:after="300"/><w:jc w:val="left"/></w:pPr>
        <w:r>
          <w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="995511"/></w:rPr>
          <w:t>${chapterTitle}</w:t>
        </w:r>
      </w:p>
      ${curEntry.passage ? `
      <w:p>
        <w:pPr><w:spacing w:after="200"/></w:pPr>
        <w:r><w:rPr><w:i/><w:sz w:val="20"/><w:color w:val="555555"/></w:rPr><w:t>Fragment: ${escapeXml(curEntry.passage)}</w:t></w:r>
      </w:p>` : ''}
      ${paragraphsXml}
      ${prayerXml}
    `;
  }

  // 5. word/document.xml
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <!-- TITLE PAGE -->
    <w:p>
      <w:pPr><w:spacing w:before="1800" w:after="300"/><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Georgia"/><w:sz w:val="28"/><w:color w:val="555555"/></w:rPr>
        <w:t>${author.toUpperCase()}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="400" w:after="400"/><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Georgia"/><w:b/><w:sz w:val="44"/><w:color w:val="111111"/></w:rPr>
        <w:t>${bookTitle}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="2000"/><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Georgia"/><w:i/><w:sz w:val="24"/><w:color w:val="666666"/></w:rPr>
        <w:t>${bookSubtitle}</w:t>
      </w:r>
    </w:p>
    
    <!-- PAGE BREAK TO COPYRIGHT PAGE -->
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>

    <!-- COPYRIGHT PAGE -->
    <w:p>
      <w:pPr><w:spacing w:before="3000" w:after="100"/><w:jc w:val="left"/></w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="18"/><w:color w:val="777777"/></w:rPr>
        <w:t>Copyright © ${new Date().getFullYear()} by ${author}. Wszelkie prawa zastrzeżone.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="100"/><w:jc w:val="left"/></w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="18"/><w:color w:val="777777"/></w:rPr>
        <w:t>${bookTitle} – Wydanie Roczne POD & E-book.</w:t>
      </w:r>
    </w:p>

    <!-- PAGE BREAK TO CHAPTERS -->
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>

    ${chaptersXml}

    <!-- 6x9 inch trade paperback page settings with POD mirror margins -->
    <w:sectPr>
      <w:pgSz w:w="8640" w:h="12960"/>
      <w:pgMar w:top="1152" w:bottom="1152" w:left="1440" w:right="1008" w:gutter="288" w:header="720" w:footer="720"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file('word/document.xml', documentXml);

  return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

// -------------------------------------------------------------
// 3. GENERATOR STANDARDOWEGO EPUB 3 - LEGIMI, EMPIK GO, KINDLE
// -------------------------------------------------------------
export async function generateEpub(
  entry: SectionEntry,
  meta: SectionMeta,
  options: ExportOptions
): Promise<Blob> {
  const zip = new JSZip();
  const author = escapeXml(options.authorName || 'Dominik Kuta');
  const selectedYearText = options.selectedYear ? ` – Rok ${options.selectedYear}` : '';
  const bookTitle = escapeXml((meta.name || 'Biblia365') + selectedYearText);
  const bookSubtitle = escapeXml(meta.subtitle || 'Kanoniczny Cykl Czytań Biblia365');
  const bookId = `urn:uuid:biblia365-year-${options.selectedYear || 1}-${Date.now()}`;

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

  // 3. OEBPS/style.css
  zip.file('OEBPS/style.css', `
body {
  font-family: Georgia, 'Times New Roman', serif;
  line-height: 1.6;
  margin: 5%;
  color: #1a1a1a;
}
h1 {
  font-size: 1.6em;
  color: #8c5310;
  text-align: center;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}
h2 {
  font-size: 1.1em;
  color: #555555;
  text-align: center;
  font-weight: normal;
  font-style: italic;
  margin-bottom: 1.5em;
}
p {
  text-indent: 1.5em;
  margin-top: 0;
  margin-bottom: 0.4em;
  text-align: justify;
}
p.first {
  text-indent: 0;
}
.prayer-box {
  border: 1px solid #d4af37;
  background-color: #fdfbf7;
  padding: 1.2em;
  margin: 2em 0;
  border-radius: 4px;
  text-align: center;
  font-style: italic;
}
.prayer-title {
  font-weight: bold;
  font-style: normal;
  color: #8c5310;
  margin-bottom: 0.6em;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.copyright {
  font-size: 0.8em;
  color: #666;
  margin-top: 3em;
  border-top: 1px solid #eee;
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
    const chapTitle = escapeXml(curEntry.title || `Dzień ${idx + 1}`);

    manifestItems.push(`<item id="${chapId}" href="${chapFileName}" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="${chapId}"/>`);

    ncxNavPoints.push(`
    <navPoint id="navpoint-${idx + 2}" playOrder="${idx + 2}">
      <navLabel><text>${chapTitle}</text></navLabel>
      <content src="${chapFileName}"/>
    </navPoint>`);

    htmlNavItems.push(`<li><a href="${chapFileName}">${chapTitle}</a></li>`);

    const paragraphsHtml = (curEntry.content || '')
      .split('\n')
      .filter(p => p.trim().length > 0)
      .map((p, pIdx) => `<p class="${pIdx === 0 ? 'first' : ''}">${escapeXml(p)}</p>`)
      .join('\n');

    const prayerHtml = curEntry.prayer ? `
    <div class="prayer-box">
      <div class="prayer-title">Modlitwa Serca</div>
      <p style="text-indent: 0;">${escapeXml(curEntry.prayer)}</p>
    </div>` : '';

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
    <p style="text-indent: 0; font-size: 1.1em; color: #666;">${author}</p>
    <h1 style="font-size: 2.2em; margin: 0.5em 0;">${bookTitle}</h1>
    <h2>${bookSubtitle}</h2>
    <p style="text-indent: 0; font-size: 0.9em; color: #888;">Liczba Rozdziałów / Czytań: ${entriesToProcess.length}</p>
  </div>
  <div class="copyright">
    <p style="text-indent: 0;">Copyright © ${new Date().getFullYear()} by ${author}.</p>
    <p style="text-indent: 0;">Przygotowane do publikacji: Legimi, Empik Go, Apple Books, Amazon KDP (0 zł na start).</p>
  </div>
</body>
</html>`);

  return await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
}
