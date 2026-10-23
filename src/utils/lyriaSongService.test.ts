import { describe, it, expect, vi } from 'vitest';
import {
  validateSongRequest,
  isSongRequestAuthorized,
  extractLyriaSong,
  requestLyriaSong,
  LyriaApiError,
  LYRIA_INTERACTIONS_URL,
  LYRIA_MODEL_ID,
  MAX_SONG_PROMPT_CHARS,
} from './lyriaSongService';

describe('validateSongRequest', () => {
  it('accepts a valid request and trims fields', () => {
    const result = validateSongRequest({ stationId: 'biblia365', title: '  Rdz 1 ', prompt: ' [Verse]\nNa początku ' });
    expect(result).toEqual({
      ok: true,
      value: { stationId: 'biblia365', title: 'Rdz 1', prompt: '[Verse]\nNa początku' },
    });
  });

  it('rejects non-object bodies', () => {
    expect(validateSongRequest(null)).toMatchObject({ ok: false });
    expect(validateSongRequest('text')).toMatchObject({ ok: false });
  });

  it('rejects unknown sections', () => {
    expect(validateSongRequest({ stationId: 'radio', prompt: 'x' })).toMatchObject({ ok: false });
  });

  it('rejects empty and too long prompts', () => {
    expect(validateSongRequest({ stationId: 'wnr365', prompt: '   ' })).toMatchObject({ ok: false });
    expect(validateSongRequest({ stationId: 'wnr365', prompt: 'a'.repeat(MAX_SONG_PROMPT_CHARS + 1) }))
      .toMatchObject({ ok: false });
  });

  it('defaults a missing title to an empty string', () => {
    const result = validateSongRequest({ stationId: 'nowyrhz', prompt: 'tekst' });
    expect(result).toMatchObject({ ok: true, value: { title: '' } });
  });
});

describe('isSongRequestAuthorized', () => {
  it('allows every request when no token is configured', () => {
    expect(isSongRequestAuthorized(undefined, undefined)).toBe(true);
    expect(isSongRequestAuthorized('', null)).toBe(true);
  });

  it('requires an exact bearer token when configured', () => {
    expect(isSongRequestAuthorized('secret', 'Bearer secret')).toBe(true);
    expect(isSongRequestAuthorized('secret', 'Bearer wrong')).toBe(false);
    expect(isSongRequestAuthorized('secret', undefined)).toBe(false);
  });
});

describe('extractLyriaSong', () => {
  it('reads SDK convenience fields', () => {
    const song = extractLyriaSong({ output_audio: { type: 'audio', data: 'QUJD', mime_type: 'audio/wav' }, output_text: 'lyrics' });
    expect(song).toEqual({ audioBase64: 'QUJD', mimeType: 'audio/wav', generatedText: 'lyrics' });
  });

  it('reads raw REST steps and defaults mime type to MP3', () => {
    const song = extractLyriaSong({
      steps: [
        { type: 'user_input', content: [{ type: 'text', text: 'prompt' }] },
        { type: 'model_output', content: [{ type: 'text', text: '[Verse] ...' }, { type: 'audio', data: 'TVAz' }] },
      ],
    });
    expect(song?.audioBase64).toBe('TVAz');
    expect(song?.mimeType).toBe('audio/mpeg');
    expect(song?.generatedText).toContain('[Verse]');
  });

  it('returns null when there is no audio', () => {
    expect(extractLyriaSong({ steps: [{ content: [{ type: 'text', text: 'only text' }] }] })).toBeNull();
    expect(extractLyriaSong(undefined)).toBeNull();
  });
});

describe('requestLyriaSong', () => {
  it('sends the model and prompt with the API key header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ output_audio: { type: 'audio', data: 'QUJD' } }), { status: 200 })
    );

    const song = await requestLyriaSong('key-123', 'prompt text', fetchMock);

    expect(song.audioBase64).toBe('QUJD');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(LYRIA_INTERACTIONS_URL);
    expect(init.headers['x-goog-api-key']).toBe('key-123');
    expect(JSON.parse(init.body)).toEqual({ model: LYRIA_MODEL_ID, input: 'prompt text' });
  });

  it('throws LyriaApiError on HTTP errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchMock = vi.fn().mockResolvedValue(new Response('quota', { status: 429 }));
    await expect(requestLyriaSong('key', 'p', fetchMock)).rejects.toBeInstanceOf(LyriaApiError);
  });

  it('throws LyriaApiError when the response has no audio', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ steps: [] }), { status: 200 }));
    await expect(requestLyriaSong('key', 'p', fetchMock)).rejects.toThrow('nie zwróciła ścieżki audio');
  });
});
