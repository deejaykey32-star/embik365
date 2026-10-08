import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  BookOpen, 
  Sparkles, 
  Flame, 
  RotateCcw, 
  Check, 
  Volume2, 
  Video,
  Info
} from 'lucide-react';

export interface RosaryDecadeProgressTrackerProps {
  /** Czy krok wprowadzający (Rozważanie i Ojcze nasz) został ukończony */
  isIntroDone?: boolean;
  /** Tablica lub Record oznaczająca ukończone paciorki dziesiątka 1..10 */
  completedBeads?: Record<number, boolean> | number[];
  /** Czy modlitwy końcowe (Chwała Ojcu i O mój Jezu) zostały ukończone */
  isConclusionDone?: boolean;
  
  /** Aktualnie aktywny/czytany krok */
  activeStep?: 'intro' | number | 'conclusion' | null;

  /** 10 wstawek / dopowiedzeń po słowie Jezus */
  dopowiedzenia?: string[];
  /** Tytuł tajemnicy */
  mysteryTitle?: string;
  /** Tytuł etapu / podtytuł */
  stageTitle?: string;

  /** Callbacks przy kliknięciu */
  onSelectIntro?: () => void;
  onSelectBead?: (beadNum: number) => void;
  onSelectConclusion?: () => void;
  onResetProgress?: () => void;
  onMarkAllDecade?: () => void;
  onOpenVideoExport?: () => void;

  theme?: string;
  className?: string;
  showVideoExportBtn?: boolean;
}

export const RosaryDecadeProgressTracker: React.FC<RosaryDecadeProgressTrackerProps> = ({
  isIntroDone = false,
  completedBeads = {},
  isConclusionDone = false,
  activeStep = null,
  dopowiedzenia = [],
  mysteryTitle,
  stageTitle,
  onSelectIntro,
  onSelectBead,
  onSelectConclusion,
  onResetProgress,
  onMarkAllDecade,
  onOpenVideoExport,
  theme = 'light',
  className = '',
  showVideoExportBtn = true
}) => {
  // Sprawdzenie czy dany paciorek jest ukończony
  const isBeadCompleted = (num: number): boolean => {
    if (Array.isArray(completedBeads)) {
      return completedBeads.includes(num);
    }
    return !!completedBeads[num];
  };

  // Liczba ukończonych małych paciorków (0..10)
  const completedSmallCount = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(isBeadCompleted).length;
  // Całkowity postęp (z 12 elementów: 1 duży + 10 małych + 1 duży)
  const totalElementsDone = (isIntroDone ? 1 : 0) + completedSmallCount + (isConclusionDone ? 1 : 0);
  const totalProgressPercent = Math.round((totalElementsDone / 12) * 100);

  // Stan podglądu wybranego paciorka (dla tooltipu / info boxu)
  const [hoveredBead, setHoveredBead] = useState<'intro' | number | 'conclusion' | null>(null);

  const currentDisplayStep = hoveredBead || activeStep || (
    !isIntroDone ? 'intro' : 
    completedSmallCount < 10 ? (completedSmallCount + 1) : 
    !isConclusionDone ? 'conclusion' : 'intro'
  );

  return (
    <div className={`p-5 sm:p-7 rounded-3xl border transition-all duration-300 shadow-sm ${
      theme === 'dark'
        ? 'bg-gradient-to-b from-[#131b29] via-[#0f1622] to-[#0a0f18] border-[#24334a] text-[#f1f5f9]'
        : 'bg-gradient-to-b from-[#fdfbf7] via-[#faf6ee] to-[#f4eee1] border-[#e2d5c3] text-[#2c2217]'
    } ${className}`}>
      
      {/* 1. Górny nagłówek z etykietą, tytułem i przyciskami narzędziowymi */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-amber-500/20">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-600/15 text-amber-800 dark:text-amber-300 border border-amber-600/30 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>Wizualizacja postępu dziesiątka</span>
            </span>
            <span className="text-xs font-semibold text-amber-900/80 dark:text-amber-200/80">
              Ukończono {totalElementsDone} z 12 paciorków ({totalProgressPercent}%)
            </span>
          </div>

          <h3 className="font-heading-cinzel text-base sm:text-lg font-bold text-[#2a2016] dark:text-[#f8fafc] truncate">
            {mysteryTitle || 'Dziesiątek Różańca Historii Zbawienia'}
          </h3>
          {stageTitle && (
            <p className="text-xs text-[#6e5d4e] dark:text-[#94a3b8] font-serif-book truncate">
              {stageTitle}
            </p>
          )}
        </div>

        {/* Przyciski akcji: Reset, Zaznacz wszystkie, Eksport wideo MP4 */}
        <div className="flex items-center gap-2 flex-wrap">
          {onMarkAllDecade && (
            <button
              type="button"
              onClick={onMarkAllDecade}
              className="px-2.5 py-1.5 rounded-xl bg-amber-600/15 hover:bg-amber-600/25 text-amber-900 dark:text-amber-300 text-xs font-bold border border-amber-500/30 transition cursor-pointer flex items-center gap-1 shadow-xs"
              title="Oznacz całą dziesiątkę jako odmówioną"
            >
              <Check className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Zaznacz 10</span>
            </button>
          )}

          {onResetProgress && (
            <button
              type="button"
              onClick={onResetProgress}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white dark:bg-[#1a2333] hover:bg-[#ebdccf] dark:hover:bg-[#25334a] text-stone-700 dark:text-stone-300 text-xs font-semibold border border-[#d6c7b6] dark:border-[#2b3a50] transition cursor-pointer flex items-center gap-1 shadow-xs"
              title="Resetuj postęp odznaczonych paciorków"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {showVideoExportBtn && onOpenVideoExport && (
            <button
              type="button"
              onClick={onOpenVideoExport}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer flex items-center gap-1.5"
              title="Generuj plik wideo MP4 na YouTube z lektorem AI i podświetlaniem słów"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Wideo MP4</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. GŁÓWNA LINIA PACIORKÓW: DUŻY (ROZWAŻANIE + OJCZE NASZ) + 10 MAŁYCH + DUŻY (CHWAŁA + FATIMA) */}
      <div className="relative py-4 px-2 sm:px-4">
        
        {/* Szyna łącząca paciorki (Różaniec / Sznur modlitewny) */}
        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-gradient-to-r from-amber-600/30 via-amber-500/40 to-amber-600/30 dark:from-amber-500/20 dark:via-amber-400/30 dark:to-amber-500/20 rounded-full -z-0 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-1.5 sm:gap-3 flex-nowrap overflow-x-auto py-2 px-1 scrollbar-none">
          
          {/* PACIOREK 1 (DUŻY): Rozważanie i Ojcze nasz */}
          <div className="flex flex-col items-center shrink-0">
            <button
              type="button"
              onClick={onSelectIntro}
              onMouseEnter={() => setHoveredBead('intro')}
              onMouseLeave={() => setHoveredBead(null)}
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center transition-all duration-300 cursor-pointer shadow-md ${
                isIntroDone
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white ring-4 ring-emerald-500/30 scale-102'
                  : activeStep === 'intro'
                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white ring-4 ring-amber-400/50 animate-pulse scale-105'
                    : 'bg-white dark:bg-[#1a2333] hover:bg-amber-100/60 dark:hover:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-2 border-amber-600/40 hover:border-amber-600'
              }`}
              title="Duży paciorek: Rozważanie Tajemnicy oraz Modlitwa Pańska (Ojcze nasz)"
              aria-label="Duży paciorek: Rozważanie i Ojcze nasz"
            >
              {isIntroDone ? (
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
              <span className="text-[9px] font-bold tracking-tight uppercase mt-0.5">
                I
              </span>
            </button>
            <span className="mt-1.5 text-[10px] sm:text-[11px] font-bold text-center text-[#4a3a2b] dark:text-amber-300 max-w-[80px] leading-tight">
              Rozważanie & Ojcze nasz
            </span>
          </div>

          {/* Łącznik dekoracyjny */}
          <div className="h-0.5 w-2 sm:w-3 bg-amber-600/40 shrink-0" />

          {/* 10 MAŁYCH PACIORKÓW (Zdrowaś Maryjo ze wstawką po słowie Jezus) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
              const isDone = isBeadCompleted(num);
              const isActive = activeStep === num;
              const dop = dopowiedzenia[num - 1] || `Dopowiedzenie #${num}`;

              return (
                <div key={num} className="flex flex-col items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectBead && onSelectBead(num)}
                    onMouseEnter={() => setHoveredBead(num)}
                    onMouseLeave={() => setHoveredBead(null)}
                    className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 cursor-pointer shadow-xs ${
                      isDone
                        ? 'bg-amber-600 dark:bg-amber-500 text-white ring-2 ring-amber-600/40'
                        : isActive
                          ? 'bg-amber-500 text-white ring-4 ring-amber-400/60 scale-110 animate-pulse'
                          : 'bg-white dark:bg-[#151e2c] hover:bg-amber-100 dark:hover:bg-[#202d42] text-stone-700 dark:text-stone-300 border border-[#d6c7b6] dark:border-[#2b3a50] hover:border-amber-500'
                    }`}
                    title={`Paciorek #${num} z 10: Zdrowaś Maryjo ze wstawką: „${dop}”`}
                    aria-label={`Paciorek ${num} z 10: Zdrowaś Maryjo ze wstawką`}
                  >
                    {isDone ? (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <span>{num}</span>
                    )}
                  </button>
                  <span className="mt-1 text-[9px] font-semibold text-stone-500 dark:text-stone-400">
                    #{num}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Łącznik dekoracyjny */}
          <div className="h-0.5 w-2 sm:w-3 bg-amber-600/40 shrink-0" />

          {/* PACIOREK 2 (DUŻY): Chwała Ojcu i O mój Jezu */}
          <div className="flex flex-col items-center shrink-0">
            <button
              type="button"
              onClick={onSelectConclusion}
              onMouseEnter={() => setHoveredBead('conclusion')}
              onMouseLeave={() => setHoveredBead(null)}
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center transition-all duration-300 cursor-pointer shadow-md ${
                isConclusionDone
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white ring-4 ring-emerald-500/30 scale-102'
                  : activeStep === 'conclusion'
                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white ring-4 ring-amber-400/50 animate-pulse scale-105'
                    : 'bg-white dark:bg-[#1a2333] hover:bg-amber-100/60 dark:hover:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-2 border-amber-600/40 hover:border-amber-600'
              }`}
              title="Kolejny duży paciorek: Modlitwa Uwielbienia (Chwała Ojcu) oraz Modlitwa Fatimska (O mój Jezu)"
              aria-label="Duży paciorek: Chwała Ojcu i O mój Jezu"
            >
              {isConclusionDone ? (
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
              )}
              <span className="text-[9px] font-bold tracking-tight uppercase mt-0.5">
                II
              </span>
            </button>
            <span className="mt-1.5 text-[10px] sm:text-[11px] font-bold text-center text-[#4a3a2b] dark:text-amber-300 max-w-[80px] leading-tight">
              Chwała Ojcu & O mój Jezu
            </span>
          </div>

        </div>
      </div>

      {/* 3. DYNAMICZNA KARTA INFORMACYJNA DLA AKTYWNEGO / WSKAZANEGO PACIORKA */}
      <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-white/80 dark:bg-[#121927]/90 border border-amber-500/25 shadow-xs transition-all">
        {currentDisplayStep === 'intro' ? (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600/15 border border-amber-600/30 flex items-center justify-center text-amber-800 dark:text-amber-300 shrink-0 mt-0.5">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  Duży Paciorek I • Krok Początkowy
                </span>
                <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                  isIntroDone ? 'bg-emerald-600/20 text-emerald-800 dark:text-emerald-300' : 'bg-amber-500/20 text-amber-900 dark:text-amber-300'
                }`}>
                  {isIntroDone ? 'Odmówione ✓' : 'W trakcie / do odmówienia'}
                </span>
              </div>
              <h4 className="font-heading-cinzel font-bold text-sm sm:text-base text-[#2e2318] dark:text-white mt-0.5">
                Rozważanie Tajemnicy & Modlitwa Pańska (Ojcze nasz)
              </h4>
              <p className="text-xs text-[#6e5d4e] dark:text-[#94a3b8] font-serif-book mt-0.5">
                Pismo Święte, treść rozważania oraz modlitwa Ojcze nasz na dużym paciorku.
              </p>
            </div>
          </div>
        ) : typeof currentDisplayStep === 'number' ? (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-600/40 flex items-center justify-center text-amber-800 dark:text-amber-300 shrink-0 font-bold text-sm mt-0.5">
              #{currentDisplayStep}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  Paciorek #{currentDisplayStep} z 10 • Zdrowaś Maryjo
                </span>
                <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                  isBeadCompleted(currentDisplayStep) ? 'bg-emerald-600/20 text-emerald-800 dark:text-emerald-300' : 'bg-amber-500/20 text-amber-900 dark:text-amber-300'
                }`}>
                  {isBeadCompleted(currentDisplayStep) ? 'Odmówione ✓' : 'W trakcie / do odmówienia'}
                </span>
              </div>
              <div className="font-serif-book text-xs sm:text-sm text-[#2e2318] dark:text-[#f1f5f9] mt-1 leading-relaxed">
                <span className="text-stone-500 dark:text-stone-400">…owoc żywota Twojego, Jezus, </span>
                <span className="font-bold text-amber-900 dark:text-amber-300 bg-amber-500/15 dark:bg-amber-500/25 px-2 py-0.5 rounded-lg border border-amber-500/30">
                  „{dopowiedzenia[currentDisplayStep - 1] || 'wstawka po słowie Jezus'}”
                </span>
                <span className="text-stone-500 dark:text-stone-400"> …Święta Maryjo, Matko Boża…</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600/15 border border-amber-600/30 flex items-center justify-center text-amber-800 dark:text-amber-300 shrink-0 mt-0.5">
              <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  Duży Paciorek II • Zakończenie Dziesiątka
                </span>
                <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                  isConclusionDone ? 'bg-emerald-600/20 text-emerald-800 dark:text-emerald-300' : 'bg-amber-500/20 text-amber-900 dark:text-amber-300'
                }`}>
                  {isConclusionDone ? 'Odmówione ✓' : 'W trakcie / do odmówienia'}
                </span>
              </div>
              <h4 className="font-heading-cinzel font-bold text-sm sm:text-base text-[#2e2318] dark:text-white mt-0.5">
                Modlitwa Uwielbienia (Chwała Ojcu) & Modlitwa Fatimska (O mój Jezu)
              </h4>
              <p className="text-xs text-[#6e5d4e] dark:text-[#94a3b8] font-serif-book mt-0.5">
                Chwała Ojcu i Synowi, i Duchowi Świętemu… oraz O mój Jezu, przebacz nam nasze grzechy…
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
