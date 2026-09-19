import React, { useState, useEffect, useRef } from 'react';
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
  Maximize2,
  Minimize2,
  QrCode,
  ZoomIn,
  Columns,
  Square
} from 'lucide-react';
import { SectionMeta, CycleDate, SectionEntry, UploadedPdf, SUPPORTED_LANGUAGES } from '../types';
import { CYCLE_DAYS, getCycleDateByDayNumber } from '../utils/dateCycle';
import { getEntryForSectionAndDate } from '../data/sampleEntries';
import { DigitalRosary } from './DigitalRosary';
import { getRhzEntryForDay } from '../data/rhz365Data';
import { getWnrEntryForDay } from '../data/wnr365Data';
import { getBibliaEntryForDayAndYear, getBibliaFourYearsForDay } from '../data/biblia365Data';
import { playLectorSpeech, stopLectorSpeech, getLectorConfig, unlockMobileAudio } from '../utils/audioLectorService';
import { getQrCodeForSection, generateAndDownloadQrBadgePng } from '../utils/qrCodeService';
import { QrImageDisplay } from './QrImageDisplay';
import { COMMON_PRAYERS } from '../data/rosaryData';

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
 * Splits text into four balanced reading chunks for 1:1 PDF page rendering across 4 subpages per day
 */
function splitContentIntoFourChunks(content: string, prayer?: string): { chunk1: string; chunk2: string; chunk3: string; chunk4: string } {
  let fullText = (content || '').trim();
  if (prayer && prayer.trim() && !fullText.includes(prayer.trim())) {
    fullText = `${fullText}\n\nModlitwa:\n${prayer.trim()}`;
  }

  if (!fullText) return { chunk1: '', chunk2: '', chunk3: '', chunk4: '' };

  const paragraphs = fullText
    .split(/\n\n+|<p[^>]*>|<\/p>/i)
    .map(p => p.replace(/<[^>]*>/g, '').trim())
    .filter(Boolean);

  if (paragraphs.length >= 4) {
    const totalChars = paragraphs.reduce((acc, p) => acc + p.length, 0);
    const target = Math.floor(totalChars / 4);

    let currentSum = 0;
    let idx1 = 1;
    for (let i = 0; i < paragraphs.length - 3; i++) {
      currentSum += paragraphs[i].length;
      if (currentSum >= target) {
        idx1 = i + 1;
        break;
      }
    }

    currentSum = 0;
    let idx2 = idx1 + 1;
    for (let i = idx1; i < paragraphs.length - 2; i++) {
      currentSum += paragraphs[i].length;
      if (currentSum >= target) {
        idx2 = i + 1;
        break;
      }
    }

    currentSum = 0;
    let idx3 = idx2 + 1;
    for (let i = idx2; i < paragraphs.length - 1; i++) {
      currentSum += paragraphs[i].length;
      if (currentSum >= target) {
        idx3 = i + 1;
        break;
      }
    }

    const chunk1 = paragraphs.slice(0, idx1).join('\n\n');
    const chunk2 = paragraphs.slice(idx1, idx2).join('\n\n');
    const chunk3 = paragraphs.slice(idx2, idx3).join('\n\n');
    const chunk4 = paragraphs.slice(idx3).join('\n\n');

    return { chunk1, chunk2, chunk3, chunk4 };
  }

  if (paragraphs.length === 3 || paragraphs.length === 2) {
    const sentences = fullText
      .replace(/<[^>]*>/g, '')
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (sentences.length >= 4) {
      const q = Math.ceil(sentences.length / 4);
      return {
        chunk1: sentences.slice(0, q).join(' '),
        chunk2: sentences.slice(q, q * 2).join(' '),
        chunk3: sentences.slice(q * 2, q * 3).join(' '),
        chunk4: sentences.slice(q * 3).join(' ')
      };
    }
  }

  const text = fullText.replace(/<[^>]*>/g, '').trim();
  if (text.length < 200) {
    return { chunk1: text, chunk2: text, chunk3: text, chunk4: text };
  }

  const len = text.length;
  const target1 = Math.floor(len / 4);
  const target2 = Math.floor((len * 2) / 4);
  const target3 = Math.floor((len * 3) / 4);

  let split1 = text.indexOf('. ', target1);
  if (split1 === -1) split1 = target1;

  let split2 = text.indexOf('. ', target2 > split1 ? target2 : split1 + 1);
  if (split2 === -1) split2 = target2;

  let split3 = text.indexOf('. ', target3 > split2 ? target3 : split2 + 1);
  if (split3 === -1) split3 = target3;

  const chunk1 = text.slice(0, split1 + 1).trim();
  const chunk2 = text.slice(split1 + 1, split2 + 1).trim();
  const chunk3 = text.slice(split2 + 1, split3 + 1).trim();
  const chunk4 = text.slice(split3 + 1).trim();

  return { chunk1, chunk2, chunk3, chunk4 };
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
  customEntries?: Record<string, SectionEntry>,
  selectedYear: 1 | 2 | 3 | 4 = 1
) {
  const isBiblia = sectionId === 'ebook_biblia' || sectionId === 'biblia365';
  const maxP = isBiblia ? 365 : 1460;
  const safeP = Math.max(1, Math.min(maxP, P));
  const dayNum = isBiblia ? safeP : (Math.floor((safeP - 1) / 4) + 1); // 1 to 365
  const subPage = isBiblia ? 1 : (((safeP - 1) % 4) + 1); // 1, 2, 3, or 4

  const dateObj = getCycleDateByDayNumber(dayNum);

  // 1. Direct handling for RHZ365 / ebook_rhz:
  if (sectionId === 'ebook_rhz' || sectionId === 'rhz365') {
    const rhz = getRhzEntryForDay(dayNum);
    let chunk = '';
    if (subPage === 1) chunk = rhz.page1;
    else if (subPage === 2) chunk = rhz.page2;
    else if (subPage === 3) chunk = rhz.page3;
    else chunk = rhz.page4;

    return {
      pdfPageNumber: safeP,
      dayNumber: dayNum,
      subPage,
      dateKey: dateObj.dateKey,
      displayDate: dateObj.displayDate,
      season: dateObj.season,
      title: rhz.stageTitle || `RHZ365 • Dzień ${dayNum}`,
      subtitle: `${dateObj.displayDate} • ${rhz.cycle} (Tajemnica ${rhz.mysteryIndex} z 175)`,
      chunk,
      prayer: `${rhz.gloryBe}\n\n${rhz.fatimaPrayer}`,
      mystery: rhz.stageTitle,
      intention: `Tajemnica ${rhz.mysteryIndex} Różańca Historii Zbawienia`,
      fullContent: rhz.fullText
    };
  }

  // 2. Direct handling for WnR365 / ebook_wnr:
  if (sectionId === 'ebook_wnr' || sectionId === 'wnr365' || sectionId === 'wnr366') {
    const wnr = getWnrEntryForDay(dayNum);
    const { chunk1, chunk2, chunk3, chunk4 } = splitContentIntoFourChunks(wnr.content);
    let chunk = '';
    if (subPage === 1) chunk = chunk1;
    else if (subPage === 2) chunk = chunk2;
    else if (subPage === 3) chunk = chunk3;
    else chunk = chunk4;

    return {
      pdfPageNumber: safeP,
      dayNumber: dayNum,
      subPage,
      dateKey: dateObj.dateKey,
      displayDate: dateObj.displayDate,
      season: dateObj.season,
      title: wnr.title || `Widoki na Raj • Dzień ${dayNum}`,
      subtitle: `${dateObj.displayDate} • Dzień ${dayNum} z 365`,
      chunk,
      prayer: '',
      mystery: '',
      intention: '',
      fullContent: wnr.content
    };
  }

  // 3. Direct handling for ebook_biblia:
  if (sectionId === 'ebook_biblia' || sectionId === 'biblia365') {
    const bibliaEntry = getBibliaEntryForDayAndYear(dayNum, selectedYear);
    return {
      pdfPageNumber: safeP,
      dayNumber: dayNum,
      subPage: 1,
      dateKey: dateObj.dateKey,
      displayDate: dateObj.displayDate,
      season: dateObj.season,
      title: bibliaEntry.title,
      subtitle: `${dateObj.displayDate} • ${bibliaEntry.category} (${bibliaEntry.passage})`,
      chunk: bibliaEntry.content,
      prayer: '',
      mystery: '',
      intention: '',
      fullContent: bibliaEntry.content
    };
  }

  // 4. Fallback for other sections (bio365, info365):
  const entryObj = (dayNum === currentDate.dayNumber)
    ? currentEntry
    : getEntryForSectionAndDate(sectionId as any, dateObj, customEntries);

  let fullRawText = entryObj.content || '';
  if (entryObj.title && !fullRawText.trim().startsWith(entryObj.title.trim()) && !fullRawText.trim().startsWith('[')) {
    fullRawText = `${entryObj.title}\n\n${fullRawText}`;
  }

  const { chunk1, chunk2, chunk3, chunk4 } = splitContentIntoFourChunks(fullRawText, entryObj.prayer);

  let chunk = '';
  if (subPage === 1) chunk = chunk1;
  else if (subPage === 2) chunk = chunk2;
  else if (subPage === 3) chunk = chunk3;
  else chunk = chunk4;

  return {
    pdfPageNumber: safeP,
    dayNumber: dayNum,
    subPage,
    dateKey: dateObj.dateKey,
    displayDate: dateObj.displayDate,
    season: dateObj.season,
    title: entryObj.title || `Dzień ${dayNum} – ${dateObj.displayDate}`,
    subtitle: entryObj.subtitle,
    chunk,
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
  // Persistent E-Reader Reading Position Memory per book (1 to 1460 PDF pages)
  const STORAGE_POS_KEY = `drogowskazy_reader_pos_${section.id}`;
  const STORAGE_LAYOUT_KEY = `drogowskazy_reader_layout_mode`;

  const [currentPageNum, setCurrentPageNum] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_POS_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 1460) {
          return parsed;
        }
      }
    } catch {}
    return 1; // Start on Title / Cover Page 1 on initial section open!
  });

  const [layoutMode, setLayoutMode] = useState<'spread' | 'single'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LAYOUT_KEY);
      if (saved === 'single' || saved === 'spread') return saved;
    } catch {}
    return 'spread';
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
  const [viewMode, setViewMode] = useState<'pdf' | 'text'>('text');
  const [selectedYear, setSelectedYear] = useState<1 | 2 | 3 | 4>(1);

  // Touch gesture state for horizontal page flipping
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const defaultWnrPdf: UploadedPdf = {
    id: 'pdf-wnr365-full',
    filename: '!WnR365 - całość poprawiana 17.09.2026.pdf',
    originalName: '!WnR365 - całość poprawiana 17.09.2026.pdf',
    format: 'pdf',
    url: '/pdf/!WnR365 - całość poprawiana 17.09.2026.pdf',
    size: 5655100,
    sectionId: 'ebook_wnr',
    title: 'Księga Widoki na Raj (WnR365) - Pełny PDF 1:1',
    description: 'Najnowszy plik PDF książki z dnia 17.09.2026.',
    uploadedAt: '2026-09-17T12:00:00.000Z'
  };

  const defaultRhzPdf: UploadedPdf = {
    id: 'pdf-rhz365-full',
    filename: '!RHZ365 - gotowy i poprawiony 17.09.2026.pdf',
    originalName: '!RHZ365 - gotowy i poprawiony 17.09.2026.pdf',
    format: 'pdf',
    url: '/pdf/!RHZ365 - gotowy i poprawiony 17.09.2026.pdf',
    size: 2123083,
    sectionId: 'ebook_rhz',
    title: 'Księga Różaniec Historii Zbawienia (RHZ365) - Pełny PDF 1:1',
    description: 'Najnowszy plik PDF książki z dnia 17.09.2026.',
    uploadedAt: '2026-09-17T12:00:00.000Z'
  };

  // Find PDFs attached to this specific section (ebook_wnr, ebook_rhz, ebook_biblia, bio365)
  const matchingPdfs = sectionPdfs.filter(
    p => p.sectionId === section.id ||
         (section.id === 'ebook_wnr' && (p.sectionId === 'wnr365' || p.sectionId === 'ebook_wnr')) ||
         (section.id === 'ebook_rhz' && (p.sectionId === 'rhz365' || p.sectionId === 'ebook_rhz')) ||
         (section.id === 'ebook_biblia' && (p.sectionId === 'biblia365' || p.sectionId === 'ebook_biblia')) ||
         (section.id === 'bio365' && (p.sectionId === 'bio365' || p.sectionId === 'ebook_bio'))
  );

  const activePdf = matchingPdfs[0] || (
    section.id === 'ebook_wnr' || section.id === 'wnr365' || section.id === 'wnr366'
      ? defaultWnrPdf
      : (section.id === 'ebook_rhz' || section.id === 'rhz365')
      ? defaultRhzPdf
      : null
  );



  // Save current reading position and layout mode to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_POS_KEY, currentPageNum.toString());
    } catch {}
  }, [currentPageNum, STORAGE_POS_KEY]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LAYOUT_KEY, layoutMode);
    } catch {}
  }, [layoutMode]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const diffX = touchStartX - touchEndX;
    const minSwipeDistance = 45;
    if (diffX > minSwipeDistance) {
      handleTurnNext();
    } else if (diffX < -minSwipeDistance) {
      handleTurnPrev();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const isBibliaSection = section.id === 'ebook_biblia' || section.id === 'biblia365';
  const maxBookPages = isBibliaSection ? 365 : 1460;

  // Calculate 1:1 PDF Page numbers for left and right pages in spread mode
  const leftPdfPageNum = currentPageNum % 2 === 0 ? Math.max(1, currentPageNum - 1) : currentPageNum;
  const rightPdfPageNum = leftPdfPageNum + 1;

  const leftPageData = getPdfPageData(leftPdfPageNum, section.id, currentDate, entry, customEntries, selectedYear);
  const rightPageData = getPdfPageData(rightPdfPageNum, section.id, currentDate, entry, customEntries, selectedYear);
  const singlePageData = getPdfPageData(currentPageNum, section.id, currentDate, entry, customEntries, selectedYear);

  const handleResetToTitlePage = () => {
    if (currentPageNum === 1 || isFlipping) return;
    setIsFlipping(true);
    setFlipDirection('prev');
    playPageFlipSound();
    setTimeout(() => {
      setCurrentPageNum(1);
      onSelectDate(getCycleDateByDayNumber(1));
      setIsFlipping(false);
    }, 280);
  };

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

  const isBookmarked = bookmarkedDays.includes(singlePageData.dayNumber);

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

  const flipTimerRef = useRef<any>(null);

  const handleTurnNext = () => {
    if (currentPageNum >= maxBookPages) return;
    const step = layoutMode === 'single' ? 1 : 2;
    const nextPos = Math.min(maxBookPages, currentPageNum + step);
    setCurrentPageNum(nextPos);
    const newDayNum = isBibliaSection ? nextPos : (Math.floor((nextPos - 1) / 4) + 1);
    onSelectDate(getCycleDateByDayNumber(newDayNum));

    setFlipDirection('next');
    setIsFlipping(true);
    playPageFlipSound();

    if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    flipTimerRef.current = setTimeout(() => {
      setIsFlipping(false);
    }, 220);
  };

  const handleTurnPrev = () => {
    if (currentPageNum <= 1) return;
    const step = layoutMode === 'single' ? 1 : 2;
    const prevPos = Math.max(1, currentPageNum - step);
    setCurrentPageNum(prevPos);
    const newDayNum = isBibliaSection ? prevPos : (Math.floor((prevPos - 1) / 4) + 1);
    onSelectDate(getCycleDateByDayNumber(newDayNum));

    setFlipDirection('prev');
    setIsFlipping(true);
    playPageFlipSound();

    if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
    flipTimerRef.current = setTimeout(() => {
      setIsFlipping(false);
    }, 220);
  };

  // Keyboard navigation & ESC key handler for Fullscreen zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreenZoom) {
        handleCloseFullscreen();
        return;
      }
      if (e.key === 'ArrowRight') handleTurnNext();
      if (e.key === 'ArrowLeft') handleTurnPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageNum, isFullscreenZoom, layoutMode]);

  const handleOpenFullscreen = () => {
    setIsFullscreenZoom(true);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const handleCloseFullscreen = () => {
    setIsFullscreenZoom(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const toggleBookmark = () => {
    const updated = isBookmarked
      ? bookmarkedDays.filter(d => d !== singlePageData.dayNumber)
      : [...bookmarkedDays, singlePageData.dayNumber];
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
          wrapper: 'bg-[#f5efe6] dark:bg-black',
          pageLeft: 'bg-[#faf8f5] dark:bg-black text-[#2c2621] dark:text-white border-[#ded5c7] dark:border-[#222222]',
          pageRight: 'bg-[#fffdfa] dark:bg-black text-[#2c2621] dark:text-white border-[#ded5c7] dark:border-[#222222]',
          spine: 'bg-gradient-to-r from-[#e0d6c7] via-[#f7f2ea] to-[#e0d6c7] dark:from-[#111111] dark:via-[#222222] dark:to-[#111111]',
          accent: 'text-[#82542a] dark:text-white'
        };
      case 'dark':
        return {
          wrapper: 'bg-[#1c1815] dark:bg-black',
          pageLeft: 'bg-[#29221b] dark:bg-black text-[#e8dfd5] dark:text-white border-[#3f352c] dark:border-[#222222]',
          pageRight: 'bg-[#251f19] dark:bg-black text-[#e8dfd5] dark:text-white border-[#3f352c] dark:border-[#222222]',
          spine: 'bg-gradient-to-r from-[#171310] via-[#352c23] to-[#171310] dark:from-[#111111] dark:via-[#222222] dark:to-[#111111]',
          accent: 'text-[#e5a86d] dark:text-white'
        };
      case 'parchment':
      default:
        return {
          wrapper: 'bg-[#ede5d8] dark:bg-black',
          pageLeft: 'bg-[#f7f1e6] dark:bg-black text-[#2f271f] dark:text-white border-[#d8cbb9] dark:border-[#222222]',
          pageRight: 'bg-[#faf5eb] dark:bg-black text-[#2f271f] dark:text-white border-[#d8cbb9] dark:border-[#222222]',
          spine: 'bg-gradient-to-r from-[#c9bba8] via-[#ebe2d3] to-[#c9bba8] dark:from-[#111111] dark:via-[#222222] dark:to-[#111111]',
          accent: 'text-[#875529] dark:text-white'
        };
    }
  };

  const currentTheme = getThemeStyles();

  // Mouse wheel handler to turn pages horizontally (disabling vertical scrolling)
  const [wheelCooldown, setWheelCooldown] = useState<boolean>(false);

  const handleWheelTurn = (e: React.WheelEvent) => {
    if (wheelCooldown || isFlipping) return;
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(delta) < 12) return;

    if (delta > 0) {
      handleTurnNext();
      setWheelCooldown(true);
      setTimeout(() => setWheelCooldown(false), 450);
    } else {
      handleTurnPrev();
      setWheelCooldown(true);
      setTimeout(() => setWheelCooldown(false), 450);
    }
  };

  /**
   * Helper component to render 1:1 PDF Page content in exact A5 format (148 x 210 mm ratio)
   */
  const renderPdfPageBody = (data: ReturnType<typeof getPdfPageData>, targetPageNum: number) => {
    const pageNum = targetPageNum;

    if (viewMode === 'pdf') {
      if (activePdf) {
        const pdfPageUrl = `${activePdf.url}#page=${pageNum}&toolbar=0&navpanes=0&scrollbar=0&view=Fit`;
        return (
          <iframe
            key={`pdf-frame-${activePdf.id}-${pageNum}`}
            src={pdfPageUrl}
            title={`Strona PDF ${pageNum} z ${maxBookPages} (Format A5 1:1)`}
            scrolling="no"
            className="w-full h-full border-0 rounded-xl bg-white dark:bg-black dark:invert dark:contrast-125 dark:hue-rotate-180 pointer-events-none transition-all duration-300 overflow-hidden"
            style={{ pointerEvents: 'none', border: 0, width: '100%', height: '100%' }}
          />
        );
      }

      if (isBibliaSection) {
        return (
          <div className="flex flex-col h-full flex-1 justify-between p-4 sm:p-6 bg-white dark:bg-[#121620] text-stone-900 dark:text-stone-100 rounded-xl border border-amber-600/30 shadow-md font-serif-book text-justify overflow-y-auto">
            {/* PDF A5 Running Header */}
            <div className="border-b border-amber-800/20 pb-2 mb-3 flex items-center justify-between text-[11px] text-amber-900 dark:text-amber-400 font-sans-ui font-semibold shrink-0 uppercase tracking-wider">
              <span>DROGA365 • ROK {selectedYear} • STRONA PDF {pageNum} Z 365</span>
              <span>{data.displayDate}</span>
            </div>

            {/* Title & Passage */}
            <div className="mb-4 shrink-0 border-b border-amber-500/20 pb-2">
              <h2 className="font-heading-cinzel font-extrabold text-base sm:text-lg text-amber-950 dark:text-amber-200">
                {data.title}
              </h2>
              <p className="text-xs italic text-amber-800 dark:text-amber-400">
                {data.subtitle}
              </p>
            </div>

            {/* Chapter Text Body */}
            <div className="flex-1 whitespace-pre-line leading-relaxed text-xs sm:text-sm font-serif-book">
              {data.chunk || data.fullContent}
            </div>

            {/* PDF Running Footer */}
            <div className="border-t border-amber-800/20 pt-2 mt-3 flex items-center justify-between text-[10px] text-amber-800/70 dark:text-amber-400/70 font-sans-ui shrink-0">
              <span>Biblia365 • 4-Letni Cykl Czytań</span>
              <span className="font-bold font-mono">Strona {pageNum}</span>
            </div>
          </div>
        );
      }
    }

    if (pageNum === 1) {
      if (section.id === 'ebook_rhz' || section.id === 'rhz365') {
        const rhzDay1 = getRhzEntryForDay(1);
        return (
          <div className="flex flex-col h-full justify-between p-3 sm:p-4 bg-gradient-to-b from-amber-50/60 via-white to-amber-50/40 dark:from-[#161f2e] dark:via-[#111722] dark:to-[#161f2e] rounded-2xl border border-amber-600/30 shadow-inner overflow-y-auto text-left space-y-3.5 flex-1">
            {/* Nagłówek Wstępu */}
            <div className="border-b border-amber-600/20 pb-2 text-center shrink-0">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-800 dark:text-amber-400 font-sans-ui">
                Wstęp Różańca Świętego • Strona 1
              </span>
              <h2 className="font-heading-cinzel text-sm sm:text-base font-bold text-[#2d1f14] dark:text-[#f8fafc] mt-0.5">
                Modlitwa Początkowa na Krzyżyku i Zawieszce
              </h2>
            </div>

            {/* 1. Znak Krzyża */}
            <div className="p-2.5 rounded-xl bg-amber-100/50 dark:bg-amber-950/40 border border-amber-500/30 space-y-1">
              <div className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <span>✦ Znak Krzyża Świętego</span>
              </div>
              <p className="font-serif-book text-xs sm:text-sm font-semibold text-[#2d2217] dark:text-[#f1f5f9]">
                W imię Ojca i Syna, i Ducha Świętego. Amen.
              </p>
            </div>

            {/* 2. Skład Apostolski */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#141b29] border border-[#e5d9cc] dark:border-[#24334c] space-y-1">
              <div className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                🛡 Krzyżyk — Skład Apostolski (Wierzę w Boga)
              </div>
              <p className="font-serif-book text-xs text-[#3a2e22] dark:text-[#cbd5e1] leading-relaxed text-justify">
                {COMMON_PRAYERS.cross.text}
              </p>
            </div>

            {/* 3. Ojcze Nasz */}
            <div className="p-2.5 rounded-xl bg-[#fbf8f3] dark:bg-[#161e2d] border border-[#e8ded3] dark:border-[#223048] space-y-1">
              <div className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                Duży Paciorek — Modlitwa Pańska (Ojcze Nasz)
              </div>
              <p className="font-serif-book text-xs text-[#3a2e22] dark:text-[#cbd5e1] leading-relaxed text-justify">
                {COMMON_PRAYERS.ourFather.text}
              </p>
            </div>

            {/* 4. Trzy Zdrowaś Maryjo z dopowiedzeniami */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                Trzy Małe Paciorki — Modlitwy o Cnoty Boskie z Dopowiedzeniami:
              </div>

              {/* Paciorek Czerwony - Wiara */}
              <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-900 dark:text-rose-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  <span>Paciorek 1 (Czerwony) — Wezwanie do pomnożenia wiary</span>
                </div>
                <p className="font-serif-book text-xs text-[#3d1e22] dark:text-[#cbd5e1] leading-relaxed text-justify">
                  Zdrowaś Maryjo, łaski pełna, Pan z Tobą, błogosławionaś Ty między niewiastami i błogosławiony owoc żywota Twojego, Jezus,{' '}
                  <strong className="underline decoration-rose-500 text-rose-950 dark:text-rose-200">
                    który niech pomnaża naszą wiarę
                  </strong>
                  . Święta Maryjo, Matko Boża, módl się za nami grzesznymi, teraz i w godzinę śmierci naszej. Amen.
                </p>
              </div>

              {/* Paciorek Zielony - Nadzieja */}
              <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900 dark:text-emerald-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Paciorek 2 (Zielony) — Wezwanie do umocnienia nadziei</span>
                </div>
                <p className="font-serif-book text-xs text-[#1b382b] dark:text-[#cbd5e1] leading-relaxed text-justify">
                  Zdrowaś Maryjo, łaski pełna, Pan z Tobą, błogosławionaś Ty między niewiastami i błogosławiony owoc żywota Twojego, Jezus,{' '}
                  <strong className="underline decoration-emerald-500 text-emerald-950 dark:text-emerald-200">
                    który niech umacnia naszą nadzieję
                  </strong>
                  . Święta Maryjo, Matko Boża, módl się za nami grzesznymi, teraz i w godzinę śmierci naszej. Amen.
                </p>
              </div>

              {/* Paciorek Niebieski - Miłość */}
              <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-900 dark:text-blue-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                  <span>Paciorek 3 (Niebieski) — Wezwanie do rozpalenia miłości</span>
                </div>
                <p className="font-serif-book text-xs text-[#263238] dark:text-[#cbd5e1] leading-relaxed text-justify">
                  Zdrowaś Maryjo, łaski pełna, Pan z Tobą, błogosławionaś Ty między niewiastami i błogosławiony owoc żywota Twojego, Jezus,{' '}
                  <strong className="underline decoration-blue-500 text-blue-950 dark:text-blue-200">
                    który niech rozpala naszą miłość
                  </strong>
                  . Święta Maryjo, Matko Boża, módl się za nami grzesznymi, teraz i w godzinę śmierci naszej. Amen.
                </p>
              </div>
            </div>

            {/* 5. Chwała Ojcu */}
            <div className="p-2.5 rounded-xl bg-amber-100/50 dark:bg-amber-950/40 border border-amber-500/30 space-y-1">
              <div className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                Uwielbienie — Chwała Ojcu
              </div>
              <p className="font-serif-book text-xs text-[#3a2e22] dark:text-[#cbd5e1] leading-relaxed">
                {COMMON_PRAYERS.gloryBe.text}
              </p>
            </div>

            {/* 6. Informacja o Etapie 1, Części 1, Tajemnicy 1 i Rozważanie */}
            <div className="border-t-2 border-amber-600/30 pt-3 space-y-2">
              <div className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-xs font-bold font-sans-ui text-center shadow-xs">
                {rhzDay1.stageTitle}
              </div>

              <div className="rich-text-content whitespace-pre-line text-xs font-serif-book leading-relaxed text-justify text-[#30261e] dark:text-[#f1f5f9]">
                {rhzDay1.page1}
              </div>
            </div>
          </div>
        );
      }

      if (section.id !== 'ebook_biblia' && section.id !== 'biblia365') {
        // Elegant 1:1 Title Cover Page in Text View (Format A5)
        return (
          <div className="flex flex-col h-full justify-between items-center text-center p-4 sm:p-6 bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 dark:from-amber-950/20 dark:via-black dark:to-amber-950/10 rounded-2xl border-2 border-amber-600/30 shadow-inner my-auto overflow-hidden select-none flex-1">
            <div className="w-full pt-2 border-b border-amber-600/20 pb-2">
              <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-amber-800 dark:text-amber-400 font-sans-ui">
                Format A5 (148 x 210 mm) • Tom 365 Dni
              </span>
            </div>

            <div className="my-auto space-y-3 py-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-600/15 border-2 border-amber-600/40 flex items-center justify-center text-amber-800 dark:text-amber-300 shadow-md">
                <BookOpen className="w-7 h-7" />
              </div>

              <h1 className="font-heading-cinzel text-xl sm:text-2xl font-extrabold text-[#2c1e12] dark:text-[#f3e8d2] tracking-wide leading-tight">
                {section.name}
              </h1>

              <p className="font-serif-book italic text-xs sm:text-sm text-[#6b5543] dark:text-[#cbd5e1] max-w-md mx-auto">
                {section.subtitle || section.description}
              </p>

              <div className="w-20 h-0.5 mx-auto bg-gradient-to-r from-transparent via-amber-600 to-transparent my-2" />

              <div className="text-[11px] font-semibold text-[#8a725f] dark:text-[#94a3b8] font-sans-ui uppercase tracking-widest">
                Autor: Dominik Kuta • Droga365
              </div>
            </div>

            <div className="w-full pb-1 border-t border-amber-600/20 pt-2 text-[10px] text-[#7a6552] dark:text-[#94a3b8] font-serif-book italic">
              Strona Tytułowa A5 1:1 • Pierwsza Kartka Księgi
            </div>
          </div>
        );
      }
    }

    return (
      <div className="flex flex-col h-full flex-1 justify-between space-y-3 overflow-hidden">
        <div className={`font-serif-book leading-relaxed text-[#30261e] dark:text-white text-justify flex-1 overflow-y-auto pr-1 ${
          fontSize === 'sm' ? 'text-xs leading-5' :
          fontSize === 'base' ? 'text-sm leading-6' :
          fontSize === 'lg' ? 'text-base leading-7' :
          'text-lg leading-8'
        }`}>
          {data.chunk ? (
            /<[a-z][\s\S]*>/i.test(data.chunk) ? (
              <div className="rich-text-content whitespace-pre-line" dangerouslySetInnerHTML={{ __html: data.chunk }} />
            ) : (
              <div className="whitespace-pre-line">{data.chunk}</div>
            )
          ) : (
            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 text-xs sm:text-sm font-serif-book leading-relaxed text-justify my-auto text-[#30261e] dark:text-[#f1f5f9]">
              {data.fullContent || data.title}
            </div>
          )}
        </div>

        {data.subPage === 4 && (
          <div className="mt-2 p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-between gap-3 text-xs shrink-0">
            {(() => {
              const qrItem = getQrCodeForSection(section.id, section.name);
              return (
                <>
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-9 h-9 p-0.5 bg-white rounded-lg border shrink-0">
                      <QrImageDisplay text={qrItem.shortUrl || qrItem.fullUrl} title={section.name} />
                    </div>
                    <div className="overflow-hidden text-left">
                      <div className="font-bold text-[10px] truncate text-[#2f271f] dark:text-white">
                        {qrItem.title}
                      </div>
                      <div className="text-[9px] font-mono text-amber-800 dark:text-amber-300 truncate">
                        {qrItem.shortUrl || qrItem.fullUrl}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await generateAndDownloadQrBadgePng(qrItem);
                    }}
                    className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Pobierz kod QR jako plik PNG (300 DPI)"
                  >
                    <Download className="w-3 h-3" />
                    <span>PNG</span>
                  </button>
                </>
              );
            })()}
          </div>
        )}

        {data.subPage === 4 && section.id === 'ebook_rhz' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsRosaryModalOpen(true);
            }}
            className="w-full py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs mt-1 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" /> Cyfrowy Różaniec RHZ
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-[calc(100vh-140px)] ${currentTheme.wrapper} transition-colors duration-300 py-4 px-2 sm:px-6 flex flex-col justify-between`}>
      {/* Flipbook Header Controls */}
      <div className="max-w-5xl mx-auto w-full mb-3 flex flex-wrap items-center justify-between gap-2.5 bg-white/80 dark:bg-black/90 backdrop-blur-md p-2.5 rounded-2xl border border-[#dbcabb] dark:border-[#222222] shadow-xs">
        {/* Book Title & Section Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#443324] dark:bg-amber-600 text-amber-300 dark:text-white flex items-center justify-center shadow-xs shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading-cinzel font-bold text-sm sm:text-base text-[#281e15] dark:text-[#f1f5f9]">
                {section.name}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800/60">
                Format Książkowy A5 (148x210 mm)
              </span>
            </div>
            <p className="text-xs text-[#716152] dark:text-[#94a3b8] font-serif-book">
              {section.shortTitle} • Dzień {singlePageData.dayNumber} z 365 (Strona PDF {currentPageNum} / 1460)
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* 4-Year Selector for ebook_biblia / biblia365 */}
          {(section.id === 'ebook_biblia' || section.id === 'biblia365') && (
            <div className="flex items-center rounded-xl border border-emerald-600/40 p-0.5 bg-emerald-950/20 text-xs font-semibold">
              {([1, 2, 3, 4] as const).map(yr => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedYear === yr
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20'
                  }`}
                >
                  Rok {yr}
                </button>
              ))}
            </div>
          )}

          {/* Layout Mode Toggle */}
          <div className="flex items-center rounded-xl border border-[#d8c8b6] dark:border-[#28354a] p-0.5 bg-[#f5ecdf] dark:bg-[#18202e]">
            <button
              onClick={() => setLayoutMode('spread')}
              id="btn-layout-spread"
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                layoutMode === 'spread'
                  ? 'bg-[#3b2d21] dark:bg-amber-600 text-white shadow-xs'
                  : 'text-[#615143] dark:text-[#94a3b8] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title="Widok książkowy A5 (Lewa i Prawa strona)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">2 Strony A5</span>
            </button>
            <button
              onClick={() => setLayoutMode('single')}
              id="btn-layout-single"
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                layoutMode === 'single'
                  ? 'bg-[#3b2d21] dark:bg-amber-600 text-white shadow-xs'
                  : 'text-[#615143] dark:text-[#94a3b8] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title="Widok jednostronicowy A5 (Tylko 1 strona)"
            >
              <Square className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">1 Strona A5</span>
            </button>
          </div>

          {/* Reset to Title Page Button */}
          <button
            onClick={handleResetToTitlePage}
            id="btn-flipbook-titlepage"
            className="px-2.5 py-1.5 rounded-xl bg-amber-600/15 hover:bg-amber-600/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Wróć do Strony Tytułowej (Strona 1)"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            <span className="hidden sm:inline">Strona Tytułowa</span>
          </button>

          {/* View Mode Toggle (PDF 1:1 vs Text) */}
          <button
            onClick={() => setViewMode(viewMode === 'pdf' ? 'text' : 'pdf')}
            id="btn-flipbook-viewmode"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              viewMode === 'pdf'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                : 'bg-[#f0e4d4] dark:bg-[#1c2434] text-[#4d3d2e] dark:text-[#e2e8f0] border-[#d8c8b6] dark:border-[#28354a]'
            }`}
            title="Przełącz widok: 1:1 Plik PDF A5 lub Wyciągnięty Tekst"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{viewMode === 'pdf' ? 'PDF A5' : 'Tekst'}</span>
          </button>

          {/* Open Full PDF Modal */}
          {activePdf && (
            <button
              onClick={() => onOpenPdf(activePdf)}
              id="btn-flipbook-open-pdf"
              className="px-2.5 py-1.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 text-red-800 dark:text-red-300 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Otwórz pełny czytnik pliku PDF"
            >
              <FileText className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span className="hidden sm:inline">Podgląd PDF</span>
            </button>
          )}

          {/* Zoom Fullscreen E-Reader Trigger */}
          <button
            onClick={handleOpenFullscreen}
            id="btn-flipbook-zoom"
            className="px-2.5 py-1.5 rounded-xl bg-amber-600 text-white hover:bg-amber-700 border border-amber-500 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Tryb Pełnoekranowy Czytnika A5"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pełny ekran</span>
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

      {/* Main Flipbook Stage (Exact Format A5: 148 x 210 mm) */}
      <div className="max-w-5xl mx-auto w-full flex-1 flex items-center justify-center relative perspective-2000 py-2">
        {/* Previous page arrow button (left) */}
        <button
          onClick={handleTurnPrev}
          disabled={currentPageNum <= 1}
          id="btn-flip-left"
          className="absolute left-0 sm:-left-4 z-40 p-2.5 sm:p-3 rounded-full bg-[#35281e]/90 dark:bg-amber-600/90 text-white shadow-2xl hover:bg-[#4d3b2e] dark:hover:bg-amber-500 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer border border-amber-500/30"
          title="Przewróć kartkę w lewo (Poprzednia strona A5)"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Next page arrow button (right) */}
        <button
          onClick={handleTurnNext}
          disabled={currentPageNum >= 1460}
          id="btn-flip-right"
          className="absolute right-0 sm:-right-4 z-40 p-2.5 sm:p-3 rounded-full bg-[#35281e]/90 dark:bg-amber-600/90 text-white shadow-2xl hover:bg-[#4d3b2e] dark:hover:bg-amber-500 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer border border-amber-500/30"
          title="Przewróć kartkę w prawo (Następna strona A5)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Outer Hardcover Book Frame */}
        <div className={`w-full ${layoutMode === 'single' ? 'max-w-[480px]' : 'max-w-5xl'} rounded-[24px] p-2 sm:p-3 bg-gradient-to-b from-[#422e1e] via-[#2d1e13] to-[#1d120a] dark:from-[#1e150c] dark:via-[#140e08] dark:to-[#0a0604] border-[4px] sm:border-[8px] border-[#382618] dark:border-[#1a110a] book-hard-cover relative shadow-2xl overflow-hidden transition-all duration-300`}>
          {/* Decorative Corner Accents */}
          <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-500/40 rounded-tl-md pointer-events-none z-10" />
          <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-500/40 rounded-tr-md pointer-events-none z-10" />
          <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-500/40 rounded-bl-md pointer-events-none z-10" />
          <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-500/40 rounded-br-md pointer-events-none z-10" />

          {/* 3D Open Book Inner Container */}
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheelTurn}
            className={`w-full rounded-xl relative overflow-hidden transform-style-3d select-none transition-transform duration-300 ${
              layoutMode === 'spread' ? 'grid grid-cols-1 md:grid-cols-2 aspect-auto md:aspect-[297/210]' : 'flex flex-col aspect-[148/210]'
            } ${isFlipping ? 'scale-[0.998]' : ''}`}
          >
            {/* SINGLE PAGE LAYOUT MODE */}
            {layoutMode === 'single' ? (
              <div 
                onClick={handleOpenFullscreen}
                className={`w-full h-full flex flex-col justify-between ${viewMode === 'pdf' ? 'p-0' : 'p-3 sm:p-5'} ${currentTheme.pageRight} relative cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors overflow-hidden aspect-[148/210]`}
                title="Kliknij, aby otworzyć stronę A5 w trybie pełnoekranowym"
              >
                {viewMode === 'pdf' ? (
                  <div className="w-full h-full relative overflow-hidden rounded-xl">
                    {renderPdfPageBody(singlePageData, currentPageNum)}
                  </div>
                ) : (
                  <>
                    {/* Single page header */}
                    <div className="border-b border-black/10 dark:border-white/20 pb-2 flex items-center justify-between shrink-0">
                      <span className="font-heading-cinzel text-xs font-bold uppercase tracking-widest text-[#7a6755] dark:text-white">
                        {section.shortTitle}
                      </span>
                      <span className="font-serif-book text-xs italic font-bold text-amber-800 dark:text-amber-300">
                        Strona PDF {currentPageNum} z 1460 (A5)
                      </span>
                    </div>

                    {/* Single page 1:1 body */}
                    <div className="my-auto py-1 flex-1 flex flex-col justify-between overflow-hidden">
                      {renderPdfPageBody(singlePageData, currentPageNum)}
                    </div>

                    {/* Single page footer */}
                    <div className="border-t border-black/10 dark:border-white/20 pt-2 flex items-center justify-between text-xs text-[#8a7867] dark:text-white shrink-0">
                      <span className="font-serif-book font-bold">Strona {currentPageNum}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTurnPrev();
                          }}
                          disabled={currentPageNum <= 1}
                          className="p-1 hover:text-[#2c2016] dark:hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Poprzednia strona"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-mono text-[11px]">Dzień {singlePageData.dayNumber} / 365</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTurnNext();
                          }}
                          disabled={currentPageNum >= 1460}
                          className="p-1 hover:text-[#2c2016] dark:hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Następna strona"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* SPREAD LAYOUT MODE (TWO A5 PAGES SIDE-BY-SIDE = A4 SPREAD 297x210) */
              <>
                {/* Left Page (Desktop Spread A5) */}
                <div 
                  onClick={handleOpenFullscreen}
                  className={`hidden md:flex flex-col justify-between ${viewMode === 'pdf' ? 'p-0' : 'p-3 sm:p-5'} border-r border-[#d4c5b3] dark:border-[#222222] ${currentTheme.pageLeft} relative cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors overflow-hidden h-full aspect-[148/210]`}
                  title="Kliknij, aby otworzyć stronę PDF w trybie pełnoekranowym"
                >
                  <div className="absolute top-0 right-0 bottom-0 w-8 pointer-events-none page-crease-left z-10" />

                  {viewMode === 'pdf' ? (
                    <div className="w-full h-full relative overflow-hidden rounded-l-xl">
                      {renderPdfPageBody(leftPageData, leftPdfPageNum)}
                    </div>
                  ) : (
                    <>
                      {/* Left page header */}
                      <div className="border-b border-black/10 dark:border-white/20 pb-2 flex items-center justify-between shrink-0">
                        <span className="font-heading-cinzel text-xs font-bold uppercase tracking-widest text-[#7a6755] dark:text-white">
                          {section.shortTitle}
                        </span>
                        <span className="font-serif-book text-xs italic font-bold text-amber-800 dark:text-amber-300">
                          Strona PDF {leftPdfPageNum} z 1460 (A5)
                        </span>
                      </div>

                      {/* Left page 1:1 content */}
                      <div className="my-auto py-1 flex-1 flex flex-col justify-between overflow-hidden">
                        {renderPdfPageBody(leftPageData, leftPdfPageNum)}
                      </div>

                      {/* Left page footer */}
                      <div className="border-t border-black/10 dark:border-white/20 pt-2 flex items-center justify-between text-xs text-[#8a7867] dark:text-white shrink-0">
                        <span>Tom 365 PDF</span>
                        <span className="font-serif-book font-bold">Strona {leftPdfPageNum}</span>
                      </div>
                    </>
                  )}

                  <div className="page-corner-curl page-corner-curl-left opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                </div>

                {/* Central Hard Spine Binding Joint */}
                <div className="hidden md:flex absolute left-1/2 top-0 bottom-0 w-6 sm:w-8 -translate-x-1/2 pointer-events-none z-20 book-spine-joint flex-col justify-between items-center py-4 border-x border-black/20 dark:border-white/10 shadow-2xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-800/50 dark:bg-amber-400/40 shadow-xs" />
                  <div className="w-0.5 h-full bg-gradient-to-b from-black/10 via-black/25 to-black/10 dark:from-white/5 dark:via-white/15 dark:to-white/5 my-2" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-800/50 dark:bg-amber-400/40 shadow-xs" />
                </div>

                {/* Right Page (Desktop/Mobile Spread A5) */}
                <div 
                  onClick={handleOpenFullscreen}
                  className={`flex flex-col justify-between ${viewMode === 'pdf' ? 'p-0' : 'p-3 sm:p-5'} ${currentTheme.pageRight} relative cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 transition-colors overflow-hidden h-full aspect-[148/210]`}
                  title="Kliknij, aby otworzyć stronę PDF w trybie pełnoekranowym"
                >
                  <div className="absolute top-0 left-0 bottom-0 w-8 pointer-events-none page-crease-right z-10" />

                  {isBookmarked && (
                    <div className="absolute top-0 right-6 z-30 w-5 h-10 bg-amber-600 rounded-b-md shadow-md flex items-end justify-center pb-1">
                      <Bookmark className="w-3 h-3 text-white fill-white" />
                    </div>
                  )}

                  {viewMode === 'pdf' ? (
                    <div className="w-full h-full relative overflow-hidden rounded-r-xl">
                      {renderPdfPageBody(rightPageData, rightPdfPageNum)}
                    </div>
                  ) : (
                    <>
                      {/* Right page header */}
                      <div className="border-b border-black/10 dark:border-white/20 pb-2 flex items-center justify-between shrink-0">
                        <span className="font-serif-book text-xs italic font-bold text-amber-800 dark:text-amber-300">
                          Strona PDF {rightPdfPageNum} z 1460 (A5)
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-heading-cinzel text-xs font-bold text-[#7a6755] dark:text-white">
                            {rightPageData.displayDate}
                          </span>
                        </div>
                      </div>

                      {/* Right page 1:1 content */}
                      <div className="my-auto py-1 flex-1 flex flex-col justify-between overflow-hidden">
                        {renderPdfPageBody(rightPageData, rightPdfPageNum)}
                      </div>

                      {/* Right page footer */}
                      <div className="border-t border-black/10 dark:border-white/20 pt-2 flex items-center justify-between text-xs text-[#8a7867] dark:text-white shrink-0">
                        <span className="font-serif-book font-bold">Strona {rightPdfPageNum}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTurnPrev();
                            }}
                            disabled={currentPageNum <= 1}
                            className="p-1 hover:text-[#2c2016] dark:hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Poprzednia karta"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="font-mono text-[11px]">Dzień {rightPageData.dayNumber} / 365</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTurnNext();
                            }}
                            disabled={currentPageNum >= 1460}
                            className="p-1 hover:text-[#2c2016] dark:hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Następna karta"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="page-corner-curl page-corner-curl-right opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                </div>
              </>
            )}

            {/* 3D HORIZONTAL PAGE FLIP ANIMATED LEAF OVERLAY */}
            {isFlipping && (
              <div 
                className={`hidden md:flex flex-col justify-between ${viewMode === 'pdf' ? 'p-0' : 'p-3 sm:p-5'} absolute top-0 bottom-0 w-1/2 z-30 pointer-events-none ${
                  flipDirection === 'next'
                    ? 'right-0 animate-flip-next'
                    : 'left-0 animate-flip-prev'
                } ${flipDirection === 'next' ? currentTheme.pageRight : currentTheme.pageLeft} border border-black/10 dark:border-white/20 shadow-2xl overflow-hidden h-full aspect-[148/210]`}
              >
                {viewMode === 'pdf' ? (
                  <div className="w-full h-full relative overflow-hidden">
                    {renderPdfPageBody(flipDirection === 'next' ? rightPageData : leftPageData, flipDirection === 'next' ? rightPdfPageNum : leftPdfPageNum)}
                  </div>
                ) : (
                  <>
                    <div className="border-b border-black/10 dark:border-white/20 pb-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-bold shrink-0">
                      <span>Przewracanie kartki A5...</span>
                      <span>Strona {flipDirection === 'next' ? rightPdfPageNum : leftPdfPageNum}</span>
                    </div>
                    <div className="my-auto py-1 flex-1 flex flex-col justify-between opacity-80 blur-[0.3px] overflow-hidden">
                      {renderPdfPageBody(flipDirection === 'next' ? rightPageData : leftPageData, flipDirection === 'next' ? rightPdfPageNum : leftPdfPageNum)}
                    </div>
                    <div className="border-t border-black/10 dark:border-white/20 pt-2 text-xs text-center text-amber-800 dark:text-amber-300 font-serif-book font-bold shrink-0">
                      📖 {section.name} (Format A5)
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Page Turner Bar & PDF Page Slider (1 to 1460) */}
      <div className="max-w-5xl mx-auto w-full mt-3 bg-white/80 dark:bg-black/90 backdrop-blur-md p-2.5 rounded-2xl border border-[#dbcabb] dark:border-[#222222] shadow-xs flex flex-wrap items-center justify-between gap-2.5">
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
          <span className="text-xs text-[#716152] dark:text-[#94a3b8] font-mono">Str. 1</span>
          <input
            type="range"
            min="1"
            max="1460"
            step="1"
            value={currentPageNum}
            onChange={(e) => {
              const pNum = parseInt(e.target.value, 10);
              setCurrentPageNum(pNum);
              const newDayNum = Math.floor((pNum - 1) / 4) + 1;
              onSelectDate(getCycleDateByDayNumber(newDayNum));
            }}
            className="w-36 sm:w-56 accent-[#8c572b] dark:accent-amber-500 cursor-pointer"
          />
          <span className="text-xs text-[#716152] dark:text-[#94a3b8] font-mono font-bold text-amber-800 dark:text-amber-400">
            {currentPageNum === 1 ? 'Strona Tytułowa 1' : `Strona PDF ${currentPageNum}`} / 1460
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
                const isCurrent = d.dayNumber === singlePageData.dayNumber;
                const isMarked = bookmarkedDays.includes(d.dayNumber);
                const dPdfNum = (d.dayNumber - 1) * 4 + 1;

                return (
                  <button
                    key={d.dateKey}
                    onClick={() => {
                      onSelectDate(d);
                      setCurrentPageNum(dPdfNum);
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

      {/* FULLSCREEN E-READER MODE MODAL (FORMAT A5 1:1) */}
      {isFullscreenZoom && (
        <div className="fixed inset-0 z-50 bg-[#070b14]/98 backdrop-blur-2xl flex flex-col p-2 sm:p-4 overflow-hidden animate-fade-in">
          {/* Top Fullscreen Controls Bar */}
          <div className="w-full max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 bg-[#131a29]/90 border border-amber-500/30 p-2.5 sm:p-3 rounded-2xl shadow-2xl mb-2 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading-cinzel font-bold text-sm sm:text-base text-white">
                  {section.name} • Czytnik E-Reader A5 (Pełny Ekran)
                </h3>
                <p className="text-[11px] text-amber-300 font-serif-book">
                  {singlePageData.displayDate} • Dzień {singlePageData.dayNumber} z 365 (Strona PDF {currentPageNum} z 1460)
                </p>
              </div>
            </div>

            {/* Modal Top Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Layout switcher inside fullscreen */}
              <div className="flex items-center rounded-xl border border-amber-500/40 p-0.5 bg-black/40">
                <button
                  onClick={() => setLayoutMode('spread')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                    layoutMode === 'spread'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>2 Strony A5</span>
                </button>
                <button
                  onClick={() => setLayoutMode('single')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                    layoutMode === 'single'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>1 Strona A5</span>
                </button>
              </div>

              <button
                onClick={handleTurnPrev}
                disabled={currentPageNum <= 1}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Poprzednia strona
              </button>

              <button
                onClick={handleTurnNext}
                disabled={currentPageNum >= 1460}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-30 cursor-pointer"
              >
                Następna strona <ChevronRight className="w-4 h-4" />
              </button>

              {/* CLOSE FULLSCREEN BUTTON */}
              <button
                onClick={handleCloseFullscreen}
                id="btn-close-fullscreen-zoom"
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xl text-xs sm:text-sm border border-amber-400/40"
                title="Zamknij tryb pełnoekranowy (Naciśnij Esc)"
              >
                <X className="w-4 h-4 text-white" />
                <span>Wyjdź (Esc)</span>
              </button>
            </div>
          </div>

          {/* Fullscreen Reading Stage (Format A5 1:1) */}
          <div className="w-full max-w-7xl mx-auto flex-1 overflow-hidden rounded-2xl border-2 border-amber-500/30 dark:border-[#222222] shadow-2xl p-2.5 sm:p-5 bg-[#FAF7F2] dark:bg-black text-[#2c2219] dark:text-white flex flex-col justify-between">
            {layoutMode === 'single' ? (
              <div className={`flex flex-col justify-between ${viewMode === 'pdf' ? 'p-0' : 'p-3 sm:p-5'} rounded-2xl bg-black/5 dark:bg-black border border-black/10 dark:border-white/20 h-full overflow-hidden max-w-[500px] mx-auto w-full aspect-[148/210]`}>
                {viewMode === 'pdf' ? (
                  <div className="w-full h-full relative overflow-hidden rounded-2xl">
                    {renderPdfPageBody(singlePageData, currentPageNum)}
                  </div>
                ) : (
                  <>
                    <div className="border-b border-black/10 dark:border-white/20 pb-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-bold uppercase tracking-widest shrink-0">
                      <span>{section.shortTitle}</span>
                      <span>Strona PDF {currentPageNum} z 1460 (A5)</span>
                    </div>

                    <div className="my-auto py-1 flex-1 flex flex-col justify-between overflow-hidden">
                      {renderPdfPageBody(singlePageData, currentPageNum)}
                    </div>

                    <div className="border-t border-black/10 dark:border-white/20 pt-2 text-xs text-[#8a7867] dark:text-white flex justify-between shrink-0">
                      <span>Wydanie E-Book 365 Dni</span>
                      <span className="font-bold">Strona {currentPageNum}</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 h-full overflow-hidden items-center justify-center">
                {/* Left Zoomed Page 1:1 A5 */}
                <div className={`flex flex-col justify-between ${viewMode === 'pdf' ? 'p-0' : 'p-3 sm:p-5'} rounded-2xl bg-black/5 dark:bg-black border border-black/10 dark:border-white/20 h-full overflow-hidden aspect-[148/210]`}>
                  {viewMode === 'pdf' ? (
                    <div className="w-full h-full relative overflow-hidden rounded-l-2xl">
                      {renderPdfPageBody(leftPageData, leftPdfPageNum)}
                    </div>
                  ) : (
                    <>
                      <div className="border-b border-black/10 dark:border-white/20 pb-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-bold uppercase tracking-widest shrink-0">
                        <span>{section.shortTitle}</span>
                        <span>Strona PDF {leftPdfPageNum} z 1460 (A5)</span>
                      </div>

                      <div className="my-auto py-1 flex-1 flex flex-col justify-between overflow-hidden">
                        {renderPdfPageBody(leftPageData, leftPdfPageNum)}
                      </div>

                      <div className="border-t border-black/10 dark:border-white/20 pt-2 text-xs text-[#8a7867] dark:text-white flex justify-between shrink-0">
                        <span>Wydanie E-Book 365 Dni</span>
                        <span className="font-bold">Strona {leftPdfPageNum}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Right Zoomed Page 1:1 A5 */}
                <div className={`flex flex-col justify-between ${viewMode === 'pdf' ? 'p-0' : 'p-3 sm:p-5'} rounded-2xl bg-black/5 dark:bg-black border border-black/10 dark:border-white/20 h-full overflow-hidden aspect-[148/210]`}>
                  {viewMode === 'pdf' ? (
                    <div className="w-full h-full relative overflow-hidden rounded-r-2xl">
                      {renderPdfPageBody(rightPageData, rightPdfPageNum)}
                    </div>
                  ) : (
                    <>
                      <div className="border-b border-black/10 dark:border-white/20 pb-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-bold shrink-0">
                        <span>Dzień {rightPageData.dayNumber} z 365</span>
                        <span>Strona PDF {rightPdfPageNum} z 1460 (A5)</span>
                      </div>

                      <div className="my-auto py-1 flex-1 flex flex-col justify-between overflow-hidden">
                        {renderPdfPageBody(rightPageData, rightPdfPageNum)}
                      </div>

                      <div className="border-t border-black/10 dark:border-white/20 pt-2 text-xs text-[#8a7867] dark:text-white flex justify-between shrink-0">
                        <span className="font-bold">Strona {rightPdfPageNum}</span>
                        <span>{rightPageData.displayDate}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
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
              rhzEntry={getRhzEntryForDay(singlePageData.dayNumber)}
              theme={theme === 'dark' ? 'dark' : 'light'}
            />
          </div>
        </div>
      )}
    </div>
  );
};
