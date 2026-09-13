import { SUPPORTED_LANGUAGES } from '../types';

export type LectorMode = 'local' | 'online';

export interface OnlineVoiceOption {
  id: string;
  name: string;
  lang: string;
  gender: 'male' | 'female';
  description: string;
  provider: string;
}

export interface LectorConfig {
  mode: LectorMode;
  lang: string;
  localVoiceURI: string;
  onlineVoiceId: string;
  rate: number;   // 0.5 to 2.0 (default 1.0)
  pitch: number;  // 0.5 to 1.5 (default 1.0)
  volume: number; // 0.0 to 1.0 (default 1.0)
}

export const ONLINE_VOICES: OnlineVoiceOption[] = [
  // Polski
  { id: 'pl-AI-Jan', name: 'Jan (Lektor Naturalny Męski)', lang: 'pl', gender: 'male', description: 'Głęboki, ciepły głos lektorski do rozważań i medytacji', provider: 'AI Cloud Neural' },
  { id: 'pl-AI-Ewa', name: 'Ewa (Lektorka Naturalna Żeńska)', lang: 'pl', gender: 'female', description: 'Jasny, spokojny głos czytelniczy', provider: 'AI Cloud Neural' },
  
  // English
  { id: 'en-AI-David', name: 'David (AI Studio Natural Male)', lang: 'en', gender: 'male', description: 'Warm, articulate narrator voice', provider: 'AI Cloud Neural' },
  { id: 'en-AI-[#Emma]', name: 'Emma (AI Neural Female)', lang: 'en', gender: 'female', description: 'Clear, gentle reading voice', provider: 'AI Cloud Neural' },
  
  // Español
  { id: 'es-AI-Mateo', name: 'Mateo (Lector Espiritual)', lang: 'es', gender: 'male', description: 'Voz cálida y pausada para meditaciones', provider: 'AI Cloud Neural' },
  { id: 'es-AI-Sofia', name: 'Sofía (Lectora Serena)', lang: 'es', gender: 'female', description: 'Voz clara e inspiradora', provider: 'AI Cloud Neural' },
  
  // Italiano
  { id: 'it-AI-Marco', name: 'Marco (Lettore Naturale)', lang: 'it', gender: 'male', description: 'Voce solenne e calda', provider: 'AI Cloud Neural' },
  { id: 'it-AI-Giulia', name: 'Giulia (Lettrice Chiara)', lang: 'it', gender: 'female', description: 'Voce serena per la preghiera', provider: 'AI Cloud Neural' },

  // Deutsch
  { id: 'de-AI-Hans', name: 'Hans (Sprecher AI)', lang: 'de', gender: 'male', description: 'Ruhige, getragene Stimme', provider: 'AI Cloud Neural' },
  { id: 'de-AI-Greta', name: 'Greta (Sprecherin AI)', lang: 'de', gender: 'female', description: 'Klare, sanfte Vorlesestimme', provider: 'AI Cloud Neural' },

  // Français
  { id: 'fr-AI-Louis', name: 'Louis (Lecteur AI)', lang: 'fr', gender: 'male', description: 'Voix chaleureuse et méditative', provider: 'AI Cloud Neural' },
  { id: 'fr-AI-Claire', name: 'Claire (Lectrice AI)', lang: 'fr', gender: 'female', description: 'Voix douce et claire', provider: 'AI Cloud Neural' },

  // Português
  { id: 'pt-AI-Joao', name: 'João (Lector AI)', lang: 'pt', gender: 'male', description: 'Voz calma e inspiradora', provider: 'AI Cloud Neural' },

  // Українська
  { id: 'uk-AI-Oleksandr', name: 'Олександр (Декламатор AI)', lang: 'uk', gender: 'male', description: 'Глибокий, спокійний голос для молитов', provider: 'AI Cloud Neural' },

  // Lingua Latina
  { id: 'la-AI-Marcus', name: 'Marcus (Lector Ecclesiasticus)', lang: 'la', gender: 'male', description: 'Vox eclesiastica solemnis pro orationibus', provider: 'AI Cloud Neural' }
];

const STORAGE_KEY = 'drogowskazy_lector_config';

export const DEFAULT_LECTOR_CONFIG: LectorConfig = {
  mode: 'local',
  lang: 'pl',
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
      return { ...DEFAULT_LECTOR_CONFIG, ...JSON.parse(saved) };
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

/**
 * Gets all locally installed Web Speech API voices from the browser.
 */
export function getLocalVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

/**
 * Filter local voices matching a language code (e.g. 'pl', 'en', 'es').
 */
export function getLocalVoicesForLang(langCode: string): SpeechSynthesisVoice[] {
  const voices = getLocalVoices();
  const lowerLang = langCode.toLowerCase();
  return voices.filter(v => {
    const vLang = v.lang.toLowerCase().replace('_', '-');
    return vLang.startsWith(lowerLang) || vLang.includes(lowerLang);
  });
}

// Active speech utterance state for pause/resume/stop control
let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentAudioElement: HTMLAudioElement | null = null;

export function stopLectorSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement = null;
  }
  currentUtterance = null;
}

export interface PlayLectorOptions {
  text: string;
  config: LectorConfig;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

/**
 * Primary function to speak text using either Local (Web Speech API) or Online AI TTS engine.
 */
export async function playLectorSpeech(options: PlayLectorOptions): Promise<void> {
  const { text, config, onStart, onEnd, onError } = options;
  stopLectorSpeech();

  if (!text || !text.trim()) return;

  if (config.mode === 'online') {
    // ONLINE AI TTS MODE
    try {
      if (onStart) onStart();

      // Request synthesized audio from /api/tts
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: config.onlineVoiceId,
          lang: config.lang,
          rate: config.rate,
          pitch: config.pitch
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.volume = config.volume;
        audio.playbackRate = config.rate;

        audio.onended = () => {
          if (onEnd) onEnd();
          currentAudioElement = null;
        };

        audio.onerror = (e) => {
          console.warn('Online Audio playback failed, falling back to local TTS:', e);
          playLocalSpeechFallback(options);
        };

        currentAudioElement = audio;
        await audio.play();
      } else {
        // Fallback to local speech if server online endpoint fails
        playLocalSpeechFallback(options);
      }
    } catch (err) {
      console.warn('Online TTS error, falling back to local speech:', err);
      playLocalSpeechFallback(options);
    }
  } else {
    // LOCAL WEB SPEECH API MODE
    playLocalSpeechFallback(options);
  }
}

function playLocalSpeechFallback(options: PlayLectorOptions): void {
  const { text, config, onStart, onEnd, onError } = options;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onError) onError('Speech Synthesis API unsupported in this browser.');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = config.rate;
  utterance.pitch = config.pitch;
  utterance.volume = config.volume;

  // Try to attach chosen local voice
  const allVoices = getLocalVoices();
  if (config.localVoiceURI) {
    const found = allVoices.find(v => v.voiceURI === config.localVoiceURI);
    if (found) utterance.voice = found;
  }

  if (!utterance.voice) {
    // Match by language code
    const langVoices = getLocalVoicesForLang(config.lang);
    if (langVoices.length > 0) {
      utterance.voice = langVoices[0];
    }
  }

  utterance.lang = utterance.voice?.lang || `${config.lang}-${config.lang.toUpperCase()}`;

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
    currentUtterance = null;
  };

  utterance.onerror = (err) => {
    if (onError) onError(err);
    currentUtterance = null;
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}
