import React, { useState, useEffect } from 'react';
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
  Repeat,
  RadioTower,
  Clock
} from 'lucide-react';
import {
  RADIO_STATIONS,
  RadioStationId,
  RadioStationMeta,
  getRadioBroadcastItem,
  RadioBroadcastItem
} from '../utils/radioContentService';
import {
  getStationLiveStatus,
  getAllStationsLiveStatus,
  StationLiveStatus
} from '../utils/radioLiveScheduleService';
import {
  globalRadioManager,
  RADIO_PLAYBACK_EVENT_NAME,
  RadioPlaybackState
} from '../utils/radioPlaybackManager';
import { generateAndDownloadQrBadgePng } from '../utils/qrCodeService';
import { VideoYouTubeExportModal } from './VideoYouTubeExportModal';

interface Props {
  initialStationId?: RadioStationId;
  onOpenLectorSettings?: () => void;
  currentLang?: string;
  theme?: 'light' | 'dark';
}

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const RadioView: React.FC<Props> = ({
  initialStationId = 'nowyrhz',
  onOpenLectorSettings,
  currentLang = 'pl',
  theme = 'light'
}) => {
  // Zegar czasu rzeczywistego (tyka co sekundę, aktualizując ramówkę live)
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Stan globalnego odtwarzacza radiowego (działa w tle niezależnie od nawigacji)
  const [radioState, setRadioState] = useState<RadioPlaybackState>(() => globalRadioManager.getState());

  // Aktywna stacja (jeśli radio gra w tle, to ta która gra; inaczej wybrana przez użytkownika lub URL)
  const [activeStationId, setActiveStationId] = useState<RadioStationId>(() => {
    const running = globalRadioManager.getState();
    return running.stationId || initialStationId;
  });

  const [bibliaYear, setBibliaYear] = useState<1 | 2 | 3 | 4>(1);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);

  // Subskrypcja na globalne zdarzenia odtwarzania radia w tle
  useEffect(() => {
    const handleRadioUpdate = (e: any) => {
      const state = e.detail || globalRadioManager.getState();
      setRadioState(state);
      if (state.stationId && state.isRadioActive) {
        setActiveStationId(state.stationId);
      }
    };

    window.addEventListener(RADIO_PLAYBACK_EVENT_NAME, handleRadioUpdate);
    return () => {
      window.removeEventListener(RADIO_PLAYBACK_EVENT_NAME, handleRadioUpdate);
    };
  }, []);

  // Sync station from URL query on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stationParam = params.get('stacja') || params.get('station') || params.get('s');
    if (stationParam && RADIO_STATIONS.some(s => s.id === stationParam)) {
      setActiveStationId(stationParam as RadioStationId);
    }
  }, []);

  // Update browser URL query without reloading when station changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('stacja', activeStationId);
    window.history.replaceState({}, '', url.toString());
  }, [activeStationId]);

  const activeStation = RADIO_STATIONS.find(s => s.id === activeStationId) || RADIO_STATIONS[0];

  // Dynamiczny status ramówki na żywo 24/7 dla wybranej stacji oraz dla wszystkich 4 stacji
  const liveStatus = getStationLiveStatus(activeStationId, nowMs, bibliaYear);
  const allLiveStatuses = getAllStationsLiveStatus(nowMs, bibliaYear);

  // Sprawdzamy, czy w tej chwili nasza stacja jest odtwarzana w tle
  const isPlayingThisStation = radioState.isRadioActive && radioState.stationId === activeStationId;
  const isPlayingAnyStation = radioState.isRadioActive;

  // Numer dnia prezentowany w studiu: jeśli gra w tle, to ten co gra; inaczej aktualny na żywo
  const displayedDayNumber = isPlayingThisStation ? radioState.dayNumber : liveStatus.dayNumber;
  const broadcastItem: RadioBroadcastItem = isPlayingThisStation && radioState.currentBroadcastItem
    ? radioState.currentBroadcastItem
    : getRadioBroadcastItem(activeStationId, displayedDayNumber, bibliaYear);

  /**
   * 1. Dołączenie do transmisji NA ŻYWO (jak tradycyjne radio FM/internetowe)
   * Słuchacz włącza stację i od razu słyszy to, co jest aktualnie nadawane w eterze w danej chwili.
   */
  const handleTuneInLive = () => {
    globalRadioManager.tuneInStation(activeStationId, undefined, true);
  };

  /**
   * 2. Odtwarzanie aktualnego dnia od początku
   */
  const handlePlayFromStart = (dayToPlay?: number) => {
    const targetDay = dayToPlay !== undefined ? dayToPlay : displayedDayNumber;
    globalRadioManager.tuneInStation(activeStationId, targetDay, false);
  };

  /**
   * 3. Przełączanie odtwarzania (Play / Pause)
   */
  const handleTogglePlay = () => {
    if (isPlayingThisStation) {
      if (radioState.playbackState === 'playing') {
        globalRadioManager.pauseRadio();
      } else {
        globalRadioManager.resumeRadio();
      }
    } else {
      handleTuneInLive();
    }
  };

  const handleStop = () => {
    globalRadioManager.stopRadio();
  };

  const handleNextDay = () => {
    if (isPlayingThisStation) {
      globalRadioManager.playNextDay();
    } else {
      const next = displayedDayNumber >= activeStation.totalDays ? 1 : displayedDayNumber + 1;
      handlePlayFromStart(next);
    }
  };

  const handlePrevDay = () => {
    if (isPlayingThisStation) {
      globalRadioManager.playPrevDay();
    } else {
      const prev = displayedDayNumber <= 1 ? activeStation.totalDays : displayedDayNumber - 1;
      handlePlayFromStart(prev);
    }
  };

  const handleStationChange = (newStationId: RadioStationId, startLive: boolean = false) => {
    setActiveStationId(newStationId);
    if (startLive || isPlayingAnyStation) {
      globalRadioManager.tuneInStation(newStationId, undefined, true);
    }
  };

  /**
   * Udostępnianie bezpośredniego linku do stacji radiowej
   */
  const handleShareStation = async () => {
    const shareUrl = `${window.location.origin}/radio?stacja=${activeStationId}`;
    const shareTitle = `Radio Internetowe 24/7 – ${activeStation.name}`;
    const shareText = `Słuchaj na żywo w pętli 24/7: ${broadcastItem.headlineTitle} (${broadcastItem.displayDate}).`;

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
              <span>4 Stacje Online 24/7 • Transmisja w tle w czasie rzeczywistym</span>
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
              <RadioTower className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 animate-pulse shrink-0" />
              <span>Radio Widoki na Raj 24/7</span>
            </h1>
            <p className="text-base sm:text-lg text-[#5e4b3b] dark:text-[#9bb0cf] max-w-4xl font-sans-ui leading-relaxed">
              Tradycyjne internetowe stacje radiowe nadające w nieprzerwanym ciągu 24 godziny na dobę. 
              Transmisja płynie w tle niezależnie od słuchacza – możesz dołączyć w dowolnym momencie i natychmiast słuchać aktualnie nadawanego fragmentu rozważań, modlitwy i Słowa Bożego.
            </p>
          </div>

          {/* 4 Stacje Tab Selector z zegarem na żywo dla każdej stacji */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {RADIO_STATIONS.map((station) => {
              const isSelected = activeStationId === station.id;
              const isStationPlayingInBg = radioState.isRadioActive && radioState.stationId === station.id;
              const stLive = allLiveStatuses.find(s => s.station.id === station.id) || liveStatus;

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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isSelected 
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300' 
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {station.badge}
                      </span>
                      {isStationPlayingInBg ? (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600/15 border border-red-500/40 text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">
                          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                          <span>GRA W TLE</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>ONLINE</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="font-bold text-base text-[#251e18] dark:text-white leading-tight">
                        {station.name}
                      </div>
                      <div className="text-xs text-[#715c4b] dark:text-[#8ea2c0] line-clamp-2 mt-0.5">
                        {station.tagline}
                      </div>
                    </div>

                    {/* Wskaźnik ramówki live w czasie rzeczywistym */}
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-amber-900 dark:text-amber-200 font-semibold">
                        <span>🔴 Na antenie: Dzień {stLive.dayNumber}</span>
                        <span className="font-mono">{stLive.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-amber-200/40 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-600 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${stLive.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#f0e6dc] dark:border-[#1a2538] flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-400">
                    <span>
                      {isStationPlayingInBg
                        ? '🔴 Odtwarzana teraz w tle'
                        : isSelected
                          ? '▶ Słuchaj na żywo'
                          : 'Włącz tę stację na żywo'}
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
                <RadioTower className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    {activeStation.channelName}
                  </span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] bg-red-600 text-white font-bold uppercase animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
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
                onClick={() => globalRadioManager.setLoopEnabled(!radioState.isLoopEnabled)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  radioState.isLoopEnabled
                    ? 'bg-amber-600/25 text-amber-300 border-amber-500/60 shadow-xs'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title="Pętla 24/7 bez przerw: po skończeniu dnia natychmiast odtwarza kolejny, a po ukończeniu całej serii wraca do Dnia 1."
              >
                <Repeat className={`w-3.5 h-3.5 ${radioState.playbackState === 'playing' ? 'animate-spin' : ''}`} />
                <span>Pętla 24/7 {radioState.isLoopEnabled ? 'Aktywna' : 'Wyłączona'}</span>
              </button>

              {radioState.isLoopEnabled && (
                <div className="inline-flex rounded-xl bg-slate-900/90 p-1 border border-slate-700/80 text-[11px] font-semibold gap-1">
                  <button
                    onClick={() => globalRadioManager.setLoopMode('station')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      radioState.loopMode === 'station'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Pętla stacji: Dzień 1 do ostatniego, i od razu od początku (Dzień 1)"
                  >
                    Pętla stacji (1..{activeStation.totalDays})
                  </button>
                  <button
                    onClick={() => globalRadioManager.setLoopMode('all_stations')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      radioState.loopMode === 'all_stations'
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

          {/* Główny pasek statusu transmisji na żywo (Linear Real-time Broadcast Bar) */}
          <div className="mb-6 p-4 rounded-2xl bg-[#090f1a] border border-amber-500/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span>AKTUALNIE NADAWANE NA ŻYWO: Dzień {liveStatus.dayNumber} ze {activeStation.totalDays}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300 font-mono text-xs">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{formatSeconds(liveStatus.secondsElapsedInDay)} / {formatSeconds(liveStatus.dayDurationSeconds)}</span>
                </span>
                <span className="text-amber-400/80">
                  (pozostało {formatSeconds(liveStatus.secondsRemainingInDay)})
                </span>
              </div>
            </div>

            {/* Pasek postępu audycji na żywo w czasie rzeczywistym */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/80">
              <div
                className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${liveStatus.progressPercent}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">
              <span>
                Transmisja płynie 24/7 dla wszystkich słuchaczy. Po ukończeniu dnia natychmiast rozpoczyna się Dzień {liveStatus.dayNumber >= activeStation.totalDays ? 1 : liveStatus.dayNumber + 1}.
              </span>
              <span className="text-amber-300 font-mono font-semibold">
                Postęp audycji: {liveStatus.progressPercent}%
              </span>
            </div>
          </div>

          {/* Duże przyciski dołączania do transmisji NA ŻYWO */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleTuneInLive}
              className={`px-6 py-3.5 rounded-2xl font-bold text-sm sm:text-base transition cursor-pointer flex items-center gap-2.5 shadow-xl hover:scale-105 active:scale-95 ${
                isPlayingThisStation && radioState.playbackState === 'playing'
                  ? 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-400'
                  : 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:brightness-110 text-white'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-white animate-ping" />
              <span>
                {isPlayingThisStation && radioState.playbackState === 'playing'
                  ? '🔴 SŁUCHASZ AUDYCJI NA ŻYWO W TLE'
                  : '🔴 DOŁĄCZ DO TRANSMISJI NA ŻYWO'}
              </span>
            </button>

            <button
              onClick={() => handlePlayFromStart(displayedDayNumber)}
              className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition active:scale-95 cursor-pointer border border-white/20 flex items-center gap-2"
              title="Odtwarzaj bieżący dzień od początku"
            >
              <RotateCcw className="w-4 h-4 text-amber-300" />
              <span>Słuchaj Dnia {displayedDayNumber} od początku</span>
            </button>
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
                {displayedDayNumber} / {activeStation.totalDays} dni w cyklu
              </div>
            </div>

            {/* Slider do wyboru dnia w archiwum audycji */}
            <div className="space-y-1">
              <input
                type="range"
                min={1}
                max={activeStation.totalDays}
                value={displayedDayNumber}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  handlePlayFromStart(val);
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
                {isPlayingThisStation && radioState.playbackState === 'playing' ? (
                  <button
                    onClick={handleTogglePlay}
                    className="p-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white shadow-xl shadow-amber-600/30 transition active:scale-95 cursor-pointer"
                    title="Wstrzymaj audycję"
                  >
                    <Pause className="w-7 h-7" />
                  </button>
                ) : isPlayingThisStation && radioState.playbackState === 'paused' ? (
                  <button
                    onClick={handleTogglePlay}
                    className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
                    title="Wznów audycję"
                  >
                    <Play className="w-7 h-7 ml-0.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleTuneInLive}
                    className="p-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:brightness-110 text-white shadow-xl shadow-amber-600/30 transition active:scale-95 cursor-pointer"
                    title="Rozpocznij transmisję na żywo"
                  >
                    <Play className="w-7 h-7 ml-0.5" />
                  </button>
                )}

                <button
                  onClick={handleStop}
                  disabled={!isPlayingThisStation || radioState.playbackState === 'idle'}
                  className={`p-4 rounded-2xl transition active:scale-95 cursor-pointer ${
                    isPlayingThisStation && radioState.playbackState !== 'idle'
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
          {isPlayingThisStation && radioState.playbackState === 'playing' && (
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
              <span>Treść aktualnie nadawanej audycji (Lektor AI TTS)</span>
            </div>
            <div className="whitespace-pre-line text-slate-300">
              {broadcastItem.displayContent}
            </div>
          </div>

          {/* Bottom Export Call to Action */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400" />
              <span>Transmisja trwa w tle niezależnie od nawigacji po serwisie. Możesz czytać inne działy słuchając radia.</span>
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
            4 Stacje Radia Widoki na Raj – Nadawanie 24/7
          </h2>
          <p className="text-sm sm:text-base text-[#675443] dark:text-[#8ea2c0]">
            Każda stacja nadaje w czasie rzeczywistym nieprzerwanie przez cały rok. Wybierz stację, aby dołączyć do bieżącej audycji.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {RADIO_STATIONS.map((st) => {
            const isCurrentThis = activeStationId === st.id;
            const isPlayingThisInBg = radioState.isRadioActive && radioState.stationId === st.id;
            const stLive = allLiveStatuses.find(s => s.station.id === st.id) || liveStatus;

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
                      isPlayingThisInBg
                        ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                        : 'bg-amber-600 hover:bg-amber-700 text-white'
                    }`}
                  >
                    {isPlayingThisInBg ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>Nadaje w tle (Dzień {radioState.dayNumber})</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Słuchaj na żywo (Dzień {stLive.dayNumber})</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-[#5f4c3c] dark:text-[#90a6c6] leading-relaxed mb-4">
                  {st.description}
                </p>
                <div className="flex items-center justify-between text-xs font-mono text-[#826f5f] dark:text-[#6a809f] border-t border-[#f0e6dc] dark:border-[#182335] pt-3">
                  <span>Pętla ciągła: 1 do {st.totalDays} dni i od nowa</span>
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
