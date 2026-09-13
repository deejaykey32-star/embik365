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
import { getEntryForSectionAndDate } from '../data/sampleEntries';
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
  customEntries?: Record<string, SectionEntry>;
}

/**
 * Splits text into three balanced reading chunks for 1:1 PDF page rendering
 */
function splitContentIntoThreeChunks(content: string): { chunk1: string; chunk2: string; chunk3: string } {
  if (!content) return { chunk1: '', chunk2: '', chunk3: '' };

  const paragraphs = content
    .split(/\n\n+|<p[^>]*>|<\/p>/i)
    .map(p => p.replace(/<[^>]*>/g, '').trim())
    .filter(Boolean);

  if (paragraphs.length >= 3) {
    const totalChars = paragraphs.reduce((acc, p) => acc + p.length, 0);
    const target = Math.floor(totalChars / 3);

    let currentSum = 0;
    let idx1 = 1;
    for (let i = 0; i < paragraphs.length - 2; i++) {
      currentSum += paragraphs[i].length;
      if (currentSum >= target) {
        idx1 = i + 1;
        break;
      }
    }

    currentSum = 0;
    let idx2 = idx1 + 1;
    for (let i = idx1; i < paragraphs.length - 1; i++) {
      currentSum += paragraphs[i].length;
      if (currentSum >= target) {
        idx2 = i + 1;
        break;
      }
    }

    const chunk1 = paragraphs.slice(0, idx1).join('\n\n');
    const chunk2 = paragraphs.slice(idx1, idx2).join('\n\n');
    const chunk3 = paragraphs.slice(idx2).join('\n\n');

    return { chunk1, chunk2, chunk3 };
  }

  if (paragraphs.length === 2) {
    return { chunk1: paragraphs[0], chunk2: paragraphs[1], chunk3: '' };
  }

  const text = content.replace(/<[^>]*>/g, '').trim();
  if (text.length < 300) {
    return { chunk1: text, chunk2: '', chunk3: '' };
  }

  const len = text.length;
  const target1 = Math.floor(len / 3);
  const target2 = Math.floor((len * 2) / 3);

  let split1 = text.indexOf('. ', target1);
  if (split1 === -1) split1 = target1;

  let split2 = text.indexOf('. ', split2 > split1 ? target2 : split1 + 1);
  if (split2 === -1) split2 = target2;

  const chunk1 = text.slice(0, split1 + 1).trim();
  const chunk2 = text.slice(split1 + 1, split2 + 1).trim();
  const chunk3 = text.slice(split2 + 1).trim();

  return { chunk1, chunk2, chunk3 };
}

/**
 * Calculates 1:1 PDF page data for any page P (1 to 1460 across 365 days)
 * Each day occupies 4 PDF pages = 1460 total PDF pages.
 */
function getPdfPageData(
  P: number,
  sectionId: string,
  currentDate: CycleDate,
  currentEntry: SectionEntry,
  customEntries?: Record<string, SectionEntry>
) {
  const safeP = Math.max(1, Math.min(1460, P));
  const dayNum = Math.floor((safeP - 1) / 4) + 1; // 1 to 365
  const subPage = ((safeP - 1) % 4) + 1; // 1, 2, 3, or 4

  const dateObj = getCycleDateByDayNumber(dayNum);
  const entryObj = (dayNum === currentDate.dayNumber)
    ? currentEntry
    : getEntryForSectionAndDate(sectionId as any, dateObj, customEntries);

  const { chunk1, chunk2, chunk3 } = splitContentIntoThreeChunks(entryObj.content || '');

  return {
    pdfPageNumber: safeP,
    dayNumber: dayNum,
    subPage,
    dateKey: dateObj.dateKey,
    displayDate: dateObj.displayDate,
    season: dateObj.season,
    title: entryObj.title || `Dzień ${dayNum} – ${dateObj.displayDate}`,
    subtitle: entryObj.subtitle,
    chunk1,
    chunk2,
    chunk3,
    prayer: entryObj.prayer,
    mystery: entryObj.mystery,
    intention: entryObj.intention,
    fullContent: entryObj.content
  };
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
  currentLang = 'pl',
  customEntries
}) => {
  // Total 1460 PDF pages (4 pages per day * 365 days) = 730 2-page spreads
  const [currentSpread, setCurrentSpread] = useState<number>(() => {
    return (currentDate.dayNumber - 1) * 2 + 1;
  });

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

  // Sync currentSpread when currentDate prop changes externally
  useEffect(() => {
    const targetSpread = (currentDate.dayNumber - 1) * 2 + 1;
    setCurrentSpread(targetSpread);
  }, [currentDate.dayNumber]);

  const leftPdfPageNum = (currentSpread * 2) - 1;
  const rightPdfPageNum = currentSpread * 2;

  const leftPageData = getPdfPageData(leftPdfPageNum, section.id, currentDate, entry, customEntries);
  const rightPageData = getPdfPageData(rightPdfPageNum, section.id, currentDate, entry, customEntries);

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

  // Load bookmarks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('drogowskazy_bookmarks');
      if (saved) setBookmarkedDays(JSON.parse(saved));
    } catch {}
  }, []);

  const isBookmarked = bookmarkedDays.includes(leftPageData.dayNumber);

  // Play page flip sound via Web Audio API
  const playPageFlipSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {}
  };

  const handleTurnNext = () => {
    if (currentSpread >= 730 || isFlipping) return;
    setIsFlipping(true);
    setFlipDirection('next');
    playPageFlipSound();

    setTimeout(() => {
      const nextSpread = currentSpread + 1;
      setCurrentSpread(nextSpread);
      const newLeftPage = (nextSpread * 2) - 1;
      const newDayNum = Math.floor((newLeftPage - 1) / 4) + 1;
      onSelectDate(getCycleDateByDayNumber(newDayNum));
      setIsFlipping(false);
    }, 280);
  };

  const handleTurnPrev = () => {
    if (currentSpread <= 1 || isFlipping) return;
    setIsFlipping(true);
    setFlipDirection('prev');
    playPageFlipSound();

    setTimeout(() => {
      const prevSpread = currentSpread - 1;
      setCurrentSpread(prevSpread);
      const newLeftPage = (prevSpread * 2) - 1;
      const newDayNum = Math.floor((newLeftPage - 1) / 4) + 1;
      onSelectDate(getCycleDateByDayNumber(newDayNum));
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
  }, [currentSpread, isFlipping, isFullscreenZoom]);

  const toggleBookmark = () => {
    const updated = isBookmarked
      ? bookmarkedDays.filter(d => d !== leftPageData.dayNumber)
      : [...bookmarkedDays, leftPageData.dayNumber];
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

  /**
   * Helper component to render 1:1 PDF Page content (4 pages per day)
   */
  const renderPdfPageBody = (data: ReturnType<typeof getPdfPageData>) => {
    if (data.subPage === 1) {
      // PDF Page 1: Title, Subtitle, Season & Opening Reading Chunk 1
      return (
        <div className="flex flex-col h-full justify-between space-y-3">
          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest block font-sans-ui">
              {data.season || 'Cykl Roczny'} • Dzień {data.dayNumber} z 365
            </span>

            <h2 className="font-heading-cinzel font-bold text-xl sm:text-2xl text-[#2c2016] dark:text-[#f3e8d2] leading-tight">
              {data.title}
            </h2>

            {data.subtitle && (
              <p className="font-serif-book italic text-xs text-[#7d6b5b] dark:text-[#94a3b8]">
                {data.subtitle}
              </p>
            )}
          </div>

          <div className={`font-serif-book leading-relaxed text-[#30261e] dark:text-[#e2e8f0] text-justify flex-1 overflow-hidden ${
            fontSize === 'sm' ? 'text-xs leading-5' :
            fontSize === 'base' ? 'text-sm leading-6' :
            fontSize === 'lg' ? 'text-base leading-7' :
            'text-lg leading-8'
          }`}>
            <div className="whitespace-pre-line">{data.chunk1}</div>
          </div>

          <div className="text-[11px] font-serif-book italic text-[#8c7968] dark:text-[#94a3b8] border-t border-black/5 dark:border-white/5 pt-2 flex justify-between">
            <span>Strona 1 / 4 (Otwarcie)</span>
            <span>Rozważanie cz. I na nast. stronie →</span>
          </div>
        </div>
      );
    } else if (data.subPage === 2) {
      // PDF Page 2: Core Reading Chunk 2
      return (
        <div className="flex flex-col h-full justify-between space-y-3">
          <div className="border-b border-black/5 dark:border-white/5 pb-1">
            <span className="font-heading-cinzel text-xs font-bold text-[#685544] dark:text-amber-400">
              Dzień {data.dayNumber} • Rozważanie (Część I)
            </span>
          </div>

          <div className={`font-serif-book leading-relaxed text-[#30261e] dark:text-[#e2e8f0] text-justify flex-1 overflow-hidden ${
            fontSize === 'sm' ? 'text-xs leading-5' :
            fontSize === 'base' ? 'text-sm leading-6' :
            fontSize === 'lg' ? 'text-base leading-7' :
            'text-lg leading-8'
          }`}>
            {data.chunk2 ? (
              <div className="whitespace-pre-line">{data.chunk2}</div>
            ) : (
              <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 italic text-xs leading-relaxed text-center my-auto">
                "Niech słowo Chrystusa przebywa w was z całym swym bogactwem. Z wdzięcznością śpiewajcie w sercach waszych Bogu." (Kol 3, 16)
              </div>
            )}
          </div>

          <div className="text-[11px] font-serif-book italic text-[#8c7968] dark:text-[#94a3b8] border-t border-black/5 dark:border-white/5 pt-2 flex justify-between">
            <span>Strona 2 / 4 (Głębia)</span>
            <span>Rozważanie cz. II na nast. stronie →</span>
          </div>
        </div>
      );
    } else if (data.subPage === 3) {
      // PDF Page 3: Core Reading Chunk 3
      return (
        <div className="flex flex-col h-full justify-between space-y-3">
          <div className="border-b border-black/5 dark:border-white/5 pb-1">
            <span className="font-heading-cinzel text-xs font-bold text-[#685544] dark:text-amber-400">
              Dzień {data.dayNumber} • Rozważanie (Część II)
            </span>
          </div>

          <div className={`font-serif-book leading-relaxed text-[#30261e] dark:text-[#e2e8f0] text-justify flex-1 overflow-hidden ${
            fontSize === 'sm' ? 'text-xs leading-5' :
            fontSize === 'base' ? 'text-sm leading-6' :
            fontSize === 'lg' ? 'text-base leading-7' :
            'text-lg leading-8'
          }`}>
            {data.chunk3 ? (
              <div className="whitespace-pre-line">{data.chunk3}</div>
            ) : (
              <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 italic text-xs leading-relaxed text-center my-auto">
                "W ciszy modlitwy odnajdujemy siłę na każdy dzień. Boże obietnice są niewzruszone jak fundamenty niebios."
              </div>
            )}
          </div>

          <div className="text-[11px] font-serif-book italic text-[#8c7968] dark:text-[#94a3b8] border-t border-black/5 dark:border-white/5 pt-2 flex justify-between">
            <span>Strona 3 / 4 (Synteza)</span>
            <span>Modlitwa Serca na nast. stronie →</span>
          </div>
        </div>
      );
    } else {
      // PDF Page 4: Prayer of the heart & Meditation
      return (
        <div className="flex flex-col h-full justify-between space-y-3">
          <div className="border-b border-black/5 dark:border-white/5 pb-1">
            <span className="font-heading-cinzel text-xs font-bold text-amber-800 dark:text-amber-400">
              Dzień {data.dayNumber} • Modlitwa Serca & Kontemplacja
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-hidden">
            {data.prayer ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border-l-4 border-amber-600 dark:border-amber-500 font-serif-book italic text-sm text-[#46372a] dark:text-amber-100">
                <span className="block font-sans-ui not-italic font-bold text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-1">
                  Modlitwa Serca:
                </span>
                <div className="whitespace-pre-line">{data.prayer}</div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border-l-4 border-amber-600 font-serif-book italic text-sm text-[#46372a] dark:text-amber-100">
                <span className="block font-sans-ui not-italic font-bold text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-1">
                  Modlitwa Wieczorna:
                </span>
                Panie mój i Boże, oddaję Ci cały ten dzień, Twojej miłości zawierza moje serce i bliskich. Amen.
              </div>
            )}

            {data.mystery && (
              <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-xs font-serif-book">
                <span className="font-bold text-amber-900 dark:text-amber-300">Tajemnica: </span>
                {data.mystery}
              </div>
            )}

            {section.id === 'ebook_rhz' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRosaryModalOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" /> Otwórz Cyfrowy Różaniec RHZ
              </button>
            )}
          </div>

          <div className="text-[11px] font-serif-book italic text-[#8c7968] dark:text-[#94a3b8] border-t border-black/5 dark:border-white/5 pt-2 flex justify-between">
            <span>Strona 4 / 4 (Zwieńczenie)</span>
            <span>PDF Strona {data.pdfPageNumber} / 1460</span>
          </div>
        </div>
      );
    }
  };

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
                E-Book PDF (1460 Stron 1:1)
              </span>
            </div>
            <p className="text-xs text-[#716152] dark:text-[#94a3b8] font-serif-book">
              {section.shortTitle} • Dzień {leftPageData.dayNumber} z 365 (Strony PDF {leftPdfPageNum}-{rightPdfPageNum} / 1460)
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
          disabled={currentSpread <= 1 || isFlipping}
          id="btn-flip-left"
          className="absolute left-0 sm:-left-4 z-30 p-3 rounded-full bg-[#35281e]/90 dark:bg-amber-600/90 text-white shadow-xl hover:bg-[#4d3b2e] dark:hover:bg-amber-500 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          title="Przewróć kartkę w lewo (Poprzednia strona PDF)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Next page arrow button (right) */}
        <button
          onClick={handleTurnNext}
          disabled={currentSpread >= 730 || isFlipping}
          id="btn-flip-right"
          className="absolute right-0 sm:-right-4 z-30 p-3 rounded-full bg-[#35281e]/90 dark:bg-amber-600/90 text-white shadow-xl hover:bg-[#4d3b2e] dark:hover:bg-amber-500 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          title="Przewróć kartkę w prawo (Następna strona PDF)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* 3D Book Container */}
        <div 
          className={`w-full max-w-4xl min-h-[560px] sm:min-h-[620px] rounded-3xl book-shadow border-4 border-[#3a2c20] dark:border-[#28354c] grid grid-cols-1 md:grid-cols-2 relative overflow-hidden transition-transform duration-300 ${
            isFlipping ? (flipDirection === 'next' ? 'scale-[0.99] rotate-y-2' : 'scale-[0.99] -rotate-y-2') : ''
          }`}
        >
          {/* Left Page (Desktop: PDF Page 1:1) */}
          <div 
            onClick={() => setIsFullscreenZoom(true)}
            className={`hidden md:flex flex-col justify-between p-8 sm:p-10 border-r ${currentTheme.pageLeft} relative cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors overflow-hidden`}
            title="Kliknij, aby otworzyć stronę PDF w trybie pełnoekranowym"
          >
            {/* Click hover overlay badge */}
            <div className="absolute inset-0 bg-amber-900/0 group-hover:bg-amber-900/5 transition-all flex items-center justify-center pointer-events-none z-10">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <ZoomIn className="w-4 h-4" /> Kliknij, aby powiększyć (Strona PDF {leftPdfPageNum})
              </span>
            </div>

            {/* Left page top header */}
            <div className="border-b border-black/10 dark:border-white/10 pb-3 flex items-center justify-between">
              <span className="font-heading-cinzel text-xs font-bold uppercase tracking-widest text-[#7a6755] dark:text-[#94a3b8]">
                {section.shortTitle}
              </span>
              <span className="font-serif-book text-xs italic font-bold text-amber-800 dark:text-amber-400">
                Strona PDF {leftPdfPageNum} z 1460
              </span>
            </div>

            {/* Left page 1:1 content */}
            <div className="my-auto py-4 flex-1 flex flex-col justify-between overflow-hidden">
              {renderPdfPageBody(leftPageData)}
            </div>

            {/* Left page footer */}
            <div className="border-t border-black/10 dark:border-white/10 pt-3 flex items-center justify-between text-xs text-[#8a7867] dark:text-[#94a3b8]">
              <span>Tom 365 PDF</span>
              <span className="font-serif-book font-bold">Strona {leftPdfPageNum}</span>
            </div>
          </div>

          {/* Book Spine Shadow in the center (Desktop) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-12 -translate-x-1/2 pointer-events-none book-spine z-20" />

          {/* Right Page (Desktop/Mobile: PDF Page 1:1) */}
          <div 
            onClick={() => setIsFullscreenZoom(true)}
            className={`flex flex-col justify-between p-6 sm:p-10 ${currentTheme.pageRight} relative cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors overflow-hidden`}
            title="Kliknij, aby otworzyć stronę PDF w trybie pełnoekranowym"
          >
            {/* Click hover overlay badge */}
            <div className="absolute inset-0 bg-amber-900/0 group-hover:bg-amber-900/5 transition-all flex items-center justify-center pointer-events-none z-10">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <ZoomIn className="w-4 h-4" /> Kliknij, aby powiększyć (Strona PDF {rightPdfPageNum})
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
              <span className="font-serif-book text-xs italic font-bold text-amber-800 dark:text-amber-400">
                Strona PDF {rightPdfPageNum} z 1460
              </span>
              <div className="flex items-center gap-2">
                <span className="font-heading-cinzel text-xs font-bold text-[#7a6755] dark:text-amber-400">
                  {rightPageData.displayDate}
                </span>
              </div>
            </div>

            {/* Right page 1:1 content */}
            <div className="my-auto py-4 flex-1 flex flex-col justify-between overflow-hidden">
              {renderPdfPageBody(rightPageData)}
            </div>

            {/* Right page footer */}
            <div className="border-t border-black/10 dark:border-white/10 pt-3 flex items-center justify-between text-xs text-[#8a7867] dark:text-[#94a3b8]">
              <span className="font-serif-book font-bold">Strona {rightPdfPageNum}</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTurnPrev();
                  }}
                  disabled={currentSpread <= 1}
                  className="p-1 hover:text-[#2c2016] dark:hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Poprzednia karta"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-[11px]">Dzień {leftPageData.dayNumber} / 365</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTurnNext();
                  }}
                  disabled={currentSpread >= 730}
                  className="p-1 hover:text-[#2c2016] dark:hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Następna karta"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Page Turner Bar & PDF Page Slider (1 to 1460) */}
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
            Przewracaj klikając strzałki lub klawisze ← i →
          </span>
        </div>

        {/* 1460 PDF Pages Slider */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#716152] dark:text-[#94a3b8] font-mono">Strona 1</span>
          <input
            type="range"
            min="1"
            max="1460"
            step="2"
            value={leftPdfPageNum}
            onChange={(e) => {
              const pNum = parseInt(e.target.value, 10);
              const targetSpread = Math.floor((pNum - 1) / 2) + 1;
              setCurrentSpread(targetSpread);
              const newLeftPage = (targetSpread * 2) - 1;
              const newDayNum = Math.floor((newLeftPage - 1) / 4) + 1;
              onSelectDate(getCycleDateByDayNumber(newDayNum));
            }}
            className="w-36 sm:w-56 accent-[#8c572b] dark:accent-amber-500 cursor-pointer"
          />
          <span className="text-xs text-[#716152] dark:text-[#94a3b8] font-mono font-bold text-amber-800 dark:text-amber-400">
            {leftPdfPageNum} / 1460 Stron PDF
          </span>
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
                const isCurrent = d.dayNumber === leftPageData.dayNumber;
                const isMarked = bookmarkedDays.includes(d.dayNumber);
                const dPdfNum = (d.dayNumber - 1) * 4 + 1;

                return (
                  <button
                    key={d.dateKey}
                    onClick={() => {
                      onSelectDate(d);
                      const targetSpread = (d.dayNumber - 1) * 2 + 1;
                      setCurrentSpread(targetSpread);
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
                        PDF Str. {dPdfNum}
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
        <div className="fixed inset-0 z-50 bg-[#070b14]/96 backdrop-blur-2xl flex flex-col p-3 sm:p-6 overflow-hidden animate-fade-in">
          {/* Top Fullscreen Controls Bar */}
          <div className="w-full max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 bg-[#131a29]/90 border border-amber-500/30 p-3 sm:p-4 rounded-2xl shadow-2xl mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading-cinzel font-bold text-base sm:text-lg text-white">
                  {section.name} • Tryb Pełnoekranowy (1:1 Strony PDF)
                </h3>
                <p className="text-xs text-amber-300 font-serif-book">
                  {leftPageData.displayDate} • Dzień {leftPageData.dayNumber} z 365 (Strony PDF {leftPdfPageNum} i {rightPdfPageNum} z 1460)
                </p>
              </div>
            </div>

            {/* Modal Top Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleTurnPrev}
                disabled={currentSpread <= 1}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Poprzednia strona
              </button>

              <button
                onClick={handleTurnNext}
                disabled={currentSpread >= 730}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-30 cursor-pointer"
              >
                Następna strona <ChevronRight className="w-4 h-4" />
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
              {/* Left Zoomed Page 1:1 */}
              <div className="flex flex-col justify-between p-6 sm:p-10 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                <div className="border-b border-black/10 dark:border-white/10 pb-3 flex items-center justify-between text-xs text-amber-800 dark:text-amber-400 font-bold uppercase tracking-widest">
                  <span>{section.shortTitle}</span>
                  <span>Strona PDF {leftPdfPageNum} z 1460</span>
                </div>

                <div className="my-auto py-6 space-y-4">
                  {renderPdfPageBody(leftPageData)}
                </div>

                <div className="border-t border-black/10 dark:border-white/10 pt-3 text-xs text-[#8a7867] dark:text-[#94a3b8] flex justify-between">
                  <span>Wydanie E-Book 365 Dni</span>
                  <span className="font-bold">Strona {leftPdfPageNum}</span>
                </div>
              </div>

              {/* Right Zoomed Page 1:1 */}
              <div className="flex flex-col justify-between p-6 sm:p-10 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                <div className="border-b border-black/10 dark:border-white/10 pb-3 flex items-center justify-between text-xs text-amber-800 dark:text-amber-400 font-bold">
                  <span>Dzień {rightPageData.dayNumber} z 365</span>
                  <span>Strona PDF {rightPdfPageNum} z 1460</span>
                </div>

                <div className="my-auto py-6 space-y-4">
                  {renderPdfPageBody(rightPageData)}
                </div>

                <div className="border-t border-black/10 dark:border-white/10 pt-3 text-xs text-[#8a7867] dark:text-[#94a3b8] flex justify-between">
                  <span className="font-bold">Strona {rightPdfPageNum}</span>
                  <span>{rightPageData.displayDate}</span>
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
