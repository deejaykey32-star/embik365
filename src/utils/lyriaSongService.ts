/**
 * Serwis generowania piosenek (muzyka + wokal) przez Google Lyria w Gemini API.
 *
 * Moduł jest współdzielony przez serwer Express (server.ts) i Cloudflare Pages Functions,
 * dlatego używa wyłącznie standardowego `fetch` (bez SDK i bez API Node.js).
 */

export const LYRIA_MODEL_ID = 'lyria-3.5';
export const LYRIA_INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';

export const SONG_STATION_IDS = ['wnr365', 'rhz365', 'nowyrhz', 'biblia365'] as const;
export type SongStationId = typeof SONG_STATION_IDS[number];

export const MAX_SONG_PROMPT_CHARS = 4000;
export const MAX_SONG_TITLE_CHARS = 200;

export interface SongGenerationRequest {
  stationId: SongStationId;
  title: string;
  prompt: string;
}

export interface GeneratedSong {
  audioBase64: string;
  mimeType: string;
  generatedText: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export class LyriaApiError extends Error {
  constructor(message: string, readonly httpStatus: number) {
    super(message);
    this.name = 'LyriaApiError';
  }
}

function isSongStationId(value: unknown): value is SongStationId {
  return typeof value === 'string' && (SONG_STATION_IDS as readonly string[]).includes(value);
}

/** Waliduje ciało żądania POST /api/song, zanim trafi do płatnego API. */
export function validateSongRequest(body: unknown): ValidationResult<SongGenerationRequest> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Nieprawidłowe ciało żądania.' };
  }
  const { stationId, title, prompt } = body as Record<string, unknown>;

  if (!isSongStationId(stationId)) {
    return { ok: false, error: `Nieznana sekcja. Dozwolone: ${SONG_STATION_IDS.join(', ')}.` };
  }
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return { ok: false, error: 'Brak tekstu piosenki.' };
  }
  if (prompt.length > MAX_SONG_PROMPT_CHARS) {
    return { ok: false, error: `Tekst piosenki przekracza ${MAX_SONG_PROMPT_CHARS} znaków.` };
  }
  const safeTitle = typeof title === 'string' ? title.trim().slice(0, MAX_SONG_TITLE_CHARS) : '';

  return { ok: true, value: { stationId, title: safeTitle, prompt: prompt.trim() } };
}

/**
 * Sprawdza opcjonalny token dostępu. Gdy SONG_API_TOKEN nie jest ustawiony,
 * endpoint pozostaje otwarty (tak jak pozostałe endpointy aplikacji).
 */
export function isSongRequestAuthorized(
  configuredToken: string | undefined,
  authorizationHeader: string | null | undefined
): boolean {
  if (!configuredToken) return true;
  return authorizationHeader === `Bearer ${configuredToken}`;
}

interface LyriaContentBlock {
  type?: string;
  data?: string;
  mime_type?: string;
  text?: string;
}

interface LyriaStep {
  type?: string;
  content?: LyriaContentBlock[];
}

/**
 * Wyciąga audio i tekst z odpowiedzi Interactions API.
 * Obsługuje zarówno pola wygodne SDK (`output_audio`), jak i surowy REST (`steps[].content[]`).
 */
export function extractLyriaSong(interaction: unknown): GeneratedSong | null {
  if (!interaction || typeof interaction !== 'object') return null;
  const response = interaction as {
    output_audio?: LyriaContentBlock;
    output_text?: string;
    steps?: LyriaStep[];
    outputs?: LyriaContentBlock[];
  };

  const contentBlocks: LyriaContentBlock[] = [
    ...(response.steps ?? []).flatMap(step => step.content ?? []),
    ...(response.outputs ?? []),
  ];

  const audioBlock =
    (response.output_audio?.data ? response.output_audio : undefined) ??
    contentBlocks.find(block => block.type === 'audio' && block.data);

  if (!audioBlock?.data) return null;

  const generatedText =
    response.output_text ??
    contentBlocks
      .filter(block => block.type === 'text' && block.text)
      .map(block => block.text)
      .join('\n');

  return {
    audioBase64: audioBlock.data,
    mimeType: audioBlock.mime_type || 'audio/mpeg',
    generatedText,
  };
}

/** Wywołuje Lyrię i zwraca wygenerowany utwór. `fetchImpl` umożliwia testy bez sieci. */
export async function requestLyriaSong(
  apiKey: string,
  prompt: string,
  fetchImpl: typeof fetch = fetch
): Promise<GeneratedSong> {
  const response = await fetchImpl(LYRIA_INTERACTIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({ model: LYRIA_MODEL_ID, input: prompt }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    console.error(`[Lyria] HTTP ${response.status}: ${errorBody.slice(0, 500)}`);
    throw new LyriaApiError(`Lyria API zwróciło błąd HTTP ${response.status}.`, 502);
  }

  const interaction: unknown = await response.json();
  const song = extractLyriaSong(interaction);
  if (!song) {
    console.error('[Lyria] Odpowiedź bez audio:', JSON.stringify(interaction).slice(0, 500));
    throw new LyriaApiError('Lyria nie zwróciła ścieżki audio.', 502);
  }
  return song;
}

export const GEMINI_AUDIO_MODEL_ID = 'gemini-2.0-flash';
export const GEMINI_AUDIO_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_AUDIO_MODEL_ID}:generateContent`;

/** Wyciąga audio (WAV/MP3) z odpowiedzi Gemini 2.0 Flash Audio */
export function extractGeminiAudioSong(payload: unknown): GeneratedSong | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
          inlineData?: { mimeType?: string; data?: string };
        }>;
      };
    }>;
  };
  const parts = p.candidates?.[0]?.content?.parts || [];
  const audioPart = parts.find(part => part.inlineData?.data);
  if (!audioPart?.inlineData?.data) return null;

  const generatedText = parts
    .filter(part => typeof part.text === 'string' && part.text)
    .map(part => part.text)
    .join('\n');

  return {
    audioBase64: audioPart.inlineData.data,
    mimeType: audioPart.inlineData.mimeType || 'audio/wav',
    generatedText,
  };
}

/**
 * Wywołuje Gemini 2.0 Flash z modalnością AUDIO i głosem śpiewnym Aoede.
 */
export async function requestGeminiAudioSong(
  apiKey: string,
  prompt: string,
  voiceName: string = 'Aoede',
  fetchImpl: typeof fetch = fetch
): Promise<GeneratedSong> {
  const url = `${GEMINI_AUDIO_URL}?key=${encodeURIComponent(apiKey)}`;
  const singingPrompt = `Jesteś profesjonalnym wokalistą sakralnym. Zaśpiewaj melodyjnie, czysto i uroczyście w stylu pieśni religijnej poniższy pełny tekst. Prowadź wyrazisty, melodyjny śpiew z podziałem na zwrotki i refren:\n\n${prompt}`;

  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: singingPrompt }],
        },
      ],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName || 'Aoede',
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    console.error(`[GeminiAudio] HTTP ${response.status}: ${errorBody.slice(0, 500)}`);
    throw new LyriaApiError(
      `Gemini Audio API zwróciło błąd HTTP ${response.status}.`,
      response.status >= 500 ? 502 : response.status
    );
  }

  const payload: unknown = await response.json();
  const song = extractGeminiAudioSong(payload);
  if (!song) {
    console.error('[GeminiAudio] Odpowiedź bez audio:', JSON.stringify(payload).slice(0, 500));
    throw new LyriaApiError('Gemini Audio nie zwróciło ścieżki audio.', 502);
  }
  return song;
}

/**
 * Próbuje wygenerować wokal pieśni najpierw przez Google Lyria,
 * a jeśli Lyria jest niedostępna (np. brak wczesnego dostępu lub HTTP 404/502),
 * natychmiast używa Gemini 2.0 Flash Audio (wokal Aoede / Kore).
 */
export async function requestAiSingingSong(
  apiKey: string,
  prompt: string,
  fetchImpl: typeof fetch = fetch
): Promise<GeneratedSong> {
  try {
    return await requestLyriaSong(apiKey, prompt, fetchImpl);
  } catch (lyriaErr) {
    console.warn('[Song] Lyria 3.5 niedostępna, przełączam na Gemini 2.0 Flash Audio (wokal AI):', lyriaErr);
    return await requestGeminiAudioSong(apiKey, prompt, 'Aoede', fetchImpl);
  }
}
