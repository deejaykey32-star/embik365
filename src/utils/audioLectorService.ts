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
  { id: 'la-AI-Benedicta', name: 'Benedicta ♀ (Lectora Ecclesiastica Feminina)', lang: 'la', gender: 'female', description: 'Vox sancta et serena pro recitatione', provider: 'AI Cloud Female' }
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

export function findBestLocalVoice(
  langCode: string,
  desiredGender: LectorGender,
  preferredURI?: string
): SpeechSynthesisVoice | undefined {
  const voices = getLocalVoices();
  if (voices.length === 0) return undefined;

  const targetLang = (langCode || 'pl').toLowerCase();

  // 1. If preferredURI is provided and matches targetLang, verify its availability
  if (preferredURI) {
    const match = voices.find(v => v.voiceURI === preferredURI);
    if (match) {
      const vLang = match.lang.toLowerCase().replace('_', '-');
      if (vLang.startsWith(targetLang) || vLang.includes(targetLang)) {
        return match;
      }
    }
  }

  // 2. Filter voices matching target language
  const langVoices = voices.filter(v => {
    const vLang = v.lang.toLowerCase().replace('_', '-');
    return vLang.startsWith(targetLang) || vLang.includes(targetLang);
  });

  if (langVoices.length === 0) {
    // Global fallback
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

export function stopLectorSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement = null;
  }
}

export interface PlayLectorOptions {
  text: string;
  config: LectorConfig;
  overrideLang?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export async function playLectorSpeech(options: PlayLectorOptions): Promise<void> {
  const { text, config, overrideLang, onStart, onEnd, onError } = options;
  stopLectorSpeech();

  if (!text || !text.trim()) return;

  const targetLang = (overrideLang || config.lang || 'pl').toLowerCase();
  const targetGender: LectorGender = config.gender || 'male';

  // Ensure onlineVoiceId matches targetLang and targetGender
  let onlineProfile = ONLINE_VOICES.find(v => v.id === config.onlineVoiceId && v.lang === targetLang);
  if (!onlineProfile) {
    onlineProfile = ONLINE_VOICES.find(v => v.lang === targetLang && v.gender === targetGender)
      || ONLINE_VOICES.find(v => v.lang === targetLang)
      || ONLINE_VOICES[0];
  }

  if (config.mode === 'online') {
    try {
      if (onStart) onStart();

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: onlineProfile.id,
          lang: targetLang,
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
          console.warn('Online Audio playback failed, falling back to local speech:', e);
          playLocalSpeechFallback({ ...options, overrideLang: targetLang });
        };

        currentAudioElement = audio;
        await audio.play();
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

function playLocalSpeechFallback(options: PlayLectorOptions): void {
  const { text, config, overrideLang, onStart, onEnd, onError } = options;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onError) onError('Speech Synthesis API unsupported in this browser.');
    return;
  }

  const targetLang = (overrideLang || config.lang || 'pl').toLowerCase();
  const targetGender: LectorGender = config.gender || 'male';

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = config.rate;
  utterance.pitch = config.pitch * (targetGender === 'female' ? 1.12 : targetGender === 'male' ? 0.90 : 1.0);
  utterance.volume = config.volume;

  const chosenVoice = findBestLocalVoice(targetLang, targetGender, config.localVoiceURI);
  if (chosenVoice) {
    utterance.voice = chosenVoice;
    utterance.lang = chosenVoice.lang;
  } else {
    utterance.lang = `${targetLang}-${targetLang.toUpperCase()}`;
  }

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (err) => {
    if (onError) onError(err);
  };

  window.speechSynthesis.speak(utterance);
}
