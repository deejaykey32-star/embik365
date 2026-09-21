import { SUPPORTED_LANGUAGES } from '../types';

export type LectorMode = 'local' | 'online';
export type LectorGender = 'male' | 'female';

export interface OnlineVoiceOption {
  id: string;
  name: string;
  lang: string;
  gender: LectorGender;
  description: string;
  provider: string;
}

export interface LectorConfig {
  mode: LectorMode;
  lang: string;
  gender: LectorGender;
  localVoiceURI: string;
  onlineVoiceId: string;
  rate: number;   // 0.5 to 2.0 (default 1.0)
  pitch: number;  // 0.5 to 1.5 (default 1.0)
  volume: number; // 0.0 to 1.0 (default 1.0)
}

export const ONLINE_VOICES: OnlineVoiceOption[] = [
  // Polski
  { id: 'pl-AI-Jan', name: 'Jan ♂ (Lektor Męski - Głęboki i Podniosły)', lang: 'pl', gender: 'male', description: 'Głęboki, ciepły głos lektorski do rozważań i czytań duchowych', provider: 'AI Cloud Male' },
  { id: 'pl-AI-Piotr', name: 'Piotr ♂ (Lektor Męski - Klasztorny i Uroczysty)', lang: 'pl', gender: 'male', description: 'Uroczysty, spokojny głos do kontemplacji i modlitwy', provider: 'AI Cloud Deep Male' },
  { id: 'pl-AI-Ewa', name: 'Ewa ♀ (Lektorka Żeńska - Spokojna i Ciepła)', lang: 'pl', gender: 'female', description: 'Jasny, ciepły głos czytelniczy i medytacyjny', provider: 'AI Cloud Female' },
  { id: 'pl-AI-Maria', name: 'Maria ♀ (Lektorka Żeńska - Wyrazista i Delikatna)', lang: 'pl', gender: 'female', description: 'Wyrazisty, krystaliczny głos do lektury Pisma Świętego', provider: 'AI Cloud Gentle Female' },

  // English
  { id: 'en-AI-David', name: 'David ♂ (AI Male Narrator)', lang: 'en', gender: 'male', description: 'Warm, articulate male narrator voice', provider: 'AI Cloud Male' },
  { id: 'en-AI-James', name: 'James ♂ (AI Deep Reverent Male)', lang: 'en', gender: 'male', description: 'Reverent, deep male voice for meditation', provider: 'AI Cloud Deep Male' },
  { id: 'en-AI-Emma', name: 'Emma ♀ (AI Female Reader)', lang: 'en', gender: 'female', description: 'Clear, gentle female reading voice', provider: 'AI Cloud Female' },
  { id: 'en-AI-Sarah', name: 'Sarah ♀ (AI Meditative Female)', lang: 'en', gender: 'female', description: 'Soft, inspirational female voice', provider: 'AI Cloud Gentle Female' },

  // Español
  { id: 'es-AI-Mateo', name: 'Mateo ♂ (Lector Masculino Cálido)', lang: 'es', gender: 'male', description: 'Voz cálida y pausada para reflexiones', provider: 'AI Cloud Male' },
  { id: 'es-AI-Carlos', name: 'Carlos ♂ (Lector Masculino Solemne)', lang: 'es', gender: 'male', description: 'Voz grave y solemne', provider: 'AI Cloud Deep Male' },
  { id: 'es-AI-Sofia', name: 'Sofía ♀ (Lectora Femenina Serena)', lang: 'es', gender: 'female', description: 'Voz clara e inspiradora para la oración', provider: 'AI Cloud Female' },
  { id: 'es-AI-Lucia', name: 'Lucía ♀ (Lectora Femenina Dulce)', lang: 'es', gender: 'female', description: 'Voz dulce y suave', provider: 'AI Cloud Gentle Female' },

  // Italiano
  { id: 'it-AI-Marco', name: 'Marco ♂ (Lettore Maschile Solenne)', lang: 'it', gender: 'male', description: 'Voce solenne e calda per la meditazione', provider: 'AI Cloud Male' },
  { id: 'it-AI-Giovanni', name: 'Giovanni ♂ (Lettore Maschile Profondo)', lang: 'it', gender: 'male', description: 'Voce profonda da cattedrale', provider: 'AI Cloud Deep Male' },
  { id: 'it-AI-Giulia', name: 'Giulia ♀ (Lettrice Femminile Chiara)', lang: 'it', gender: 'female', description: 'Voce serena e chiara per la preghiera', provider: 'AI Cloud Female' },
  { id: 'it-AI-Chiara', name: 'Chiara ♀ (Lettrice Femminile Dolce)', lang: 'it', gender: 'female', description: 'Voce dolce per le letture spirituali', provider: 'AI Cloud Gentle Female' },

  // Deutsch
  { id: 'de-AI-Hans', name: 'Hans ♂ (Sprecher Männlich Ruhig)', lang: 'de', gender: 'male', description: 'Ruhige, getragene Stimme für Betrachtungen', provider: 'AI Cloud Male' },
  { id: 'de-AI-Michael', name: 'Michael ♂ (Sprecher Männlich Tief)', lang: 'de', gender: 'male', description: 'Tiefe Besinnungsstimme', provider: 'AI Cloud Deep Male' },
  { id: 'de-AI-Greta', name: 'Greta ♀ (Sprecherin Weiblich Klar)', lang: 'de', gender: 'female', description: 'Klare, angenehme Vorlesestimme', provider: 'AI Cloud Female' },
  { id: 'de-AI-Hannah', name: 'Hannah ♀ (Sprecherin Weiblich Sanft)', lang: 'de', gender: 'female', description: 'Sanfte geistliche Stimme', provider: 'AI Cloud Gentle Female' },

  // Français
  { id: 'fr-AI-Louis', name: 'Louis ♂ (Lecteur Masculin Chaleureux)', lang: 'fr', gender: 'male', description: 'Voix chaleureuse et solennelle', provider: 'AI Cloud Male' },
  { id: 'fr-AI-Antoine', name: 'Antoine ♂ (Lecteur Masculin Méditatif)', lang: 'fr', gender: 'male', description: 'Voix grave et posée', provider: 'AI Cloud Deep Male' },
  { id: 'fr-AI-Claire', name: 'Claire ♀ (Lectrice Féminine Douce)', lang: 'fr', gender: 'female', description: 'Voix douce et claire pour les prières', provider: 'AI Cloud Female' },
  { id: 'fr-AI-Marie', name: 'Marie ♀ (Lectrice Féminine Sereine)', lang: 'fr', gender: 'female', description: 'Voix sereine et inspirante', provider: 'AI Cloud Gentle Female' },

  // Português
  { id: 'pt-AI-Joao', name: 'João ♂ (Lector Masculino Calmo)', lang: 'pt', gender: 'male', description: 'Voz calma e inspiradora para orações', provider: 'AI Cloud Male' },
  { id: 'pt-AI-Mariana', name: 'Mariana ♀ (Lectora Feminina Clara)', lang: 'pt', gender: 'female', description: 'Voz serena e clara para leitura', provider: 'AI Cloud Female' },

  // Українська
  { id: 'uk-AI-Oleksandr', name: 'Олександр ♂ (Декламатор Чоловічий Глибокий)', lang: 'uk', gender: 'male', description: 'Глибокий, спокійний голос для молитов', provider: 'AI Cloud Male' },
  { id: 'uk-AI-Olena', name: 'Олена ♀ (Декламатор Жіночий Ніжний)', lang: 'uk', gender: 'female', description: 'Ніжний виразний голос для читань', provider: 'AI Cloud Female' },

  // Lingua Latina
  { id: 'la-AI-Marcus', name: 'Marcus ♂ (Lector Ecclesiasticus Masculinus)', lang: 'la', gender: 'male', description: 'Vox eclesiastica solemnis pro orationibus', provider: 'AI Cloud Male' },
  { id: 'la-AI-Benedicta', name: 'Benedicta ♀ (Lectora Ecclesiastica Feminina)', lang: 'la', gender: 'female', description: 'Vox sancta et serena pro recitatione', provider: 'AI Cloud Female' },

  // Čeština
  { id: 'cs-AI-Jan', name: 'Jan ♂ (Český Hlas Mužský)', lang: 'cs', gender: 'male', description: 'Klidný a soustředěný hlas', provider: 'AI Cloud Male' },
  { id: 'cs-AI-Eliska', name: 'Eliška ♀ (Český Hlas Ženský)', lang: 'cs', gender: 'female', description: 'Jemný a jasný přednes', provider: 'AI Cloud Female' },

  // Slovenčina
  { id: 'sk-AI-Michal', name: 'Michal ♂ (Slovenský Hlas Mužský)', lang: 'sk', gender: 'male', description: 'Dôstojný a pokojný hlas', provider: 'AI Cloud Male' },
  { id: 'sk-AI-Zuzana', name: 'Zuzana ♀ (Slovenská Hlas Ženský)', lang: 'sk', gender: 'female', description: 'Jasný čitateľský hlas', provider: 'AI Cloud Female' },

  // Magyar
  { id: 'hu-AI-Bence', name: 'Bence ♂ (Magyar Férfi Hang)', lang: 'hu', gender: 'male', description: 'Meleg tónusú férfi felolvasóhang', provider: 'AI Cloud Male' },
  { id: 'hu-AI-Eszter', name: 'Eszter ♀ (Magyar Női Hang)', lang: 'hu', gender: 'female', description: 'Tiszta és dallamos női hang', provider: 'AI Cloud Female' },

  // Română
  { id: 'ro-AI-Andrei', name: 'Andrei ♂ (Voce Masculină Română)', lang: 'ro', gender: 'male', description: 'Voce caldă și meditativă', provider: 'AI Cloud Male' },
  { id: 'ro-AI-Elena', name: 'Elena ♀ (Voce Feminină Română)', lang: 'ro', gender: 'female', description: 'Voce senină pentru rugăciune', provider: 'AI Cloud Female' },

  // Lietuvių
  { id: 'lt-AI-Matas', name: 'Matas ♂ (Lietuviškas Vyriškas Balsas)', lang: 'lt', gender: 'male', description: 'Ramus ir gilus balsas', provider: 'AI Cloud Male' },
  { id: 'lt-AI-Ieva', name: 'Ieva ♀ (Lietuviškas Moteriškas Balsas)', lang: 'lt', gender: 'female', description: 'Švelnus ir skaidrus balsas', provider: 'AI Cloud Female' },

  // Ελληνικά
  { id: 'el-AI-Nikos', name: 'Nikos ♂ (Ελληνική Ανδρική Φωνή)', lang: 'el', gender: 'male', description: 'Σοβαρή και ήρεμη φωνή', provider: 'AI Cloud Male' },
  { id: 'el-AI-Sophia', name: 'Sophia ♀ (Ελληνική Γυναικεία Φωνή)', lang: 'el', gender: 'female', description: 'Καθαρή και γλυκιά φωνή', provider: 'AI Cloud Female' }
];

const STORAGE_KEY = 'drogowskazy_lector_config';

export const DEFAULT_LECTOR_CONFIG: LectorConfig = {
  mode: 'local',
  lang: 'pl',
  gender: 'male',
  localVoiceURI: '',
  onlineVoiceId: 'pl-AI-Jan',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0
};

export function getLectorConfig(): LectorConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_LECTOR_CONFIG, ...parsed };
    }
  } catch {}
  return DEFAULT_LECTOR_CONFIG;
}

export function saveLectorConfig(cfg: LectorConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    window.dispatchEvent(new CustomEvent('drogowskazy_lector_config_updated', { detail: cfg }));
  } catch {}
}

export function getLocalVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

export function getLocalVoicesForLang(langCode: string): SpeechSynthesisVoice[] {
  const voices = getLocalVoices();
  const lowerLang = (langCode || 'pl').toLowerCase();
  return voices.filter(v => {
    const vLang = v.lang.toLowerCase().replace('_', '-');
    return vLang.startsWith(lowerLang) || vLang.includes(lowerLang);
  });
}

// Regex patterns for local browser voice gender identification
const FEMALE_VOICE_PATTERN = /female|ewa|maria|paulina|zosia|ania|agata|zuzanna|monika|zora|zira|hazel|samantha|victoria|karen|catherine|helena|laura|monica|elsa|alice|lucia|hortense|julie|hedda|katja|marlene|vicki|olena|benedicta|soft|woman|girl|lady/i;
const MALE_VOICE_PATTERN = /male|jan|piotr|adam|krzysztof|marek|leszek|david|george|paul|stefan|pablo|raul|jorge|diego|cosimo|paolo|thomas|bernard|hans|michael|oleksandr|marcus|guy|boy|man|deep/i;

export function detectVoiceGender(voiceName: string): LectorGender {
  if (FEMALE_VOICE_PATTERN.test(voiceName) && !MALE_VOICE_PATTERN.test(voiceName)) {
    return 'female';
  }
  return 'male';
}

export function findBestLocalVoice(
  langCode: string,
  desiredGender: LectorGender,
  preferredURI?: string
): SpeechSynthesisVoice | undefined {
  const voices = getLocalVoices();
  if (voices.length === 0) return undefined;

  const targetLang = (langCode || 'pl').toLowerCase();

  // 1. If preferredURI is specified, return matching voice directly
  if (preferredURI) {
    const match = voices.find(v => v.voiceURI === preferredURI);
    if (match) {
      return match;
    }
  }

  // 2. Filter voices matching target language
  const langVoices = voices.filter(v => {
    const vLang = v.lang.toLowerCase().replace('_', '-');
    return vLang.startsWith(targetLang) || vLang.includes(targetLang);
  });

  if (langVoices.length === 0) {
    return voices.find(v => v.lang.toLowerCase().startsWith(targetLang)) || voices[0];
  }

  // 3. Match gender strictly
  if (desiredGender === 'female') {
    const femaleMatch = langVoices.find(v => FEMALE_VOICE_PATTERN.test(v.name) && !MALE_VOICE_PATTERN.test(v.name));
    if (femaleMatch) return femaleMatch;
  } else {
    const maleMatch = langVoices.find(v => MALE_VOICE_PATTERN.test(v.name) && !FEMALE_VOICE_PATTERN.test(v.name));
    if (maleMatch) return maleMatch;
  }

  return langVoices[0];
}

let currentAudioElement: HTMLAudioElement | null = null;
let currentAudioContext: AudioContext | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;
let sharedAudioCtx: AudioContext | null = null;

export function unlockMobileAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
    }

    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }

    // Play a 1-sample silent buffer to unlock iOS Safari / Android Chrome autoplay restrictions
    const buffer = sharedAudioCtx.createBuffer(1, 1, 22050);
    const source = sharedAudioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(sharedAudioCtx.destination);
    source.start(0);

    return sharedAudioCtx;
  } catch (e) {
    console.warn('Mobile audio unlock warning:', e);
    return null;
  }
}

export interface SerialLectorState {
  isActive: boolean;
  autoNext: boolean;
  currentSectionId: string;
  currentDayNumber: number;
  currentYear?: number;
  lastTitle?: string;
  lastUpdated?: string;
}

const SERIAL_STORAGE_KEY = 'drogowskazy_serial_lector_state';

export const DEFAULT_SERIAL_STATE: SerialLectorState = {
  isActive: false,
  autoNext: true,
  currentSectionId: 'wnr365',
  currentDayNumber: 1,
  currentYear: 1,
  lastTitle: '',
  lastUpdated: ''
};

export function getSerialLectorState(): SerialLectorState {
  try {
    const saved = localStorage.getItem(SERIAL_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_SERIAL_STATE, ...JSON.parse(saved) };
    }
  } catch {}
  return DEFAULT_SERIAL_STATE;
}

export function saveSerialLectorState(state: Partial<SerialLectorState>): SerialLectorState {
  try {
    const current = getSerialLectorState();
    const updated = { ...current, ...state, lastUpdated: new Date().toISOString() };
    localStorage.setItem(SERIAL_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('drogowskazy_serial_lector_updated', { detail: updated }));
    return updated;
  } catch {}
  return DEFAULT_SERIAL_STATE;
}

let keepAliveAudio: HTMLAudioElement | null = null;

export function startBackgroundAudioKeepAlive(): void {
  if (typeof window === 'undefined') return;
  try {
    if (!keepAliveAudio) {
      const silentWavBase64 = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      keepAliveAudio = new Audio(silentWavBase64);
      keepAliveAudio.loop = true;
      keepAliveAudio.volume = 0.01;
    }
    keepAliveAudio.play().catch(() => {});
  } catch (e) {
    console.warn('Keep-alive audio error:', e);
  }
}

export function stopBackgroundAudioKeepAlive(): void {
  if (keepAliveAudio) {
    try {
      keepAliveAudio.pause();
    } catch {}
  }
}

export interface MediaSessionHandlers {
  onPlay?: () => void;
  onPause?: () => void;
  onPreviousTrack?: () => void;
  onNextTrack?: () => void;
  onStop?: () => void;
}

export function setupMediaSession(
  title: string,
  sectionName: string,
  artworkUrl?: string,
  handlers?: MediaSessionHandlers
): void {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || 'Lektor Droga365',
      artist: 'Droga365',
      album: sectionName || 'Czytania Codzienne',
      artwork: artworkUrl ? [
        { src: artworkUrl, sizes: '512x512', type: 'image/jpeg' }
      ] : []
    });

    if (handlers?.onPlay) navigator.mediaSession.setActionHandler('play', handlers.onPlay);
    if (handlers?.onPause) navigator.mediaSession.setActionHandler('pause', handlers.onPause);
    if (handlers?.onPreviousTrack) navigator.mediaSession.setActionHandler('previoustrack', handlers.onPreviousTrack);
    if (handlers?.onNextTrack) navigator.mediaSession.setActionHandler('nexttrack', handlers.onNextTrack);
    if (handlers?.onStop) navigator.mediaSession.setActionHandler('stop', handlers.onStop);
  } catch (e) {
    console.warn('MediaSession API setup error:', e);
  }
}

export function stopLectorSpeech(): void {
  stopBackgroundAudioKeepAlive();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement = null;
  }
  if (currentSourceNode) {
    try { currentSourceNode.stop(); } catch {}
    currentSourceNode = null;
  }
  if (currentAudioContext) {
    try { currentAudioContext.close(); } catch {}
    currentAudioContext = null;
  }
}

export interface PlayLectorOptions {
  text: string;
  config: LectorConfig;
  overrideLang?: string;
  title?: string;
  sectionName?: string;
  artworkUrl?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export async function playLectorSpeech(options: PlayLectorOptions): Promise<void> {
  const { text, config, overrideLang, title, sectionName, artworkUrl, onStart, onEnd, onError, onNext, onPrev } = options;

  // 0. Synchronously unlock AudioContext inside mobile user touch gesture
  unlockMobileAudio();
  stopLectorSpeech();
  startBackgroundAudioKeepAlive();

  if (title || sectionName) {
    setupMediaSession(title || 'Droga365', sectionName || 'Lektor', artworkUrl, {
      onPlay: () => {},
      onPause: () => stopLectorSpeech(),
      onNextTrack: onNext,
      onPreviousTrack: onPrev,
      onStop: () => stopLectorSpeech()
    });
  }

  if (!text || !text.trim()) {
    if (onError) onError('Brak tekstu');
    return;
  }

  // 1. Look up online profile by selected onlineVoiceId first
  let onlineProfile = ONLINE_VOICES.find(v => v.id === config.onlineVoiceId);
  const targetLang = (overrideLang || onlineProfile?.lang || config.lang || 'pl').toLowerCase();
  const targetGender: LectorGender = onlineProfile?.gender || config.gender || 'male';

  if (!onlineProfile || (overrideLang && onlineProfile.lang !== overrideLang.toLowerCase())) {
    onlineProfile = ONLINE_VOICES.find(v => v.lang === targetLang && v.gender === targetGender)
      || ONLINE_VOICES.find(v => v.lang === targetLang)
      || ONLINE_VOICES[0];
  }

  if (config.mode === 'online') {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: onlineProfile.id,
          lang: targetLang,
          gender: targetGender,
          rate: config.rate,
          pitch: config.pitch
        })
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        await playAudioBufferWithVoiceEffects(arrayBuffer, onlineProfile, config, onStart, onEnd, onError);
      } else {
        playLocalSpeechFallback({ ...options, overrideLang: targetLang });
      }
    } catch (err) {
      console.warn('Online TTS error, falling back to local speech:', err);
      playLocalSpeechFallback({ ...options, overrideLang: targetLang });
    }
  } else {
    playLocalSpeechFallback({ ...options, overrideLang: targetLang });
  }
}

export function splitTextForTts(text: string, maxLen: number = 180): string[] {
  if (!text) return [];
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return [clean];

  const sentences = clean.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const s of sentences) {
    if (!current) {
      current = s;
    } else if ((current + ' ' + s).length <= maxLen) {
      current += ' ' + s;
    } else {
      chunks.push(current);
      current = s;
    }
  }

  if (current) {
    if (current.length > maxLen) {
      for (let i = 0; i < current.length; i += maxLen) {
        chunks.push(current.substring(i, i + maxLen));
      }
    } else {
      chunks.push(current);
    }
  }

  return chunks.filter(c => c.trim().length > 0);
}

async function playAudioBufferWithVoiceEffects(
  arrayBuffer: ArrayBuffer,
  voiceProfile: OnlineVoiceOption,
  config: LectorConfig,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): Promise<void> {
  try {
    let audioCtx = sharedAudioCtx;
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = unlockMobileAudio();
    }

    if (audioCtx) {
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const decodedData = await audioCtx.decodeAudioData(arrayBuffer);
      const source = audioCtx.createBufferSource();
      source.buffer = decodedData;

      // Pitch factor according to voice character
      let pitchFactor = 1.0;
      if (voiceProfile.id.includes('Deep') || voiceProfile.provider.includes('Deep Male')) {
        pitchFactor = 0.84;
      } else if (voiceProfile.gender === 'male') {
        pitchFactor = 0.92;
      } else if (voiceProfile.provider.includes('Gentle Female')) {
        pitchFactor = 1.15;
      } else if (voiceProfile.gender === 'female') {
        pitchFactor = 1.08;
      }

      const finalRate = Math.max(0.5, Math.min(2.0, config.rate * pitchFactor));
      source.playbackRate.value = finalRate;

      const gainNode = audioCtx.createGain();
      gainNode.gain.value = Math.max(0, Math.min(1, config.volume));

      source.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (onStart) onStart();

      source.onended = () => {
        if (onEnd) onEnd();
        currentSourceNode = null;
      };

      currentAudioContext = audioCtx;
      currentSourceNode = source;
      source.start(0);
      return;
    }
  } catch (err) {
    console.warn('AudioContext playback error, using HTML Audio fallback:', err);
    try {
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.volume = config.volume;
      audio.playbackRate = config.rate;
      audio.onended = () => { if (onEnd) onEnd(); currentAudioElement = null; };
      audio.onerror = (e) => { if (onError) onError(e); currentAudioElement = null; };
      currentAudioElement = audio;
      if (onStart) onStart();
      await audio.play();
    } catch (e2) {
      if (onError) onError(e2);
    }
  }
}

function playLocalSpeechFallback(options: PlayLectorOptions): void {
  const { text, config, overrideLang, onStart, onEnd, onError } = options;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onError) onError('Speech Synthesis API unsupported in this browser.');
    return;
  }

  const targetLang = (overrideLang || config.lang || 'pl').toLowerCase();
  const targetGender: LectorGender = config.gender || 'male';

  const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleanText) {
    if (onError) onError('Brak tekstu do przeczytania');
    return;
  }

  const textChunks = splitTextForTts(cleanText, 180);
  if (textChunks.length === 0) {
    if (onError) onError('Brak tekstu');
    return;
  }

  let chunkIndex = 0;

  const speakNextChunk = () => {
    if (chunkIndex >= textChunks.length) {
      if (onEnd) onEnd();
      return;
    }

    const currentChunkText = textChunks[chunkIndex];
    chunkIndex++;

    const utterance = new SpeechSynthesisUtterance(currentChunkText);
    utterance.rate = config.rate;
    utterance.pitch = config.pitch * (targetGender === 'female' ? 1.15 : targetGender === 'male' ? 0.88 : 1.0);
    utterance.volume = config.volume;

    const chosenVoice = findBestLocalVoice(targetLang, targetGender, config.localVoiceURI);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang;
    } else {
      utterance.lang = `${targetLang}-${targetLang.toUpperCase()}`;
    }

    if (chunkIndex === 1 && onStart) {
      onStart();
    }

    utterance.onend = () => {
      speakNextChunk();
    };

    utterance.onerror = (err) => {
      console.warn('Local speech chunk error:', err);
      speakNextChunk();
    };

    window.speechSynthesis.speak(utterance);
  };

  speakNextChunk();
}

