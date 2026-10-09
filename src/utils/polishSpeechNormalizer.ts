/**
 * polishSpeechNormalizer.ts
 * Kompleksowy konwerter tekstu polskiego dla Lektora AI TTS oraz synchronizacji napisów karaoke.
 * 
 * Zamienia wszystkie skróty, sigla biblijne, daty oraz liczby na pełny tekst w języku polskim,
 * tak aby lektor odczytywał tekst bezbłędnie i naturalnie, a napisy z podświetlaniem słów
 * idealnie odpowiadały każdemu wypowiadanemu słowu bez rozjazdów i opóźnień.
 */

// 1. SŁOWNIK KSIĄG BIBLIJNYCH (STARY I NOWY TESTAMENT + APOKRYFY)
export const BIBLICAL_BOOKS_MAP: Record<string, string> = {
  // Stary Testament
  'Rdz': 'Księga Rodzaju',
  'Wj': 'Księga Wyjścia',
  'Kpł': 'Księga Kapłańska',
  'Lb': 'Księga Liczb',
  'Pwt': 'Księga Powtórzonego Prawa',
  'Joz': 'Księga Jozuego',
  'Sdz': 'Księga Sędziów',
  'Rt': 'Księga Rut',
  '1 Sm': 'Pierwsza Księga Samuela',
  '2 Sm': 'Druga Księga Samuela',
  '1 Krl': 'Pierwsza Księga Królewska',
  '2 Krl': 'Druga Księga Królewska',
  '1 Krn': 'Pierwsza Księga Kronik',
  '2 Krn': 'Druga Księga Kronik',
  'Ezd': 'Księga Ezdrasza',
  'Ne': 'Księga Nehemiasza',
  'Tb': 'Księga Tobiasza',
  'Jdt': 'Księga Judyty',
  'Est': 'Księga Estery',
  '1 Mch': 'Pierwsza Księga Machabejska',
  '2 Mch': 'Druga Księga Machabejska',
  'Hi': 'Księga Hioba',
  'Ps': 'Psalm',
  'Prz': 'Księga Przysłów',
  'Koh': 'Księga Koheleta',
  'Pnp': 'Pieśń nad Pieśniami',
  'Mdr': 'Księga Mądrości',
  'Syr': 'Mądrość Syracha',
  'Iz': 'Księga Izajasza',
  'Jr': 'Księga Jeremiasza',
  'Lm': 'Lamentacje Jeremiasza',
  'Bar': 'Księga Barucha',
  'Ez': 'Księga Ezechiela',
  'Dn': 'Księga Daniela',
  'Oz': 'Księga Ozeasza',
  'Jl': 'Księga Joela',
  'Am': 'Księga Amosa',
  'Ab': 'Księga Abdiasza',
  'Jon': 'Księga Jonasza',
  'Mi': 'Księga Micheasza',
  'Na': 'Księga Nahuma',
  'Ha': 'Księga Habakuka',
  'Sof': 'Księga Sofoniasza',
  'Ag': 'Księga Aggeusza',
  'Za': 'Księga Zachariasza',
  'Mal': 'Księga Malachiasza',

  // Nowy Testament
  'Mt': 'Ewangelia według świętego Mateusza',
  'Mk': 'Ewangelia według świętego Marka',
  'Łk': 'Ewangelia według świętego Łukasza',
  'Lk': 'Ewangelia według świętego Łukasza',
  'J': 'Ewangelia według świętego Jana',
  'Jn': 'Ewangelia według świętego Jana',
  'Dz': 'Dzieje Apostolskie',
  'Rz': 'List do Rzymian',
  '1 Kor': 'Pierwszy List do Koryntian',
  '2 Kor': 'Drugi List do Koryntian',
  'Ga': 'List do Galatów',
  'Ef': 'List do Efezjan',
  'Flp': 'List do Filipian',
  'Kol': 'List do Kolosan',
  '1 Tes': 'Pierwszy List do Tesaloniczan',
  '2 Tes': 'Drugi List do Tesaloniczan',
  '1 Tm': 'Pierwszy List do Tymoteusza',
  '2 Tm': 'Drugi List do Tymoteusza',
  'Tt': 'List do Tytusa',
  'Flm': 'List do Filemona',
  'Hbr': 'List do Hebrajczyków',
  'Jk': 'List świętego Jakuba',
  '1 P': 'Pierwszy List świętego Piotra',
  '2 P': 'Drugi List świętego Piotra',
  '1 J': 'Pierwszy List świętego Jana',
  '2 J': 'Drugi List świętego Jana',
  '3 J': 'Trzeci List świętego Jana',
  'Jud': 'List świętego Judy',
  'Ap': 'Apokalipsa świętego Jana'
};

// 2. LICZEBNIKI GŁÓWNE (KARDYNALNE)
const ONES = ['', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć'];
const TEENS = ['dziesięć', 'jedenaście', 'dwanaście', 'trzynaście', 'czternaście', 'piętnaście', 'szesnaście', 'siedemnaście', 'osiemnaście', 'dziewiętnaście'];
const TENS = ['', 'dziesięć', 'dwadzieścia', 'trzydzieści', 'czterdzieści', 'pięćdziesiąt', 'sześćdziesiąt', 'siedemdziesiąt', 'osiemdziesiąt', 'dziewięćdziesiąt'];
const HUNDREDS = ['', 'sto', 'dwieście', 'trzysta', 'czterysta', 'pięćset', 'sześćset', 'siedemset', 'osiemset', 'dziewięćset'];

/**
 * Zamienia liczbę całkowitą (0-9999) na polski liczebnik główny (np. 175 -> "sto siedemdziesiąt pięć")
 */
export function numberToPolishCardinal(n: number): string {
  if (n === 0) return 'zero';
  if (n < 0) return 'minus ' + numberToPolishCardinal(Math.abs(n));

  const parts: string[] = [];

  // Tysiące
  const thousands = Math.floor(n / 1000);
  const remainderAfterThousands = n % 1000;

  if (thousands > 0) {
    if (thousands === 1) {
      parts.push('tysiąc');
    } else if (thousands >= 2 && thousands <= 4) {
      parts.push(ONES[thousands] + ' tysiące');
    } else {
      parts.push(numberToPolishCardinal(thousands) + ' tysięcy');
    }
  }

  // Setki
  const hundreds = Math.floor(remainderAfterThousands / 100);
  const remainderAfterHundreds = remainderAfterThousands % 100;
  if (hundreds > 0) {
    parts.push(HUNDREDS[hundreds]);
  }

  // Dziesiątki i jedności
  if (remainderAfterHundreds >= 10 && remainderAfterHundreds <= 19) {
    parts.push(TEENS[remainderAfterHundreds - 10]);
  } else {
    const tens = Math.floor(remainderAfterHundreds / 10);
    const ones = remainderAfterHundreds % 10;
    if (tens > 0) parts.push(TENS[tens]);
    if (ones > 0) parts.push(ONES[ones]);
  }

  return parts.join(' ').trim();
}

// 3. LICZEBNIKI PORZĄDKOWE (ORDINALNE)
const ORD_MASC_ONES = ['', 'pierwszy', 'drugi', 'trzeci', 'czwarty', 'piąty', 'szósty', 'siódmy', 'ósmy', 'dziewiąty'];
const ORD_MASC_TEENS = ['dziesiąty', 'jedenasty', 'dwunasty', 'trzynasty', 'czternasty', 'piętnasty', 'szesnasty', 'siedemnasty', 'osiemnasty', 'dziewiętnasty'];
const ORD_MASC_TENS = ['', 'dziesiąty', 'dwudziesty', 'trzydziesty', 'czterdziesty', 'pięćdziesiąty', 'sześćdziesiąty', 'siedemdziesiąty', 'osiemdziesiąty', 'dziewięćdziesiąty'];
const ORD_MASC_HUNDREDS = ['', 'setny', 'dwusetny', 'trzechsetny', 'czterechsetny', 'pięćsetny', 'sześćsetny', 'siedemsetny', 'osiemsetny', 'dziewięćsetny'];

const ORD_FEM_ONES = ['', 'pierwsza', 'druga', 'trzecia', 'czwarta', 'piąta', 'szósta', 'siódma', 'ósma', 'dziewiąta'];
const ORD_FEM_TEENS = ['dziesiąta', 'jedenasta', 'dwunasta', 'trzynasta', 'czternasta', 'piętnasta', 'szesnasta', 'siedemnasta', 'osiemnasta', 'dziewiętnasta'];
const ORD_FEM_TENS = ['', 'dziesiąta', 'dwudziesta', 'trzydziesta', 'czterdziesta', 'pięćdziesiąta', 'sześćdziesiąta', 'siedemdziesiąta', 'osiemdziesiąta', 'dziewięćdziesiąta'];

const ORD_NEUT_ONES = ['', 'pierwsze', 'drugie', 'trzecie', 'czwarte', 'piąte', 'szóste', 'siódme', 'ósme', 'dziewiąte'];
const ORD_NEUT_TEENS = ['dziesiąte', 'jedenaste', 'dwunaste', 'trzynaste', 'czternaste', 'piętnaste', 'szesnaste', 'siedemnaste', 'osiemnaste', 'dziewiętnaste'];
const ORD_NEUT_TENS = ['', 'dziesiąte', 'dwudzieste', 'trzydzieste', 'czterdzieste', 'pięćdziesiąte', 'sześćdziesiąte', 'siedemdziesiąte', 'osiemdziesiąte', 'dziewięćdziesiąte'];

const ORD_GEN_ONES = ['', 'pierwszego', 'drugiego', 'trzeciego', 'czwartego', 'piątego', 'szóstego', 'siódmego', 'ósmego', 'dziewiątego'];
const ORD_GEN_TEENS = ['dziesiątego', 'jedenastego', 'dwunastego', 'trzynastego', 'czternastego', 'piętnastego', 'szesnastego', 'siedemnastego', 'osiemnastego', 'dziewiętnastego'];
const ORD_GEN_TENS = ['', 'dziesiątego', 'dwudziestego', 'trzydziestego', 'czterdziestego', 'pięćdziesiątego', 'sześćdziesiątego', 'siedemdziesiątego', 'osiemdziesiątego', 'dziewięćdziesiątego'];

/**
 * Zamienia liczbę na polski liczebnik porządkowy w mianowniku:
 * gender = 'm' (np. "Dzień pierwszy", "Rozdział sto siedemdziesiąty piąty")
 * gender = 'f' (np. "Część pierwsza", "Tajemnica druga")
 * gender = 'n' (np. "Dopowiedzenie pierwsze", "Dopowiedzenie dziesiąte")
 * gender = 'gen' (dopełniacz: "dnia dwudziestego pierwszego", "od pierwszego do dziesiątego")
 */
export function numberToPolishOrdinal(n: number, gender: 'm' | 'f' | 'n' | 'gen' = 'm'): string {
  if (n <= 0) return numberToPolishCardinal(n);

  const thousands = Math.floor(n / 1000);
  const remainder = n % 1000;
  const hundreds = Math.floor(remainder / 100);
  const remTens = remainder % 100;

  const prefixParts: string[] = [];
  if (thousands > 0) {
    if (remainder === 0) {
      if (thousands === 1) {
        if (gender === 'f') return 'tysięczna';
        if (gender === 'n') return 'tysięczne';
        if (gender === 'gen') return 'tysięcznego';
        return 'tysięczny';
      }
      if (thousands === 2) {
        if (gender === 'f') return 'dwutysięczna';
        if (gender === 'n') return 'dwutysięczne';
        if (gender === 'gen') return 'dwutysięcznego';
        return 'dwutysięczny';
      }
    }
    // W liczbach złożonych część wyższa jest kardynalna (np. "dwa tysiące dwudziesty")
    prefixParts.push(numberToPolishCardinal(thousands * 1000));
  }

  if (hundreds > 0) {
    if (remTens === 0 && prefixParts.length === 0) {
      if (gender === 'f') return ORD_MASC_HUNDREDS[hundreds].replace(/ny$/, 'na');
      if (gender === 'n') return ORD_MASC_HUNDREDS[hundreds].replace(/ny$/, 'ne');
      if (gender === 'gen') return ORD_MASC_HUNDREDS[hundreds].replace(/ny$/, 'nego');
      return ORD_MASC_HUNDREDS[hundreds];
    }
    prefixParts.push(HUNDREDS[hundreds]);
  }

  if (remTens === 0 && prefixParts.length > 0) {
    return prefixParts.join(' ').trim();
  }

  // Ostatni człon określa formę porządkową
  const tens = Math.floor(remTens / 10);
  const ones = remTens % 10;

  const lastParts: string[] = [];

  if (gender === 'f') {
    if (remTens >= 10 && remTens <= 19) {
      lastParts.push(ORD_FEM_TEENS[remTens - 10]);
    } else {
      if (tens > 0 && ones === 0) {
        lastParts.push(ORD_FEM_TENS[tens]);
      } else if (tens > 0 && ones > 0) {
        prefixParts.push(TENS[tens]);
        lastParts.push(ORD_FEM_ONES[ones]);
      } else if (ones > 0) {
        lastParts.push(ORD_FEM_ONES[ones]);
      }
    }
  } else if (gender === 'n') {
    if (remTens >= 10 && remTens <= 19) {
      lastParts.push(ORD_NEUT_TEENS[remTens - 10]);
    } else {
      if (tens > 0 && ones === 0) {
        lastParts.push(ORD_NEUT_TENS[tens]);
      } else if (tens > 0 && ones > 0) {
        prefixParts.push(TENS[tens]);
        lastParts.push(ORD_NEUT_ONES[ones]);
      } else if (ones > 0) {
        lastParts.push(ORD_NEUT_ONES[ones]);
      }
    }
  } else if (gender === 'gen') {
    if (remTens >= 10 && remTens <= 19) {
      lastParts.push(ORD_GEN_TEENS[remTens - 10]);
    } else {
      if (tens > 0 && ones === 0) {
        lastParts.push(ORD_GEN_TENS[tens]);
      } else if (tens > 0 && ones > 0) {
        prefixParts.push(TENS[tens]);
        lastParts.push(ORD_GEN_ONES[ones]);
      } else if (ones > 0) {
        lastParts.push(ORD_GEN_ONES[ones]);
      }
    }
  } else {
    // Męski ('m')
    if (remTens >= 10 && remTens <= 19) {
      lastParts.push(ORD_MASC_TEENS[remTens - 10]);
    } else {
      if (tens > 0 && ones === 0) {
        lastParts.push(ORD_MASC_TENS[tens]);
      } else if (tens > 0 && ones > 0) {
        prefixParts.push(TENS[tens]);
        lastParts.push(ORD_MASC_ONES[ones]);
      } else if (ones > 0) {
        lastParts.push(ORD_MASC_ONES[ones]);
      }
    }
  }

  return [...prefixParts, ...lastParts].join(' ').trim();
}

/**
 * Zamienia liczebnik główny w dopełniaczu dla konstrukcji "ze 175" lub "z 365"
 * np. 175 -> "stu siedemdziesięciu pięciu"
 * np. 365 -> "trzystu sześćdziesięciu pięciu"
 */
export function numberToPolishGenitiveCardinal(n: number): string {
  if (n === 175) return 'stu siedemdziesięciu pięciu';
  if (n === 365) return 'trzystu sześćdziesięciu pięciu';
  if (n === 366) return 'trzystu sześćdziesięciu sześciu';
  if (n === 10) return 'dziesięciu';
  if (n === 1) return 'jednego';
  if (n === 2) return 'dwóch';
  if (n === 3) return 'trzech';
  if (n === 4) return 'czterech';
  if (n === 5) return 'pięciu';

  // Ogólne przybliżenie dla pozostałych
  const card = numberToPolishCardinal(n);
  return card
    .replace(/\bsto\b/g, 'stu')
    .replace(/\bdwieście\b/g, 'dwustu')
    .replace(/\btrzysta\b/g, 'trzystu')
    .replace(/\bczterysta\b/g, 'czterystu')
    .replace(/\b(pięć|sześć|siedem|osiem|dziewięć)set\b/g, '$1set')
    .replace(/dziesiąt$/g, 'dziesięciu')
    .replace(/dzieści$/g, 'dziestu')
    .replace(/naście$/g, 'nastu')
    .replace(/\bjeden\b/g, 'jednego')
    .replace(/\bdwa\b/g, 'dwóch')
    .replace(/\btrzy\b/g, 'trzech')
    .replace(/\bcztery\b/g, 'czterech')
    .replace(/\bpięć\b/g, 'pięciu')
    .replace(/\bsześć\b/g, 'sześciu')
    .replace(/\bsiedem\b/g, 'siedmiu')
    .replace(/\bosiem\b/g, 'ośmiu')
    .replace(/\bdziewięć\b/g, 'dziewięciu')
    .replace(/\bdziesięć\b/g, 'dziesięciu');
}

/**
 * Zamienia zapis sigli biblijnych (np. "Rdz 1, 1-31", "Mt 5, 3-12", "J 3, 16", "Ps 23, 1-6")
 * na pełne, uroczyste zdanie lektorskie w języku polskim.
 */
export function expandBiblicalReference(ref: string): string {
  if (!ref) return '';
  let text = ref.trim();

  // Wyszukaj prefiks książki (np. "1 Sm", "2 Kor", "Rdz", "Mt", "Ps")
  for (const [abbr, fullName] of Object.entries(BIBLICAL_BOOKS_MAP)) {
    // Regex dopasowujący sigla np. Rdz 1, 1-31 lub 1 Kor 13, 1-13
    const regex = new RegExp(`(?:^|\\b)${abbr}\\s*(\\d+)(?:\\s*[,:]\\s*(\\d+)(?:\\s*[-–]\\s*(\\d+))?)?`, 'i');
    const match = text.match(regex);
    if (match) {
      const chapterNum = parseInt(match[1], 10);
      const verseStart = match[2] ? parseInt(match[2], 10) : null;
      const verseEnd = match[3] ? parseInt(match[3], 10) : null;

      const isPsalm = abbr.toLowerCase() === 'ps';
      const chapterTerm = isPsalm ? 'psalm' : 'rozdział';
      const chapterOrdinal = numberToPolishOrdinal(chapterNum, 'm');

      let expanded = `${fullName}, ${chapterTerm} ${chapterOrdinal}`;

      if (verseStart !== null && verseEnd !== null) {
        const vStartOrd = numberToPolishOrdinal(verseStart, 'gen');
        const vEndOrd = numberToPolishOrdinal(verseEnd, 'gen');
        expanded += `, wersety od ${vStartOrd} do ${vEndOrd}`;
      } else if (verseStart !== null) {
        const vStartOrd = numberToPolishOrdinal(verseStart, 'm');
        expanded += `, werset ${vStartOrd}`;
      }

      // Podmień w całym stringu
      text = text.replace(match[0], expanded);
      break;
    }
  }

  return text;
}

/**
 * Główna funkcja normalizująca tekst do pełnych polskich słów (dla Lektora AI i napisów karaoke).
 * Zamienia:
 * - Wszelkie liczby w konstrukcjach "Dzień X ze 175" -> "Dzień pierwszy ze stu siedemdziesięciu pięciu"
 * - "Etap X" -> "Etap pierwszy", "Część X" -> "Część pierwsza", "Tajemnica X" -> "Tajemnica pierwsza"
 * - "1. Zdrowaś Maryjo" -> "Dopowiedzenie pierwsze: Zdrowaś Maryjo"
 * - Sigla biblijne np. "Rdz 1, 1-31" -> "Księga Rodzaju, rozdział pierwszy, wersety od pierwszego do trzydziestego pierwszego"
 * - Wszystkie standardowe polskie skróty (św., bł., ks., o., np., itd., itp., tzn., m.in., zob., por., ok., r., km)
 * - Cyfry i liczby w pozostałym tekście
 */
export function normalizePolishTextForSpeech(rawText: string): string {
  if (!rawText) return '';
  let text = rawText;

  // 1. Usunięcie tagów HTML i encji
  text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  text = text.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&nbsp;/gi, ' ')
             .replace(/&amp;/gi, ' i ')
             .replace(/&quot;|&apos;|&#39;|&ldquo;|&rdquo;|&laquo;|&raquo;/gi, ' ')
             .replace(/&hellip;/gi, '. ')
             .replace(/&ndash;|&mdash;/gi, ', ')
             .replace(/&[a-zA-Z0-9#]+;/g, ' ');

  // 2. Usunięcie linków, adresów URL i znaków markdown
  text = text.replace(/https?:\/\/\S+/gi, ' ');
  text = text.replace(/www\.\S+/gi, ' ');
  text = text.replace(/[*#_~^|\\]/g, ' ');

  // 3. Rozwinięcie specyficznych nazw projektów i sekcji
  text = text.replace(/\bWnR365\b/g, 'Widoki na Raj trzysta sześćdziesiąt pięć');
  text = text.replace(/\bWnR\b/g, 'Widoki na Raj');
  text = text.replace(/\bRHZ365\b/g, 'Różaniec Historii Zbawienia trzysta sześćdziesiąt pięć');
  text = text.replace(/\bNowyRHZ\b/g, 'Nowy Różaniec Historii Zbawienia');
  text = text.replace(/\bNowy RHZ\b/g, 'Nowy Różaniec Historii Zbawienia');
  text = text.replace(/\bBiblia365\b/g, 'Biblia trzysta sześćdziesiąt pięć');
  text = text.replace(/\b24\/7\b/g, 'dwadzieścia cztery godziny na dobę, siedem dni w tygodniu');
  text = text.replace(/\bYouTube\b/gi, 'Jutjub');
  text = text.replace(/\bMP4\b/gi, 'em pe cztery');
  text = text.replace(/\b1080p\b/gi, 'tysiąc osiemdziesiąt pe');
  text = text.replace(/\b720p\b/gi, 'siedemset dwadzieścia pe');

  // 4. Rozwinięcie konstrukcji "Dzień X ze 175" / "Dzień X z 365"
  text = text.replace(/Dzień\s+(\d+)\s+ze\s+stu\s+siedemdziesięciu\s+pięciu/gi, (_, d) => {
    return `Dzień ${numberToPolishOrdinal(parseInt(d, 10), 'm')} ze stu siedemdziesięciu pięciu`;
  });
  text = text.replace(/Dzień\s+(\d+)\s+z\s+175\b/gi, (_, d) => {
    return `Dzień ${numberToPolishOrdinal(parseInt(d, 10), 'm')} ze stu siedemdziesięciu pięciu`;
  });
  text = text.replace(/Dzień\s+(\d+)\s+ze\s+175\b/gi, (_, d) => {
    return `Dzień ${numberToPolishOrdinal(parseInt(d, 10), 'm')} ze stu siedemdziesięciu pięciu`;
  });
  text = text.replace(/Dzień\s+(\d+)\s+z\s+365\b/gi, (_, d) => {
    return `Dzień ${numberToPolishOrdinal(parseInt(d, 10), 'm')} z trzystu sześćdziesięciu pięciu`;
  });
  text = text.replace(/Dzień\s+(\d+)\s+z\s+trzystu\s+sześćdziesięciu\s+pięciu/gi, (_, d) => {
    return `Dzień ${numberToPolishOrdinal(parseInt(d, 10), 'm')} z trzystu sześćdziesięciu pięciu`;
  });
  text = text.replace(/Dzień\s+(\d+)(?=[.,:\s]|$)/gi, (_, d) => {
    return `Dzień ${numberToPolishOrdinal(parseInt(d, 10), 'm')}`;
  });

  // 5. Rozwinięcie struktur: Etap X, Część X, Tajemnica X, Rozdział X, Rok X
  text = text.replace(/Etap\s+(\d+)\b/gi, (_, n) => `Etap ${numberToPolishOrdinal(parseInt(n, 10), 'm')}`);
  text = text.replace(/Część\s+(\d+)\b/gi, (_, n) => `Część ${numberToPolishOrdinal(parseInt(n, 10), 'f')}`);
  text = text.replace(/Tajemnica\s+(\d+)\b/gi, (_, n) => `Tajemnica ${numberToPolishOrdinal(parseInt(n, 10), 'f')}`);
  text = text.replace(/Rozdział\s+(\d+)\b/gi, (_, n) => `Rozdział ${numberToPolishOrdinal(parseInt(n, 10), 'm')}`);
  text = text.replace(/Rok\s+(\d+)\b/gi, (_, n) => `Rok ${numberToPolishOrdinal(parseInt(n, 10), 'm')}`);

  // 6. Rozwinięcie numeracji dopowiedzeń różańcowych:
  // "1. Zdrowaś Maryjo" -> "Dopowiedzenie pierwsze: Zdrowaś Maryjo"
  // "10. Zdrowaś Maryjo" -> "Dopowiedzenie dziesiąte: Zdrowaś Maryjo"
  text = text.replace(/(?:^|\n|\.\s*)(\d{1,2})\.\s*Zdrowaś\s*Maryjo/gi, (_, n) => {
    const num = parseInt(n, 10);
    return `. Dopowiedzenie ${numberToPolishOrdinal(num, 'n')}: Zdrowaś Maryjo`;
  });

  // 7. Rozwinięcie sigli i odnośników biblijnych (np. Rdz 1, 1-31; Mt 5, 3-12)
  for (const [abbr, fullName] of Object.entries(BIBLICAL_BOOKS_MAP)) {
    const regex = new RegExp(`(?<!\\p{L})${abbr}\\s+(\\d+)\\s*[,:]\\s*(\\d+)(?:\\s*[-–]\\s*(\\d+))?(?!\\p{L})`, 'gui');
    text = text.replace(regex, (_, ch, v1, v2) => {
      const chNum = parseInt(ch, 10);
      const v1Num = parseInt(v1, 10);
      const isPsalm = abbr.toLowerCase() === 'ps';
      const term = isPsalm ? 'psalm' : 'rozdział';
      const chOrd = numberToPolishOrdinal(chNum, 'm');

      if (v2) {
        const v2Num = parseInt(v2, 10);
        return `${fullName}, ${term} ${chOrd}, wersety od ${numberToPolishOrdinal(v1Num, 'gen')} do ${numberToPolishOrdinal(v2Num, 'gen')}`;
      } else {
        return `${fullName}, ${term} ${chOrd}, werset ${numberToPolishOrdinal(v1Num, 'm')}`;
      }
    });

    // Rozdział bez wersetów np. "Ps 23"
    const regexChapterOnly = new RegExp(`(?<!\\p{L})${abbr}\\s+(\\d+)(?!\\p{L})`, 'gui');
    text = text.replace(regexChapterOnly, (_, ch) => {
      const chNum = parseInt(ch, 10);
      const isPsalm = abbr.toLowerCase() === 'ps';
      const term = isPsalm ? 'psalm' : 'rozdział';
      return `${fullName}, ${term} ${numberToPolishOrdinal(chNum, 'm')}`;
    });
  }

  // 8. Rozwinięcie polskich skrótów kościelnych i językowych
  text = text.replace(/(?<!\p{L})św\.\s*(?=[A-ZĄĆĘŁŃÓŚŹŻ])/gu, 'świętego ');
  text = text.replace(/(?<!\p{L})św\.\s*/gui, 'świętego ');
  text = text.replace(/(?<!\p{L})bł\.\s*(?=[A-ZĄĆĘŁŃÓŚŹŻ])/gu, 'błogosławionego ');
  text = text.replace(/(?<!\p{L})bł\.\s*/gui, 'błogosławionego ');
  text = text.replace(/(?<!\p{L})ks\.\s*/gui, 'ksiądz ');
  text = text.replace(/(?<!\p{L})o\.\s*(?=[A-ZĄĆĘŁŃÓŚŹŻ])/gu, 'ojciec ');
  text = text.replace(/(?<!\p{L})bp\.\s*|(?<!\p{L})bp(?!\p{L})/gui, 'biskup ');
  text = text.replace(/(?<!\p{L})abp\.\s*|(?<!\p{L})abp(?!\p{L})/gui, 'arcybiskup ');
  text = text.replace(/(?<!\p{L})kard\.\s*|(?<!\p{L})kard(?!\p{L})/gui, 'kardynał ');

  text = text.replace(/(?<!\p{L})np\.\s*/gui, 'na przykład ');
  text = text.replace(/(?<!\p{L})itd\.\s*/gui, 'i tak dalej. ');
  text = text.replace(/(?<!\p{L})itp\.\s*/gui, 'i tym podobne. ');
  text = text.replace(/(?<!\p{L})tzn\.\s*/gui, 'to znaczy ');
  text = text.replace(/(?<!\p{L})m\.in\.\s*/gui, 'między innymi ');
  text = text.replace(/(?<!\p{L})zob\.\s*/gui, 'zobacz ');
  text = text.replace(/(?<!\p{L})por\.\s*/gui, 'porównaj ');
  text = text.replace(/(?<!\p{L})ok\.\s*/gui, 'około ');
  text = text.replace(/(?<!\p{L})tzw\.\s*/gui, 'tak zwany ');
  text = text.replace(/(?<!\p{L})rozdz\.\s*/gui, 'rozdział ');
  text = text.replace(/(?<!\p{L})w\.\s*(?=\d)/gui, 'werset ');
  text = text.replace(/(?<!\p{L})ww\.\s*(?=\d)/gui, 'wersety ');
  text = text.replace(/(?<!\p{L})godz\.\s*/gui, 'godzina ');
  text = text.replace(/(?<!\p{L})min\.\s*/gui, 'minut ');

  // 9. Daty: np. "21 czerwca 2026 r." lub "18.06"
  text = text.replace(/(\d{1,2})\s*czerwca\s*(\d{4})\s*r?\.?/gi, (_, d, y) => {
    return `${numberToPolishOrdinal(parseInt(d, 10), 'gen')} czerwca ${numberToPolishOrdinal(parseInt(y, 10), 'gen')} roku`;
  });
  text = text.replace(/(\d{1,2})\s*(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)/gi, (_, d, m) => {
    return `${numberToPolishOrdinal(parseInt(d, 10), 'gen')} ${m}`;
  });
  text = text.replace(/(\d{4})\s*r\.\s*/gui, (_, y) => {
    return `${numberToPolishOrdinal(parseInt(y, 10), 'gen')} roku `;
  });

  // 10. Jednostki i godziny
  text = text.replace(/(\d+)\s*km\b/gi, (_, k) => {
    const num = parseInt(k, 10);
    const card = numberToPolishCardinal(num);
    const form = (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20)) ? 'kilometry' : 'kilometrów';
    return `${card} ${form}`;
  });
  text = text.replace(/(\d{1,2}):(\d{2})/g, (_, h, m) => {
    const hNum = parseInt(h, 10);
    const mNum = parseInt(m, 10);
    if (mNum === 0) {
      return `godzina ${numberToPolishOrdinal(hNum, 'f')}`;
    }
    return `godzina ${hNum} ${mNum}`;
  });

  // 11. Rozwinięcie pozostałych liczb i cyfr w tekście
  // Liczby z kropką (np. "1.", "2.", "3.") -> "pierwsze.", "drugie.", "trzecie."
  text = text.replace(/(?:^|\s)(\d{1,3})\.(?=\s|$)/g, (_, d) => {
    return ` ${numberToPolishOrdinal(parseInt(d, 10), 'n')}.`;
  });

  // Dowolne pozostałe cyfry (np. 10, 25, 100) -> zamiana na liczebniki główne
  text = text.replace(/\b\d+\b/g, (match) => {
    const num = parseInt(match, 10);
    if (isNaN(num)) return match;
    return numberToPolishCardinal(num);
  });

  // 12. Usunięcie cudzysłowów, aby syntezator mowy nie wymawiał słowa "cudzysłów"
  text = text.replace(/[„”«»\"“’'‘`´]/g, ' ');

  // 13. Usunięcie nawiasów i niepotrzebnych znaków
  text = text.replace(/[(){}\[\]]/g, ', ');

  // 14. Normalizacja interpunkcji i spacji
  text = text.replace(/\s*([,.;?!:])\s*/g, '$1 ');
  text = text.replace(/([.?!])\s*[.?!]+/g, '$1 ');
  text = text.replace(/\s+,/g, ',');
  text = text.replace(/,\s*\./g, '.');
  text = text.replace(/,\s*,+/g, ',');
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Zwraca tablicę czystych słów ze znormalizowanego tekstu, idealną do synchronizacji karaoke.
 */
export function extractCleanWordsForKaraoke(normalizedText: string): string[] {
  if (!normalizedText) return [];
  return normalizedText
    .replace(/[\n\r\t]+/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 0);
}

/**
 * Dzieli tekst na bezpieczne fragmenty dla silnika Google TTS (maksymalnie 140 znaków).
 * Dzieli według zdań (.!?), a dłuższe zdania według klauzul (,;:) oraz granic słów.
 * Gwarantuje, że żaden fragment nie przekroczy limitu znaków i nie zostanie odrzucony przez TTS.
 */
export function splitTextForTts(text: string, maxChunkLen: number = 140): string[] {
  if (!text || !text.trim()) return [];
  const clean = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. Podział na zdania
  const rawSentences = clean.split(/(?<=[.!?\n])\s+/).filter(s => s.trim().length > 0);
  const chunks: string[] = [];

  for (const sentence of rawSentences) {
    if (sentence.length <= maxChunkLen) {
      chunks.push(sentence);
      continue;
    }

    // 2. Podział długiego zdania po przecinkach, średnikach, dwukropkach
    const clauses = sentence.split(/(?<=[,;:])\s+/).filter(c => c.trim().length > 0);
    let currentClause = '';

    for (const clause of clauses) {
      if (clause.length > maxChunkLen) {
        // Jeśli pojedyncza klauzula jest za długa, dzielimy bezpiecznie po słowach
        const words = clause.split(/\s+/).filter(Boolean);
        let curWordChunk = '';
        for (const w of words) {
          if (!curWordChunk) {
            curWordChunk = w;
          } else if ((curWordChunk + ' ' + w).length <= maxChunkLen) {
            curWordChunk += ' ' + w;
          } else {
            chunks.push(curWordChunk);
            curWordChunk = w;
          }
        }
        if (curWordChunk) chunks.push(curWordChunk);
      } else if (!currentClause) {
        currentClause = clause;
      } else if ((currentClause + ' ' + clause).length <= maxChunkLen) {
        currentClause += ' ' + clause;
      } else {
        chunks.push(currentClause);
        currentClause = clause;
      }
    }
    if (currentClause) {
      chunks.push(currentClause);
    }
  }

  return chunks.filter(c => c.trim().length > 0);
}

/**
 * Oblicza wagę czasu trwania słowa w oparciu o fonetykę polską (samogłoski/sylaby)
 * oraz naturalne pauzy akustyczne na interpunkcję i przejścia modlitewne w różańcu.
 */
export function calculateWordAcousticWeight(word: string, isSegmentEnd: boolean = false): number {
  if (!word) return 1;
  const cleanWord = word.replace(/[^a-ząćęłńóśźżA-ZĄĆĘŁŃÓŚŹŻ0-9]/g, '');
  const vowels = (cleanWord.match(/[aąeęioóuyAĄEĘIOÓUY]/g) || []).length;
  
  // 1. Bazowa waga fonetyczna:
  // Krótkie słowa ("w", "z", "i", "do", "Ty") trwają ~0.20-0.25s, nie ułamek milisekundy
  let weight = Math.max(1.8, vowels * 1.1 + Math.max(1, cleanWord.length * 0.15));

  // 2. Akustyczna pauza na przecinek, średnik, dwukropek (~0.35s - 0.45s)
  if (/[,;:]$/.test(word)) {
    weight += 2.4;
  }
  
  // 3. Akustyczna pauza na koniec zdania (. ! ?) (~0.70s - 0.90s)
  if (/[.!?]$/.test(word)) {
    weight += 4.5;
  }

  // 4. Koniec paciorka różańca (przejście między modlitwami) (~1.2s)
  if (isSegmentEnd) {
    weight += 6.0;
  }

  return weight;
}
