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

function getAllCycleDates() {
  const dates = [];
  let dayNumber = 1;

  // Day 1 to 7: Dec 25 to Dec 31
  for (let d = 25; d <= 31; d++) {
    const dateKey = `12-${d}`;
    dates.push({ dayNumber, dateKey, displayDate: `${d} grudnia`, season: 'Okres Narodzenia Pańskiego' });
    dayNumber++;
  }

  // Jan 1 to Dec 24
  for (let m = 1; m <= 12; m++) {
    const mo = POLISH_MONTHS.find(item => item.id === m);
    const maxDays = (m === 12) ? 24 : mo.days;
    for (let d = 1; d <= maxDays; d++) {
      const dateKey = `${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      let season = 'Okres Zwykły';
      if (m === 1 || (m === 2 && d <= 2)) season = 'Okres Narodzenia Pańskiego';
      else if ((m === 2 && d > 2) || m === 3 || (m === 4 && d <= 15)) season = 'Wielki Post & Triduum Paschalne';
      else if ((m === 4 && d > 15) || m === 5) season = 'Okres Wielkanocny';
      else if (m === 11 || (m === 12 && d <= 24)) season = 'Okres Adwentu';

      dates.push({ dayNumber, dateKey, displayDate: `${d} ${mo.nameGenitive}`, season });
      dayNumber++;
    }
  }

  return dates;
}

const MYSTERIES = [
  'Tajemnica I Radosna: Zwiastowanie Najświętszej Maryi Pannie',
  'Tajemnica II Radosna: Nawiedzenie świętej Elżbiety',
  'Tajemnica III Radosna: Narodzenie Pana Jezusa w Betlejem',
  'Tajemnica IV Radosna: Ofiarowanie Pana Jezusa w Świątyni',
  'Tajemnica V Radosna: Odnalezienie Pana Jezusa w Świątyni',
  'Tajemnica I Światła: Chrzest Pana Jezusa w Jordanie',
  'Tajemnica II Światła: Objawienie się Pana Jezusa na weselu w Kanie',
  'Tajemnica III Światła: Głoszenie Królestwa Bożego i wzywanie do nawrócenia',
  'Tajemnica IV Światła: Przemienienie Pana Jezusa na górze Tabor',
  'Tajemnica V Światła: Ustanowienie Najświętszej Eucharystii',
  'Tajemnica I Bolesna: Modlitwa Pana Jezusa w Ogrójcu',
  'Tajemnica II Bolesna: Biczowanie Pana Jezusa',
  'Tajemnica III Bolesna: Cierniem ukoronowanie Pana Jezusa',
  'Tajemnica IV Bolesna: Dźwiganie krzyża na Kalwarię',
  'Tajemnica V Bolesna: Śmierć Pana Jezusa na krzyżu',
  'Tajemnica I Chwalebna: Zmartwychwstanie Pana Jezusa',
  'Tajemnica II Chwalebna: Wniebowstąpienie Pana Jezusa',
  'Tajemnica III Chwalebna: Zesłanie Ducha Świętego',
  'Tajemnica IV Chwalebna: Wniebowzięcie Najświętszej Maryi Panny',
  'Tajemnica V Chwalebna: Ukoronowanie Maryi na Królową Nieba i Ziemi'
];

function populateAllSections() {
  const entriesJsonPath = path.join(process.cwd(), 'public', 'data', 'entries.json');
  let rawData = {};
  if (fs.existsSync(entriesJsonPath)) {
    rawData = JSON.parse(fs.readFileSync(entriesJsonPath, 'utf8'));
  }
  const existingEntries = rawData.entries || {};
  const allDates = getAllCycleDates();

  // 1. Check wnr365 day 365 (12-24)
  if (!existingEntries['wnr365-12-24']) {
    const content365 = `[24.12.2026] Wigilia Bożego Narodzenia – Zwieńczenie Cyklu Droga365 i Oczekiwanie na Światłość\n\nDziś dochodzimy do zwieńczenia 365 dni naszej duchowej pielgrzymki. Wigilijny wieczór to czas, gdy stół staje się ołtarzem domowego Kościoła, a puste miejsce przy nim przypomina, że w chrześcijaństwie nikt nie jest obcy.\n\nPrzez cały rok uczyliśmy się dostrzegać "Widoki na Raj" w szarej codzienności. Dziś, gdy na niebie błyszczy pierwsza gwiazda, chwalmy Boga za każdy dar, każdą próbowaną łaskę i każdą modlitwę. Słowo staje się Ciałem, aby zamieszkać pośród nas na zawsze.\n\nBądźmy świadkami nadziei i miłości. Niech pokój Betlejemskiej Nocy zagości we wszystkich sercach i domach. Amen.`;
    existingEntries['wnr365-12-24'] = {
      id: 'wnr365-12-24',
      sectionId: 'wnr365',
      dateKey: '12-24',
      dayNumber: 365,
      title: 'Dzień 365 (24 grudnia): Wigilia Bożego Narodzenia – Zwieńczenie Cyklu',
      content: content365,
      updatedAt: new Date().toISOString()
    };
    existingEntries['ebook_wnr-12-24'] = {
      id: 'ebook_wnr-12-24',
      sectionId: 'ebook_wnr',
      dateKey: '12-24',
      dayNumber: 365,
      title: 'Dzień 365 (24 grudnia): Wigilia Bożego Narodzenia – Zwieńczenie Cyklu',
      content: content365,
      updatedAt: new Date().toISOString()
    };
  }

  // 2. Generate 365 days for RHZ365 & ebook_rhz if missing
  allDates.forEach(d => {
    const rhzKey = `rhz365-${d.dateKey}`;
    const ebookRhzKey = `ebook_rhz-${d.dateKey}`;
    const mystery = MYSTERIES[(d.dayNumber - 1) % MYSTERIES.length];

    if (!existingEntries[rhzKey]) {
      const rhzContent = `Dzień ${d.dayNumber} z 365 (${d.displayDate}) • ${d.season}\n\nROZWAŻANIE RÓŻANCOWE:\nStajemy dziś przed Bogiem w modlitwie różańcowej, rozważając ${mystery}. Modlitwa ta spaja Historię Zbawienia w jedną świętą całość: od rajskiej obietnicy Niewiasty ścierającej głowę węża, poprzez Przymierze z patriarchami, aż po zmartwychwstanie Chrystusa.\n\nW codziennych troskach nie jesteśmy sami. Przesuwając drewniane paciorki różańca, oddajemy Maryi nasze słabości, prosząc o światło Ducha Świętego dla naszych rodzin i całego świata.\n\nOWOC TAJEMNICY:\nZaufanie Bożej Opatrzności, pokora serca oraz odważne wyznawanie wiary w Chrystusa Pana.`;
      const rhzPrayer = `Matko Bożego Przymierza, wstawiaj się za nami na drodze modlitwy i prowadź nasze kroki ku zbawieniu. Amen.`;

      const obj = {
        id: rhzKey,
        sectionId: 'rhz365',
        dateKey: d.dateKey,
        dayNumber: d.dayNumber,
        title: `RHZ365 Dzień ${d.dayNumber}: ${mystery.split(':')[1]?.trim() || mystery}`,
        subtitle: `${d.displayDate} • Różaniec Historii Zbawienia`,
        mystery,
        intention: `Intencja: O dar miłości, wierności i pokoju w sercach oraz rodzinach w dniu ${d.displayDate}.`,
        content: rhzContent,
        prayer: rhzPrayer,
        updatedAt: new Date().toISOString()
      };
      existingEntries[rhzKey] = obj;
      existingEntries[ebookRhzKey] = { ...obj, id: ebookRhzKey, sectionId: 'ebook_rhz' };
    }

    // 3. Biblia365 & ebook_biblia
    const bibliaKey = `biblia365-${d.dateKey}`;
    const ebookBibliaKey = `ebook_biblia-${d.dateKey}`;
    if (!existingEntries[bibliaKey]) {
      const psNum = (d.dayNumber % 150) + 1;
      const bibliaContent = `CZYTANIA PIERWSZE I DRUGIE (${d.displayDate}):\nStary Testament: Księgi Mądrościowe i Prorockie (Czytanie na Dzień ${d.dayNumber})\nNowy Testament: Ewangelie oraz Listy Apostolskie (Dzień ${d.dayNumber})\n\nPSALM RESPONSORYJNY (Ps ${psNum}):\n"Pan światłem i zbawieniem moim, kogo mam się lękać? Pan obroną mojego życia, przed kim mam trwożyć?" (Ps 27)\n\nFRAGMENT Z TRADYCJI APOKRYFICZNEJ I PRAC OJCÓW KOŚCIOŁA:\n"Niech Słowo Boże będzie pokarmem dla twojej duszy rano i wieczorem. Kto medytuje nad Prawem Pańskim, staje się jak drzewo zasadzone nad płynącą wodą, które wydaje owoc w swoim czasie." (Didache / Nauka Ojców Apostolskich)\n\nKOMENTARZ TEOLOGICZNY:\nSłowo Boże w dniu ${d.displayDate} przypomina o Bożym prowadzeniu przez pustynię doczesności. Otwórz Pismo Święte z czystym sercem i wsłuchaj się w Głos Stwórcy.`;

      const obj = {
        id: bibliaKey,
        sectionId: 'biblia365',
        dateKey: d.dateKey,
        dayNumber: d.dayNumber,
        title: `Biblia365 Dzień ${d.dayNumber}: Czytania Słowa Bożego (${d.displayDate})`,
        subtitle: `${d.displayDate} • Pismo Święte & Tradycja Apostolska`,
        passage: `Stary Testament • Nowy Testament • Psalm ${psNum}`,
        apocryphaPassage: `Tradycja Ojców Apostolskich & Apokryfy wczesnochrześcijańskie`,
        content: bibliaContent,
        prayer: `Boże, Twoje Słowo jest prawdą i życiem. Daj nam słuchać Go z wiarą i wypełniać w codziennym życiu. Amen.`,
        updatedAt: new Date().toISOString()
      };
      existingEntries[bibliaKey] = obj;
      existingEntries[ebookBibliaKey] = { ...obj, id: ebookBibliaKey, sectionId: 'ebook_biblia' };
    }

    // 4. Bio365
    const bioKey = `bio365-${d.dateKey}`;
    if (!existingEntries[bioKey]) {
      const bioContent = `KRONIKA ŻYCIA I MAŁŻEŃSTWA • Dzień ${d.dayNumber} z 365 (${d.displayDate})\n\nWspomnienie i Refleksja:\nPatrząc na minione lata naszej wspólnej drogi z ukochaną Żoną, dziękuję Bogu za każdy spędzony razem dzień. W dniu ${d.displayDate} powracamy pamięcią do chwil, w których odczuliśmy szczególną Bożą opiekę.\n\nMałżeństwo to codzienny trud, ale i najpiękniejsze błogosławieństwo. To cicha modlitwa przy zapalonej świecy, wspólnie dzielona radość oraz budowanie bezpiecznego domu pełnego miłości i wzajemnego szacunku.\n\nNiech ten dzień przypomina wszystkim małżeństwom, że z Bogiem pośród nas każda burza mija, a miłość staje się silniejsza z każdym rokiem.`;

      existingEntries[bioKey] = {
        id: bioKey,
        sectionId: 'bio365',
        dateKey: d.dateKey,
        dayNumber: d.dayNumber,
        title: `Bio365 Dzień ${d.dayNumber}: Wspomnienia i Świadectwo Miłości (${d.displayDate})`,
        subtitle: `${d.displayDate} • Kronika Naszego Małżeństwa`,
        content: bioContent,
        prayer: `Boże Ojcze, błogosław naszemu małżeństwu i uświęcaj naszą miłość każdego dnia. Amen.`,
        updatedAt: new Date().toISOString()
      };
    }
  });

  rawData.entries = existingEntries;
  fs.writeFileSync(entriesJsonPath, JSON.stringify(rawData, null, 2), 'utf8');

  const rootEntriesJsonPath = path.join(process.cwd(), 'data', 'entries.json');
  if (fs.existsSync(path.dirname(rootEntriesJsonPath))) {
    fs.writeFileSync(rootEntriesJsonPath, JSON.stringify(rawData, null, 2), 'utf8');
  }

  console.log(`Successfully populated entries.json! Total entries count: ${Object.keys(existingEntries).length}`);
}

populateAllSections();
