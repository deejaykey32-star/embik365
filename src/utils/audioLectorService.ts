import { SUPPORTED_LANGUAGES } from '../types';
import { normalizePolishTextForSpeech } from './polishSpeechNormalizer';

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
const MIGRATION_KEY = 'drogowskazy_lector_online_default_v3';

export const DEFAULT_LECTOR_CONFIG: LectorConfig = {
  mode: 'online',
  lang: 'pl',
  gender: 'male',
  localVoiceURI: '',
  onlineVoiceId: 'pl-AI-Jan',
  rate: 1.1,
  pitch: 1.0,
  volume: 1.0
};

export function getLectorConfig(): LectorConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const migrationDone = localStorage.getItem(MIGRATION_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);
      // Użytkownik ma zawsze tryb 'online' (płynny lektor AI w chmurze bez zacinania):
      parsed.mode = 'online';
      // Domyślna szybkość lektora online 1.1:
      if (!migrationDone || parsed.rate === 1.0 || typeof parsed.rate !== 'number') {
        parsed.rate = 1.1;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_LECTOR_CONFIG, ...parsed, mode: 'online' }));
      localStorage.setItem(MIGRATION_KEY, 'true');
      return { ...DEFAULT_LECTOR_CONFIG, ...parsed, mode: 'online' };
    } else {
      localStorage.setItem(MIGRATION_KEY, 'true');
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
  desiredGender?: LectorGender,
  preferredURI?: string
): SpeechSynthesisVoice | undefined {
  const voices = getLocalVoices();
  if (voices.length === 0) return undefined;

  const targetLang = (langCode || 'pl').toLowerCase();

  // 1. Głosy pasujące ściśle do wybranego języka
  const langVoices = voices.filter(v => {
    const vLang = v.lang.toLowerCase().replace('_', '-');
    return vLang.startsWith(targetLang) || vLang.includes(targetLang);
  });

  // 2. Jeśli użytkownik wskazał konkretny głos w ustawieniach (preferredURI)
  if (preferredURI && langVoices.length > 0) {
    const match = langVoices.find(v => v.voiceURI === preferredURI);
    if (match) {
      if (!desiredGender || detectVoiceGender(match.name) === desiredGender) {
        return match;
      }
    }
  }

  const pool = langVoices.length > 0 ? langVoices : voices;

  // 3. Priorytet dla naturalnych głosów HD (np. Microsoft Online Natural: Marek, Zofia w Edge/Windows)
  if (desiredGender === 'female') {
    const naturalFemale = pool.find(v => /natural|online/i.test(v.name) && FEMALE_VOICE_PATTERN.test(v.name));
    if (naturalFemale) return naturalFemale;
    const femaleMatch = pool.find(v => FEMALE_VOICE_PATTERN.test(v.name) && !MALE_VOICE_PATTERN.test(v.name));
    if (femaleMatch) return femaleMatch;
  } else if (desiredGender === 'male') {
    const naturalMale = pool.find(v => /natural|online/i.test(v.name) && (MALE_VOICE_PATTERN.test(v.name) || !FEMALE_VOICE_PATTERN.test(v.name)));
    if (naturalMale) return naturalMale;
    const maleMatch = pool.find(v => MALE_VOICE_PATTERN.test(v.name) && !FEMALE_VOICE_PATTERN.test(v.name));
    if (maleMatch) return maleMatch;
  }

  // 4. Fallback: jakikolwiek naturalny głos danego języka lub pierwszy dostępny
  const naturalAny = langVoices.find(v => /natural|online/i.test(v.name));
  if (naturalAny) return naturalAny;

  return langVoices[0] || voices[0];
}

// Global set to retain active SpeechSynthesisUtterances and prevent Chromium V8 garbage collection mid-speech
const activeUtterances = new Set<SpeechSynthesisUtterance>();

let currentAudioElement: HTMLAudioElement | null = null;
let currentAudioContext: AudioContext | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;
let sharedAudioCtx: AudioContext | null = null;

export interface AudioPlaybackProgress {
  currentTime: number;
  duration: number;
  progressPercent: number;
  sessionId: number;
}

let activeProgressTimer: any = null;
let currentAudioProgressData: AudioPlaybackProgress = { currentTime: 0, duration: 0, progressPercent: 0, sessionId: 0 };

export function getCurrentAudioProgress(): AudioPlaybackProgress {
  return currentAudioProgressData;
}

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
export type LectorPlaybackState = 'idle' | 'playing' | 'paused';
let lectorPlaybackState: LectorPlaybackState = 'idle';

export function getLectorPlaybackState(): LectorPlaybackState {
  return lectorPlaybackState;
}

export function notifyLectorStateChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('drogowskazy_lector_state_changed', {
      detail: { state: lectorPlaybackState }
    }));
  }
}

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

export function pauseLectorSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
    try { window.speechSynthesis.pause(); } catch {}
  }
  if (currentAudioElement) {
    try { currentAudioElement.pause(); } catch {}
  }
  if (currentAudioContext && currentAudioContext.state === 'running') {
    try { currentAudioContext.suspend(); } catch {}
  }
  lectorPlaybackState = 'paused';
  if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
    try { navigator.mediaSession.playbackState = 'paused'; } catch {}
  }
  notifyLectorStateChange();
}

export function resumeLectorSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
    try { window.speechSynthesis.resume(); } catch {}
  }
  if (currentAudioElement && currentAudioElement.paused) {
    try { currentAudioElement.play().catch(() => {}); } catch {}
  }
  if (currentAudioContext && currentAudioContext.state === 'suspended') {
    try { currentAudioContext.resume(); } catch {}
  }
  startBackgroundAudioKeepAlive();
  lectorPlaybackState = 'playing';
  if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
    try { navigator.mediaSession.playbackState = 'playing'; } catch {}
  }
  notifyLectorStateChange();
}

let activePlaybackSessionId = 0;
let chromeKeepAliveInterval: any = null;

export function stopLectorSpeech(): void {
  // Invalidate any active playback session immediately
  activePlaybackSessionId++;

  if (chromeKeepAliveInterval) {
    clearInterval(chromeKeepAliveInterval);
    chromeKeepAliveInterval = null;
  }

  stopBackgroundAudioKeepAlive();

  activeUtterances.clear();

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }

  // Clear AudioBufferSourceNode and detach onended handler first so it doesn't trigger onEnd
  if (currentSourceNode) {
    try {
      currentSourceNode.onended = null;
      currentSourceNode.stop();
    } catch {}
    currentSourceNode = null;
  }

  if (activeProgressTimer) {
    clearInterval(activeProgressTimer);
    activeProgressTimer = null;
  }
  currentAudioProgressData = { currentTime: 0, duration: 0, progressPercent: 0, sessionId: 0 };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('drogowskazy_audio_playback_progress', {
      detail: currentAudioProgressData
    }));
  }

  // Clear HTMLAudioElement and detach handlers first
  if (currentAudioElement) {
    try {
      currentAudioElement.onended = null;
      currentAudioElement.onerror = null;
      currentAudioElement.pause();
      currentAudioElement.src = '';
    } catch {}
    currentAudioElement = null;
  }

  if (currentAudioContext) {
    try {
      currentAudioContext.close();
    } catch {}
    currentAudioContext = null;
  }

  // Mark serial lector inactive so it won't auto-advance or restart
  saveSerialLectorState({ isActive: false });

  lectorPlaybackState = 'idle';
  if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
    try {
      navigator.mediaSession.playbackState = 'none';
    } catch {}
  }
  notifyLectorStateChange();
}

/**
 * Czyści tekst dla lektora audio:
 * - Usuwa znaczniki markdown (* gwiazdka, # kratka)
 * - Usuwa sigla biblijne i numery wersetów (np. (Mt 10,8), [1], 1 Na początku...)
 * - Rozwija skróty polskie (np. -> na przykład, św. -> świętego, itd. -> i tak dalej)
 * - Usuwa cudzysłowy (aby syntezator mowy nie wymawiał słowa "cudzysłów")
 * - Usuwa linki, adresy URL i znaki śmieci
 */
export function cleanTextForSpeech(rawText: string, lang: string = 'pl'): string {
  if (!rawText) return '';
  let text = rawText;

  // 1. Usunięcie tagów HTML, kontenerów QR, skryptów, styli
  text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  text = text.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  text = text.replace(/<div[^>]*class=['"][^'"]*wnr-qr-container[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, ' ');
  text = text.replace(/<div[^>]*class=['"][^'"]*qr-code-embed-card[\s\S]*?<\/div>\s*<\/div>/gi, ' ');
  text = text.replace(/<[^>]+>/g, ' ');

  // 2. Dekodowanie encji HTML
  text = text.replace(/&nbsp;/gi, ' ')
             .replace(/&amp;/gi, ' i ')
             .replace(/&quot;|&apos;|&#39;|&ldquo;|&rdquo;|&laquo;|&raquo;/gi, ' ')
             .replace(/&hellip;/gi, '. ')
             .replace(/&ndash;|&mdash;/gi, ', ')
             .replace(/&[a-zA-Z0-9#]+;/g, ' ');

  // 3. Usunięcie napisów z kart QR i przycisków akcji
  text = text.replace(/Materiał dodatkowy \d+:[^.]*?(?:Kod QR)?/gi, ' ');
  text = text.replace(/Pobierz PNG|Otwórz\s*→?/gi, ' ');

  // 4. Usunięcie linków internetowych i URL
  text = text.replace(/https?:\/\/\S+/gi, ' ');
  text = text.replace(/www\.\S+/gi, ' ');
  text = text.replace(/(?<!\p{L})(?:więcej(?:\s+na)?|zob\.|link)\s*:?\s*(?=[.!?]|$)/gui, ' ');

  // 5. Zamiana nagłówków Markdown (#, ##, ###) na zdania z kropką i usunięcie kratek
  text = text.replace(/(^|\n)\s*#{1,6}\s*([^\n]+)/g, '$1 $2. ');
  text = text.replace(/#/g, ' ');

  // 6. Usunięcie gwiazdek (*, **, ***) - aby lektor nigdy nie czytał "gwiazdka"
  text = text.replace(/\*+/g, ' ');

  // Normalizacja wielokropków przed dopasowaniem wersetów
  text = text.replace(/\.{2,}/g, '. ');

  // 7. Usunięcie sigli i odnośników biblijnych w nawiasach np. (Mt 10,8), (J 10,34), (por. Łk 1, 26)
  const biblicalBooks = 'Mt|Mk|Łk|Lk|J|Jn|Dz|Rz|Rom|Kor|Ga|Gal|Ef|Eph|Flp|Phil|Kol|Col|Tes|Thess|Tm|Tim|Tt|Tit|Flm|Phlm|Hbr|Heb|Jk|Jas|P|Pet|Jud|Jude|Ap|Rev|Rdz|Gen|Wj|Ex|Kpł|Lev|Lb|Num|Pwt|Deut|Joz|Josh|Sdz|Judg|Rt|Ruth|Sm|Sam|Krl|Kgs|Krn|Chron|Ezd|Ezra|Ne|Neh|Tb|Tob|Jdt|Est|Esth|Mch|Macc|Hi|Job|Ps|Prz|Prov|Koh|Eccl|Pnp|Song|Mdr|Wis|Syr|Sir|Iz|Isa|Jr|Jer|Lm|Lam|Bar|Ez|Ezek|Dn|Dan|Oz|Hos|Jl|Joel|Am|Amos|Ab|Obad|Jon|Jonah|Mi|Mic|Na|Nah|Ha|Hab|Sof|Zeph|Ag|Hag|Za|Zech|Mal';
  
  const bibRefRegex = new RegExp(`\\([\\s]*(?:por\\.?|zob\\.?|cf\\.?)?\\s*(?:[1-3]\\s*)?(?:${biblicalBooks})\\s*\\d+[^)]*\\)`, 'gi');
  text = text.replace(bibRefRegex, ' ');
  const bibRefBracketRegex = new RegExp(`\\[[\\s]*(?:por\\.?|zob\\.?|cf\\.?)?\\s*(?:[1-3]\\s*)?(?:${biblicalBooks})\\s*\\d+[^\\]]*\\]`, 'gi');
  text = text.replace(bibRefBracketRegex, ' ');
  
  // Samodzielne sigla biblijne np. 'Mt 10, 8-12', 'Łk 1, 26-38:' lub 'J 10, 34'
  const bibStandaloneRegex = new RegExp(`(?<!\\p{L})(?:[1-3]\\s*)?(?:${biblicalBooks})\\s*\\d+\\s*[,:]\\s*\\d+(?:\\s*[-–.]\\s*\\d+)*(?:[a-z])?:?`, 'gui');
  text = text.replace(bibStandaloneRegex, ' ');

  // Ogólne odsyłacze w nawiasach (por. ...) lub (zob. ...)
  text = text.replace(/\(\s*(?:por\.|zob\.|cf\.)\s*[^)]+\)/gi, ' ');

  // 8. Usunięcie przypisów w nawiasach kwadratowych [1], (1), [a]
  text = text.replace(/\[\s*\d+\s*\]/g, ' ');
  text = text.replace(/\(\s*\d+\s*\)/g, ' ');
  text = text.replace(/\[\s*[a-zA-Z]\s*\]/g, ' ');

  // 9. Usunięcie cyfr w indeksie górnym (wersetów biblijnych)
  text = text.replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]+/g, ' ');

  // 10. Usunięcie numerów wersetów na początku linii lub po znakach końca zdania (np. '1 Na początku', '. 2 Wtedy')
  text = text.replace(/(?:^|\n|(?<=[.!?„"”«»;\n]))\s*\d{1,3}[\.\s]+(?=[A-ZĄĆĘŁŃÓŚŹŻ])/gu, ' ');

  // 11. Rozwinięcie skrótów na pełne słowa dla naturalnego brzmienia
  const isPl = !lang || lang.toLowerCase().startsWith('pl');
  if (isPl) {
    text = normalizePolishTextForSpeech(text);
  } else {
    text = text.replace(/(?<!\p{L})e\.g\.\s*/gui, 'for example ');
    text = text.replace(/(?<!\p{L})i\.e\.\s*/gui, 'that is ');
    text = text.replace(/(?<!\p{L})etc\.\s*/gui, 'etcetera. ');
    text = text.replace(/(?<!\p{L})St\.\s*/gui, 'Saint ');
  }

  // 12. Usunięcie emoji i symboli obrazkowych
  text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ' ');

  // 13. Usunięcie znaków cudzysłowu (by lektor nie czytał "cudzysłów")
  text = text.replace(/[„”«»\"“’'‘`´]/g, ' ');

  // 14. Usunięcie znaków śmieci (zachowując standardową interpunkcję . , ; : ? ! -)
  text = text.replace(/[_~^|\\/{}\[\]<>§©®™°+=•●○■◆▪▫]/g, ' ');
  text = text.replace(/[–—]/g, ', ');
  text = text.replace(/[-]{2,}/g, ' ');

  // 15. Normalizacja spacji i interpunkcji
  text = text.replace(/\s*([,.;?!])\s*/g, '$1 ');
  text = text.replace(/([.?!])\s*[.?!]+/g, '$1 ');
  text = text.replace(/\s+,/g, ',');
  text = text.replace(/,\s*\./g, '.');
  text = text.replace(/,\s*,+/g, ',');
  text = text.replace(/\s+/g, ' ').trim();

  return text;
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

  // 0. Synchronously unlock AudioContext inside mobile user touch gesture & stop previous speech
  unlockMobileAudio();
  stopLectorSpeech();
  startBackgroundAudioKeepAlive();

  const currentSession = activePlaybackSessionId;
  const isCurrentSession = () => currentSession === activePlaybackSessionId;

  const wrappedOnStart = () => {
    if (!isCurrentSession()) return;
    lectorPlaybackState = 'playing';
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try { navigator.mediaSession.playbackState = 'playing'; } catch {}
    }
    notifyLectorStateChange();
    if (onStart) onStart();
  };

  const wrappedOnEnd = () => {
    if (!isCurrentSession()) return;
    lectorPlaybackState = 'idle';
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try { navigator.mediaSession.playbackState = 'none'; } catch {}
    }
    notifyLectorStateChange();
    if (onEnd) onEnd();
  };

  const wrappedOnError = (err: any) => {
    if (!isCurrentSession()) return;
    lectorPlaybackState = 'idle';
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try { navigator.mediaSession.playbackState = 'none'; } catch {}
    }
    notifyLectorStateChange();
    if (onError) onError(err);
  };

  if (title || sectionName) {
    setupMediaSession(title || 'Droga365', sectionName || 'Lektor', artworkUrl, {
      onPlay: () => resumeLectorSpeech(),
      onPause: () => pauseLectorSpeech(),
      onNextTrack: onNext,
      onPreviousTrack: onPrev,
      onStop: () => stopLectorSpeech()
    });
  }

  // 1. Look up online profile by selected onlineVoiceId first
  let onlineProfile = ONLINE_VOICES.find(v => v.id === config.onlineVoiceId);
  const targetLang = (overrideLang || (config.mode === 'online' ? onlineProfile?.lang : config.lang) || 'pl').toLowerCase();
  const targetGender: LectorGender = (config.mode === 'online' ? onlineProfile?.gender : config.gender) || 'male';

  if (!onlineProfile || (overrideLang && onlineProfile.lang !== overrideLang.toLowerCase())) {
    onlineProfile = ONLINE_VOICES.find(v => v.lang === targetLang && v.gender === targetGender)
      || ONLINE_VOICES.find(v => v.lang === targetLang)
      || ONLINE_VOICES[0];
  }

  // 2. Wyczyść tekst ze znaczników markdown (*, #), sigli, numerów wersetów i śmieci
  const cleanedSpeechText = cleanTextForSpeech(text, targetLang);
  if (!cleanedSpeechText) {
    if (onError) onError('Brak tekstu do przeczytania');
    return;
  }

  // Helper do pobierania segmentów audio z /api/tts z podwójnym adresem i bezpośrednim fallbackiem
  async function fetchOnlineTtsBuffers(segmentText: string): Promise<AudioBuffer[]> {
    if (!segmentText.trim()) return [];
    const endpoints = ['/api/tts', 'https://widokinaraj.pl/api/tts'];
    
    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          signal: controller.signal,
          body: JSON.stringify({
            text: segmentText,
            voiceId: onlineProfile.id,
            lang: targetLang,
            gender: targetGender,
            rate: config.rate,
            pitch: config.pitch,
            format: 'json'
          })
        });
        clearTimeout(timeoutId);

        if (!response.ok) continue;

        let audioCtx = sharedAudioCtx;
        if (!audioCtx || audioCtx.state === 'closed') {
          audioCtx = unlockMobileAudio();
        }
        if (!audioCtx) continue;

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
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
                console.warn('Online TTS chunk decode warning:', e);
              }
            }
            if (decodedChunks.length > 0) {
              return decodedChunks;
            }
          }
        } else {
          const arrayBuffer = await response.arrayBuffer();
          if (arrayBuffer.byteLength > 64) {
            const decoded = await audioCtx.decodeAudioData(arrayBuffer);
            return [decoded];
          }
        }
      } catch (err) {
        console.warn(`Online TTS fetch error on ${endpoint}:`, err);
      }
    }

    // Bezpośredni fallback Google Translate TTS (gdyby endpointy API były chwilowo niedostępne)
    try {
      let audioCtx = sharedAudioCtx;
      if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = unlockMobileAudio();
      }
      if (audioCtx) {
        const subFragments = splitTextForTts(segmentText, 140);
        const directBuffers: AudioBuffer[] = [];
        for (const sub of subFragments) {
          try {
            const directUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(sub)}&tl=${targetLang}&client=tw-ob`;
            const dRes = await fetch(directUrl);
            if (dRes.ok) {
              const ab = await dRes.arrayBuffer();
              if (ab.byteLength > 64) {
                const decoded = await audioCtx.decodeAudioData(ab);
                directBuffers.push(decoded);
              }
            }
          } catch {}
        }
        if (directBuffers.length > 0) {
          return directBuffers;
        }
      }
    } catch {}

    return [];
  }

  try {
    // Podział na naturalne segmenty po maks 900 znaków (na granicach zdań i interpunkcji)
    const segments = splitTextForTts(cleanedSpeechText, 900);
    const allDecodedBuffers: AudioBuffer[] = [];

    for (let i = 0; i < segments.length; i += 2) {
      if (!isCurrentSession()) return;
      const batch = segments.slice(i, i + 2);
      const batchResults = await Promise.all(batch.map(seg => fetchOnlineTtsBuffers(seg)));
      for (const res of batchResults) {
        allDecodedBuffers.push(...res);
      }
    }

    if (!isCurrentSession()) return;

    if (allDecodedBuffers.length > 0) {
      let audioCtx = sharedAudioCtx;
      if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = unlockMobileAudio();
      }
      if (audioCtx) {
        const fullAudioBuffer = concatenateAudioBuffers(audioCtx, allDecodedBuffers);
        if (fullAudioBuffer && isCurrentSession()) {
          await playDecodedAudioBuffer(fullAudioBuffer, onlineProfile, config, currentSession, wrappedOnStart, wrappedOnEnd, wrappedOnError);
          return;
        }
      }
    }
  } catch (err) {
    console.warn('Online TTS pipeline error:', err);
  }

  if (!isCurrentSession()) return;

  // Awaryjny fallback do syntezy lokalnej wyłącznie w przypadku całkowitego braku połączenia internetowego
  playLocalSpeechFallback({
    ...options,
    text: cleanedSpeechText,
    sessionId: currentSession,
    overrideLang: targetLang,
    desiredGender: targetGender,
    voiceProfile: onlineProfile,
    onStart: wrappedOnStart,
    onEnd: wrappedOnEnd,
    onError: wrappedOnError
  });
}

export function splitTextForTts(text: string, maxLen: number = 320): string[] {
  if (!text) return [];
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return [clean];

  // 1. Podział na zdania według kropek, wykrzykników i znaków zapytania
  const rawSentences = clean.split(/(?<=[.!?])\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ0-9„"«])/u);
  const sentences = (rawSentences.length > 1) ? rawSentences : clean.split(/(?<=[.!?])\s+/);

  const chunks: string[] = [];

  for (const sentence of sentences) {
    const s = sentence.trim();
    if (!s) continue;

    if (s.length <= maxLen) {
      // Łączymy ze sobą krótkie zdania aż do limitu maxLen, aby lektor czytał płynnie bez zacięć
      if (chunks.length > 0 && (chunks[chunks.length - 1].length + 1 + s.length) <= maxLen) {
        chunks[chunks.length - 1] += ' ' + s;
      } else {
        chunks.push(s);
      }
    } else {
      // Zdanie przekracza maxLen - dzielimy według naturalnych pauz (średniki, myślniki, przecinki)
      const clauses = s.split(/(?<=[,;:\-–—])\s+/);
      let currentClauseChunk = '';

      for (const clause of clauses) {
        const c = clause.trim();
        if (!c) continue;

        if (c.length <= maxLen) {
          if (!currentClauseChunk) {
            currentClauseChunk = c;
          } else if ((currentClauseChunk + ' ' + c).length <= maxLen) {
            currentClauseChunk += ' ' + c;
          } else {
            chunks.push(currentClauseChunk);
            currentClauseChunk = c;
          }
        } else {
          // Jeśli nawet pojedyncza fraza jest długa, dzielimy wyłącznie po granicach słów (spacjach) - NIGDY nie tnąc słowa w połowie!
          if (currentClauseChunk) {
            chunks.push(currentClauseChunk);
            currentClauseChunk = '';
          }
          const words = c.split(/\s+/);
          let wordChunk = '';
          for (const w of words) {
            if (!wordChunk) {
              wordChunk = w;
            } else if ((wordChunk + ' ' + w).length <= maxLen) {
              wordChunk += ' ' + w;
            } else {
              chunks.push(wordChunk);
              wordChunk = w;
            }
          }
          if (wordChunk) {
            currentClauseChunk = wordChunk;
          }
        }
      }

      if (currentClauseChunk) {
        chunks.push(currentClauseChunk);
      }
    }
  }

  return chunks.filter(c => c.trim().length > 0);
}

export function concatenateAudioBuffers(audioCtx: AudioContext, buffers: AudioBuffer[]): AudioBuffer {
  if (buffers.length === 0) return audioCtx.createBuffer(1, 1, 22050);
  if (buffers.length === 1) return buffers[0];

  const numChannels = buffers[0].numberOfChannels;
  const sampleRate = buffers[0].sampleRate;
  const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);

  const result = audioCtx.createBuffer(numChannels, totalLength, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = result.getChannelData(channel);
    let offset = 0;
    for (const b of buffers) {
      const srcChannel = Math.min(channel, b.numberOfChannels - 1);
      channelData.set(b.getChannelData(srcChannel), offset);
      offset += b.length;
    }
  }

  return result;
}

export async function playDecodedAudioBuffer(
  decodedData: AudioBuffer,
  voiceProfile: OnlineVoiceOption,
  config: LectorConfig,
  sessionId: number,
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

      if (sessionId !== activePlaybackSessionId) return;

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

      const startTime = audioCtx.currentTime;
      const totalAudioDuration = decodedData.duration / finalRate;

      if (activeProgressTimer) {
        clearInterval(activeProgressTimer);
        activeProgressTimer = null;
      }

      const reportProgress = () => {
        if (sessionId !== activePlaybackSessionId || !currentSourceNode) {
          if (activeProgressTimer) {
            clearInterval(activeProgressTimer);
            activeProgressTimer = null;
          }
          return;
        }
        const elapsed = Math.max(0, Math.min(totalAudioDuration, (audioCtx.currentTime - startTime)));
        const progressPercent = Math.min(100, Math.round((elapsed / totalAudioDuration) * 100));
        currentAudioProgressData = {
          currentTime: elapsed,
          duration: totalAudioDuration,
          progressPercent,
          sessionId
        };
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('drogowskazy_audio_playback_progress', {
            detail: currentAudioProgressData
          }));
        }
      };

      activeProgressTimer = setInterval(reportProgress, 250);
      reportProgress();

      if (onStart && sessionId === activePlaybackSessionId) onStart();

      source.onended = () => {
        if (activeProgressTimer) {
          clearInterval(activeProgressTimer);
          activeProgressTimer = null;
        }
        if (sessionId !== activePlaybackSessionId) return;
        currentAudioProgressData = {
          currentTime: totalAudioDuration,
          duration: totalAudioDuration,
          progressPercent: 100,
          sessionId
        };
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('drogowskazy_audio_playback_progress', {
            detail: currentAudioProgressData
          }));
        }
        if (onEnd) onEnd();
        currentSourceNode = null;
      };

      currentAudioContext = audioCtx;
      currentSourceNode = source;
      source.start(0);
      return;
    }
  } catch (err) {
    console.warn('AudioBuffer playback error:', err);
    if (onError && sessionId === activePlaybackSessionId) onError(err);
  }
}

async function playAudioBufferWithVoiceEffects(
  arrayBuffer: ArrayBuffer,
  voiceProfile: OnlineVoiceOption,
  config: LectorConfig,
  sessionId: number,
  textLength: number,
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

      if (sessionId !== activePlaybackSessionId) return;

      const decodedData = await audioCtx.decodeAudioData(arrayBuffer);
      if (sessionId !== activePlaybackSessionId) return;

      await playDecodedAudioBuffer(decodedData, voiceProfile, config, sessionId, onStart, onEnd, onError);
      return;
    }
  } catch (err) {
    console.warn('AudioContext decode error, using HTML Audio fallback:', err);
    if (sessionId !== activePlaybackSessionId) return;
    try {
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.volume = config.volume;
      audio.playbackRate = config.rate;
      audio.onended = () => {
        if (sessionId !== activePlaybackSessionId) return;
        if (onEnd) onEnd();
        currentAudioElement = null;
      };
      audio.onerror = (e) => {
        if (sessionId !== activePlaybackSessionId) return;
        if (onError) onError(e);
        currentAudioElement = null;
      };
      currentAudioElement = audio;
      if (onStart && sessionId === activePlaybackSessionId) onStart();
      await audio.play();
    } catch (e2) {
      if (onError && sessionId === activePlaybackSessionId) onError(e2);
    }
  }
}

export interface LocalSpeechOptions extends PlayLectorOptions {
  sessionId?: number;
  desiredGender?: LectorGender;
  voiceProfile?: OnlineVoiceOption;
  preferredURI?: string;
}

function playLocalSpeechFallback(options: LocalSpeechOptions): void {
  const { text, config, sessionId, overrideLang, desiredGender, voiceProfile, preferredURI, onStart, onEnd, onError } = options;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onError) onError('Speech Synthesis API unsupported in this browser.');
    return;
  }

  const currentSession = sessionId ?? activePlaybackSessionId;
  const isCurrentSession = () => currentSession === activePlaybackSessionId;

  if (!isCurrentSession()) return;

  const targetLang = (overrideLang || (voiceProfile ? voiceProfile.lang : config.lang) || 'pl').toLowerCase();
  const targetGender: LectorGender = desiredGender || (voiceProfile ? voiceProfile.gender : config.gender) || 'male';

  const cleanText = cleanTextForSpeech(text, targetLang);
  if (!cleanText) {
    if (onError) onError('Brak tekstu do przeczytania');
    return;
  }

  lectorPlaybackState = 'playing';

  // Używamy zoptymalizowanego rozmiaru chunka ~160 znaków (krótkie zdania gwarantują odporność na 15-sekundowy limit Chrome)
  const textChunks = splitTextForTts(cleanText, 160);
  if (textChunks.length === 0) {
    if (onError) onError('Brak tekstu');
    return;
  }

  let chunkIndex = 0;

  // Rozwiązanie błędu Chromium Bug #679437: Chrome wstrzymuje odtwarzanie po ~14-15s mowy
  // Wywołanie pause() i od razu resume() co 5 sekund resetuje wewnętrzny licznik Chrome bez przerywania dźwięku
  if (chromeKeepAliveInterval) clearInterval(chromeKeepAliveInterval);
  chromeKeepAliveInterval = setInterval(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.speaking && lectorPlaybackState !== 'paused') {
        if (!window.speechSynthesis.paused) {
          try {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          } catch {}
        } else {
          try {
            window.speechSynthesis.resume();
          } catch {}
        }
      }
    }
  }, 5000);

  const speakNextChunk = () => {
    if (!isCurrentSession()) {
      if (chromeKeepAliveInterval) {
        clearInterval(chromeKeepAliveInterval);
        chromeKeepAliveInterval = null;
      }
      return;
    }

    if (chunkIndex >= textChunks.length) {
      if (chromeKeepAliveInterval) {
        clearInterval(chromeKeepAliveInterval);
        chromeKeepAliveInterval = null;
      }
      if (onEnd) onEnd();
      return;
    }

    const currentChunkText = textChunks[chunkIndex];
    chunkIndex++;

    const utterance = new SpeechSynthesisUtterance(currentChunkText);
    activeUtterances.add(utterance);

    // Nie deformujemy sztucznie pitchu dla lokalnych głosów systemowych (co powodowało metaliczne zacinanie w Windows)
    let basePitch = config.pitch ?? 1.0;
    if (voiceProfile) {
      if (voiceProfile.id.includes('Deep') || voiceProfile.provider.includes('Deep Male')) {
        basePitch *= 0.78;
      } else if (voiceProfile.gender === 'female' || voiceProfile.provider.includes('Female')) {
        basePitch *= 1.35;
      } else if (voiceProfile.gender === 'male') {
        basePitch *= 0.88;
      }
    }

    const speechRate = Math.max(0.6, Math.min(1.8, config.rate || 1.0));
    utterance.rate = speechRate;
    utterance.pitch = Math.max(0.6, Math.min(1.8, basePitch));
    utterance.volume = Math.max(0, Math.min(1.0, config.volume || 1.0));

    const chosenVoice = findBestLocalVoice(targetLang, targetGender, preferredURI);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang;
    } else {
      const bcp47Map: Record<string, string> = {
        pl: 'pl-PL', en: 'en-US', es: 'es-ES', it: 'it-IT', de: 'de-DE',
        fr: 'fr-FR', pt: 'pt-PT', uk: 'uk-UA', la: 'la', cs: 'cs-CZ',
        sk: 'sk-SK', hu: 'hu-HU', ro: 'ro-RO', lt: 'lt-LT', el: 'el-GR'
      };
      utterance.lang = bcp47Map[targetLang] || `${targetLang}-${targetLang.toUpperCase()}`;
    }

    if (chunkIndex === 1 && onStart) {
      onStart();
    }

    let chunkSettled = false;
    let watchdogTimer: any = null;

    const cleanupChunk = () => {
      chunkSettled = true;
      if (watchdogTimer) {
        clearTimeout(watchdogTimer);
        watchdogTimer = null;
      }
      activeUtterances.delete(utterance);
    };

    // Watchdog na wypadek gdyby silnik mowy w przeglądarce całkowicie zawisł bez zdarzenia onend/onerror
    // Zapewniamy bezpieczny czas: min. 16 sekund lub 160ms na znak uwzględniając tempo czytania
    const expectedDurationMs = Math.max(16000, Math.round((currentChunkText.length * 160) / speechRate) + 12000);
    watchdogTimer = setTimeout(() => {
      if (chunkSettled || !isCurrentSession()) return;
      cleanupChunk();
      console.warn('Speech chunk watchdog recovered stuck speech, advancing to next chunk...');
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      } catch {}
      setTimeout(() => {
        if (isCurrentSession()) {
          speakNextChunk();
        }
      }, 70);
    }, expectedDurationMs);

    utterance.onend = () => {
      if (chunkSettled) return;
      cleanupChunk();
      if (!isCurrentSession()) return;
      // Drobny odstęp (35ms) umożliwia karcie dźwiękowej / silnikowi mowy czyste domknięcie bufora
      setTimeout(() => {
        if (isCurrentSession()) {
          speakNextChunk();
        }
      }, 35);
    };

    utterance.onerror = (err: any) => {
      if (chunkSettled) return;
      cleanupChunk();
      if (!isCurrentSession()) return;
      // Jeśli użytkownik świadomie przerwał / zamknął odtwarzacz
      if (err && err.error === 'canceled') {
        return;
      }
      console.warn('Local speech chunk warning, auto-recovering next chunk:', err);
      setTimeout(() => {
        if (isCurrentSession()) {
          speakNextChunk();
        }
      }, 50);
    };

    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
        try { window.speechSynthesis.resume(); } catch {}
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis.speak failed:', e);
      cleanupChunk();
      setTimeout(() => {
        if (isCurrentSession()) {
          speakNextChunk();
        }
      }, 60);
    }
  };

  // Uruchomienie z bezpiecznym opóźnieniem (80ms) gwarantującym odblokowanie kolejki po wcześniejszym cancel()
  setTimeout(() => {
    if (isCurrentSession()) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
        try { window.speechSynthesis.resume(); } catch {}
      }
      speakNextChunk();
    }
  }, 80);
}

