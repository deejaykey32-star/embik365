import { SectionEntry, SectionId, CycleDate } from '../types';
import { getWnrEntryForDay } from './wnr365Data';
import { getRhzEntryForDay } from './rhz365Data';
import { getBibliaEntryForDayAndYear } from './biblia365Data';
import { NOWY_RHZ_MYSTERIES } from './nowyRhzData';
import {
  buildFullHailMary,
  OJCZE_NASZ_PELNY,
  CHWALA_OJCU_PELNE,
  MODLITWA_FATIMSKA_PELNA
} from '../utils/radioContentService';

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
    case 'ebook_wnr': {
      const wnr = getWnrEntryForDay(dayNumber);
      return {
        id: `${sectionId}-${cycleDate.dateKey}`,
        sectionId,
        dateKey: cycleDate.dateKey,
        dayNumber,
        title: wnr?.title || `Widoki na Raj (WnR365) • Dzień ${dayNumber}`,
        subtitle: wnr?.subTitle ? `${wnr.subTitle} • ${displayDate}` : `${displayDate} • Dzień ${dayNumber} z 365`,
        content: wnr?.content || `Dzień ${dayNumber} rozważań Widoki na Raj.`
      };
    }

    case 'rhz365':
    case 'ebook_rhz': {
      const rhz = getRhzEntryForDay(dayNumber);
      const callsFormatted = (rhz?.callsToAction || []).filter(Boolean).map(c => c.trim()).join('\n\n');
      const cleanOurFather = (rhz?.ourFather || OJCZE_NASZ_PELNY)
        .replace(/10 Osobnych Modlitw.*$/i, '')
        .trim();

      const beadsFormatted = (rhz?.smallBeads || []).map((b) => {
        const text = (b.text || '').trim();
        if (text.toLowerCase().startsWith('zdrowaś maryjo') && text.toLowerCase().includes('święta maryjo')) {
          return text;
        }
        return buildFullHailMary(b.dopowiedzenie || text);
      }).join('\n\n');

      const fullRhzContent = `${rhz?.stageTitle || ''}

Pismo Święte:
${rhz?.passage || ''}

Słowo Wyjaśnienia:
${rhz?.explanation || ''}

Trzy Wezwania do Działania:
${callsFormatted}

Modlitwa Pańska:
${cleanOurFather || OJCZE_NASZ_PELNY}

${beadsFormatted}

Uwielbienie i Prośba:
${rhz?.gloryBe || CHWALA_OJCU_PELNE}
${rhz?.fatimaPrayer || MODLITWA_FATIMSKA_PELNA}`.trim();

      return {
        id: `${sectionId}-${cycleDate.dateKey}`,
        sectionId,
        dateKey: cycleDate.dateKey,
        dayNumber,
        title: rhz?.stageTitle || `Różaniec Historii Zbawienia: Dzień ${dayNumber}`,
        subtitle: `${displayDate} • ${rhz?.cycle || 'RHZ365'} (Tajemnica ${rhz?.mysteryIndex || 1} z 175)`,
        mystery: rhz?.stageTitle,
        intention: `Tajemnica ${rhz?.mysteryIndex || 1} Różańca Historii Zbawienia`,
        passage: rhz?.passage,
        content: fullRhzContent,
        prayer: `${rhz?.gloryBe || CHWALA_OJCU_PELNE}\n\n${rhz?.fatimaPrayer || MODLITWA_FATIMSKA_PELNA}`.trim()
      };
    }

    case 'nowyRHZ': {
      const day175 = ((dayNumber - 1) % 175) + 1;
      const mystery = NOWY_RHZ_MYSTERIES.find(m => m.day === day175) || NOWY_RHZ_MYSTERIES[day175] || NOWY_RHZ_MYSTERIES[0];
      const beadsFormatted = mystery.cl.map(cl => buildFullHailMary(cl)).join('\n\n');

      const fullNowyRhzContent = `Etap ${mystery.stage}: ${mystery.stageTitle}
Część ${mystery.part}: ${mystery.partTitle}
Tajemnica: ${mystery.t} – ${mystery.sub}

Pismo Święte:
${mystery.ref}

Rozważanie:
${mystery.med}

Modlitwa Pańska:
${OJCZE_NASZ_PELNY}

${beadsFormatted}

Uwielbienie i Prośba:
${CHWALA_OJCU_PELNE}
${MODLITWA_FATIMSKA_PELNA}
${mystery.prayer ? `\nModlitwa na zakończenie:\n${mystery.prayer}` : ''}`.trim();

      return {
        id: `nowyRHZ-${cycleDate.dateKey}`,
        sectionId: 'nowyRHZ',
        dateKey: cycleDate.dateKey,
        dayNumber,
        title: `${mystery.t} – ${mystery.sub}`,
        subtitle: `${displayDate} • Nowy RHZ • Dzień ${day175} ze 175 (Etap ${mystery.stage}, Część ${mystery.part})`,
        mystery: `${mystery.t} – ${mystery.sub}`,
        intention: `Etap ${mystery.stage}: ${mystery.stageTitle} • Część ${mystery.part}: ${mystery.partTitle}`,
        passage: mystery.ref,
        content: fullNowyRhzContent,
        prayer: `${CHWALA_OJCU_PELNE}\n\n${MODLITWA_FATIMSKA_PELNA}${mystery.prayer ? `\n\n${mystery.prayer}` : ''}`.trim()
      };
    }

    case 'biblia365':
    case 'ebook_biblia': {
      const b1 = getBibliaEntryForDayAndYear(dayNumber, 1);
      return {
        id: `${sectionId}-${cycleDate.dateKey}`,
        sectionId,
        dateKey: cycleDate.dateKey,
        dayNumber,
        title: b1?.title || `Lektura Pisma Świętego i Apokryfów • Dzień ${dayNumber}`,
        subtitle: `${displayDate} • ${b1?.category || 'Biblia365'} (${b1?.passage || ''})`,
        passage: b1?.passage,
        apocryphaPassage: b1?.category?.includes('Apokryf') ? b1?.passage : undefined,
        content: b1?.content || `Dzień ${dayNumber} czytań biblijnych.`
      };
    }

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

    case 'mapa':
      return {
        id: `mapa-${cycleDate.dateKey}`,
        sectionId,
        dateKey: cycleDate.dateKey,
        dayNumber,
        title: `Pielgrzymka Gwiaździsta 2026 • Dzień ${dayNumber}`,
        subtitle: `${displayDate} • Szlak Orlich Gniazd i Sanktuaria`,
        content: `Informacje o Wielkiej Pielgrzymce Gwiaździstej 2026, Szlaku Orlich Gniazd i etapach pielgrzymowania ku Jasnej Górze i Łagiewnikom.`
      };

    case 'histada':
      return {
        id: `histada-${cycleDate.dateKey}`,
        sectionId,
        dateKey: cycleDate.dateKey,
        dayNumber,
        title: `Gra Histada • Dzień ${dayNumber}`,
        subtitle: `${displayDate} • Dzieje i historia`,
        content: `Trylogia gier edukacyjno-filozoficznych Histada – odkrywaj historię zbawienia, naukę i filozofię.`
      };

    case 'grafika':
      return {
        id: `grafika-${cycleDate.dateKey}`,
        sectionId,
        dateKey: cycleDate.dateKey,
        dayNumber,
        title: `Galeria Zasobów • Dzień ${dayNumber}`,
        subtitle: `${displayDate} • Materiały i Ilustracje`,
        content: `Repozytorium materiałów graficznych, okładek, ilustracji i plików multimedialnych Droga365.`
      };

    default:
      return {
        id: `${sectionId}-${cycleDate.dateKey}`,
        sectionId,
        dateKey: cycleDate.dateKey,
        dayNumber,
        title: `Dzień ${dayNumber} • ${sectionId}`,
        subtitle: `${displayDate} • ${season}`,
        content: `Wpis dla sekcji ${sectionId} na dzień ${dayNumber}.`
      };
  }
}
