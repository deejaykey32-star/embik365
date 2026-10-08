import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  ExternalLink, 
  Share2, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  QrCode, 
  ShieldCheck, 
  BookOpen, 
  Compass, 
  ScrollText, 
  Volume2, 
  Play, 
  Calendar,
  Layers,
  Heart,
  Award,
  ChevronRight,
  Info
} from 'lucide-react';
import { SectionMeta } from '../types';
import { generateAndDownloadQrBadgePng } from '../utils/qrCodeService';

interface Props {
  section?: SectionMeta;
  currentLang?: string;
  theme?: 'light' | 'dark';
}

export const NowyRhzView: React.FC<Props> = ({ currentLang = 'pl', theme = 'light' }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const standaloneUrl = '/nowyrhz/';

  const handleReload = () => {
    setIframeKey(k => k + 1);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/nowyrhz/`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Nowy Różaniec Historii Zbawienia (175 dni)',
          text: '7 etapów × 5 części × 5 tajemnic = 175 dni modlitwy z dopowiedzeniami i lektorem mowy.',
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

  const handleDownloadQr = () => {
    const fullUrl = `${window.location.origin}/nowyrhz/`;
    generateAndDownloadQrBadgePng({
      id: 'nowyrhz',
      title: 'Nowy Różaniec Historii Zbawienia (175 dni)',
      displayLabel: 'widokinaraj.pl/nowyrhz/',
      shortUrl: fullUrl,
      fullUrl: fullUrl,
      category: 'nowyrhz',
      createdAt: new Date().toISOString()
    });
  };

  // 7 Etapów Nowego RHZ (175 dni)
  const stages = [
    {
      num: 'I',
      title: 'Księgi Historyczne Starego Przymierza',
      days: 'Dni 1 – 25',
      desc: 'Od Stworzenia, przez Przymierze z Abrahamem, Wyjście z Egiptu i Ziemię Obiecaną, aż po Królestwo Dawida i Niewolę Babilońską.',
      parts: ['Tajemnice Początku', 'Tajemnice Wiary', 'Tajemnice Wyzwolenia', 'Tajemnice Przymierza', 'Tajemnice Królestwa'],
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
    },
    {
      num: 'II',
      title: 'Księgi Mądrościowe i Modlitwy ST',
      days: 'Dni 26 – 50',
      desc: 'Mądrość serca, tajemnica cierpienia Hioba, modlitwa Psalmów, zmaganie Koheleta i mistyczna miłość Pieśni nad Pieśniami.',
      parts: ['Tajemnice Mądrości', 'Tajemnice Cierpienia i Próby', 'Tajemnice Uwielbienia (Psalmy)', 'Tajemnice Miłości Oblubieńczej', 'Tajemnice Zaufania w Przemijaniu'],
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
    },
    {
      num: 'III',
      title: 'Prorocy i Zapowiedzi Mesjańskie',
      days: 'Dni 51 – 75',
      desc: 'Głos wołających na pustyni: obietnica Emmanuela, Nowego Przymierza, Cierpiącego Sługi Jahwe i Ducha wylewającego się na wszelkie ciało.',
      parts: ['Tajemnice Powołania Proroków', 'Tajemnice Sprawiedliwości i Sądu', 'Tajemnice Pocieszenia i Nadziei', 'Tajemnice Cierpiącego Sługi Jahwe', 'Tajemnice Nowego Serca i Nowego Ducha'],
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
    },
    {
      num: 'IV',
      title: 'Życie Jezusa i Maryi (Centrum Historii)',
      days: 'Dni 76 – 100',
      desc: 'Serce całego różańca: Tajemnice Radosne, Światła, Bolesne, Chwalebne oraz Tajemnice Ciszy i Ukrytego Życia w Nazarecie.',
      parts: ['Tajemnice Radosne (Wcielenie)', 'Tajemnice Światła (Objawienie Królestwa)', 'Tajemnice Bolesne (Odkupienie)', 'Tajemnice Chwalebne (Zmartwychwstanie)', 'Tajemnice Ciszy i Trwania'],
      badgeColor: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800'
    },
    {
      num: 'V',
      title: 'Dzieje Apostolskie i Narodziny Kościoła',
      days: 'Dni 101 – 125',
      desc: 'Zesłanie Ducha Świętego, ogień Wieczernika, pierwsze wspólnoty w Jerozolimie, męczeństwo Szczepana i misja narodów aż po krańce ziemi.',
      parts: ['Tajemnice Ognia Ducha Świętego', 'Tajemnice Pierwszej Wspólnoty', 'Tajemnice Świadectwa i Męczeństwa', 'Tajemnice Drogi do Pogan (Św. Paweł)', 'Tajemnice Kościoła w Drodze'],
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
    },
    {
      num: 'VI',
      title: 'Listy Apostolskie i Życie w Chrystusie',
      days: 'Dni 126 – 150',
      desc: 'Teologia łaski, hymn o miłości, zbroja Boża, walka duchowa, życie w Duchu i codzienna wierność Ewangelii we wspólnocie.',
      parts: ['Tajemnice Łaski i Usprawiedliwienia', 'Tajemnice Ciała Chrystusa', 'Tajemnice Hymnu o Miłości', 'Tajemnice Zbroi Bożej i Walki', 'Tajemnice Nadziei i Wytrwałości'],
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
    },
    {
      num: 'VII',
      title: 'Apokalipsa i Nowe Jeruzalem',
      days: 'Dni 151 – 175',
      desc: 'Zwycięski Baranek na Tronie, pokonanie wszelkiego zła, Ostateczne Zwycięstwo Boga, Wesele Baranka oraz Nowe Niebo i Nowa Ziemia.',
      parts: ['Tajemnice Zwycięzcy i Świadka Wiernego', 'Tajemnice Baranka na Tronie', 'Tajemnice Niewiasty Obleczonej w Słońce', 'Tajemnice Wesela Baranka i Oblubienicy', 'Tajemnice Nowego Nieba i Nowej Ziemi'],
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
    }
  ];

  return (
    <div className="min-h-screen bg-[#faf7f2] dark:bg-[#080d16] text-[#2c241e] dark:text-[#e4e8f0] pb-24 transition-colors duration-300 font-sans-ui">
      
      {/* 1. Hero Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f2ece2] via-[#faf6ef] to-[#faf7f2] dark:from-[#0d1525] dark:via-[#090f1a] dark:to-[#080d16] border-b border-[#e5d8c8] dark:border-[#1d2738] pt-10 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Top badges & action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-600/15 to-sky-600/15 border border-amber-600/30 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Nowy Różaniec Historii Zbawienia • 175 Dni</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#121a28] hover:bg-[#f0e8dc] dark:hover:bg-[#1a2538] border border-[#d8c8b4] dark:border-[#24334a] text-xs font-semibold text-[#4e3d2d] dark:text-slate-200 transition cursor-pointer shadow-xs"
                title="Udostępnij link"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Skopiowano link!' : 'Udostępnij'}</span>
              </button>

              <button
                onClick={handleDownloadQr}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#121a28] hover:bg-[#f0e8dc] dark:hover:bg-[#1a2538] border border-[#d8c8b4] dark:border-[#24334a] text-xs font-semibold text-[#4e3d2d] dark:text-slate-200 transition cursor-pointer shadow-xs"
                title="Pobierz kod QR"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kod QR</span>
              </button>

              <a
                href={standaloneUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Otwórz pełną aplikację Nowy RHZ w nowej karcie"
              >
                <span>Otwórz w osobnym oknie</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Title and summary */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-book tracking-tight text-[#1c1611] dark:text-white flex items-center gap-3">
              <span>Nowy RHZ</span>
              <span className="text-lg sm:text-2xl font-light text-amber-700 dark:text-amber-400 font-sans-ui">
                – Różaniec Historii Zbawienia
              </span>
            </h1>

            <div className="inline-block px-4 py-1.5 rounded-xl bg-amber-100/90 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/40">
              <p className="font-heading-cinzel font-bold text-sm sm:text-base text-amber-950 dark:text-amber-200 tracking-wide">
                7 etapów × 5 części × 5 tajemnic = 175 dni modlitwy
              </p>
            </div>

            <p className="text-base sm:text-lg text-[#5e4b3b] dark:text-[#9bb0cf] max-w-4xl font-sans-ui leading-relaxed">
              Kompleksowa modlitwa różańcowa prowadząca przez całe Pismo Święte i Dzieje Kościoła: od Stworzenia Świata, przez Przymierze z Abrahamem, Wyjście z Egiptu, mądrość Psalmów i Proroków, tajemnice życia Jezusa i Maryi, aż po Dzieje Apostolskie, Listy i Nowe Jeruzalem w Apokalipsie. 
              Każdego dnia rozważana jest <strong className="text-amber-900 dark:text-amber-200 font-semibold">jedna tajemnica (jedna dziesiątka)</strong> z <strong className="text-amber-900 dark:text-amber-200 font-semibold">10 dopowiedzeniami</strong> po słowie „Jezus” do każdego „Zdrowaś Maryjo”, własną modlitwą końcową oraz syntezą mowy lektora.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Interactive Live Application Container */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className={`relative bg-white dark:bg-[#0c1322] rounded-3xl border border-amber-500/30 dark:border-amber-500/20 shadow-xl overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'fixed inset-2 z-50 rounded-2xl flex flex-col' : ''
        }`}>
          
          {/* Frame Toolbar */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#1f3a5f] via-[#1a2d48] to-[#142337] text-white flex items-center justify-between gap-3 border-b border-amber-500/20">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 truncate">
                  <span>Aplikacja Nowy RHZ</span>
                  <span className="hidden sm:inline-block px-2 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Offline & Lektor Audio
                  </span>
                </div>
                <div className="text-[11px] text-amber-200/80 font-mono truncate">
                  Dziś • Tajemnice • Auto • Ustawienia • PWA
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleReload}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Odśwież aplikację"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsFullscreen(f => !f)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title={isFullscreen ? 'Zmniejsz okno' : 'Powiększ na pełny ekran'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <a
                href={standaloneUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer"
                title="Otwórz w nowej karcie"
              >
                <span className="hidden sm:inline">Nowe okno</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Iframe View */}
          <div className={`relative w-full ${isFullscreen ? 'flex-1' : 'h-[680px] sm:h-[780px]'} bg-[#f7f4ee] dark:bg-[#15171b]`}>
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={standaloneUrl}
              title="Nowy Różaniec Historii Zbawienia"
              className="w-full h-full border-0"
              allow="autoplay; clipboard-write"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
            />
          </div>

          {/* Frame footer helper */}
          {!isFullscreen && (
            <div className="px-4 py-2.5 bg-[#f4ece1] dark:bg-[#0e1626] border-t border-[#e2d5c5] dark:border-[#1a2538] flex flex-wrap items-center justify-between text-xs text-[#715c4b] dark:text-[#8ba2c4] gap-2">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>Aplikacja zapamiętuje postęp, datę startu i wybrane tempo lektora bezpośrednio w pamięci urządzenia.</span>
              </div>
              <div className="font-mono text-[11px] text-[#8a725f] dark:text-[#6a809f]">
                /nowyrhz/
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Features & Capabilities Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="text-center max-w-3xl mx-auto mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-serif-book text-[#2a221b] dark:text-white">
            Kluczowe funkcje i możliwości Nowego RHZ
          </h2>
          <p className="text-sm sm:text-base text-[#675443] dark:text-[#8ea2c0]">
            Aplikacja została zaprojektowana z myślą o pełnej wygodzie codziennej modlitwy, zarówno na smartfonie, jak i komputerze.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          <div className="bg-white dark:bg-[#0f1726] border border-[#e5d8c8] dark:border-[#1e2a3c] rounded-2xl p-5 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2a2119] dark:text-white">
              175 Dni Kontemplacji
            </h3>
            <p className="text-xs sm:text-sm text-[#665444] dark:text-[#8ea3c2] leading-relaxed">
              Jeden dzień to jedna tajemnica (jedna dziesiątka różańca). Cykl trwa dokładnie 25 tygodni (pół roku), obejmując całe Pismo Święte i dzieje chrześcijaństwa.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0f1726] border border-[#e5d8c8] dark:border-[#1e2a3c] rounded-2xl p-5 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 flex items-center justify-center font-bold">
              <ScrollText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2a2119] dark:text-white">
              10 Dopowiedzeń w Każdej Dziesiątce
            </h3>
            <p className="text-xs sm:text-sm text-[#665444] dark:text-[#8ea3c2] leading-relaxed">
              Do każdego „Zdrowaś Maryjo” po imieniu „Jezus” przypisane jest własne, natchnione dopowiedzenie wprowadzające w głębię danej tajemnicy zbawienia.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0f1726] border border-[#e5d8c8] dark:border-[#1e2a3c] rounded-2xl p-5 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
              <Volume2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2a2119] dark:text-white">
              Lektor Syntezy Mowy (TTS)
            </h3>
            <p className="text-xs sm:text-sm text-[#665444] dark:text-[#8ea3c2] leading-relaxed">
              Wbudowany lektor odczytuje modlitwy, teksty Pisma i dopowiedzenia z możliwością wyboru głosu i precyzyjnej regulacji tempa czytania.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0f1726] border border-[#e5d8c8] dark:border-[#1e2a3c] rounded-2xl p-5 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 flex items-center justify-center font-bold">
              <Play className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2a2119] dark:text-white">
              Tryb Ciągły Auto
            </h3>
            <p className="text-xs sm:text-sm text-[#665444] dark:text-[#8ea3c2] leading-relaxed">
              Odtwarzacz automatyczny prowadzi całą dziesiątkę krok po kroku z dopowiedzeniami, pozwalając na skupienie i modlitwę w drodze lub podróży.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0f1726] border border-[#e5d8c8] dark:border-[#1e2a3c] rounded-2xl p-5 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2a2119] dark:text-white">
              100% Prywatności i Offline
            </h3>
            <p className="text-xs sm:text-sm text-[#665444] dark:text-[#8ea3c2] leading-relaxed">
              Baza 175 dni jest w całości zawarta w pliku HTML. Żadne dane modlitwy ani postępu nie opuszczają Twojego urządzenia.
            </p>
          </div>

          <div className="bg-white dark:bg-[#0f1726] border border-[#e5d8c8] dark:border-[#1e2a3c] rounded-2xl p-5 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#2a2119] dark:text-white">
              Pobieranie APK i Książki
            </h3>
            <p className="text-xs sm:text-sm text-[#665444] dark:text-[#8ea3c2] leading-relaxed">
              W zakładce Ustawienia dostępne są wbudowane instalatory aplikacji Android APK, wersja offline oraz narzędzia do eksportu tekstu do druku.
            </p>
          </div>

        </div>
      </section>

      {/* 4. Complete Structure of the 7 Stages (175 Mysteries) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="border-t border-[#e2d5c5] dark:border-[#1b2538] pt-10">
          <div className="text-center max-w-3xl mx-auto mb-8 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 border border-amber-300/60 dark:border-amber-800/40 text-amber-900 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              <span>Kompletny Przegląd Cyklu</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif-book text-[#2a221b] dark:text-white">
              7 Etapów Historii Zbawienia
            </h2>
            <p className="text-sm sm:text-base text-[#675443] dark:text-[#8ea2c0]">
              Struktura różańca odzwierciedla harmonijną symetrię: Etapy V–VII (Nowe Przymierze i Dzieje Kościoła) odpowiadają Etapom I–III (Stary Testament), ze Zbawicielem w centrum (Etap IV).
            </p>
          </div>

          <div className="space-y-4">
            {stages.map((st) => (
              <div 
                key={st.num}
                className="bg-white dark:bg-[#0e1627] border border-[#e5d8c8] dark:border-[#1d293d] rounded-2xl p-5 sm:p-6 shadow-xs hover:border-amber-500/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#f0e6d8] dark:border-[#182335] pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-[#1f3a5f] text-amber-300 flex items-center justify-center font-bold text-sm shrink-0">
                      {st.num}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-[#1f3a5f] dark:text-amber-300">
                      Etap {st.num}: {st.title}
                    </h3>
                  </div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border self-start sm:self-auto ${st.badgeColor}`}>
                    {st.days} (25 tajemnic)
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#614e3e] dark:text-[#90a6c6] mb-3 leading-relaxed">
                  {st.desc}
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {st.parts.map((p, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-[#f7f2ea] dark:bg-[#162033] text-[#4b3c2e] dark:text-[#c5d3ea] text-xs font-medium border border-[#e2d5c4] dark:border-[#202d44]"
                    >
                      {idx + 1}. {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Footer Quick Links */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 text-center">
        <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-amber-500/10 border border-amber-500/20 max-w-2xl mx-auto space-y-3">
          <p className="font-heading-cinzel font-bold text-sm sm:text-base text-amber-950 dark:text-amber-200">
            Gotowy do rozpoczęcia 175-dniowej drogi modlitwy?
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <a
              href={standaloneUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-md transition cursor-pointer"
            >
              <span>Uruchom Nowy RHZ w nowym oknie</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => {
                if (iframeRef.current) {
                  iframeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#121c2e] hover:bg-[#eae0d2] text-[#3d2e20] dark:text-slate-200 text-xs font-bold border border-[#d8c8b4] dark:border-[#223147] transition cursor-pointer"
            >
              <span>Przewiń do aplikacji wyżej</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
