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
  Volume2
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

interface Props {
  currentDate: CycleDate;
  activeSection: SectionMeta;
  displayedEntry: SectionEntry;
  onNextDay: () => void;
  onPrevDay: () => void;
  onOpenLectorModal: () => void;
  currentLang?: string;
}

export const FloatingAudioPlayer: React.FC<Props> = ({
  currentDate,
  activeSection,
  displayedEntry,
  onNextDay,
  onPrevDay,
  onOpenLectorModal,
  currentLang = 'pl'
}) => {
  const [playbackState, setPlaybackState] = useState<LectorPlaybackState>(() => getLectorPlaybackState());
  const [serialState, setSerialState] = useState<SerialLectorState>(() => getSerialLectorState());
  const [isMinimized, setIsMinimized] = useState(false);

  // Sync state on custom events
  useEffect(() => {
    const handleStateChange = () => {
      setPlaybackState(getLectorPlaybackState());
    };
    const handleSerialChange = (e: any) => {
      setSerialState(e.detail || getSerialLectorState());
    };

    window.addEventListener('drogowskazy_lector_state_changed', handleStateChange);
    window.addEventListener('drogowskazy_serial_lector_updated', handleSerialChange);

    return () => {
      window.removeEventListener('drogowskazy_lector_state_changed', handleStateChange);
      window.removeEventListener('drogowskazy_serial_lector_updated', handleSerialChange);
    };
  }, []);

  // Show player if playing, paused, or serial lector is active
  const isVisible = playbackState !== 'idle' || serialState.isActive;

  if (!isVisible) {
    return null;
  }

  const handleTogglePlayPause = () => {
    if (playbackState === 'playing') {
      pauseLectorSpeech();
    } else if (playbackState === 'paused') {
      resumeLectorSpeech();
    } else {
      // Idle -> start reading current entry
      triggerPlayCurrentEntry();
    }
  };

  const handleStop = () => {
    stopLectorSpeech();
    saveSerialLectorState({ isActive: false });
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
            triggerPlayCurrentEntry();
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
    onPrevDay();
    if (playbackState === 'playing') {
      setTimeout(() => {
        triggerPlayCurrentEntry();
      }, 300);
    }
  };

  const handleNext = () => {
    onNextDay();
    if (playbackState === 'playing') {
      setTimeout(() => {
        triggerPlayCurrentEntry();
      }, 300);
    }
  };

  const toggleSerialMode = () => {
    const updated = !serialState.autoNext;
    saveSerialLectorState({ autoNext: updated });
  };

  const activeTitle = serialState.lastTitle || displayedEntry.title || 'Mówca Droga365';

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-bounce-short">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-white rounded-full shadow-2xl hover:scale-105 transition-all border border-amber-400/40 cursor-pointer"
          title="Rozwiń odtwarzacz lektora"
        >
          <Volume2 className="w-5 h-5 text-amber-300 animate-pulse" />
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
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-xl animate-fade-in-up">
      <div className="bg-[#1a1614]/95 dark:bg-[#0c121e]/95 backdrop-blur-xl border border-amber-500/30 text-amber-50 rounded-2xl shadow-2xl p-3 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Info Area */}
        <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
          <div className="relative flex-shrink-0">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-800 flex items-center justify-center shadow-inner border border-amber-300/30 ${playbackState === 'playing' ? 'animate-pulse' : ''}`}>
              <Volume2 className={`w-5 h-5 text-white ${playbackState === 'playing' ? 'animate-bounce-short' : ''}`} />
            </div>
            {playbackState === 'playing' && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {activeSection.name}
              </span>
              <span className="text-[11px] text-amber-200/70 font-medium">
                Dzień {currentDate.dayNumber} z 366
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-semibold truncate text-white mt-0.5">
              {activeTitle}
            </h4>
          </div>

          {/* Minimize button for mobile top-right */}
          <button
            onClick={() => setIsMinimized(true)}
            className="sm:hidden p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Zminimalizuj"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Player Controls */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          {/* Wstecz / Previous Day */}
          <button
            onClick={handlePrev}
            className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-stone-200 hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Poprzedni dzień (Wstecz)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play / Pause Toggle */}
          <button
            onClick={handleTogglePlayPause}
            className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white shadow-lg hover:brightness-110 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
            title={playbackState === 'playing' ? 'Wstrzymaj (Pause)' : 'Odtwórz (Play)'}
          >
            {playbackState === 'playing' ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Stop */}
          <button
            onClick={handleStop}
            className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-stone-200 hover:text-red-400 transition-all active:scale-95 cursor-pointer"
            title="Zatrzymaj (Stop)"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          {/* Przód / Next Day */}
          <button
            onClick={handleNext}
            className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-stone-200 hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Następny dzień (Przód)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-white/15 mx-1" />

          {/* Serial Lector Mode Toggle */}
          <button
            onClick={toggleSerialMode}
            className={`p-2 sm:p-2.5 rounded-xl transition-all active:scale-95 cursor-pointer ${
              serialState.autoNext
                ? 'bg-amber-500/30 text-amber-300 border border-amber-400/40 shadow-sm'
                : 'bg-white/5 text-stone-400 hover:text-stone-200'
            }`}
            title={serialState.autoNext ? 'Tryb seryjny włączony (Automatyczne odtwarzanie kolejnych dni)' : 'Włącz tryb seryjny'}
          >
            <Headphones className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenLectorModal}
            className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-stone-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Ustawienia głosu lektora"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Desktop Minimize Button */}
          <button
            onClick={() => setIsMinimized(true)}
            className="hidden sm:block p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
            title="Zminimalizuj odtwarzacz"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
