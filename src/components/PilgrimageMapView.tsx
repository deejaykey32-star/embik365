import React, { useState, useRef } from 'react';
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
  Info
} from 'lucide-react';
import { SectionMeta } from '../types';

interface Props {
  section?: SectionMeta;
  currentLang?: string;
  theme?: 'light' | 'dark';
}

export const PilgrimageMapView: React.FC<Props> = ({ currentLang = 'pl', theme = 'light' }) => {
  const [activeStage, setActiveStage] = useState<'stage-1' | 'stage-2' | 'stage-3'>('stage-2');
  const [activeTab, setActiveTab] = useState<'trail' | 'rays' | 'lodging' | 'live' | 'digital'>('trail');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
          title: 'Wielka Pielgrzymka Gwiaździsta 2026 & Szlak Orlich Gniazd',
          text: 'Interaktywna mapa i przewodnik Pielgrzymki Gwiaździstej 2026 do Częstochowy i Łagiewnik.',
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

  // Harmonogram 7 dni Szlaku Orlich Gniazd (Etap II)
  const eagleTrailDays = [
    {
      day: 1,
      date: '18.06.2026 (Czw)',
      title: 'Jasna Góra ➔ Złoty Potok',
      km: 28,
      route: 'Jasna Góra – Zamek Olsztyn – Zrębice – Złoty Potok',
      highlight: 'Uroczysty start z Wałów Jasnogórskich o 07:00 po Mszy Świętej inaugurującej Zjednoczenie.',
      lodging: 'Pole namiotowe Błonia Złoty Potok & Hala Gimnastyczna w Janowie'
    },
    {
      day: 2,
      date: '19.06.2026 (Pt)',
      title: 'Złoty Potok ➔ Zamek Bobolice / Mirów',
      km: 24,
      route: 'Złoty Potok – Ostrężnik – Zamek Mirów – Zamek Bobolice',
      highlight: 'Przejście malowniczą Grzędą Mirowską między bliźniaczymi zamkami.',
      lodging: 'Biwak u stóp Zamku Bobolice & Gospodarstwa Agroturystyczne w Mirowie'
    },
    {
      day: 3,
      date: '20.06.2026 (Sob)',
      title: 'Bobolice ➔ Zamek Ogrodzieniec',
      km: 26,
      route: 'Bobolice – Góra Zborów (Podlesice) – Zamek Morsko – Skarżyce – Ogrodzieniec',
      highlight: 'Panorama Jury z Góry Zborów oraz wieczorne nabożeństwo światła na dziedzińcu Zamku Ogrodzieniec.',
      lodging: 'Główne Miasteczko Namiotowe Podzamcze / Ogrodzieniec'
    },
    {
      day: 4,
      date: '21.06.2026 (Nd)',
      title: 'Ogrodzieniec ➔ Klucze / Pustynia Błędowska',
      km: 27,
      route: 'Ogrodzieniec – Zamek Smoleń (Dolina Wodącej) – Bydlin – Klucze',
      highlight: 'Przejście skrajem Pustyni Błędowskiej i modlitwa anioła pokoju na punkcie widokowym Czubatka.',
      lodging: 'Szkoła Podstawowa w Kluczach & Pole Biwakowe Pustynia Błędowska'
    },
    {
      day: 5,
      date: '22.06.2026 (Pon)',
      title: 'Klucze ➔ Zamek Pieskowa Skała',
      km: 25,
      route: 'Klucze – Olkusz – Zamek Rabsztyn – Sułoszowa – Zamek Pieskowa Skała',
      highlight: 'Dolina Prądnika, Maczuga Herkulesa i Renesansowy Zamek Pieskowa Skała.',
      lodging: 'Tereny Rekreacyjne w Sułoszowej & Parafia św. Wawrzyńca'
    },
    {
      day: 6,
      date: '23.06.2026 (Wt) — DZIEŃ OJCA',
      title: 'Pieskowa Skała ➔ OJCOW (Nocleg w Dzień Ojca)',
      km: 18,
      route: 'Pieskowa Skała – Grodzisko (Pustelnia bł. Salomei) – Brama Krakowska – Ojców',
      highlight: '🌟 WIELKIE CZUWANIE W DZIEŃ OJCA: Modlitwa za ojców, rodziny i dzieci pod Bramą Krakowską w Ojcowie. Błogosławieństwo Ojcowskie.',
      lodging: 'Główne Jurajskie Błonia Namiotowe w Ojcowie (Złota Góra / Dolina Prądnika) & Domy Gościnne',
      isSpecial: true
    },
    {
      day: 7,
      date: '24.06.2026 (Śr)',
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
                SZLAK WIARY & NADZIEI 2026
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Mapa Interaktywna
              </span>
            </div>

            <div className="flex items-center gap-2">
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
                title="Przejdź do oficjalnego serwisu https://mapa-aon.pages.dev"
              >
                <span>Otwórz mapa-aon.pages.dev</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-book tracking-tight text-[#1f1712] dark:text-white">
              Wielka Pielgrzymka Gwiaździsta 2026
            </h1>
            <p className="text-base sm:text-lg text-[#614e3e] dark:text-[#94a3b8] max-w-4xl font-sans-ui leading-relaxed">
              Interaktywna platforma multimedialno-geograficzna obsługująca 3 kluczowe etapy: 
              <span className="font-semibold text-amber-800 dark:text-amber-300"> Promienie z całego świata ku Jasnej Górze</span>, 
              wspólny <span className="font-semibold text-amber-800 dark:text-amber-300">Szlak Orlich Gniazd (164 km Częstochowa ➔ Łagiewniki)</span> z 
              niezwykłym <span className="underline decoration-amber-500 font-bold text-amber-900 dark:text-amber-200">czuwaniem w Ojcowie w Dzień Ojca</span> oraz 
              uroczyste <span className="font-semibold text-amber-800 dark:text-amber-300">Rozesłanie ze wzgórza Bożego Miłosierdzia</span>.
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
                <span className="text-xs text-[#7d6b5b] dark:text-[#64748b]">Do 17.06.2026</span>
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
                Dzień Ojca w Ojcowie
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Etap II (Główny)</span>
              </div>
              <div className="text-sm font-bold text-[#1f1712] dark:text-white mt-1">Szlak Orlich Gniazd (164 km)</div>
              <div className="text-xs text-[#614e3e] dark:text-[#94a3b8] mt-0.5">18 – 24 czerwca 2026 (7 dni)</div>
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
                <span className="text-xs text-[#7d6b5b] dark:text-[#64748b]">24.06.2026</span>
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

          <div className="flex items-center gap-2">
            <a
              href="https://mapa-aon.pages.dev"
              target="_blank"
              rel="noopener noreferrer"
              title="Otwórz samodzielną aplikację na mapa-aon.pages.dev"
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition"
            >
              <span>mapa-aon.pages.dev</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleReloadMap}
              title="Odśwież widok mapy"
              className="p-2.5 rounded-xl bg-white/90 dark:bg-[#111723]/90 backdrop-blur-md border border-[#e2d6c7] dark:border-[#233149] text-[#4a392b] dark:text-white shadow-xs hover:bg-[#faf6f0] dark:hover:bg-[#182234] transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsFullscreen(f => !f)}
              title={isFullscreen ? 'Zmniejsz mapę' : 'Pełny ekran mapy'}
              className="p-2.5 rounded-xl bg-white/90 dark:bg-[#111723]/90 backdrop-blur-md border border-[#e2d6c7] dark:border-[#233149] text-[#4a392b] dark:text-white shadow-xs hover:bg-[#faf6f0] dark:hover:bg-[#182234] transition cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Map Card with Fullscreen Toggle */}
        <div className={`relative bg-white dark:bg-[#131a27] rounded-3xl border border-[#e2d6c7] dark:border-[#222e44] shadow-md overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0' : 'h-[620px] sm:h-[680px]'
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
            title="Pielgrzymka Gwiaździsta 2026 - Interaktywna Mapa"
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

        {/* Tab 1 Content: Szlak Orlich Gniazd dzień po dniu */}
        {activeTab === 'trail' && (
          <div className="space-y-4">
            <div className="bg-[#fefce8] dark:bg-[#1a1708] border border-amber-300 dark:border-amber-800/60 p-4 rounded-2xl flex items-center gap-3">
              <Calendar className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0" />
              <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                <span className="font-bold">Termin: 18 – 24 czerwca 2026 r.</span> Długość trasy: 164 km. 
                Punkt kulminacyjny wędrówki: <span className="underline font-bold">Dzień 6 (23.06) w Dzień Ojca z noclegiem na Błoniach w Ojcowie</span> pod Bramą Krakowską.
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
                <p className="text-xs text-[#614e3e] dark:text-[#94a3b8]">Wieczorna modlitwa i różaniec 23.06.2026 o 20:00.</p>
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
                <h3 className="font-bold text-base">Certyfikat Pielgrzyma 2026</h3>
                <p className="text-xs sm:text-sm text-[#614e3e] dark:text-[#94a3b8] leading-relaxed">
                  Pobierz oficjalny imienny Certyfikat Uczestnictwa w Pielgrzymce Gwiaździstej 2026 z pieczęcią Jasnej Góry i Łagiewnik.
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

    </div>
  );
};
