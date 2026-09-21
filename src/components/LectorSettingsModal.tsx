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
  Mic,
  UserCheck
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
  OnlineVoiceOption,
  playLectorSpeech,
  stopLectorSpeech,
  unlockMobileAudio,
  getSerialLectorState,
  saveSerialLectorState,
  detectVoiceGender
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

  // Load available local Web Speech API voices with continuous polling fallback
  useEffect(() => {
    const updateVoices = () => {
      const voices = getLocalVoices();
      if (voices.length > 0) {
        setLocalVoices(voices);
      }
    };

    updateVoices();
    const interval = setInterval(updateVoices, 250);
    const timer = setTimeout(() => clearInterval(interval), 4000);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
      try { window.speechSynthesis.getVoices(); } catch {}
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  const selectedLangObj = SUPPORTED_LANGUAGES.find(l => l.code === config.lang) || SUPPORTED_LANGUAGES[0];

  const handleGenderFilterChange = (g: 'all' | 'male' | 'female') => {
    setGenderFilter(g);
    if (g === 'male' || g === 'female') {
      const langOnlines = ONLINE_VOICES.filter(v => v.lang === config.lang);
      const matchOnline = langOnlines.find(v => v.gender === g);

      const langLocals = getLocalVoicesForLang(config.lang);
      const matchLocal = langLocals.find(v => detectVoiceGender(v.name) === g);

      const updated: LectorConfig = {
        ...config,
        gender: g,
        onlineVoiceId: matchOnline?.id || config.onlineVoiceId,
        localVoiceURI: matchLocal?.voiceURI || config.localVoiceURI
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
      localVoiceURI: langLocals[0]?.voiceURI || config.localVoiceURI,
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
      la: 'Pax et bonum. Haec est probatio vocis lectoris.',
      cs: 'Vítejte v aplikaci Ukazatele 365. Mír a dobro. Toto je test hlasu lektora.',
      sk: 'Vitajte v aplikácii Ukazovatele 365. Pokoj a dobro. Toto je test hlasu lektora.',
      hu: 'Üdvözöljük a Útjelzők 365 alkalmazásban. Békesség és jóság. Ez a felolvasó hangtesztje.',
      ro: 'Bine ați venit la Indicatoare 365. Pace și bine. Acesta este un test de voce al lectorului.',
      lt: 'Sveiki atvykę į Rodikliai 365 programėlę. Ramybė ir gėris. Tai diktoriaus balso testas.',
      el: 'Καλώς ορίσατε στο Δείκτες 365. Ειρήνη και αγαθό. Αυτή είναι μια δοκιμή φωνής αφηγητή.'
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

  // Compute grouped local and online voices
  const allLocalVoicesList = localVoices.length > 0 ? localVoices : getLocalVoices();
  const lowerTargetLang = config.lang.toLowerCase();

  const matchedLangLocalVoices = allLocalVoicesList.filter(v => {
    const vLang = v.lang.toLowerCase().replace('_', '-');
    return vLang.startsWith(lowerTargetLang) || vLang.includes(lowerTargetLang);
  });

  const otherLocalVoices = allLocalVoicesList.filter(v => !matchedLangLocalVoices.includes(v));

  const filterLocalByGender = (items: SpeechSynthesisVoice[]) => {
    if (genderFilter === 'all') return items;
    return items.filter(v => detectVoiceGender(v.name) === genderFilter);
  };

  const filterOnlineByGender = (items: OnlineVoiceOption[]) => {
    if (genderFilter === 'all') return items;
    return items.filter(v => v.gender === genderFilter);
  };

  // Online voices for active language & gender filter
  const langOnlineVoices = ONLINE_VOICES.filter(v => v.lang === config.lang);
  const filteredLangOnlineVoices = filterOnlineByGender(langOnlineVoices);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-3xl bg-[#faf8f5] dark:bg-[#0c121e] text-stone-900 dark:text-[#f1f5f9] rounded-3xl border-2 border-amber-500/40 shadow-2xl p-4 sm:p-7 relative max-h-[94vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-lg border border-amber-300/40">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-heading-cinzel font-bold text-stone-900 dark:text-white">
                Wybiór Głosów & Lektora Audio
              </h3>
              <p className="text-xs text-stone-600 dark:text-[#94a3b8]">
                Wybierz lektora w wersji <strong className="text-amber-700 dark:text-amber-300">Lokalnej (Systemowej)</strong> lub <strong className="text-amber-700 dark:text-amber-300">Online (AI Cloud Neural)</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopLectorSpeech();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-stone-200 dark:bg-white/10 hover:bg-stone-300 dark:hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-stone-700 dark:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 text-xs pr-1">
          
          {testStatus && (
            <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-950 dark:text-amber-200 font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>{testStatus}</span>
            </div>
          )}

          {/* 1. SELEKCJA TRYBU: LOKALNY VS ONLINE */}
          <div>
            <label className="block font-bold text-stone-900 dark:text-stone-100 mb-2 uppercase tracking-wide text-[11px]">
              1. Wybierz wersję silnika lektora:
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tryb Lokalny */}
              <button
                type="button"
                onClick={() => handleModeChange('local')}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                  config.mode === 'local'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-950 dark:text-amber-100 font-bold shadow-md ring-2 ring-amber-500/50'
                    : 'bg-white dark:bg-[#131c2e] border-stone-300 dark:border-stone-800 hover:border-amber-500/50 text-stone-800 dark:text-stone-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 font-bold text-sm text-stone-900 dark:text-white">
                    <Cpu className="w-5 h-5 text-amber-600" />
                    <span>Wersja Lokalna (Systemowa)</span>
                  </span>
                  {config.mode === 'local' && <CheckCircle2 className="w-5 h-5 text-amber-600" />}
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed font-normal text-stone-600 dark:text-stone-300">
                  Wykorzystuje lektorów zainstalowanych w Twojej przeglądarce i systemie (np. Windows Speech, Android TTS, iOS Siri). Działa offline!
                </p>
              </button>

              {/* Tryb Online */}
              <button
                type="button"
                onClick={() => handleModeChange('online')}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                  config.mode === 'online'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-950 dark:text-amber-100 font-bold shadow-md ring-2 ring-amber-500/50'
                    : 'bg-white dark:bg-[#131c2e] border-stone-300 dark:border-stone-800 hover:border-amber-500/50 text-stone-800 dark:text-stone-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 font-bold text-sm text-stone-900 dark:text-white">
                    <Cloud className="w-5 h-5 text-amber-600" />
                    <span>Wersja Online (AI Cloud Neural)</span>
                  </span>
                  {config.mode === 'online' && <CheckCircle2 className="w-5 h-5 text-amber-600" />}
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed font-normal text-stone-600 dark:text-stone-300">
                  Wysokiej jakości lektorzy konwersacyjni AI (męscy i żeńscy). Naturalna intonacja medytacyjna i rozważaniowa.
                </p>
              </button>
            </div>
          </div>

          {/* 2. WYBÓR JĘZYKA LEKTORA */}
          <div>
            <label className="block font-bold text-stone-900 dark:text-stone-100 mb-2 uppercase tracking-wide text-[11px]">
              2. Język czytania:
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
                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold border-amber-500 shadow-md'
                        : 'bg-white dark:bg-[#131c2e] border-stone-300 dark:border-stone-800 text-stone-800 dark:text-stone-200 hover:border-amber-500/40'
                    }`}
                  >
                    <span className="text-base">{lang.flag}</span>
                    <span className="truncate">{lang.nativeName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. SELEKCJA GŁOSÓW (MĘSKIE ♂ / ŻEŃSKIE ♀ / DROPDOWN + KARTY WIZUALNE) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#131c2e] border-2 border-amber-500/30 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wide text-[11px]">
                3. Lista dostępnych lektorów ({selectedLangObj.flag} {selectedLangObj.nativeName}):
              </label>

              {/* FIlTR PŁCI: WSZYSTKIE / MĘSKI ♂ / ŻEŃSKI ♀ */}
              <div className="flex items-center gap-1.5 bg-stone-200 dark:bg-[#0c121e] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleGenderFilterChange('all')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    genderFilter === 'all' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-700 dark:text-stone-300'
                  }`}
                >
                  Wszystkie
                </button>
                <button
                  type="button"
                  onClick={() => handleGenderFilterChange('male')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    genderFilter === 'male' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-700 dark:text-stone-300'
                  }`}
                >
                  Męski ♂
                </button>
                <button
                  type="button"
                  onClick={() => handleGenderFilterChange('female')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    genderFilter === 'female' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-700 dark:text-stone-300'
                  }`}
                >
                  Żeński ♀
                </button>
              </div>
            </div>

            {/* A) DROPDOWN SELECT WITH EXPLICIT OPTION STYLING AND HIGH CONTRAST */}
            {config.mode === 'local' ? (
              <div className="space-y-3">
                <select
                  value={config.localVoiceURI}
                  onChange={(e) => {
                    const updated = { ...config, localVoiceURI: e.target.value };
                    setConfig(updated);
                    saveLectorConfig(updated);
                  }}
                  className="w-full px-3.5 py-3 rounded-xl bg-stone-100 dark:bg-[#080d16] border-2 border-amber-500/40 text-stone-900 dark:text-stone-100 font-bold focus:outline-hidden focus:border-amber-500 cursor-pointer text-xs"
                  style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                >
                  {(() => {
                    const filteredMatched = filterLocalByGender(matchedLangLocalVoices);
                    const filteredOther = filterLocalByGender(otherLocalVoices);

                    if (filteredMatched.length === 0 && filteredOther.length === 0) {
                      return (
                        <option value="" style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                          🔊 Domyślny lektor systemowy ({selectedLangObj.nativeName})
                        </option>
                      );
                    }

                    return (
                      <>
                        {filteredMatched.length > 0 && (
                          <optgroup 
                            label={`--- Głosy w języku ${selectedLangObj.nativeName} (${selectedLangObj.flag}) ---`}
                            style={{ backgroundColor: '#0f172a', color: '#f59e0b', fontWeight: 'bold' }}
                          >
                            {filteredMatched.map((v) => {
                              const gender = detectVoiceGender(v.name);
                              const icon = gender === 'female' ? '👩' : '👨';
                              return (
                                <option 
                                  key={v.voiceURI} 
                                  value={v.voiceURI}
                                  style={{ backgroundColor: '#1e293b', color: '#ffffff' }}
                                >
                                  {icon} {v.name} ({v.lang}) [{gender === 'female' ? 'Głos Żeński ♀' : 'Głos Męski ♂'}]{v.default ? ' - Domyślny OS' : ''}
                                </option>
                              );
                            })}
                          </optgroup>
                        )}

                        {filteredOther.length > 0 && (
                          <optgroup 
                            label="--- Pozostałe zainstalowane głosy systemowe ---"
                            style={{ backgroundColor: '#0f172a', color: '#f59e0b', fontWeight: 'bold' }}
                          >
                            {filteredOther.map((v) => {
                              const gender = detectVoiceGender(v.name);
                              const icon = gender === 'female' ? '👩' : '👨';
                              return (
                                <option 
                                  key={v.voiceURI} 
                                  value={v.voiceURI}
                                  style={{ backgroundColor: '#1e293b', color: '#ffffff' }}
                                >
                                  {icon} {v.name} ({v.lang}) [{gender === 'female' ? 'Głos Żeński ♀' : 'Głos Męski ♂'}]
                                </option>
                              );
                            })}
                          </optgroup>
                        )}
                      </>
                    );
                  })()}
                </select>

                {/* B) VISUAL VOICE SELECTION CARDS FOR LOCAL MODE */}
                <div className="mt-3">
                  <span className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-2">
                    Szybki wybór lektora lokalnego (Karty):
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {(filterLocalByGender(matchedLangLocalVoices).length > 0
                      ? filterLocalByGender(matchedLangLocalVoices)
                      : filterLocalByGender(allLocalVoicesList)
                    ).map((v) => {
                      const gender = detectVoiceGender(v.name);
                      const isSelected = config.localVoiceURI === v.voiceURI;
                      return (
                        <button
                          key={v.voiceURI}
                          type="button"
                          onClick={() => {
                            const updated: LectorConfig = {
                              ...config,
                              localVoiceURI: v.voiceURI,
                              gender: gender
                            };
                            setConfig(updated);
                            saveLectorConfig(updated);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-500 text-amber-950 dark:text-amber-100 font-bold shadow-sm ring-1 ring-amber-500'
                              : 'bg-stone-50 dark:bg-[#0c121e] border-stone-200 dark:border-stone-800 hover:border-amber-500/40 text-stone-800 dark:text-stone-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-lg">{gender === 'female' ? '👩' : '👨'}</span>
                            <div className="min-w-0">
                              <div className="font-bold truncate text-xs">{v.name}</div>
                              <div className="text-[10px] opacity-75">
                                {gender === 'female' ? 'Żeński ♀' : 'Męski ♂'} • {v.lang}
                              </div>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : (
              /* ONLINE MODE VOICE SELECT & CARDS */
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
                  className="w-full px-3.5 py-3 rounded-xl bg-stone-100 dark:bg-[#080d16] border-2 border-amber-500/40 text-stone-900 dark:text-stone-100 font-bold focus:outline-hidden focus:border-amber-500 cursor-pointer text-xs"
                  style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                >
                  {(() => {
                    const langOnlines = ONLINE_VOICES.filter(v => v.lang === config.lang);
                    const otherOnlines = ONLINE_VOICES.filter(v => v.lang !== config.lang);

                    const filteredLang = filterOnlineByGender(langOnlines);
                    const filteredOther = filterOnlineByGender(otherOnlines);

                    return (
                      <>
                        <optgroup 
                          label={`--- Głosy AI Cloud dla języka ${selectedLangObj.nativeName} (${selectedLangObj.flag}) ---`}
                          style={{ backgroundColor: '#0f172a', color: '#f59e0b', fontWeight: 'bold' }}
                        >
                          {filteredLang.map((v) => (
                            <option 
                              key={v.id} 
                              value={v.id}
                              style={{ backgroundColor: '#1e293b', color: '#ffffff' }}
                            >
                              {v.gender === 'female' ? '👩' : '👨'} {v.name} [{v.gender === 'female' ? 'Głos Żeński ♀' : 'Głos Męski ♂'}] ({v.provider})
                            </option>
                          ))}
                        </optgroup>

                        <optgroup 
                          label="--- Pozostałe głosy AI Cloud (Inne Języki) ---"
                          style={{ backgroundColor: '#0f172a', color: '#f59e0b', fontWeight: 'bold' }}
                        >
                          {filteredOther.map((v) => (
                            <option 
                              key={v.id} 
                              value={v.id}
                              style={{ backgroundColor: '#1e293b', color: '#ffffff' }}
                            >
                              {v.gender === 'female' ? '👩' : '👨'} {v.name} [{v.gender === 'female' ? 'Głos Żeński ♀' : 'Głos Męski ♂'}] ({v.provider})
                            </option>
                          ))}
                        </optgroup>
                      </>
                    );
                  })()}
                </select>

                {/* VISUAL VOICE SELECTION CARDS FOR ONLINE MODE */}
                <div>
                  <span className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-2">
                    Szybki wybór lektora AI Cloud (Karty z opisem):
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(filteredLangOnlineVoices.length > 0 ? filteredLangOnlineVoices : filterOnlineByGender(ONLINE_VOICES)).map((v) => {
                      const isSelected = config.onlineVoiceId === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            const updated: LectorConfig = {
                              ...config,
                              onlineVoiceId: v.id,
                              gender: v.gender,
                              lang: v.lang
                            };
                            setConfig(updated);
                            saveLectorConfig(updated);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-start justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-500 text-amber-950 dark:text-amber-100 font-bold shadow-md ring-1 ring-amber-500'
                              : 'bg-stone-50 dark:bg-[#0c121e] border-stone-200 dark:border-stone-800 hover:border-amber-500/40 text-stone-800 dark:text-stone-200'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="text-xl mt-0.5">{v.gender === 'female' ? '👩' : '👨'}</span>
                            <div className="min-w-0">
                              <div className="font-bold text-xs flex items-center gap-1.5 flex-wrap">
                                <span>{v.name}</span>
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-amber-600 text-white font-sans-ui">
                                  {v.gender === 'female' ? 'Żeński ♀' : 'Męski ♂'}
                                </span>
                              </div>
                              <p className="text-[10px] text-stone-600 dark:text-stone-400 mt-1 leading-normal font-normal">
                                {v.description}
                              </p>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* 4. TRYB SERYJNY (CZYTANIE CIĄGŁE W TLE I EKRAN BLOKADY) */}
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎧</span>
                <span className="font-bold text-stone-900 dark:text-amber-200 text-sm">
                  Czytanie Seryjne (Ciągłe Pętle & Praca w Tle)
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={getSerialLectorState().autoNext}
                  onChange={(e) => {
                    saveSerialLectorState({ autoNext: e.target.checked });
                    setTestStatus(e.target.checked ? 'Włączono czytanie seryjne (automatyczne przechodzenie z dnia na dzień)' : 'Wyłączono czytanie seryjne');
                    setTimeout(() => setTestStatus(null), 2500);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 dark:bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
            <p className="text-[11px] opacity-90 text-stone-700 dark:text-stone-300 leading-relaxed font-normal">
              Po ukończeniu czytania danej strony, lektor automatycznie załaduje i odczyta kolejny dzień. Dzięki integracji z <strong>Media Session API</strong>, lektor czyta <strong>nawet po uśpieniu smartfona lub zminimalizowaniu okna przeglądarki</strong>!
            </p>
          </div>

          {/* 5. REGULACJA TEMPA, TONU I GŁOŚNOŚCI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-white dark:bg-[#131c2e] border border-stone-200 dark:border-stone-800">
            <div>
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1 flex items-center justify-between">
                <span>Prędkość Mowy</span>
                <span className="font-mono text-amber-600 font-bold">{config.rate}x</span>
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
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1 flex items-center justify-between">
                <span>Ton Mowy (Pitch)</span>
                <span className="font-mono text-amber-600 font-bold">{config.pitch}</span>
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
              <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1 flex items-center justify-between">
                <span>Głośność</span>
                <span className="font-mono text-amber-600 font-bold">{Math.round(config.volume * 100)}%</span>
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
            onClick={() => {
              unlockMobileAudio();
              handleTestSpeech();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              unlockMobileAudio();
              handleTestSpeech();
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 text-white font-bold flex items-center gap-2 cursor-pointer shadow-md transition-colors touch-manipulation hover:brightness-110"
          >
            {isPlayingTest ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white translate-x-0.5" />}
            <span>{isPlayingTest ? 'Zatrzymaj Odsłuch' : '🔊 Przetestuj Głos Lektora'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                stopLectorSpeech();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold cursor-pointer"
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
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 shadow-lg cursor-pointer"
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
