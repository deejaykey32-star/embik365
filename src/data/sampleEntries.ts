import { SectionEntry, SectionId, CycleDate } from '../types';
import { getWnrEntryForDay } from './wnr365Data';
import { getRhzEntryForDay } from './rhz365Data';

export const BASE_ENTRIES: Record<string, Partial<SectionEntry>> = {
  // info365 - Guide Day 1
  'info365-12-25': {
    title: 'Wprowadzenie: Narodzenie Pańskie i Początek Cyklu',
    subtitle: 'info365 • Dzień 1 cyklu rocznego (25 grudnia)',
    content: `Witaj w rocznym cyklu Droga365. Dziś, 25 grudnia, w Boże Narodzenie, rozpoczynamy naszą wędrówkę przez 7 wielkich dzieł: Widoki na Raj (WnR365), Różaniec Historii Zbawienia (RHZ365), Biblię365 z Apokryfami oraz e-booki w formie flipbooka i biografię małżeńską Bio365.`,
    quote: '"Początek Ewangelii Jezusa Chrystusa, Syna Bożego." (Mk 1, 1)',
    prayer: 'Błogosław, Panie, wszystkim czytelnikom i pielgrzymom tej drogi.'
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

Rozpoczynając tę biografię w dniu Bożego Narodzenia, 25 grudnia, pragnę złożyć hołd Bogu za największy ziemski dar, jaki otrzymałem: za moją ukochaną Żonę. To przy Jej boku nauczyłem się, czym jest prawdziwa cierpliwość, bezinteresowne oddanie i ciepło domowego ogniska.`
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
