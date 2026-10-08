import React, { useState, useEffect } from 'react';
import {
  Radio as RadioIcon,
  Volume2,
  VolumeX,
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
  Clock,
  Eye,
  FileText,
  RotateCcw
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

  // Aktywna stacja podsłuchu
  const [activeStationId, setActiveStationId] = useState<RadioStationId>(() => {
    const running = globalRadioManager.getState();
    return running.stationId || initialStationId;
  });

  const [bibliaYear, setBibliaYear] = useState<1 | 2 | 3 | 4>(1);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [previewDayNumber, setPreviewDayNumber] = useState<number | null>(null);
  const [audioProgress, setAudioProgress] = useState<{ currentTime: number; duration: number; progressPercent: number } | null>(null);

  // Subskrypcja na globalne zdarzenia odtwarzania radia w tle oraz postępu lektora audio
  useEffect(() => {
    const handleRadioUpdate = (e: any) => {
      const state = e.detail || globalRadioManager.getState();
      setRadioState(state);
      if (state.stationId && state.isRadioActive) {
        setActiveStationId(state.stationId);
      }
    };

    const handleAudioProgress = (e: any) => {
      if (e.detail) {
        setAudioProgress(e.detail);
      }
    };

    window.addEventListener(RADIO_PLAYBACK_EVENT_NAME, handleRadioUpdate);
    window.addEventListener('drogowskazy_audio_playback_progress', handleAudioProgress);
    return () => {
      window.removeEventListener(RADIO_PLAYBACK_EVENT_NAME, handleRadioUpdate);
      window.removeEventListener('drogowskazy_audio_playback_progress', handleAudioProgress);
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

  // 1. AUTOMATYCZNY START PODSŁUCHU BEZ WŁĄCZANIA (Auto-tune on mount & change)
  useEffect(() => {
    // Automatycznie rozpoczynamy podsłuch bez konieczności klikania przycisku "Włącz"
    globalRadioManager.ensurePlaying(activeStationId);

    // Na wypadek restrykcji polityki autoplay przeglądarki (Safari/Chrome):
    // pierwszy dotyk/klik w dowolnym miejscu automatycznie odblokowuje dźwięk
    const unlockOnUserGesture = () => {
      if (!globalRadioManager.isListening() && !globalRadioManager.getState().isMuted) {
        globalRadioManager.ensurePlaying(activeStationId);
      }
    };
    window.addEventListener('pointerdown', unlockOnUserGesture, { once: true });
    window.addEventListener('touchstart', unlockOnUserGesture, { once: true });
    window.addEventListener('keydown', unlockOnUserGesture, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockOnUserGesture);
      window.removeEventListener('touchstart', unlockOnUserGesture);
      window.removeEventListener('keydown', unlockOnUserGesture);
    };
  }, [activeStationId]);

  const activeStation = RADIO_STATIONS.find(s => s.id === activeStationId) || RADIO_STATIONS[0];

  // Dynamiczny status ramówki na żywo 24/7 dla wybranej stacji oraz dla wszystkich 4 stacji
  const liveStatus = getStationLiveStatus(activeStationId, nowMs, bibliaYear);
  const allLiveStatuses = getAllStationsLiveStatus(nowMs, bibliaYear);

  // Sprawdzamy, czy w tej chwili nasza stacja jest podsłuchiwana z dźwiękiem
  const isCurrentlyListening = radioState.isRadioActive && radioState.stationId === activeStationId && !radioState.isMuted;
  const isMuted = radioState.isMuted;

  // Numer dnia prezentowany w studiu: zawsze aktualny na żywo
  const displayedDayNumber = liveStatus.dayNumber;
  const broadcastItem: RadioBroadcastItem = isCurrentlyListening && radioState.currentBroadcastItem
    ? radioState.currentBroadcastItem
    : liveStatus.broadcastItem;

  // Podglądany tekst archiwalny (gdy użytkownik przegląda ramówkę bez przerywania transmisji na żywo)
  const previewItem: RadioBroadcastItem | null = previewDayNumber !== null
    ? getRadioBroadcastItem(activeStationId, previewDayNumber, bibliaYear)
    : null;

  /**
   * Zmiana podsłuchiwanej stacji: natychmiastowe przełączenie na żywo bez klikania Play!
   */
  const handleSwitchStation = (newStationId: RadioStationId) => {
    setActiveStationId(newStationId);
    setPreviewDayNumber(null);
    globalRadioManager.tuneInStation(newStationId, undefined, true);
  };

  /**
   * Wycisz / Odcisz podsłuch (Mute / Unmute)
   */
  const handleToggleMute = () => {
    globalRadioManager.toggleMute();
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
              <span>4 STACJE ONLINE 24/7 • NADAJĄ W PĘTLI BEZ PRZERWY</span>
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
              Wszystkie 4 stacje radiowe nadają bez przerwy w pętli 24 godziny na dobę. 
              Nie musisz niczego włączać ani uruchamiać – jesteś w trybie ciągłego podsłuchu. 
              Możesz przełączać stacje i podsłuchiwać to, co w danej sekundzie płynie w eterze.
            </p>
          </div>

          {/* 4 Stacje Selector (Karty Podsłuchu na żywo dla każdej ze stacji) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {RADIO_STATIONS.map((station) => {
              const isSelected = activeStationId === station.id;
              const isHearingThisStation = isCurrentlyListening && isSelected;
              const stLive = allLiveStatuses.find(s => s.station.id === station.id) || liveStatus;

              return (
                <button
                  key={station.id}
                  onClick={() => handleSwitchStation(station.id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white dark:bg-[#131d2e] border-amber-500/80 dark:border-amber-400 shadow-xl ring-2 ring-amber-500/40'
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

                      {isHearingThisStation ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-[10px] font-bold text-white uppercase shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                          <span>PODSŁUCHUJESZ</span>
                        </span>
                      ) : isSelected ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                          WYBRANA
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>W PĘTLI 24/7</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="font-bold text-base text-[#251e18] dark:text-white leading-tight">
                        {station.name}
                      </div>
                      <div className="text-xs text-[#715c4b] dark:text-[#8ea2c0] line-clamp-1 mt-0.5">
                        {station.tagline}
                      </div>
                    </div>

                    {/* Wskaźnik ramówki live w czasie rzeczywistym */}
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-amber-900 dark:text-amber-200 font-semibold">
                        <span>🔴 Dzień {stLive.dayNumber} z {station.totalDays}</span>
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
                    <span className="flex items-center gap-1.5">
                      {isHearingThisStation ? (
                        <>
                          {/* Animated equalizer waves */}
                          <span className="inline-flex items-end gap-0.5 h-3">
                            <span className="w-0.5 bg-red-600 h-full animate-bounce" />
                            <span className="w-0.5 bg-red-600 h-2/3 animate-bounce [animation-delay:0.15s]" />
                            <span className="w-0.5 bg-red-600 h-4/5 animate-bounce [animation-delay:0.3s]" />
                          </span>
                          <span>Aktywny podsłuch audio</span>
                        </>
                      ) : isSelected ? (
                        <span>Przełączono podsłuch</span>
                      ) : (
                        <span>Podsłuchuj tę stację</span>
                      )}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      </section>

      {/* 2. Main Live Receiver Studio (Wirtualny Odbiornik Radiowy) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-gradient-to-b from-[#131d2e] to-[#0c121e] rounded-3xl border border-amber-500/30 shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden">
          
          {/* Subtle Ambient Wave Effect in background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Top Info Bar inside Receiver Studio */}
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
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-600 text-white font-bold uppercase animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    PODSŁUCH W PĘTLI 24/7
                  </span>
                </div>
                <h2 className="text-lg sm:text-2xl font-bold font-serif-book text-white truncate max-w-xl">
                  {broadcastItem.headlineTitle}
                </h2>
              </div>
            </div>

            {/* Loop Status & Mode */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                <Repeat className="w-3.5 h-3.5 animate-spin" />
                <span>Pętla 24/7 bez przerw</span>
              </div>

              <div className="inline-flex rounded-xl bg-slate-900/90 p-1 border border-slate-700/80 text-[11px] font-semibold gap-1">
                <button
                  onClick={() => globalRadioManager.setLoopMode('station')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    radioState.loopMode === 'station'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Pętla stacji: Dni 1 do ostatniego, i od razu od początku (Dzień 1)"
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
                  title="Wielka pętla 4 stacji: Wszystkie 4 stacje po kolei w nieprzerwanym ciągu"
                >
                  Wielka pętla 4 stacji
                </button>
              </div>
            </div>
          </div>

          {/* Główny pasek statusu transmisji na żywo (Linear Real-time Broadcast Bar) */}
          {(() => {
            const hasAudioData = isCurrentlyListening && audioProgress && audioProgress.duration > 0;
            const effectiveElapsed = hasAudioData ? Math.round(audioProgress!.currentTime) : liveStatus.secondsElapsedInDay;
            const effectiveTotal = hasAudioData ? Math.round(audioProgress!.duration) : liveStatus.dayDurationSeconds;
            const effectivePercent = hasAudioData ? audioProgress!.progressPercent : liveStatus.progressPercent;
            const effectiveRemaining = Math.max(0, effectiveTotal - effectiveElapsed);

            return (
              <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-[#090f1a] border border-amber-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span>AKTUALNIE W ETERZE: Dzień {liveStatus.dayNumber} ze {activeStation.totalDays}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300 font-mono text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{formatSeconds(effectiveElapsed)} / {formatSeconds(effectiveTotal)}</span>
                    </span>
                    <span className="text-amber-400/80">
                      (do kolejnego dnia w pętli: {formatSeconds(effectiveRemaining)})
                    </span>
                  </div>
                </div>

                {/* Pasek postępu audycji na żywo w czasie rzeczywistym */}
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/80">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${effectivePercent}%` }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">
                  <span>
                    Transmisja płynie nieustannie dla każdego słuchacza. Po dojściu do końca audycji natychmiast rozpoczyna się Dzień {liveStatus.dayNumber >= activeStation.totalDays ? 1 : liveStatus.dayNumber + 1}.
                  </span>
                  <span className="text-amber-300 font-mono font-semibold">
                    Postęp audycji: {effectivePercent}%
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Główne kontrolki podsłuchu (Receiver Listening & Mute Controls) */}
          <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleMute}
                className={`px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2.5 shadow-lg active:scale-95 ${
                  isMuted
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-400'
                }`}
                title={isMuted ? 'Włącz dźwięk podsłuchu' : 'Wycisz podsłuch'}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>ODCISZ GŁOŚNIK PODSŁUCHU</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 animate-pulse" />
                    <span>WYCISZ PODSŁUCH</span>
                  </>
                )}
              </button>

              <div className="text-xs text-slate-300">
                {isMuted ? (
                  <span className="text-amber-300 font-semibold">Głośnik wyciszony (transmisja w tle trwa nadal)</span>
                ) : (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Podsłuchujesz transmisję na żywo
                  </span>
                )}
              </div>
            </div>

            {/* Szybki przełącznik stacji w odbiorniku */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 font-semibold mr-1">Przełącz stację:</span>
              {RADIO_STATIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSwitchStation(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeStationId === s.id
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {s.badge}
                </button>
              ))}
            </div>
          </div>

          {/* Aktualnie podsłuchiwana treść na żywo */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white">{broadcastItem.displayDate}</span>
                <span className="text-slate-400">• {broadcastItem.subtitle}</span>
              </div>
              <div className="font-mono text-amber-400 text-xs">
                Dzień {displayedDayNumber} / {activeStation.totalDays} dni w pętli
              </div>
            </div>

            {/* Treść rozważania / modlitwy / Słowa Bożego na żywo */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#080d17] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Tekst aktualnie czytany na antenie</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Lektor AI 24/7
                </div>
              </div>

              <div className="text-sm sm:text-base text-slate-200 font-serif leading-relaxed space-y-3 max-h-72 overflow-y-auto pr-2">
                {broadcastItem.reference && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-sans text-amber-200">
                    <strong>Fragment Pisma Świętego / Sygnatura:</strong> {broadcastItem.reference}
                  </div>
                )}

                <p className="whitespace-pre-line">
                  {broadcastItem.displayContent || broadcastItem.speechText}
                </p>
              </div>
            </div>

            {/* Podgląd Ramówki Całej Pętli (Słuchacz może przeglądać teksty bez przerywania transmisji na żywo) */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Program ramówki w pętli ({activeStation.totalDays} dni)</span>
                </div>
                {/* Szybkie przeskakiwanie dni w ramówce */}
                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => {
                      const cur = previewDayNumber ?? liveStatus.dayNumber;
                      const next = cur - 10 < 1 ? activeStation.totalDays : cur - 10;
                      setPreviewDayNumber(next);
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold cursor-pointer"
                    title="-10 dni"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => {
                      const cur = previewDayNumber ?? liveStatus.dayNumber;
                      const next = cur - 1 < 1 ? activeStation.totalDays : cur - 1;
                      setPreviewDayNumber(next);
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold cursor-pointer"
                    title="-1 dzień"
                  >
                    -1
                  </button>
                  <span className="px-2 text-amber-300 font-mono font-bold">
                    Dzień {previewDayNumber ?? liveStatus.dayNumber} / {activeStation.totalDays}
                  </span>
                  <button
                    onClick={() => {
                      const cur = previewDayNumber ?? liveStatus.dayNumber;
                      const next = cur + 1 > activeStation.totalDays ? 1 : cur + 1;
                      setPreviewDayNumber(next);
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold cursor-pointer"
                    title="+1 dzień"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => {
                      const cur = previewDayNumber ?? liveStatus.dayNumber;
                      const next = cur + 10 > activeStation.totalDays ? 1 : cur + 10;
                      setPreviewDayNumber(next);
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold cursor-pointer"
                    title="+10 dni"
                  >
                    +10
                  </button>
                </div>
              </div>

              {/* Pigułki dni (przewijalne, wyśrodkowane wokół bieżącego/podglądanego dnia) */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar">
                {Array.from({ length: Math.min(50, activeStation.totalDays) }, (_, i) => {
                  const baseDay = previewDayNumber ?? liveStatus.dayNumber;
                  const d = ((baseDay - 10 + i + activeStation.totalDays * 10) % activeStation.totalDays) + 1;
                  const isCurrentLive = d === liveStatus.dayNumber;
                  const isBeingPreviewed = (previewDayNumber ?? liveStatus.dayNumber) === d;

                  return (
                    <button
                      key={d}
                      onClick={() => setPreviewDayNumber(d === previewDayNumber ? null : d)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer ${
                        isBeingPreviewed
                          ? 'bg-amber-500 text-slate-950 font-extrabold ring-2 ring-amber-300 shadow-md'
                          : isCurrentLive
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                      }`}
                      title={`Dzień ${d} w pętli stacji`}
                    >
                      {isCurrentLive ? `🔴 Dzień ${d} (LIVE)` : `Dzień ${d}`}
                    </button>
                  );
                })}
              </div>

              {/* Podgląd wybranego dnia z archiwum bez zakłócania audycji na żywo */}
              {previewItem && previewDayNumber !== null && (
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/40 text-xs sm:text-sm text-slate-200 space-y-3 animate-fade-in">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-amber-400 font-bold border-b border-amber-500/20 pb-2">
                    <span>📖 Podgląd: Dzień {previewDayNumber} ze {activeStation.totalDays} ({previewItem.displayDate})</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsVideoModalOpen(true)}
                        className="px-3 py-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Generuj Wideo YouTube (MP4)</span>
                      </button>
                      <button
                        onClick={() => setPreviewDayNumber(null)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                      >
                        Zamknij podgląd
                      </button>
                    </div>
                  </div>
                  <div className="font-semibold text-white">{previewItem.headlineTitle}</div>
                  <div className="text-xs text-slate-300 font-serif max-h-48 overflow-y-auto whitespace-pre-line leading-relaxed">
                    {previewItem.displayContent || previewItem.speechText}
                  </div>
                  <div className="text-[11px] text-amber-300/80 italic">
                    ℹ️ Transmisja na żywo w eterze płynie nieustannie w tle bez zakłóceń.
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* 3. YouTube Video Karaoke Export Modal */}
      {isVideoModalOpen && (
        <VideoYouTubeExportModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          broadcastItem={broadcastItem}
          stationMeta={activeStation}
          currentDayNumber={displayedDayNumber}
          totalDays={activeStation.totalDays}
        />
      )}

    </div>
  );
};
