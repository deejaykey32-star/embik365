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

async function testTitleRefinement() {
  const filePath = path.join(process.cwd(), 'public', 'uploads', '1789279047079-18984983-_WnR365_poprawiany-Calosc_Ksiega_A5_-_ca__o_____-_12.09.2026.docx');
  const buffer = fs.readFileSync(filePath);
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

  const dayHeaderRegex = /^(?:#+\s*)?(?:DZIEŃ|DAY|ROZDZIAŁ|ROZDZIAL)\s*(\d{1,3})/i;

  const parsed = {};
  let currentDayNum = null;
  let currentHeaderExtra = '';
  let currentLines = [];

  const saveCurrentDay = () => {
    if (currentDayNum !== null && currentDayNum >= 1 && currentDayNum <= 366) {
      const cycleDate = getCycleDateByDayNumber(currentDayNum);
      const key = `wnr365-${cycleDate.dateKey}`;

      let subtitle = '';
      const bodyLines = [];
      for (const line of currentLines) {
        if (line.startsWith('Widoki na Raj') || line.startsWith('WnR365 — Widoki na Raj')) {
          // skip header repetition lines
          continue;
        }
        bodyLines.push(line);
      }

      // Check for title in body lines
      let extractedTitle = '';
      if (bodyLines.length > 0) {
        const first = bodyLines[0];
        // e.g. "[28.05.2012] Powtórne Narodziny"
        if (/^\[\d{2}\.\d{2}\.\d{4}\]/i.test(first)) {
          extractedTitle = first.replace(/^\[\d{2}\.\d{2}\.\d{4}\]\s*/i, '').trim();
        }
      }

      if (!extractedTitle && currentHeaderExtra && !/^\d{1,2}\s+[a-z]+/i.test(currentHeaderExtra)) {
        extractedTitle = currentHeaderExtra;
      }

      const displayTitle = extractedTitle 
        ? `Dzień ${currentDayNum} (${cycleDate.displayDate}): ${extractedTitle}`
        : `Dzień ${currentDayNum} – ${cycleDate.displayDate}`;

      parsed[key] = {
        dayNumber: currentDayNum,
        dateKey: cycleDate.dateKey,
        sectionId: 'wnr365',
        title: displayTitle,
        content: bodyLines.join('\n\n')
      };
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const match = line.match(dayHeaderRegex);

    if (match) {
      saveCurrentDay();
      currentDayNum = parseInt(match[1], 10);
      currentHeaderExtra = line.replace(dayHeaderRegex, '').replace(/^[\s\-—–:]+/, '').trim();
      currentLines = [];
    } else if (currentDayNum !== null) {
      currentLines.push(line);
    }
  }
  saveCurrentDay();

  for (let d = 1; d <= 5; d++) {
    const cd = getCycleDateByDayNumber(d);
    const item = parsed[`wnr365-${cd.dateKey}`];
    console.log(`\n=== DAY ${d} (${cd.dateKey}) ===`);
    console.log('Title:', item?.title);
    console.log('Content preview:', item?.content?.substring(0, 150));
  }

  return parsed;
}

testTitleRefinement().catch(console.error);
