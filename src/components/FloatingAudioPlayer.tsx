import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Headphones,
  Settings,
  X,
  Volume2,
  VolumeX,
  Radio as RadioIcon
} from 'lucide-react';
import { CycleDate, SectionMeta, SectionEntry } from '../types';
import {
  getLectorPlaybackState,
  LectorPlaybackState,
  pauseLectorSpeech,
  resumeLectorSpeech,
  stopLectorSpeech,
  playLectorSpeech,
  getLectorConfig,
  getSerialLectorState,
  saveSerialLectorState,
  SerialLectorState
} from '../utils/audioLectorService';
import {
  globalRadioManager,
  RADIO_PLAYBACK_EVENT_NAME,
  RadioPlaybackState
} from '../utils/radioPlaybackManager';
import { RADIO_STATIONS } from '../utils/radioContentService';

interface Props {
  currentDate: CycleDate;
  activeSection: SectionMeta;
  displayedEntry: SectionEntry;
  onNextDay: () => void;
  onPrevDay: () => void;
  onOpenLectorModal: () => void;
  currentLang?: string;
  onNavigateSection?: (sectionId: string) => void;
}

export const FloatingAudioPlayer: React.FC<Props> = ({
  currentDate,
  activeSection,
  displayedEntry,
  onNextDay,
  onPrevDay,
  onOpenLectorModal,
  currentLang = 'pl',
  onNavigateSection
}) => {
  const [playbackState, setPlaybackState] = useState<LectorPlaybackState>(() => getLectorPlaybackState());
  const [serialState, setSerialState] = useState<SerialLectorState>(() => getSerialLectorState());
  const [radioState, setRadioState] = useState<RadioPlaybackState>(() => globalRadioManager.getState());
  const [isMinimized, setIsMinimized] = useState(false);

  // Sync state on custom events
  useEffect(() => {
    const handleStateChange = () => {
      setPlaybackState(getLectorPlaybackState());
    };
    const handleSerialChange = (e: any) => {
      setSerialState(e.detail || getSerialLectorState());
    };
    const handleRadioChange = (e: any) => {
      setRadioState(e.detail || globalRadioManager.getState());
    };

    window.addEventListener('drogowskazy_lector_state_changed', handleStateChange);
    window.addEventListener('drogowskazy_serial_lector_updated', handleSerialChange);
    window.addEventListener(RADIO_PLAYBACK_EVENT_NAME, handleRadioChange);

    return () => {
      window.removeEventListener('drogowskazy_lector_state_changed', handleStateChange);
      window.removeEventListener('drogowskazy_serial_lector_updated', handleSerialChange);
      window.removeEventListener(RADIO_PLAYBACK_EVENT_NAME, handleRadioChange);
    };
  }, []);

  const isRadioActive = radioState.isRadioActive;

  // Show player if playing, paused, serial lector is active, or 24/7 radio is broadcasting
  const isVisible = playbackState !== 'idle' || serialState.isActive || isRadioActive;

  if (!isVisible) {
    return null;
  }

  const handleTogglePlayPause = () => {
    if (isRadioActive) {
      if (playbackState === 'playing') {
        globalRadioManager.pauseRadio();
      } else {
        globalRadioManager.resumeRadio();
      }
      return;
    }

    if (playbackState === 'playing') {
      pauseLectorSpeech();
    } else if (playbackState === 'paused') {
      resumeLectorSpeech();
    } else {
      triggerPlayCurrentEntry();
    }
  };

  const handleStop = () => {
    if (isRadioActive) {
      globalRadioManager.stopRadio();
      return;
    }
    saveSerialLectorState({ isActive: false });
    stopLectorSpeech();
    setPlaybackState('idle');
  };

  const triggerPlayCurrentEntry = async () => {
    const title = serialState.lastTitle || displayedEntry.title || activeSection.name;
    const textToSpeak = `${title}. ${displayedEntry.content.replace(/<[^>]*>/g, '')}. ${displayedEntry.prayer ? 'Modlitwa: ' + displayedEntry.prayer.replace(/<[^>]*>/g, '') : ''}`;
    const lectorCfg = getLectorConfig();

    await playLectorSpeech({
      text: textToSpeak,
      config: lectorCfg,
      overrideLang: currentLang,
      title: title,
      sectionName: activeSection.name,
      artworkUrl: activeSection.imageUrl,
      onStart: () => {
        saveSerialLectorState({
          isActive: true,
          currentSectionId: activeSection.id,
          currentDayNumber: currentDate.dayNumber,
          lastTitle: title
        });
      },
      onEnd: () => {
        const currentSerial = getSerialLectorState();
        if (currentSerial.autoNext && currentSerial.isActive) {
          onNextDay();
          setTimeout(() => {
            const freshSerial = getSerialLectorState();
            if (freshSerial.isActive) {
              triggerPlayCurrentEntry();
            }
          }, 400);
        } else {
          saveSerialLectorState({ isActive: false });
        }
      },
      onError: () => {
        saveSerialLectorState({ isActive: false });
      },
      onNext: () => {
        onNextDay();
      },
      onPrev: () => {
        onPrevDay();
      }
    });
  };

  const handlePrev = () => {
    if (isRadioActive) {
      globalRadioManager.playPrevDay();
      return;
    }
    onPrevDay();
    if (playbackState === 'playing') {
      setTimeout(() => {
        const fresh = getSerialLectorState();
        if (fresh.isActive) {
          triggerPlayCurrentEntry();
        }
      }, 300);
    }
  };

  const handleNext = () => {
    if (isRadioActive) {
      globalRadioManager.playNextDay();
      return;
    }
    onNextDay();
    if (playbackState === 'playing') {
      setTimeout(() => {
        const fresh = getSerialLectorState();
        if (fresh.isActive) {
          triggerPlayCurrentEntry();
        }
      }, 300);
    }
  };

  const toggleSerialMode = () => {
    const updated = !serialState.autoNext;
    saveSerialLectorState({ autoNext: updated });
  };

  const stationMeta = isRadioActive && radioState.stationId
    ? RADIO_STATIONS.find(s => s.id === radioState.stationId)
    : null;

  const activeBadge = isRadioActive
    ? '🔴 RADIO 24/7 LIVE'
    : activeSection.name;

  const activeSubInfo = isRadioActive
    ? `${stationMeta?.shortName || 'Radio'} • Dzień ${radioState.dayNumber} z ${radioState.totalDays}`
    : `Dzień ${currentDate.dayNumber} z 366`;

  const activeTitle = isRadioActive
    ? (radioState.currentBroadcastItem?.headlineTitle || stationMeta?.name || 'Radio Internetowe 24/7')
    : (serialState.lastTitle || displayedEntry.title || 'Odtwarzacz Lektora');

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-bounce-short">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-white rounded-full shadow-2xl hover:scale-105 transition-all border border-amber-400/40 cursor-pointer"
          title="Rozwiń odtwarzacz lektora"
        >
          {isRadioActive ? (
            <RadioIcon className="w-5 h-5 text-red-400 animate-pulse" />
          ) : (
            <Volume2 className="w-5 h-5 text-amber-300 animate-pulse" />
          )}
          <span className="text-xs font-semibold max-w-[140px] truncate">{activeTitle}</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300"></span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[96%] max-w-2xl animate-fade-in-up">
      <div className="bg-[#120e0b]/95 dark:bg-[#070c14]/95 backdrop-blur-2xl border-2 border-amber-500/40 text-amber-50 rounded-2xl shadow-2xl p-3 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Track Title & Metadata Area */}
        <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
          <div className="relative flex-shrink-0">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${isRadioActive ? 'from-red-600 to-amber-700' : 'from-amber-500 to-amber-800'} flex items-center justify-center shadow-lg border border-amber-300/40 ${playbackState === 'playing' ? 'animate-pulse' : ''}`}>
              {isRadioActive ? (
                <RadioIcon className={`w-6 h-6 text-white ${playbackState === 'playing' ? 'animate-pulse' : ''}`} />
              ) : (
                <Volume2 className={`w-6 h-6 text-white ${playbackState === 'playing' ? 'animate-bounce-short' : ''}`} />
              )}
            </div>
            {playbackState === 'playing' && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-black"></span>
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-[10px] uppercase font-extrabold tracking-wider rounded-md border ${
                isRadioActive
                  ? 'bg-red-600/30 text-red-300 border-red-500/50'
                  : 'bg-amber-500/30 text-amber-300 border-amber-400/40'
              }`}>
                {activeBadge}
              </span>
              <span className="text-[11px] text-amber-200/80 font-medium">
                {activeSubInfo}
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold truncate text-white mt-0.5">
              {activeTitle}
            </h4>
          </div>

          {/* Mobile Close / Minimize */}
          <button
            onClick={() => setIsMinimized(true)}
            className="sm:hidden p-1.5 rounded-lg text-amber-300/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Zminimalizuj odtwarzacz"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Controls Bar */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto flex-wrap">
          
          {isRadioActive ? (
            <>
              {/* Studio Radia Link */}
              <button
                onClick={() => {
                  if (onNavigateSection) {
                    onNavigateSection('radio');
                  } else {
                    window.location.href = `/radio?stacja=${radioState.stationId || 'nowyrhz'}`;
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 border border-amber-400/40 transition text-xs font-bold cursor-pointer"
                title="Przejdź do studia radiowego"
              >
                <RadioIcon className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span>Studio Radia</span>
              </button>

              {/* Przełącz stację (1..4) */}
              <button
                onClick={() => {
                  const stations = RADIO_STATIONS;
                  const curIdx = stations.findIndex(s => s.id === radioState.stationId);
                  const nextIdx = (curIdx + 1) % stations.length;
                  globalRadioManager.tuneInStation(stations[nextIdx].id, undefined, true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-600 transition text-xs font-semibold cursor-pointer"
                title="Przełącz na kolejną stację radiową 24/7"
              >
                <RadioIcon className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Stacja:</span>
                <span className="font-bold text-amber-300">{stationMeta?.badge}</span>
              </button>

              {/* Wycisz / Odcisz podsłuch */}
              <button
                onClick={() => globalRadioManager.toggleMute()}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm active:scale-95 ${
                  radioState.isMuted
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white ring-1 ring-red-400'
                }`}
                title={radioState.isMuted ? 'Odcisz głośnik podsłuchu' : 'Wycisz podsłuch'}
              >
                {radioState.isMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Odcisz</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                    <span>Wycisz</span>
                  </>
                )}
              </button>

              {/* Wyłącz podsłuch radia */}
              <button
                onClick={handleStop}
                className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-500/40 transition cursor-pointer"
                title="Zatrzymaj podsłuch"
              >
                <Square className="w-3.5 h-3.5 text-red-300 fill-red-400" />
              </button>
            </>
          ) : (
            <>
              {/* Wstecz / Poprzedni Dzień */}
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-amber-950/70 hover:bg-amber-900/80 text-amber-100 border border-amber-500/40 transition-all active:scale-95 cursor-pointer shadow-sm"
                title="Poprzedni dzień"
              >
                <SkipBack className="w-4 h-4 text-amber-300 flex-shrink-0" />
                <span className="text-xs font-semibold hidden md:inline">Wstecz</span>
              </button>

              {/* Odtwórz / Pauza (Play / Pause Toggle) */}
              <button
                onClick={handleTogglePlayPause}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white shadow-xl shadow-amber-900/40 hover:brightness-110 border border-amber-300/50 transition-all active:scale-95 cursor-pointer"
                title={playbackState === 'playing' ? 'Wstrzymaj audycję (Pause)' : 'Rozpocznij/wznów audycję (Play)'}
              >
                {playbackState === 'playing' ? (
                  <>
                    <Pause className="w-4 h-4 text-white fill-current flex-shrink-0" />
                    <span className="text-xs font-bold text-white">Pauza</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-white fill-current translate-x-0.5 flex-shrink-0" />
                    <span className="text-xs font-bold text-white">Odtwórz</span>
                  </>
                )}
              </button>

              {/* Stop */}
              <button
                onClick={handleStop}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-100 border border-red-500/40 transition-all active:scale-95 cursor-pointer shadow-sm"
                title="Zatrzymaj (Stop)"
              >
                <Square className="w-3.5 h-3.5 text-red-300 fill-red-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-red-200 hidden md:inline">Stop</span>
              </button>

              {/* Przód / Następny Dzień */}
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-amber-950/70 hover:bg-amber-900/80 text-amber-100 border border-amber-500/40 transition-all active:scale-95 cursor-pointer shadow-sm"
                title="Następny dzień"
              >
                <span className="text-xs font-semibold hidden md:inline">Przód</span>
                <SkipForward className="w-4 h-4 text-amber-300 flex-shrink-0" />
              </button>
            </>
          )}

          {/* Separator */}
          <div className="h-6 w-px bg-amber-500/30 mx-0.5 hidden sm:block" />

          {/* Tryb Seryjny Toggle (widoczny poza radiem) */}
          {!isRadioActive && (
            <button
              onClick={toggleSerialMode}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl transition-all active:scale-95 cursor-pointer border ${
                serialState.autoNext
                  ? 'bg-amber-500/40 text-amber-200 border-amber-400/60 shadow-inner'
                  : 'bg-amber-950/40 text-amber-300/70 border-amber-500/20 hover:text-amber-200'
              }`}
              title={serialState.autoNext ? 'Tryb seryjny WŁĄCZONY (Czyta automatycznie dzień po dniu)' : 'Włącz ciągły tryb seryjny'}
            >
              <Headphones className="w-4 h-4 text-amber-300 flex-shrink-0" />
              <span className="text-[11px] font-semibold hidden lg:inline">Seryjnie</span>
            </button>
          )}

          {/* Ustawienia Głosowe (Lektor Settings) */}
          <button
            onClick={onOpenLectorModal}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 border border-amber-500/30 transition-all active:scale-95 cursor-pointer"
            title="Ustawienia lektora (Głosy męskie/żeńskie, szybkość, ton)"
          >
            <Settings className="w-4 h-4 text-amber-300 flex-shrink-0" />
            <span className="text-[11px] font-semibold hidden lg:inline">Głos</span>
          </button>

          {/* Desktop Minimize Button */}
          <button
            onClick={() => setIsMinimized(true)}
            className="hidden sm:block p-1.5 rounded-lg text-amber-300/60 hover:text-white hover:bg-white/10 transition-colors ml-0.5"
            title="Zminimalizuj odtwarzacz"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
