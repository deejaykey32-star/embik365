import React, { useState, useEffect } from 'react';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Globe, 
  Sparkles, 
  Play, 
  Square, 
  Sliders, 
  Check, 
  Cpu, 
  Cloud,
  CheckCircle2,
  Mic
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../types';
import { 
  LectorConfig, 
  LectorMode, 
  getLectorConfig, 
  saveLectorConfig, 
  getLocalVoices, 
  getLocalVoicesForLang, 
  ONLINE_VOICES,
  playLectorSpeech,
  stopLectorSpeech
} from '../utils/audioLectorService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentLang?: string;
}

export const LectorSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentLang = 'pl'
}) => {
  if (!isOpen) return null;

  const [config, setConfig] = useState<LectorConfig>(() => {
    const loaded = getLectorConfig();
    if (!loaded.lang) loaded.lang = currentLang;
    return loaded;
  });

  const [localVoices, setLocalVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [isPlayingTest, setIsPlayingTest] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  // Load available local Web Speech API voices
  useEffect(() => {
    const updateVoices = () => {
      const voices = getLocalVoices();
      setLocalVoices(voices);
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const selectedLangObj = SUPPORTED_LANGUAGES.find(l => l.code === config.lang) || SUPPORTED_LANGUAGES[0];

  // Voices matching currently selected language in modal
  const matchingLocalVoices = getLocalVoicesForLang(config.lang);
  const matchingOnlineVoices = ONLINE_VOICES.filter(v => v.lang === config.lang);

  const handleGenderFilterChange = (g: 'all' | 'male' | 'female') => {
    setGenderFilter(g);
    if (g === 'male' || g === 'female') {
      const langOnlines = ONLINE_VOICES.filter(v => v.lang === config.lang);
      const matchOnline = langOnlines.find(v => v.gender === g);
      const updated: LectorConfig = {
        ...config,
        gender: g,
        onlineVoiceId: matchOnline?.id || config.onlineVoiceId
      };
      setConfig(updated);
      saveLectorConfig(updated);
    }
  };

  const handleModeChange = (mode: LectorMode) => {
    const updated = { ...config, mode };
    setConfig(updated);
    saveLectorConfig(updated);
  };

  const handleLangChange = (lang: string) => {
    const langLocals = getLocalVoicesForLang(lang);
    const langOnlines = ONLINE_VOICES.filter(v => v.lang === lang);
    const matchOnline = langOnlines.find(v => v.gender === config.gender) || langOnlines[0];

    const updated: LectorConfig = {
      ...config,
      lang,
      localVoiceURI: langLocals[0]?.voiceURI || '',
      onlineVoiceId: matchOnline?.id || 'pl-AI-Jan'
    };
    setConfig(updated);
    saveLectorConfig(updated);
  };

  const handleSaveConfig = () => {
    saveLectorConfig(config);
    setTestStatus('Zapisano pomyślnie preferencje lektora!');
    setTimeout(() => setTestStatus(null), 2500);
  };

  const handleTestSpeech = async () => {
    if (isPlayingTest) {
      stopLectorSpeech();
      setIsPlayingTest(false);
      return;
    }

    setIsPlayingTest(true);
    setTestStatus('Odtwarzanie próbne lektora...');

    const sampleTexts: Record<string, string> = {
      pl: 'Witaj w aplikacji Droga 365. Pokój i Dobro. Oto odczyt próby głosu lektora.',
      en: 'Welcome to Signposts 365. Peace and goodness. This is a voice lector test.',
      es: 'Bienvenido a Pistas 365. Paz y bien. Esta es una prueba de voz del lector.',
      it: 'Benvenuto a Segnavia 365. Pace e bene. Questa è una prova di voce del lettore.',
      de: 'Willkommen bei Wegweiser 365. Frieden und Gutes. Dies ist ein Hörtest.',
      fr: 'Bienvenue sur Repères 365. Paix et bien. Ceci est un test de la voix du lecteur.',
      pt: 'Bem-vindo ao Faróis 365. Paz e bem. Este é um teste de voz do leitor.',
      uk: 'Ласкаво просимо до Вказівники 365. Мир та добро. Це тест голосу читця.',
      la: 'Pax et bonum. Haec est probatio vocis lectoris.'
    };

    const textToSpeak = sampleTexts[config.lang] || sampleTexts.pl;

    await playLectorSpeech({
      text: textToSpeak,
      config,
      overrideLang: config.lang,
      onStart: () => setIsPlayingTest(true),
      onEnd: () => {
        setIsPlayingTest(false);
        setTestStatus(null);
      },
      onError: () => {
        setIsPlayingTest(false);
        setTestStatus('Błąd odtwarzania próby mowy.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#0c121e] text-stone-900 dark:text-[#f1f5f9] rounded-3xl border border-amber-500/30 shadow-2xl p-5 sm:p-7 relative max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-heading-cinzel font-bold text-stone-900 dark:text-white">
                Ustawienia Lektora & Języka Mowy
              </h3>
              <p className="text-xs text-stone-500 dark:text-[#94a3b8]">
                Wybierz lektora w wersji <strong className="text-amber-700 dark:text-amber-300">Lokalnej (Systemowej)</strong> lub <strong className="text-amber-700 dark:text-amber-300">Online (AI Cloud)</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopLectorSpeech();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 text-xs">
          
          {testStatus && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-300 font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>{testStatus}</span>
            </div>
          )}

          {/* 1. SELEKCJA TRYBU: LOKALNY VS ONLINE */}
          <div>
            <label className="block font-bold text-stone-800 dark:text-stone-200 mb-2 uppercase tracking-wide">
              1. Wybierz wersję i silnik syntezy lektora:
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tryb Lokalny */}
              <button
                type="button"
                onClick={() => handleModeChange('local')}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                  config.mode === 'local'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-950 dark:text-amber-200 font-bold shadow-sm ring-1 ring-amber-500/40'
                    : 'bg-stone-50 dark:bg-[#131c2e] border-stone-200 dark:border-stone-800 hover:border-amber-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 font-bold text-sm">
                    <Cpu className="w-4 h-4 text-amber-600" />
                    <span>Wersja Lokalna (Systemowa)</span>
                  </span>
                  {config.mode === 'local' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-[11px] opacity-80 leading-relaxed font-normal">
                  Wykorzystuje natywne głosy syntezatora mowy (Web Speech API) zainstalowane w Twojej przeglądarce i systemie (np. Windows Speech, Android TTS, iOS). Działa offline!
                </p>
              </button>

              {/* Tryb Online */}
              <button
                type="button"
                onClick={() => handleModeChange('online')}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                  config.mode === 'online'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-950 dark:text-amber-200 font-bold shadow-sm ring-1 ring-amber-500/40'
                    : 'bg-stone-50 dark:bg-[#131c2e] border-stone-200 dark:border-stone-800 hover:border-amber-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 font-bold text-sm">
                    <Cloud className="w-4 h-4 text-amber-600" />
                    <span>Wersja Online (AI Cloud Neural)</span>
                  </span>
                  {config.mode === 'online' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-[11px] opacity-80 leading-relaxed font-normal">
                  Wysokiej jakości naturalne, chmurowe głosy konwersacyjne oparte na syntezie AI. Wymaga połączenia z internetem.
                </p>
              </button>
            </div>
          </div>

          {/* 2. WYBÓR JĘZYKA LEKTORA */}
          <div>
            <label className="block font-bold text-stone-800 dark:text-stone-200 mb-2 uppercase tracking-wide">
              2. Język lektora:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSel = config.lang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLangChange(lang.code)}
                    className={`px-3 py-2 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                      isSel
                        ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-xs'
                        : 'bg-stone-50 dark:bg-[#131c2e] border-stone-200 dark:border-stone-800 hover:border-amber-500/40'
                    }`}
                  >
                    <span className="text-base">{lang.flag}</span>
                    <span className="truncate">{lang.nativeName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. WYBÓR KONKRETNEGO GŁOSU (LOKALNEGO LUB ONLINE) */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#131c2e] border border-stone-200 dark:border-stone-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wide">
                3. Wybór głosu lektora ({selectedLangObj.flag} {selectedLangObj.nativeName}):
              </label>

              {config.mode === 'online' && (
                <div className="flex items-center gap-1.5 bg-stone-200 dark:bg-[#0c121e] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleGenderFilterChange('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      genderFilter === 'all' ? 'bg-amber-600 text-white' : 'text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Wszystkie Głosy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenderFilterChange('male')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      genderFilter === 'male' ? 'bg-amber-600 text-white' : 'text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Głos Męski ♂
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenderFilterChange('female')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      genderFilter === 'female' ? 'bg-amber-600 text-white' : 'text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Głos Żeński ♀
                  </button>
                </div>
              )}
            </div>

            {config.mode === 'local' ? (
              <div>
                {matchingLocalVoices.length > 0 ? (
                  <select
                    value={config.localVoiceURI}
                    onChange={(e) => {
                      const updated = { ...config, localVoiceURI: e.target.value };
                      setConfig(updated);
                      saveLectorConfig(updated);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#0c121e] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold focus:outline-hidden focus:border-amber-500 cursor-pointer"
                  >
                    {matchingLocalVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang}) {v.default ? ' [Domyślny systemowy]' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-900 dark:text-amber-300 font-medium">
                    Brak bezpośrednio zarejestrowanych głosów systemowych dla języka {selectedLangObj.nativeName}. Przeglądarka użyje domyślnego syntezatora mowy lub możesz przełączyć na tryb <strong>Online (AI Cloud)</strong>!
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  value={config.onlineVoiceId}
                  onChange={(e) => {
                    const selectedVoice = ONLINE_VOICES.find(v => v.id === e.target.value);
                    if (selectedVoice) {
                      const updated: LectorConfig = {
                        ...config,
                        onlineVoiceId: selectedVoice.id,
                        gender: selectedVoice.gender,
                        lang: selectedVoice.lang
                      };
                      setConfig(updated);
                      saveLectorConfig(updated);
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#0c121e] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold focus:outline-hidden focus:border-amber-500 cursor-pointer"
                >
                  {(() => {
                    const currentSel = ONLINE_VOICES.find(v => v.id === config.onlineVoiceId);
                    const list = ONLINE_VOICES.filter(v => v.lang === config.lang || v.id === config.onlineVoiceId);
                    const filtered = (list.length > 0 ? list : ONLINE_VOICES)
                      .filter(v => genderFilter === 'all' || v.gender === genderFilter || v.id === config.onlineVoiceId);
                    return filtered.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} — {v.gender === 'female' ? 'Głos Żeński ♀' : 'Głos Męski ♂'} ({v.provider})
                      </option>
                    ));
                  })()}
                </select>

                {/* Selected Voice Details Card */}
                {(() => {
                  const selectedVoiceObj = ONLINE_VOICES.find(v => v.id === config.onlineVoiceId);
                  if (!selectedVoiceObj) return null;
                  return (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-2">
                          <span>{selectedVoiceObj.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-600 text-white font-sans-ui">
                            {selectedVoiceObj.gender === 'female' ? 'Żeński ♀' : 'Męski ♂'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-0.5">
                          {selectedVoiceObj.description}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* 4. REGULACJA TEMPA, TONU I GŁOŚNOŚCI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-[#131c2e] border border-stone-200 dark:border-stone-800">
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center justify-between">
                <span>Prędkość Mowy</span>
                <span className="font-mono text-amber-600">{config.rate}x</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={config.rate}
                onChange={(e) => {
                  const updated = { ...config, rate: parseFloat(e.target.value) };
                  setConfig(updated);
                  saveLectorConfig(updated);
                }}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center justify-between">
                <span>Ton Mowy (Pitch)</span>
                <span className="font-mono text-amber-600">{config.pitch}</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={config.pitch}
                onChange={(e) => {
                  const updated = { ...config, pitch: parseFloat(e.target.value) };
                  setConfig(updated);
                  saveLectorConfig(updated);
                }}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center justify-between">
                <span>Głośność</span>
                <span className="font-mono text-amber-600">{Math.round(config.volume * 100)}%</span>
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={config.volume}
                onChange={(e) => {
                  const updated = { ...config, volume: parseFloat(e.target.value) };
                  setConfig(updated);
                  saveLectorConfig(updated);
                }}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* Footer controls */}
        <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleTestSpeech}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 dark:text-amber-300 border border-amber-500/40 font-bold flex items-center gap-2 cursor-pointer transition-colors"
          >
            {isPlayingTest ? <Square className="w-4 h-4 fill-amber-600" /> : <Play className="w-4 h-4 fill-amber-600" />}
            <span>{isPlayingTest ? 'Zatrzymaj Odsłuch' : '🔊 Przetestuj Głos Lektora'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                stopLectorSpeech();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold cursor-pointer"
            >
              Zamknij
            </button>
            <button
              type="button"
              onClick={() => {
                handleSaveConfig();
                stopLectorSpeech();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Zapisz Ustawienia Lektora</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
