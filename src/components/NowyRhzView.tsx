import React, { useState, useRef, useMemo } from 'react';
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
  ScrollText, 
  Volume2, 
  VolumeX,
  Play, 
  Calendar,
  Layers,
  Heart,
  ChevronLeft,
  ChevronRight,
  Info,
  Copy,
  Check,
  Video,
  Flame,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { SectionMeta } from '../types';
import { generateAndDownloadQrBadgePng } from '../utils/qrCodeService';
import { NOWY_RHZ_MYSTERIES, NowyRhzMystery } from '../data/nowyRhzData';
import { RosaryDecadeProgressTracker } from './RosaryDecadeProgressTracker';
import { VideoYouTubeExportModal } from './VideoYouTubeExportModal';
import { 
  getRadioBroadcastItem, 
  buildFullHailMary, 
  OJCZE_NASZ_PELNY, 
  CHWALA_OJCU_PELNE, 
  MODLITWA_FATIMSKA_PELNA 
} from '../utils/radioContentService';
import { 
  playLectorSpeech, 
  stopLectorSpeech, 
  getLectorConfig, 
  unlockMobileAudio 
} from '../utils/audioLectorService';

interface Props {
  section?: SectionMeta;
  currentLang?: string;
  theme?: 'light' | 'dark';
}

export const NowyRhzView: React.FC<Props> = ({ currentLang = 'pl', theme = 'light' }) => {
  // Tryb widoku: okno z tekstem modlitwy, aplikacja PWA, lub katalog 7 etapów
  const [activeTab, setActiveTab] = useState<'text_reader' | 'pwa_app' | 'stages'>('text_reader');

  // Bieżący dzień tajemnicy (1..175)
  const [currentDay, setCurrentDay] = useState<number>(() => {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return ((diff % 175) + 1);
    } catch {
      return 1;
    }
  });

  // Stany odznaczeń modlitwy w oknie z tekstem
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  // Modal wideo MP4 na YouTube
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Stany iframe PWA
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const standaloneUrl = '/nowyrhz/';

  // Aktualna tajemnica z bazy 175 dni
  const safeDay = Math.max(1, Math.min(175, currentDay));
  const mystery: NowyRhzMystery = useMemo(() => {
    return NOWY_RHZ_MYSTERIES[safeDay - 1] || NOWY_RHZ_MYSTERIES[0];
  }, [safeDay]);

  // Radio broadcast item dla generatora wideo MP4
  const broadcastItem = useMemo(() => {
    return getRadioBroadcastItem('nowyrhz', safeDay);
  }, [safeDay]);

  const toggleStep = (id: string) => {
    setCompletedSteps(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleResetProgress = () => {
    setCompletedSteps({});
  };

  const handleMarkAllDecade = () => {
    const updated = { ...completedSteps };
    for (let i = 1; i <= 10; i++) {
      updated[`bead_${i}`] = true;
    }
    setCompletedSteps(updated);
  };

  const speakText = async (id: string, text: string) => {
    unlockMobileAudio();
    if (activeSpeechId === id) {
      stopLectorSpeech();
      setActiveSpeechId(null);
      return;
    }
    stopLectorSpeech();
    setActiveSpeechId(id);
    const config = getLectorConfig();
    await playLectorSpeech({
      text,
      config,
      overrideLang: currentLang,
      onStart: () => setActiveSpeechId(id),
      onEnd: () => setActiveSpeechId(null),
      onError: () => setActiveSpeechId(null)
    });
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

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

  // Mapowanie ukończonych paciorków 1..10
  const completedBeadsMap: Record<number, boolean> = {};
  for (let i = 1; i <= 10; i++) {
    completedBeadsMap[i] = !!completedSteps[`bead_${i}`];
  }
  const isIntroDone = !!(completedSteps['intro_med'] || completedSteps['intro_pater']);
  const isConclusionDone = !!(completedSteps['concl_glory'] || completedSteps['concl_fatima']);

  // Wyznaczenie aktywnego kroku lektora
  let activeStep: 'intro' | number | 'conclusion' | null = null;
  if (activeSpeechId === 'speech_passage' || activeSpeechId === 'speech_med' || activeSpeechId === 'speech_pater') {
    activeStep = 'intro';
  } else if (activeSpeechId?.startsWith('speech_bead_')) {
    activeStep = parseInt(activeSpeechId.replace('speech_bead_', ''), 10);
  } else if (activeSpeechId === 'speech_glory' || activeSpeechId === 'speech_fatima' || activeSpeechId === 'speech_prayer') {
    activeStep = 'conclusion';
  }

  const fontClass = 
    fontSize === 'normal' ? 'text-[12pt] leading-[1.15]' :
    fontSize === 'large' ? 'text-[14pt] leading-[1.2]' :
    'text-[16pt] leading-[1.25]';

  return (
    <div className="min-h-screen bg-[#faf7f2] dark:bg-[#080d16] text-[#2c241e] dark:text-[#e4e8f0] pb-24 transition-colors duration-300 font-sans-ui">
      
      {/* 1. Hero Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f2ece2] via-[#faf6ef] to-[#faf7f2] dark:from-[#0d1525] dark:via-[#090f1a] dark:to-[#080d16] border-b border-[#e5d8c8] dark:border-[#1d2738] pt-8 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          
          {/* Top badges & action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-600/15 to-sky-600/15 border border-amber-600/30 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Nowy Różaniec Historii Zbawienia • 175 Dni</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer"
                title="Generuj wideo MP4 na YouTube z lektorem AI i koralikami"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Wideo MP4 (YouTube)</span>
              </button>

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
            </div>
          </div>

          {/* Title and summary */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-serif-book tracking-tight text-[#1c1611] dark:text-white flex items-center gap-3">
              <span>Nowy RHZ</span>
              <span className="text-base sm:text-xl font-light text-amber-700 dark:text-amber-400 font-sans-ui">
                – Różaniec Historii Zbawienia
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-[#5e4b3b] dark:text-[#9bb0cf] max-w-4xl font-sans-ui leading-relaxed">
              7 etapów × 5 części × 5 tajemnic = 175 dni modlitwy. Każdego dnia rozważana jest jedna tajemnica z 10 dopowiedzeniami po słowie „Jezus” oraz syntezą lektora AI TTS.
            </p>
          </div>

          {/* 3 Zakładki: Okno z tekstem, Aplikacja PWA, 7 Etapów */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#e2d5c4] dark:border-[#1e293c]">
            <button
              onClick={() => setActiveTab('text_reader')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'text_reader'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white/80 dark:bg-[#121a28] text-[#5e4b3b] dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-[#1b263a] border border-[#dac8b4] dark:border-[#24334a]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Okno z tekstem modlitwy (175 dni)</span>
            </button>

            <button
              onClick={() => setActiveTab('pwa_app')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'pwa_app'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white/80 dark:bg-[#121a28] text-[#5e4b3b] dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-[#1b263a] border border-[#dac8b4] dark:border-[#24334a]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Aplikacja Nowy RHZ (PWA)</span>
            </button>

            <button
              onClick={() => setActiveTab('stages')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'stages'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white/80 dark:bg-[#121a28] text-[#5e4b3b] dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-[#1b263a] border border-[#dac8b4] dark:border-[#24334a]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Przegląd 7 Etapów</span>
            </button>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* ZAKŁADKA 1: OKNO Z TEKSTEM MODLITWY Z WIZUALIZACJĄ PACIORKÓW */}
      {/* ========================================================= */}
      {activeTab === 'text_reader' && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
          
          {/* Wybór dnia modlitwy (1..175) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0f1726] border border-[#e5d8c8] dark:border-[#1e2a3c] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDay(d => Math.max(1, d - 1))}
                disabled={safeDay <= 1}
                className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 disabled:opacity-40 transition cursor-pointer"
                title="Poprzedni dzień"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase">
                  Dzień:
                </span>
                <input
                  type="number"
                  min={1}
                  max={175}
                  value={safeDay}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1 && val <= 175) setCurrentDay(val);
                  }}
                  className="w-16 px-2.5 py-1 text-center font-bold text-sm rounded-lg border border-amber-500/40 bg-white dark:bg-[#162132] text-amber-900 dark:text-amber-200"
                />
                <span className="text-xs text-stone-500 dark:text-stone-400">z 175</span>
              </div>

              <button
                onClick={() => setCurrentDay(d => Math.min(175, d + 1))}
                disabled={safeDay >= 175}
                className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 disabled:opacity-40 transition cursor-pointer"
                title="Następny dzień"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Rozmiar czcionki */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Czcionka:</span>
              <div className="inline-flex rounded-xl bg-stone-100 dark:bg-[#1a2333] p-0.5 border border-stone-200 dark:border-stone-700 text-xs">
                {(['normal', 'large', 'xlarge'] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setFontSize(sz)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      fontSize === sz
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-750'
                    }`}
                  >
                    {sz === 'normal' ? '12 pt' : sz === 'large' ? '14 pt' : '16 pt'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* GŁÓWNA WIZUALIZACJA POSTĘPU DZIESIĄTKA: DUŻY OKRĄG (ROZWAŻANIE I OJCZE NASZ) + 10 MAŁYCH + DUŻY OKRĄG (CHWAŁA I FATIMA) */}
          <RosaryDecadeProgressTracker
            isIntroDone={isIntroDone}
            completedBeads={completedBeadsMap}
            isConclusionDone={isConclusionDone}
            activeStep={activeStep}
            dopowiedzenia={mystery.cl}
            mysteryTitle={`${mystery.t} – ${mystery.sub}`}
            stageTitle={`Etap ${mystery.stage}: ${mystery.stageTitle} • Część ${mystery.part}: ${mystery.partTitle}`}
            onSelectIntro={() => {
              toggleStep('intro_med');
              const el = document.getElementById('nowyrhz-step-intro');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            onSelectBead={(num) => {
              toggleStep(`bead_${num}`);
              const el = document.getElementById(`nowyrhz-bead-${num}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            onSelectConclusion={() => {
              toggleStep('concl_glory');
              const el = document.getElementById('nowyrhz-step-conclusion');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            onResetProgress={handleResetProgress}
            onMarkAllDecade={handleMarkAllDecade}
            onOpenVideoExport={() => setIsVideoModalOpen(true)}
            theme={theme}
          />

          {/* ========================================================= */}
          {/* SEKCJA 1: ROZWAŻANIE I OJCZE NASZ (DUŻY PACIOREK 1) */}
          {/* ========================================================= */}
          <div id="nowyrhz-step-intro" className="rounded-3xl bg-white dark:bg-[#101726] border border-[#e5d8c8] dark:border-[#1e2a3c] p-6 sm:p-8 space-y-6 shadow-xs scroll-mt-20">
            <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-600/15 border border-amber-600/30 flex items-center justify-center text-amber-800 dark:text-amber-300 font-bold shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                    Duży Paciorek I • Rozważanie i Ojcze Nasz
                  </div>
                  <h3 className="font-heading-cinzel text-lg sm:text-xl font-bold text-[#2a2016] dark:text-[#f3e8d2]">
                    {mystery.t} – {mystery.sub}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleStep('intro_med')}
                  className="p-1.5 rounded-lg text-amber-700 dark:text-amber-400 cursor-pointer"
                  title="Oznacz rozważanie i Ojcze nasz jako odmówione"
                >
                  {isIntroDone ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <RotateCcw className="w-5 h-5 opacity-40 hover:opacity-80" />}
                </button>
              </div>
            </div>

            {/* Pismo Święte */}
            {mystery.ref && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#faf5ee] dark:bg-[#16202e] border-l-4 border-amber-600 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <span>Fragment Pisma Świętego: {mystery.ref}</span>
                  </span>
                  <button
                    onClick={() => speakText('speech_passage', `Fragment Pisma Świętego: ${mystery.ref}`)}
                    className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
                    title="Odsłuchaj lektorem"
                  >
                    {activeSpeechId === 'speech_passage' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
                <p className={`font-serif-book italic text-[#473729] dark:text-amber-100 ${fontClass}`}>
                  {mystery.ref}
                </p>
              </div>
            )}

            {/* Rozważanie */}
            {mystery.med && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131b28] border border-[#e6dacd] dark:border-[#22314a] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Rozważanie Tajemnicy:</span>
                  </span>
                  <button
                    onClick={() => speakText('speech_med', `Rozważanie: ${mystery.med}`)}
                    className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
                    title="Odsłuchaj lektorem"
                  >
                    {activeSpeechId === 'speech_med' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
                <p className={`font-serif-book text-[#382b20] dark:text-[#cbd5e1] text-justify ${fontClass}`}>
                  {mystery.med}
                </p>
              </div>
            )}

            {/* Modlitwa Pańska (Ojcze Nasz) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#faf6f0] dark:bg-[#161e2d] border border-[#e8ded3] dark:border-[#223048] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  Modlitwa Pańska (Ojcze Nasz) — Duży Paciorek Tajemnicy:
                </span>
                <button
                  onClick={() => speakText('speech_pater', OJCZE_NASZ_PELNY)}
                  className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
                  title="Odsłuchaj lektorem"
                >
                  {activeSpeechId === 'speech_pater' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              <p className={`font-serif-book text-[#3a2e22] dark:text-[#cbd5e1] text-justify ${fontClass}`}>
                {OJCZE_NASZ_PELNY}
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SEKCJA 2: 10 PACIORKÓW Z DOPOWIEDZENIAMI PO SŁOWIE JEZUS */}
          {/* ========================================================= */}
          <div className="rounded-3xl bg-white dark:bg-[#101726] border border-[#e5d8c8] dark:border-[#1e2a3c] p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-600/15 border border-amber-600/30 flex items-center justify-center text-amber-800 dark:text-amber-300 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                    10 Małych Paciorków Dziesiątka
                  </div>
                  <h3 className="font-heading-cinzel text-lg sm:text-xl font-bold text-[#2a2016] dark:text-[#f3e8d2]">
                    Zdrowaś Maryjo ze wstawką po słowie „Jezus”
                  </h3>
                </div>
              </div>

              <button
                onClick={handleMarkAllDecade}
                className="px-3 py-1.5 rounded-xl bg-amber-600/15 hover:bg-amber-600/25 text-amber-800 dark:text-amber-300 text-xs font-bold transition cursor-pointer"
              >
                Zaznacz wszystkie 10
              </button>
            </div>

            {/* Lista 10 paciorków */}
            <div className="space-y-3.5 pt-2">
              {mystery.cl.map((cl, idx) => {
                const beadNum = idx + 1;
                const beadId = `bead_${beadNum}`;
                const isDone = !!completedSteps[beadId];
                const fullHailMary = buildFullHailMary(cl);

                return (
                  <div
                    key={beadNum}
                    id={`nowyrhz-bead-${beadNum}`}
                    onClick={() => toggleStep(beadId)}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer scroll-mt-20 ${
                      isDone
                        ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-500/50 shadow-xs'
                        : 'bg-white dark:bg-[#141d2c] border-[#e7ddd1] dark:border-[#223048] hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStep(beadId);
                          }}
                          className="text-amber-700 dark:text-amber-400 cursor-pointer"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-amber-600" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-amber-600/40 flex items-center justify-center text-[10px] font-bold text-amber-800 dark:text-amber-300">
                              {beadNum}
                            </div>
                          )}
                        </button>
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                          isDone
                            ? 'bg-amber-600 text-white'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300'
                        }`}>
                          Paciorek #{beadNum} z 10
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyText(`bead_${beadNum}`, fullHailMary);
                          }}
                          className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
                          title="Kopiuj modlitwę"
                        >
                          {copiedId === `bead_${beadNum}` ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakText(`speech_bead_${beadNum}`, fullHailMary);
                          }}
                          className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
                          title="Odsłuchaj lektorem"
                        >
                          {activeSpeechId === `speech_bead_${beadNum}` ? <VolumeX className="w-4 h-4 text-amber-600" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Tekst modlitwy ze wstawką po słowie Jezus */}
                    <div className={`font-serif-book text-[#2e2319] dark:text-[#e2e8f0] text-justify leading-relaxed ${fontClass}`}>
                      Zdrowaś Maryjo, łaski pełna, Pan z Tobą, błogosławionaś Ty między niewiastami i błogosławiony owoc żywota Twojego Jezus,{' '}
                      <span className="inline-block my-0.5 px-2.5 py-0.5 rounded-lg font-bold bg-amber-500/20 dark:bg-amber-500/25 text-amber-950 dark:text-amber-200 border border-amber-500/40">
                        „{cl}”
                      </span>{' '}
                      Święta Maryjo, Matko Boża, módl się za nami grzesznymi teraz i w godzinę śmierci naszej. Amen.
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================= */}
          {/* SEKCJA 3: DUŻY PACIOREK 2: CHWAŁA OJCU I O MÓJ JEZU */}
          {/* ========================================================= */}
          <div id="nowyrhz-step-conclusion" className="rounded-3xl bg-white dark:bg-[#101726] border border-[#e5d8c8] dark:border-[#1e2a3c] p-6 sm:p-8 space-y-5 shadow-xs scroll-mt-20">
            <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-600/15 border border-amber-600/30 flex items-center justify-center text-amber-800 dark:text-amber-300 font-bold shrink-0">
                  <Flame className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                    Duży Paciorek II • Zakończenie Dziesiątka
                  </div>
                  <h3 className="font-heading-cinzel text-lg sm:text-xl font-bold text-[#2a2016] dark:text-[#f3e8d2]">
                    Chwała Ojcu, Modlitwa Fatimska i Zakończenie Części
                  </h3>
                </div>
              </div>

              <button
                onClick={() => toggleStep('concl_glory')}
                className="p-1.5 rounded-lg text-amber-700 dark:text-amber-400 cursor-pointer"
                title="Oznacz modlitwy końcowe jako odmówione"
              >
                {isConclusionDone ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <RotateCcw className="w-5 h-5 opacity-40 hover:opacity-80" />}
              </button>
            </div>

            {/* Chwała Ojcu */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#faf6f0] dark:bg-[#161f2f] border border-[#ebdccf] dark:border-[#222f46] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  Modlitwa Uwielbienia (Chwała Ojcu):
                </span>
                <button
                  onClick={() => speakText('speech_glory', CHWALA_OJCU_PELNE)}
                  className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
                >
                  {activeSpeechId === 'speech_glory' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              <p className={`font-serif-book text-[#3a2e22] dark:text-[#cbd5e1] text-justify ${fontClass}`}>
                {CHWALA_OJCU_PELNE}
              </p>
            </div>

            {/* Modlitwa Fatimska */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/25 border border-amber-500/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <span>Modlitwa Fatimska (O mój Jezu):</span>
                </span>
                <button
                  onClick={() => speakText('speech_fatima', MODLITWA_FATIMSKA_PELNA)}
                  className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
                >
                  {activeSpeechId === 'speech_fatima' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              <p className={`font-serif-book italic text-[#3a2e22] dark:text-[#f8fafc] text-justify ${fontClass}`}>
                {MODLITWA_FATIMSKA_PELNA}
              </p>
            </div>

            {/* Modlitwa na zakończenie części */}
            {mystery.prayer && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141b29] border border-[#e5d9cc] dark:border-[#24334c] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-600" />
                    <span>Modlitwa na zakończenie części ({mystery.partTitle}):</span>
                  </span>
                  <button
                    onClick={() => speakText('speech_prayer', mystery.prayer)}
                    className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
                  >
                    {activeSpeechId === 'speech_prayer' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
                <p className={`font-serif-book text-[#3a2e22] dark:text-[#cbd5e1] text-justify ${fontClass}`}>
                  {mystery.prayer}
                </p>
              </div>
            )}
          </div>

        </section>
      )}

      {/* ========================================================= */}
      {/* ZAKŁADKA 2: APLIKACJA NOWY RHZ (PWA / IFRAME) */}
      {/* ========================================================= */}
      {activeTab === 'pwa_app' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
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
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* ZAKŁADKA 3: PRZEGLĄD 7 ETAPÓW (175 TAJEMNIC) */}
      {/* ========================================================= */}
      {activeTab === 'stages' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
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
        </section>
      )}

      {/* Modal Wideo YouTube z Lektorem i Koralikami */}
      {isVideoModalOpen && (
        <VideoYouTubeExportModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          broadcastItem={broadcastItem}
          currentDayNumber={safeDay}
          totalDays={175}
        />
      )}

    </div>
  );
};
