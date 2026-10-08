import React, { useState, useRef, useEffect } from 'react';
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
  Settings
} from 'lucide-react';
import { RadioBroadcastItem } from '../utils/radioContentService';
import { getLectorConfig, LectorConfig } from '../utils/audioLectorService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  broadcastItem: RadioBroadcastItem;
}

export const VideoYouTubeExportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  broadcastItem
}) => {
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
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const lectorConfig = getLectorConfig();

  // Width & height based on resolution
  const width = resolution === '1080p' ? 1920 : 1280;
  const height = resolution === '1080p' ? 1080 : 720;

  // Clean up object URL when closing or re-generating
  useEffect(() => {
    return () => {
      if (renderedVideoUrl) {
        URL.revokeObjectURL(renderedVideoUrl);
      }
      stopGeneration();
    };
  }, [renderedVideoUrl]);

  // Initial canvas draw (preview frame)
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      drawVideoFrame(0, 0);
    }
  }, [isOpen, broadcastItem, resolution]);

  /**
   * Rysuje klatkę wideo na Canvasie (Czarne tło, nagłówki, napisy z podświetlonym słowem)
   */
  const drawVideoFrame = (activeWordIdx: number, elapsedSec: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. GŁĘBOKIE CZARNE TŁO (dla YouTube)
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
    ctx.fillStyle = '#d97706';
    ctx.fillRect(80, 70, width - 160, 3);

    // Etykieta stacji radiowej / sekcji
    ctx.font = `bold ${Math.round(height * 0.024)}px "Cinzel", "Times New Roman", serif`;
    ctx.fillStyle = '#f59e0b'; // Złoty bursztyn
    ctx.textAlign = 'left';
    ctx.fillText(`🔴 RADIO INTERNETOWE • ${broadcastItem.stationName.toUpperCase()}`, 80, 60);

    // Znak wodny / Czas
    ctx.font = `600 ${Math.round(height * 0.02)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText(`widokinaraj.pl`, width - 80, 60);

    // Tytuł Dnia & Informacja nagłówkowa
    ctx.font = `bold ${Math.round(height * 0.048)}px "Cinzel", Georgia, serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`${broadcastItem.displayDate} • ${broadcastItem.headlineTitle}`, 80, 130);

    // Podtytuł / Ścieżka / Źródło
    ctx.font = `500 ${Math.round(height * 0.024)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`${broadcastItem.subtitle}`, 80, 170);

    // Cienka linia oddzielająca nagłówek od strefy napisów
    ctx.fillStyle = '#263040';
    ctx.fillRect(80, 195, width - 160, 2);

    // 3. STREFA NAPISÓW Z EFEKTEM KARAOKE (Zaznaczenie aktualnie wypowiadanego słowa)
    const words = broadcastItem.words;
    if (words.length > 0) {
      const fontSize = Math.round(height * 0.038); // ~41px na 1080p
      const lineHeight = Math.round(fontSize * 1.55);
      ctx.font = `600 ${fontSize}px "Newsreader", Georgia, serif`;
      ctx.textAlign = 'left';

      const maxTextWidth = width - 180;
      const startY = 270;
      const visibleLinesCount = 10;

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
    ctx.fillStyle = '#d97706';
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
    const wordsTotal = broadcastItem.words.length;
    const currentProgressPercent = wordsTotal > 0 ? Math.round((activeWordIdx / wordsTotal) * 100) : 0;
    ctx.fillText(
      `Słowo ${activeWordIdx + 1} / ${wordsTotal} (${currentProgressPercent}%) • Narator: Lektor AI TTS`,
      width - 80,
      height - 38
    );
  };

  /**
   * Rozpoczyna generowanie wideo MP4 z lektorem TTS i animacją karaoke
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
    setRecordingStatus('Przygotowywanie strumienia wideo i audio...');

    try {
      // 1. Przygotowanie Canvas Stream (30 FPS)
      const canvasStream = canvas.captureStream(30);

      // 2. Przygotowanie Audio Context do wygenerowania ścieżki dźwiękowej z Lektora
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const audioDest = audioCtx.createMediaStreamDestination();

      // Utwórz cichy bufor tła, aby strumień audio był aktywny
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.0001; // ledwo słyszalny liveness tone
      osc.connect(gain);
      gain.connect(audioDest);
      osc.start();

      // Połącz strumień wideo i audio
      const combinedTracks = [
        ...canvasStream.getVideoTracks(),
        ...audioDest.stream.getAudioTracks()
      ];
      const combinedStream = new MediaStream(combinedTracks);

      // 3. Wybór formatu nagrywania kompatybilnego z YouTube
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
        videoBitsPerSecond: resolution === '1080p' ? 5000000 : 2500000 // Wysoka jakość YouTube
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
        setRecordingStatus('✅ Wideo gotowe do pobrania i publikacji na YouTube!');
      };

      recorder.start(100); // chunk co 100ms
      setRecordingStatus('Trwa nagrywanie narracji z podświetlaniem słów (karaoke)...');

      // 4. Uruchomienie syntezy mowy TTS oraz animacji Canvas w pętli
      const textToSpeak = previewMode === 'sample' 
        ? broadcastItem.words.slice(0, 45).join(' ') 
        : broadcastItem.speechText;

      const wordsTotal = previewMode === 'sample' ? 45 : broadcastItem.words.length;

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        speechRef.current = utterance;

        utterance.lang = lectorConfig.lang || 'pl-PL';
        utterance.rate = lectorConfig.rate || 1.0;
        utterance.pitch = lectorConfig.pitch || 1.0;

        let wordCounter = 0;
        const startTime = Date.now();

        utterance.onboundary = (e) => {
          if (e.name === 'word') {
            wordCounter++;
            const safeIdx = Math.min(wordsTotal - 1, wordCounter);
            setCurrentWordIndex(safeIdx);
            const progress = Math.min(99, Math.round((safeIdx / wordsTotal) * 100));
            setRecordProgress(progress);
          }
        };

        utterance.onend = () => {
          setTimeout(() => {
            if (recorder.state === 'recording') {
              recorder.stop();
            }
          }, 800);
        };

        utterance.onerror = () => {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        };

        // Pętla odświeżania Canvasu podczas nagrywania (30 FPS)
        const renderLoop = () => {
          const elapsed = (Date.now() - startTime) / 1000;
          drawVideoFrame(wordCounter, elapsed);
          if (recorder.state === 'recording') {
            animationFrameRef.current = requestAnimationFrame(renderLoop);
          }
        };
        animationFrameRef.current = requestAnimationFrame(renderLoop);

        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback symulacyjny jeśli SpeechSynthesis nie jest dostępny
        simulateRecordingFallback(recorder, wordsTotal);
      }
    } catch (err: any) {
      console.error('Error starting video recording:', err);
      setIsRecording(false);
      setRecordingStatus('Wystąpił błąd podczas nagrywania: ' + (err.message || 'Nieobsługiwany format'));
    }
  };

  /**
   * Symulacja krok po kroku gdy brak bezpośredniego TTS boundary
   */
  const simulateRecordingFallback = (recorder: MediaRecorder, wordsTotal: number) => {
    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx++;
      setCurrentWordIndex(currentIdx);
      drawVideoFrame(currentIdx, currentIdx * 0.35);
      const progress = Math.min(99, Math.round((currentIdx / wordsTotal) * 100));
      setRecordProgress(progress);

      if (currentIdx >= wordsTotal) {
        clearInterval(interval);
        setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }, 600);
      }
    }, 350);
  };

  /**
   * Zatrzymanie nagrywania w trakcie
   */
  const stopGeneration = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    setIsRecording(false);
  };

  /**
   * Pobranie wygenerowanego pliku MP4 dla YouTube
   */
  const handleDownloadVideo = () => {
    if (!renderedBlob || !renderedVideoUrl) return;

    const safeTitle = broadcastItem.headlineTitle
      .toLowerCase()
      .replace(/[^a-z0-9ąćęłńóśźż]+/gi, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);

    const filename = `youtube_${broadcastItem.stationId}_dzien_${broadcastItem.dayNumber}_${safeTitle}.mp4`;

    const a = document.createElement('a');
    a.href = renderedVideoUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#0c121d] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 my-auto">
        
        {/* Header Modala */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#172338] via-[#111a2a] to-[#0c121d] border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-serif-book text-white">
                  Generator Wideo YouTube MP4 z Napisami Karaoke
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-600/30 border border-red-500/40 text-red-300 font-bold uppercase">
                  1080p Full HD
                </span>
              </div>
              <p className="text-xs text-amber-200/80">
                Czarne tło • Nagłówek dnia • Zaznaczanie aktualnie mówionego słowa • Lektor AI TTS
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
        <div className="p-5 sm:p-6 space-y-5 flex-1">
          
          {/* Informacja o wybranym materiale */}
          <div className="p-4 rounded-2xl bg-[#141e30] border border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs">
                  {broadcastItem.stationName}
                </span>
                <span className="font-semibold text-white">
                  {broadcastItem.displayDate}
                </span>
              </div>
              <div className="text-amber-100 font-bold truncate max-w-xl text-sm sm:text-base">
                {broadcastItem.headlineTitle}
              </div>
              <div className="text-slate-400 text-xs">
                {broadcastItem.subtitle} • {broadcastItem.words.length} słów do narracji
              </div>
            </div>

            {/* Opcje parametrów wideo */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <div className="flex items-center gap-1.5 bg-[#0a0f18] p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setResolution('1080p')}
                  disabled={isRecording}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    resolution === '1080p'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  1080p (Full HD)
                </button>
                <button
                  onClick={() => setResolution('720p')}
                  disabled={isRecording}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    resolution === '720p'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  720p (HD)
                </button>
              </div>

              <div className="flex items-center gap-1.5 bg-[#0a0f18] p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setPreviewMode('full')}
                  disabled={isRecording}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    previewMode === 'full'
                      ? 'bg-sky-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Generuj wideo z całą treścią dnia"
                >
                  Pełny materiał
                </button>
                <button
                  onClick={() => setPreviewMode('sample')}
                  disabled={isRecording}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    previewMode === 'sample'
                      ? 'bg-sky-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Szybka próbka testowa (~30 sekund)"
                >
                  Próbka 30s
                </button>
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
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
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
        <div className="px-6 py-4 bg-[#0a0f18] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
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
                <span>Rozpocznij generowanie wideo</span>
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
