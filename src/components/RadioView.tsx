import React, { useState, useEffect, useRef } from 'react';
import {
  Radio as RadioIcon,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  RotateCcw,
  Volume2,
  Share2,
  QrCode,
  Video,
  Sparkles,
  Calendar,
  Layers,
  Headphones,
  Info,
  Check,
  ExternalLink,
  Sliders,
  ChevronRight,
  BookOpen,
  Compass,
  Repeat
} from 'lucide-react';
import {
  RADIO_STATIONS,
  RadioStationId,
  RadioStationMeta,
  getRadioBroadcastItem,
  RadioBroadcastItem
} from '../utils/radioContentService';
import {
  playLectorSpeech,
  stopLectorSpeech,
  pauseLectorSpeech,
  resumeLectorSpeech,
  getLectorConfig,
  getLectorPlaybackState,
  LectorPlaybackState,
  unlockMobileAudio,
  LectorConfig
} from '../utils/audioLectorService';
import { generateAndDownloadQrBadgePng } from '../utils/qrCodeService';
import { VideoYouTubeExportModal } from './VideoYouTubeExportModal';

interface Props {
  initialStationId?: RadioStationId;
  onOpenLectorSettings?: () => void;
  currentLang?: string;
  theme?: 'light' | 'dark';
}

export const RadioView: React.FC<Props> = ({
  initialStationId = 'nowyrhz',
  onOpenLectorSettings,
  currentLang = 'pl',
  theme = 'light'
}) => {
  const [activeStationId, setActiveStationId] = useState<RadioStationId>(initialStationId);
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [bibliaYear, setBibliaYear] = useState<1 | 2 | 3 | 4>(1);
  const [playbackState, setPlaybackState] = useState<LectorPlaybackState>('idle');
  const [isLoopEnabled, setIsLoopEnabled] = useState<boolean>(true);
  const [loopMode, setLoopMode] = useState<'station' | 'all_stations'>('station');
  const [currentWordIdx, setCurrentWordIdx] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);

  // References to guarantee fresh values during long async speech execution and prevent closure staleness
  const activeStationIdRef = useRef<RadioStationId>(activeStationId);
  const dayNumberRef = useRef<number>(dayNumber);
  const bibliaYearRef = useRef<1 | 2 | 3 | 4>(bibliaYear);
  const isLoopEnabledRef = useRef<boolean>(isLoopEnabled);
  const loopModeRef = useRef<'station' | 'all_stations'>(loopMode);
  const playbackStateRef = useRef<LectorPlaybackState>(playbackState);
  const transitionTimerRef = useRef<any>(null);

  useEffect(() => { activeStationIdRef.current = activeStationId; }, [activeStationId]);
  useEffect(() => { dayNumberRef.current = dayNumber; }, [dayNumber]);
  useEffect(() => { bibliaYearRef.current = bibliaYear; }, [bibliaYear]);
  useEffect(() => { isLoopEnabledRef.current = isLoopEnabled; }, [isLoopEnabled]);
  useEffect(() => { loopModeRef.current = loopMode; }, [loopMode]);
  useEffect(() => { playbackStateRef.current = playbackState; }, [playbackState]);

  const activeStation = RADIO_STATIONS.find(s => s.id === activeStationId) || RADIO_STATIONS[0];
  const broadcastItem: RadioBroadcastItem = getRadioBroadcastItem(activeStationId, dayNumber, bibliaYear);

  // Sync station from URL query on initial load or popstate
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stationParam = params.get('stacja') || params.get('station') || params.get('s');
    if (stationParam && RADIO_STATIONS.some(s => s.id === stationParam)) {
      setActiveStationId(stationParam as RadioStationId);
      activeStationIdRef.current = stationParam as RadioStationId;
    }
    const dayParam = params.get('dzien') || params.get('day') || params.get('d');
    if (dayParam) {
      const num = parseInt(dayParam, 10);
      if (!isNaN(num) && num >= 1) {
        setDayNumber(num);
        dayNumberRef.current = num;
      }
    }
  }, []);

  // Update browser URL query without reloading when station or day changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('stacja', activeStationId);
    if (dayNumber > 1) {
      url.searchParams.set('dzien', dayNumber.toString());
    } else {
      url.searchParams.delete('dzien');
    }
    window.history.replaceState({}, '', url.toString());
  }, [activeStationId, dayNumber]);

  // Adjust dayNumber if exceeds totalDays of newly selected station
  useEffect(() => {
    if (dayNumber > activeStation.totalDays) {
      setDayNumber(1);
      dayNumberRef.current = 1;
    }
  }, [activeStationId, activeStation.totalDays]);

  // Listen to lector playback state events
  useEffect(() => {
    const handleStateChange = () => {
      const newState = getLectorPlaybackState();
      setPlaybackState(newState);
      playbackStateRef.current = newState;
    };
    window.addEventListener('drogowskazy_lector_state_changed', handleStateChange);
    return () => {
      window.removeEventListener('drogowskazy_lector_state_changed', handleStateChange);
    };
  }, []);

  // Stop audio and timers on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      stopLectorSpeech();
    };
  }, []);

  /**
   * Główna funkcja odtwarzania audycji w pętli 24/7:
   * Obsługuje płynne przechodzenie dzień po dniu bez przerw oraz powrót do Dnia 1 po ukończeniu całej serii.
   */
  const handlePlayStationDay = async (stationIdToPlay?: RadioStationId, customDay?: number) => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    unlockMobileAudio();
    stopLectorSpeech();

    const targetStationId = stationIdToPlay || activeStationIdRef.current;
    const currentMeta = RADIO_STATIONS.find(s => s.id === targetStationId) || RADIO_STATIONS[0];
    let targetDay = customDay !== undefined ? customDay : dayNumberRef.current;
    if (targetDay > currentMeta.totalDays) {
      targetDay = 1;
    }

    if (targetStationId !== activeStationIdRef.current) {
      setActiveStationId(targetStationId);
      activeStationIdRef.current = targetStationId;
    }
    setDayNumber(targetDay);
    dayNumberRef.current = targetDay;

    const item = getRadioBroadcastItem(targetStationId, targetDay, bibliaYearRef.current);
    const cfg = getLectorConfig();

    setCurrentWordIdx(0);
    setPlaybackState('playing');
    playbackStateRef.current = 'playing';

    await playLectorSpeech({
      text: item.speechText,
      config: cfg,
      title: `${item.headlineTitle} (${item.displayDate})`,
      sectionName: `Radio: ${item.stationName}`,
      onStart: () => {
        setPlaybackState('playing');
        playbackStateRef.current = 'playing';
      },
      onEnd: () => {
        // CIĄGŁE ODTWARZANIE W PĘTLI BEZ PRZERWY:
        if (isLoopEnabledRef.current) {
          let nextStationId = activeStationIdRef.current;
          let nextDay = targetDay + 1;
          const stationInfo = RADIO_STATIONS.find(s => s.id === nextStationId) || RADIO_STATIONS[0];

          if (nextDay > stationInfo.totalDays) {
            // Cała seria ukończona!
            if (loopModeRef.current === 'all_stations') {
              // Przejście do kolejnej z 4 stacji w pętli, od Dnia 1
              const sIdx = RADIO_STATIONS.findIndex(s => s.id === nextStationId);
              const nextSIdx = (sIdx + 1) % RADIO_STATIONS.length;
              nextStationId = RADIO_STATIONS[nextSIdx].id;
              nextDay = 1;
            } else {
              // Po skończeniu całej serii stacji od początku (Dzień 1)
              nextDay = 1;
            }
          }

          setActiveStationId(nextStationId);
          activeStationIdRef.current = nextStationId;
          setDayNumber(nextDay);
          dayNumberRef.current = nextDay;

          // Płynne, natychmiastowe przejście do kolejnego dnia audycji bez przestoju
          transitionTimerRef.current = setTimeout(() => {
            handlePlayStationDay(nextStationId, nextDay);
          }, 350);
        } else {
          setPlaybackState('idle');
          playbackStateRef.current = 'idle';
        }
      },
      onError: (err) => {
        console.warn('Radio stream warning, auto-recovering non-stop loop:', err);
        if (isLoopEnabledRef.current) {
          // Nie przerywaj nadawania 24/7 – przejdź do kolejnego dnia po krótkiej pauzie
          const stationInfo = RADIO_STATIONS.find(s => s.id === activeStationIdRef.current) || RADIO_STATIONS[0];
          let nextDay = targetDay >= stationInfo.totalDays ? 1 : targetDay + 1;
          setDayNumber(nextDay);
          dayNumberRef.current = nextDay;
          transitionTimerRef.current = setTimeout(() => {
            handlePlayStationDay(activeStationIdRef.current, nextDay);
          }, 1500);
        } else {
          setPlaybackState('idle');
          playbackStateRef.current = 'idle';
        }
      },
      onNext: () => {
        handleNextDay(true);
      },
      onPrev: () => {
        handlePrevDay(true);
      }
    });
  };

  const handlePlayCurrent = (customDay?: number) => {
    handlePlayStationDay(activeStationIdRef.current, customDay);
  };

  const handlePause = () => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    pauseLectorSpeech();
    setPlaybackState('paused');
    playbackStateRef.current = 'paused';
  };

  const handleResume = () => {
    resumeLectorSpeech();
    setPlaybackState('playing');
    playbackStateRef.current = 'playing';
  };

  const handleStop = () => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    stopLectorSpeech();
    setPlaybackState('idle');
    playbackStateRef.current = 'idle';
    setCurrentWordIdx(0);
  };

  const handlePrevDay = (autoPlay?: boolean) => {
    const prev = dayNumber <= 1 ? activeStation.totalDays : dayNumber - 1;
    setDayNumber(prev);
    dayNumberRef.current = prev;
    if (autoPlay || playbackStateRef.current === 'playing') {
      handlePlayStationDay(activeStationIdRef.current, prev);
    }
  };

  const handleNextDay = (autoPlay?: boolean) => {
    const next = dayNumber >= activeStation.totalDays ? 1 : dayNumber + 1;
    setDayNumber(next);
    dayNumberRef.current = next;
    if (autoPlay || playbackStateRef.current === 'playing') {
      handlePlayStationDay(activeStationIdRef.current, next);
    }
  };

  const handleStationChange = (newStationId: RadioStationId, startPlaying?: boolean) => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    const shouldPlay = startPlaying || playbackStateRef.current === 'playing';
    stopLectorSpeech();
    setActiveStationId(newStationId);
    activeStationIdRef.current = newStationId;
    setDayNumber(1);
    dayNumberRef.current = 1;

    if (shouldPlay) {
      setTimeout(() => {
        handlePlayStationDay(newStationId, 1);
      }, 150);
    }
  };

  /**
   * Udostępnianie bezpośredniego linku do stacji radiowej
   */
  const handleShareStation = async () => {
    const shareUrl = `${window.location.origin}/radio?stacja=${activeStationId}&dzien=${dayNumber}`;
    const shareTitle = `Radio Internetowe 24/7 – ${activeStation.name}`;
    const shareText = `Słuchaj w pętli z lektorem AI: ${broadcastItem.headlineTitle} (${broadcastItem.displayDate}).`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
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
    const fullUrl = `${window.location.origin}/radio?stacja=${activeStationId}`;
    generateAndDownloadQrBadgePng({
      id: `radio_${activeStationId}`,
      title: `Radio Internetowe – ${activeStation.name}`,
      displayLabel: `widokinaraj.pl/radio?stacja=${activeStationId}`,
      shortUrl: fullUrl,
      fullUrl: fullUrl,
      category: 'radio',
      createdAt: new Date().toISOString()
    });
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] dark:bg-[#070b12] text-[#2c241e] dark:text-[#e2e8f0] pb-24 transition-colors duration-300 font-sans-ui">
      
      {/* 1. Header Banner & Radio Frequency Waves */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f2ece2] via-[#faf6ef] to-[#faf7f2] dark:from-[#0d1424] dark:via-[#090e1a] dark:to-[#070b12] border-b border-[#e5d8c8] dark:border-[#1d2738] pt-8 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Top badges and quick actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/15 border border-red-600/30 text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <span>Radio Internetowe 24/7 • 4 Stacje w Pętli</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleShareStation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#121a28] hover:bg-[#f0e8dc] dark:hover:bg-[#1a2538] border border-[#d8c8b4] dark:border-[#24334a] text-xs font-semibold text-[#4e3d2d] dark:text-slate-200 transition cursor-pointer shadow-xs"
                title="Udostępnij stację"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Skopiowano link!' : 'Udostępnij stację'}</span>
              </button>

              <button
                onClick={handleDownloadQr}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#121a28] hover:bg-[#f0e8dc] dark:hover:bg-[#1a2538] border border-[#d8c8b4] dark:border-[#24334a] text-xs font-semibold text-[#4e3d2d] dark:text-slate-200 transition cursor-pointer shadow-xs"
                title="Pobierz kod QR stacji"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kod QR</span>
              </button>

              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Generuj wideo MP4 z czarnym tłem i napisami karaoke dla YouTube"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Eksport Wideo YouTube (MP4)</span>
              </button>

              {onOpenLectorSettings && (
                <button
                  onClick={onOpenLectorSettings}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#121a28] hover:bg-[#f0e8dc] dark:hover:bg-[#1a2538] border border-[#d8c8b4] dark:border-[#24334a] text-xs font-semibold text-[#4e3d2d] dark:text-slate-200 transition cursor-pointer shadow-xs"
                  title="Ustawienia głosu i tempa Lektora AI"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Głos AI</span>
                </button>
              )}
            </div>
          </div>

          {/* Title & Tagline */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-book tracking-tight text-[#1c1611] dark:text-white flex items-center gap-3">
              <RadioIcon className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 animate-pulse shrink-0" />
              <span>Radio Widoki na Raj</span>
            </h1>
            <p className="text-base sm:text-lg text-[#5e4b3b] dark:text-[#9bb0cf] max-w-4xl font-sans-ui">
              Całodobowe internetowe stacje radiowe nadające w ciągłej pętli rozważania, modlitwy i czytania z syntezą mowy Lektora AI TTS. 
              Dla każdej stacji możesz wygenerować profesjonalne wideo MP4 na YouTube z czarnym tłem i napisami karaoke.
            </p>
          </div>

          {/* 4 Stacje Tab Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {RADIO_STATIONS.map((station) => {
              const isSelected = activeStationId === station.id;
              const isStationPlaying = isSelected && playbackState === 'playing';
              return (
                <button
                  key={station.id}
                  onClick={() => handleStationChange(station.id, true)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white dark:bg-[#131d2e] border-amber-500/80 dark:border-amber-400 shadow-lg ring-2 ring-amber-500/30'
                      : 'bg-white/60 dark:bg-[#0c1322]/80 border-[#decbc0] dark:border-[#1d273a] hover:bg-white dark:hover:bg-[#101828]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isSelected 
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300' 
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {station.badge}
                      </span>
                      {isStationPlaying ? (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600/15 border border-red-500/40 text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">
                          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                          <span>GRA W PĘTLI</span>
                        </span>
                      ) : isSelected ? (
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                        </span>
                      ) : null}
                    </div>
                    <div className="font-bold text-base text-[#251e18] dark:text-white leading-tight">
                      {station.name}
                    </div>
                    <div className="text-xs text-[#715c4b] dark:text-[#8ea2c0] line-clamp-2">
                      {station.tagline}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#f0e6dc] dark:border-[#1a2538] flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
                    <span>
                      {isStationPlaying 
                        ? `🔴 Dzień ${dayNumber} z ${station.totalDays}` 
                        : isSelected 
                          ? '▶ Odtwarzaj w pętli 24/7' 
                          : 'Włącz stację w pętli'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      </section>

      {/* 2. Main Live Broadcast Studio & Player Container */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-gradient-to-b from-[#131d2e] to-[#0c121e] rounded-3xl border border-amber-500/30 shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden">
          
          {/* Subtle Ambient Wave Effect in background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Top Info Bar inside Player */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-red-600 flex items-center justify-center text-white shadow-lg shadow-amber-600/20 shrink-0">
                <RadioIcon className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    {activeStation.channelName}
                  </span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] bg-red-600 text-white font-bold uppercase animate-pulse">
                    LIVE 24/7
                  </span>
                </div>
                <h2 className="text-lg sm:text-2xl font-bold font-serif-book text-white truncate max-w-xl">
                  {broadcastItem.headlineTitle}
                </h2>
              </div>
            </div>

            {/* Loop Toggle & Loop Mode Switch */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsLoopEnabled(l => !l)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  isLoopEnabled
                    ? 'bg-amber-600/25 text-amber-300 border-amber-500/60 shadow-xs'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title="Pętla 24/7 bez przerw: po skończeniu dnia natychmiast odtwarza kolejny, a po ukończeniu całej serii wraca do Dnia 1."
              >
                <Repeat className={`w-3.5 h-3.5 ${playbackState === 'playing' ? 'animate-spin' : ''}`} />
                <span>Pętla 24/7 {isLoopEnabled ? 'Aktywna' : 'Wyłączona'}</span>
              </button>

              {isLoopEnabled && (
                <div className="inline-flex rounded-xl bg-slate-900/90 p-1 border border-slate-700/80 text-[11px] font-semibold gap-1">
                  <button
                    onClick={() => setLoopMode('station')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      loopMode === 'station'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Pętla stacji: Dzień 1 do ostatniego, i od razu od początku (Dzień 1)"
                  >
                    Pętla stacji (1..{activeStation.totalDays})
                  </button>
                  <button
                    onClick={() => setLoopMode('all_stations')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      loopMode === 'all_stations'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Wielka pętla 4 stacji: Wszystkie 4 radia internetowe po kolei bez przerw"
                  >
                    Wielka pętla 4 stacji
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Banner informacyjny o ciągłej pętli bez przerw */}
          <div className="mb-4 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200/90 flex flex-wrap items-center justify-between gap-2 font-sans-ui">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                {loopMode === 'station'
                  ? `Pętla 24/7 bez przerw: Dzień ${dayNumber} z ${activeStation.totalDays} • Po ukończeniu całej serii powrót do Dnia 1`
                  : `Wielka pętla 4 stacji: Dzień ${dayNumber} z ${activeStation.totalDays} (${activeStation.shortName}) • Po zakończeniu serii przejście do kolejnej stacji`}
              </span>
            </div>
            <div className="font-mono text-[11px] text-amber-300 font-bold">
              Kolejny dzień w pętli: Dzień {dayNumber >= activeStation.totalDays ? 1 : dayNumber + 1}
            </div>
          </div>

          {/* Day Navigation & Progress bar */}
          <div className="space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white">{broadcastItem.displayDate}</span>
                <span className="text-slate-400">• {broadcastItem.subtitle}</span>
              </div>
              <div className="font-mono text-amber-400 text-xs">
                {dayNumber} / {activeStation.totalDays} dni w cyklu
              </div>
            </div>

            {/* Slider do szybkiego wyboru dnia */}
            <div className="space-y-1">
              <input
                type="range"
                min={1}
                max={activeStation.totalDays}
                value={dayNumber}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setDayNumber(val);
                  if (playbackState === 'playing') {
                    handlePlayCurrent(val);
                  }
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Dzień 1</span>
                <span>Dzień {Math.round(activeStation.totalDays / 2)}</span>
                <span>Dzień {activeStation.totalDays}</span>
              </div>
            </div>

            {/* Sterowanie Odtwarzaczem (Play / Pause / Next / Prev) */}
            <div className="py-4 flex flex-wrap items-center justify-center sm:justify-between gap-4 border-t border-b border-slate-800/80">
              
              {/* Prev Day */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevDay}
                  className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer"
                  title="Poprzedni dzień"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
              </div>

              {/* Main Play / Pause Controls */}
              <div className="flex items-center gap-3">
                {playbackState === 'playing' ? (
                  <button
                    onClick={handlePause}
                    className="p-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white shadow-xl shadow-amber-600/30 transition active:scale-95 cursor-pointer"
                    title="Wstrzymaj odtwarzanie"
                  >
                    <Pause className="w-7 h-7" />
                  </button>
                ) : playbackState === 'paused' ? (
                  <button
                    onClick={handleResume}
                    className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
                    title="Wznów odtwarzanie"
                  >
                    <Play className="w-7 h-7 ml-0.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handlePlayCurrent()}
                    className="p-4 rounded-2xl bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white shadow-xl shadow-amber-600/30 transition active:scale-95 cursor-pointer"
                    title="Rozpocznij odtwarzanie audycji"
                  >
                    <Play className="w-7 h-7 ml-0.5" />
                  </button>
                )}

                <button
                  onClick={handleStop}
                  disabled={playbackState === 'idle'}
                  className={`p-4 rounded-2xl transition active:scale-95 cursor-pointer ${
                    playbackState !== 'idle'
                      ? 'bg-white/10 hover:bg-white/20 text-white'
                      : 'bg-white/5 text-slate-600 cursor-not-allowed'
                  }`}
                  title="Zatrzymaj"
                >
                  <Square className="w-6 h-6" />
                </button>
              </div>

              {/* Next Day */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleNextDay}
                  className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer"
                  title="Następny dzień"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

            </div>

          </div>

          {/* Equalizer animation bars */}
          {playbackState === 'playing' && (
            <div className="mt-4 flex items-center justify-center gap-1.5 h-8">
              {[60, 90, 40, 80, 100, 70, 50, 95, 30, 85, 75, 45, 90, 65, 80].map((h, idx) => (
                <div
                  key={idx}
                  className="w-1.5 bg-gradient-to-t from-amber-500 to-red-500 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDuration: `${0.4 + (idx % 5) * 0.15}s`
                  }}
                />
              ))}
            </div>
          )}

          {/* Text Prompter / Subtitles Box with real-time reading preview */}
          <div className="mt-6 p-5 rounded-2xl bg-[#080d16] border border-slate-800 max-h-72 overflow-y-auto space-y-3 font-serif-book leading-relaxed text-sm sm:text-base text-slate-200">
            <div className="text-xs uppercase font-sans-ui font-bold text-amber-400 tracking-wider flex items-center gap-2 mb-2">
              <Headphones className="w-4 h-4" />
              <span>Tekst audycji czytany przez Lektora AI</span>
            </div>
            <div className="whitespace-pre-line text-slate-300">
              {broadcastItem.displayContent}
            </div>
          </div>

          {/* Bottom Export Call to Action */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400" />
              <span>Stacja działa w pętli. Możesz udostępnić bezpośredni link lub wygenerować wideo na YouTube.</span>
            </div>
            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>Generuj Wideo YouTube (MP4) z tego dnia</span>
            </button>
          </div>

        </div>
      </section>

      {/* 3. Detailed Guide & Station Description Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="text-center max-w-3xl mx-auto mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-serif-book text-[#2a221b] dark:text-white">
            O stacjach Radia Widoki na Raj
          </h2>
          <p className="text-sm sm:text-base text-[#675443] dark:text-[#8ea2c0]">
            Każda stacja reprezentuje odrębną, kompletną drogę duchową – od natchnionego różańca po Pismo Święte i refleksje bloga.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {RADIO_STATIONS.map((st) => {
            const isCurrentThis = activeStationId === st.id;
            const isPlayingThis = isCurrentThis && playbackState === 'playing';
            return (
              <div
                key={st.id}
                className={`p-6 rounded-3xl border transition-all ${
                  isCurrentThis
                    ? 'bg-white dark:bg-[#0f1726] border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-white dark:bg-[#0d1422] border-[#e2d5c5] dark:border-[#1d273a]'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                      {st.badge}
                    </span>
                    <h3 className="text-lg font-bold text-[#1f2937] dark:text-white mt-1">
                      {st.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleStationChange(st.id, true)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                      isPlayingThis
                        ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                        : 'bg-amber-600 hover:bg-amber-700 text-white'
                    }`}
                  >
                    {isPlayingThis ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>Nadaje w pętli (Dzień {dayNumber})</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Odtwarzaj w pętli 24/7</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-[#5f4c3c] dark:text-[#90a6c6] leading-relaxed mb-4">
                  {st.description}
                </p>
                <div className="flex items-center justify-between text-xs font-mono text-[#826f5f] dark:text-[#6a809f] border-t border-[#f0e6dc] dark:border-[#182335] pt-3">
                  <span>Pętla bez przerw: Dni 1–{st.totalDays} i od nowa</span>
                  <span>/radio?stacja={st.shareSlug}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal eksportu wideo MP4 na YouTube */}
      <VideoYouTubeExportModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        broadcastItem={broadcastItem}
      />

    </div>
  );
};
