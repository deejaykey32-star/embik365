import React, { useState, useRef, useEffect } from 'react';
import { 
  MapPin, 
  Compass, 
  Maximize2, 
  Minimize2, 
  ExternalLink, 
  Calendar, 
  Tv, 
  Tent, 
  Footprints, 
  Bike, 
  Train, 
  Bus, 
  Car, 
  Globe, 
  ShieldCheck, 
  Heart, 
  Share2, 
  RefreshCw,
  Sparkles,
  ChevronRight,
  Info,
  Navigation,
  Route,
  Download,
  X,
  Volume2,
  Square,
  BookOpen,
  Headphones
} from 'lucide-react';
import { SectionMeta } from '../types';
import { 
  playLectorSpeech, 
  stopLectorSpeech, 
  getLectorConfig, 
  unlockMobileAudio,
  getLectorPlaybackState
} from '../utils/audioLectorService';

export const PILGRIMAGE_LECTOR_SCRIPT = `
Witaj na szlaku Wielkiej Pielgrzymki Gwiaździstej i Szlaku Orlich Gniazd. 

Oto przewodnik po niezwykłej drodze serca, braterstwa i duchowej odnowy.

O co w niej chodzi i na czym polega ta pielgrzymka?
Pielgrzymka opiera się na idei dwóch wielkich gwiazd oraz głębokiej symbolice Trójcy Przenajświętszej.
Jako promienie pierwszej gwiazdy, pielgrzymi wyruszają z różnych zakątków Polski i świata – pieszo, rowerami, pociągami czy autokarami – by zjednoczyć się u stóp Matki Bożej na Jasnej Górze w Częstochowie. 
Następnie, tworząc jedną wielką rodzinę, wyruszają we wspólną, 7-dniową wędrówkę pieszą liczącą 174 kilometry przez malowniczy Szlak Orlich Gniazd na Wyżynie Krakowsko-Częstochowskiej, aż do Sanktuarium Bożego Miłosierdzia w krakowskich Łagiewnikach.
Tam, u źródła orędzia Bożego Miłosierdzia, stają się promieniami drugiej gwiazdy – rozchodzącymi się z powrotem na cały świat z przesłaniem pokoju, nadziei, przebaczenia i braterskiej miłości. 

Co niezwykłe i pełne duchowej głębi: każda grupa pielgrzymkowa, wyruszając ze swojego domu na Jasną Górę, wędrując szlakiem do Łagiewnik i wracając stamtąd z powrotem do miejsca wyjścia, tworzy na mapie ramiona wielkiego trójkąta. W ten sposób droga każdej grupy domyka geometryczny trójkąt, w widzialny sposób przypominając o Trójcy Świętej – Ojcu, Synu i Duchu Świętym – oraz wpisując tajemnicę Bożej jedności i miłości w drogi naszej Ojczyzny. To żywe doświadczenie, że wszyscy jesteśmy dziećmi jednego Boga.

Oto wspaniały, konkretny przykład takiego szlaku:
Pielgrzymka rozpoczynająca się w Rudzie Śląskiej, w parafii Trójcy Przenajświętszej w Kochłowicach, tuż obok zabytkowej kaplicy Sanktuarium Matki Bożej z Lourdes.
Pielgrzymi wyruszają stamtąd na północ przez Piekary Śląskie z Kalwarią Piekarską, Świerklaniec, Woźniki i Poraj, by po czterech dniach dotrzeć na Jasną Górę w Częstochowie.
Następnie, idąc opisanym, 7-dniowym Szlakiem Orlich Gniazd przez całą Jurę, docierają do Sanktuarium Bożego Miłosierdzia w krakowskich Łagiewnikach.
Po uroczystym Rozesłaniu, wędrują w drodze powrotnej przez Opactwo Benedyktynów w Tyńcu, Alwernię, Chrzanów, Jaworzno, Mysłowice oraz Bazylikę w Panewnikach, powracając prosto do kościoła Trójcy Przenajświętszej w Rudzie Śląskiej. W ten sposób cała trasa tworzy na mapie przybliżony kształt wielkiego trójkąta, łącząc początek i zwieńczenie drogi w tajemnicy Trójcy Świętej!

Pielgrzymka nie jest jedynie sprawdzianem kondycyjnym. Jest szkołą patrzenia na naszą codzienność z perspektywy wieczności – tak jak uczy nas blog Widoki na Raj.

Posłuchaj, jak wygląda każdy z siedmiu dni tego szlaku:

Dzień pierwszy, 18 czerwca. Dystans: 28 kilometrów. Trasa: Jasna Góra do Złotego Potoku.
O godzinie siódmej rano na Wałach Jasnogórskich odbywa się uroczysta Msza Święta inaugurująca zjednoczenie wszystkich promieni. Pielgrzymi ruszają ku jurajskim ostępom, mijając ruiny Zamku w Olsztynie i zabytkowe Zrębice, docierając na nocleg do bukowych lasów Złotego Potoku.

Dzień drugi, 19 czerwca. Dystans: 24 kilometry. Trasa: Złoty Potok do Bobolic i Mirowa.
Dzień rozpoczyna się przejściem przez rezerwat Ostrężnik, a punktem kulminacyjnym jest wędrówka malowniczą Grzędą Mirowską między bliźniaczymi zamkami Mirów i Bobolice. Wieczór to czas wspólnego ogniska i odpoczynku pod jurajskim niebem.

Dzień trzeci, 20 czerwca. Dystans: 26 kilometrów. Trasa: Bobolice do Zamku Ogrodzieniec.
Szlak prowadzi przez skaliste wzniesienia Góry Zborów w Podlesicach, z której roztacza się zapierająca dech panorama Jury. Następnie przez Zamek Morsko i Skarżyce pielgrzymi docierają do Podzamcza u stóp monumentalnego Zamku Ogrodzieniec, gdzie wieczorem odbywa się modlitewne nabożeństwo światła.

Dzień czwarty, 21 czerwca. Dystans: 27 kilometrów. Trasa: Ogrodzieniec przez Zamek Smoleń i Bydlin do Klucz i Pustyni Błędowskiej.
To dzień szczególny i duchowy punkt kulminacyjny całej drogi – Dzień Przesilenia Letniego, najdłuższy dzień w roku, tryumf światła nad ciemnością oraz moment duchowego oświecenia.
Dzień 21 czerwca to także wyjątkowe osobiste święto autora – moje urodziny – i bezpośrednie serce mojego bloga oraz dzieła Widoki na Raj.
Stając na punkcie widokowym Czubatka i spoglądając na bezkres Pustyni Błędowskiej, doświadczamy prawdy, że nawet pośród najtrudniejszych pustyń naszego życia, w chorobie, cierpieniu, zranieniach czy samotności, Bóg rozlewa Swoje światło. Blog Widoki na Raj uczy nas patrzeć na każdy trud doczesnej wędrówki z perspektywy wieczności i Bożej logiki miłości. Na wzgórzu Czubatka modlimy się o wewnętrzne oświecenie, odrodzenie nadziei i pokój serca dla każdego z nas.

Dzień piąty, 22 czerwca. Dystans: 25 kilometrów. Trasa: Klucze do Zamku Pieskowa Skała.
Wkraczamy w granice Ojcowskiego Parku Narodowego. Szlak wiedzie przez zamek Rabsztyn i Sułoszową, otwierając przed pielgrzymami widok na słynną Maczugę Herkulesa oraz renesansowy zamek Pieskowa Skała. Wieczorna kontemplacja w Dolinie Prądnika przywraca siły przed kolejnym etapem.

Dzień szósty, 23 czerwca. Dystans: 18 kilometrów. Trasa: Pieskowa Skała do Ojcowa.
Ten dzień ma wyjątkowy charakter, ponieważ przypada w Dzień Ojca. Pielgrzymi schodzą w głąb wapiennego wąwozu Doliny Prądnika, mijając Grodzisko i Kaplicę na Wodzie. Wieczorem pod majestatyczną Bramą Krakowską w Ojcowie odbywa się wielkie czuwanie modlitewne w intencji wszystkich ojców, rodzin, przebaczenia w relacjach i odwagi w wierze.

Dzień siódmy, 24 czerwca. Wielki Finał. Dystans: 26 kilometrów. Trasa: Ojców do Krakowa-Łagiewnik.
Ostatni odcinek prowadzi przez Zamek Korzkiew i Zielonki w stronę Krakowa. Pielgrzymi wkraczają na Wzgórze Miłosierdzia w Łagiewnikach. O godzinie piętnastej, w Godzinie Miłosierdzia, sprawowana jest dziękczynna Msza Święta i odmawiana jest uroczysta Koronka do Bożego Miłosierdzia.
Tu, u celu drogi, pielgrzymka się nie kończy. Stąd każdy wyrusza z powrotem do swojego domu, do rodziny i pracy – domykając pielgrzymi trójkąt ku czci Trójcy Przenajświętszej i stając się promieniem drugiej gwiazdy niosącym światu orędzie Bożego Miłosierdzia, pokoju i nadziei.
Przykładem takiego szlaku jest modelowa, piętnastodniowa trasa z Rudy Śląskiej: od parafii Trójcy Przenajświętszej i kaplicy Sanktuarium Matki Bożej z Lourdes przez Piekary Śląskie na Jasną Górę, stamtąd Szlakiem Orlich Gniazd do Łagiewnik, i powrotnie przez Tyniec, Alwernię i Panewniki do Rudy Śląskiej. Pełną trasę z plikami do pobrania możesz otworzyć w Google Maps na naszej mapie.

Dziękujemy, że jesteś na tej drodze. Niech każdy krok otwiera Twoje serce na prawdziwe Widoki na Raj.
`;

interface Props {
  section?: SectionMeta;
  currentLang?: string;
  theme?: 'light' | 'dark';
}

export const PilgrimageMapView: React.FC<Props> = ({ currentLang = 'pl', theme = 'light' }) => {
  const [activeStage, setActiveStage] = useState<'stage-1' | 'stage-2' | 'stage-3'>('stage-2');
  const [activeTab, setActiveTab] = useState<'info' | 'trail' | 'plan' | 'rays' | 'lodging' | 'live' | 'digital'>('info');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLectorPlaying, setIsLectorPlaying] = useState(false);
  const [showNarrationText, setShowNarrationText] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Zatrzymanie lektora przy odmontowaniu widoku oraz nasłuchiwanie stanu odtwarzacza
  useEffect(() => {
    const handleLectorStateChange = () => {
      const state = getLectorPlaybackState();
      if (state === 'idle') {
        setIsLectorPlaying(false);
      }
    };
    window.addEventListener('drogowskazy_lector_state_changed', handleLectorStateChange);
    return () => {
      window.removeEventListener('drogowskazy_lector_state_changed', handleLectorStateChange);
      stopLectorSpeech();
    };
  }, []);

  const handleToggleLector = async () => {
    unlockMobileAudio();
    if (isLectorPlaying) {
      stopLectorSpeech();
      setIsLectorPlaying(false);
      return;
    }
    stopLectorSpeech();
    setIsLectorPlaying(true);
    const config = { ...getLectorConfig(), mode: 'online' as const };
    await playLectorSpeech({
      text: PILGRIMAGE_LECTOR_SCRIPT,
      config,
      overrideLang: 'pl',
      title: 'Wielka Pielgrzymka Gwiaździsta • Przewodnik Audio',
      sectionName: 'Szlak Orlich Gniazd (18–24 czerwca)',
      onStart: () => setIsLectorPlaying(true),
      onEnd: () => setIsLectorPlaying(false),
      onError: () => setIsLectorPlaying(false)
    });
  };

  // Bezpośrednia ścieżka do nawigacji w Google Maps (Jasna Góra ➔ Łagiewniki)
  const googleMapsRouteUrl = 'https://www.google.com/maps/d/u/0/edit?mid=1VVkkzCIpWQ3AUUWu9F9nNH2ot8TZGeE&ll=50.415082274554095%2C19.5170855&z=9';
  const googleMapsModes = {
    walking: 'https://www.google.com/maps/dir/?api=1&origin=Jasna+G%C3%B3ra,+ul.+o.+A.+Kordeckiego+2,+42-225+Cz%C4%99stochowa&destination=Sanktuarium+Bo%C5%BCego+Mi%C5%82osierdzia,+Krak%C3%B3w-%C5%81agiewnikach,+Siostry+Faustyny+3,+30-608+Krak%C3%B3w&waypoints=Z%C5%82oty+Potok%7CKr%C3%B3lewski+Zamek+Bobolice%7CZamek+Ogrodzieniec%7COjc%C3%B3w&travelmode=walking',
    driving: 'https://www.google.com/maps/dir/?api=1&origin=Jasna+G%C3%B3ra,+ul.+o.+A.+Kordeckiego+2,+42-225+Cz%C4%99stochowa&destination=Sanktuarium+Bo%C5%BCego+Mi%C5%82osierdzia,+Krak%C3%B3w-%C5%81agiewnikach,+Siostry+Faustyny+3,+30-608+Krak%C3%B3w&waypoints=Z%C5%82oty+Potok%7CKr%C3%B3lewski+Zamek+Bobolice%7CZamek+Ogrodzieniec%7COjc%C3%B3w&travelmode=driving',
    bicycling: 'https://www.google.com/maps/dir/?api=1&origin=Jasna+G%C3%B3ra,+ul.+o.+A.+Kordeckiego+2,+42-225+Cz%C4%99stochowa&destination=Sanktuarium+Bo%C5%BCego+Mi%C5%82osierdzia,+Krak%C3%B3w-%C5%81agiewnikach,+Siostry+Faustyny+3,+30-608+Krak%C3%B3w&waypoints=Z%C5%82oty+Potok%7CKr%C3%B3lewski+Zamek+Bobolice%7CZamek+Ogrodzieniec%7COjc%C3%B3w&travelmode=bicycling',
    transit: 'https://www.google.com/maps/dir/?api=1&origin=Jasna+G%C3%B3ra,+ul.+o.+A.+Kordeckiego+2,+42-225+Cz%C4%99stochowa&destination=Sanktuarium+Bo%C5%BCego+Mi%C5%82osierdzia,+Krak%C3%B3w-%C5%81agiewnikach,+Siostry+Faustyny+3,+30-608+Krak%C3%B3w&waypoints=Z%C5%82oty+Potok%7CKr%C3%B3lewski+Zamek+Bobolice%7CZamek+Ogrodzieniec%7COjc%C3%B3w&travelmode=transit'
  };

  const handleStageChange = (stage: 'stage-1' | 'stage-2' | 'stage-3') => {
    setActiveStage(stage);
    if (iframeRef.current) {
      iframeRef.current.src = `/mapa/index.html?stage=${stage}&t=${Date.now()}`;
    }
  };

  const handleReloadMap = () => {
    if (iframeRef.current) {
      iframeRef.current.src = `/mapa/index.html?stage=${activeStage}&t=${Date.now()}`;
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/mapa`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Wielka Pielgrzymka Gwiaździsta & Szlak Orlich Gniazd',
          text: 'Interaktywna mapa i przewodnik Pielgrzymki Gwiaździstej do Częstochowy i Łagiewnik.',
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Uniwersalny harmonogram 7 dni Szlaku Orlich Gniazd (Etap II) - coroczny 18–24 czerwca
  const eagleTrailDays = [
    {
      day: 1,
      date: '18.06',
      title: 'Jasna Góra ➔ Złoty Potok',
      km: 28,
      route: 'Jasna Góra – Zamek Olsztyn – Zrębice – Złoty Potok',
      highlight: 'Uroczysty start z Wałów Jasnogórskich o 07:00 po Mszy Świętej inaugurującej Zjednoczenie.',
      lodging: 'Pole namiotowe Błonia Złoty Potok & Hala Gimnastyczna w Janowie'
    },
    {
      day: 2,
      date: '19.06',
      title: 'Złoty Potok ➔ Zamek Bobolice / Mirów',
      km: 24,
      route: 'Złoty Potok – Ostrężnik – Zamek Mirów – Zamek Bobolice',
      highlight: 'Przejście malowniczą Grzędą Mirowską między bliźniaczymi zamkami.',
      lodging: 'Biwak u stóp Zamku Bobolice & Gospodarstwa Agroturystyczne w Mirowie'
    },
    {
      day: 3,
      date: '20.06',
      title: 'Bobolice ➔ Zamek Ogrodzieniec',
      km: 26,
      route: 'Bobolice – Góra Zborów (Podlesice) – Zamek Morsko – Skarżyce – Ogrodzieniec',
      highlight: 'Panorama Jury z Góry Zborów oraz wieczorne nabożeństwo światła na dziedzińcu Zamku Ogrodzieniec.',
      lodging: 'Główne Miasteczko Namiotowe Podzamcze / Ogrodzieniec'
    },
    {
      day: 4,
      date: '21.06 — PRZESILENIE LETNIE & WIDOKI NA RAJ',
      title: 'Ogrodzieniec ➔ Klucze / Pustynia Błędowska (Dzień Oświecenia)',
      km: 27,
      route: 'Ogrodzieniec – Zamek Smoleń (Dolina Wodącej) – Bydlin – Klucze (Czubatka)',
      highlight: '☀️ DZIEŃ PRZESILENIA LETNIEGO & URODZINY AUTORA (WIDOKI NA RAJ): Najdłuższy dzień w roku, tryumf światła nad ciemnością i duchowe oświecenie na punkcie widokowym Czubatka. Spojrzenie na pustynię doczesności przez pryzmat wieczności i bloga „Widoki na Raj”.',
      lodging: 'Szkoła Podstawowa w Kluczach & Pole Biwakowe Pustynia Błędowska',
      isSpecial: true
    },
    {
      day: 5,
      date: '22.06',
      title: 'Klucze ➔ Zamek Pieskowa Skała',
      km: 25,
      route: 'Klucze – Olkusz – Zamek Rabsztyn – Sułoszowa – Zamek Pieskowa Skała',
      highlight: 'Dolina Prądnika, Maczuga Herkulesa i Renesansowy Zamek Pieskowa Skała.',
      lodging: 'Tereny Rekreacyjne w Sułoszowej & Parafia św. Wawrzyńca'
    },
    {
      day: 6,
      date: '23.06 — DZIEŃ OJCA',
      title: 'Pieskowa Skała ➔ OJCOW (Nocleg w Dzień Ojca)',
      km: 18,
      route: 'Pieskowa Skała – Grodzisko (Pustelnia bł. Salomei) – Brama Krakowska – Ojców',
      highlight: '🌟 WIELKIE CZUWANIE W DZIEŃ OJCA: Modlitwa za ojców, rodziny i dzieci pod Bramą Krakowską w Ojcowie. Błogosławieństwo Ojcowskie.',
      lodging: 'Główne Jurajskie Błonia Namiotowe w Ojcowie (Złota Góra / Dolina Prądnika) & Domy Gościnne',
      isSpecial: true
    },
    {
      day: 7,
      date: '24.06',
      title: 'Ojców ➔ Kraków-Łagiewniki (Sanktuarium)',
      km: 26,
      route: 'Ojców – Zamek Korzkiew – Zielonki – Kraków (Wawel) – Sanktuarium Bożego Miłosierdzia w Łagiewnikach',
      highlight: 'Finałowe wejście na Wzgórze Miłosierdzia w Łagiewnikach. Uroczysta Msza Święta Te Deum o 15:00 w Godzinie Miłosierdzia.',
      lodging: 'Domy Pielgrzyma w Łagiewnikach & Białe Morza'
    }
  ];

  // Promienie gwiazdy (Etap I)
  const starRays = [
    { name: 'Promień Północny', start: 'Gdańsk (Bazylika Mariacka)', dist: '485 km', days: '16 dni', type: 'Piesza', icon: Footprints, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900' },
    { name: 'Promień Zachodni', start: 'Wrocław (Ostrów Tumski)', dist: '198 km', days: '4 dni', type: 'Rowerowa', icon: Bike, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900' },
    { name: 'Promień Centralny', start: 'Warszawa Centralna', dist: '245 km', days: '2 dni', type: 'Kolejowa (Wagony Modlitwy)', icon: Train, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900' },
    { name: 'Promień Górski', start: 'Zakopane (Krzeptówki)', dist: '235 km', days: '9 dni', type: 'Piesza', icon: Footprints, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-900' },
    { name: 'Promień Śródziemnomorski', start: 'Rzym (Plac św. Piotra, Watykan)', dist: '1 520 km', days: '7 dni', type: 'Autokarowa & Hybrydowa', icon: Bus, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900' },
    { name: 'Konwój Rodzinny', start: 'Lublin (Archikatedra)', dist: '310 km', days: '2 dni', type: 'Samochodowa', icon: Car, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900' },
    { name: 'Pielgrzymka Cyfrowa', start: 'Aplikacja Globalna (Ponad 45 krajów)', dist: 'Online', days: '24/7', type: 'Cyfrowa & Smartfon', icon: Globe, color: 'text-amber-500 dark:text-amber-300', bg: 'bg-amber-500/10 border-amber-500/30' }
  ];

  return (
    <div className="min-h-screen bg-[#fcf9f4] dark:bg-[#0b0f17] text-[#2e241c] dark:text-[#e2e8f0] pb-24 transition-colors">
      
      {/* 1. Header Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f3e7d7] via-[#faf4eb] to-[#fcf9f4] dark:from-[#111827] dark:via-[#0e1420] dark:to-[#0b0f17] border-b border-[#e8ded3] dark:border-[#1e293b] pt-8 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-bold tracking-wider uppercase border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                SZLAK WIARY & NADZIEI
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Mapa Interaktywna & Nawigacja
              </span>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <a
                href={googleMapsRouteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                title="Otwórz trasę w Google Maps (samochód, rower, pieszo, pociąg)"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Nawigacja Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#18202f] border border-[#e2d6c7] dark:border-[#2a374d] text-xs font-medium text-[#6b5745] dark:text-[#94a3b8] hover:text-[#2e241c] dark:hover:text-white shadow-xs transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Skopiowano link!' : 'Udostępnij'}</span>
              </button>

              <a
                href="https://mapa-aon.pages.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition"
                title="Przejdź do dedykowanego serwisu https://mapa-aon.pages.dev"
              >
                <span>mapa-aon.pages.dev</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-book tracking-tight text-[#1f1712] dark:text-white">
              Wielka Pielgrzymka Gwiaździsta & Szlak Orlich Gniazd
            </h1>
            <p className="text-base sm:text-lg text-[#614e3e] dark:text-[#94a3b8] max-w-4xl font-sans-ui leading-relaxed">
              Uniwersalny, coroczny szlak wędrówki (18–24 czerwca): 
              <span className="font-semibold text-amber-800 dark:text-amber-300"> Promienie z całego świata i Polski ku Jasnej Górze</span>, 
              wspólny <span className="font-semibold text-amber-800 dark:text-amber-300">Szlak Orlich Gniazd (174 km Częstochowa ➔ Łagiewniki)</span> z 
              niezwykłym <span className="underline decoration-amber-500 font-bold text-amber-900 dark:text-amber-200">czuwaniem pod Bramą Krakowską w Ojcowie w Dzień Ojca (23 czerwca)</span> oraz 
              uroczyste <span className="font-semibold text-amber-800 dark:text-amber-300">Rozesłanie ze wzgórza Bożego Miłosierdzia</span>. Dostępna pełna <a href={googleMapsRouteUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-700 dark:text-emerald-400 underline">nawigacja GPS w Google Maps</a> we wszystkich trybach podróży.
            </p>
          </div>

          {/* Quick 3-Stage Selector Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => handleStageChange('stage-1')}
              className={`text-left p-4 rounded-2xl border transition-all duration-200 ${
                activeStage === 'stage-1'
                  ? 'bg-white dark:bg-[#192233] border-amber-500 shadow-md ring-2 ring-amber-500/20'
                  : 'bg-white/60 dark:bg-[#131926]/70 border-[#e8ded3] dark:border-[#222d42] hover:bg-white dark:hover:bg-[#192233]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Etap I</span>
                <span className="text-xs text-[#7d6b5b] dark:text-[#64748b]">Do 17/18 czerwca</span>
              </div>
              <div className="text-sm font-bold text-[#1f1712] dark:text-white mt-1">Promienie Gwiazdy</div>
              <div className="text-xs text-[#614e3e] dark:text-[#94a3b8] mt-0.5">Świat i Polska ➔ Częstochowa</div>
            </button>

            <button
              onClick={() => handleStageChange('stage-2')}
              className={`text-left p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
                activeStage === 'stage-2'
                  ? 'bg-white dark:bg-[#192233] border-amber-500 shadow-md ring-2 ring-amber-500/20'
                  : 'bg-white/60 dark:bg-[#131926]/70 border-[#e8ded3] dark:border-[#222d42] hover:bg-white dark:hover:bg-[#192233]'
              }`}
            >
              <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white uppercase tracking-wider">
                23.06: Dzień Ojca w Ojcowie
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Etap II (Główny)</span>
              </div>
              <div className="text-sm font-bold text-[#1f1712] dark:text-white mt-1">Szlak Orlich Gniazd (174 km)</div>
              <div className="text-xs text-[#614e3e] dark:text-[#94a3b8] mt-0.5">18 – 24 czerwca (7 dni)</div>
            </button>

            <button
              onClick={() => handleStageChange('stage-3')}
              className={`text-left p-4 rounded-2xl border transition-all duration-200 ${
                activeStage === 'stage-3'
                  ? 'bg-white dark:bg-[#192233] border-amber-500 shadow-md ring-2 ring-amber-500/20'
                  : 'bg-white/60 dark:bg-[#131926]/70 border-[#e8ded3] dark:border-[#222d42] hover:bg-white dark:hover:bg-[#192233]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Etap III</span>
                <span className="text-xs text-[#7d6b5b] dark:text-[#64748b]">24 i 25 czerwca</span>
              </div>
              <div className="text-sm font-bold text-[#1f1712] dark:text-white mt-1">Rozesłanie (Missio)</div>
              <div className="text-xs text-[#614e3e] dark:text-[#94a3b8] mt-0.5">Łagiewniki ➔ Cały Świat</div>
            </button>
          </div>

        </div>
      </section>

      {/* 2. Interactive Map View Container */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Map Header Controls Bar above Map Card */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="bg-white/90 dark:bg-[#111723]/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-[#e2d6c7] dark:border-[#233149] shadow-xs flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#1f1712] dark:text-white">
            <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-heading-cinzel font-bold text-amber-900 dark:text-amber-300">
              {activeStage === 'stage-1' && 'Etap I: Zbieżność Promieni do Jasnej Góry'}
              {activeStage === 'stage-2' && 'Etap II: Szlak Orlich Gniazd (Jasna Góra ➔ Łagiewniki)'}
              {activeStage === 'stage-3' && 'Etap III: Rozesłanie ze wzgórza Miłosierdzia'}
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto justify-start sm:justify-end">
            <button
              onClick={() => setShowInfoModal(true)}
              id="btn-map-info-modal"
              title="Informacje o pielgrzymce, harmonogram 7 dni i kompleksowy plan"
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Info</span>
            </button>

            <button
              onClick={handleToggleLector}
              id="btn-map-lector-online"
              title="Włącz lub wyłącz lektora AI online (Przewodnik po pielgrzymce i szlaku)"
              className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                isLectorPlaying
                  ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400/50 animate-pulse'
                  : 'bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs'
              }`}
            >
              {isLectorPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Zatrzymaj Lektora</span>
                </>
              ) : (
                <>
                  <Headphones className="w-3.5 h-3.5 text-amber-200" />
                  <span>Lektor AI (Online)</span>
                </>
              )}
            </button>

            <a
              href={googleMapsRouteUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Otwórz nawigację trasy w Google Maps (samochód, pieszo, rower, pociąg)"
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition shrink-0"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Nawigacja Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href="/mapa/trasa_orle_gniazda_czestochowa_lagiewniki.csv"
              download="trasa_orle_gniazda_czestochowa_lagiewniki.csv"
              title="Pobierz trasę Etapu II: Szlak Orlich Gniazd (Częstochowa ➔ Łagiewniki, 7 dni) w formacie CSV"
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-amber-800/80 hover:bg-amber-800 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV Orle Gniazda (7 dni)</span>
            </a>

            <a
              href="/mapa/trasa_ruda_slaska_trojkat.csv"
              download="trasa_ruda_slaska_trojkat.csv"
              title="Pobierz pełną trasę modelową: Trójkąt Święty (Ruda Śląska ➔ Częstochowa ➔ Łagiewniki ➔ Ruda Śląska, 15 dni) w formacie CSV"
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-amber-700/80 hover:bg-amber-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV Trójkąt (15 dni)</span>
            </a>

            <a
              href="https://mapa.widokinaraj.pl"
              target="_blank"
              rel="noopener noreferrer"
              title="Otwórz oficjalną platformę mapa.widokinaraj.pl"
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-amber-900/80 hover:bg-amber-900 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition shrink-0"
            >
              <span>mapa.widokinaraj.pl</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleReloadMap}
              title="Odśwież widok mapy"
              className="p-2 sm:p-2.5 rounded-xl bg-white/90 dark:bg-[#111723]/90 backdrop-blur-md border border-[#e2d6c7] dark:border-[#233149] text-[#4a392b] dark:text-white shadow-xs hover:bg-[#faf6f0] dark:hover:bg-[#182234] transition cursor-pointer shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsFullscreen(f => !f)}
              title={isFullscreen ? 'Zmniejsz mapę' : 'Pełny ekran mapy'}
              className="p-2 sm:p-2.5 rounded-xl bg-white/90 dark:bg-[#111723]/90 backdrop-blur-md border border-[#e2d6c7] dark:border-[#233149] text-[#4a392b] dark:text-white shadow-xs hover:bg-[#faf6f0] dark:hover:bg-[#182234] transition cursor-pointer shrink-0"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile touch scroll guidance hint */}
        <div className="flex sm:hidden items-center justify-between px-3 py-1.5 mb-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-[#5e432a] dark:text-amber-200">
          <span className="flex items-center gap-1">
            <span>👆</span>
            <span>Przewijaj stronę przesuwając palcem poza mapą</span>
          </span>
          <button
            onClick={() => setIsFullscreen(true)}
            className="font-bold underline text-amber-700 dark:text-amber-400 cursor-pointer"
          >
            Pełny ekran ↗
          </button>
        </div>

        {/* Map Card with Fullscreen Toggle */}
        <div className={`relative bg-white dark:bg-[#131a27] rounded-3xl border border-[#e2d6c7] dark:border-[#222e44] shadow-md overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0' : 'h-[380px] sm:h-[500px] md:h-[650px]'
        }`}>
          
          {/* Fullscreen Close Button */}
          {isFullscreen && (
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
              <button
                onClick={() => setIsFullscreen(false)}
                title="Zmniejsz mapę"
                className="p-3 rounded-2xl bg-white/95 dark:bg-[#111723]/95 backdrop-blur-md border border-[#e2d6c7] dark:border-[#233149] text-[#4a392b] dark:text-white shadow-lg hover:bg-white dark:hover:bg-[#182234] transition cursor-pointer"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Iframe with self-hosted /mapa/ app */}
          <iframe
            ref={iframeRef}
            src={`/mapa/index.html?stage=${activeStage}`}
            title="Pielgrzymka Gwiaździsta - Interaktywna Mapa"
            className="w-full h-full border-0"
            allow="geolocation"
          />
        </div>

        {/* Helpful Helper note */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[#7d6b5b] dark:text-[#8896ab] mt-3 px-2 gap-2 font-sans-ui">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Mapę można powiększać kółkiem myszy lub gestem uszczypnięcia na ekranie dotykowym. Warstwy terenu, satelity i dróg przełączysz w menu mapy.</span>
          </div>
          <div>
            <span>Dedykowana domena: </span>
            <a href="https://mapa.widokinaraj.pl" target="_blank" rel="noopener noreferrer" className="text-amber-700 dark:text-amber-400 font-semibold underline">
              mapa.widokinaraj.pl
            </a>
          </div>
        </div>
      </section>

      {/* 3. Detailed Tabs Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center overflow-x-auto no-scrollbar gap-2 border-b border-[#e2d6c7] dark:border-[#1f293d] pb-2">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'info'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white/70 dark:bg-[#131a26] text-[#614e3e] dark:text-[#94a3b8] hover:bg-white dark:hover:bg-[#1a2333]'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Info & Harmonogram</span>
          </button>

          <button
            onClick={() => setActiveTab('trail')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'trail'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white/70 dark:bg-[#131a26] text-[#614e3e] dark:text-[#94a3b8] hover:bg-white dark:hover:bg-[#1a2333]'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Szlak Orlich Gniazd (Dni 1–7)</span>
          </button>

          <button
            onClick={() => setActiveTab('plan')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'plan'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white/70 dark:bg-[#131a26] text-[#614e3e] dark:text-[#94a3b8] hover:bg-white dark:hover:bg-[#1a2333]'
            }`}
          >
            <Route className="w-4 h-4" />
            <span>Kompleksowy Plan (Etapy I–III)</span>
          </button>

          <button
            onClick={() => setActiveTab('rays')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'rays'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white/70 dark:bg-[#131a26] text-[#614e3e] dark:text-[#94a3b8] hover:bg-white dark:hover:bg-[#1a2333]'
            }`}
          >
            <Footprints className="w-4 h-4" />
            <span>Promienie Gwiazdy (Zbieżność)</span>
          </button>

          <button
            onClick={() => setActiveTab('lodging')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'lodging'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white/70 dark:bg-[#131a26] text-[#614e3e] dark:text-[#94a3b8] hover:bg-white dark:hover:bg-[#1a2333]'
            }`}
          >
            <Tent className="w-4 h-4" />
            <span>Baza Noclegowa & Namioty</span>
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'live'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white/70 dark:bg-[#131a26] text-[#614e3e] dark:text-[#94a3b8] hover:bg-white dark:hover:bg-[#1a2333]'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Transmisje LIVE YouTube</span>
          </button>

          <button
            onClick={() => setActiveTab('digital')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'digital'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white/70 dark:bg-[#131a26] text-[#614e3e] dark:text-[#94a3b8] hover:bg-white dark:hover:bg-[#1a2333]'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Pielgrzymka Cyfrowa & Intencje</span>
          </button>
        </div>

        {/* Universal Google Maps Navigation Interactive Card */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 dark:via-emerald-900/20 dark:to-transparent border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                <Navigation className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Oficjalna Nawigacja GPS w Google Maps
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 border border-emerald-500/30">
                Wszystkie tryby: 🚗 Auto • 🚆 Pociąg • 🚶 Pieszo • 🚲 Rower
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#473729] dark:text-[#cbd5e1] leading-relaxed font-sans-ui">
              Skorzystaj z gotowej trasy w Google Maps z głównymi punktami: <span className="font-semibold text-emerald-900 dark:text-emerald-200">Jasna Góra ➔ Złoty Potok ➔ Królewski Zamek Bobolice ➔ Zamek Ogrodzieniec ➔ Ojców ➔ Sanktuarium w Łagiewnikach</span>. Wybierz swój tryb podróży poniżej:
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-[#614e3e] dark:text-[#94a3b8]">
              <span>Link do nawigacji:</span>
              <a href={googleMapsRouteUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 dark:text-emerald-400 font-semibold underline truncate max-w-xs sm:max-w-md">
                {googleMapsRouteUrl}
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-stretch sm:items-center gap-2 shrink-0 w-full lg:w-auto">
            <a
              href={googleMapsModes.walking}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#111722] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-600/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs shadow-xs transition"
              title="Włącz tryb pieszy w Google Maps"
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>🚶 Pieszo</span>
            </a>

            <a
              href={googleMapsModes.driving}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#111722] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-600/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs shadow-xs transition"
              title="Włącz tryb samochodowy w Google Maps"
            >
              <Car className="w-3.5 h-3.5" />
              <span>🚗 Auto</span>
            </a>

            <a
              href={googleMapsModes.bicycling}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#111722] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-600/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs shadow-xs transition"
              title="Włącz tryb rowerowy w Google Maps"
            >
              <Bike className="w-3.5 h-3.5" />
              <span>🚲 Rower</span>
            </a>

            <a
              href={googleMapsModes.transit}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#111722] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-600/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs shadow-xs transition"
              title="Włącz tryb pociągu w Google Maps"
            >
              <Train className="w-3.5 h-3.5" />
              <span>🚆 Pociąg</span>
            </a>

            <a
              href={googleMapsRouteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
              title="Otwórz pełną 8-etapową trasę w Google Maps"
            >
              <Navigation className="w-4 h-4" />
              <span>Otwórz</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Tab 0 Content: Info & Pełny Harmonogram */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Lektor AI Audio Player Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-amber-600/15 via-orange-600/10 to-amber-700/20 dark:from-amber-950/50 dark:via-orange-950/30 dark:to-amber-900/40 border border-amber-500/40 dark:border-amber-500/30 shadow-md space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`p-3 rounded-2xl text-white shadow-md transition-all ${
                    isLectorPlaying 
                      ? 'bg-rose-600 animate-pulse' 
                      : 'bg-amber-600'
                  }`}>
                    {isLectorPlaying ? <Square className="w-5 h-5 fill-white" /> : <Headphones className="w-5 h-5" />}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Lektor AI • Audioprzewodnik
                      </span>
                      {isLectorPlaying && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                          ODTWARZANIE
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold font-serif-book text-[#1f1712] dark:text-white">
                      O co chodzi w pielgrzymce i jak przebiega trasa
                    </h3>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleToggleLector}
                    className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                      isLectorPlaying
                        ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400/50'
                        : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white'
                    }`}
                  >
                    {isLectorPlaying ? (
                      <>
                        <Square className="w-4 h-4 fill-white" />
                        <span>Zatrzymaj Lektora AI</span>
                        <span className="flex items-end gap-0.5 h-3">
                          <span className="w-1 h-3 bg-white rounded-full animate-bounce"></span>
                          <span className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:0.15s]"></span>
                          <span className="w-1 h-3 bg-white rounded-full animate-bounce [animation-delay:0.3s]"></span>
                        </span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" />
                        <span>Odsłuchaj Przewodnik (Lektor AI)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowNarrationText(!showNarrationText)}
                    className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#151e2d] hover:bg-amber-500/10 text-amber-900 dark:text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    title="Rozwiń lub zwiń tekst narracji lektora"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{showNarrationText ? 'Ukryj tekst' : 'Tekst narracji'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#0f1523]/80 border border-amber-500/20 text-xs text-[#4a392b] dark:text-[#cbd5e1] leading-relaxed flex flex-wrap items-center gap-2">
                <span className="font-bold text-amber-800 dark:text-amber-300">W audycji:</span>
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-900 dark:text-amber-200">Idea Dwóch Gwiazd</span>
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-900 dark:text-amber-200">Trójkąt Trójcy Świętej</span>
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-900 dark:text-amber-200">Harmonogram Dni 1–7</span>
                <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-900 dark:text-rose-200 font-semibold">
                  ☀️ 21.06: Przesilenie Letnie & Urodziny Autora — „Widoki na Raj”
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-900 dark:text-amber-200">23.06: Dzień Ojca w Ojcowie</span>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-900 dark:text-emerald-200">24.06: Łagiewniki o 15:00</span>
              </div>

              {/* Rozwijany pełny tekst narracji */}
              {showNarrationText && (
                <div className="p-4 rounded-2xl bg-white dark:bg-[#0e1422] border border-[#e2d6c7] dark:border-[#222e44] text-xs sm:text-sm text-[#3b2d22] dark:text-[#cbd5e1] leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto space-y-2 font-serif-book">
                  <div className="font-sans-ui text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 pb-1 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                    <span>Pełna treść narracji Lektora AI</span>
                    <button onClick={() => setShowNarrationText(false)} className="text-xs hover:text-amber-600">Zamknij</button>
                  </div>
                  {PILGRIMAGE_LECTOR_SCRIPT.trim()}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent dark:from-amber-950/40 dark:via-orange-950/20 p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-amber-600 text-white shadow-xs">
                  <Info className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Przewodnik Pielgrzymki</span>
                  <h2 className="text-xl sm:text-2xl font-bold font-serif-book text-[#1f1712] dark:text-white">
                    Wielka Pielgrzymka Gwiaździsta & Szlak Orlich Gniazd (18 – 24 czerwca)
                  </h2>
                </div>
              </div>

              <p className="text-sm sm:text-base text-[#4a392b] dark:text-[#cbd5e1] leading-relaxed font-sans-ui">
                Coroczne wydarzenie w formie gwiaździstej pielgrzymki oraz 7-dniowego pieszego rajdu. 
                Łączy symbolikę <strong>dwóch wielkich gwiazd</strong> oraz <strong>Trójkąta Trójcy Świętej</strong>: każda grupa pielgrzymkowa, wyruszając ze swojego domu na Jasną Górę, wędrując <strong className="text-amber-800 dark:text-amber-300">Szlakiem Orlich Gniazd</strong> (174 km) do Łagiewnik i wracając do miejsca wyjścia, zamyka na mapie ramiona geometrycznego trójkąta przypominającego o Trójcy Przenajświętszej (np. modelowy szlak: Ruda Śląska ➔ Częstochowa ➔ Łagiewniki ➔ Ruda Śląska).
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Otwórz pełne okno Info</span>
                </button>
                <button
                  onClick={handleToggleLector}
                  className={`px-4 py-2 rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer ${
                    isLectorPlaying 
                      ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                      : 'bg-amber-700 hover:bg-amber-600 text-white'
                  }`}
                >
                  {isLectorPlaying ? <Square className="w-3.5 h-3.5 fill-white" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isLectorPlaying ? 'Zatrzymaj Lektora' : 'Włącz Lektora AI'}</span>
                </button>
                <button
                  onClick={() => setActiveTab('plan')}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-[#151e2d] hover:bg-amber-500/10 text-amber-900 dark:text-amber-300 border border-amber-500/30 font-bold text-xs transition cursor-pointer"
                >
                  Zobacz Kompleksowy Plan (Etapy I–III)
                </button>
              </div>
            </div>

            {/* Dni 1–7 w uniwersalnym formacie */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-serif-book text-[#1f1712] dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <span>Harmonogram Dzień po Dniu (18–24 czerwca)</span>
                </h3>
                <span className="text-xs text-[#7d6b5b] dark:text-[#94a3b8]">Corocznie w tych samych datach</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eagleTrailDays.map((d) => (
                  <div
                    key={d.day}
                    className={`p-5 rounded-2xl border transition-all ${
                      d.isSpecial
                        ? 'bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-transparent border-amber-500 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-white dark:bg-[#131a27] border-[#e2d6c7] dark:border-[#222e44] shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        d.isSpecial 
                          ? 'bg-rose-500 text-white' 
                          : 'bg-[#f0e6d9] dark:bg-[#1e293d] text-[#6b5745] dark:text-[#94a3b8]'
                      }`}>
                        Dzień {d.day} • {d.date}
                      </span>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{d.km} km</span>
                    </div>

                    <h4 className="text-base sm:text-lg font-bold font-serif-book text-[#1f1712] dark:text-white mt-2">
                      {d.title}
                    </h4>

                    <p className="text-xs text-[#7d6b5b] dark:text-[#94a3b8] mt-1 font-mono">
                      Trasa: {d.route}
                    </p>

                    <p className="text-xs sm:text-sm text-[#473729] dark:text-[#cbd5e1] mt-2.5 font-sans-ui leading-relaxed">
                      {d.highlight}
                    </p>

                    <div className="mt-3 pt-3 border-t border-[#f0e6d9] dark:border-[#1e293b] flex items-center gap-2 text-xs text-[#614e3e] dark:text-[#94a3b8]">
                      <Tent className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">Nocleg: {d.lodging}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 1 Content: Szlak Orlich Gniazd dzień po dniu */}
        {activeTab === 'trail' && (
          <div className="space-y-4">
            <div className="bg-[#fefce8] dark:bg-[#1a1708] border border-amber-300 dark:border-amber-800/60 p-4 rounded-2xl flex items-center gap-3">
              <Calendar className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0" />
              <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                <span className="font-bold">Termin: corocznie 18 – 24 czerwca.</span> Długość trasy: 174 km. 
                Punkt kulminacyjny wędrówki: <span className="underline font-bold">Dzień 6 (23.06) w Dzień Ojca z czuwaniem pod Bramą Krakowską i noclegiem w Ojcowie</span>.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eagleTrailDays.map((d) => (
                <div 
                  key={d.day}
                  className={`p-5 rounded-2xl border transition-all ${
                    d.isSpecial
                      ? 'bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-transparent border-amber-500 dark:border-amber-400 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-white dark:bg-[#131a27] border-[#e2d6c7] dark:border-[#222e44] shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      d.isSpecial 
                        ? 'bg-rose-500 text-white' 
                        : 'bg-[#f0e6d9] dark:bg-[#1e293d] text-[#6b5745] dark:text-[#94a3b8]'
                    }`}>
                      Dzień {d.day} • {d.date}
                    </span>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{d.km} km</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold font-serif-book text-[#1f1712] dark:text-white mt-2">
                    {d.title}
                  </h3>

                  <p className="text-xs text-[#7d6b5b] dark:text-[#94a3b8] mt-1 font-mono">
                    Trasa: {d.route}
                  </p>

                  <p className="text-xs sm:text-sm text-[#473729] dark:text-[#cbd5e1] mt-2.5 font-sans-ui leading-relaxed">
                    {d.highlight}
                  </p>

                  <div className="mt-3 pt-3 border-t border-[#f0e6d9] dark:border-[#1e293b] flex items-center gap-2 text-xs text-[#614e3e] dark:text-[#94a3b8]">
                    <Tent className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">Nocleg: {d.lodging}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Kompleksowy Plan (Etapy I–III) */}
        {activeTab === 'plan' && (
          <div className="space-y-6">
            {/* Wprowadzenie */}
            <div className="bg-white dark:bg-[#131a27] p-6 sm:p-8 rounded-3xl border border-[#e2d6c7] dark:border-[#222e44] shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  <Compass className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Przewodnik Strategiczny</span>
                  <h2 className="text-xl sm:text-2xl font-bold font-serif-book text-[#1f1712] dark:text-white">
                    Kompleksowy Plan Wydarzenia: Gwiaździsta Pielgrzymka & Pieszy Rajd
                  </h2>
                </div>
              </div>

              <p className="text-sm sm:text-base text-[#4a392b] dark:text-[#cbd5e1] leading-relaxed font-sans-ui">
                Propozycja całościowego programu wydarzenia – w formule gwiaździstej pielgrzymki lub pieszego rajdu. 
                Trasa z Częstochowy do Krakowa idealnie pokrywa się z malowniczym <strong className="text-amber-800 dark:text-amber-300">Szlakiem Orlich Gniazd</strong> (Jura Krakowsko-Częstochowska), co czyni ten 7-dniowy marsz niezwykle atrakcyjnym krajobrazowo, historycznie i duchowo.
              </p>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                  <Navigation className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ścieżka nawigacyjna Google Maps: <strong>8 węzłów etapowych</strong> (samochód, pociąg, pieszo, rower).</span>
                </div>
                <a
                  href={googleMapsRouteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                >
                  <span>Nawiguj w Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* ETAP I */}
            <div className="bg-white dark:bg-[#131a27] p-6 sm:p-8 rounded-3xl border border-[#e2d6c7] dark:border-[#222e44] shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-[#f0e6d9] dark:border-[#1e293b] pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold flex items-center justify-center text-sm border border-amber-500/30">
                    I
                  </span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold font-serif-book text-[#1f1712] dark:text-white">
                      ETAP I: Ścieżki do Częstochowy (Zgrupowanie do 17/18 czerwca)
                    </h3>
                    <p className="text-xs text-[#7d6b5b] dark:text-[#94a3b8]">Wymarsze piesze i zorganizowany transport do Częstochowy</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#f3e9dc] dark:bg-[#1e293d] text-[#6b5745] dark:text-[#94a3b8]">
                  Do 17/18.06
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#473729] dark:text-[#cbd5e1] leading-relaxed">
                Uczestnicy mogą dotrzeć do Częstochowy w formie pieszej (własne, wcześniejsze wymarsze) lub zorganizowanym transportem, by 18 czerwca rano wspólnie wyruszyć na szlak.
              </p>

              {/* Polska */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  Z miast w Polsce (opcje piesze lub dojazdowe):
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-[#faf5ee] dark:bg-[#192233] border border-[#e8ded3] dark:border-[#24334a] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#1f1712] dark:text-white">1. Warszawa (ok. 220 km)</span>
                      <Footprints className="w-4 h-4 text-rose-600" />
                    </div>
                    <ul className="text-xs text-[#614e3e] dark:text-[#94a3b8] space-y-1">
                      <li>• <strong>Opcja piesza:</strong> Wymarsz ok. 9 czerwca (9 dni drogi).</li>
                      <li>• <strong>Opcja transportowa:</strong> Wyjazd 17 czerwca wieczorem (pociąg IC/Pendolino) lub autokarem.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#faf5ee] dark:bg-[#192233] border border-[#e8ded3] dark:border-[#24334a] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#1f1712] dark:text-white">2. Wrocław (ok. 170 km)</span>
                      <Bike className="w-4 h-4 text-emerald-600" />
                    </div>
                    <ul className="text-xs text-[#614e3e] dark:text-[#94a3b8] space-y-1">
                      <li>• <strong>Opcja piesza:</strong> Wymarsz ok. 11 czerwca (7 dni drogi).</li>
                      <li>• <strong>Opcja transportowa:</strong> Szybki dojazd pociągiem bezpośrednim lub autostradą A4 i A1 (ok. 2–2,5 h).</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#faf5ee] dark:bg-[#192233] border border-[#e8ded3] dark:border-[#24334a] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#1f1712] dark:text-white">3. Opole (ok. 100 km)</span>
                      <Footprints className="w-4 h-4 text-amber-600" />
                    </div>
                    <ul className="text-xs text-[#614e3e] dark:text-[#94a3b8] space-y-1">
                      <li>• <strong>Opcja piesza:</strong> Wymarsz ok. 14 czerwca (4 dni drogi przez urokliwe lasy lublinieckie).</li>
                      <li>• <strong>Opcja transportowa:</strong> Pociąg lub autokar (ok. 1,5 h).</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#faf5ee] dark:bg-[#192233] border border-[#e8ded3] dark:border-[#24334a] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#1f1712] dark:text-white">4. Ruda Śląska (ok. 65 km)</span>
                      <Train className="w-4 h-4 text-blue-600" />
                    </div>
                    <ul className="text-xs text-[#614e3e] dark:text-[#94a3b8] space-y-1">
                      <li>• <strong>Opcja piesza:</strong> Wymarsz ok. 15 czerwca (3 dni drogi).</li>
                      <li>• <strong>Opcja transportowa:</strong> Dojazd Kolejami Śląskimi lub autokarem (ok. 1 h).</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Zagranica */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  Ścieżki spoza granic Polski (dojazd i integracja 17 czerwca):
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-[#faf5ee] dark:bg-[#192233] border border-[#e8ded3] dark:border-[#24334a] space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-purple-600" />
                      <span className="font-bold text-sm text-[#1f1712] dark:text-white">5. Praga (Czechy)</span>
                    </div>
                    <p className="text-xs text-[#614e3e] dark:text-[#94a3b8]">
                      Autokar przez Ostrawę i Gliwice prosto do Częstochowy (ok. 5–6 godzin).
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#faf5ee] dark:bg-[#192233] border border-[#e8ded3] dark:border-[#24334a] space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Train className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-sm text-[#1f1712] dark:text-white">6. Berlin (Niemcy)</span>
                    </div>
                    <p className="text-xs text-[#614e3e] dark:text-[#94a3b8]">
                      Pociąg do Poznania/Wrocławia z przesiadką do Częstochowy lub bezpośredni autokar.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#faf5ee] dark:bg-[#192233] border border-[#e8ded3] dark:border-[#24334a] space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-sm text-[#1f1712] dark:text-white">7. Lwów / Wilno</span>
                    </div>
                    <p className="text-xs text-[#614e3e] dark:text-[#94a3b8]">
                      Zorganizowane grupy autokarowe docierające dzień przed wymarszem, nocleg w domach pielgrzyma na Jasnej Górze.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ETAP II */}
            <div className="bg-white dark:bg-[#131a27] p-6 sm:p-8 rounded-3xl border border-[#e2d6c7] dark:border-[#222e44] shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-[#f0e6d9] dark:border-[#1e293b] pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold flex items-center justify-center text-sm border border-amber-500/30">
                    II
                  </span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold font-serif-book text-[#1f1712] dark:text-white">
                      ETAP II: Wspólny Szlak (18–24 czerwca)
                    </h3>
                    <p className="text-xs text-[#7d6b5b] dark:text-[#94a3b8]">
                      Jasna Góra (Częstochowa) ➔ Szlak Orlich Gniazd ➔ Ojców ➔ Łagiewniki • 174 km
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30">
                  Główny Szlak • 7 Dni
                </span>
              </div>

              <div className="space-y-3">
                {eagleTrailDays.map((d) => (
                  <div
                    key={d.day}
                    className={`p-4 rounded-2xl border transition-all ${
                      d.isSpecial
                        ? 'bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent border-amber-500/50 shadow-xs'
                        : 'bg-[#faf6f0] dark:bg-[#182130] border-[#ebe0d4] dark:border-[#222f44]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          d.isSpecial ? 'bg-rose-500 text-white' : 'bg-black/5 dark:bg-white/10 text-[#614e3e] dark:text-[#94a3b8]'
                        }`}>
                          Dzień {d.day} • {d.date}
                        </span>
                        <h4 className="font-bold text-sm text-[#1f1712] dark:text-white">{d.title}</h4>
                      </div>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{d.km} km</span>
                    </div>

                    <p className="text-xs font-mono text-[#7d6b5b] dark:text-[#94a3b8] mt-1.5">
                      Trasa: {d.route}
                    </p>

                    <p className="text-xs sm:text-sm text-[#473729] dark:text-[#cbd5e1] mt-2 leading-relaxed">
                      {d.highlight}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 flex items-center gap-1.5 text-xs text-[#6b5745] dark:text-[#94a3b8]">
                      <Tent className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span><strong>Nocleg:</strong> {d.lodging}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ETAP III */}
            <div className="bg-white dark:bg-[#131a27] p-6 sm:p-8 rounded-3xl border border-[#e2d6c7] dark:border-[#222e44] shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-[#f0e6d9] dark:border-[#1e293b] pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold flex items-center justify-center text-sm border border-amber-500/30">
                    III
                  </span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold font-serif-book text-[#1f1712] dark:text-white">
                      ETAP III: Rozesłanie i Powroty (24 i 25 czerwca)
                    </h3>
                    <p className="text-xs text-[#7d6b5b] dark:text-[#94a3b8]">Komunikacja kolejowa, autokary i domy pielgrzyma w Krakowie</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#f3e9dc] dark:bg-[#1e293d] text-[#6b5745] dark:text-[#94a3b8]">
                  24–25.06
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#473729] dark:text-[#cbd5e1] leading-relaxed">
                Po osiągnięciu celu w Łagiewnikach uczestnicy mogą skorzystać z doskonałej infrastruktury komunikacyjnej Krakowa, by wrócić do domów. Obok Sanktuarium znajduje się stacja kolejowa <strong>Kraków Sanktuarium / Kraków Łagiewniki</strong>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#faf5ee] dark:bg-[#192233] border border-[#e8ded3] dark:border-[#24334a] space-y-2">
                  <div className="flex items-center gap-2">
                    <Train className="w-4 h-4 text-blue-600" />
                    <h4 className="font-bold text-sm text-[#1f1712] dark:text-white">Kierunek Warszawa / Zagranica (Berlin, Praga)</h4>
                  </div>
                  <p className="text-xs text-[#614e3e] dark:text-[#94a3b8] leading-relaxed">
                    Bezpośrednie pociągi Pendolino/IC z Krakowa Głównego. Uczestnicy mogą podjechać z Łagiewnik do Dworca Głównego szybką koleją aglomeracyjną (ok. 15 min).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#faf5ee] dark:bg-[#192233] border border-[#e8ded3] dark:border-[#24334a] space-y-2">
                  <div className="flex items-center gap-2">
                    <Train className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-sm text-[#1f1712] dark:text-white">Kierunek Wrocław / Opole / Ruda Śląska</h4>
                  </div>
                  <p className="text-xs text-[#614e3e] dark:text-[#94a3b8] leading-relaxed">
                    Pociągi z Dworca Głównego jadące magistralą E30. Do Rudy Śląskiej i Opola pociągi docierają w 1,5 do 2 godzin.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#faf5ee] dark:bg-[#192233] border border-[#e8ded3] dark:border-[#24334a] space-y-2">
                  <div className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-amber-600" />
                    <h4 className="font-bold text-sm text-[#1f1712] dark:text-white">Autokary zorganizowane</h4>
                  </div>
                  <p className="text-xs text-[#614e3e] dark:text-[#94a3b8] leading-relaxed">
                    Z racji dużego parkingu przy Sanktuarium w Łagiewnikach oraz Centrum św. Jana Pawła II na Białych Morzach, to idealne miejsce na podstawienie autokarów, które zabiorą zwarte grupy bezpośrednio do ich miast i krajów.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#faf5ee] dark:bg-[#192233] border border-[#e8ded3] dark:border-[#24334a] space-y-2">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-600" />
                    <h4 className="font-bold text-sm text-[#1f1712] dark:text-white">Nocleg i przedłużenie pobytu</h4>
                  </div>
                  <p className="text-xs text-[#614e3e] dark:text-[#94a3b8] leading-relaxed">
                    Część grup może zdecydować się na pozostanie w Krakowie na noc z 24 na 25 czerwca (w domach pielgrzyma w Łagiewnikach lub w krakowskich szkołach/hostelach), by kolejnego dnia zwiedzić miasto i na spokojnie wyruszyć w drogę powrotną.
                  </p>
                </div>
              </div>

              {/* Dolny przycisk powrotu do nawigacji */}
              <div className="pt-2 flex justify-center">
                <a
                  href={googleMapsRouteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Otwórz mapę i nawigację w Google Maps</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2 Content: Promienie Gwiazdy */}
        {activeTab === 'rays' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {starRays.map((ray, i) => {
              const IconComp = ray.icon;
              return (
                <div key={i} className={`p-5 rounded-2xl border ${ray.bg} transition-all shadow-xs space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl bg-white dark:bg-black/30 ${ray.color}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 uppercase tracking-wider">
                        {ray.type}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#614e3e] dark:text-[#94a3b8]">{ray.days}</span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#1f1712] dark:text-white">{ray.name}</h3>
                    <p className="text-xs text-[#614e3e] dark:text-[#94a3b8] mt-0.5">Start: {ray.start}</p>
                  </div>

                  <div className="pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs font-semibold">
                    <span>Dystans trasy:</span>
                    <span className="font-bold">{ray.dist}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3 Content: Baza Noclegowa */}
        {activeTab === 'lodging' && (
          <div className="bg-white dark:bg-[#131a27] p-6 sm:p-8 rounded-3xl border border-[#e2d6c7] dark:border-[#222e44] shadow-xs space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold font-serif-book text-[#1f1712] dark:text-white">Baza Noclegowa i Miasteczka Namiotowe Jury</h2>
              <p className="text-xs sm:text-sm text-[#614e3e] dark:text-[#94a3b8]">
                Podczas Pielgrzymki Gwiaździstej przygotowano urozmaiconą bazę noclegową dla wszystkich uczestników:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#faf5ee] dark:bg-[#192233] border border-[#e8ded3] dark:border-[#24334a] space-y-2">
                <Tent className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-sm">Pola Namiotowe i Biwaki</h3>
                <p className="text-xs text-[#614e3e] dark:text-[#94a3b8]">
                  Główne Jurajskie Błonia Namiotowe w Ojcowie (Dzień Ojca), biwak pod Bobolicami, Podzamcze-Ogrodzieniec oraz pole Oleńka w Częstochowie.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#faf5ee] dark:bg-[#192233] border border-[#e8ded3] dark:border-[#24334a] space-y-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-sm">Szkoły i Hale Sportowe</h3>
                <p className="text-xs text-[#614e3e] dark:text-[#94a3b8]">
                  Dostęp do zaplecza sanitarnego, pryszniców i noclegu pod dachem w Janowie, Kluczach, Olkuszu i Skale.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#faf5ee] dark:bg-[#192233] border border-[#e8ded3] dark:border-[#24334a] space-y-2">
                <Heart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="font-bold text-sm">Domy Pielgrzyma</h3>
                <p className="text-xs text-[#614e3e] dark:text-[#94a3b8]">
                  Klasztor Jasna Góra, Pustelnia bł. Salomei w Grodzisku oraz Domy Pielgrzyma w Sanktuarium Bożego Miłosierdzia w Łagiewnikach.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#faf5ee] dark:bg-[#192233] border border-[#e8ded3] dark:border-[#24334a] space-y-2">
                <Compass className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-sm">Agroturystyka i Gościna</h3>
                <p className="text-xs text-[#614e3e] dark:text-[#94a3b8]">
                  Jurajskie gospodarstwa agroturystyczne w Złotym Potoku, Podlesicach, Mirowie, Sułoszowej i Ojcowie.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4 Content: Transmisje LIVE */}
        {activeTab === 'live' && (
          <div className="bg-white dark:bg-[#131a27] p-6 sm:p-8 rounded-3xl border border-[#e2d6c7] dark:border-[#222e44] shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold font-serif-book text-[#1f1712] dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
                  Centrum Transmisji na Żywo (YouTube Live)
                </h2>
                <p className="text-xs sm:text-sm text-[#614e3e] dark:text-[#94a3b8]">
                  Oglądaj na żywo relacje z trasy, drona jurajskiego i Sanktuarium w Łagiewnikach.
                </p>
              </div>
              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-2"
              >
                <Tv className="w-4 h-4" />
                <span>Otwórz na YouTube</span>
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#faf5ee] dark:bg-[#18202d] border border-[#e8ded3] dark:border-[#24334a] space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-600">Kamera Główna</div>
                <h3 className="text-sm font-bold text-[#1f1712] dark:text-white">Szlak Orlich Gniazd – Mobilna Kamera Czoła Pielgrzymki</h3>
                <p className="text-xs text-[#614e3e] dark:text-[#94a3b8]">Transmisja HD z mobilnego wozu transmisyjnego i drona.</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#faf5ee] dark:bg-[#18202d] border border-[#e8ded3] dark:border-[#24334a] space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-600">Wydarzenie Specjalne</div>
                <h3 className="text-sm font-bold text-[#1f1712] dark:text-white">Czuwanie w Dniu Ojca pod Bramą Krakowską (Ojców)</h3>
                <p className="text-xs text-[#614e3e] dark:text-[#94a3b8]">Wieczorna modlitwa i różaniec 23.06 o 20:00.</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#faf5ee] dark:bg-[#18202d] border border-[#e8ded3] dark:border-[#24334a] space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">Transmisja 24/7</div>
                <h3 className="text-sm font-bold text-[#1f1712] dark:text-white">Kaplica Cudownego Obrazu Jezusa Miłosiernego (Łagiewniki)</h3>
                <p className="text-xs text-[#614e3e] dark:text-[#94a3b8]">Modlitwa w Godzinie Miłosierdzia o 15:00.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5 Content: Pielgrzymka Cyfrowa & Intencje */}
        {activeTab === 'digital' && (
          <div className="bg-white dark:bg-[#131a27] p-6 sm:p-8 rounded-3xl border border-[#e2d6c7] dark:border-[#222e44] shadow-xs space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold font-serif-book text-[#1f1712] dark:text-white">Cyfrowy Udział w Pielgrzymce Gwiaździstej</h2>
              <p className="text-xs sm:text-sm text-[#614e3e] dark:text-[#94a3b8]">
                Jeśli nie możesz wyruszyć w drogę pieszo lub rowerem, połącz się duchowo ze swojego smartfona lub komputera:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-[#faf5ee] dark:bg-[#192233] border border-[#e8ded3] dark:border-[#24334a] space-y-3">
                <Heart className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                <h3 className="font-bold text-base">Złóż Intencję Modlitewną</h3>
                <p className="text-xs sm:text-sm text-[#614e3e] dark:text-[#94a3b8] leading-relaxed">
                  Twoja intencja zostanie dołączona do modlitewnika niesionego przez pielgrzymów na Wały Jasnogórskie i do Sanktuarium Bożego Miłosierdzia w Łagiewnikach.
                </p>
                <a
                  href="/mapa/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition"
                >
                  <span>Wpisz intencję w aplikacji mapy</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-5 rounded-2xl bg-[#faf5ee] dark:bg-[#192233] border border-[#e8ded3] dark:border-[#24334a] space-y-3">
                <Globe className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-base">Certyfikat Pielgrzyma</h3>
                <p className="text-xs sm:text-sm text-[#614e3e] dark:text-[#94a3b8] leading-relaxed">
                  Pobierz oficjalny imienny Certyfikat Uczestnictwa w Pielgrzymce Gwiaździstej z pieczęcią Jasnej Góry i Łagiewnik.
                </p>
                <a
                  href="/mapa/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                >
                  <span>Wygeneruj Certyfikat</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

      </section>

      {/* 5. Info Modal Dialog */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#fdfbf7] dark:bg-[#0c121e] rounded-3xl border border-amber-500/30 shadow-2xl p-6 sm:p-8 relative max-h-[92vh] overflow-y-auto my-6 space-y-6">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white cursor-pointer transition"
              title="Zamknij okno informacyjne"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="pr-8 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300 text-xs font-bold">
                <Info className="w-3.5 h-3.5" />
                <span>Informacje & Przewodnik Pielgrzymki</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-heading-cinzel font-bold text-[#2a221b] dark:text-[#f8fafc]">
                Wielka Pielgrzymka Gwiaździsta & Szlak Orlich Gniazd
              </h2>
              <p className="text-xs sm:text-sm text-[#7a6857] dark:text-[#94a3b8]">
                Termin: corocznie 18 – 24 czerwca • Dystans pieszy: 174 km (Częstochowa ➔ Kraków-Łagiewniki)
              </p>
            </div>

            {/* AI Lector Audio Player in Modal */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-600/15 via-orange-600/10 to-amber-700/20 dark:from-amber-950/40 dark:via-orange-950/25 dark:to-amber-900/30 border border-amber-500/40 dark:border-amber-500/30 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={`p-2.5 rounded-xl text-white shadow-xs ${
                  isLectorPlaying ? 'bg-rose-600 animate-pulse' : 'bg-amber-600'
                }`}>
                  {isLectorPlaying ? <Square className="w-4 h-4 fill-white" /> : <Headphones className="w-4 h-4" />}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      Lektor AI • Audioprzewodnik
                    </span>
                    {isLectorPlaying && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
                        GŁOS WŁĄCZONY
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-[#1f1712] dark:text-white">
                    Posłuchaj o idei dwóch gwiazd, Trójkącie Trójcy Świętej, 7 dniach szlaku, przesileniu 21 czerwca i blogu „Widoki na Raj”
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleLector}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
                    isLectorPlaying
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white'
                  }`}
                >
                  {isLectorPlaying ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-white" />
                      <span>Zatrzymaj Lektora AI</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Odsłuchaj Lektora AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Duchowa Architektura: Dwie Gwiazdy & Trójkąt Trójcy Świętej */}
            <div className="p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Duchowa Architektura: Dwie Gwiazdy & Trójkąt Trójcy Świętej</span>
              </div>
              <p className="text-xs sm:text-sm text-[#473729] dark:text-[#cbd5e1] leading-relaxed">
                Pielgrzymka opiera się na idei <strong>dwóch wielkich gwiazd</strong> (promienie zbiegające się na Jasnej Górze oraz rozchodzące się ze Wzgórza Bożego Miłosierdzia w Łagiewnikach). 
                Co najważniejsze: <strong>każda grupa pielgrzymkowa, wracając skąd przyszła, tworzy na mapie ramiona trójkąta</strong> (Dom ➔ Częstochowa ➔ Kraków-Łagiewniki ➔ Dom), w widzialny sposób przypominając o <strong>Trójcy Przenajświętszej</strong> (Ojcu, Synu i Duchu Świętym) oraz wpisując tajemnicę Bożej jedności i miłości w geografię naszej ziemi.
              </p>
            </div>

            {/* Przykładowy Szlak: Ruda Śląska */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-600/10 via-stone-900/5 to-amber-700/10 dark:from-stone-900/80 dark:to-stone-950/90 border border-amber-500/35 space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm">
                  <Compass className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Przykładowy Szlak Trójkąta: Ruda Śląska ➔ Jasna Góra ➔ Łagiewniki ➔ Ruda Śląska</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href="/mapa/trasa_orle_gniazda_czestochowa_lagiewniki.csv"
                    download="trasa_orle_gniazda_czestochowa_lagiewniki.csv"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV Orle Gniazda (7 dni)</span>
                  </a>
                  <a
                    href="/mapa/trasa_ruda_slaska_trojkat.csv"
                    download="trasa_ruda_slaska_trojkat.csv"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV Trójkąt (15 dni)</span>
                  </a>
                </div>
              </div>
              <p className="text-xs text-[#524133] dark:text-[#cbd5e1] leading-relaxed">
                Modelowa, 15-dniowa trasa piesza idealnie ilustrująca zamknięcie geometrycznego trójkąta ku czci Trójcy Przenajświętszej. 
                Możesz przeglądać całą trasę na interaktywnej mapie Google Maps:{' '}
                <a
                  href="https://www.google.com/maps/d/u/0/edit?mid=1VVkkzCIpWQ3AUUWu9F9nNH2ot8TZGeE&ll=50.415082274554095%2C19.5170855&z=9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline text-amber-700 dark:text-amber-400 hover:text-amber-900"
                >
                  Otwórz mapę Trójkąta w Google Maps (skala z=9)
                </a>.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                <div className="p-3 rounded-xl bg-white/70 dark:bg-white/5 border border-amber-500/20 space-y-1">
                  <strong className="text-amber-800 dark:text-amber-300 block">BOK I (14–17.06 • 92.6 km)</strong>
                  <p className="text-[#6b5543] dark:text-[#94a3b8] leading-relaxed">
                    Start: <strong>Ruda Śląska-Kochłowice (Parafia Trójcy Przenajświętszej & kaplica Sanktuarium MB z Lourdes)</strong> ➔ Piekary Śląskie (Bazylika & Kalwaria) ➔ Świerklaniec ➔ Woźniki ➔ Poraj ➔ <strong>Jasna Góra w Częstochowie</strong>.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 dark:bg-white/5 border border-emerald-500/20 space-y-1">
                  <strong className="text-emerald-800 dark:text-emerald-300 block">BOK II (18–24.06 • 174 km)</strong>
                  <p className="text-[#6b5543] dark:text-[#94a3b8] leading-relaxed">
                    Wspólny Szlak Orlich Gniazd z Jasnej Góry przez jurajskie warownie: Złoty Potok ➔ Bobolice/Mirów ➔ Ogrodzieniec ➔ Czubatka (21.06) ➔ Pieskowa Skała ➔ Ojców (23.06 w Dzień Ojca) ➔ <strong>Łagiewniki (Sanktuarium Bożego Miłosierdzia)</strong>.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 dark:bg-white/5 border border-sky-500/20 space-y-1">
                  <strong className="text-sky-800 dark:text-sky-300 block">BOK III (25–28.06 • 105.3 km)</strong>
                  <p className="text-[#6b5543] dark:text-[#94a3b8] leading-relaxed">
                    Powrót po Rozesłaniu: Tyniec (Benedyktyni) ➔ Alwernia (Bernardyni) ➔ Chrzanów ➔ Jaworzno ➔ Mysłowice ➔ Panewniki (Bazylika) ➔ <strong>finałowe domknięcie trójkąta w kościele Trójcy Przenajświętszej w Rudzie Śląskiej</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Google Maps Multi-Modal Box */}
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-sm">
                  <Navigation className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ścieżka w Google Maps (Główne węzły etapowe)</span>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
                  samochód • pociąg • pieszo • rower
                </span>
              </div>
              <p className="text-xs text-[#473729] dark:text-[#cbd5e1] leading-relaxed">
                Przystanki: Jasna Góra ➔ Złoty Potok ➔ Zamek Bobolice ➔ Zamek Ogrodzieniec ➔ Ojców ➔ Sanktuarium Bożego Miłosierdzia w Łagiewnikach.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={googleMapsModes.walking}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#111722] hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-600/30 text-emerald-800 dark:text-emerald-200 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Footprints className="w-3.5 h-3.5" />
                  <span>🚶 Pieszo</span>
                </a>
                <a
                  href={googleMapsModes.driving}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#111722] hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-600/30 text-emerald-800 dark:text-emerald-200 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>🚗 Samochód</span>
                </a>
                <a
                  href={googleMapsModes.bicycling}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#111722] hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-600/30 text-emerald-800 dark:text-emerald-200 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>🚲 Rower</span>
                </a>
                <a
                  href={googleMapsModes.transit}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#111722] hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-600/30 text-emerald-800 dark:text-emerald-200 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Train className="w-3.5 h-3.5" />
                  <span>🚆 Pociąg</span>
                </a>
                <a
                  href={googleMapsRouteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Pełna Trasa Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Harmonogram 7 Dni */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold font-serif-book text-[#1f1712] dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Harmonogram Szlaku (18–24 czerwca):</span>
              </h3>
              <div className="space-y-3">
                {eagleTrailDays.map((d) => (
                  <div
                    key={d.day}
                    className={`p-4 rounded-2xl border transition-all ${
                      d.isSpecial
                        ? 'bg-amber-500/10 border-amber-500/50'
                        : 'bg-white dark:bg-[#141b28] border-[#ebe0d4] dark:border-[#202c40]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          d.isSpecial ? 'bg-rose-500 text-white' : 'bg-black/5 dark:bg-white/10 text-[#614e3e] dark:text-[#94a3b8]'
                        }`}>
                          Dzień {d.day} • {d.date}
                        </span>
                        <h4 className="font-bold text-sm text-[#1f1712] dark:text-white">{d.title}</h4>
                      </div>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{d.km} km</span>
                    </div>
                    <p className="text-xs font-mono text-[#7d6b5b] dark:text-[#94a3b8] mt-1">Trasa: {d.route}</p>
                    <p className="text-xs text-[#473729] dark:text-[#cbd5e1] mt-1.5 leading-relaxed">{d.highlight}</p>
                    <div className="mt-2 pt-1.5 border-t border-black/5 dark:border-white/5 flex items-center gap-1.5 text-xs text-[#6b5745] dark:text-[#94a3b8]">
                      <Tent className="w-3 h-3 text-amber-600" />
                      <span><strong>Nocleg:</strong> {d.lodging}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Zamknij Info
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
