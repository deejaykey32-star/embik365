import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  ListOrdered, 
  Bookmark, 
  Volume2, 
  VolumeX, 
  Calendar,
  FileText,
  Type,
  Download,
  Globe,
  Sparkles,
  X,
  ZoomIn,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { SectionMeta, CycleDate, SectionEntry, UploadedPdf, SUPPORTED_LANGUAGES } from '../types';
import { CYCLE_DAYS, getCycleDateByDayNumber } from '../utils/dateCycle';
import { DigitalRosary } from './DigitalRosary';
import { playLectorSpeech, stopLectorSpeech, getLectorConfig, unlockMobileAudio } from '../utils/audioLectorService';

interface Props {
  section: SectionMeta;
  currentDate: CycleDate;
  entry: SectionEntry;
  onSelectDate: (date: CycleDate) => void;
  onOpenCalendar: () => void;
  onOpenPdf: (pdf: UploadedPdf) => void;
  sectionPdfs: UploadedPdf[];
  onOpenDownloadModal?: () => void;
  onOpenLectorModal?: () => void;
  currentLang?: string;
}

export const FlipbookReader: React.FC<Props> = ({
  section,
  currentDate,
  entry,
  onSelectDate,
  onOpenCalendar,
  onOpenPdf,
  sectionPdfs,
  onOpenDownloadModal,
  onOpenLectorModal,
  currentLang = 'pl'
}) => {
  const [currentPage, setCurrentPage] = useState<number>(currentDate.dayNumber);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const [showToc, setShowToc] = useState<boolean>(false);
  const [theme, setTheme] = useState<'parchment' | 'ivory' | 'dark'>('parchment');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [bookmarkedDays, setBookmarkedDays] = useState<number[]>([]);
  const [isRosaryModalOpen, setIsRosaryModalOpen] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isFullscreenZoom, setIsFullscreenZoom] = useState<boolean>(false);

  // Determine if this section is an E-book / Flipbook
  const isEbook = section.id.startsWith('ebook_') || section.type === 'flipbook' || section.name.toLowerCase().includes('ebook') || section.id === 'bio365';

  const toggleSpeech = async (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    unlockMobileAudio();

    if (isSpeaking) {
      stopLectorSpeech();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${entry.title}. ${entry.content.replace(/<[^>]*>/g, '')}. ${entry.prayer ? 'Modlitwa: ' + entry.prayer.replace(/<[^>]*>/g, '') : ''}`;
    const lectorCfg = getLectorConfig();

    await playLectorSpeech({
      text: textToSpeak,
      config: lectorCfg,
      overrideLang: currentLang,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  // Sync with currentDate prop
  useEffect(() => {
    setCurrentPage(currentDate.dayNumber);
  }, [currentDate.dayNumber]);

  // Load bookmarks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('drogowskazy_bookmarks');
      if (saved) setBookmarkedDays(JSON.parse(saved));
    } catch {}
  }, []);

  const isBookmarked = bookmarkedDays.includes(currentPage);

  // Play page flip sound via Web Audio API
  const playPageFlipSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Soft paper rustle sound
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // Audio context might be restricted
    }
  };

  const handleTurnNext = () => {
    if (currentPage >= 365 || isFlipping) return;
    setIsFlipping(true);
    setFlipDirection('next');
    playPageFlipSound();

    setTimeout(() => {
      const nextDay = currentPage + 1;
      const targetDate = getCycleDateByDayNumber(nextDay);
      onSelectDate(targetDate);
      setIsFlipping(false);
    }, 280);
  };

  const handleTurnPrev = () => {
    if (currentPage <= 1 || isFlipping) return;
    setIsFlipping(true);
    setFlipDirection('prev');
    playPageFlipSound();

    setTimeout(() => {
      const prevDay = currentPage - 1;
      const targetDate = getCycleDateByDayNumber(prevDay);
      onSelectDate(targetDate);
      setIsFlipping(false);
    }, 280);
  };

  // Keyboard navigation & ESC key handler for Fullscreen zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreenZoom) {
        setIsFullscreenZoom(false);
        return;
      }
      if (e.key === 'ArrowRight') handleTurnNext();
      if (e.key === 'ArrowLeft') handleTurnPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, isFlipping, isFullscreenZoom]);

  const toggleBookmark = () => {
    const updated = isBookmarked
      ? bookmarkedDays.filter(d => d !== currentPage)
      : [...bookmarkedDays, currentPage];
    setBookmarkedDays(updated);
    try {
      localStorage.setItem('drogowskazy_bookmarks', JSON.stringify(updated));
    } catch {}
  };

  // Theme styling
  const getThemeStyles = () => {
    switch (theme) {
      case 'ivory':
        return {
          wrapper: 'bg-[#f5efe6] dark:bg-[#0a0e17]',
          pageLeft: 'bg-[#faf8f5] dark:bg-[#161c27] text-[#2c2621] dark:text-[#e2e8f0] border-[#ded5c7] dark:border-[#222d3e]',
          pageRight: 'bg-[#fffdfa] dark:bg-[#131722] text-[#2c2621] dark:text-[#e2e8f0] border-[#ded5c7] dark:border-[#222d3e]',
          spine: 'bg-gradient-to-r from-[#e0d6c7] via-[#f7f2ea] to-[#e0d6c7]',
          accent: 'text-[#82542a] dark:text-amber-400'
        };
      case 'dark':
        return {
          wrapper: 'bg-[#1c1815] dark:bg-[#070a10]',
          pageLeft: 'bg-[#29221b] dark:bg-[#161c28] text-[#e8dfd5] dark:text-[#e2e8f0] border-[#3f352c] dark:border-[#253245]',
          pageRight: 'bg-[#251f19] dark:bg-[#121622] text-[#e8dfd5] dark:text-[#e2e8f0] border-[#3f352c] dark:border-[#253245]',
          spine: 'bg-gradient-to-r from-[#171310] via-[#352c23] to-[#171310]',
          accent: 'text-[#e5a86d] dark:text-amber-400'
        };
      case 'parchment':
      default:
        return {
          wrapper: 'bg-[#ede5d8] dark:bg-[#090d15]',
          pageLeft: 'bg-[#f7f1e6] dark:bg-[#161c27] text-[#2f271f] dark:text-[#e2e8f0] border-[#d8cbb9] dark:border-[#253245]',
          pageRight: 'bg-[#faf5eb] dark:bg-[#121622] text-[#2f271f] dark:text-[#e2e8f0] border-[#d8cbb9] dark:border-[#253245]',
          spine: 'bg-gradient-to-r from-[#c9bba8] via-[#ebe2d3] to-[#c9bba8]',
          accent: 'text-[#875529] dark:text-amber-400'
        };
    }
  };

  const currentTheme = getThemeStyles();

  // Find PDFs attached to this section or this specific day
  const matchingPdfs = sectionPdfs.filter(
    p => p.sectionId === section.id && (!p.dateKey || p.dateKey === currentDate.dateKey)
  );

  // PDF Page Numbering corresponding to 1000+ total pages PDF document
  const pdfLeftPageNum = (currentPage - 1) * 3 + 1;
  const pdfRightPageNum = (currentPage - 1) * 3 + 2;

  return (
    <div className={`min-h-[calc(100vh-140px)] ${currentTheme.wrapper} transition-colors duration-300 py-6 px-3 sm:px-6 flex flex-col justify-between`}>
      {/* Flipbook Header Controls */}
      <div className="max-w-5xl mx-auto w-full mb-4 flex flex-wrap items-center justify-between gap-3 bg-white/80 dark:bg-[#121722]/90 backdrop-blur-md p-3 rounded-2xl border border-[#dbcabb] dark:border-[#212b3c] shadow-xs">
        {/* Book Title & Section Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#443324] dark:bg-amber-600 text-amber-300 dark:text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading-cinzel font-bold text-sm sm:text-base text-[#281e15] dark:text-[#f1f5f9]">
                {section.name}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800/60">
                {isEbook ? 'E-Book PDF (1000+ Stron)' : 'Księga 3D'}
              </span>
            </div>
            <p className="text-xs text-[#716152] dark:text-[#94a3b8] font-serif-book">
              {section.shortTitle} • Dzień {currentPage} z 365 (Strony PDF {pdfLeftPageNum}-{pdfRightPageNum} z 1095)
            </p>
          </div>
        </div>

        {/* Action controls: Fullscreen Zoom, Download, TOC, Font size, Sound, Bookmarks, Theme */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Fullscreen Trigger */}
          <button
            onClick={() => setIsFullscreenZoom(true)}
            id="btn-flipbook-zoom"
            className="px-2.5 py-1.5 rounded-xl bg-amber-600 text-white hover:bg-amber-700 border border-amber-500 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Powiększ E-Book na cały ekran"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Powiększ (Cały ekran)</span>
          </button>

          {/* Download & Publish E-book Button */}
          {onOpenDownloadModal && (
            <button
              onClick={onOpenDownloadModal}
              id="btn-flipbook-download"
              className="px-2.5 py-1.5 rounded-xl bg-amber-600/15 hover:bg-amber-600/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Pobierz E-book (PDF POD, Word DOCX, ePUB)"
            >
              <Download className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden lg:inline">Druk / PDF</span>
            </button>
          )}

          {/* Table of contents toggle */}
          <button
            onClick={() => setShowToc(!showToc)}
            id="btn-flipbook-toc"
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showToc 
                ? 'bg-[#3b2d21] dark:bg-amber-600 text-white' 
                : 'hover:bg-[#ebe0d3] dark:hover:bg-[#1b2333] text-[#4d3d2e] dark:text-[#e2e8f0] border border-[#d8c8b6] dark:border-[#28354a]'
            }`}
            title="Spis treści"
          >
            <ListOrdered className="w-4 h-4" />
            <span className="hidden md:inline">Spis Treści</span>
          </button>

          {/* Bookmark */}
          <button
            onClick={toggleBookmark}
            id="btn-flipbook-bookmark"
            className={`p-2 rounded-xl transition-colors border cursor-pointer ${
              isBookmarked
                ? 'bg-amber-500 text-white border-amber-600 dark:bg-amber-600 dark:border-amber-500'
                : 'hover:bg-[#ebe0d3] dark:hover:bg-[#1b2333] text-[#4d3d2e] dark:text-[#e2e8f0] border-[#d8c8b6] dark:border-[#28354a]'
            }`}
            title={isBookmarked ? 'Usuń zakładkę' : 'Dodaj zakładkę do tej strony'}
          >
            <Bookmark className="w-4 h-4" />
          </button>

          {/* Font size toggle */}
          <button
            onClick={() => {
              const sizes: ('sm' | 'base' | 'lg' | 'xl')[] = ['sm', 'base', 'lg', 'xl'];
              const next = sizes[(sizes.indexOf(fontSize) + 1) % sizes.length];
              setFontSize(next);
            }}
            id="btn-flipbook-fontsize"
            className="p-2 rounded-xl hover:bg-[#ebe0d3] dark:hover:bg-[#1b2333] text-[#4d3d2e] dark:text-[#e2e8f0] border border-[#d8c8b6] dark:border-[#28354a] transition-colors cursor-pointer"
            title="Zmień wielkość czcionki"
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Audio Lector Speech Play / Pause button */}
          <button
            onClick={(e) => toggleSpeech(e)}
            onTouchEnd={(e) => {
              e.preventDefault();
              toggleSpeech(e);
            }}
            id="btn-flipbook-lector-play"
            className={`p-2 rounded-xl transition-colors border text-xs font-semibold flex items-center gap-1 cursor-pointer touch-manipulation ${
              isSpeaking
                ? 'bg-amber-600 text-white border-amber-700 animate-pulse'
                : 'hover:bg-[#ebe0d3] dark:hover:bg-[#1b2333] text-[#4d3d2e] dark:text-[#e2e8f0] border-[#d8c8b6] dark:border-[#28354a]'
            }`}
            title={isSpeaking ? 'Zatrzymaj lektora' : 'Włącz odczytanie kartki na głos (Lektor)'}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-700 dark:text-amber-400" />}
            <span className="hidden lg:inline">{isSpeaking ? 'Głos gra' : 'Lektor'}</span>
          </button>

          {/* Audio Lector Settings Button */}
          {onOpenLectorModal && (
            <button
              onClick={onOpenLectorModal}
              id="btn-flipbook-lector-modal"
              className="p-2 rounded-xl hover:bg-[#ebe0d3] dark:hover:bg-[#1b2333] text-[#4d3d2e] dark:text-[#e2e8f0] border border-[#d8c8b6] dark:border-[#28354a] transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
              title="Ustawienia lektora mowy (Lokalny / Online AI Cloud, Język, Głos)"
            >
              <span>🎧</span>
            </button>
          )}

          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            id="btn-flipbook-sound"
            className="p-2 rounded-xl hover:bg-[#ebe0d3] dark:hover:bg-[#1b2333] text-[#4d3d2e] dark:text-[#e2e8f0] border border-[#d8c8b6] dark:border-[#28354a] transition-colors cursor-pointer"
            title={soundEnabled ? 'Wycisz szelest kartek' : 'Włącz szelest kartek'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> : <VolumeX className="w-4 h-4 text-[#8a7a6b] dark:text-[#94a3b8]" />}
          </button>

          {/* Theme switcher */}
          <div className="flex items-center rounded-xl border border-[#d8c8b6] dark:border-[#28354a] p-0.5 bg-[#f5ecdf] dark:bg-[#18202e]">
            <button
              onClick={() => setTheme('parchment')}
              className={`px-2 py-1 text-[11px] rounded-lg font-medium transition-all cursor-pointer ${
                theme === 'parchment' ? 'bg-[#3b2d21] dark:bg-amber-600 text-white shadow-xs' : 'text-[#615143] dark:text-[#94a3b8]'
              }`}
            >
              Pergamin
            </button>
            <button
              onClick={() => setTheme('ivory')}
              className={`px-2 py-1 text-[11px] rounded-lg font-medium transition-all cursor-pointer ${
                theme === 'ivory' ? 'bg-[#3b2d21] dark:bg-amber-600 text-white shadow-xs' : 'text-[#615143] dark:text-[#94a3b8]'
              }`}
            >
              Kość
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-2 py-1 text-[11px] rounded-lg font-medium transition-all cursor-pointer ${
                theme === 'dark' ? 'bg-[#3b2d21] dark:bg-amber-600 text-white shadow-xs' : 'text-[#615143] dark:text-[#94a3b8]'
              }`}
            >
              Zmierzch
            </button>
          </div>
        </div>
      </div>

      {/* Main Flipbook Stage */}
      <div className="max-w-5xl mx-auto w-full flex-1 flex items-center justify-center relative perspective-1500 py-4">
        {/* Previous page arrow button (left) */}
        <button
          onClick={handleTurnPrev}
          disabled={currentPage <= 1 || isFlipping}
          id="btn-flip-left"
          className="absolute left-0 sm:-left-4 z-30 p-3 rounded-full bg-[#35281e]/90 dark:bg-amber-600/90 text-white shadow-xl hover:bg-[#4d3b2e] dark:hover:bg-amber-500 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          title="Przewróć kartkę w lewo (Poprzedni dzień)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Next page arrow button (right) */}
        <button
          onClick={handleTurnNext}
          disabled={currentPage >= 365 || isFlipping}
          id="btn-flip-right"
          className="absolute right-0 sm:-right-4 z-30 p-3 rounded-full bg-[#35281e]/90 dark:bg-amber-600/90 text-white shadow-xl hover:bg-[#4d3b2e] dark:hover:bg-amber-500 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          title="Przewróć kartkę w prawo (Następny dzień)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* 3D Book Container */}
        <div 
          className={`w-full max-w-4xl min-h-[560px] sm:min-h-[620px] rounded-3xl book-shadow border-4 border-[#3a2c20] dark:border-[#28354c] grid grid-cols-1 md:grid-cols-2 relative overflow-hidden transition-transform duration-300 ${
            isFlipping ? (flipDirection === 'next' ? 'scale-[0.99] rotate-y-2' : 'scale-[0.99] -rotate-y-2') : ''
          }`}
        >
          {/* Left Page (Desktop: Ebook Title-Only Mode or Metadata) */}
          <div 
            onClick={() => setIsFullscreenZoom(true)}
            className={`hidden md:flex flex-col justify-between p-8 sm:p-10 border-r ${currentTheme.pageLeft} relative cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}
            title="Kliknij, aby otworzyć e-book w trybie pełnoekranowym"
          >
            {/* Click hover overlay badge */}
            <div className="absolute inset-0 bg-amber-900/0 group-hover:bg-amber-900/5 transition-all flex items-center justify-center pointer-events-none z-10">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <ZoomIn className="w-4 h-4" /> Kliknij, aby powiększyć na cały ekran
              </span>
            </div>

            {/* Page top header */}
            <div className="border-b border-black/10 dark:border-white/10 pb-3 flex items-center justify-between">
              <span className="font-heading-cinzel text-xs font-bold uppercase tracking-widest text-[#7a6755] dark:text-[#94a3b8]">
                {section.shortTitle}
              </span>
              <span className="font-serif-book text-xs italic text-[#8a7867] dark:text-[#94a3b8]">
                Strona PDF {pdfLeftPageNum} z 1095
              </span>
            </div>

            {/* Left page content: For EBOOK sections, LEFT PAGE HAS ONLY TITLE! */}
            <div className="my-auto py-6 space-y-6 text-center">
              <div className="w-16 h-1 bg-[#8c5a2b] dark:bg-amber-500 rounded-full mx-auto" />
              
              <div className="space-y-3">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest block font-sans-ui">
                  {currentDate.season || 'Cykl Roczny'} • Dzień {currentDate.dayNumber} z 365
                </span>
                
                <h2 className="font-heading-cinzel text-2xl sm:text-3xl font-bold text-[#2d2217] dark:text-[#f1f5f9] leading-tight px-2">
                  {entry.title}
                </h2>

                {entry.subtitle && (
                  <p className="font-serif-book italic text-sm text-[#786655] dark:text-[#94a3b8] max-w-sm mx-auto">
                    {entry.subtitle}
                  </p>
                )}
              </div>

              {/* Ebook Dedication / Subtitle Quote Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 font-serif-book italic text-xs sm:text-sm leading-relaxed text-[#514234] dark:text-[#cbd5e1]">
                {section.id === 'bio365' ? (
                  <p>
                    "Dwa serca złączone przed ołtarzem, jedna droga ku wieczności. W każdym wspólnym dniu odkrywamy na nowo piękno powołania do miłości."
                  </p>
                ) : section.id === 'ebook_rhz' ? (
                  <p>
                    "Przesuwając paciorki różańca, dotykamy tajemnic, które przemieniły losy świata i wciąż przemieniają nasze serca."
                  </p>
                ) : section.id === 'ebook_biblia' ? (
                  <p>
                    "Nie samym chlebem żyje człowiek, lecz każdym słowem, które pochodzi z ust Bożych." (Mt 4, 4)
                  </p>
                ) : (
                  <p>
                    "Widoki na Raj odsłaniają się przed tymi, którzy mają odwagę zaufać Bogu w sprawach najmniejszych."
                  </p>
                )}
              </div>

              {/* Fullscreen Expand CTA Button */}
              <div className="pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFullscreenZoom(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-600/15 hover:bg-amber-600/25 text-amber-900 dark:text-amber-300 font-semibold border border-amber-500/30 text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <ZoomIn className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Rozwiń E-book na cały ekran</span>
                </button>
              </div>

              {/* Rosary Trigger for RHZ eBook */}
              {section.id === 'ebook_rhz' && (
                <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 text-xs text-left">
                  <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <span>Cyfrowy Różaniec RHZ</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsRosaryModalOpen(true);
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors text-center cursor-pointer text-xs"
                  >
                    Otwórz Wizualizację Różańca
                  </button>
                </div>
              )}

              {/* PDF Banner if uploaded */}
              {matchingPdfs.length > 0 && (
                <div className="p-3 rounded-xl bg-red-500/10 dark:bg-red-950/40 border border-red-500/30 text-xs text-left">
                  <div className="font-bold text-red-900 dark:text-red-200 flex items-center gap-1.5 mb-1">
                    <FileText className="w-4 h-4 text-red-700 dark:text-red-400" />
                    <span>Oryginalny Plik PDF</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPdf(matchingPdfs[0]);
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-red-700 hover:bg-red-800 text-white font-medium transition-colors text-center cursor-pointer text-xs"
                  >
                    Otwórz Plik PDF
                  </button>
                </div>
              )}
            </div>

            {/* Left page footer */}
            <div className="border-t border-black/10 dark:border-white/10 pt-3 flex items-center justify-between text-xs text-[#8a7867] dark:text-[#94a3b8]">
              <span>Tom 365 PDF</span>
              <span className="font-serif-book font-bold">Strona {pdfLeftPageNum}</span>
            </div>
          </div>

          {/* Book Spine Shadow in the center (Desktop) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-12 -translate-x-1/2 pointer-events-none book-spine z-20" />

          {/* Right Page (Primary Reading Text & Meditation) */}
          <div 
            onClick={() => setIsFullscreenZoom(true)}
            className={`flex flex-col justify-between p-6 sm:p-10 ${currentTheme.pageRight} relative cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}
            title="Kliknij, aby otworzyć e-book w trybie pełnoekranowym"
          >
            {/* Click hover overlay badge */}
            <div className="absolute inset-0 bg-amber-900/0 group-hover:bg-amber-900/5 transition-all flex items-center justify-center pointer-events-none z-10">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <ZoomIn className="w-4 h-4" /> Kliknij, aby powiększyć na cały ekran
              </span>
            </div>

            {/* Bookmark ribbon */}
            {isBookmarked && (
              <div className="absolute top-0 right-8 z-30 w-6 h-12 bg-amber-600 rounded-b-md shadow-md flex items-end justify-center pb-1">
                <Bookmark className="w-3.5 h-3.5 text-white fill-white" />
              </div>
            )}

            {/* Right page header */}
            <div className="border-b border-black/10 dark:border-white/10 pb-3 flex items-center justify-between">
              <span className="font-serif-book text-xs italic text-[#8a7867] dark:text-[#94a3b8]">
                Strona PDF {pdfRightPageNum} z 1095
              </span>
              <div className="flex items-center gap-2">
                <span className="font-heading-cinzel text-xs font-bold text-[#7a6755] dark:text-amber-400">
                  {currentDate.displayDate}
                </span>
              </div>
            </div>

            {/* Right page main body */}
            <div className="my-auto py-4 overflow-y-auto max-h-[480px] pr-2 space-y-4">
              <div>
                <h2 className="font-heading-cinzel font-bold text-lg sm:text-xl text-[#2c2016] dark:text-[#f3e8d2] leading-snug">
                  {entry.title}
                </h2>
                {entry.subtitle && (
                  <p className="font-serif-book italic text-xs text-[#7d6b5b] dark:text-[#94a3b8] mt-1">
                    {entry.subtitle}
                  </p>
                )}
              </div>

              {/* Main reading content with selected font size */}
              <div className={`font-serif-book leading-relaxed text-[#30261e] dark:text-[#e2e8f0] text-justify ${
                fontSize === 'sm' ? 'text-sm leading-6' :
                fontSize === 'base' ? 'text-base leading-7' :
                fontSize === 'lg' ? 'text-lg leading-8' :
                'text-xl leading-9'
              }`}>
                {/<[a-z][\s\S]*>/i.test(entry.content || '') ? (
                  <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: entry.content }} />
                ) : (
                  <div className="whitespace-pre-line">{entry.content}</div>
                )}
              </div>

              {entry.prayer && (
                <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border-l-3 border-[#8c572b] dark:border-amber-500 font-serif-book italic text-sm text-[#46372a] dark:text-amber-100">
                  <span className="block font-sans-ui not-italic font-bold text-[11px] uppercase tracking-wider text-[#8c572b] dark:text-amber-400 mb-1">
                    Modlitwa serca:
                  </span>
                  {/<[a-z][\s\S]*>/i.test(entry.prayer || '') ? (
                    <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: entry.prayer }} />
                  ) : (
                    <div className="whitespace-pre-line">{entry.prayer}</div>
                  )}
                </div>
              )}
            </div>

            {/* Right page footer */}
            <div className="border-t border-black/10 dark:border-white/10 pt-3 flex items-center justify-between text-xs text-[#8a7867] dark:text-[#94a3b8]">
              <span className="font-serif-book font-bold">Strona {pdfRightPageNum}</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTurnPrev();
                  }}
                  disabled={currentPage <= 1}
                  className="p-1 hover:text-[#2c2016] dark:hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Poprzedni dzień"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-[11px]">Dzień {currentPage} / 365</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTurnNext();
                  }}
                  disabled={currentPage >= 365}
                  className="p-1 hover:text-[#2c2016] dark:hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Następny dzień"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Page Turner Bar & Quick Jump */}
      <div className="max-w-5xl mx-auto w-full mt-4 bg-white/80 dark:bg-[#121722]/90 backdrop-blur-md p-3 rounded-2xl border border-[#dbcabb] dark:border-[#212b3c] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCalendar}
            id="btn-flipbook-calendar"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f0e4d4] dark:bg-[#1c2434] hover:bg-[#e4d6c4] dark:hover:bg-[#253147] text-[#423223] dark:text-[#f1f5f9] text-xs font-semibold border border-[#d8c8b6] dark:border-[#2b394e] transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#8a572c] dark:text-amber-400" />
            <span>Zmień dzień i miesiąc</span>
          </button>

          <span className="text-xs text-[#716152] dark:text-[#94a3b8] hidden sm:inline font-serif-book">
            Przewracaj klikając strzałki lub używaj klawiszy ← i →
          </span>
        </div>

        {/* Page Slider */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#716152] dark:text-[#94a3b8] font-mono">Dzień 1</span>
          <input
            type="range"
            min="1"
            max="365"
            value={currentPage}
            onChange={(e) => {
              const dayNum = parseInt(e.target.value, 10);
              const targetDate = getCycleDateByDayNumber(dayNum);
              onSelectDate(targetDate);
            }}
            className="w-32 sm:w-48 accent-[#8c572b] dark:accent-amber-500 cursor-pointer"
          />
          <span className="text-xs text-[#716152] dark:text-[#94a3b8] font-mono">365 (1095 Stron PDF)</span>
        </div>
      </div>

      {/* Table of Contents Drawer */}
      {showToc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="bg-[#faf7f2] dark:bg-[#0d121c] w-full max-w-md h-full shadow-2xl p-6 flex flex-col border-l border-[#e2d5c6] dark:border-[#212b3c] animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#e2d5c6] dark:border-[#212b3c]">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-[#8c572b] dark:text-amber-400" />
                <h3 className="font-heading-cinzel font-bold text-lg text-[#2f2217] dark:text-[#f1f5f9]">
                  Spis Treści • {section.shortTitle}
                </h3>
              </div>
              <button
                onClick={() => setShowToc(false)}
                className="p-1.5 rounded-lg hover:bg-[#ebdccb] dark:hover:bg-[#1a2333] text-[#5e4e3e] dark:text-[#94a3b8] cursor-pointer"
              >
                Zamknij
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-1">
              {CYCLE_DAYS.map((d) => {
                const isCurrent = d.dayNumber === currentPage;
                const isMarked = bookmarkedDays.includes(d.dayNumber);
                const dPdfNum = (d.dayNumber - 1) * 3 + 1;

                return (
                  <button
                    key={d.dateKey}
                    onClick={() => {
                      onSelectDate(d);
                      setShowToc(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center justify-between transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[#3b2d21] dark:bg-amber-600 text-white font-semibold shadow-xs'
                        : 'hover:bg-[#f1e5d6] dark:hover:bg-[#17202e] text-[#3e3124] dark:text-[#cbd5e1]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#8c7968] dark:text-[#94a3b8]">
                        Strona {dPdfNum}
                      </span>
                      <span>{d.displayDate}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isMarked && (
                        <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      )}
                      {d.isCycleStart && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-600/20 text-emerald-800 dark:text-emerald-300">
                          Początek 25 XII
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN ZOOM MODE MODAL */}
      {isFullscreenZoom && (
        <div className="fixed inset-0 z-50 bg-[#070b14]/95 backdrop-blur-2xl flex flex-col p-3 sm:p-6 overflow-hidden animate-fade-in">
          {/* Top Fullscreen Controls Bar */}
          <div className="w-full max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 bg-[#131a29]/90 border border-amber-500/30 p-3 sm:p-4 rounded-2xl shadow-2xl mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading-cinzel font-bold text-base sm:text-lg text-white">
                  {section.name} • Tryb Pełnoekranowy (E-Book)
                </h3>
                <p className="text-xs text-amber-300 font-serif-book">
                  {currentDate.displayDate} • Dzień {currentPage} z 365 (Strony PDF {pdfLeftPageNum}-{pdfRightPageNum} / 1095)
                </p>
              </div>
            </div>

            {/* Modal Top Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleTurnPrev}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Poprzedni dzień
              </button>

              <button
                onClick={handleTurnNext}
                disabled={currentPage >= 365}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-30 cursor-pointer"
              >
                Następny dzień <ChevronRight className="w-4 h-4" />
              </button>

              {/* CLOSE FULLSCREEN BUTTON */}
              <button
                onClick={() => setIsFullscreenZoom(false)}
                id="btn-close-fullscreen-zoom"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xl text-xs sm:text-sm border border-amber-400/40"
                title="Zamknij tryb powiększenia (Naciśnij Esc)"
              >
                <X className="w-5 h-5 text-white" />
                <span>✕ Zamknij powiększenie (Esc)</span>
              </button>
            </div>
          </div>

          {/* Fullscreen Reading Stage */}
          <div className="w-full max-w-7xl mx-auto flex-1 overflow-y-auto rounded-3xl border-2 border-amber-500/30 shadow-2xl p-4 sm:p-10 bg-[#FAF7F2] dark:bg-[#0f1420] text-[#2c2219] dark:text-[#e2e8f0]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 min-h-full">
              {/* Left Zoomed Page: TITLE ONLY */}
              <div className="flex flex-col justify-between p-6 sm:p-10 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-center">
                <div className="border-b border-black/10 dark:border-white/10 pb-3 flex items-center justify-between text-xs text-amber-800 dark:text-amber-400 font-bold uppercase tracking-widest">
                  <span>{section.shortTitle}</span>
                  <span>Strona PDF {pdfLeftPageNum} / 1095</span>
                </div>

                <div className="my-auto py-8 space-y-6">
                  <div className="w-20 h-1.5 bg-amber-600 rounded-full mx-auto" />
                  
                  <span className="text-sm font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest block font-sans-ui">
                    {currentDate.season || 'Cykl Roczny'} • Dzień {currentDate.dayNumber} z 365
                  </span>

                  <h1 className="font-heading-cinzel text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2d2217] dark:text-[#f1f5f9] leading-tight">
                    {entry.title}
                  </h1>

                  {entry.subtitle && (
                    <p className="font-serif-book italic text-base sm:text-lg text-[#786655] dark:text-[#94a3b8] max-w-md mx-auto">
                      {entry.subtitle}
                    </p>
                  )}

                  <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 font-serif-book italic text-sm sm:text-base leading-relaxed text-[#514234] dark:text-[#cbd5e1] max-w-lg mx-auto">
                    "Niech Słowo Boże i medytacja każdego dnia rozświetlają ścieżki Twojego życia w drodze ku wieczności."
                  </div>
                </div>

                <div className="border-t border-black/10 dark:border-white/10 pt-3 text-xs text-[#8a7867] dark:text-[#94a3b8] flex justify-between">
                  <span>Wydanie E-Book 365 Dni</span>
                  <span className="font-bold">Strona {pdfLeftPageNum}</span>
                </div>
              </div>

              {/* Right Zoomed Page: FULL READING TEXT */}
              <div className="flex flex-col justify-between p-6 sm:p-10 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                <div className="border-b border-black/10 dark:border-white/10 pb-3 flex items-center justify-between text-xs text-amber-800 dark:text-amber-400 font-bold">
                  <span>Rozważanie i Tekst Czytania</span>
                  <span>Strona PDF {pdfRightPageNum} / 1095</span>
                </div>

                <div className="my-auto py-6 space-y-6">
                  <div>
                    <h2 className="font-heading-cinzel font-bold text-2xl sm:text-3xl text-[#2c2016] dark:text-[#f3e8d2]">
                      {entry.title}
                    </h2>
                    {entry.subtitle && (
                      <p className="font-serif-book italic text-sm text-[#7d6b5b] dark:text-[#94a3b8] mt-1">
                        {entry.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="font-serif-book text-base sm:text-lg leading-relaxed sm:leading-8 text-[#2f251d] dark:text-[#e2e8f0] text-justify space-y-4">
                    {/<[a-z][\s\S]*>/i.test(entry.content || '') ? (
                      <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: entry.content }} />
                    ) : (
                      <div className="whitespace-pre-line">{entry.content}</div>
                    )}
                  </div>

                  {entry.prayer && (
                    <div className="p-6 rounded-2xl bg-amber-600/10 border-l-4 border-amber-600 font-serif-book italic text-base text-[#46372a] dark:text-amber-100">
                      <span className="block font-sans-ui not-italic font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">
                        Modlitwa serca:
                      </span>
                      {/<[a-z][\s\S]*>/i.test(entry.prayer || '') ? (
                        <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: entry.prayer }} />
                      ) : (
                        <div className="whitespace-pre-line">{entry.prayer}</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-black/10 dark:border-white/10 pt-3 text-xs text-[#8a7867] dark:text-[#94a3b8] flex justify-between">
                  <span className="font-bold">Strona {pdfRightPageNum}</span>
                  <span>{currentDate.displayDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Digital Rosary Modal */}
      {isRosaryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-5xl bg-white dark:bg-[#070b14] rounded-3xl p-4 sm:p-6 shadow-2xl border border-amber-500/30 my-auto max-h-[95vh] overflow-y-auto">
            <button
              onClick={() => setIsRosaryModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
              aria-label="Zamknij"
            >
              <X className="w-5 h-5" />
            </button>
            <DigitalRosary
              mysteryTitle={entry.mystery}
              intention={entry.intention}
              theme={theme === 'dark' ? 'dark' : 'light'}
            />
          </div>
        </div>
      )}
    </div>
  );
};

