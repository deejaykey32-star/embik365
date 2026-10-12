import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, 
  Video, 
  Download, 
  Play, 
  Square, 
  Sparkles, 
  Check, 
  Radio, 
  Clock, 
  Volume2, 
  Layers,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  BookOpen,
  RotateCcw,
  List,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { 
  RADIO_STATIONS, 
  RadioStationId, 
  RadioStationMeta, 
  getRadioBroadcastItem, 
  RadioBroadcastItem 
} from '../utils/radioContentService';
import { 
  getLectorConfig, 
  LectorConfig, 
  concatenateAudioBuffers 
} from '../utils/audioLectorService';
import ysFixWebmDuration from 'fix-webm-duration';
import { 
  splitTextForTts, 
  calculateWordAcousticWeight,
  extractCleanWordsForKaraoke 
} from '../utils/polishSpeechNormalizer';

// In-memory client cache for decoded audio buffers to prevent repeated downloads
const clientTtsAudioCache = new Map<string, AudioBuffer>();

export interface TextPage {
  pageIndex: number;
  totalPages: number;
  startWordIdx: number;
  endWordIdx: number;
  words: string[];
}

/**
 * Dzieli daną sekcję/modlitwę na zwarte, samowystarczalne strony z pełnymi zdaniami,
 * które w 100% mieszczą się w polu widzenia ekranu bez ucinania i bez gwałtownego przewijania.
 */
export function getPagesForSection(
  sec: { startWordIdx: number; endWordIdx: number; title?: string },
  allWords: string[],
  maxWordsPerPage: number = 70
): TextPage[] {
  const clampedStart = Math.max(0, Math.min(sec.startWordIdx, allWords.length - 1));
  const clampedEnd = Math.max(clampedStart, Math.min(sec.endWordIdx, allWords.length - 1));
  const secWords = allWords.slice(clampedStart, clampedEnd + 1);
  const totalSecWords = secWords.length;

  if (totalSecWords === 0) {
    return [{
      pageIndex: 1,
      totalPages: 1,
      startWordIdx: clampedStart,
      endWordIdx: clampedEnd,
      words: []
    }];
  }

  // Jeśli modlitwa/sekcja mieści się w całości (np. Ojcze nasz, Zdrowaś Maryjo, Chwała Ojcu do ~85 słów),
  // zachowaj jako 1 kompletną stronę bez ucinania
  if (totalSecWords <= Math.min(85, maxWordsPerPage + 15)) {
    return [{
      pageIndex: 1,
      totalPages: 1,
      startWordIdx: clampedStart,
      endWordIdx: clampedEnd,
      words: secWords
    }];
  }

  const pages: TextPage[] = [];
  let curPageStart = 0;

  while (curPageStart < totalSecWords) {
    let candidateEnd = Math.min(totalSecWords - 1, curPageStart + maxWordsPerPage - 1);

    if (candidateEnd < totalSecWords - 1) {
      if (totalSecWords - 1 - candidateEnd < 25) {
        candidateEnd = totalSecWords - 1;
      } else {
        let bestBreak = -1;
        // Poszukiwanie naturalnego końca pełnego zdania (. ! ?)
        for (let offset = 0; offset <= 25; offset++) {
          const checkBack = candidateEnd - offset;
          if (checkBack > curPageStart + 30) {
            const w = secWords[checkBack];
            if (/[.!?][„”«»"']?$/.test(w) || /^[„”«»"']/.test(secWords[checkBack + 1] || '')) {
              bestBreak = checkBack;
              break;
            }
          }
          const checkForward = candidateEnd + offset;
          if (checkForward < totalSecWords - 1 && checkForward < curPageStart + maxWordsPerPage + 25) {
            const w = secWords[checkForward];
            if (/[.!?][„”«»"']?$/.test(w)) {
              bestBreak = checkForward;
              break;
            }
          }
        }
        // Fallback: poszukiwanie przecinka, średnika, dwukropka lub pauzy
        if (bestBreak === -1) {
          for (let offset = 0; offset <= 15; offset++) {
            const checkBack = candidateEnd - offset;
            if (checkBack > curPageStart + 30) {
              const w = secWords[checkBack];
              if (/[,;:\-—–][„”«»"']?$/.test(w)) {
                bestBreak = checkBack;
                break;
              }
            }
          }
        }
        if (bestBreak !== -1) {
          candidateEnd = bestBreak;
        }
      }
    }

    const pageSlice = secWords.slice(curPageStart, candidateEnd + 1);
    pages.push({
      pageIndex: pages.length + 1,
      totalPages: 1,
      startWordIdx: clampedStart + curPageStart,
      endWordIdx: clampedStart + candidateEnd,
      words: pageSlice
    });

    curPageStart = candidateEnd + 1;
  }

  pages.forEach(p => p.totalPages = pages.length);
  return pages;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  broadcastItem: RadioBroadcastItem;
  stationMeta?: RadioStationMeta;
  currentDayNumber?: number;
  totalDays?: number;
}

export const VideoYouTubeExportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  broadcastItem
}) => {
  const [selectedStationId, setSelectedStationId] = useState<RadioStationId>(broadcastItem.stationId || 'nowyrhz');
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(broadcastItem.dayNumber || 1);
  const [selectedBibliaYear, setSelectedBibliaYear] = useState<1 | 2 | 3 | 4>(1);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  const [resolution, setResolution] = useState<'1080p' | '720p'>('1080p');
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0); // 0 to 100
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [renderedBlob, setRenderedBlob] = useState<Blob | null>(null);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<string>('Gotowy do generowania');
  const [previewMode, setPreviewMode] = useState<'full' | 'sample'>('full');
  const [recordedDuration, setRecordedDuration] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const lastElapsedRef = useRef<number>(0);

  const lectorConfig = getLectorConfig();

  // Aktywna stacja i bezpieczny numer dnia
  const activeStation = RADIO_STATIONS.find(s => s.id === selectedStationId) || RADIO_STATIONS[0];
  const minDay = selectedStationId === 'nowyrhz' ? 0 : 1;
  const safeDayNumber = Math.max(minDay, Math.min(activeStation.totalDays, selectedDayNumber));
  const activeBroadcastItem: RadioBroadcastItem = useMemo(() => {
    return getRadioBroadcastItem(selectedStationId, safeDayNumber, selectedBibliaYear);
  }, [selectedStationId, safeDayNumber, selectedBibliaYear]);

  // Synchronizacja przy pierwszym otwarciu z props
  useEffect(() => {
    if (broadcastItem) {
      setSelectedStationId(broadcastItem.stationId);
      setSelectedDayNumber(broadcastItem.dayNumber);
    }
  }, [broadcastItem]);

  // Pełna lista wszystkich dni / tajemnic / wpisów dla wybranej stacji
  const allStationItems = useMemo(() => {
    const list: { day: number; title: string; subtitle: string; ref?: string }[] = [];
    const startDay = selectedStationId === 'nowyrhz' ? 0 : 1;
    for (let d = startDay; d <= activeStation.totalDays; d++) {
      const item = getRadioBroadcastItem(selectedStationId, d, selectedBibliaYear);
      list.push({
        day: d,
        title: item.headlineTitle,
        subtitle: item.subtitle,
        ref: item.reference
      });
    }
    return list;
  }, [selectedStationId, selectedBibliaYear, activeStation.totalDays]);

  // Filtrowana lista katalogu
  const filteredStationItems = useMemo(() => {
    if (!catalogSearch.trim()) return allStationItems;
    const q = catalogSearch.toLowerCase().trim();
    return allStationItems.filter(item => 
      item.day.toString().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      (item.ref && item.ref.toLowerCase().includes(q))
    );
  }, [allStationItems, catalogSearch]);

  // Wymiary Canvas na podstawie wybranej rozdzielczości
  const width = resolution === '1080p' ? 1920 : 1280;
  const height = resolution === '1080p' ? 1080 : 720;

  // Czyszczenie URL wideo przy unmount lub zmianie
  useEffect(() => {
    return () => {
      if (renderedVideoUrl) {
        URL.revokeObjectURL(renderedVideoUrl);
      }
      stopGeneration();
    };
  }, [renderedVideoUrl]);

  // Rysowanie klatki Canvas po każdej zmianie stacji, dnia, roku lub rozdzielczości
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      drawVideoFrame(0, 0);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          if (isOpen && canvasRef.current) {
            drawVideoFrame(0, 0);
          }
        }).catch(() => {});
      }
    }
  }, [isOpen, activeBroadcastItem, resolution]);

  /**
   * Rysuje klatkę wideo na Canvasie (Czarne tło, złote linie, nagłówki, napisy z podświetlonym słowem)
   */
  const drawVideoFrame = (activeWordIdx: number, elapsedSec: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 0. SŁOWA AUDYCJI I INTELIGENTNY PODZIAŁ NA SEKCJE ORAZ STRONY (100% CZYTELNOŚCI BEZ ZNIKANIA TEKSTU)
    const words = previewMode === 'sample' 
      ? activeBroadcastItem.words.slice(0, 45) 
      : activeBroadcastItem.words;
    const wordsTotal = words.length;

    const baseSections = (activeBroadcastItem.sections && activeBroadcastItem.sections.length > 0)
      ? activeBroadcastItem.sections
      : [{
          id: 'main',
          title: activeBroadcastItem.headlineTitle,
          type: 'general' as const,
          text: activeBroadcastItem.speechText,
          startWordIdx: 0,
          endWordIdx: Math.max(0, wordsTotal - 1)
        }];

    // W trybie próbki bezpiecznie przycinamy granice sekcji do pierwszych 45 słów
    const rawSections = previewMode === 'sample'
      ? baseSections
          .filter(s => s.startWordIdx < 45)
          .map(s => ({ ...s, endWordIdx: Math.min(s.endWordIdx, 44) }))
      : baseSections;

    const activeSec = rawSections.find(s => activeWordIdx >= s.startWordIdx && activeWordIdx <= s.endWordIdx)
      || (activeWordIdx >= wordsTotal - 1 ? rawSections[rawSections.length - 1] : rawSections[0]);

    const secPages = getPagesForSection(activeSec, words, 70);
    const activePage = secPages.find(p => activeWordIdx >= p.startWordIdx && activeWordIdx <= p.endWordIdx)
      || (activeWordIdx >= wordsTotal - 1 ? secPages[secPages.length - 1] : secPages[0]);

    // 1. GŁĘBOKIE CZARNE TŁO (standard YouTube)
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    // Subtelna poświata w tle (elegancka, sacralna winieta)
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 50,
      width / 2, height / 2, width * 0.7
    );
    gradient.addColorStop(0, '#10141d');
    gradient.addColorStop(0.6, '#080a0f');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 2. RAMKA GÓRNA & NAGŁÓWEK WIDEO (YouTube Header)
    // Złota linia dekoracyjna na górze
    ctx.fillStyle = activeStation.themeColor || '#d97706';
    ctx.fillRect(80, 70, width - 160, 3);

    // Etykieta stacji radiowej / sekcji
    ctx.font = `bold ${Math.round(height * 0.024)}px "Cinzel", "Times New Roman", serif`;
    ctx.fillStyle = '#f59e0b'; // Złoty bursztyn
    ctx.textAlign = 'left';
    ctx.fillText(`🔴 RADIO INTERNETOWE • ${activeBroadcastItem.stationName.toUpperCase()}`, 80, 60);

    // Znak wodny / Czas
    ctx.font = `600 ${Math.round(height * 0.02)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText(`widokinaraj.pl`, width - 80, 60);

    // Tytuł Dnia & Informacja nagłówkowa z bezpiecznym skalowaniem
    ctx.save();
    const maxHeaderW = width - 160;
    let titleFontSize = Math.round(height * 0.044);
    ctx.font = `bold ${titleFontSize}px "Cinzel", Georgia, serif`;
    const fullTitleText = `${activeBroadcastItem.displayDate} • ${activeBroadcastItem.headlineTitle}`;
    const titleWidth = ctx.measureText(fullTitleText).width;
    if (titleWidth > maxHeaderW) {
      titleFontSize = Math.max(Math.round(height * 0.024), Math.floor(titleFontSize * (maxHeaderW / titleWidth)));
      ctx.font = `bold ${titleFontSize}px "Cinzel", Georgia, serif`;
    }
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(fullTitleText, 80, 130);
    ctx.restore();

    // Podtytuł / Ścieżka / Źródło z bezpiecznym dopasowaniem
    ctx.save();
    let subFontSize = Math.round(height * 0.022);
    ctx.font = `500 ${subFontSize}px "Plus Jakarta Sans", sans-serif`;
    const subWidth = ctx.measureText(activeBroadcastItem.subtitle).width;
    if (subWidth > maxHeaderW) {
      subFontSize = Math.max(Math.round(height * 0.016), Math.floor(subFontSize * (maxHeaderW / subWidth)));
      ctx.font = `500 ${subFontSize}px "Plus Jakarta Sans", sans-serif`;
    }
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(activeBroadcastItem.subtitle, 80, 170);
    ctx.restore();

    // Cienka linia oddzielająca nagłówek od strefy napisów
    ctx.fillStyle = '#263040';
    ctx.fillRect(80, 195, width - 160, 2);

    // 2.5. WIZUALIZACJA POSTĘPU DZIESIĄTKA RÓŻAŃCA (dla RHZ365 i Nowy RHZ):
    // Duży okrąg (Rozważanie i Ojcze nasz) + 10 małych paciorków (Zdrowaś Maryjo ze wstawką) + Duży okrąg (Chwała Ojcu i O mój Jezu)
    const rosarySegments = activeBroadcastItem.rosarySegments;
    const hasRosary = Boolean(rosarySegments && rosarySegments.length > 0);
    let headerBottom = 200; // domyślna dolna krawędź nagłówka bez różańca

    if (hasRosary && rosarySegments) {
      const isDayZero = selectedStationId === 'nowyrhz' && activeBroadcastItem.dayNumber === 0;
      // Znajdź aktywny segment na podstawie czytanego słowa
      const activeSeg = rosarySegments.find(
        s => activeWordIdx >= s.startWordIdx && activeWordIdx <= s.endWordIdx
      ) || rosarySegments[0];
      const activeBeadNum = activeSeg.beadIndex; // 0..5 dla Tajemnicy 0, lub 0..11 dla dziesiątka

      const beadCenterY = Math.round(height * 0.245); // ~265px na 1080p
      const largeRadius = Math.round(height * 0.023); // ~25px na 1080p, ~16px na 720p
      const smallRadius = Math.round(height * 0.013); // ~14px na 1080p, ~9px na 720p

      const leftX = Math.round(width * 0.12);
      const rightX = Math.round(width * 0.88);

      // A. Złoty sznur łączący paciorki w tle
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
      ctx.lineWidth = Math.max(2, Math.round(height * 0.003));
      ctx.beginPath();
      ctx.moveTo(leftX, beadCenterY);
      ctx.lineTo(rightX, beadCenterY);
      ctx.stroke();

      if (isDayZero) {
        // =========================================================
        // WIZUALIZACJA DLA TAJEMNICY 0 (MODLITWY WSTĘPNE RÓŻAŃCA):
        // Krzyżyk + Duży (Ojcze nasz) + 3 Małe (Wiara, Nadzieja, Miłość) + Duży (Chwała Ojcu)
        // =========================================================
        const t0CruxX = leftX;
        const t0PaterX = Math.round(width * 0.31);
        const t0FaithX = Math.round(width * 0.48);
        const t0HopeX = Math.round(width * 0.60);
        const t0LoveX = Math.round(width * 0.72);
        const t0GloryX = rightX;

        // 1. KRZYŻYK: Znak Krzyża, Witaj Królowo, Wierzę w Boga
        const isCruxActive = activeBeadNum === 0;
        const isCruxDone = activeBeadNum > 0;
        ctx.save();
        if (isCruxActive) {
          ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 20;
          ctx.fillStyle = '#f59e0b'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
        } else if (isCruxDone) {
          ctx.fillStyle = '#059669'; ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2;
        } else {
          ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1.5;
        }
        ctx.beginPath();
        ctx.arc(t0CruxX, beadCenterY, isCruxActive ? largeRadius + 3 : largeRadius, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(largeRadius * 0.95)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(isCruxDone ? '✓' : '✝', t0CruxX, beadCenterY);
        ctx.restore();

        ctx.font = `bold ${Math.round(height * 0.015)}px "Cinzel", serif`;
        ctx.fillStyle = isCruxActive ? '#ffd700' : isCruxDone ? '#a7f3d0' : '#cbd5e1';
        ctx.textAlign = 'center';
        ctx.fillText('Krzyżyk • Wstęp', t0CruxX, beadCenterY + largeRadius + 18);

        // 2. DUŻY PACIOREK: Ojcze nasz
        const isPaterActive = activeBeadNum === 1;
        const isPaterDone = activeBeadNum > 1;
        ctx.save();
        if (isPaterActive) {
          ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 20;
          ctx.fillStyle = '#f59e0b'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
        } else if (isPaterDone) {
          ctx.fillStyle = '#059669'; ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2;
        } else {
          ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1.5;
        }
        ctx.beginPath();
        ctx.arc(t0PaterX, beadCenterY, isPaterActive ? largeRadius + 3 : largeRadius, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(largeRadius * 0.85)}px "Cinzel", serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(isPaterDone ? '✓' : 'I', t0PaterX, beadCenterY);
        ctx.restore();

        ctx.font = `bold ${Math.round(height * 0.015)}px "Cinzel", serif`;
        ctx.fillStyle = isPaterActive ? '#ffd700' : isPaterDone ? '#a7f3d0' : '#cbd5e1';
        ctx.textAlign = 'center';
        ctx.fillText('Ojcze nasz', t0PaterX, beadCenterY + largeRadius + 18);

        // 3. TRZY MAŁE PACIORKI: Wiara, Nadzieja, Miłość
        const t0SmallBeads = [
          { x: t0FaithX, num: 2, label: '1 • O wiarę', shortLabel: 'Wiara' },
          { x: t0HopeX, num: 3, label: '2 • O nadzieję', shortLabel: 'Nadzieja' },
          { x: t0LoveX, num: 4, label: '3 • O miłość', shortLabel: 'Miłość' }
        ];

        t0SmallBeads.forEach(b => {
          const isBeadActive = activeBeadNum === b.num;
          const isBeadDone = activeBeadNum > b.num;
          ctx.save();
          if (isBeadActive) {
            ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 18;
            ctx.fillStyle = '#f59e0b'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
          } else if (isBeadDone) {
            ctx.fillStyle = '#d97706'; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5;
          } else {
            ctx.fillStyle = '#141d2b'; ctx.strokeStyle = '#475569'; ctx.lineWidth = 1;
          }
          ctx.beginPath();
          ctx.arc(b.x, beadCenterY, isBeadActive ? smallRadius + 3 : smallRadius, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.round(smallRadius * 0.95)}px sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(isBeadDone ? '✓' : (b.num - 1).toString(), b.x, beadCenterY);
          ctx.restore();

          ctx.font = `bold ${Math.round(height * 0.014)}px sans-serif`;
          ctx.fillStyle = isBeadActive ? '#ffd700' : isBeadDone ? '#a7f3d0' : '#94a3b8';
          ctx.textAlign = 'center';
          ctx.fillText(b.shortLabel, b.x, beadCenterY + smallRadius + 18);
        });

        // 4. DUŻY PACIOREK: Chwała Ojcu
        const isGloryActive = activeBeadNum === 5;
        const isGloryDone = activeWordIdx >= wordsTotal - 1;
        ctx.save();
        if (isGloryActive) {
          ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 20;
          ctx.fillStyle = '#f59e0b'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
        } else if (isGloryDone) {
          ctx.fillStyle = '#059669'; ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2;
        } else {
          ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1.5;
        }
        ctx.beginPath();
        ctx.arc(t0GloryX, beadCenterY, isGloryActive ? largeRadius + 3 : largeRadius, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(largeRadius * 0.85)}px "Cinzel", serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(isGloryDone ? '✓' : '✨', t0GloryX, beadCenterY);
        ctx.restore();

        ctx.font = `bold ${Math.round(height * 0.015)}px "Cinzel", serif`;
        ctx.fillStyle = isGloryActive ? '#ffd700' : isGloryDone ? '#a7f3d0' : '#cbd5e1';
        ctx.textAlign = 'center';
        ctx.fillText('Chwała Ojcu', t0GloryX, beadCenterY + largeRadius + 18);

      } else {
        // =========================================================
        // WIZUALIZACJA DLA DNI 1..175 (DZIESIĄTEK RÓŻAŃCA):
        // Duży (Rozważanie + Ojcze nasz) + 10 Małych (Zdrowaś Maryjo) + Duży (Chwała Ojcu + Fatima)
        // =========================================================
        const smallStartX = Math.round(width * 0.22);
        const smallEndX = Math.round(width * 0.78);
        const smallStepX = (smallEndX - smallStartX) / 9;

        // B. PACIOREK 1 (DUŻY): Rozważanie i Ojcze nasz
        const isIntroDone = activeBeadNum > 0;
        const isIntroActive = activeBeadNum === 0;

        ctx.save();
        if (isIntroActive) {
          ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 20;
          ctx.fillStyle = '#f59e0b'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
        } else if (isIntroDone) {
          ctx.fillStyle = '#059669'; ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2;
        } else {
          ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1.5;
        }
        ctx.beginPath();
        ctx.arc(leftX, beadCenterY, isIntroActive ? largeRadius + 3 : largeRadius, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(largeRadius * 0.85)}px "Cinzel", Georgia, serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(isIntroDone ? '✓' : 'I', leftX, beadCenterY);
        ctx.restore();

        ctx.font = `bold ${Math.round(height * 0.016)}px "Cinzel", serif`;
        ctx.fillStyle = isIntroActive ? '#ffd700' : isIntroDone ? '#a7f3d0' : '#cbd5e1';
        ctx.textAlign = 'center';
        ctx.fillText(
          activeSec?.type === 'meditation'
            ? 'Rozważanie'
            : (activeSec?.id === 'our_father' ? 'Ojcze nasz' : (isIntroActive ? 'Rozważanie' : 'Rozważanie & Ojcze nasz')),
          leftX,
          beadCenterY + largeRadius + 18
        );

        // C. 10 MAŁYCH PACIORKÓW: Zdrowaś Maryjo ze wstawką
        for (let b = 1; b <= 10; b++) {
          const beadX = Math.round(smallStartX + (b - 1) * smallStepX);
          const isBeadDone = activeBeadNum > b;
          const isBeadActive = activeBeadNum === b;

          ctx.save();
          if (isBeadActive) {
            ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 18;
            ctx.fillStyle = '#f59e0b'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
          } else if (isBeadDone) {
            ctx.fillStyle = '#d97706'; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5;
          } else {
            ctx.fillStyle = '#141d2b'; ctx.strokeStyle = '#475569'; ctx.lineWidth = 1;
          }
          ctx.beginPath();
          ctx.arc(beadX, beadCenterY, isBeadActive ? smallRadius + 3 : smallRadius, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.round(smallRadius * 0.95)}px sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(isBeadDone ? '✓' : b.toString(), beadX, beadCenterY);
          ctx.restore();

          ctx.font = `600 ${Math.round(height * 0.013)}px sans-serif`;
          ctx.fillStyle = isBeadActive ? '#ffd700' : '#94a3b8';
          ctx.textAlign = 'center';
          ctx.fillText(`#${b}`, beadX, beadCenterY - smallRadius - 8);
        }

        // D. PACIOREK 2 (DUŻY): Chwała Ojcu i O mój Jezu
        const isConclDone = activeWordIdx >= wordsTotal - 1;
        const isConclActive = activeBeadNum === 11;

        ctx.save();
        if (isConclActive) {
          ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 20;
          ctx.fillStyle = '#f59e0b'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
        } else if (isConclDone) {
          ctx.fillStyle = '#059669'; ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2;
        } else {
          ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1.5;
        }
        ctx.beginPath();
        ctx.arc(rightX, beadCenterY, isConclActive ? largeRadius + 3 : largeRadius, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(largeRadius * 0.85)}px "Cinzel", Georgia, serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(isConclDone ? '✓' : 'II', rightX, beadCenterY);
        ctx.restore();

        ctx.font = `bold ${Math.round(height * 0.016)}px "Cinzel", serif`;
        ctx.fillStyle = isConclActive ? '#ffd700' : isConclDone ? '#a7f3d0' : '#cbd5e1';
        ctx.textAlign = 'center';
        ctx.fillText('Chwała Ojcu & O mój Jezu', rightX, beadCenterY + largeRadius + 18);
      }

      // E. BELKA INFORMACYJNA O AKTUALNYM PACIORKU
      const pillY = beadCenterY + largeRadius + 44;
      ctx.save();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.lineWidth = 1;
      const pillW = width - 180;
      const pillH = Math.round(height * 0.046);
      
      ctx.beginPath();
      ctx.roundRect(90, pillY, pillW, pillH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let pillFont = Math.round(height * 0.02);
      ctx.font = `bold ${pillFont}px "Cinzel", Georgia, serif`;
      ctx.fillStyle = '#ffd700';

      const pageSuffix = activePage && activePage.totalPages > 1
        ? ` • Część ${activePage.pageIndex}/${activePage.totalPages}`
        : '';

      let pillText = '';

      if (isDayZero) {
        if (activeSec?.id === 'sign_and_queen') {
          pillText = `✝️ Krok 1 • Znak Krzyża & Witaj Królowo`;
        } else if (activeSec?.id === 'sign_of_cross') {
          pillText = `✝️ Krok 1 • Znak Krzyża Świętego`;
        } else if (activeSec?.id === 'hail_holy_queen') {
          pillText = `👑 Krok 1 • Witaj Królowo`;
        } else if (activeSec?.id === 'credo') {
          pillText = `🛡️ Krok 1 • Wierzę w Boga Ojca${pageSuffix}`;
        } else if (activeSec?.id === 'our_father') {
          pillText = `🙏 Krok 2 • Ojcze nasz`;
        } else if (activeSec?.id === 'hail_mary_faith') {
          pillText = `🔵 Paciorek 1/3 • O Wiarę: „który przymnaża nam wiary”`;
        } else if (activeSec?.id === 'hail_mary_hope') {
          pillText = `🟢 Paciorek 2/3 • O Nadzieję: „który przymnaża nam nadziei”`;
        } else if (activeSec?.id === 'hail_mary_love') {
          pillText = `🔴 Paciorek 3/3 • O Miłość: „który przymnaża nam miłości”`;
        } else if (activeSec?.id === 'glory_be') {
          pillText = `✨ Krok 4 • Chwała Ojcu`;
        } else if (activeBeadNum === 0) {
          pillText = `✝️ Krok 1 • Modlitwy Wstępne Różańca Świętego`;
        } else if (activeBeadNum === 1) {
          pillText = `🙏 Krok 2 • Ojcze nasz`;
        } else {
          pillText = `✨ Modlitwy Wstępne Różańca Świętego`;
        }
      } else if (hasRosary) {
        if (activeSec?.id === 'meditation' || activeSec?.type === 'meditation') {
          pillText = `🕊️ Rozważanie Tajemnicy: ${activeBroadcastItem.headlineTitle}${pageSuffix}`;
        } else if (activeSec?.id === 'intro' || activeSec?.type === 'intro') {
          pillText = `ℹ️ ${activeBroadcastItem.subtitle || activeBroadcastItem.headlineTitle}${pageSuffix}`;
        } else if (activeSec?.id === 'scripture' || activeSec?.type === 'scripture') {
          pillText = `📖 Słowo Boże • ${activeBroadcastItem.headlineTitle}${pageSuffix}`;
        } else if (activeSec?.id === 'our_father') {
          pillText = `🙏 Krok 1 • Ojcze nasz`;
        } else if (activeBeadNum >= 1 && activeBeadNum <= 10) {
          const ins = activeSeg?.insertion ? `„${activeSeg.insertion}”` : '';
          pillText = `📿 Paciorek ${activeBeadNum}/10 • Zdrowaś Maryjo ze wstawką: ${ins}`;
        } else if (activeSec?.id === 'glory_and_fatima') {
          pillText = `✨ Krok 11 • Chwała Ojcu & O mój Jezu`;
        } else if (activeSec?.id === 'glory_be') {
          pillText = `✨ Krok 11 • Chwała Ojcu`;
        } else if (activeSec?.id === 'fatima') {
          pillText = `🕊️ Krok 12 • O mój Jezu`;
        } else if (activeSec?.id === 'sub_tuum') {
          pillText = `🛡️ Modlitwa na Zakończenie Różańca • Pod Twoją obronę`;
        } else if (activeSec?.type === 'conclusion') {
          pillText = `🕊️ Modlitwa na Zakończenie${pageSuffix}`;
        } else {
          pillText = `📿 Dziesiątek Różańca Świętego`;
        }
      } else {
        pillText = `📖 ${activeSec?.title || 'Czytanie'} • ${activeBroadcastItem.headlineTitle}${pageSuffix}`;
      }

      const pW = ctx.measureText(pillText).width;
      if (pW > pillW - 30) {
        pillFont = Math.max(Math.round(height * 0.014), Math.floor(pillFont * ((pillW - 30) / pW)));
        ctx.font = `bold ${pillFont}px "Cinzel", Georgia, serif`;
      }
      ctx.fillText(pillText, width / 2, pillY + pillH / 2);
      ctx.restore();

      headerBottom = pillY + pillH; // Dolna krawędź nagłówka różańca (~384px na 1080p)
    } else {
      // Belka informacyjna dla czytań biblijnych (Biblia365) i wpisów (Widoki na Raj)
      const pillY = 215;
      const pillW = width - 180;
      const pillH = Math.round(height * 0.046);

      ctx.save();
      ctx.fillStyle = selectedStationId === 'biblia365' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(2, 132, 199, 0.15)';
      ctx.strokeStyle = selectedStationId === 'biblia365' ? 'rgba(16, 185, 129, 0.45)' : 'rgba(2, 132, 199, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(90, pillY, pillW, pillH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let pillFont = Math.round(height * 0.020);
      ctx.font = `bold ${pillFont}px "Cinzel", Georgia, serif`;
      ctx.fillStyle = selectedStationId === 'biblia365' ? '#34d399' : '#38bdf8';

      const pageSuffix = activePage && activePage.totalPages > 1
        ? ` • Część ${activePage.pageIndex}/${activePage.totalPages}`
        : '';

      const pillText = selectedStationId === 'biblia365'
        ? `📖 Pismo Święte & Apokryfy • ${activeBroadcastItem.headlineTitle}${pageSuffix}`
        : `🕊️ Widoki na Raj 365 • Refleksja duchowa • ${activeBroadcastItem.headlineTitle}${pageSuffix}`;

      const pW = ctx.measureText(pillText).width;
      if (pW > pillW - 30) {
        pillFont = Math.max(Math.round(height * 0.015), Math.floor(pillFont * ((pillW - 30) / pW)));
        ctx.font = `bold ${pillFont}px "Cinzel", Georgia, serif`;
      }
      ctx.fillText(pillText, width / 2, pillY + pillH / 2);
      ctx.restore();

      headerBottom = pillY + pillH;
    }

    // 3. STREFA NAPISÓW Z EFEKTEM KARAOKE & INTELIGENTNYM STRONICOWANIEM BEZ ZNIKANIA TEKSTU
    if (wordsTotal > 0) {
      const maxTextWidth = Math.round(width * 0.88);
      const minHeaderGap = Math.round(height * (hasRosary ? 0.030 : 0.036));
      const footerTop = height - 87; // Krawędź górna stopki YouTube
      const bottomPadding = Math.round(height * 0.020);

      const zoneTop = headerBottom + minHeaderGap;
      const zoneBottom = footerTop - bottomPadding;
      const zoneHeight = Math.max(160, zoneBottom - zoneTop);

      interface WordToken {
        text: string;
        wordIdx: number;
        width: number;
      }
      interface LineItem {
        tokens: WordToken[];
        hasActiveWord: boolean;
        isParagraphEnd?: boolean;
      }

      // INTELIGENTNE STRONICOWANIE:
      // Każda strona (lub cała modlitwa) mieści się w całości w strefie napisów!
      // Wyświetlamy dokładnie słowa bieżącej strony (activePage.words) wyśrodkowane w pionie.
      // Żadne słowo ani zdanie nie znika przed, w trakcie ani po przeczytaniu!
      const effectiveWordTexts = activePage.words;
      const effectiveStartIdx = activePage.startWordIdx;

      const lineBreakIndicesSet = new Set(activeBroadcastItem.lineBreakWordIndices || []);
      const FONT_FAMILY = '"Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

      const buildLinesForSection = (fSize: number) => {
        ctx.save();
        ctx.font = `600 ${fSize}px ${FONT_FAMILY}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const spaceW = Math.max(Math.ceil(ctx.measureText(' ').width) + 3, Math.round(fSize * 0.30));
        const builtLines: LineItem[] = [];
        let curLineTokens: WordToken[] = [];
        let curWordsWidth = 0;

        for (let i = 0; i < effectiveWordTexts.length; i++) {
          const globalIdx = effectiveStartIdx + i;
          const wordText = effectiveWordTexts[i];
          const isExplicitLineBreak = i > 0 && lineBreakIndicesSet.has(globalIdx);

          if (isExplicitLineBreak && curLineTokens.length > 0) {
            builtLines.push({
              tokens: curLineTokens,
              hasActiveWord: curLineTokens.some(t => t.wordIdx === activeWordIdx),
              isParagraphEnd: true
            });
            curLineTokens = [];
            curWordsWidth = 0;
          }

          const wordW = Math.ceil(ctx.measureText(wordText).width) + 2;
          const gapsCount = curLineTokens.length;
          const testLineWidth = curWordsWidth + wordW + gapsCount * spaceW;

          if (testLineWidth > maxTextWidth && curLineTokens.length > 0) {
            builtLines.push({
              tokens: curLineTokens,
              hasActiveWord: curLineTokens.some(t => t.wordIdx === activeWordIdx),
              isParagraphEnd: false
            });
            curLineTokens = [];
            curWordsWidth = 0;
          }

          curLineTokens.push({ text: wordText, wordIdx: globalIdx, width: wordW });
          curWordsWidth += wordW;
        }

        if (curLineTokens.length > 0) {
          builtLines.push({
            tokens: curLineTokens,
            hasActiveWord: curLineTokens.some(t => t.wordIdx === activeWordIdx),
            isParagraphEnd: true
          });
        }

        ctx.restore();
        return { builtLines, spaceW };
      };

      // DYNAMICZNY, ELEGANCKI ROZMIAR CZCIONKI DLA DANEJ STRONY:
      let baseFontSize = Math.round(height * (hasRosary ? 0.034 : 0.032));
      if (effectiveWordTexts.length <= 40) {
        baseFontSize = Math.round(height * (hasRosary ? 0.038 : 0.036));
      } else if (effectiveWordTexts.length <= 70) {
        baseFontSize = Math.round(height * (hasRosary ? 0.033 : 0.031));
      } else {
        baseFontSize = Math.round(height * (hasRosary ? 0.028 : 0.027));
      }

      let renderFontSize = baseFontSize;
      let renderLineHeight = Math.round(renderFontSize * 1.44);

      let { builtLines: sectionLines, spaceW: standardSpaceWidth } = buildLinesForSection(renderFontSize);

      // Pętla dynamicznego dopasowywania – gwarancja zmieszczenia wszystkich linii strony w pionie
      const maxAllowedBlockH = zoneHeight - 20;
      while (sectionLines.length * renderLineHeight > maxAllowedBlockH && renderFontSize > 15) {
        renderFontSize -= 1;
        renderLineHeight = Math.round(renderFontSize * 1.40);
        const recomputed = buildLinesForSection(renderFontSize);
        sectionLines = recomputed.builtLines;
        standardSpaceWidth = recomputed.spaceW;
      }

      if (sectionLines.length * renderLineHeight > maxAllowedBlockH) {
        renderLineHeight = Math.max(16, Math.floor(maxAllowedBlockH / Math.max(1, sectionLines.length)));
      }

      const totalBlockHeight = sectionLines.length * renderLineHeight;
      // Strona jest zawsze idealnie wyśrodkowana w pionie z auto-śledzeniem aktywnego słowa
      let baseStartY: number;
      if (totalBlockHeight <= zoneHeight) {
        baseStartY = zoneTop + Math.max(0, Math.round((zoneHeight - totalBlockHeight) / 2));
      } else {
        let activeLineIdx = sectionLines.findIndex(l => l.hasActiveWord);
        if (activeLineIdx === -1) activeLineIdx = 0;
        const centerTarget = zoneTop + Math.round(zoneHeight / 2);
        const activeLineCenter = activeLineIdx * renderLineHeight + Math.round(renderLineHeight / 2);
        baseStartY = centerTarget - activeLineCenter;
        baseStartY = Math.max(zoneBottom - totalBlockHeight, Math.min(zoneTop, baseStartY));
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(30, zoneTop - 6, width - 60, zoneHeight + 12);
      ctx.clip();

      sectionLines.forEach((line, lineIndex) => {
        const lineY = baseStartY + lineIndex * renderLineHeight + Math.round(renderLineHeight / 2);
        const N = line.tokens.length;
        if (N === 0) return;

        const totalWordsW = line.tokens.reduce((acc, t) => acc + t.width, 0);
        const isJustified = !line.isParagraphEnd && N > 1;
        const spaceBetweenWords = isJustified
          ? Math.max(standardSpaceWidth, Math.min((maxTextWidth - totalWordsW) / (N - 1), standardSpaceWidth * 2.5))
          : standardSpaceWidth;

        // Jeśli cała strona to 1 linijka, wyśrodkuj ją w poziomie dla podniosłego wyglądu
        const lineContentW = totalWordsW + (N - 1) * spaceBetweenWords;
        const lineStartX = (sectionLines.length === 1 && !isJustified)
          ? Math.round((width - lineContentW) / 2)
          : Math.round((width - maxTextWidth) / 2);

        let curX = lineStartX;

        for (let tIdx = 0; tIdx < N; tIdx++) {
          const token = line.tokens[tIdx];
          const isCurrent = token.wordIdx === activeWordIdx;
          const isSpoken = token.wordIdx < activeWordIdx;
          const tokenX = curX;

          ctx.save();
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.font = `600 ${renderFontSize}px ${FONT_FAMILY}`;

          if (isCurrent) {
            // EFEKT KARAOKE: Złoty badge z wyrazistym kontrastem
            const padX = Math.min(Math.round(standardSpaceWidth * 0.35), 8);
            const bgH = Math.round(renderFontSize * 1.28);
            const bgX = tokenX - padX;
            const bgY = Math.round(lineY - bgH / 2);
            const bgW = token.width + padX * 2;

            ctx.fillStyle = 'rgba(217, 119, 6, 0.45)';
            ctx.beginPath();
            ctx.roundRect(bgX, bgY, bgW, bgH, 8);
            ctx.fill();

            ctx.strokeStyle = 'rgba(251, 191, 36, 0.95)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fillStyle = '#fef08a';
            ctx.fillText(token.text, tokenX, lineY);
          } else if (isSpoken) {
            // PRZECZYTANE SŁOWO: 100% Czysta Biel, kontrastowe i wyraźne
            ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(token.text, tokenX, lineY);
          } else {
            // SŁOWO DO PRZECZYTANIA: Elegancki, czytelny slate-300
            ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
            ctx.shadowBlur = 2;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.fillStyle = '#cbd5e1';
            ctx.fillText(token.text, tokenX, lineY);
          }
          ctx.restore();

          curX = tokenX + token.width + spaceBetweenWords;
        }
      });

      ctx.restore(); // Przywrócenie stanu przed clip()
      ctx.shadowBlur = 0;
    } else {
      // Bezpieczny komunikat w przypadku braku słów
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `600 ${Math.round(height * 0.026)}px "Cinzel", Georgia, serif`;
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Wybierz dzień lub tajemnicę z katalogu powyżej', width / 2, height / 2);
      ctx.restore();
    }

    // 4. STOPKA WIDEO & PASEK STATUSU YOUTUBE
    ctx.fillStyle = '#0d131f';
    ctx.fillRect(0, height - 85, width, 85);
    ctx.fillStyle = activeStation.themeColor || '#d97706';
    ctx.fillRect(0, height - 87, width, 2);

    // Złota ikona różańca / radia po lewej
    ctx.font = `bold ${Math.round(height * 0.022)}px "Cinzel", serif`;
    ctx.fillStyle = '#d97706';
    ctx.textAlign = 'left';
    ctx.fillText(`✨ DROGA365 • WIDOKI NA RAJ • RHZ • BIBLIA`, 80, height - 38);

    // Dynamiczny wskaźnik słów i czasu po prawej
    ctx.font = `500 ${Math.round(height * 0.02)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    const currentProgressPercent = wordsTotal > 0 ? Math.round((Math.min(activeWordIdx + 1, wordsTotal) / wordsTotal) * 100) : 0;
    const pageStatus = activePage && activePage.totalPages > 1 ? ` • Część ${activePage.pageIndex}/${activePage.totalPages}` : '';
    ctx.fillText(
      `Dzień ${activeBroadcastItem.dayNumber}/${activeStation.totalDays}${pageStatus} • Słowo ${Math.min(activeWordIdx + 1, wordsTotal)}/${wordsTotal} (${currentProgressPercent}%) • Lektor AI TTS`,
      width - 80,
      height - 38
    );
  };

  /**
   * Rozpoczyna generowanie wideo MP4 z lektorem TTS i animacją karaoke.
   * Pobiera pełny wieloczęściowy strumień audio Lektora AI, dekoduje każdy fragment
   * i bezstratnie łączy w pełną ścieżkę dźwiękową o dokładnym czasie trwania.
   */
  const handleStartRecording = async () => {
    if (isRecording) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsRecording(true);
    setRecordProgress(0);
    setCurrentWordIndex(0);
    setRenderedBlob(null);
    if (renderedVideoUrl) {
      URL.revokeObjectURL(renderedVideoUrl);
      setRenderedVideoUrl(null);
    }
    setRecordingStatus('Pobieranie pełnej ścieżki dźwiękowej Lektora AI (TTS)...');

    try {
      // 0. Upewnienie się, że wszystkie czcionki webowe są w pełni załadowane przed rysowaniem klatek
      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch (e) {
          // ignore font load warning
        }
      }

      // 1. Wybór słów docelowych
      const targetWords = previewMode === 'sample' 
        ? activeBroadcastItem.words.slice(0, 45) 
        : activeBroadcastItem.words;
      const wordsTotal = targetWords.length;

      // 2. Przygotowanie AudioContext i audio destination node
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;
      const audioDest = audioCtx.createMediaStreamDestination();

      // Pomocnik do pobrania audio dla pojedynczego fragmentu z /api/tts oraz bezpośredniego fallbacku
      const fetchAudioForText = async (txt: string): Promise<AudioBuffer | null> => {
        const clean = txt.trim();
        if (!clean) return null;

        const cacheKey = `${lectorConfig.rate || 1.0}:${clean.toLowerCase()}`;
        const cached = clientTtsAudioCache.get(cacheKey);
        if (cached) return cached;

        // A. Próba przez API /api/tts z format: 'json' i wielokrotnym ponawianiem
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const ttsRes = await fetch('/api/tts', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                text: clean,
                lang: 'pl',
                rate: lectorConfig.rate || 1.0,
                pitch: lectorConfig.pitch || 1.0,
                format: 'json'
              })
            });

            if (ttsRes.ok) {
              const contentType = ttsRes.headers.get('content-type') || '';
              if (contentType.includes('application/json')) {
                const data = await ttsRes.json();
                if (data && Array.isArray(data.chunks) && data.chunks.length > 0) {
                  const decodedList: AudioBuffer[] = [];
                  for (let cIdx = 0; cIdx < data.chunks.length; cIdx++) {
                    const b64 = data.chunks[cIdx];
                    let decoded: AudioBuffer | null = null;
                    try {
                      const bin = atob(b64);
                      const bytes = new Uint8Array(bin.length);
                      for (let j = 0; j < bin.length; j++) bytes[j] = bin.charCodeAt(j);
                      if (bytes.length > 64) {
                        decoded = await audioCtx.decodeAudioData(bytes.buffer.slice(0));
                      }
                    } catch (eDec) {
                      console.warn('Decode chunk warning:', eDec);
                    }
                    if (!decoded) {
                      const fallbackText = data.textChunks?.[cIdx] || '';
                      const wordsCnt = fallbackText.split(/\s+/).filter(Boolean).length || 5;
                      const fallbackDuration = Math.max(1.0, wordsCnt * 0.44);
                      decoded = audioCtx.createBuffer(1, Math.round(audioCtx.sampleRate * fallbackDuration), audioCtx.sampleRate);
                    }
                    decodedList.push(decoded);
                  }
                  if (decodedList.length > 0) {
                    const combined = concatenateAudioBuffers(audioCtx, decodedList);
                    if (combined) {
                      clientTtsAudioCache.set(cacheKey, combined);
                      return combined;
                    }
                  }
                }
              } else {
                const arrBuf = await ttsRes.arrayBuffer();
                if (arrBuf && arrBuf.byteLength > 64) {
                  const decoded = await audioCtx.decodeAudioData(arrBuf);
                  if (decoded) {
                    clientTtsAudioCache.set(cacheKey, decoded);
                    return decoded;
                  }
                }
              }
            }
          } catch (errApi) {
            console.warn(`API /api/tts attempt ${attempt} failed:`, errApi);
          }
          if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 120));
        }

        // B. Rezerwowe bezpośrednie pobranie z Google TTS
        try {
          const subChunks = splitTextForTts(clean, 140);
          const decodedDirectList: AudioBuffer[] = [];

          for (const sub of subChunks) {
            let chunkBuf: AudioBuffer | null = null;
            for (let att = 1; att <= 2; att++) {
              try {
                const directUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(sub)}&tl=pl&client=tw-ob`;
                const directRes = await fetch(directUrl);
                if (directRes.ok) {
                  const arrBuf = await directRes.arrayBuffer();
                  if (arrBuf.byteLength > 64) {
                    chunkBuf = await audioCtx.decodeAudioData(arrBuf);
                    break;
                  }
                }
              } catch (eDir) {
                console.warn(`Direct fetch attempt ${att} failed:`, eDir);
              }
              if (att < 2) await new Promise(r => setTimeout(r, 80));
            }
            if (chunkBuf) {
              decodedDirectList.push(chunkBuf);
            }
          }

          if (decodedDirectList.length > 0) {
            const combined = concatenateAudioBuffers(audioCtx, decodedDirectList);
            if (combined) {
              clientTtsAudioCache.set(cacheKey, combined);
              return combined;
            }
          }
        } catch (errDirect) {
          console.warn('Direct fallback failed:', errDirect);
        }

        return null;
      };

      let audioBuffer: AudioBuffer | null = null;
      const wordTimings: { wordIdx: number; start: number; end: number }[] = [];

      if (previewMode === 'sample') {
        setRecordingStatus('Pobieranie próbki głosu Lektora AI (45 słów)...');
        const sampleText = targetWords.join(' ');
        audioBuffer = await fetchAudioForText(sampleText);
        const totalDuration = audioBuffer ? audioBuffer.duration : 18;

        const weights = targetWords.map((w, idx) => calculateWordAcousticWeight(w, idx === targetWords.length - 1));
        const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
        let acc = 0;
        for (let i = 0; i < targetWords.length; i++) {
          const start = (acc / totalWeight) * totalDuration;
          acc += weights[i];
          const end = (acc / totalWeight) * totalDuration;
          wordTimings.push({ wordIdx: i, start, end });
        }
      } else {
        // PEŁNA AUDYCJA: Pobieranie sekcja po sekcji
        const sectionsToProcess = (activeBroadcastItem.sections && activeBroadcastItem.sections.length > 0)
          ? activeBroadcastItem.sections
          : [{ id: 'full', title: 'Całość audycji', type: 'meditation' as const, text: activeBroadcastItem.speechText, startWordIdx: 0, endWordIdx: wordsTotal - 1 }];

        const allSectionBuffers: AudioBuffer[] = [];
        let currentTimelineOffset = 0;

        for (let sIdx = 0; sIdx < sectionsToProcess.length; sIdx++) {
          const sec = sectionsToProcess[sIdx];
          setRecordingStatus(`Pobieranie głosu Lektora: ${sec.title} (${sIdx + 1}/${sectionsToProcess.length})...`);

          let secAudio: AudioBuffer | null = null;

          if (sec.text.length > 400) {
            const subTexts = splitTextForTts(sec.text, 130);
            const subBuffers: AudioBuffer[] = [];
            for (const sub of subTexts) {
              let buf = await fetchAudioForText(sub);
              if (!buf) {
                const wCount = sub.split(/\s+/).filter(Boolean).length || 5;
                const dur = Math.max(1.2, wCount * 0.44);
                buf = audioCtx.createBuffer(1, Math.round(audioCtx.sampleRate * dur), audioCtx.sampleRate);
              }
              subBuffers.push(buf);
            }
            if (subBuffers.length > 0) {
              secAudio = concatenateAudioBuffers(audioCtx, subBuffers);
            }
          } else {
            secAudio = await fetchAudioForText(sec.text);
          }

          const secWords = targetWords.slice(sec.startWordIdx, sec.endWordIdx + 1);
          const wordsCountInSec = secWords.length;

          if (!secAudio) {
            const fallbackDuration = Math.max(1.5, wordsCountInSec * 0.44);
            secAudio = audioCtx.createBuffer(1, Math.round(audioCtx.sampleRate * fallbackDuration), audioCtx.sampleRate);
          }

          allSectionBuffers.push(secAudio);
          const secDuration = secAudio.duration;

          if (wordsCountInSec > 0) {
            const weights = secWords.map((w, idx) => calculateWordAcousticWeight(w, idx === wordsCountInSec - 1));
            const totalSecWeight = weights.reduce((a, b) => a + b, 0) || 1;
            let accSecWeight = 0;

            for (let w = 0; w < wordsCountInSec; w++) {
              const globalIdx = sec.startWordIdx + w;
              const wStart = currentTimelineOffset + (accSecWeight / totalSecWeight) * secDuration;
              accSecWeight += weights[w];
              const wEnd = currentTimelineOffset + (accSecWeight / totalSecWeight) * secDuration;

              wordTimings.push({
                wordIdx: globalIdx,
                start: wStart,
                end: Math.min(currentTimelineOffset + secDuration, wEnd)
              });
            }
          }

          currentTimelineOffset += secDuration;
          if (sIdx + 1 < sectionsToProcess.length) {
            await new Promise(r => setTimeout(r, 35));
          }
        }

        // Dopełnienie ewentualnych brakujących słów poza sekcjami
        let highestWordIdx = wordTimings.length > 0 ? Math.max(...wordTimings.map(t => t.wordIdx)) : -1;
        while (highestWordIdx + 1 < targetWords.length) {
          highestWordIdx++;
          wordTimings.push({
            wordIdx: highestWordIdx,
            start: currentTimelineOffset,
            end: currentTimelineOffset + 0.15
          });
        }
        wordTimings.sort((a, b) => a.wordIdx - b.wordIdx);

        if (allSectionBuffers.length > 0) {
          audioBuffer = concatenateAudioBuffers(audioCtx, allSectionBuffers);
        }
      }

      // 4. Połączenie strumienia wideo z Canvasu oraz audio z AudioContext
      const canvasStream = canvas.captureStream(30);
      const combinedTracks = [
        ...canvasStream.getVideoTracks(),
        ...audioDest.stream.getAudioTracks()
      ];
      const combinedStream = new MediaStream(combinedTracks);

      // 5. Konfiguracja MediaRecorder dla YouTube (VP9/Opus w WebM z łatką EBML Duration)
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        mimeType = 'video/webm;codecs=vp9,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        mimeType = 'video/webm;codecs=vp8,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      } else if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')) {
        mimeType = 'video/mp4;codecs=avc1,mp4a.40.2';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: resolution === '1080p' ? 6000000 : 3000000
      });
      mediaRecorderRef.current = recorder;

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const finalAudioDuration = audioBuffer ? audioBuffer.duration : Math.max(20, wordsTotal * 0.44);
      const totalDuration = finalAudioDuration;
      setRecordedDuration(finalAudioDuration);

      recorder.onstop = async () => {
        const rawBlob = new Blob(chunks, { type: mimeType });
        let finalBlob = rawBlob;

        // Jeśli format to WebM, wstrzykujemy precyzyjny nagłówek Duration (EBML):
        const effectiveDurationSec = finalAudioDuration || lastElapsedRef.current || 1;
        const actualDurationMs = Math.round(effectiveDurationSec * 1000);
        setRecordedDuration(effectiveDurationSec);

        if (mimeType.includes('webm')) {
          try {
            finalBlob = await new Promise<Blob>((resolve) => {
              ysFixWebmDuration(rawBlob, actualDurationMs, (fixed: Blob) => {
                resolve(fixed);
              });
            });
          } catch (fixErr) {
            console.warn('fixWebmDuration warning:', fixErr);
          }
        }

        setRenderedBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);
        setRenderedVideoUrl(url);
        setIsRecording(false);
        setRecordProgress(100);
        setRecordingStatus('✅ Wideo z lektorem i pełnym czasem trwania gotowe do pobrania!');
      };

      // 7. Uruchomienie odtwarzania ścieżki lektora i rejestracji
      if (audioBuffer) {
        setRecordingStatus('Trwa nagrywanie wideo z pełnym głosem Lektora AI i synchronizacją słów...');

        const sourceNode = audioCtx.createBufferSource();
        sourceNode.buffer = audioBuffer;
        activeAudioSourceRef.current = sourceNode;

        // Dźwięk trafia ZARÓWNO do pliku wideo (audioDest), jak i do odsłuchu na głośnikach (destination)
        sourceNode.connect(audioDest);
        sourceNode.connect(audioCtx.destination);

        recorder.start(100);
        sourceNode.start(0);
        const startAudioTime = audioCtx.currentTime;

        const renderLoop = () => {
          if (!recorder || recorder.state !== 'recording') return;
          const elapsed = Math.max(0, audioCtx.currentTime - startAudioTime);
          lastElapsedRef.current = elapsed;
          
          let activeIdx = 0;
          for (let i = 0; i < wordTimings.length; i++) {
            if (elapsed >= wordTimings[i].start) {
              activeIdx = wordTimings[i].wordIdx;
            } else {
              break;
            }
          }
          if (elapsed >= totalDuration && wordTimings.length > 0) {
            activeIdx = wordsTotal - 1;
          }

          setCurrentWordIndex(activeIdx);
          drawVideoFrame(activeIdx, elapsed);

          const progress = Math.min(99, Math.round((elapsed / totalDuration) * 100));
          setRecordProgress(progress);

          if (elapsed < totalDuration) {
            animationFrameRef.current = requestAnimationFrame(renderLoop);
          } else {
            setTimeout(() => {
              if (recorder.state === 'recording') {
                recorder.stop();
              }
            }, 1000);
          }
        };

        animationFrameRef.current = requestAnimationFrame(renderLoop);
      } else {
        // Fallback: symulacja z syntetyczną ścieżką w przypadku braku połączenia
        setRecordingStatus('Generowanie wideo w trybie syntezy autonomicznej...');
        const wordsDurationSec = Math.max(20, wordsTotal * 0.44);
        recorder.start(100);
        const startTime = Date.now();

        const renderLoopFallback = () => {
          if (!recorder || recorder.state !== 'recording') return;
          const elapsed = (Date.now() - startTime) / 1000;
          lastElapsedRef.current = elapsed;
          const progress = Math.min(99, Math.round((elapsed / wordsDurationSec) * 100));
          setRecordProgress(progress);

          let activeIdx = 0;
          for (let i = 0; i < wordTimings.length; i++) {
            if (elapsed >= wordTimings[i].start) {
              activeIdx = wordTimings[i].wordIdx;
            } else {
              break;
            }
          }
          if (elapsed >= wordsDurationSec && wordTimings.length > 0) {
            activeIdx = wordsTotal - 1;
          }

          setCurrentWordIndex(activeIdx);
          drawVideoFrame(activeIdx, elapsed);

          if (elapsed < wordsDurationSec) {
            animationFrameRef.current = requestAnimationFrame(renderLoopFallback);
          } else {
            setTimeout(() => {
              if (recorder.state === 'recording') {
                recorder.stop();
              }
            }, 1000);
          }
        };

        animationFrameRef.current = requestAnimationFrame(renderLoopFallback);
      }

    } catch (err: any) {
      console.error('Błąd rejestracji wideo:', err);
      setIsRecording(false);
      setRecordingStatus(`Błąd nagrywania: ${err.message || err}`);
    }
  };

  /**
   * Zatrzymanie generowania i reset klatki
   */
  const stopGeneration = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (activeAudioSourceRef.current) {
      try {
        activeAudioSourceRef.current.stop();
      } catch {}
      activeAudioSourceRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    setIsRecording(false);
  };

  /**
   * Pobranie wygenerowanego pliku MP4 dla YouTube
   */
  const handleDownloadVideo = () => {
    if (!renderedVideoUrl) return;

    const isMp4 = renderedBlob?.type.includes('mp4');
    const ext = isMp4 ? 'mp4' : 'webm';
    const safeTitle = (activeBroadcastItem.headlineTitle || 'video')
      .toLowerCase()
      .replace(/[^a-z0-9а-яąęćłńóśźż]+/gi, '_')
      .slice(0, 40);
    const filename = `youtube_${activeBroadcastItem.stationId}_dzien_${activeBroadcastItem.dayNumber}_${safeTitle}.${ext}`;

    const a = document.createElement('a');
    a.href = renderedVideoUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#0c121d] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 my-auto max-h-[96dvh]">
        
        {/* Header Modala */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#172338] via-[#111a2a] to-[#0c121d] border-b border-amber-500/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-sm shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-serif-book text-white">
                  Generator Wideo YouTube MP4 z Napisami Karaoke
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-600/30 border border-red-500/40 text-red-300 font-bold uppercase">
                  Wszystkie Dni & Tajemnice
                </span>
              </div>
              <p className="text-xs text-amber-200/80">
                Wybierz dowolną stację i dowolny dzień (1 do 365) • Lektor AI TTS • Czarne tło YouTube
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopGeneration();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            title="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ciało Modala */}
        <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          
          {/* 1. SELEKTOR STACJI RADIOWEJ */}
          <div className="p-3 bg-[#111827] rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Radio className="w-3.5 h-3.5" />
                <span>1. Wybierz stację / dział do eksportu:</span>
              </div>
              <span className="text-[11px] text-slate-400 lowercase font-normal font-mono">
                {activeStation.totalDays} dni w serii
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {RADIO_STATIONS.map((st) => {
                const isSelected = selectedStationId === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      if (isRecording) return;
                      setSelectedStationId(st.id);
                      setSelectedDayNumber(1);
                      setIsCatalogOpen(false);
                    }}
                    disabled={isRecording}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-600/20 border-amber-500 text-white shadow-md ring-1 ring-amber-400/50'
                        : 'bg-[#0b1019] hover:bg-[#151f30] border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold truncate">{st.shortName}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {st.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. PRECYZYJNY WYBÓR DOWOLNEGO DNIA / TAJEMNICY / WPISU */}
          <div className="p-3 bg-[#141e30] rounded-2xl border border-amber-500/25 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>2. Wybierz dowolny dzień, wpis lub tajemnicę:</span>
              </div>

              {selectedStationId === 'biblia365' && (
                <div className="flex items-center gap-1 bg-[#0b1019] px-2 py-0.5 rounded-lg border border-slate-700 text-xs">
                  <span className="text-slate-400 text-[11px]">Cykl Biblii:</span>
                  {([1, 2, 3, 4] as const).map(yr => (
                    <button
                      key={yr}
                      onClick={() => setSelectedBibliaYear(yr)}
                      disabled={isRecording}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                        selectedBibliaYear === yr
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Rok {yr}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pasek sterowania numerem dnia: -10, -1, [Input], +1, +10 + Katalog */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedDayNumber(Math.max(1, safeDayNumber - 10))}
                disabled={isRecording || safeDayNumber <= 1}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold cursor-pointer transition"
                title="Wstecz o 10 dni"
              >
                -10
              </button>

              <button
                onClick={() => setSelectedDayNumber(Math.max(1, safeDayNumber - 1))}
                disabled={isRecording || safeDayNumber <= 1}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 cursor-pointer transition"
                title="Poprzedni dzień"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Bezpośrednie pole wpisywania numeru dnia */}
              <div className="flex items-center gap-1.5 bg-[#0a0f18] px-3 py-1.5 rounded-xl border border-amber-500/40">
                <span className="text-xs text-amber-400 font-bold">Dzień</span>
                <input
                  type="number"
                  min={1}
                  max={activeStation.totalDays}
                  value={safeDayNumber}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      setSelectedDayNumber(Math.max(1, Math.min(activeStation.totalDays, val)));
                    }
                  }}
                  disabled={isRecording}
                  className="w-14 bg-transparent text-center text-white font-mono font-extrabold text-sm focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-mono">/ {activeStation.totalDays}</span>
              </div>

              <button
                onClick={() => setSelectedDayNumber(Math.min(activeStation.totalDays, safeDayNumber + 1))}
                disabled={isRecording || safeDayNumber >= activeStation.totalDays}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 cursor-pointer transition"
                title="Następny dzień"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setSelectedDayNumber(Math.min(activeStation.totalDays, safeDayNumber + 10))}
                disabled={isRecording || safeDayNumber >= activeStation.totalDays}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold cursor-pointer transition"
                title="Dalej o 10 dni"
              >
                +10
              </button>

              {/* Przycisk otwarcia pełnego katalogu z wyszukiwarką */}
              <button
                onClick={() => setIsCatalogOpen(!isCatalogOpen)}
                disabled={isRecording}
                className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs ${
                  isCatalogOpen
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>{isCatalogOpen ? 'Zamknij listę' : `Wszystkie ${activeStation.totalDays} dni (Szukaj...)`}</span>
              </button>
            </div>

            {/* ROZWIJANY KATALOG WSZYSTKICH DNI Z WYSZUKIWARKĄ */}
            {isCatalogOpen && (
              <div className="mt-3 p-3 bg-[#0a0f18] rounded-xl border border-slate-700/80 space-y-2 animate-fade-in">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder={`Szukaj w ${activeStation.totalDays} dniach (np. nazwa tajemnicy, księga, temat)...`}
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-[#121927] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {filteredStationItems.map((item) => {
                    const isSelected = item.day === safeDayNumber;
                    return (
                      <div
                        key={item.day}
                        onClick={() => {
                          setSelectedDayNumber(item.day);
                          setIsCatalogOpen(false);
                        }}
                        className={`p-2 rounded-lg cursor-pointer transition flex items-center justify-between gap-2 text-xs ${
                          isSelected
                            ? 'bg-amber-600/30 border border-amber-500/60 text-white font-bold'
                            : 'hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                            isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}>
                            Dzień {item.day}
                          </span>
                          <span className="truncate">{item.title}</span>
                        </div>
                        {item.ref && (
                          <span className="text-[10px] text-slate-400 font-mono shrink-0 hidden sm:inline truncate max-w-[200px]">
                            {item.ref}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {filteredStationItems.length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-400">
                      Brak wyników dla zapytania "{catalogSearch}".
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Podsumowanie wybranego wpisu */}
            <div className="pt-2 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <span className="text-amber-400 font-bold">{activeBroadcastItem.displayDate}:</span>{' '}
                <span className="text-white font-semibold">{activeBroadcastItem.headlineTitle}</span>
                <span className="text-slate-400 text-[11px] block truncate">{activeBroadcastItem.subtitle}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-slate-400 text-[11px] font-mono">
                  {activeBroadcastItem.words.length} słów
                </span>
                
                {/* Opcje rozdzielczości i próbki */}
                <div className="flex items-center gap-1 bg-[#0a0f18] p-1 rounded-lg border border-slate-700">
                  <button
                    onClick={() => setResolution('1080p')}
                    disabled={isRecording}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                      resolution === '1080p' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1080p
                  </button>
                  <button
                    onClick={() => setResolution('720p')}
                    disabled={isRecording}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                      resolution === '720p' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    720p
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-[#0a0f18] p-1 rounded-lg border border-slate-700">
                  <button
                    onClick={() => setPreviewMode('full')}
                    disabled={isRecording}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition ${
                      previewMode === 'full' ? 'bg-sky-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Pełny materiał"
                  >
                    Pełny
                  </button>
                  <button
                    onClick={() => setPreviewMode('sample')}
                    disabled={isRecording}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition ${
                      previewMode === 'sample' ? 'bg-sky-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Próbka 30s"
                  >
                    Próbka 30s
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Szybki skok do sekcji / modlitw / akapitów */}
          {activeBroadcastItem.sections && activeBroadcastItem.sections.length > 0 && (
            <div className="p-2.5 bg-[#0e1624] rounded-xl border border-slate-800 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
              <span className="text-[11px] text-amber-400 font-bold shrink-0 uppercase tracking-wide">
                Sekcje:
              </span>
              {activeBroadcastItem.sections.map((sec, idx) => {
                const isSecActive = currentWordIndex >= sec.startWordIdx && currentWordIndex <= sec.endWordIdx;
                return (
                  <button
                    key={sec.id || idx}
                    onClick={() => {
                      if (isRecording) return;
                      setCurrentWordIndex(sec.startWordIdx);
                      drawVideoFrame(sec.startWordIdx, 0);
                    }}
                    disabled={isRecording}
                    className={`px-2.5 py-1 rounded-lg shrink-0 transition cursor-pointer text-xs font-semibold ${
                      isSecActive
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                    }`}
                    title={`Przejdź do: ${sec.title}`}
                  >
                    {sec.title}
                  </button>
                );
              })}
            </div>
          )}

          {/* Podgląd Canvas 16:9 na żywo */}
          <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-amber-500/30 shadow-inner flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className="w-full h-full object-contain"
            />

            {/* Pływający wskaźnik nagrywania na żywo */}
            {isRecording && (
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-red-600/90 text-white font-bold text-xs flex items-center gap-2 animate-pulse shadow-lg backdrop-blur-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
                <span>NAGRYWANIE WIDEO NA ŻYWO ({recordProgress}%)</span>
              </div>
            )}
          </div>

          {/* Interaktywny suwak podglądu słów i karaoke (gdy nie trwa nagrywanie) */}
          {!isRecording && activeBroadcastItem.words.length > 0 && (
            <div className="p-3 bg-[#0c121e] rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Play className="w-3 h-3 text-amber-400" />
                  <span>Podgląd tekstu:</span>
                </span>
                <button
                  onClick={() => {
                    setCurrentWordIndex(0);
                    drawVideoFrame(0, 0);
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition flex items-center gap-1"
                  title="Początek"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Początek</span>
                </button>
                <button
                  onClick={() => {
                    const newIdx = Math.max(0, currentWordIndex - 5);
                    setCurrentWordIndex(newIdx);
                    drawVideoFrame(newIdx, 0);
                  }}
                  disabled={currentWordIndex <= 0}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold cursor-pointer transition"
                  title="-5 słów"
                >
                  -5
                </button>
                <button
                  onClick={() => {
                    const newIdx = Math.min(activeBroadcastItem.words.length - 1, currentWordIndex + 5);
                    setCurrentWordIndex(newIdx);
                    drawVideoFrame(newIdx, 0);
                  }}
                  disabled={currentWordIndex >= activeBroadcastItem.words.length - 1}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold cursor-pointer transition"
                  title="+5 słów"
                >
                  +5
                </button>
              </div>

              <div className="flex-1 min-w-[200px] flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={activeBroadcastItem.words.length - 1}
                  value={currentWordIndex}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value, 10);
                    setCurrentWordIndex(idx);
                    drawVideoFrame(idx, 0);
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="text-[11px] font-mono text-slate-400 font-semibold shrink-0">
                Słowo <span className="text-amber-400 font-bold">{currentWordIndex + 1}</span> / {activeBroadcastItem.words.length}
              </div>
            </div>
          )}

          {/* Pasek postępu */}
          {isRecording && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>{recordingStatus}</span>
                <span className="font-mono font-bold text-amber-400">{recordProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-200"
                  style={{ width: `${recordProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Gotowe wideo podgląd po nagraniu */}
          {renderedVideoUrl && (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <Check className="w-4 h-4" />
                  <span>Plik wideo dla YouTube został pomyślnie wygenerowany!</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  {recordedDuration > 0 && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                      Czas: {Math.floor(recordedDuration / 60)}m {Math.floor(recordedDuration % 60).toString().padStart(2, '0')}s
                    </span>
                  )}
                  <span className="text-slate-400">
                    {renderedBlob ? `${(renderedBlob.size / 1024 / 1024).toFixed(2)} MB (${renderedBlob.type.includes('mp4') ? 'MP4' : 'WebM'})` : ''}
                  </span>
                </div>
              </div>
              <video
                src={renderedVideoUrl}
                controls
                preload="metadata"
                className="w-full max-h-56 rounded-xl bg-black border border-slate-800"
              />
            </div>
          )}

        </div>

        {/* Footer akcji */}
        <div className="px-6 py-4 bg-[#0a0f18] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            {recordingStatus}
          </div>

          <div className="flex items-center gap-2.5">
            {isRecording ? (
              <button
                onClick={stopGeneration}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                <Square className="w-4 h-4" />
                <span>Zatrzymaj i zapisz</span>
              </button>
            ) : (
              <button
                onClick={handleStartRecording}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4" />
                <span>Generuj Wideo YouTube (Dzień {activeBroadcastItem.dayNumber})</span>
              </button>
            )}

            {renderedBlob && (
              <button
                onClick={handleDownloadVideo}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95 animate-pulse"
              >
                <Download className="w-4 h-4" />
                <span>Pobierz plik MP4 (YouTube)</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
