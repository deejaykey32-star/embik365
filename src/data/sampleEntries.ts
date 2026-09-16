import { SectionEntry, SectionId, CycleDate } from '../types';

export const BASE_ENTRIES: Record<string, Partial<SectionEntry>> = {
  // info365 - Guide Day 1
  'info365-12-25': {
    title: 'Wprowadzenie: Narodzenie Pańskie i Początek Cyklu',
    subtitle: 'info365 • Dzień 1 cyklu rocznego (25 grudnia)',
    content: `Witaj w rocznym cyklu Droga365. Dziś, 25 grudnia, w Boże Narodzenie, rozpoczynamy naszą wędrówkę przez 7 wielkich dzieł: Widoki na Raj (WnR365), Różaniec Historii Zbawienia (RHZ365), Biblię365 z Apokryfami oraz e-booki w formie flipbooka i biografię małżeńską Bio365.`,
    quote: '"Początek Ewangelii Jezusa Chrystusa, Syna Bożego." (Mk 1, 1)',
    prayer: 'Błogosław, Panie, wszystkim czytelnikom i pielgrzymom tej drogi.'
  },

  // WnR365 - Day 1 (25 XII)
  'wnr365-12-25': {
    title: 'Bierzcie Darmo – Spożywajcie i dzielcie się pokarmem z innymi',
    subtitle: 'Widoki na Raj (WnR365) • Dzień 1 cyklu rocznego',
    content: `To, co duchowe, powinno być przekazywane bezinteresownie. Jezus posłał swoich uczniów ze słowami: „Darmo otrzymaliście, darmo dawajcie” (Mt 10,8). Dobra duchowe nie są towarem. Ewangelii nie można sprzedać ani kupić, ponieważ jest ona darem Boga dla każdego człowieka.

Świat coraz bardziej uzależnia się od pieniądza. Nierzadko wartość człowieka mierzy się jego majątkiem, a nie prawdą, dobrem czy miłością bliźniego. Taka pokusa przenika również do życia religijnego. Tymczasem Jezus nauczał bez pobierania opłat, uzdrawiał bez wynagrodzenia i troszczył się o tych, którzy Go słuchali. Gdy ludzie byli głodni, nie odprawił ich, lecz rozmnożył chleby i ryby, pokazując, że miłość poprzedza rachunek zysków i strat.

Prawdziwy Kościół rodzi się tam, gdzie ludzie jednoczą się w wierze, nadziei i miłości. Świątynie są miejscami modlitwy i spotkania, lecz same mury nie stanowią istoty Kościoła. Świętymi kamieniami są wierzący, którzy tworzą wspólnotę żywego Boga. Najpiękniejszą świątynią jest serce człowieka, otwarte na obecność Ducha Świętego. Bóg nie potrzebuje naszych dóbr materialnych. Pragnie przede wszystkim naszego serca, naszej miłości i zaufania.

Ofiara ma wartość wtedy, gdy wypływa z wdzięczności i miłości, a nie z przymusu czy przekonania, że można za nią „kupić” Bożą łaskę. Przypowieść o talentach przypomina, że wszystko, co otrzymaliśmy od Boga, powinno przynosić owoce. Talentami są zarówno zdolności, czas, możliwości, jak i dobra materialne. Pieniądz sam w sobie nie jest złem, lecz narzędziem. Staje się błogosławieństwem wtedy, gdy służy dobru i pomocy potrzebującym, a nie wtedy, gdy staje się naszym panem.

Jezus przestrzegał przed służeniem „mamonie”. Chrześcijanin powinien pomnażać otrzymane dary, rozwijać swoje zdolności i uczciwie pracować. Owoce tej pracy mają jednak prowadzić nie tylko do własnego dobrobytu, lecz także do dzielenia się z ubogimi i budowania dobra wspólnego. Historia świata jest również historią dojrzewania ludzkiego ducha. Bóg nieustannie prowadzi człowieka ku pełni życia. Celem nie jest jedynie rozwój materialny, lecz przemiana serca, tak aby wszyscy stali się jednym w Chrystusie. To właśnie jest największe bogactwo, które nie przemija i prowadzi do życia wiecznego.`
  },
  'wnr366-12-25': {
    title: 'Bierzcie Darmo – Spożywajcie i dzielcie się pokarmem z innymi',
    subtitle: 'Widoki na Raj (WnR365) • Dzień 1 cyklu rocznego',
    content: `To, co duchowe, powinno być przekazywane bezinteresownie. Jezus posłał swoich uczniów ze słowami: „Darmo otrzymaliście, darmo dawajcie” (Mt 10,8). Dobra duchowe nie są towarem. Ewangelii nie można sprzedać ani kupić, ponieważ jest ona darem Boga dla każdego człowieka.

Świat coraz bardziej uzależnia się od pieniądza. Nierzadko wartość człowieka mierzy się jego majątkiem, a nie prawdą, dobrem czy miłością bliźniego. Taka pokusa przenika również do życia religijnego. Tymczasem Jezus nauczał bez pobierania opłat, uzdrawiał bez wynagrodzenia i troszczył się o tych, którzy Go słuchali. Gdy ludzie byli głodni, nie odprawił ich, lecz rozmnożył chleby i ryby, pokazując, że miłość poprzedza rachunek zysków i strat.

Prawdziwy Kościół rodzi się tam, gdzie ludzie jednoczą się w wierze, nadziei i miłości. Świątynie są miejscami modlitwy i spotkania, lecz same mury nie stanowią istoty Kościoła. Świętymi kamieniami są wierzący, którzy tworzą wspólnotę żywego Boga. Najpiękniejszą świątynią jest serce człowieka, otwarte na obecność Ducha Świętego. Bóg nie potrzebuje naszych dóbr materialnych. Pragnie przede wszystkim naszego serca, naszej miłości i zaufania.

Ofiara ma wartość wtedy, gdy wypływa z wdzięczności i miłości, a nie z przymusu czy przekonania, że można za nią „kupić” Bożą łaskę. Przypowieść o talentach przypomina, że wszystko, co otrzymaliśmy od Boga, powinno przynosić owoce. Talentami są zarówno zdolności, czas, możliwości, jak i dobra materialne. Pieniądz sam w sobie nie jest złem, lecz narzędziem. Staje się błogosławieństwem wtedy, gdy służy dobru i pomocy potrzebującym, a nie wtedy, gdy staje się naszym panem.

Jezus przestrzegał przed służeniem „mamonie”. Chrześcijanin powinien pomnażać otrzymane dary, rozwijać swoje zdolności i uczciwie pracować. Owoce tej pracy mają jednak prowadzić nie tylko do własnego dobrobytu, lecz także do dzielenia się z ubogimi i budowania dobra wspólnego. Historia świata jest również historią dojrzewania ludzkiego ducha. Bóg nieustannie prowadzi człowieka ku pełni życia. Celem nie jest jedynie rozwój materialny, lecz przemiana serca, tak aby wszyscy stali się jednym w Chrystusie. To właśnie jest największe bogactwo, które nie przemija i prowadzi do życia wiecznego.`
  },

  // RHZ365 - Day 1 (25 XII)
  'rhz365-12-25': {
    title: 'Narodzenie Pana Jezusa w Betlejem',
    subtitle: 'Różaniec Historii Zbawienia • Tajemnica Radosna III',
    mystery: 'Tajemnica III Radosna: Narodzenie Pana Jezusa',
    decade: 'Dziesiątek: 1x Ojcze Nasz, 10x Zdrowaś Maryjo, 1x Chwała Ojcu',
    intention: 'Modlimy się za wszystkie rodziny, małżeństwa, dzieci nienarodzone oraz o dar pokoju w ludzkich sercach.',
    content: `Historia Zbawienia osiąga swój punkt kulminacyjny. Wszystkie obietnice dane Abrahamowi, proroctwa Izajasza o Pannie rodzącej Emmanuela, pieśni Dawida – znajdują swoje wypełnienie w cichą noc w Judzie.

Maryja z Józefem nie znajdują miejsca w gospodzie. W ubóstwie betlejemskim objawia się Boża mądrość: Bóg nie szuka pałaców z marmuru, lecz czystego, otwartego serca. Przesuwając paciorki różańca, wchodzimy wraz z pasterzami do wnętrza groty, by złożyć u stóp Nowonarodzonego Króla nasze zmęczenie, nadzieje i dziękczynienie za dar życia.`,
    prayer: 'Matko Boża z Betlejem, naucz nas przyjmować Jezusa w cichości, pokorze i zaufaniu, które pokonuje każdy lęk.'
  },

  // Biblia365 - Day 1 (25 XII)
  'biblia365-12-25': {
    title: 'Prolog św. Jana, Księga Rodzaju i Protoewangelia Jakuba',
    subtitle: 'Biblia365 • Dzień 1 (25 grudnia)',
    passage: 'Stary Testament: Rdz 1, 1-31 (Stworzenie świata) • Nowy Testament: J 1, 1-18 (Prolog św. Jana) • Psalm: Ps 96 (Śpiewajcie Panu pieśń nową)',
    apocryphaPassage: 'Apokryf: Protoewangelia Jakuba (rozdz. XVII-XIX – Narodziny w Grocie)',
    content: `CZYTANIE Z EWANGELII ŚW. JANA (J 1, 1-5):
"Na początku było Słowo, a Słowo było u Boga, i Bogiem było Słowo. Ono było na początku u Boga. Wszystko przez Nie się stało, a bez Niego nic się nie stało, co się stało. W Nim było życie, a życie było światłością ludzi, a światłość w ciemności świeci i ciemność jej nie ogarnęła."

FRAGMENT APOKRYFU (Protoewangelia Jakuba rozdz. XVIII-XIX):
"I rzekł Józef do Maryi: Dokąd mam cię zaprowadzić? I znalazł grotę, i wprowadził ją tam... I stał się wielki znak: chmura świetlista ocieniła grotę, a potem chmura odeszła, i zajaśniało światło w grocie tak wielkie, że oczy znieść go nie mogły. I zaraz światło to ustąpiło, aż ukazało się Dziecię, i poszło, i wzięło pierś matki swojej Maryi. I zawołała niewiasta: Jakże wielki jest dzień dzisiejszy, żem widziała to niezwykłe zjawisko!"

KOMENTARZ EGZEGETYCZNY:
Rozpoczynamy roczny szlak lektury od dwóch "Początków": początku stworzenia w Księdze Rodzaju i odwiecznego początku Słowa w Ewangelii Jana. Apokryficzna Protoewangelia Jakuba (pochodząca z II wieku) zachowuje czułą, wczesnochrześcijańską pobożność, ukazując grotę narodzenia zalaną boską światłością.`
  },

  // ebook_wnr - Book Intro & Chapters
  'ebook_wnr-12-25': {
    title: 'Widoki na Raj • Tom I: Od Wcielenia do Przemienienia',
    subtitle: 'Wydanie Książkowe Flipbook • Strona 1-2',
    content: `PRZEDMOWA AUTORA
Książka ta nie powstała przy biurku teologa, lecz na ścieżkach codziennego zmagania, modlitwy i zachwytu nad światem, który pomimo swoich ran wciąż nosi na sobie odcisk palców Dobrego Boga.

Tytułowe "Widoki na Raj" to nie ucieczka od rzeczywistości w marzenia. Wręcz przeciwnie – to wezwanie do zakorzenienia się w prawdzie o tym, kim jesteśmy. Jesteśmy pielgrzymami powołanymi do Domu Ojca. 

Gdy przewracasz te stronice, dzień po dniu, życzę Ci, Drogi Czytelniku, by Twoje serce odnalazło ukojenie w Słowie, które nigdy nie przemija.`
  },

  // ebook_rhz - Prayer Book
  'ebook_rhz-12-25': {
    title: 'Księga Różańca Historii Zbawienia',
    subtitle: 'Interaktywny Modlitewnik • Wprowadzenie i Tajemnica I',
    content: `JAK ROZWAŻAĆ RÓŻANIEC HISTORII ZBAWIENIA:

1. Znak Krzyża Świętego i Wierzę w Boga.
2. 1x Ojcze nasz w intencjach Ojca Świętego i Kościoła.
3. 3x Zdrowaś Maryjo o przymnożenie Wiary, Nadziei i Miłości.
4. Chwała Ojcu i o mój Jezu.

Różaniec Historii Zbawienia to podróż w głąb wieków: od pierwszego tchnienia życia w człowieku, poprzez potop, wierność Abrahama, wyzwolenie z niewoli egipskiej, aż po Golgotę i pusty grób Chrystusa. Każda cząstka modlitwy to krok ku zjednoczeniu z Bogiem.`
  },

  // ebook_biblia - Scripture Volume
  'ebook_biblia-12-25': {
    title: 'Biblia Sacra & Scripta Apocrypha',
    subtitle: 'Księga Wiecznego Słowa • Dzień I',
    content: `LIBER GENESIS (Księga Rodzaju I):
"Na początku Bóg stworzył niebo i ziemię. Ziemia zaś była bezładem i pustkowiem: ciemność była nad powierzchnią bezmiaru wód, a Duch Boży unosił się nad wodami. Wtedy Bóg rzekł: «Niechaj stanie się światłość!» I stała się światłość."

EVANGELIUM SECUNDUM JOANNEM (Ewangelia wg św. Jana I):
"W Nim było życie, a życie było światłością ludzi... Wszystkim tym jednak, którzy Je przyjęli, dało moc, aby się stali dziećmi Bożymi, tym, którzy wierzą w imię Jego."`
  },

  // bio365 - Biography
  'bio365-12-25': {
    title: 'Rozdział 1: Dar Miłości i Bożonarodzeniowy Początek',
    subtitle: 'Bio365 • Kronika Życia Naszego Małżeństwa',
    content: `Nie ma w życiu przypadków – są tylko znaki, które Bóg stawia na naszych ścieżkach, czekając cierpliwie, aż nauczymy się je odczytywać.

Rozpoczynając tę biografię w dniu Bożego Narodzenia, 25 grudnia, pragnę złożyć hołd Bogu za największy ziemski dar, jaki otrzymałem: za moją ukochaną Żonę. To przy Jej boku nauczyłem się, czym jest prawdziwa cierpliwość, bezinteresowne oddanie i ciepło domowego ogniska.

Pamiętam nasze pierwsze wspólne święta, zapach choinki, dźwięk łamanego opłatka i spojrzenie pełne wzajemnej obietnicy, że cokolwiek przyniesie przyszłość – radości czy krzyże – przejdziemy przez nią razem, trzymając się za ręce i ufając Temu, który nas połączył.

Ta biografia to nasz wspólny pamiętnik na każdy dzień roku – opowieść o spotkaniach, rozmowach, małych i wielkich cudach naszej codzienności.`
  }
};

/**
 * Dynamically resolves or generates a rich entry for any section and cycle date.
 */
export function getEntryForSectionAndDate(
  sectionId: SectionId, 
  cycleDate: CycleDate,
  customEntries?: Record<string, SectionEntry>
): SectionEntry {
  const specificKey = `${sectionId}-${cycleDate.dateKey}`;

  if (customEntries) {
    if (customEntries[specificKey]) {
      return customEntries[specificKey];
    }
    // Ebook / Reader section fallbacks
    if (sectionId === 'ebook_wnr' || sectionId === 'wnr365' || sectionId === 'wnr366') {
      const fb = customEntries[`wnr365-${cycleDate.dateKey}`] ||
                 customEntries[`ebook_wnr-${cycleDate.dateKey}`] ||
                 customEntries[`wnr366-${cycleDate.dateKey}`];
      if (fb) return { ...fb, sectionId };
    }
    if (sectionId === 'ebook_rhz' || sectionId === 'rhz365') {
      const fb = customEntries[`rhz365-${cycleDate.dateKey}`] ||
                 customEntries[`ebook_rhz-${cycleDate.dateKey}`];
      if (fb) return { ...fb, sectionId };
    }
    if (sectionId === 'ebook_biblia' || sectionId === 'biblia365') {
      const fb = customEntries[`biblia365-${cycleDate.dateKey}`] ||
                 customEntries[`ebook_biblia-${cycleDate.dateKey}`];
      if (fb) return { ...fb, sectionId };
    }
    if (sectionId === 'bio365') {
      const fb = customEntries[`bio365-${cycleDate.dateKey}`];
      if (fb) return { ...fb, sectionId };
    }
  }

  let base = BASE_ENTRIES[specificKey];
  if (!base && (sectionId === 'wnr365' || sectionId === 'ebook_wnr' || sectionId === 'wnr366')) {
    base = BASE_ENTRIES[`wnr365-${cycleDate.dateKey}`] || BASE_ENTRIES[`ebook_wnr-${cycleDate.dateKey}`] || BASE_ENTRIES[`wnr366-${cycleDate.dateKey}`];
  }

  if (base && base.title && base.content) {
    return {
      id: specificKey,
      sectionId,
      dateKey: cycleDate.dateKey,
      dayNumber: cycleDate.dayNumber,
      title: base.title,
      subtitle: base.subtitle,
      passage: base.passage,
      apocryphaPassage: base.apocryphaPassage,
      mystery: base.mystery,
      intention: base.intention,
      decade: base.decade,
      content: base.content,
      prayer: base.prayer,
      quote: base.quote,
      authorNotes: base.authorNotes,
      image: base.image,
      pdfs: []
    };
  }

  // Generate dynamic, inspiring thematic content for any other day in the 366-day cycle:
  return generateThematicEntry(sectionId, cycleDate);
}

function generateThematicEntry(sectionId: SectionId, cycleDate: CycleDate): SectionEntry {
  const { dayNumber, displayDate, season } = cycleDate;

  switch (sectionId) {
    case 'info365':
      return {
        id: `info365-${cycleDate.dateKey}`,
        sectionId,
        dateKey: cycleDate.dateKey,
        dayNumber,
        title: `Przewodnik Droga365: Dzień ${dayNumber}`,
        subtitle: `${displayDate} • ${season}`,
        content: `Dziś jest dzień ${dayNumber} w rocznym cyklu czytelniczym Droga365. Zachęcamy do zapoznania się z dzisiejszymi rozważaniami w blogu Widoki na Raj (WnR365), modlitwą różańcową (RHZ365), czytaniem Pisma Świętego (Biblia365) lub lekturą wybranego e-booka.`,
        quote: `"Twoje słowo jest lampą dla moich stóp i światłem na mojej ścieżce." (Ps 119, 105)`,
        prayer: `Panie, prowadź nas bezpiecznie przez każdy dzień tego roku.`
      };

    case 'wnr365':
    case 'wnr366':
      return {
        id: `wnr365-${cycleDate.dateKey}`,
        sectionId: 'wnr365',
        dateKey: cycleDate.dateKey,
        dayNumber,
        title: `Widoki na Raj (WnR365): Ścieżka Pokoju (Dzień ${dayNumber})`,
        subtitle: `${displayDate} • ${season}`,
        content: `W codziennym zgiełku łatwo zapomnieć, że jesteśmy powołani do pokoju, który przewyższa wszelki ludzki umysł. Dzisiejszy dzień (${displayDate}) przynosi nowe zaproszenie: zatrzymaj się choćby na pięć minut i spójrz w głąb własnego serca.

Świat próbuje przekonać nas, że wartość człowieka zależy od pośpiechu, sukcesów i gromadzonych dóbr. Z perspektywy Raju liczy się tylko jedno: ile miłości potrafiliśmy wlać w drobne gesty dnia powszedniego. W ciepłe słowo skierowane do współmałżonka, w cierpliwość wobec trudnego sąsiada, w cichą modlitwę za kogoś, kto nas zranił.

Raj nie jest odległą krainą za mgłą. Raj zaczyna się w sercu, które pojednało się z Bogiem i potrafi dziękować za dar kolejnego poranka.`,
        quote: `"Pokój zostawiam wam, pokój mój daję wam. Nie tak jak daje świat, Ja wam daję." (J 14, 27)`,
        prayer: `Panie Boże, uczyń mnie narzędziem Twojego pokoju. Gdzie jest nienawiść, niech sieję miłość; gdzie zwątpienie – wiarę; gdzie smutek – Twoją niewygasłą radość.`
      };

    case 'rhz365':
      return {
        id: `rhz365-${cycleDate.dateKey}`,
        sectionId,
        dateKey: cycleDate.dateKey,
        dayNumber,
        title: `Różaniec Historii Zbawienia: Dzień ${dayNumber}`,
        subtitle: `${displayDate} • ${season}`,
        mystery: `Rozważanie dnia ${dayNumber}: Wierność Przymierzu i Prowadzenie Ducha Świętego`,
        decade: 'Dziesiątek: 1x Ojcze Nasz, 10x Zdrowaś Maryjo, 1x Chwała Ojcu',
        intention: `Polecamy Bogu intencje tego dnia: pokój w naszych rodzinach, błogosławieństwo w pracy oraz dar żywej wiary dla młodego pokolenia.`,
        content: `Przesuwając kolejne paciorki różańca, łączymy się z pokoleniami wierzących, którzy przed nami szli drogą zaufania. Historia zbawienia to nie tylko dawne wydarzenia opisane w księgach – to żywa rzeka łaski, w której uczestniczymy każdego dnia (${displayDate}).

Maryja, Niewiasta Milczenia i Zaufania, uczy nas patrzeć na codzienne krzyże nie jak na porażki, ale jak na ziarna, które obumierając przynoszą plon obfity.`,
        prayer: `Królowo Różańca Świętego, módl się za nami i prowadź nas bezpiecznie przez fale doczesności ku wiecznemu portowi Ojca.`
      };

    case 'biblia365':
      return {
        id: `biblia365-${cycleDate.dateKey}`,
        sectionId,
        dateKey: cycleDate.dateKey,
        dayNumber,
        title: `Lektura Pisma Świętego i Apokryfów • Dzień ${dayNumber}`,
        subtitle: `${displayDate} • Roczny plan czytania Słowa`,
        passage: `Stary Testament: Wybrane wersety mądrościowe i prorockie • Nowy Testament: Listy Apostolskie • Psalm Dnia: Ps ${(dayNumber % 150) + 1}`,
        apocryphaPassage: `Apokryf: Didache (Nauka Dwunastu Apostołów) oraz fragmenty Ody Salomona`,
        content: `SŁOWO BOŻE NA DZIŚ:
"Błogosławiony człowiek, który nie idzie za radą występnych, nie wchodzi na drogę grzeszników i nie siada w kole szyderców, lecz ma upodobanie w Prawie Pana, nad Jego Prawem rozmyśla dniem i nocą. Jest on jak drzewo zasadzone nad płynącą wodą, które przynosi owoc w swoim czasie, a liście jego nie więdną." (Ps 1)

ZE SKARBCZYKA APOKRYFÓW (Didache rozdz. 1):
"Są dwie drogi: jedna droga życia, a druga droga śmierci, i wielka jest różnica między tymi dwiema drogami. Droga życia jest ta: po pierwsze będziesz miłował Boga, który cię stworzył; po drugie bliźniego swego jak siebie samego. Wszystkiego zaś, czego byś nie chciał, by tobie czyniono, i ty nie czyń drugiemu."

ROZWAŻANIE:
Słowo Boże jest żywe i skuteczne, ostrzejsze niż miecz obosieczny. Dziś, ${displayDate}, wsłuchaj się w wezwanie do radykalizmu miłości i wierności prostym Bożym przykazaniom.`
      };

    case 'ebook_wnr':
      return {
        id: `ebook_wnr-${cycleDate.dateKey}`,
        sectionId,
        dateKey: cycleDate.dateKey,
        dayNumber,
        title: `Księga Widoki na Raj • Karta Dnia ${dayNumber}`,
        subtitle: `${displayDate} • Kartka ${dayNumber} z 366`,
        content: `ROZDZIAŁ ${dayNumber}: KRAJOBRAZ WEWNĘTRZNEGO ŚWIATŁA

Gdybyśmy potrafili spojrzeć na świat oczami aniołów, dostrzeglibyśmy, jak gęsto tkana jest sieć Bożej opieki wokół naszych kroków. Nie ma sekundy, w której bylibyśmy pozostawieni sami sobie. 

W dniu ${displayDate}, pośród zwykłych spraw, pamiętaj:
Każda godzina to dar. Każda napotkana osoba to bliźni powierzony twojej trosce. Drzwi do Raju uchylają się za każdym razem, gdy przebaczasz i wybierasz dobro ponad pychę.

(Obróć kartkę, aby czytać dalej...)`
      };

    case 'ebook_rhz':
      return {
        id: `ebook_rhz-${cycleDate.dateKey}`,
        sectionId,
        dateKey: cycleDate.dateKey,
        dayNumber,
        title: `Modlitewnik RHZ • Dzień ${dayNumber}`,
        subtitle: `${displayDate} • Stroniczka Różańcowa`,
        content: `TAJEMNICA DNIA I ROZWAŻANIE (${displayDate}):

Rozważamy wierność Boga wobec człowieka. Maryjo, Przewodniczko na drogach modlitwy, otocz naszą rodzinę swoim płaszczem opieki.

"Kto się w opiekę odda Panu swemu, a całym sercem szczerze ufa Jemu, śmiele rzec może: Mam obrońcę Boga, nie przyjdzie na mnie żadna straszna trwoga!"

Rozważ 10 wezwań "Zdrowaś Maryjo" w skupieniu, ofiarowując owoce tej modlitwy za ludzi chorych i cierpiących.`
      };

    case 'ebook_biblia':
      return {
        id: `ebook_biblia-${cycleDate.dateKey}`,
        sectionId,
        dateKey: cycleDate.dateKey,
        dayNumber,
        title: `Biblia Sacra • Pergamin Dnia ${dayNumber}`,
        subtitle: `${displayDate} • Złota Karta Pisma Świętego`,
        content: `VERBUM DOMINI MANET IN AETERNUM

"Twoje słowo jest lampą dla moich stóp i światłem na mojej ścieżce." (Ps 119, 105)

Dzień ${dayNumber} lektury biblijnej. Przewracając tę pergaminową kartę, wstępujesz w wielki nurt tradycji Kościoła i ojców pustyni. Przypomnij sobie wersety, które w ostatnich dniach najbardziej dotknęły twojego serca, i uczyń z nich dzisiejszy akt strzelisty.`
      };

    case 'bio365':
      return {
        id: `bio365-${cycleDate.dateKey}`,
        sectionId,
        dateKey: cycleDate.dateKey,
        dayNumber,
        title: `Biografia Moja i Mojej Żony • Wspomnienie Dnia ${dayNumber}`,
        subtitle: `${displayDate} • Kronika Naszej Wspólnej Drogi`,
        content: `WSPOMNIENIE DNIA: ${displayDate} (Dzień ${dayNumber} cyklu)

Gdy spoglądam na historię naszego małżeństwa, uderza mnie, jak z pozoru drobne chwile tworzą najtrwalszy fundament miłości. Wspólne poranne rozmowy przy herbacie, dzielenie się marzeniami, cicha obecność w trudniejszych momentach, uśmiech mojej Żony, który potrafi rozproszyć największe chmury.

Każde małżeństwo to nieustanna budowa świątyni ze słów: "przepraszam", "dziękuję", "proszę" i "kocham cię". Dziękuję Bogu za każdy dzień spędzony u boku mojej żony i proszę o kolejne lata przeżyte w zdrowiu, miłości i głębokiej wierze.

(Możesz wgrać plik PDF z pełnym tekstem biografii za pomocą panelu administratora)`
      };
  }
}
