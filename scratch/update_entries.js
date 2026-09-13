import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

const POLISH_MONTHS = [
  { id: 1, nameNominative: 'Styczeń', nameGenitive: 'stycznia', days: 31 },
  { id: 2, nameNominative: 'Luty', nameGenitive: 'lutego', days: 29 },
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

function getCycleDateByDayNumber(dayNumber) {
  if (dayNumber >= 1 && dayNumber <= 7) {
    const day = 24 + dayNumber;
    return { dayNumber, dateKey: `12-${day}`, displayDate: `${day} grudnia` };
  }
  let currentDay = 8;
  for (let m = 1; m <= 12; m++) {
    const mo = POLISH_MONTHS.find(item => item.id === m);
    const maxDays = (m === 12) ? 24 : mo.days;
    for (let d = 1; d <= maxDays; d++) {
      if (currentDay === dayNumber) {
        const key = `${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        return { dayNumber, dateKey: key, displayDate: `${d} ${mo.nameGenitive}` };
      }
      currentDay++;
    }
  }
  return { dayNumber, dateKey: '12-25', displayDate: '25 grudnia' };
}

async function updateAllEntriesFromDocx() {
  const docxPath = path.join(process.cwd(), 'public', 'uploads', '1789279047079-18984983-_WnR365_poprawiany-Calosc_Ksiega_A5_-_ca__o_____-_12.09.2026.docx');
  const buffer = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(buffer);
  const docXmlStr = await zip.file('word/document.xml')?.async('text');
  
  const paragraphs = docXmlStr.match(/<w:p [^>]*>.*?<\/w:p>|<w:p>.*?<\/w:p>/g) || [];
  
  const rawLines = [];
  for (const p of paragraphs) {
    const textMatches = p.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    if (textMatches) {
      const lineText = textMatches.map(m => m.replace(/<[^>]+>/g, '')).join('').trim();
      if (lineText) rawLines.push(lineText);
    }
  }

  const dayHeaderRegex = /^(?:#+\s*)?(?:DZIEŃ|DAY|DZIEN|ROZDZIAŁ|ROZDZIAL|WPIS)\s*(\d{1,3})/i;

  const parsedEntries = {};
  let currentDayNum = null;
  let currentHeaderExtra = '';
  let currentLines = [];

  const finalizeDay = () => {
    if (currentDayNum !== null && currentDayNum >= 1 && currentDayNum <= 366) {
      const cycleDate = getCycleDateByDayNumber(currentDayNum);
      const dateKey = cycleDate.dateKey;
      const entryKey = `wnr365-${dateKey}`;

      let mystery;
      let intention;
      let prayer;
      const bodyLines = [];

      for (const line of currentLines) {
        if (line.startsWith('Widoki na Raj') || line.startsWith('WnR365 — Widoki na Raj')) {
          continue;
        }
        if (line.toLowerCase().startsWith('tajemnica:')) {
          mystery = line.replace(/^tajemnica:?\s*/i, '').trim();
        } else if (line.toLowerCase().startsWith('intencja:')) {
          intention = line.replace(/^intencja:?\s*/i, '').trim();
        } else if (line.toLowerCase().startsWith('modlitwa:')) {
          prayer = line.replace(/^modlitwa:?\s*/i, '').trim();
        } else {
          bodyLines.push(line);
        }
      }

      let extractedTitle = '';
      if (bodyLines.length > 0) {
        const firstLine = bodyLines[0];
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
        id: entryKey,
        sectionId: 'wnr365',
        dateKey,
        dayNumber: currentDayNum,
        title: displayTitle,
        content: bodyLines.join('\n\n') || extractedTitle || `Rozważanie na dzień ${currentDayNum}`,
        mystery,
        intention,
        prayer,
        updatedAt: new Date().toISOString()
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

  // Read existing entries.json files
  const publicPath = path.join(process.cwd(), 'public', 'data', 'entries.json');
  const rootPath = path.join(process.cwd(), 'data', 'entries.json');
  const distPath = path.join(process.cwd(), 'dist', 'data', 'entries.json');

  let dbData = { entries: {}, uploads: [] };
  if (fs.existsSync(publicPath)) {
    dbData = JSON.parse(fs.readFileSync(publicPath, 'utf-8'));
  }

  // Merge parsed entries into entries object
  let updatedCount = 0;
  for (const key of Object.keys(parsedEntries)) {
    dbData.entries[key] = {
      ...(dbData.entries[key] || {}),
      ...parsedEntries[key]
    };
    updatedCount++;
  }

  const jsonString = JSON.stringify(dbData, null, 2);

  [publicPath, rootPath, distPath].forEach(filePath => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, jsonString, 'utf-8');
  });

  console.log(`Pomyślnie zaktualizowano ${updatedCount} wpisów we wszystkich plikach entries.json!`);
  console.log('Sprawdzenie wpisu Dzień 2 (12-26):', dbData.entries['wnr365-12-26']);
}

updateAllEntriesFromDocx().catch(console.error);
