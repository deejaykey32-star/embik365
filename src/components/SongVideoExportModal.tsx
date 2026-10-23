import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Music, Video, Download, Loader2, Copy, Check, Square } from 'lucide-react';
import type { RadioBroadcastItem } from '../utils/radioContentService';
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
} from '../utils/songVideoBuilder';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  broadcastItem: RadioBroadcastItem;
  stationId: SongStationId;
  illustrationSrc: string;
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
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Nie udało się wczytać ilustracji: ${src}`));
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

  const shade = ctx.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, 'rgba(0,0,0,0.55)');
  shade.addColorStop(0.45, 'rgba(0,0,0,0.25)');
  shade.addColorStop(1, 'rgba(0,0,0,0.8)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);

  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 12 * scale;

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `600 ${28 * scale}px Georgia, serif`;
  ctx.fillText(frame.sectionName, width / 2, 70 * scale);
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${46 * scale}px Georgia, serif`;
  ctx.fillText(frame.title, width / 2, 130 * scale, width - 120 * scale);

  const currentLine = frame.activeLineIndex >= 0 ? frame.lyricLines[frame.activeLineIndex] : '';
  const nextLine = frame.lyricLines[frame.activeLineIndex + 1] ?? '';
  const lyricFontSize = 64 * scale;
  ctx.font = `700 ${lyricFontSize}px Georgia, serif`;
  ctx.fillStyle = '#fff7e0';
  const wrapped = wrapCanvasText(ctx, currentLine || '♪', width - 240 * scale);
  const lyricTop = height * 0.72 - ((wrapped.length - 1) * lyricFontSize * 1.2) / 2;
  wrapped.forEach((line, index) => ctx.fillText(line, width / 2, lyricTop + index * lyricFontSize * 1.2));

  if (nextLine && frame.activeLineIndex >= 0) {
    ctx.font = `500 ${38 * scale}px Georgia, serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(nextLine, width / 2, lyricTop + wrapped.length * lyricFontSize * 1.2 + 20 * scale, width - 240 * scale);
  }

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(0, height - 8 * scale, width, 8 * scale);
  ctx.fillStyle = '#f5c26b';
  ctx.fillRect(0, height - 8 * scale, width * frame.progress, 8 * scale);
}

export const SongVideoExportModal: React.FC<Props> = ({ isOpen, onClose, broadcastItem, stationId, illustrationSrc }) => {
  const style = SONG_STYLE_BY_STATION[stationId];

  const [songTitle, setSongTitle] = useState<string>(broadcastItem.headlineTitle || style.displayName);
  const [lyricsDraft, setLyricsDraft] = useState<string>(() =>
    formatLyricsForLyria(buildSongLyrics(
      broadcastItem.headlineTitle || style.displayName,
      selectSongSourceText(broadcastItem.sections, broadcastItem.speechText || broadcastItem.displayContent)
    ))
  );
  const [apiToken, setApiToken] = useState<string>(readStoredToken);
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [song, setSong] = useState<GeneratedSong | null>(null);
  const [songAudioUrl, setSongAudioUrl] = useState<string | null>(null);
  const [isGeneratingSong, setIsGeneratingSong] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Sprawdź tekst piosenki i wygeneruj muzykę.');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const lyrics = useMemo(() => parseLyriaLyrics(songTitle, lyricsDraft), [songTitle, lyricsDraft]);
  const youtubeMetadata = useMemo(
    () => buildYouTubeMetadata(stationId, lyrics, broadcastItem.displayDate, broadcastItem.reference),
    [stationId, lyrics, broadcastItem.displayDate, broadcastItem.reference]
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

  const handleGenerateSong = async () => {
    if (!lyrics.sections.length) {
      setErrorMessage('Tekst piosenki jest pusty.');
      return;
    }
    setIsGeneratingSong(true);
    setErrorMessage(null);
    setStatusMessage('Lyria komponuje muzykę i nagrywa wokal… (to może potrwać 1–2 minuty)');
    storeToken(apiToken);

    try {
      const response = await fetch('/api/song', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
        },
        body: JSON.stringify({ stationId, title: songTitle, prompt: buildLyriaPrompt(stationId, lyrics) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error('[SongVideo] /api/song error', response.status, payload);
        throw new Error(payload.error || `Błąd serwera (HTTP ${response.status}).`);
      }

      const generatedSong = payload as GeneratedSong;
      if (typeof generatedSong.audioBase64 !== 'string' || !generatedSong.audioBase64) {
        console.error('[SongVideo] /api/song returned no audio', payload);
        throw new Error('Serwer nie zwrócił ścieżki audio.');
      }
      const audioBlob = new Blob([base64ToUint8Array(generatedSong.audioBase64)], { type: generatedSong.mimeType });
      setSong(generatedSong);
      setSongAudioUrl(URL.createObjectURL(audioBlob));
      setVideoBlob(null);
      setVideoUrl(null);
      setStatusMessage('Piosenka gotowa. Odsłuchaj ją i nagraj teledysk MP4.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nie udało się wygenerować piosenki.');
      setStatusMessage('Generowanie przerwane.');
    } finally {
      setIsGeneratingSong(false);
    }
  };

  const handleRecordVideo = async () => {
    const canvas = canvasRef.current;
    if (!song || !canvas) return;

    setErrorMessage(null);
    setIsRecording(true);
    setRecordProgress(0);
    setVideoBlob(null);
    setVideoUrl(null);

    try {
      const { width, height, bitsPerSecond } = RESOLUTION_SIZE[resolution];
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Przeglądarka nie obsługuje Canvas 2D.');

      setStatusMessage('Przygotowanie ilustracji i ścieżki dźwiękowej…');
      const illustration = await loadImage(illustrationSrc);
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const audioBuffer = await audioContext.decodeAudioData(base64ToUint8Array(song.audioBase64).buffer as ArrayBuffer);

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
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: bitsPerSecond, audioBitsPerSecond: 192_000 });
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
          : '⚠️ Ta przeglądarka nie nagrywa MP4 – zapisano WebM (YouTube też go przyjmie). Dla MP4 użyj Chrome lub Edge.');
        audioContext.close().catch(() => undefined);
      };
      sourceNode.onended = () => {
        if (recorder.state === 'recording') recorder.stop();
      };

      drawSongFrame(ctx, illustration, { ...frameBase, activeLineIndex: -1, progress: 0 });
      recorder.start(250);
      sourceNode.start();
      const startTime = audioContext.currentTime;
      setStatusMessage('Nagrywanie teledysku w czasie rzeczywistym… Nie zamykaj tej karty.');

      const renderLoop = () => {
        if (recorder.state !== 'recording') return;
        const elapsed = audioContext.currentTime - startTime;
        const progress = Math.min(elapsed / audioBuffer.duration, 1);
        drawSongFrame(ctx, illustration, { ...frameBase, activeLineIndex: findActiveLineIndex(timings, elapsed), progress });
        setRecordProgress(Math.round(progress * 100));
        animationFrameRef.current = requestAnimationFrame(renderLoop);
      };
      renderLoop();
    } catch (error) {
      console.error('[SongVideo] Błąd nagrywania', error);
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
  const fileName = buildSongVideoFileName(stationId, broadcastItem.dayNumber, videoExtension);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#0f172a] text-[#2d2015] dark:text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e4ccb5] dark:border-[#24334a] px-5 py-3">
          <div className="flex items-center gap-2 font-bold">
            <Music className="w-5 h-5 text-amber-600" />
            <span>Teledysk – piosenka dnia ({style.displayName})</span>
          </div>
          <button type="button" onClick={onClose} disabled={isRecording} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer disabled:opacity-40" aria-label="Zamknij">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-sm">
          <section className="space-y-2">
            <label className="font-semibold block" htmlFor="song-title">Tytuł piosenki</label>
            <input
              id="song-title"
              type="text"
              value={songTitle}
              onChange={event => setSongTitle(event.target.value)}
              disabled={isGeneratingSong || isRecording}
              maxLength={200}
              className="w-full rounded-xl border border-[#d8c8b4] dark:border-[#24334a] bg-[#fffaf3] dark:bg-[#121a28] px-3 py-2 text-sm"
            />
            <label className="font-semibold block" htmlFor="song-lyrics">1. Tekst piosenki ({broadcastItem.displayDate})</label>
            <p className="text-xs opacity-70">Znaczniki [Verse] i [Chorus] oznaczają zwrotki i refren. Możesz dowolnie poprawić tekst.</p>
            <textarea
              id="song-lyrics"
              value={lyricsDraft}
              onChange={event => setLyricsDraft(event.target.value)}
              disabled={isGeneratingSong || isRecording}
              rows={12}
              className="w-full rounded-xl border border-[#d8c8b4] dark:border-[#24334a] bg-[#fffaf3] dark:bg-[#121a28] p-3 font-mono text-xs"
            />
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="password"
                value={apiToken}
                onChange={event => setApiToken(event.target.value)}
                placeholder="Token dostępu (jeśli wymagany)"
                className="rounded-lg border border-[#d8c8b4] dark:border-[#24334a] bg-transparent px-2 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={handleGenerateSong}
                disabled={isGeneratingSong || isRecording}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingSong ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Music className="w-3.5 h-3.5" />}
                <span>{song ? 'Wygeneruj ponownie' : 'Generuj piosenkę (Lyria)'}</span>
              </button>
            </div>
          </section>

          {song && songAudioUrl && (
            <section className="space-y-2">
              <div className="font-semibold">2. Odsłuch</div>
              <audio controls src={songAudioUrl} className="w-full" />
              <a href={songAudioUrl} download={buildSongVideoFileName(stationId, broadcastItem.dayNumber, 'mp3')} className="inline-flex items-center gap-1 text-xs underline">
                <Download className="w-3.5 h-3.5" /> Pobierz MP3
              </a>
            </section>
          )}

          {song && (
            <section className="space-y-2">
              <div className="font-semibold">3. Teledysk MP4</div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={resolution}
                  onChange={event => setResolution(event.target.value as Resolution)}
                  disabled={isRecording}
                  className="rounded-lg border border-[#d8c8b4] dark:border-[#24334a] bg-transparent px-2 py-1.5 text-xs"
                >
                  <option value="1080p">1080p (1920×1080)</option>
                  <option value="720p">720p (1280×720)</option>
                </select>
                {isRecording ? (
                  <button type="button" onClick={handleStopRecording} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-700 text-white text-xs font-bold cursor-pointer">
                    <Square className="w-3.5 h-3.5" /> Zatrzymaj ({recordProgress}%)
                  </button>
                ) : (
                  <button type="button" onClick={handleRecordVideo} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 text-white text-xs font-bold cursor-pointer">
                    <Video className="w-3.5 h-3.5" /> Nagraj teledysk
                  </button>
                )}
              </div>
              <canvas ref={canvasRef} className="w-full aspect-video rounded-xl bg-black" />
              {videoUrl && (
                <a href={videoUrl} download={fileName} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2d2015] dark:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold">
                  <Download className="w-3.5 h-3.5" /> Pobierz {fileName} ({((videoBlob?.size ?? 0) / 1024 / 1024).toFixed(1)} MB)
                </a>
              )}
            </section>
          )}

          <section className="space-y-2">
            <div className="font-semibold">Metadane YouTube</div>
            {([['title', 'Tytuł', youtubeMetadata.title], ['description', 'Opis', youtubeMetadata.description], ['tags', 'Tagi', youtubeMetadata.tags.join(', ')]] as const).map(([field, label, value]) => (
              <div key={field} className="rounded-xl border border-[#e4ccb5] dark:border-[#24334a] p-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>{label}</span>
                  <button type="button" onClick={() => handleCopy(field, value)} className="inline-flex items-center gap-1 cursor-pointer">
                    {copiedField === field ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Kopiuj
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-xs opacity-80 max-h-32 overflow-y-auto">{value}</pre>
              </div>
            ))}
          </section>

          <div className="text-xs">
            <div className="opacity-80">{statusMessage}</div>
            {errorMessage && <div className="text-red-600 dark:text-red-400 font-semibold mt-1">{errorMessage}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
