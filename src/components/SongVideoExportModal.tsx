import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  X,
  Music,
  Video,
  Download,
  Loader2,
  Copy,
  Check,
  Square,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Radio,
  Sliders,
  Volume2,
  Play,
  RotateCcw
} from 'lucide-react';
import {
  RADIO_STATIONS,
  RadioBroadcastItem,
  getRadioBroadcastItem
} from '../utils/radioContentService';
import type { GeneratedSong, SongStationId } from '../utils/lyriaSongService';
import {
  SONG_STYLE_BY_STATION,
  buildSongLyrics,
  selectSongSourceText,
  formatLyricsForLyria,
  parseLyriaLyrics,
  flattenLyricLines,
  buildLyriaPrompt,
  computeLyricLineTimings,
  findActiveLineIndex,
  buildYouTubeMetadata,
  pickRecordingMimeType,
  buildSongVideoFileName,
  LyricLineTiming,
  audioBufferToWavBlob,
  blobToBase64,
  synthesizeStationAccompaniment,
  mixVocalAndMusicBuffers,
} from '../utils/songVideoBuilder';
import { fetchAudioForText } from './VideoYouTubeExportModal';
import { concatenateAudioBuffers } from '../utils/audioLectorService';

import nowyRhzIllustrationImg from '../pliki/RHZ-ilustracja.jpg';
import rhzMainImg from '../pliki/rhz-main.jpg';
import wnrMainImg from '../pliki/wnr-main.jpg';
import bibliaMainImg from '../pliki/biblia-main.jpg';

export const SECTION_ILLUSTRATIONS: Record<SongStationId, string> = {
  nowyrhz: nowyRhzIllustrationImg,
  wnr365: wnrMainImg,
  biblia365: bibliaMainImg,
  rhz365: rhzMainImg,
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  broadcastItem?: RadioBroadcastItem;
  stationId?: SongStationId;
  illustrationSrc?: string;
  currentDayNumber?: number;
  onSwitchToLectorModal?: () => void;
}

type Resolution = '1080p' | '720p';

const RESOLUTION_SIZE: Record<Resolution, { width: number; height: number; bitsPerSecond: number }> = {
  '1080p': { width: 1920, height: 1080, bitsPerSecond: 8_000_000 },
  '720p': { width: 1280, height: 720, bitsPerSecond: 4_000_000 },
};

const SONG_TOKEN_STORAGE_KEY = 'songApiToken';

function readStoredToken(): string {
  try {
    return localStorage.getItem(SONG_TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function storeToken(token: string): void {
  try {
    localStorage.setItem(SONG_TOKEN_STORAGE_KEY, token);
  } catch {
    /* localStorage niedostępny (tryb prywatny) – token działa tylko w tej sesji */
  }
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => {
      const c = document.createElement('canvas');
      c.width = 1920;
      c.height = 1080;
      const ctx = c.getContext('2d');
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 1920, 1080);
        grad.addColorStop(0, '#1c1017');
        grad.addColorStop(0.5, '#2e1927');
        grad.addColorStop(1, '#0e0b12');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1920, 1080);
      }
      const fb = new Image();
      fb.onload = () => resolve(fb);
      fb.src = c.toDataURL('image/jpeg');
    };
    image.src = src;
  });
}

/** Zawija tekst do szerokości canvasu; zwraca kolejne linie. */
function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of text.split(' ')) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface FrameState {
  title: string;
  sectionName: string;
  lyricLines: string[];
  activeLineIndex: number;
  progress: number;
}

function drawSongFrame(ctx: CanvasRenderingContext2D, illustration: HTMLImageElement, frame: FrameState): void {
  const { width, height } = ctx.canvas;
  const scale = height / 1080;

  // Ilustracja w trybie "cover"
  const coverScale = Math.max(width / illustration.width, height / illustration.height);
  const drawWidth = illustration.width * coverScale;
  const drawHeight = illustration.height * coverScale;
  ctx.drawImage(illustration, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);

  // Delikatny gradient i winieta filmowa (czarne tło OLED przy krawędziach)
  const shade = ctx.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, 'rgba(0,0,0,0.65)');
  shade.addColorStop(0.2, 'rgba(0,0,0,0.35)');
  shade.addColorStop(0.55, 'rgba(0,0,0,0.4)');
  shade.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);

  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 14 * scale;

  // Nazwa dzieła / sekcji na górze
  ctx.fillStyle = '#f5c26b';
  ctx.font = `600 ${28 * scale}px Georgia, serif`;
  ctx.fillText(frame.sectionName.toUpperCase(), width / 2, 70 * scale);

  // Tytuł pieśni
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${44 * scale}px Georgia, serif`;
  ctx.fillText(frame.title, width / 2, 130 * scale, width - 140 * scale);

  // Aktualna śpiewana linia (duży, ciepły, złoty font z poświatą)
  const currentLine = frame.activeLineIndex >= 0 ? frame.lyricLines[frame.activeLineIndex] : '';
  const nextLine = frame.lyricLines[frame.activeLineIndex + 1] ?? '';
  const lyricFontSize = 62 * scale;
  ctx.font = `700 ${lyricFontSize}px Georgia, serif`;
  ctx.fillStyle = '#fff7e0';
  const wrapped = wrapCanvasText(ctx, currentLine || '♪ ♪ ♪', width - 260 * scale);
  const lyricTop = height * 0.70 - ((wrapped.length - 1) * lyricFontSize * 1.25) / 2;
  wrapped.forEach((line, index) => ctx.fillText(line, width / 2, lyricTop + index * lyricFontSize * 1.25));

  // Następna linia tekstu w tle
  if (nextLine && frame.activeLineIndex >= 0) {
    ctx.font = `500 ${36 * scale}px Georgia, serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(nextLine, width / 2, lyricTop + wrapped.length * lyricFontSize * 1.25 + 24 * scale, width - 260 * scale);
  }

  // Pasek postępu utworu
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(0, height - 10 * scale, width, 10 * scale);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, height - 10 * scale, width * frame.progress, 10 * scale);
}

export const SongVideoExportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  broadcastItem: initialBroadcastItem,
  stationId: initialStationId = 'nowyrhz',
  illustrationSrc: initialIllustrationSrc,
  currentDayNumber = 1,
  onSwitchToLectorModal,
}) => {
  const [selectedStationId, setSelectedStationId] = useState<SongStationId>(
    (initialBroadcastItem?.stationId as SongStationId) || initialStationId
  );
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(
    initialBroadcastItem?.dayNumber || currentDayNumber || 1
  );

  const activeStation = useMemo(() => {
    return RADIO_STATIONS.find(s => s.id === selectedStationId) || RADIO_STATIONS[0];
  }, [selectedStationId]);

  const style = SONG_STYLE_BY_STATION[selectedStationId];

  const broadcastItem: RadioBroadcastItem = useMemo(() => {
    if (initialBroadcastItem && initialBroadcastItem.stationId === selectedStationId && initialBroadcastItem.dayNumber === selectedDayNumber) {
      return initialBroadcastItem;
    }
    return getRadioBroadcastItem(selectedStationId, selectedDayNumber, 1, 1);
  }, [selectedStationId, selectedDayNumber, initialBroadcastItem]);

  const activeIllustrationSrc = useMemo(() => {
    if (initialIllustrationSrc && selectedStationId === (initialBroadcastItem?.stationId || initialStationId)) {
      return initialIllustrationSrc;
    }
    return SECTION_ILLUSTRATIONS[selectedStationId] || SECTION_ILLUSTRATIONS.nowyrhz;
  }, [selectedStationId, initialIllustrationSrc, initialBroadcastItem, initialStationId]);

  const [songTitle, setSongTitle] = useState<string>(broadcastItem.headlineTitle || style.displayName);
  const [lyricsDraft, setLyricsDraft] = useState<string>(() =>
    formatLyricsForLyria(buildSongLyrics(
      broadcastItem.headlineTitle || style.displayName,
      selectSongSourceText(broadcastItem.sections, broadcastItem.speechText || broadcastItem.displayContent)
    ))
  );

  // Synchronizacja przy zmianie stacji lub dnia
  useEffect(() => {
    const newTitle = broadcastItem.headlineTitle || style.displayName;
    setSongTitle(newTitle);
    setLyricsDraft(formatLyricsForLyria(buildSongLyrics(
      newTitle,
      selectSongSourceText(broadcastItem.sections, broadcastItem.speechText || broadcastItem.displayContent)
    )));
    setSong(null);
    setSongAudioUrl(null);
    setVideoBlob(null);
    setVideoUrl(null);
    setErrorMessage(null);
    setGenProgress(0);
    setGenStage('');
    setStatusMessage('Sprawdź tekst piosenki sekcji i kliknij generowanie.');
  }, [selectedStationId, selectedDayNumber, broadcastItem, style.displayName]);

  const [apiToken, setApiToken] = useState<string>(readStoredToken);
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [song, setSong] = useState<GeneratedSong | null>(null);
  const [songAudioUrl, setSongAudioUrl] = useState<string | null>(null);
  const [isGeneratingSong, setIsGeneratingSong] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genStage, setGenStage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [recordedElapsed, setRecordedElapsed] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Sprawdź tekst piosenki sekcji i kliknij generowanie.');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const lyrics = useMemo(() => parseLyriaLyrics(songTitle, lyricsDraft), [songTitle, lyricsDraft]);
  const youtubeMetadata = useMemo(
    () => buildYouTubeMetadata(selectedStationId, lyrics, broadcastItem.displayDate, broadcastItem.reference),
    [selectedStationId, lyrics, broadcastItem.displayDate, broadcastItem.reference]
  );

  useEffect(() => () => {
    if (songAudioUrl) URL.revokeObjectURL(songAudioUrl);
  }, [songAudioUrl]);

  useEffect(() => () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  useEffect(() => () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    audioContextRef.current?.close().catch(() => undefined);
  }, []);

  if (!isOpen) return null;

  /**
   * Generowanie piosenki przez Google Lyria AI z automatycznym przejściem
   * do syntezy studyjnej w razie braku klucza lub błędu płatnego API
   */
  const handleGenerateSongWithLyria = async () => {
    if (!lyrics.sections.length) {
      setErrorMessage('Tekst piosenki jest pusty.');
      return;
    }
    setIsGeneratingSong(true);
    setGenProgress(10);
    setGenStage('Wysyłanie zlecenia do Google Lyria 3.5 AI...');
    setErrorMessage(null);
    setStatusMessage('Google Lyria AI komponuje muzykę i nagrywa wokal… (to może potrwać chwilę)');
    storeToken(apiToken);

    // Symulacja postępu oczekiwania na model Lyria
    const progressInterval = setInterval(() => {
      setGenProgress(prev => (prev < 80 ? prev + 5 : prev));
    }, 1800);

    try {
      const response = await fetch('/api/song', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
        },
        body: JSON.stringify({
          stationId: selectedStationId,
          title: songTitle,
          prompt: buildLyriaPrompt(selectedStationId, lyrics)
        }),
      });

      clearInterval(progressInterval);

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || `Błąd serwera (HTTP ${response.status}).`);
      }

      setGenProgress(90);
      setGenStage('Odbieranie i dekodowanie wygenerowanego utworu...');

      const generatedSong = payload as GeneratedSong;
      if (typeof generatedSong.audioBase64 !== 'string' || !generatedSong.audioBase64) {
        throw new Error('Serwer nie zwrócił ścieżki audio.');
      }

      const audioBlob = new Blob([base64ToUint8Array(generatedSong.audioBase64)], { type: generatedSong.mimeType });
      setSong(generatedSong);
      setSongAudioUrl(URL.createObjectURL(audioBlob));
      setVideoBlob(null);
      setVideoUrl(null);
      setGenProgress(100);
      setGenStage('Piosenka Lyria gotowa!');
      setStatusMessage('✨ Piosenka Lyria AI gotowa! Odsłuchaj ją i kliknij „Nagraj teledysk MP4”.');
    } catch (error) {
      clearInterval(progressInterval);
      const msg = error instanceof Error ? error.message : 'Nie udało się wygenerować piosenki przez Lyria AI.';
      console.warn('[SongVideo] Lyria API błąd, uruchamiam generator studyjny:', msg);
      setStatusMessage('API Lyria niedostępne – przełączam na wbudowany generator wokal + muzyka studyjna…');
      // Automatyczny fallback do syntezy studyjnej z pełnym paskiem postępu
      await handleGenerateStudioSong();
    } finally {
      setIsGeneratingSong(false);
    }
  };

  /**
   * Wbudowana studyjna synteza: Lektor TTS (śpiewny wokal) zmiksowany z
   * polifonicznym sakralnym podkładem muzycznym stacji (fortepian, smyczki, gitara, chór)
   */
  const handleGenerateStudioSong = async () => {
    if (!lyrics.sections.length) {
      setErrorMessage('Tekst piosenki jest pusty.');
      return;
    }
    setIsGeneratingSong(true);
    setGenProgress(5);
    setGenStage('Krok 1/4: Przygotowanie tekstu pieśni i struktury...');
    setErrorMessage(null);
    setStatusMessage('Generowanie studyjnej ścieżki wokalnej i aranżacji muzycznej sekcji…');

    try {
      const AudioCtxClass =
        typeof AudioContext !== 'undefined'
          ? AudioContext
          : typeof window !== 'undefined'
          ? (window as any).AudioContext || (window as any).webkitAudioContext
          : null;

      if (!AudioCtxClass) throw new Error('Przeglądarka nie obsługuje Web Audio API.');

      const tempCtx = new AudioCtxClass();
      const lines = flattenLyricLines(lyrics);

      // 1. Pobranie wokalu wers po wersie z dynamicznym paskiem postępu
      const lineBuffers: AudioBuffer[] = [];
      const totalLines = lines.length || 1;

      for (let i = 0; i < lines.length; i++) {
        const linePct = Math.round(10 + ((i + 1) / totalLines) * 55);
        setGenProgress(linePct);
        setGenStage(`Krok 2/4: Nagrywanie wokalu Lektora AI (${i + 1} z ${totalLines})...`);
        setStatusMessage(`Nagrywanie wokalu: „${lines[i]}” (${Math.round(((i + 1) / totalLines) * 100)}%)`);

        let lineBuf = await fetchAudioForText(lines[i], tempCtx, 0.94, 1.0);
        if (!lineBuf) {
          const wordsCount = lines[i].split(/\s+/).filter(Boolean).length || 4;
          const dur = Math.max(1.3, wordsCount * 0.44);
          lineBuf = tempCtx.createBuffer(1, Math.round(tempCtx.sampleRate * dur), tempCtx.sampleRate);
        }
        lineBuffers.push(lineBuf);

        // Krótka pauza (oddech) między wersami pieśni
        const breathDur = 0.28;
        const breathBuf = tempCtx.createBuffer(1, Math.round(tempCtx.sampleRate * breathDur), tempCtx.sampleRate);
        lineBuffers.push(breathBuf);
      }

      setGenProgress(68);
      setGenStage('Łączenie ścieżek wokalnych…');
      const vocalBuffer = concatenateAudioBuffers(tempCtx, lineBuffers);

      // 2. Syntetyzowanie aranżacji muzycznej sekcji
      const totalSongDur = Math.max(14, vocalBuffer.duration + 4.0);
      setGenProgress(76);
      setGenStage(`Krok 3/4: Komponowanie sakralnej aranżacji muzycznej dla sekcji ${style.displayName}…`);
      setStatusMessage(`Synteza podkładu polifonicznego (fortepian, smyczki, chór) dla ${totalSongDur.toFixed(1)}s…`);
      
      const musicBuffer = await synthesizeStationAccompaniment(selectedStationId, totalSongDur, tempCtx.sampleRate);

      // 3. Zmiksowanie wokalu i muzyki
      setGenProgress(88);
      setGenStage('Krok 4/4: Miksowanie wielościeżkowe (wokal + muzyka) i mastering…');
      setStatusMessage('Wyrównanie dynamiki i mastering bezstratny Float32…');
      
      const mixedBuffer = await mixVocalAndMusicBuffers(vocalBuffer, musicBuffer || vocalBuffer, 0.95, 0.38);

      // 4. Konwersja do WAV
      setGenProgress(95);
      setGenStage('Zapisywanie gotowej ścieżki dźwiękowej WAV…');
      const wavBlob = audioBufferToWavBlob(mixedBuffer);
      const base64Audio = await blobToBase64(wavBlob);

      const generated: GeneratedSong = {
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
        generatedText: lines.join('\n'),
      };

      setSong(generated);
      if (songAudioUrl) URL.revokeObjectURL(songAudioUrl);
      setSongAudioUrl(URL.createObjectURL(wavBlob));
      setVideoBlob(null);
      setVideoUrl(null);
      setGenProgress(100);
      setGenStage('Piosenka studyjna gotowa!');
      setStatusMessage('🎵 Piosenka studyjna gotowa! Odsłuchaj wokal z muzyką i nagraj teledysk MP4.');
      tempCtx.close().catch(() => undefined);
    } catch (err) {
      console.error('[SongVideo] Błąd syntezy studyjnej:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Błąd generowania piosenki studyjnej.');
      setStatusMessage('Generowanie przerwane.');
    } finally {
      setIsGeneratingSong(false);
    }
  };

  /**
   * Nagrywanie teledysku MP4 (lub WebM) z ilustracją w tle, napisami i dźwiękiem
   */
  const handleRecordVideo = async () => {
    const canvas = canvasRef.current;
    if (!song || !canvas) return;

    setErrorMessage(null);
    setIsRecording(true);
    setRecordProgress(0);
    setRecordedElapsed(0);
    setVideoBlob(null);
    setVideoUrl(null);

    try {
      const { width, height, bitsPerSecond } = RESOLUTION_SIZE[resolution];
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Przeglądarka nie obsługuje Canvas 2D.');

      setStatusMessage('Wczytywanie ilustracji i przygotowanie renderera…');
      const illustration = await loadImage(activeIllustrationSrc);

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Bezpieczne skopiowanie bufora przed dekodowaniem, aby zapobiec odłączeniu (detachment)
      const bytes = base64ToUint8Array(song.audioBase64);
      const arrayBufferCopy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      const audioBuffer = await audioContext.decodeAudioData(arrayBufferCopy);
      setTotalDuration(audioBuffer.duration);

      const lyricLines = flattenLyricLines(lyrics);
      const timings: LyricLineTiming[] = computeLyricLineTimings(lyricLines, audioBuffer.duration);
      const frameBase = { title: songTitle, sectionName: style.displayName, lyricLines };

      const audioDestination = audioContext.createMediaStreamDestination();
      const sourceNode = audioContext.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(audioDestination);
      sourceNode.connect(audioContext.destination);

      const mimeType = pickRecordingMimeType(mime => MediaRecorder.isTypeSupported(mime));
      console.log(`[SongVideo] Nagrywanie ${width}x${height}, format=${mimeType}, czas=${audioBuffer.duration.toFixed(1)}s`);

      const stream = new MediaStream([
        ...canvas.captureStream(30).getVideoTracks(),
        ...audioDestination.stream.getAudioTracks(),
      ]);

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: bitsPerSecond,
        audioBitsPerSecond: 192_000
      });
      recorderRef.current = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = event => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        const blob = new Blob(chunks, { type: mimeType.split(';')[0] });
        setVideoBlob(blob);
        setVideoUrl(URL.createObjectURL(blob));
        setIsRecording(false);
        setRecordProgress(100);
        setStatusMessage(mimeType.startsWith('video/mp4')
          ? '✅ Teledysk MP4 gotowy do publikacji w YouTube.'
          : '⚠️ Zapisano w formacie WebM (YouTube również go obsługuje). W przeglądarkach Chrome/Edge pobierzesz bezpośrednio MP4.');
        audioContext.close().catch(() => undefined);
      };

      sourceNode.onended = () => {
        if (recorder.state === 'recording') recorder.stop();
      };

      drawSongFrame(ctx, illustration, { ...frameBase, activeLineIndex: -1, progress: 0 });
      recorder.start(250);
      sourceNode.start();
      const startTime = audioContext.currentTime;
      setStatusMessage('Nagrywanie teledysku w czasie rzeczywistym… Nie zamykaj tego okna.');

      const renderLoop = () => {
        if (recorder.state !== 'recording') return;
        const elapsed = audioContext.currentTime - startTime;
        const progress = Math.min(elapsed / audioBuffer.duration, 1);
        setRecordedElapsed(elapsed);
        drawSongFrame(ctx, illustration, {
          ...frameBase,
          activeLineIndex: findActiveLineIndex(timings, elapsed),
          progress
        });
        setRecordProgress(Math.round(progress * 100));
        animationFrameRef.current = requestAnimationFrame(renderLoop);
      };
      renderLoop();
    } catch (error) {
      console.error('[SongVideo] Błąd nagrywania teledysku:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Nie udało się nagrać teledysku.');
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const handleCopy = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      setErrorMessage('Nie udało się skopiować do schowka.');
    }
  };

  const videoExtension = videoBlob?.type.includes('mp4') ? 'mp4' : 'webm';
  const fileName = buildSongVideoFileName(selectedStationId, broadcastItem.dayNumber, videoExtension);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="w-full max-w-4xl max-h-[94vh] overflow-y-auto rounded-3xl bg-[#0c121d] text-slate-100 border border-amber-500/30 shadow-2xl flex flex-col my-auto">
        
        {/* Nagłówek Modala */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 bg-gradient-to-r from-[#172338] via-[#111a2a] to-[#0c121d] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-sm">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-serif-book text-white">
                  Piosenka z Wokalem, Muzyką i Ilustracją (MP4 YouTube)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold uppercase">
                  4 Sekcje
                </span>
              </div>
              <p className="text-xs text-amber-200/80">
                Wybierz dowolną sekcję i dzień • Wygeneruj wokal i muzykę z tekstu wpisu • Gotowe do publikacji w YouTube
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSwitchToLectorModal && (
              <button
                type="button"
                onClick={onSwitchToLectorModal}
                disabled={isRecording}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-40"
                title="Przełącz na generator wideo z lektorem AI"
              >
                <Video className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Film z lektorem AI</span>
                <span className="sm:hidden">Lektor</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={isRecording}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-40"
              aria-label="Zamknij"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Zawartość Modala */}
        <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          
          {/* 1. SELEKTOR 4 SEKCJI */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span>1. Wybierz sekcję / dzieło:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {RADIO_STATIONS.map(st => {
                const isSel = st.id === selectedStationId;
                return (
                  <button
                    key={st.id}
                    type="button"
                    disabled={isRecording || isGeneratingSong}
                    onClick={() => {
                      setSelectedStationId(st.id as SongStationId);
                      if (selectedDayNumber > st.totalDays) setSelectedDayNumber(1);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer disabled:opacity-50 ${
                      isSel
                        ? 'bg-amber-500/20 border-amber-500 text-white ring-1 ring-amber-500/60 shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-0.5">
                      {st.shortName}
                    </div>
                    <div className="text-xs font-semibold line-clamp-1">
                      {st.name.split('–')[0].trim()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. WYBÓR POZYCJI / DNIA ORAZ ILUSTRACJI */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={activeIllustrationSrc}
                alt={style.displayName}
                className="w-16 h-12 object-cover rounded-xl border border-amber-500/40 shadow-sm"
              />
              <div>
                <div className="text-[11px] font-mono text-amber-400 uppercase">
                  {style.displayName}
                </div>
                <div className="text-sm font-bold line-clamp-1 text-white">
                  {broadcastItem.headlineTitle}
                </div>
                <div className="text-[11px] text-slate-400">
                  {broadcastItem.displayDate} {broadcastItem.reference ? `• ${broadcastItem.reference}` : ''}
                </div>
              </div>
            </div>

            {/* Nawigacja dni */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDayNumber(Math.max(1, selectedDayNumber - 1))}
                disabled={selectedDayNumber <= 1 || isRecording || isGeneratingSong}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 cursor-pointer"
                title="Poprzednia pozycja"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-center px-2">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Dzień / Wpis</div>
                <div className="text-sm font-bold font-mono text-amber-300">
                  {selectedDayNumber} / {activeStation.totalDays}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDayNumber(Math.min(activeStation.totalDays, selectedDayNumber + 1))}
                disabled={selectedDayNumber >= activeStation.totalDays || isRecording || isGeneratingSong}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 cursor-pointer"
                title="Następna pozycja"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3. TEKST PIOSENKI (ZWROTKI I REFREN) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider" htmlFor="song-title">
                2. Tytuł i Tekst Piosenki (z wpisu sekcji)
              </label>
              <button
                type="button"
                onClick={() => {
                  const newTitle = broadcastItem.headlineTitle || style.displayName;
                  setSongTitle(newTitle);
                  setLyricsDraft(formatLyricsForLyria(buildSongLyrics(
                    newTitle,
                    selectSongSourceText(broadcastItem.sections, broadcastItem.speechText || broadcastItem.displayContent)
                  )));
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Przywróć tekst domyślny
              </button>
            </div>

            <input
              id="song-title"
              type="text"
              value={songTitle}
              onChange={e => setSongTitle(e.target.value)}
              disabled={isGeneratingSong || isRecording}
              maxLength={200}
              placeholder="Tytuł pieśni..."
              className="w-full rounded-xl border border-white/20 bg-black/40 px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />

            <textarea
              id="song-lyrics"
              value={lyricsDraft}
              onChange={e => setLyricsDraft(e.target.value)}
              disabled={isGeneratingSong || isRecording}
              rows={9}
              className="w-full rounded-xl border border-white/20 bg-black/40 p-3.5 font-mono text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 custom-scrollbar"
              placeholder="[Verse]&#10;Tekst zwrotki...&#10;&#10;[Chorus]&#10;Tekst refrenu..."
            />

            {/* Przyciski generowania piosenki (Wokal + Muzyka) */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleGenerateStudioSong}
                disabled={isGeneratingSong || isRecording}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-amber-950/40 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-95"
              >
                {isGeneratingSong ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
                <span>Generuj piosenkę studyjną (Wokal + Muzyka sekcji)</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateSongWithLyria}
                disabled={isGeneratingSong || isRecording}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
                title="Generuj wokal i muzykę przez Google Lyria 3.5 AI"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Generuj przez Google Lyria AI</span>
              </button>

              <input
                type="password"
                value={apiToken}
                onChange={e => setApiToken(e.target.value)}
                placeholder="Token Lyria (opcjonalny)"
                className="rounded-xl border border-white/20 bg-transparent px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
            </div>

            {/* WIZUALNY PASEK POSTĘPU GENEROWANIA AUDIO PIOSENKI */}
            {isGeneratingSong && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-rose-500/20 border border-amber-500/40 space-y-2.5 shadow-lg animate-pulse-subtle">
                <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>{genStage || 'Generowanie piosenki (wokal + muzyka)...'}</span>
                  </div>
                  <span className="font-mono text-sm font-extrabold text-amber-300 px-2 py-0.5 rounded-md bg-amber-500/30">
                    {genProgress}%
                  </span>
                </div>
                
                {/* Pasek postępu */}
                <div className="w-full h-3 rounded-full bg-black/50 overflow-hidden border border-white/10 p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 transition-all duration-300 ease-out shadow-sm"
                    style={{ width: `${Math.max(4, Math.min(100, genProgress))}%` }}
                  />
                </div>
                <div className="text-[11px] text-stone-300 line-clamp-1">{statusMessage}</div>
              </div>
            )}
          </section>

          {/* 4. ODSŁUCH WYGENEROWANEJ PIOSENKI */}
          {song && songAudioUrl && (
            <section className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4" />
                  <span>3. Odsłuchaj wygenerowaną piosenkę (Wokal + Muzyka):</span>
                </div>
                <a
                  href={songAudioUrl}
                  download={buildSongVideoFileName(selectedStationId, broadcastItem.dayNumber, 'mp3')}
                  className="inline-flex items-center gap-1 underline text-white hover:text-amber-300"
                >
                  <Download className="w-3.5 h-3.5" /> Pobierz ścieżkę audio
                </a>
              </div>
              <audio controls src={songAudioUrl} className="w-full custom-audio-player" />
            </section>
          )}

          {/* 5. GENERATOR WIDEO MP4 DLA YOUTUBE */}
          {song && (
            <section className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Video className="w-4 h-4 text-red-500" />
                    <span>4. Wygeneruj film MP4 gotowy do publikacji w YouTube</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Rozdzielczość 1080p Full HD lub 720p • Dedykowana ilustracja dzieła w tle • Napisy synchronizowane
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={resolution}
                    onChange={e => setResolution(e.target.value as Resolution)}
                    disabled={isRecording}
                    className="rounded-xl border border-white/20 bg-[#111827] px-3 py-1.5 text-xs text-white"
                  >
                    <option value="1080p">1080p Full HD (1920×1080)</option>
                    <option value="720p">720p HD (1280×720)</option>
                  </select>

                  {isRecording ? (
                    <button
                      type="button"
                      onClick={handleStopRecording}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold cursor-pointer hover:bg-red-500"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Zatrzymaj nagranie ({recordProgress}%)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRecordVideo}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-950/40 hover:from-red-500 hover:to-amber-500 transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <Video className="w-4 h-4" />
                      <span>Nagraj teledysk MP4</span>
                    </button>
                  )}
                </div>
              </div>

              {/* WIZUALNY PASEK POSTĘPU NAGRYWANIA WIDEO */}
              {isRecording && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500/20 via-rose-500/15 to-amber-500/20 border border-red-500/40 space-y-2.5 shadow-lg">
                  <div className="flex items-center justify-between text-xs font-bold text-red-300">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                      <span>Nagrywanie teledysku MP4 w czasie rzeczywistym...</span>
                    </div>
                    <span className="font-mono text-sm font-extrabold text-amber-300 px-2 py-0.5 rounded-md bg-red-600/30">
                      {recordProgress}%
                    </span>
                  </div>

                  {/* Pasek postępu */}
                  <div className="w-full h-3 rounded-full bg-black/50 overflow-hidden border border-white/10 p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 transition-all duration-150 ease-out shadow-sm"
                      style={{ width: `${Math.max(2, Math.min(100, recordProgress))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-300">
                    <span>{statusMessage}</span>
                    {totalDuration > 0 && (
                      <span className="font-mono text-amber-300 font-bold">
                        {recordedElapsed.toFixed(1)}s / {totalDuration.toFixed(1)}s
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Płótno Canvas do podglądu nagrania */}
              <canvas
                ref={canvasRef}
                className="w-full aspect-video rounded-2xl bg-black border border-white/20 shadow-2xl"
              />

              {videoUrl && (
                <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-emerald-300 font-semibold">
                    ✅ Teledysk pomyślnie wyrenderowany! Rozmiar: {((videoBlob?.size ?? 0) / 1024 / 1024).toFixed(1)} MB.
                  </div>
                  <a
                    href={videoUrl}
                    download={fileName}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-all hover:scale-105"
                  >
                    <Download className="w-4 h-4" />
                    <span>Pobierz gotowy plik: {fileName}</span>
                  </a>
                </div>
              )}
            </section>
          )}

          {/* 6. PAKIET PUBLIKACJI YOUTUBE (Tytuł, Opis, Tagi) */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              5. Metadane dla YouTube (1-kliknięcie kopiuje do schowka)
            </h3>
            {([
              ['title', 'Tytuł filmu na YouTube', youtubeMetadata.title],
              ['description', 'Opis filmu (z tekstem pieśni i tagami)', youtubeMetadata.description],
              ['tags', 'Tagi YouTube (rozdzielone przecinkami)', youtubeMetadata.tags.join(', ')],
            ] as const).map(([field, label, value]) => (
              <div key={field} className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>{label}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(field, value)}
                    className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 cursor-pointer"
                  >
                    {copiedField === field ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === field ? 'Skopiowano!' : 'Kopiuj'}</span>
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-xs text-slate-300/80 max-h-24 overflow-y-auto font-sans custom-scrollbar">
                  {value}
                </pre>
              </div>
            ))}
          </section>

          {/* Pasek statusu */}
          <div className="text-xs pt-1">
            <div className="text-slate-400">{statusMessage}</div>
            {errorMessage && (
              <div className="text-red-400 font-semibold mt-1 p-2 rounded-xl bg-red-950/40 border border-red-500/30">
                {errorMessage}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
