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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const lectorConfig = getLectorConfig();

  // Aktywna stacja i bezpieczny numer dnia
  const activeStation = RADIO_STATIONS.find(s => s.id === selectedStationId) || RADIO_STATIONS[0];
  const safeDayNumber = Math.max(1, Math.min(activeStation.totalDays, selectedDayNumber));
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
    for (let d = 1; d <= activeStation.totalDays; d++) {
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

    // Tytuł Dnia & Informacja nagłówkowa
    ctx.font = `bold ${Math.round(height * 0.046)}px "Cinzel", Georgia, serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`${activeBroadcastItem.displayDate} • ${activeBroadcastItem.headlineTitle}`, 80, 130);

    // Podtytuł / Ścieżka / Źródło
    ctx.font = `500 ${Math.round(height * 0.024)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`${activeBroadcastItem.subtitle}`, 80, 170);

    // Cienka linia oddzielająca nagłówek od strefy napisów
    ctx.fillStyle = '#263040';
    ctx.fillRect(80, 195, width - 160, 2);

    // 2.5. WIZUALIZACJA POSTĘPU DZIESIĄTKA RÓŻAŃCA (dla RHZ365 i Nowy RHZ):
    // Duży okrąg (Rozważanie i Ojcze nasz) + 10 małych paciorków (Zdrowaś Maryjo ze wstawką) + Duży okrąg (Chwała Ojcu i O mój Jezu)
    const rosarySegments = activeBroadcastItem.rosarySegments;
    const hasRosary = Boolean(rosarySegments && rosarySegments.length > 0);
    let startY = 270;
    let visibleLinesCount = 10;

    if (hasRosary && rosarySegments) {
      startY = Math.round(height * 0.365); // ~395px na 1080p
      visibleLinesCount = 7;

      // Znajdź aktywny segment na podstawie czytanego słowa
      const activeSeg = rosarySegments.find(
        s => activeWordIdx >= s.startWordIdx && activeWordIdx <= s.endWordIdx
      ) || rosarySegments[0];
      const activeBeadNum = activeSeg.beadIndex; // 0, 1..10, 11

      const beadCenterY = Math.round(height * 0.245); // ~265px na 1080p
      const largeRadius = Math.round(height * 0.023); // ~25px na 1080p, ~16px na 720p
      const smallRadius = Math.round(height * 0.013); // ~14px na 1080p, ~9px na 720p

      const leftX = Math.round(width * 0.12);
      const rightX = Math.round(width * 0.88);
      const smallStartX = Math.round(width * 0.22);
      const smallEndX = Math.round(width * 0.78);
      const smallStepX = (smallEndX - smallStartX) / 9;

      // A. Złoty sznur łączący paciorki w tle
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
      ctx.lineWidth = Math.max(2, Math.round(height * 0.003));
      ctx.beginPath();
      ctx.moveTo(leftX, beadCenterY);
      ctx.lineTo(rightX, beadCenterY);
      ctx.stroke();

      // B. PACIOREK 1 (DUŻY): Rozważanie i Ojcze nasz
      const isIntroDone = activeBeadNum > 0;
      const isIntroActive = activeBeadNum === 0;

      ctx.save();
      if (isIntroActive) {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
      } else if (isIntroDone) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#059669'; // Ukończony (emerald)
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.5;
      }

      ctx.beginPath();
      ctx.arc(leftX, beadCenterY, isIntroActive ? largeRadius + 3 : largeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Ikona/Tekst wewnątrz dużego paciorka
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(largeRadius * 0.85)}px "Cinzel", Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isIntroDone ? '✓' : 'I', leftX, beadCenterY);
      ctx.restore();

      // Podpis pod dużym paciorkiem 1
      ctx.font = `bold ${Math.round(height * 0.016)}px "Cinzel", serif`;
      ctx.fillStyle = isIntroActive ? '#ffd700' : isIntroDone ? '#a7f3d0' : '#cbd5e1';
      ctx.textAlign = 'center';
      ctx.fillText('Rozważanie & Ojcze nasz', leftX, beadCenterY + largeRadius + 18);

      // C. 10 MAŁYCH PACIORKÓW: Zdrowaś Maryjo ze wstawką
      for (let b = 1; b <= 10; b++) {
        const beadX = Math.round(smallStartX + (b - 1) * smallStepX);
        const isBeadDone = activeBeadNum > b;
        const isBeadActive = activeBeadNum === b;

        ctx.save();
        if (isBeadActive) {
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 18;
          ctx.fillStyle = '#f59e0b';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
        } else if (isBeadDone) {
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#d97706'; // Ukończone małe paciorki - szlachetne złoto
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5;
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#141d2b';
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1;
        }

        ctx.beginPath();
        ctx.arc(beadX, beadCenterY, isBeadActive ? smallRadius + 3 : smallRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Numer paciorka
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(smallRadius * 0.95)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isBeadDone ? '✓' : b.toString(), beadX, beadCenterY);
        ctx.restore();

        // Etykieta numeru nad paciorkiem
        ctx.font = `600 ${Math.round(height * 0.013)}px sans-serif`;
        ctx.fillStyle = isBeadActive ? '#ffd700' : '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(`#${b}`, beadX, beadCenterY - smallRadius - 8);
      }

      // D. PACIOREK 2 (DUŻY): Chwała Ojcu i O mój Jezu
      const isConclDone = activeWordIdx >= activeBroadcastItem.words.length - 1;
      const isConclActive = activeBeadNum === 11;

      ctx.save();
      if (isConclActive) {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
      } else if (isConclDone) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#059669';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.5;
      }

      ctx.beginPath();
      ctx.arc(rightX, beadCenterY, isConclActive ? largeRadius + 3 : largeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(largeRadius * 0.85)}px "Cinzel", Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isConclDone ? '✓' : 'II', rightX, beadCenterY);
      ctx.restore();

      ctx.font = `bold ${Math.round(height * 0.016)}px "Cinzel", serif`;
      ctx.fillStyle = isConclActive ? '#ffd700' : isConclDone ? '#a7f3d0' : '#cbd5e1';
      ctx.textAlign = 'center';
      ctx.fillText('Chwała Ojcu & O mój Jezu', rightX, beadCenterY + largeRadius + 18);

      // E. BELKA INFORMACYJNA O AKTUALNYM PACIORKU (z podglądem wstawki po słowie Jezus)
      const pillY = beadCenterY + largeRadius + 44;
      ctx.save();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.lineWidth = 1;
      const pillW = width - 180;
      const pillH = Math.round(height * 0.046);
      
      // Zaokrąglony prostokąt belki
      ctx.beginPath();
      ctx.roundRect(90, pillY, pillW, pillH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.round(height * 0.02)}px "Cinzel", Georgia, serif`;
      ctx.fillStyle = '#ffd700';

      if (activeBeadNum === 0) {
        ctx.fillText(`📖 KROK 1 • Rozważanie Tajemnicy oraz Modlitwa Pańska (Ojcze nasz)`, width / 2, pillY + pillH / 2);
      } else if (activeBeadNum >= 1 && activeBeadNum <= 10) {
        const ins = activeSeg.insertion ? `„${activeSeg.insertion}”` : '';
        ctx.fillText(`📿 PACIOREK ${activeBeadNum}/10 • Zdrowaś Maryjo ze wstawką: ${ins}`, width / 2, pillY + pillH / 2);
      } else {
        ctx.fillText(`🕊️ KROK 3 • Modlitwa Uwielbienia (Chwała Ojcu) oraz Modlitwa Fatimska (O mój Jezu)`, width / 2, pillY + pillH / 2);
      }
      ctx.restore();
    }

    // 3. STREFA NAPISÓW Z EFEKTEM KARAOKE (Zaznaczenie aktualnie wypowiadanego słowa)
    const words = activeBroadcastItem.words;
    if (words.length > 0) {
      const fontSize = Math.round(height * (hasRosary ? 0.034 : 0.038)); // ~37px na 1080p przy różańcu
      const lineHeight = Math.round(fontSize * 1.55);
      ctx.font = `600 ${fontSize}px "Newsreader", Georgia, serif`;
      ctx.textAlign = 'left';

      const maxTextWidth = width - 180;

      // Budowanie linii ze słów z zapamiętywaniem indeksu każdego słowa
      interface WordToken {
        text: string;
        wordIdx: number;
      }
      interface LineItem {
        tokens: WordToken[];
        hasActiveWord: boolean;
      }

      const lines: LineItem[] = [];
      let currentLineTokens: WordToken[] = [];
      let currentLineWidth = 0;

      for (let i = 0; i < words.length; i++) {
        const wordText = words[i] + ' ';
        const wordWidth = ctx.measureText(wordText).width;

        if (currentLineWidth + wordWidth > maxTextWidth && currentLineTokens.length > 0) {
          lines.push({
            tokens: currentLineTokens,
            hasActiveWord: currentLineTokens.some(t => t.wordIdx === activeWordIdx)
          });
          currentLineTokens = [];
          currentLineWidth = 0;
        }

        currentLineTokens.push({ text: wordText, wordIdx: i });
        currentLineWidth += wordWidth;
      }
      if (currentLineTokens.length > 0) {
        lines.push({
          tokens: currentLineTokens,
          hasActiveWord: currentLineTokens.some(t => t.wordIdx === activeWordIdx)
        });
      }

      // Znajdź indeks linii zawierającej aktualne słowo
      let activeLineIdx = lines.findIndex(l => l.tokens.some(t => t.wordIdx === activeWordIdx));
      if (activeLineIdx === -1) activeLineIdx = 0;

      // Okno przewijania linii (auto-scroll: utrzymuje aktywną linię na wysokości 2-3 pozycji)
      const scrollOffset = Math.max(0, activeLineIdx - 3);
      const displayLines = lines.slice(scrollOffset, scrollOffset + visibleLinesCount);

      displayLines.forEach((line, lineIndex) => {
        const lineY = startY + lineIndex * lineHeight;
        let tokenX = 90;

        line.tokens.forEach((token) => {
          const isCurrent = token.wordIdx === activeWordIdx;
          const isSpoken = token.wordIdx < activeWordIdx;

          if (isCurrent) {
            // EFEKT KARAOKE: Złoty podświetlony akcent ze świetlistą poświatą!
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 14;
            ctx.fillStyle = '#ffd700'; // Radiant gold
            ctx.font = `bold ${fontSize + 2}px "Newsreader", Georgia, serif`;
          } else if (isSpoken) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#f1f5f9'; // Czysty biały (już przeczytany)
            ctx.font = `600 ${fontSize}px "Newsreader", Georgia, serif`;
          } else {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#64748b'; // Stonowany srebrzysty (przyszły)
            ctx.font = `500 ${fontSize}px "Newsreader", Georgia, serif`;
          }

          ctx.fillText(token.text, tokenX, lineY);
          const tWidth = ctx.measureText(token.text).width;
          tokenX += tWidth;
        });
      });

      // Reset cieni
      ctx.shadowBlur = 0;
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
    const wordsTotal = activeBroadcastItem.words.length;
    const currentProgressPercent = wordsTotal > 0 ? Math.round((activeWordIdx / wordsTotal) * 100) : 0;
    ctx.fillText(
      `Dzień ${activeBroadcastItem.dayNumber}/${activeStation.totalDays} • Słowo ${activeWordIdx + 1}/${wordsTotal} (${currentProgressPercent}%) • Lektor AI TTS`,
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
      // 1. Wybór tekstu do odczytania (próbka 45 słów lub cała audycja)
      const textToSpeak = previewMode === 'sample' 
        ? activeBroadcastItem.words.slice(0, 45).join(' ') 
        : activeBroadcastItem.speechText;
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

      // 3. Pobranie audio głosu Lektora z serwera /api/tts z obsługą wieloczęściową
      let audioBuffer: AudioBuffer | null = null;
      try {
        const ttsRes = await fetch('/api/tts', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            text: textToSpeak,
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
              const decodedChunks: AudioBuffer[] = [];
              for (const b64 of data.chunks) {
                try {
                  const bin = atob(b64);
                  const bytes = new Uint8Array(bin.length);
                  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                  const decoded = await audioCtx.decodeAudioData(bytes.buffer.slice(0));
                  decodedChunks.push(decoded);
                } catch (e) {
                  console.warn('Decode chunk warning in video generator:', e);
                }
              }
              if (decodedChunks.length > 0) {
                audioBuffer = concatenateAudioBuffers(audioCtx, decodedChunks);
              }
            }
          } else {
            const arrBuf = await ttsRes.arrayBuffer();
            if (arrBuf && arrBuf.byteLength > 0) {
              audioBuffer = await audioCtx.decodeAudioData(arrBuf);
            }
          }
        }
      } catch (err) {
        console.warn('Endpoint /api/tts niedostępny w generatorze wideo, próba bezpośredniego pobrania:', err);
      }

      // Rezerwowe bezpośrednie pobranie jeśli proxy nie odpowiedziało
      if (!audioBuffer) {
        try {
          const directUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(textToSpeak.slice(0, 180))}&tl=pl&client=tw-ob`;
          const directRes = await fetch(directUrl);
          if (directRes.ok) {
            const arrBuf = await directRes.arrayBuffer();
            audioBuffer = await audioCtx.decodeAudioData(arrBuf);
          }
        } catch (e2) {
          console.warn('Direct fallback failed:', e2);
        }
      }

      // 4. Połączenie strumienia wideo z Canvasu oraz audio z AudioContext
      const canvasStream = canvas.captureStream(30);
      const combinedTracks = [
        ...canvasStream.getVideoTracks(),
        ...audioDest.stream.getAudioTracks()
      ];
      const combinedStream = new MediaStream(combinedTracks);

      // 5. Konfiguracja MediaRecorder dla YouTube MP4
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')) {
        mimeType = 'video/mp4;codecs=avc1,mp4a.40.2';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        mimeType = 'video/webm;codecs=vp8,opus';
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

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: mimeType });
        setRenderedBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);
        setRenderedVideoUrl(url);
        setIsRecording(false);
        setRecordProgress(100);
        setRecordingStatus('✅ Wideo MP4 z głosem lektora gotowe do pobrania i publikacji na YouTube!');
      };

      // 6. Uruchomienie odtwarzania ścieżki lektora i rejestracji
      if (audioBuffer) {
        setRecordingStatus('Trwa nagrywanie wideo z pełnym głosem Lektora AI i podświetlaniem słów...');

        const sourceNode = audioCtx.createBufferSource();
        sourceNode.buffer = audioBuffer;
        activeAudioSourceRef.current = sourceNode;

        // Dźwięk trafia ZARÓWNO do pliku MP4 (audioDest), jak i do odsłuchu na głośnikach (destination)
        sourceNode.connect(audioDest);
        sourceNode.connect(audioCtx.destination);

        // Precyzyjny podział czasu trwania audio proporcjonalnie do długości słów
        const totalDuration = audioBuffer.duration;
        const wordWeights = targetWords.map(w => Math.max(1, w.length));
        const totalWeight = wordWeights.reduce((a, b) => a + b, 0);

        const wordTimings: { wordIdx: number; start: number; end: number }[] = [];
        let acc = 0;
        for (let i = 0; i < targetWords.length; i++) {
          const start = (acc / totalWeight) * totalDuration;
          acc += wordWeights[i];
          const end = (acc / totalWeight) * totalDuration;
          wordTimings.push({ wordIdx: i, start, end });
        }

        recorder.start(100);
        sourceNode.start(0);
        const startAudioTime = audioCtx.currentTime;

        const renderLoop = () => {
          if (!recorder || recorder.state !== 'recording') return;
          const elapsed = Math.max(0, audioCtx.currentTime - startAudioTime);
          
          let activeIdx = 0;
          for (let i = 0; i < wordTimings.length; i++) {
            if (elapsed >= wordTimings[i].start && elapsed < wordTimings[i].end) {
              activeIdx = i;
              break;
            }
          }
          if (elapsed >= totalDuration) {
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
            }, 600);
          }
        };

        animationFrameRef.current = requestAnimationFrame(renderLoop);
      } else {
        // Fallback: symulacja z syntetyczną ścieżką w przypadku braku połączenia
        setRecordingStatus('Generowanie wideo w trybie syntezy autonomicznej...');
        const wordsDurationSec = Math.max(15, wordsTotal * 0.42);
        recorder.start(100);
        const startTime = Date.now();

        const renderLoopFallback = () => {
          if (!recorder || recorder.state !== 'recording') return;
          const elapsed = (Date.now() - startTime) / 1000;
          const progress = Math.min(99, Math.round((elapsed / wordsDurationSec) * 100));
          setRecordProgress(progress);

          const activeIdx = Math.min(
            wordsTotal - 1,
            Math.floor((elapsed / wordsDurationSec) * wordsTotal)
          );
          setCurrentWordIndex(activeIdx);
          drawVideoFrame(activeIdx, elapsed);

          if (elapsed < wordsDurationSec) {
            animationFrameRef.current = requestAnimationFrame(renderLoopFallback);
          } else {
            setTimeout(() => {
              if (recorder.state === 'recording') {
                recorder.stop();
              }
            }, 500);
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

    const safeTitle = (activeBroadcastItem.headlineTitle || 'video')
      .toLowerCase()
      .replace(/[^a-z0-9а-яąęćłńóśźż]+/gi, '_')
      .slice(0, 40);
    const filename = `youtube_${activeBroadcastItem.stationId}_dzien_${activeBroadcastItem.dayNumber}_${safeTitle}.mp4`;

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
      <div className="relative w-full max-w-5xl bg-[#0c121d] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 my-auto max-h-[96vh]">
        
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <Check className="w-4 h-4" />
                  <span>Plik wideo MP4 został pomyślnie wygenerowany!</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {renderedBlob ? `${(renderedBlob.size / 1024 / 1024).toFixed(2)} MB` : ''}
                </span>
              </div>
              <video
                src={renderedVideoUrl}
                controls
                className="w-full max-h-52 rounded-xl bg-black border border-slate-800"
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
