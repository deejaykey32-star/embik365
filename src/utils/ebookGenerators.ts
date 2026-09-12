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
}

// Helper to sanitize text for XML
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

  const author = options.authorName || 'Dominik Kuta';
  const title = entry.title || meta.name;
  const subtitle = entry.subtitle || meta.subtitle;
  const lang = options.language || 'pl';

  // Margins for Print-On-Demand (POD)
  const gutterMargin = 20; // 0.8 in inside margin for book binding
  const outerMargin = 14;  // 0.55 in outside margin
  const topMargin = 20;    // top margin with running header
  const bottomMargin = 18; // bottom margin with page number

  let pageNumber = 1;

  const getLeftMargin = (pNum: number) => {
    // Odd pages: gutter on left
    // Even pages: gutter on right
    return pNum % 2 !== 0 ? gutterMargin : outerMargin;
  };

  const getContentWidth = () => pageWidth - gutterMargin - outerMargin;

  // PAGE 1: Strona Przedtytułowa (Half-title)
  doc.setFont('times', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(80, 80, 80);
  doc.text(meta.name.toUpperCase(), pageWidth / 2, 70, { align: 'center' });
  doc.setFontSize(10);
  doc.text('DROGOWSKAZY 365', pageWidth / 2, 80, { align: 'center' });

  // PAGE 2: Verso (pusta / dedykacja)
  doc.addPage();
  pageNumber++;
  doc.setFontSize(9);
  doc.setFont('times', 'italic');
  doc.setTextColor(100, 100, 100);
  const dedication = '„Twoje słowo jest lampą dla moich stóp i światłem na mojej ścieżce.” (Ps 119, 105)';
  doc.text(doc.splitTextToSize(dedication, 90), pageWidth / 2, 100, { align: 'center' });

  // PAGE 3: Strona Tytułowa (Title Page)
  doc.addPage();
  pageNumber++;
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(50, 50, 50);
  doc.text(author.toUpperCase(), pageWidth / 2, 50, { align: 'center' });

  doc.setFontSize(22);
  doc.setTextColor(20, 20, 20);
  const titleLines = doc.splitTextToSize(meta.name, getContentWidth());
  doc.text(titleLines, pageWidth / 2, 75, { align: 'center' });

  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  if (subtitle) {
    doc.text(doc.splitTextToSize(subtitle, getContentWidth()), pageWidth / 2, 95, { align: 'center' });
  }

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text(`Wpis Dnia Cyklu: ${entry.dateKey || entry.dayNumber}`, pageWidth / 2, 120, { align: 'center' });

  doc.setFontSize(9);
  doc.text('WYDANIE PRINT-ON-DEMAND (POD)', pageWidth / 2, pageHeight - 35, { align: 'center' });
  doc.text('Przygotowane dla Amazon KDP, Empik Selfpublishing & Ridero', pageWidth / 2, pageHeight - 28, { align: 'center' });

  // PAGE 4: Strona Redakcyjna / Copyright (Gotowa pod platformy 0 zł)
  doc.addPage();
  pageNumber++;
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  const leftX4 = getLeftMargin(pageNumber);

  const copyrightText = [
    `Copyright © ${new Date().getFullYear()} by ${author}`,
    'Wszelkie prawa zastrzeżone.',
    '',
    'Tytuł dzieła: Drogowskazy 365 – ' + meta.name,
    'Autor i opracowanie tekstu: ' + author,
    'Projekt typograficzny i skład POD: System Drogowskazy 365',
    '',
    'Wydanie I – Druk na Żądanie (Print-On-Demand)',
    'Dystrybucja i publikacja: Amazon KDP, Empik Selfpublishing, Legimi, Ridero.',
    'Format publikacji: Paperback 6x9" / A5 Trade Paperback zgodny ze standardem POD 0 zł na start.',
    '',
    'Numer ISBN (Paperback): [Numer przydzielany bezpłatnie w panelu Amazon KDP lub Empik]',
    'Numer ISBN (E-book ePUB): [Numer przydzielany bezpłatnie w panelu wydawcy]',
    '',
    'Żadna część tej publikacji nie może być powielana bez zgody autora,',
    'z wyjątkiem krótkich cytatów w recenzjach lub rozważaniach modlitewnych.'
  ];
  let curY = pageHeight - 110;
  copyrightText.forEach(line => {
    doc.text(line, leftX4, curY);
    curY += 4.2;
  });

  // PAGE 5: Spis Treści / Wstęp do Rozdziału
  doc.addPage();
  pageNumber++;
  const leftX5 = getLeftMargin(pageNumber);
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text(title, leftX5, 40);

  doc.setLineWidth(0.3);
  doc.setDrawColor(180, 180, 180);
  doc.line(leftX5, 44, leftX5 + getContentWidth(), 44);

  let currentY = 55;

  // If there is a passage or mystery
  if (entry.passage || entry.apocryphaPassage) {
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);
    const passText = `Fragment: ${entry.passage || ''} ${entry.apocryphaPassage ? `| Apokryf: ${entry.apocryphaPassage}` : ''}`;
    doc.text(doc.splitTextToSize(passText, getContentWidth()), leftX5, currentY);
    currentY += 10;
  }

  if (entry.mystery || entry.intention) {
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    if (entry.mystery) {
      doc.text(`Tajemnica: ${entry.mystery}`, leftX5, currentY);
      currentY += 6;
    }
    if (entry.intention) {
      doc.setFont('times', 'italic');
      doc.text(`Intencja: ${entry.intention}`, leftX5, currentY);
      currentY += 8;
    }
  }

  // Split content into paragraphs
  const paragraphs = (entry.content || '').split('\n').filter(p => p.trim().length > 0);

  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 30, 30);
  const lineHeight = 5.2;

  for (const para of paragraphs) {
    const lines = doc.splitTextToSize(para, getContentWidth());
    const neededHeight = lines.length * lineHeight + 4;

    if (currentY + neededHeight > pageHeight - bottomMargin) {
      // Add running header & footer to current page before switching
      addHeaderFooter(doc, pageNumber, meta.name, title, pageWidth, pageHeight, topMargin, bottomMargin);
      doc.addPage();
      pageNumber++;
      currentY = topMargin + 10;
    }

    const curLeft = getLeftMargin(pageNumber);
    // Indent first line of paragraph slightly for book layout
    doc.text(lines, curLeft, currentY);
    currentY += lines.length * lineHeight + 3.5;
  }

  // Modlitwa Serca w ozdobnej ramce (Prayer of Heart)
  if (entry.prayer && options.includePrayer !== false) {
    const prayerLines = doc.splitTextToSize(entry.prayer, getContentWidth() - 10);
    const prayerBoxHeight = prayerLines.length * 4.8 + 18;

    if (currentY + prayerBoxHeight > pageHeight - bottomMargin) {
      addHeaderFooter(doc, pageNumber, meta.name, title, pageWidth, pageHeight, topMargin, bottomMargin);
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

  // Author memoirs / notes
  if (entry.authorNotes) {
    const noteLines = doc.splitTextToSize(entry.authorNotes, getContentWidth());
    if (currentY + noteLines.length * 4.5 + 15 > pageHeight - bottomMargin) {
      addHeaderFooter(doc, pageNumber, meta.name, title, pageWidth, pageHeight, topMargin, bottomMargin);
      doc.addPage();
      pageNumber++;
      currentY = topMargin + 10;
    }
    const curLeft = getLeftMargin(pageNumber);
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('ZAPISKI I WSPOMNIENIA AUTORA:', curLeft, currentY + 4);
    doc.setFont('times', 'normal');
    doc.text(noteLines, curLeft, currentY + 10);
  }

  // Add header & footer to last page
  addHeaderFooter(doc, pageNumber, meta.name, title, pageWidth, pageHeight, topMargin, bottomMargin);

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
  const author = options.authorName || 'Dominik Kuta';
  const title = escapeXml(entry.title || meta.name);
  const subtitle = escapeXml(entry.subtitle || meta.subtitle);
  const content = escapeXml(entry.content || '');
  const prayer = escapeXml(entry.prayer || '');

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

  // Paragraph blocks for content
  const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
  const paragraphsXml = paragraphs.map(p => `
    <w:p>
      <w:pPr>
        <w:ind w:firstLine="360"/>
        <w:spacing w:line="300" w:after="140"/>
        <w:jc w:val="both"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="22"/></w:rPr>
        <w:t>${p}</w:t>
      </w:r>
    </w:p>`).join('');

  // 5. word/document.xml (Formatted for Amazon KDP & Empik Trade 6x9" or A5)
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <!-- TITLE PAGE -->
    <w:p>
      <w:pPr><w:spacing w:before="1800" w:after="300"/><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Georgia"/><w:sz w:val="28"/><w:color w:val="555555"/></w:rPr>
        <w:t>${escapeXml(author.toUpperCase())}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:before="400" w:after="400"/><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Georgia"/><w:b/><w:sz w:val="48"/><w:color w:val="111111"/></w:rPr>
        <w:t>${escapeXml(meta.name)}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="2000"/><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Georgia"/><w:i/><w:sz w:val="24"/><w:color w:val="666666"/></w:rPr>
        <w:t>${subtitle}</w:t>
      </w:r>
    </w:p>
    
    <!-- PAGE BREAK TO COPYRIGHT PAGE -->
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>

    <!-- COPYRIGHT PAGE (AMAZON KDP & EMPIK POD METRYCZKA) -->
    <w:p>
      <w:pPr><w:spacing w:before="3000" w:after="100"/><w:jc w:val="left"/></w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="18"/><w:color w:val="777777"/></w:rPr>
        <w:t>Copyright © ${new Date().getFullYear()} by ${escapeXml(author)}. Wszelkie prawa zastrzeżone.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="100"/><w:jc w:val="left"/></w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="18"/><w:color w:val="777777"/></w:rPr>
        <w:t>Drogowskazy 365 – Wydanie I Print-on-Demand (POD).</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="100"/><w:jc w:val="left"/></w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="18"/><w:color w:val="777777"/></w:rPr>
        <w:t>Przygotowane do bezpłatnej publikacji (0 zł opłat): Amazon KDP, Empik Selfpublishing, Legimi, Ridero.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="100"/><w:jc w:val="left"/></w:pPr>
      <w:r>
        <w:rPr><w:sz w:val="18"/><w:color w:val="777777"/></w:rPr>
        <w:t>ISBN (Paperback): [Przydzielany bezpłatnie w panelu wydawcy]</w:t>
      </w:r>
    </w:p>

    <!-- PAGE BREAK TO CONTENT -->
    <w:p><w:r><w:br w:type="page"/></w:r></w:p>

    <!-- CHAPTER TITLE -->
    <w:p>
      <w:pPr><w:spacing w:before="400" w:after="400"/><w:jc w:val="left"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="34"/><w:color w:val="995511"/></w:rPr>
        <w:t>${title}</w:t>
      </w:r>
    </w:p>

    ${entry.mystery ? `
    <w:p>
      <w:pPr><w:spacing w:after="200"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="444444"/></w:rPr><w:t>Tajemnica: ${escapeXml(entry.mystery)}</w:t></w:r>
    </w:p>` : ''}

    ${entry.intention ? `
    <w:p>
      <w:pPr><w:spacing w:after="200"/></w:pPr>
      <w:r><w:rPr><w:i/><w:sz w:val="20"/><w:color w:val="666666"/></w:rPr><w:t>Intencja: ${escapeXml(entry.intention)}</w:t></w:r>
    </w:p>` : ''}

    <!-- MAIN BODY TEXT -->
    ${paragraphsXml}

    ${prayer ? `
    <!-- PRAYER BLOCK -->
    <w:p>
      <w:pPr><w:spacing w:before="400" w:after="100"/><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="20"/><w:color w:val="995511"/></w:rPr><w:t>--- MODLITWA SERCA ---</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:spacing w:after="300"/><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:i/><w:sz w:val="22"/><w:color w:val="333333"/></w:rPr><w:t>${prayer}</w:t></w:r>
    </w:p>` : ''}

    <!-- 6x9 inch trade paperback page settings with POD mirror margins -->
    <w:sectPr>
      <w:pgSz w:w="8640" w:h="12960"/> <!-- 6x9 inches in DXA (1/20th pt) -->
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
  const author = options.authorName || 'Dominik Kuta';
  const title = escapeXml(entry.title || meta.name);
  const subtitle = escapeXml(entry.subtitle || meta.subtitle);
  const content = escapeXml(entry.content || '');
  const prayer = escapeXml(entry.prayer || '');
  const bookId = `urn:uuid:drogowskazy-${meta.id}-${entry.dateKey || '365'}`;

  // 1. mimetype (MUST be first file, uncompressed, strictly 'application/epub+zip')
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
  font-size: 1.8em;
  color: #8c5310;
  text-align: center;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}
h2 {
  font-size: 1.2em;
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

  // 4. OEBPS/content.opf
  zip.file('OEBPS/content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${title}</dc:title>
    <dc:creator>${author}</dc:creator>
    <dc:identifier id="BookID">${bookId}</dc:identifier>
    <dc:language>${options.language || 'pl'}</dc:language>
    <dc:publisher>Drogowskazy 365 – Dominik Kuta</dc:publisher>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    <item id="style" href="style.css" media-type="text/css"/>
    <item id="titlepage" href="titlepage.xhtml" media-type="application/xhtml+xml"/>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="titlepage"/>
    <itemref idref="chapter1"/>
  </spine>
</package>`);

  // 5. OEBPS/toc.ncx (for older Kindle and ePUB readers)
  zip.file('OEBPS/toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookId}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${title}</text></docTitle>
  <navMap>
    <navPoint id="navpoint-1" playOrder="1">
      <navLabel><text>Strona tytułowa</text></navLabel>
      <content src="titlepage.xhtml"/>
    </navPoint>
    <navPoint id="navpoint-2" playOrder="2">
      <navLabel><text>${title}</text></navLabel>
      <content src="chapter1.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`);

  // 6. OEBPS/nav.xhtml (EPUB 3 Navigation Document)
  zip.file('OEBPS/nav.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Spis treści</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Spis treści</h1>
    <ol>
      <li><a href="titlepage.xhtml">Strona Tytułowa</a></li>
      <li><a href="chapter1.xhtml">${title}</a></li>
    </ol>
  </nav>
</body>
</html>`);

  // 7. OEBPS/titlepage.xhtml
  zip.file('OEBPS/titlepage.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${title}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <div style="text-align: center; margin-top: 25%;">
    <p style="text-indent: 0; font-size: 1.1em; color: #666;">${escapeXml(author)}</p>
    <h1 style="font-size: 2.2em; margin: 0.5em 0;">${escapeXml(meta.name)}</h1>
    <h2>${subtitle}</h2>
    <p style="text-indent: 0; font-size: 0.9em; color: #888;">Dzień Cyklu: ${entry.dateKey || entry.dayNumber}</p>
  </div>
  <div class="copyright">
    <p style="text-indent: 0;">Copyright © ${new Date().getFullYear()} by ${escapeXml(author)}.</p>
    <p style="text-indent: 0;">Przygotowane do publikacji: Legimi, Empik Go, Apple Books, Amazon KDP (0 zł na start).</p>
  </div>
</body>
</html>`);

  // 8. OEBPS/chapter1.xhtml
  const paragraphsHtml = content
    .split('\n')
    .filter(p => p.trim().length > 0)
    .map((p, idx) => `<p class="${idx === 0 ? 'first' : ''}">${p}</p>`)
    .join('\n');

  zip.file('OEBPS/chapter1.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${title}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h1>${title}</h1>
  ${entry.mystery ? `<h2>Tajemnica: ${escapeXml(entry.mystery)}</h2>` : ''}
  ${entry.intention ? `<p style="text-indent: 0; text-align: center; font-style: italic; color: #666;">Intencja: ${escapeXml(entry.intention)}</p>` : ''}
  
  <div class="chapter-content">
    ${paragraphsHtml}
  </div>

  ${prayer ? `
  <div class="prayer-box">
    <div class="prayer-title">Modlitwa Serca</div>
    <p style="text-indent: 0;">${prayer}</p>
  </div>` : ''}
</body>
</html>`);

  return await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
}
