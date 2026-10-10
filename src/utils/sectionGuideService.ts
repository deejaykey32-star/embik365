import { SectionId } from '../types';
import { 
  playLectorSpeech, 
  stopLectorSpeech, 
  getLectorConfig, 
  unlockMobileAudio,
  getLectorPlaybackState,
  LectorPlaybackState
} from './audioLectorService';
import { PILGRIMAGE_LECTOR_SCRIPT } from '../components/PilgrimageMapView';

export interface SectionGuideItem {
  id: string;
  sectionName: string;
  title: string;
  subtitle: string;
  script: string;
  badge: string;
}

export const SECTION_GUIDES: Record<string, SectionGuideItem> = {
  info365: {
    id: 'info365',
    sectionName: 'Strona Główna • info365',
    title: 'Przewodnik po Portalu Widoki na Raj & Droga365',
    subtitle: 'Wprowadzenie do rocznego cyklu 365 dni, 14 sekcji portalu i funkcji lektora AI',
    badge: 'Przewodnik Portalu',
    script: `Witaj na oficjalnym portalu Widoki na Raj oraz w projekcie Droga365.

Jestem Twoim cyfrowym przewodnikiem AI. Z radością opowiem Ci, jak odnaleźć się na naszej stronie i w pełni korzystać z bogactwa wszystkich jej sekcji.

Cały portal opiera się na rocznym cyklu czytań i rozważań, który trwa od 25 grudnia – dnia Bożego Narodzenia – do 24 grudnia kolejnego roku. Każdy dzień ma swój unikalny numer od 1 do 365, a w roku przestępnym do 366.

Na górnym pasku nawigacji znajdziesz kontrolki daty: możesz przejść do dzisiejszego dnia przyciskiem Dzisiaj, wędrować strzałkami dzień po dniu lub otworzyć Kalendarz, aby wybrać dowolny dzień w roku. Obok znajduje się ikona lupy, która otwiera szybką wyszukiwarkę tekstów w całym portalu.

Oto krótki przewodnik po sekcjach, które znajdziesz w górnym menu:

Po pierwsze: WnR365, czyli Widoki na Raj. To blog duchowy i codzienne rozważania pomagające patrzeć na codzienność z perspektywy wieczności.

Po drugie: RHZ365, czyli Różaniec Historii Zbawienia. Modlitwa różańcowa prowadząca przez całe dzieje zbawienia, z medytacjami i dopowiedzeniami.

Po trzecie: Nowy RHZ – interaktywna aplikacja modlitewna na 175 dni, podzielona na 7 etapów, 5 części i 5 tajemnic, ze zliczaniem dziesiątek i automatycznym głosem online.

Po czwarte: Biblia365 i Apokryfy. Roczny plan czytania Słowa Bożego wraz z cennymi tekstami wczesnochrześcijańskimi.

Po piąte: Sekcja Mapa – poświęcona Wielkiej Pielgrzymce Gwiaździstej 2026 oraz pieszemu Szlakowi Orlich Gniazd z Częstochowy do Łagiewnik. Znajdziesz tam interaktywne mapy, trasy w Google Maps, pliki CSV oraz nagranie audioprzewodnika.

Po szóste: Histada – autorska trylogia gier kulturowo-historycznych dla poszukujących prawdy, łącząca historię, naukę, filozofię i wiarę.

Po siódme: E-booki w formie flipbooków z realistycznym przewracaniem kartek: Księga Widoki na Raj, Modlitewnik RHZ oraz Księga Biblii i Apokryfów.

Po ósme: Bio365 – osobista autobiografia małżeńska pod tytułem Ja i Moja Żona, rozpisana na 365 dni wspomnień i świadectwa.

Po dziewiąte: Radio 24/7 – internetowe radio nadające cztery stacje w pętli dzień i noc, z ciągłym lektorem AI i podsłuchem na żywo.

Po dziesiąte: Galeria Zasobów i Grafika365 – repozytorium ilustracji, okładek i kodów QR.

I po jedenaste: Wideo YouTube – dedykowany generator plików MP4 z czarnym tłem, animacją koralików różańcowych, napisami karaoke i lektorem mowy.

W każdej chwili możesz włączyć lektora online przyciskiem ze słuchawkami. Nasz głos działa w chmurze i czyta płynnie bez zacinania. Możesz także pobierać całe dzieła w formacie PDF, ePUB i Word w 16 językach świata.

Życzymy pięknego i owocnego czasu na portalu Widoki na Raj!`
  },

  mapa: {
    id: 'mapa',
    sectionName: 'Mapa Pielgrzymki',
    title: 'Wielka Pielgrzymka Gwiaździsta 2026 & Szlak Orlich Gniazd',
    subtitle: 'Symbolika dwóch gwiazd, Trójkąt Trójcy Świętej, 7 dni szlaku i przesilenie 21 czerwca',
    badge: 'Audioprzewodnik Szlaku',
    script: PILGRIMAGE_LECTOR_SCRIPT
  },

  wnr365: {
    id: 'wnr365',
    sectionName: 'WnR365 • Widoki na Raj',
    title: 'Przewodnik po Blogu Widoki na Raj',
    subtitle: 'Codzienne spojrzenie na rzeczywistość oczami wiary, nadziei i perspektywy wieczności',
    badge: 'Blog 365',
    script: `Witaj w sekcji Widoki na Raj – WnR365.

Jest to serce naszego portalu: codzienny blog duchowy oraz medytacje na każdy z 365 dni roku.

Głównym przesłaniem dzieła Widoki na Raj jest zaproszenie, aby na każdy trud, radość, chorobę, relację i wyzwanie naszej codzienności spojrzeć z perspektywy wieczności i Bożej logiki miłości.

Jak korzystać z tej sekcji:
Na górze strony możesz wybrać dowolny dzień cyklu. Każdy wpis zawiera przewodni tytuł, głębokie rozważanie duchowe, modlitwę oraz dołączone kody QR prowadzące do materiałów dodatkowych.

Możesz w każdej chwili kliknąć przycisk Odsłuchaj z ikoną głośnika lub słuchawek. Nasz internetowy lektor AI przeczyta dla Ciebie cały wpis płynnym, ciepłym głosem online bez zacinania.

Możesz także włączyć tryb ciągłego czytania, aby po zakończeniu jednego wpisu aplikacja automatycznie przeszła do następnego dnia.

Życzymy głębokich i inspirujących spotkań z Bogiem w każdym dniu roku!`
  },

  rhz365: {
    id: 'rhz365',
    sectionName: 'RHZ365 • Różaniec Historii Zbawienia',
    title: 'Przewodnik po Różańcu Historii Zbawienia',
    subtitle: 'Modlitwa różańcowa prowadząca przez całe dzieje biblijne od Stworzenia po Nowe Jeruzalem',
    badge: 'Modlitwa 365',
    script: `Witaj w sekcji Różaniec Historii Zbawienia – RHZ365.

Jest to wyjątkowy modlitewnik różańcowy, który przeprowadza nas przez całą historię zbawienia: od Księgi Rodzaju i Stworzenia świata, przez Przymierza z patriarchami, proroków, Wcielenie i Paschę Jezusa Chrystusa, aż po Zesłanie Ducha Świętego i chwałę Nowego Jeruzalem w Apokalipsie.

W tej sekcji każdy dzień roku ma przypisaną odrębną tajemnicę i medytację. Do każdego dziesiątka różańca przygotowano dopowiedzenia wplecione w modlitwę Zdrowaś Maryjo, które pomagają utrzymać skupienie i wejść w głąb biblijnego wydarzenia.

Skorzystaj z przycisku Lektora AI, aby odsłuchać rozważanie i modlitwę na dany dzień. Możesz także otworzyć interaktywny Przewodnik Modlitewny lub pobrać pełny modlitewnik do druku i formatu ePUB.`
  },

  nowyRHZ: {
    id: 'nowyRHZ',
    sectionName: 'Nowy RHZ • 175 Dni Modlitwy',
    title: 'Przewodnik po Aplikacji Nowy RHZ',
    subtitle: '7 etapów × 5 części × 5 tajemnic z interaktywnym zliczaniem dziesiątek i lektorem online',
    badge: 'Nowy RHZ 175',
    script: `Witaj w sekcji Nowy RHZ – Nowy Różaniec Historii Zbawienia.

Jest to interaktywna aplikacja różańcowa rozpisana na 175 dni modlitwy. Dzieło podzielone jest na 7 wielkich etapów duchowych. Każdy etap liczy 5 części, a każda część zawiera 5 tajemnic, co daje dokładnie 175 dni kontemplacji Bożych dzieł.

Aplikacja oferuje:
Interaktywny podgląd koralików różańcowych i zliczanie odmawianych dziesiątek.
Pełny głos lektora AI online, który odczytuje zapowiedź tajemnicy, fragment Pisma Świętego oraz dopowiedzenia różańcowe.
Automatyczne przechodzenie do kolejnych tajemnic, tryb skupienia na pełnym ekranie oraz możliwość wygenerowania pliku wideo MP4 do serwisu YouTube.

Wybierz etap i dzień z listy powyżej i rozpocznij modlitwę z żywym słowem Bożym!`
  },

  biblia365: {
    id: 'biblia365',
    sectionName: 'Biblia365 & Apokryfy',
    title: 'Przewodnik po Sekcji Biblia365 i Apokryfy',
    subtitle: 'Roczny cykl lektury Słowa Bożego wraz z cennymi tekstami wczesnochrześcijańskimi',
    badge: 'Słowo Boże',
    script: `Witaj w sekcji Biblia365 i Apokryfy.

Przed Tobą kompletny roczny program czytania Pisma Świętego Starego i Nowego Testamentu, wzbogacony o bezcenne apokryfy i teksty wczesnochrześcijańskie z pierwszych wieków Kościoła.

Każdego dnia otrzymujesz starannie dobrane czytania: fragmenty natchnione oraz komentarze historyczno-duchowe, które rzucają nowe światło na tradycję biblijną.

Możesz odsłuchać czytania za pomocą lektora online – nasz system automatycznie rozwija skróty ksiąg i usuwa zbędne sigla, dzięki czemu lektura brzmi naturalnie i płynnie.

Użyj menu wyboru roku, aby przejść przez wieloletni cykl biblijny lub pobierz księgę w formacie e-booka do czytnika.`
  },

  histada: {
    id: 'histada',
    sectionName: 'Histada • Dzieje i Historia',
    title: 'Przewodnik po Projekcie i Grze Histada',
    subtitle: 'Autorska trylogia dla poszukujących prawdy: historia, nauka, kultura, filozofia i wiara',
    badge: 'Gra Histada',
    script: `Witaj w sekcji Histada. Hasło tego projektu brzmi: Dzieje i historia – historia się dzieje.

Histada to autorska trylogia gier i interaktywna platforma internetowa dostępna pod adresem histada-app.pages.dev, stworzona dla wszystkich ludzi poszukujących prawdy o świecie, człowieku i Bogu.

Projekt łączy w fascynujący sposób historię powszechną, odkrycia naukowe, dorobek kultury, wielkie pytania filozoficzne oraz duchowe doświadczenie wiary.

Trylogia składa się z trzech części:
Część pierwsza: Świt i Narodziny Myśli – podróż do początków cywilizacji, narodzin pisma, pierwszych praw i wielkich kultur starożytności.
Część druga: Zmaganie Epok i Dziedzictwo – wieki średniowiecza, renesansu, narodziny uniwersytetów, relacja rozumu i wiary oraz odpowiedzialność za wolność.
I część trzecia: Horyzont Wieczności – zderzenie postępu technicznego z etyką miłości, współczesne wyzwania i nadzieja na Nowe Stworzenie.

Możesz uruchomić grę bezpośrednio w oknie poniżej, otworzyć ją na pełnym ekranie lub przejść do oficjalnej platformy histada-app.pages.dev. Życzymy fascynującej podróży przez dzieje ludzkości!`
  },

  ebook_wnr: {
    id: 'ebook_wnr',
    sectionName: 'Księga Widoki na Raj (Flipbook)',
    title: 'Przewodnik po Interaktywnej Księdze WnR365',
    subtitle: 'Wydanie w formie realistycznego flipbooka z przewracaniem stron (1084 strony, format Amazon KDP)',
    badge: 'Flipbook WnR',
    script: `Witaj w interaktywnym wydaniu Księgi Widoki na Raj – WnR365.

Ta sekcja prezentuje całe 1084-stronicowe dzieło bloga duchowego w formie bibliofilskiej księgi z realistycznym efektem przewracania kartek. Plik odpowiada dokładnie wydaniu przygotowanemu do druku na żądanie w Amazon KDP.

Możesz przewracać strony klikając w rogi kartek, przeciągając je myszką lub palcem na ekranie dotykowym, a także używając strzałek nawigacji.

Dostępny jest tryb pełnoekranowy, spis treści, powiększenie tekstu oraz lektor online, który odczytuje stronę za stroną. Możesz również pobrać oryginalny plik PDF książki przygotowany do druku.`
  },

  ebook_rhz: {
    id: 'ebook_rhz',
    sectionName: 'Modlitewnik RHZ (Flipbook)',
    title: 'Przewodnik po Wirtualnym Modlitewniku RHZ365',
    subtitle: 'Różaniec Historii Zbawienia w oprawie pięknej księgi z ilustracjami tajemnic',
    badge: 'Flipbook RHZ',
    script: `Witaj w wirtualnym modlitewniku różańcowym RHZ365 w formie przewracanych kartek.

Księga łączy w sobie pełne teksty medytacji różańcowych, kolorowe ilustracje poszczególnych tajemnic historii zbawienia, modlitwy i pieśni.

Przewracaj strony w wygodnym dla siebie tempie, włącz pełny ekran lub posłuchaj lektora online. Możesz w każdej chwili pobrać modlitewnik w formacie PDF i zabrać go ze sobą do kościoła lub w podróż.`
  },

  ebook_biblia: {
    id: 'ebook_biblia',
    sectionName: 'Księga Biblii & Apokryfów (Flipbook)',
    title: 'Przewodnik po Księdze Słowa i Apokryfów',
    subtitle: 'Pergaminowe karty Pisma Świętego i wczesnochrześcijańskich tekstów w formacie flipbooka',
    badge: 'Flipbook Biblia',
    script: `Witaj w bibliofilskim wydaniu Księgi Słowa Bożego i Apokryfów.

Stworzyliśmy to wydanie z myślą o miłośnikach tradycyjnych, pergaminowych woluminów. Znajdziesz tu roczny zestaw tekstów natchnionych oraz komentarzy apokryficznych w eleganckiej, klasycznej oprawie graficznej.

Korzystaj z nawigacji flipbooka, zakładaj wirtualne zakładki, odsłuchuj teksty lektorem online i pobieraj cyfrowe wydania do czytników e-booków.`
  },

  bio365: {
    id: 'bio365',
    sectionName: 'Bio365 • Ja i Moja Żona',
    title: 'Przewodnik po Autobiografii Małżeńskiej Bio365',
    subtitle: 'Wspomnienia, świadectwo i droga życia Dominika i jego ukochanej żony rozpisane na 365 dni',
    badge: 'Autobiografia',
    script: `Witaj w sekcji Bio365 – Autobiografii małżeńskiej pod tytułem Ja i Moja Żona.

Jest to głęboko osobiste, pełne miłości, wdzięczności i prawdy świadectwo wspólnej drogi życia autora, Dominika, i jego ukochanej żony.

365 dni to 365 wspomnień, refleksji nad budowaniem relacji, przezwyciężaniem trudności, pięknem sakramentu małżeństwa oraz Bożą opieką w codzienności.

Dzieło jest dostępne w formie interaktywnej księgi z przewracaniem kartek oraz z głosem lektora online, który czyta wspomnienia dzień po dniu.`
  },

  radio: {
    id: 'radio',
    sectionName: 'Radio 24/7 • Internetowe Radio',
    title: 'Przewodnik po Internetowym Radiu Widoki na Raj',
    subtitle: '4 stacje nadające w pętli 24 godziny na dobę z automatycznym lektorem AI i ramówką na żywo',
    badge: 'Radio 24/7',
    script: `Witaj w Internetowym Radiu Widoki na Raj.

Nasze radio nadaje nieprzerwanie w pętli 24 godziny na dobę, 7 dni w tygodniu, emitując cztery niezależne stacje radiowe z automatycznym lektorem AI:

Stacja pierwsza: Nowy RHZ – 175 dni modlitwy różańcowej z dopowiedzeniami.
Stacja druga: Widoki na Raj – codzienne wpisy bloga duchowego WnR365.
Stacja trzecia: Biblia i Apokryfy – codzienna lektura Słowa Bożego i pism wczesnochrześcijańskich.
Oraz stacja czwarta: Pierwotny Różaniec Historii Zbawienia – 365 dni modlitwy różańcowej.

Możesz przełączać stacje jednym kliknięciem, sprawdzać aktualną ramówkę na żywo, podsłuchiwać audycję w tle podczas przeglądania innych stron portalu, a także przejść do generatora wideo, aby stworzyć gotowy plik na YouTube.`
  },

  grafika: {
    id: 'grafika',
    sectionName: 'Grafika365 • Materiały & Ilustracje',
    title: 'Przewodnik po Repozytorium Materiałów Graficznych',
    subtitle: 'Galeria ilustracji, okładek książek, pakietów multimedialnych i kodów QR 300 DPI',
    badge: 'Grafika & Media',
    script: `Witaj w Repozytorium Materiałów Graficznych i Ilustracji – Grafika365.

Sekcja ta gromadzi wszystkie ilustracje, okładki wydań drukowanych, banery promocyjne, materiały multimedialne oraz pliki przesłane i zarządzane przez administratora serwisu.

Każdy zasób posiada automatycznie generowany kod QR w jakości druku 300 DPI oraz stały skrócony adres internetowy clck.ru, gotowy do umieszczenia w książkach, plakatach i mediach społecznościowych.

Możesz filtrować materiały według kategorii, pobierać grafiki w pełnej rozdzielczości, a zalogowany administrator ma dostęp do edytora treści i przesyłania nowych plików.`
  },

  wideo: {
    id: 'wideo',
    sectionName: 'Wideo YouTube • Generator MP4',
    title: 'Przewodnik po Generatorze Wideo YouTube (MP4)',
    subtitle: 'Generator filmów Full HD z czarnym tłem, animacją koralików różańcowych, lektorem AI i napisami karaoke',
    badge: 'Generator Wideo',
    script: `Witaj w dedykowanym Generatorze Wideo YouTube MP4.

To zaawansowane studio umożliwia tworzenie gotowych plików wideo w jakości Full HD 1080p oraz 720p dla serwisu YouTube ze wszystkich czterech dzieł portalu.

Filmy posiadają eleganckie, czarne tło oszczędzające wzrok, płynną animację koralików różańcowych, zsynchronizowane napisy karaoke podświetlające czytane słowa oraz czysty głos lektora AI online.

Wybierz stację i numer dnia, dopasuj rozdzielczość i kliknij Generuj wideo MP4. Wygenerowany plik pobierzesz bezpośrednio na dysk swojego komputera lub telefonu.`
  }
};

export function getSectionGuide(sectionId: string): SectionGuideItem {
  const normalized = sectionId === 'wnr366' ? 'wnr365' : sectionId;
  return SECTION_GUIDES[normalized] || SECTION_GUIDES['info365'];
}

let activeGuideSectionId: string | null = null;

export function getActiveGuideSectionId(): string | null {
  return activeGuideSectionId;
}

export async function playSectionGuideLector(
  sectionId: string, 
  overrideLang?: string,
  onStartCb?: () => void,
  onEndCb?: () => void
): Promise<void> {
  const guide = getSectionGuide(sectionId);
  const cfg = { ...getLectorConfig(), mode: 'online' as const };

  unlockMobileAudio();
  stopLectorSpeech();

  activeGuideSectionId = guide.id;
  window.dispatchEvent(new CustomEvent('drogowskazy_section_guide_changed', { detail: { sectionId: guide.id, playing: true } }));

  await playLectorSpeech({
    text: guide.script,
    config: cfg,
    overrideLang: overrideLang || 'pl',
    title: `${guide.badge} • ${guide.title}`,
    sectionName: guide.sectionName,
    onStart: () => {
      activeGuideSectionId = guide.id;
      window.dispatchEvent(new CustomEvent('drogowskazy_section_guide_changed', { detail: { sectionId: guide.id, playing: true } }));
      if (onStartCb) onStartCb();
    },
    onEnd: () => {
      activeGuideSectionId = null;
      window.dispatchEvent(new CustomEvent('drogowskazy_section_guide_changed', { detail: { sectionId: null, playing: false } }));
      if (onEndCb) onEndCb();
    },
    onError: () => {
      activeGuideSectionId = null;
      window.dispatchEvent(new CustomEvent('drogowskazy_section_guide_changed', { detail: { sectionId: null, playing: false } }));
      if (onEndCb) onEndCb();
    }
  });
}

export function stopSectionGuideLector(): void {
  activeGuideSectionId = null;
  stopLectorSpeech();
  window.dispatchEvent(new CustomEvent('drogowskazy_section_guide_changed', { detail: { sectionId: null, playing: false } }));
}

export function isSectionGuidePlaying(sectionId?: string): boolean {
  const state = getLectorPlaybackState();
  if (state !== 'playing' && state !== 'paused') return false;
  if (!activeGuideSectionId) return false;
  if (!sectionId) return true;
  return activeGuideSectionId === sectionId;
}
