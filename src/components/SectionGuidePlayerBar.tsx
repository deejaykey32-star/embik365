import React, { useState, useEffect } from 'react';
import { 
  Headphones, 
  Volume2, 
  VolumeX, 
  Play, 
  Square, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  CheckCircle2,
  Info
} from 'lucide-react';
import { 
  getSectionGuide, 
  playSectionGuideLector, 
  stopSectionGuideLector, 
  isSectionGuidePlaying,
  getActiveGuideSectionId
} from '../utils/sectionGuideService';
import { 
  getLectorPlaybackState, 
  LectorPlaybackState,
  pauseLectorSpeech,
  resumeLectorSpeech
} from '../utils/audioLectorService';

interface Props {
  sectionId: string;
  onOpenLectorModal?: () => void;
  currentLang?: string;
  variant?: 'banner' | 'compact' | 'card' | 'inline';
  className?: string;
}

export const SectionGuidePlayerBar: React.FC<Props> = ({
  sectionId,
  onOpenLectorModal,
  currentLang = 'pl',
  variant = 'banner',
  className = ''
}) => {
  const guide = getSectionGuide(sectionId);
  const [isPlaying, setIsPlaying] = useState<boolean>(() => isSectionGuidePlaying(sectionId));
  const [playbackState, setPlaybackState] = useState<LectorPlaybackState>(() => getLectorPlaybackState());
  const [showFullText, setShowFullText] = useState(false);

  useEffect(() => {
    const handleGuideChange = (e: any) => {
      const activeId = e.detail?.sectionId;
      setIsPlaying(activeId === guide.id);
      setPlaybackState(getLectorPlaybackState());
    };

    const handleLectorStateChange = () => {
      setPlaybackState(getLectorPlaybackState());
      const activeId = getActiveGuideSectionId();
      setIsPlaying(activeId === guide.id && (getLectorPlaybackState() === 'playing' || getLectorPlaybackState() === 'paused'));
    };

    window.addEventListener('drogowskazy_section_guide_changed', handleGuideChange);
    window.addEventListener('drogowskazy_lector_state_changed', handleLectorStateChange);

    return () => {
      window.removeEventListener('drogowskazy_section_guide_changed', handleGuideChange);
      window.removeEventListener('drogowskazy_lector_state_changed', handleLectorStateChange);
    };
  }, [guide.id]);

  const handleTogglePlay = async () => {
    if (isPlaying) {
      if (playbackState === 'playing') {
        pauseLectorSpeech();
      } else if (playbackState === 'paused') {
        resumeLectorSpeech();
      } else {
        stopSectionGuideLector();
        setIsPlaying(false);
      }
      return;
    }

    setIsPlaying(true);
    await playSectionGuideLector(
      sectionId, 
      currentLang,
      () => setIsPlaying(true),
      () => setIsPlaying(false)
    );
  };

  const handleStop = () => {
    stopSectionGuideLector();
    setIsPlaying(false);
  };

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <button
          onClick={handleTogglePlay}
          id={`btn-guide-compact-${sectionId}`}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
            isPlaying && playbackState === 'playing'
              ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
              : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white'
          }`}
          title="Odsłuchaj przewodnika audio lektorem online"
        >
          {isPlaying && playbackState === 'playing' ? (
            <>
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Zatrzymaj Lektora AI</span>
            </>
          ) : (
            <>
              <Headphones className="w-3.5 h-3.5" />
              <span>Lektor AI • Przewodnik</span>
            </>
          )}
        </button>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={handleTogglePlay}
        id={`btn-guide-inline-${sectionId}`}
        className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
          isPlaying && playbackState === 'playing'
            ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400/40'
            : 'bg-amber-600 hover:bg-amber-500 text-white'
        } ${className}`}
        title="Włącz lektora AI online z przewodnikiem po tej sekcji"
      >
        {isPlaying && playbackState === 'playing' ? (
          <>
            <Square className="w-3.5 h-3.5 fill-white animate-pulse" />
            <span>Zatrzymaj Lektora AI</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5" />
            <span>Lektor AI (Online)</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-900/10 via-amber-800/5 to-purple-900/10 dark:from-[#171f2e] dark:via-[#141b27] dark:to-[#1a1c2e] border border-amber-500/30 shadow-md p-4 sm:p-5 transition-all ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left column: icon, badges and description */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-transform duration-300 ${
            isPlaying && playbackState === 'playing'
              ? 'bg-rose-600 text-white animate-bounce'
              : 'bg-gradient-to-br from-amber-600 to-amber-800 text-white'
          }`}>
            <Headphones className="w-5 h-5 text-amber-200" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30">
                {guide.badge}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                Głos Online AI (Płynny)
              </span>
              {isPlaying && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                  {playbackState === 'playing' ? 'ODTWARZANIE' : 'PAUZA'}
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-bold text-[#2a221b] dark:text-[#f3e8d2] truncate">
              {guide.title}
            </h3>
            <p className="text-xs text-[#735e4b] dark:text-[#94a3b8] line-clamp-1">
              {guide.subtitle}
            </p>
          </div>
        </div>

        {/* Right column: Action buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 justify-start sm:justify-end">
          <button
            onClick={handleTogglePlay}
            id={`btn-guide-play-${sectionId}`}
            className={`px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer ${
              isPlaying && playbackState === 'playing'
                ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-300 dark:ring-rose-900'
                : 'bg-gradient-to-r from-amber-600 via-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-amber-900/20'
            }`}
          >
            {isPlaying && playbackState === 'playing' ? (
              <>
                <Square className="w-4 h-4 fill-white" />
                <span>Zatrzymaj Lektora AI</span>
              </>
            ) : isPlaying && playbackState === 'paused' ? (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Wznów Lektora</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>Posłuchaj Lektora AI</span>
              </>
            )}
          </button>

          {isPlaying && (
            <button
              onClick={handleStop}
              className="p-2 sm:p-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700 cursor-pointer transition"
              title="Wyłącz lektora"
            >
              <Square className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setShowFullText(v => !v)}
            className="px-3 py-2 sm:py-2.5 rounded-xl bg-white/80 dark:bg-[#1a2333] hover:bg-white dark:hover:bg-[#202b3f] text-[#4d3d2e] dark:text-[#cbd5e1] border border-[#d6c7b5] dark:border-[#2a374f] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Pokaż pełny tekst skryptu przewodnika"
          >
            {showFullText ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ukryj tekst</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tekst przewodnika</span>
              </>
            )}
          </button>

          {onOpenLectorModal && (
            <button
              onClick={onOpenLectorModal}
              className="p-2 sm:p-2.5 rounded-xl bg-white/80 dark:bg-[#1a2333] hover:bg-white dark:hover:bg-[#202b3f] text-[#4d3d2e] dark:text-amber-300 border border-[#d6c7b5] dark:border-[#2a374f] text-xs transition cursor-pointer"
              title="Ustawienia głosu lektora (Głosy Online AI)"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable text preview */}
      {showFullText && (
        <div className="mt-4 pt-4 border-t border-amber-500/20 text-xs sm:text-sm text-[#3d3127] dark:text-[#d1d5db] leading-relaxed max-h-64 overflow-y-auto whitespace-pre-line p-3 bg-white/60 dark:bg-black/30 rounded-xl border border-amber-500/10">
          {guide.script}
        </div>
      )}
    </div>
  );
};
