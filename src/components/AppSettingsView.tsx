import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Sparkles,
  Layers,
  Settings,
  Sun,
  Moon,
  Laptop,
  Apple,
  Share2,
  PlusSquare,
  QrCode,
  ShieldCheck,
  Globe,
  RefreshCw,
  HardDrive,
  Volume2,
  Type,
  Maximize2,
  ExternalLink,
  ChevronRight,
  Info,
  Check,
  Copy
} from 'lucide-react';
import { AppTheme, SectionMeta } from '../types';
import { QrImageDisplay } from './QrImageDisplay';
import { getLectorConfig, saveLectorConfig, playLectorSpeech, stopLectorSpeech } from '../utils/audioLectorService';

interface AppSettingsViewProps {
  theme: AppTheme;
  onToggleTheme: () => void;
  currentLang: string;
  onNavigateSection?: (sectionId: string) => void;
  onOpenLectorModal?: () => void;
}

export const AppSettingsView: React.FC<AppSettingsViewProps> = ({
  theme,
  onToggleTheme,
  currentLang,
  onNavigateSection,
  onOpenLectorModal
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'android' | 'ios' | 'pwa' | 'desktop' | 'reader' | 'about'>('all');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<string>('Sprawdzanie pamięci podręcznej...');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Reader Settings State stored in localStorage
  const [readerFontSize, setReaderFontSize] = useState<'compact' | 'normal' | 'large' | 'xlarge'>(() => {
    try {
      return (localStorage.getItem('drogowskazy_reader_font_size') as any) || 'normal';
    } catch {
      return 'normal';
    }
  });

  const [readerFontFamily, setReaderFontFamily] = useState<'serif' | 'sans'>(() => {
    try {
      return (localStorage.getItem('drogowskazy_reader_font_family') as any) || 'serif';
    } catch {
      return 'serif';
    }
  });

  const [lectorSpeed, setLectorSpeed] = useState<number>(() => {
    try {
      return getLectorConfig().rate || 1.0;
    } catch {
      return 1.0;
    }
  });

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    // Check Cache API
    if ('caches' in window) {
      caches.keys().then(keys => {
        setCacheStatus(`Pamięć podręczna PWA aktywna (${keys.length} ${keys.length === 1 ? 'magazyn' : 'magazyny'} zasobów offline)`);
      }).catch(() => {
        setCacheStatus('Pamięć podręczna przeglądarki gotowa');
      });
    } else {
      setCacheStatus('Pamięć podręczna offline obsługiwana przez przeglądarkę');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) {
      alert('Aplikacja może być zainstalowana za pomocą menu przeglądarki (np. "Zainstaluj aplikację" lub "Dodaj do ekranu początkowego").');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsStandalone(true);
    }
    setDeferredPrompt(null);
  };

  const handleFontSizeChange = (size: 'compact' | 'normal' | 'large' | 'xlarge') => {
    setReaderFontSize(size);
    try {
      localStorage.setItem('drogowskazy_reader_font_size', size);
      window.dispatchEvent(new CustomEvent('drogowskazy_reader_font_size_changed', { detail: size }));
    } catch {}
  };

  const handleFontFamilyChange = (font: 'serif' | 'sans') => {
    setReaderFontFamily(font);
    try {
      localStorage.setItem('drogowskazy_reader_font_family', font);
      window.dispatchEvent(new CustomEvent('drogowskazy_reader_font_family_changed', { detail: font }));
    } catch {}
  };

  const handleLectorSpeedChange = (speed: number) => {
    setLectorSpeed(speed);
    const cfg = getLectorConfig();
    cfg.rate = speed;
    saveLectorConfig(cfg);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(label);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleClearCacheAndReload = async () => {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.update();
      }
    }
    window.location.reload();
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://widokinaraj.pl';
  const apkUrl = `${currentOrigin}/downloads/rozaniec-historii-zbawienia.apk`;
  const aabUrl = `${currentOrigin}/downloads/rozaniec-historii-zbawienia.aab`;
  const apkZipUrl = `${currentOrigin}/downloads/Rozaniec-HZ-Android-APK.zip`;
  const aabZipUrl = `${currentOrigin}/downloads/Rozaniec-HZ-GooglePlay-AAB.zip`;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
      
      {/* 1. Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#0284c7]/20 text-white p-6 sm:p-10 border border-sky-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                <span>Natywne wersje mobilne & PWA</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>widokinaraj.pl</span>
              </span>
              {isStandalone && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Tryb aplikacji natywnej aktywny
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-heading-cinzel font-bold text-white tracking-wide leading-tight">
              Ustawienia aplikacji i instalacja
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans-ui">
              Zainstaluj Droga365 / Widoki na Raj na telefonie z systemem <strong>Android</strong> (plik APK / AAB), <strong>Apple iPhone / iPad</strong> (iOS Web Clip / IPA), <strong>komputerze PC / Mac</strong> oraz korzystaj w 100% offline jako Progresywna Aplikacja Internetowa (PWA).
            </p>
          </div>

          {/* Quick Install PWA Button on Header */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 w-full md:w-auto">
            {deferredPrompt && !isStandalone && (
              <button
                onClick={handleInstallPwa}
                id="btn-settings-install-pwa"
                className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Zainstaluj PWA na tym urządzeniu</span>
              </button>
            )}
            <a
              href="/downloads/rozaniec-historii-zbawienia.apk"
              download="rozaniec-historii-zbawienia.apk"
              className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer backdrop-blur-xs"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Pobierz Android APK (149 KB)</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Responsive Navigation Tabs (Mobile-Friendly Pill Carousel) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-stone-200 dark:border-stone-800">
        {[
          { id: 'all', label: 'Wszystkie opcje', icon: Layers },
          { id: 'android', label: 'Android (APK / AAB)', icon: Smartphone },
          { id: 'ios', label: 'Apple iOS (iPhone / iPad)', icon: Apple },
          { id: 'pwa', label: 'Progresywna PWA (Offline)', icon: Sparkles },
          { id: 'desktop', label: 'Komputer (Windows / Mac)', icon: Laptop },
          { id: 'reader', label: 'Wygląd, czytnik & lektor', icon: Settings },
          { id: 'about', label: 'Domena & Informacje', icon: Globe }
        ].map(tab => {
          const TabIcon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-sky-600 dark:bg-sky-500 text-white shadow-md shadow-sky-600/20'
                  : 'bg-white dark:bg-[#111722] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#1a2334] border border-stone-200 dark:border-stone-800'
              }`}
            >
              <TabIcon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Section: Android Native Applications */}
      {(activeTab === 'all' || activeTab === 'android') && (
        <section className="space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-heading-cinzel text-stone-900 dark:text-stone-100">
                Wersja mobilna na Android (APK & AAB)
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                Pobierz oficjalny pakiet instalacyjny dla smartfonów i tabletów z systemem Android.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: APK Direct */}
            <div className="rounded-3xl bg-white dark:bg-[#111722] border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Natywny pakiet APK
                  </span>
                  <span className="text-xs font-mono text-stone-500 dark:text-stone-400">149 KB</span>
                </div>

                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-heading-cinzel">
                  rozaniec-historii-zbawienia.apk
                </h3>

                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-sans-ui">
                  Bezpośredni plik instalacyjny dla urządzeń Android (Samsung Galaxy, Xiaomi, Motorola, Pixel, Realme i inne). Działa niezależnie bez konieczności logowania do sklepu Google Play.
                </p>

                {/* Step-by-step instructions */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#161f2e] border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 space-y-2">
                  <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Instrukcja instalacji krok po kroku:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>Kliknij przycisk <strong>„Pobierz plik APK”</strong> poniżej.</li>
                    <li>Po pobraniu otwórz plik z paska powiadomień lub folderu <em>Pobrane</em>.</li>
                    <li>Jeśli telefon zapyta, zezwól przeglądarce na <em>„Instalowanie z tego źródła”</em>.</li>
                    <li>Kliknij <strong>„Zainstaluj”</strong> i ciesz się pełną aplikacją na ekranie głównym.</li>
                  </ol>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="/downloads/rozaniec-historii-zbawienia.apk"
                    download="rozaniec-historii-zbawienia.apk"
                    className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Pobierz plik APK</span>
                  </a>
                  <a
                    href="/downloads/Rozaniec-HZ-Android-APK.zip"
                    download="Rozaniec-HZ-Android-APK.zip"
                    className="py-3 px-4 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold text-xs transition-colors flex items-center gap-1.5"
                    title="Pobierz w archiwum ZIP"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Paczka ZIP</span>
                  </a>
                </div>

                <button
                  onClick={() => handleCopy(apkUrl, 'apk')}
                  className="w-full py-2 px-3 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink === 'apk' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink === 'apk' ? 'Skopiowano link do schowka!' : 'Kopiuj bezpośredni odnośnik do APK'}</span>
                </button>
              </div>
            </div>

            {/* Card 2: AAB Bundle & QR Code */}
            <div className="rounded-3xl bg-white dark:bg-[#111722] border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                    Google Play Bundle (AAB)
                  </span>
                  <span className="text-xs font-mono text-stone-500 dark:text-stone-400">145 KB</span>
                </div>

                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-heading-cinzel">
                  rozaniec-historii-zbawienia.aab
                </h3>

                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-sans-ui">
                  Oficjalny pakiet Android App Bundle zoptymalizowany dla Google Play Console, zapewniający automatyczne dopasowanie do architektury procesora (ARM64, ARMv7, x86_64).
                </p>

                {/* QR Code for phone scan */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#161f2e] border border-stone-200 dark:border-stone-800 flex items-center gap-4">
                  <div className="w-20 h-20 bg-white p-1 rounded-xl border border-stone-300 dark:border-stone-700 shadow-xs shrink-0 flex items-center justify-center">
                    <QrImageDisplay text={apkUrl} title="Zeskanuj telefonem aby pobrać APK" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-sky-500" />
                      <span>Szybkie pobieranie telefonem</span>
                    </div>
                    <p className="text-stone-600 dark:text-stone-400 text-[11px]">
                      Zeskanuj aparat telefonu ten kod QR, aby natychmiast rozpocząć pobieranie pliku instalacyjnego na smartfonie.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="/downloads/rozaniec-historii-zbawienia.aab"
                    download="rozaniec-historii-zbawienia.aab"
                    className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Pobierz pakiet AAB</span>
                  </a>
                  <a
                    href="/downloads/Rozaniec-HZ-GooglePlay-AAB.zip"
                    download="Rozaniec-HZ-GooglePlay-AAB.zip"
                    className="py-3 px-4 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold text-xs transition-colors flex items-center gap-1.5"
                    title="Pobierz w archiwum ZIP"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Paczka ZIP</span>
                  </a>
                </div>

                <button
                  onClick={() => handleCopy(aabUrl, 'aab')}
                  className="w-full py-2 px-3 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink === 'aab' ? <Check className="w-3.5 h-3.5 text-blue-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink === 'aab' ? 'Skopiowano link do schowka!' : 'Kopiuj bezpośredni odnośnik do AAB'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Section: Apple iOS (iPhone & iPad) */}
      {(activeTab === 'all' || activeTab === 'ios') && (
        <section className="space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Apple className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-heading-cinzel text-stone-900 dark:text-stone-100">
                Apple iOS (iPhone & iPad) & Wersja IPA
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                Pełnoekranowa aplikacja na systemy iOS i iPadOS bez konieczności pobierania z App Store.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* iOS Web Clip / PWA (Most Reliable on Apple) */}
            <div className="rounded-3xl bg-white dark:bg-[#111722] border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                  Rekomendowana instalacja iOS
                </span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">100% zgodności</span>
              </div>

              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-heading-cinzel">
                Dodaj do ekranu początkowego (iOS Safari)
              </h3>

              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-sans-ui">
                System iOS firmy Apple oferuje pełne natywne wsparcie dla aplikacji webowych uruchamianych w trybie <em>standalone</em>. Po dodaniu ikony do ekranu początkowego aplikacja zachowuje się jak natywna aplikacja ze sklepu: nie ma pasków adresu Safari, działa w trybie pełnoekranowym i ładuje treść z pamięci podręcznej.
              </p>

              {/* Step cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-[#161f2e] border border-stone-200 dark:border-stone-800 space-y-2 text-center">
                  <div className="w-8 h-8 mx-auto rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div className="font-bold text-xs text-stone-900 dark:text-stone-100">Otwórz w Safari</div>
                  <div className="text-[11px] text-stone-600 dark:text-stone-400">Odwiedź <strong>widokinaraj.pl</strong> w domyślnej przeglądarce Safari.</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-[#161f2e] border border-stone-200 dark:border-stone-800 space-y-2 text-center">
                  <div className="w-8 h-8 mx-auto rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-xs text-stone-900 dark:text-stone-100">Kliknij „Udostępnij”</div>
                  <div className="text-[11px] text-stone-600 dark:text-stone-400">Stuknij kwadrat ze strzałką na dolnym pasku Safari.</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-[#161f2e] border border-stone-200 dark:border-stone-800 space-y-2 text-center">
                  <div className="w-8 h-8 mx-auto rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-xs text-stone-900 dark:text-stone-100">Do ekranu początkowego</div>
                  <div className="text-[11px] text-stone-600 dark:text-stone-400">Wybierz opcję i kliknij „Dodaj” w prawym górnym rogu.</div>
                </div>
              </div>
            </div>

            {/* iOS Package (IPA) & AltStore/Sideloadly Details */}
            <div className="rounded-3xl bg-white dark:bg-[#111722] border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-300 border border-stone-300 dark:border-stone-700">
                    Pakiet natywny IPA (iOS)
                  </span>
                  <span className="text-xs font-mono text-stone-500 dark:text-stone-400">Format .ipa</span>
                </div>

                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-heading-cinzel">
                  Instalacja pakietu IPA na iPhone / iPad
                </h3>

                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-sans-ui">
                  Pakiet aplikacji iOS (.ipa) przeznaczony do bezpośredniej instalacji na urządzeniach z systemem iOS przy użyciu narzędzi takich jak <strong>AltStore</strong>, <strong>Sideloadly</strong>, <strong>TrollStore</strong> lub profilu deweloperskiego Apple ID.
                </p>

                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-[#161f2e] border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 space-y-2">
                  <div className="font-bold text-stone-900 dark:text-stone-100">Wspierane metody instalacji IPA:</div>
                  <ul className="space-y-1 list-disc list-inside pl-1 text-[11px]">
                    <li><strong>AltStore / AltServer:</strong> instalacja przez bezpłatne konto Apple ID bez jailbreak.</li>
                    <li><strong>Sideloadly (PC / Mac):</strong> bezpośrednie wgranie przez kabel USB lub Wi-Fi.</li>
                    <li><strong>TestFlight / Profile Enterprise:</strong> instalacja w ramach dystrybucji wewnętrznej.</li>
                  </ul>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleCopy('https://widokinaraj.pl', 'ios-url')}
                  className="w-full py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Apple className="w-4 h-4" />
                  <span>{copiedLink === 'ios-url' ? 'Skopiowano adres do wklejenia w Safari!' : 'Kopiuj link do instalacji w Safari'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. Section: Progressive Web App (PWA) & Offline Capabilities */}
      {(activeTab === 'all' || activeTab === 'pwa') && (
        <section className="space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-heading-cinzel text-stone-900 dark:text-stone-100">
                Progresywna Aplikacja Internetowa (PWA)
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                Nowoczesna technologia instalacji działająca na każdym urządzeniu: smartfon, tablet i komputer.
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-white to-sky-50/50 dark:from-[#111722] dark:to-[#0c1626] border border-sky-500/20 dark:border-sky-500/30 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#161f2e] border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-xs">
                  <HardDrive className="w-4 h-4" />
                  <span>Działa w 100% Offline</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Dzięki Service Workerowi treść wpisów, modlitw i e-booków jest dostępna nawet w samolocie lub w podróży bez zasięgu Internetu.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#161f2e] border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Brak aktualizacji w sklepach</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Nowe rozdziały i poprawki są synchronizowane natychmiast po połączeniu z Internetem przez Cloudflare Pages.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#161f2e] border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                  <Maximize2 className="w-4 h-4" />
                  <span>Pełny ekran bez ramek</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Aplikacja uruchamia się w dedykowanym oknie pozbawionym pasków adresu URL i przycisków nawigacyjnych przeglądarki.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
              <div className="space-y-0.5 text-xs text-sky-900 dark:text-sky-200">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Status Service Workera & Cache:</span>
                </div>
                <p className="text-sky-800/80 dark:text-sky-300/80">{cacheStatus}</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleClearCacheAndReload}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white dark:bg-[#1a2333] hover:bg-stone-100 dark:hover:bg-[#232e42] border border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Wyczyść pamięć podręczną i zaktualizuj do najnowszej wersji z serwera"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Wymuś odświeżenie cache</span>
                </button>

                {deferredPrompt && (
                  <button
                    onClick={handleInstallPwa}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Zainstaluj PWA</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. Section: Appearance, Reader Customization & Audio Settings */}
      {(activeTab === 'all' || activeTab === 'reader') && (
        <section className="space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-heading-cinzel text-stone-900 dark:text-stone-100">
                Personalizacja wyglądu, czytnika & audio
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                Dostosuj aplikację do własnego komfortu na smartfonie, tablecie lub komputerze.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visual Theme Card */}
            <div className="rounded-3xl bg-white dark:bg-[#111722] border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-heading-cinzel flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Motyw graficzny (Jasny / Ciemny)</span>
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Dobierz kolorystykę przyjazną dla oczu w dzień oraz podczas wieczornej lektury.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { if (theme !== 'light') onToggleTheme(); }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    theme === 'light'
                      ? 'bg-[#fbf7f0] border-amber-500 ring-2 ring-amber-500/30 shadow-md text-stone-900'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Sun className="w-5 h-5 text-amber-600" />
                    {theme === 'light' && <Check className="w-4 h-4 text-amber-600" />}
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm">Jasny pergamin</div>
                    <div className="text-[11px] text-stone-500">Ciepła barwa papieru</div>
                  </div>
                </button>

                <button
                  onClick={() => { if (theme !== 'dark') onToggleTheme(); }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    theme === 'dark'
                      ? 'bg-[#0f172a] border-sky-500 ring-2 ring-sky-500/30 shadow-md text-white'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Moon className="w-5 h-5 text-sky-400" />
                    {theme === 'dark' && <Check className="w-4 h-4 text-sky-400" />}
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm">Ciemny onyks</div>
                    <div className="text-[11px] text-stone-400">Maksymalny kontrast nocny</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Font Size & Reader Settings */}
            <div className="rounded-3xl bg-white dark:bg-[#111722] border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-heading-cinzel flex items-center gap-2">
                  <Type className="w-4 h-4 text-amber-500" />
                  <span>Rozmiar czcionki czytnika</span>
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Dopasuj wielkość liter do wielkości ekranu Twojego smartfona lub tabletu.
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'compact', label: '12pt', desc: 'Mała' },
                  { id: 'normal', label: '14pt', desc: 'Średnia' },
                  { id: 'large', label: '16pt', desc: 'Duża' },
                  { id: 'xlarge', label: '18pt', desc: 'Bardzo duża' }
                ].map(item => {
                  const isSelected = readerFontSize === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleFontSizeChange(item.id as any)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-600 dark:bg-amber-500 text-white font-bold border-amber-600 shadow-sm'
                          : 'bg-stone-50 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <div className="text-sm font-bold">{item.label}</div>
                      <div className="text-[10px] opacity-80">{item.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Reader font family choice */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-stone-800 dark:text-stone-200">Krój pisma:</div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleFontFamilyChange('serif')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      readerFontFamily === 'serif'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-950 dark:text-amber-200 font-bold'
                        : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <div className="font-serif-book text-sm">Times New Roman</div>
                    <div className="text-[10px] text-stone-500 font-sans-ui">Klasyczny książkowy</div>
                  </button>

                  <button
                    onClick={() => handleFontFamilyChange('sans')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      readerFontFamily === 'sans'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-950 dark:text-amber-200 font-bold'
                        : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <div className="font-sans-ui text-sm font-semibold">Plus Jakarta Sans</div>
                    <div className="text-[10px] text-stone-500 font-sans-ui">Nowoczesny bezszeryfowy</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Audio Lector Settings Card */}
            <div className="rounded-3xl bg-white dark:bg-[#111722] border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm space-y-6 md:col-span-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-heading-cinzel flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-500" />
                    <span>Lektor mowy i synteza głosu (Audio AI)</span>
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    Odsłuchuj codzienne wpisy, tajemnice różańcowe i czytania biblijne za pomocą syntezatora mowy.
                  </p>
                </div>

                {onOpenLectorModal && (
                  <button
                    onClick={onOpenLectorModal}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <span>Zaawansowane opcje lektora</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                  { rate: 0.85, label: '0.85x', desc: 'Spokojne tempo modlitwy' },
                  { rate: 1.0, label: '1.0x', desc: 'Standardowe tempo' },
                  { rate: 1.15, label: '1.15x', desc: 'Lekko przyspieszone' },
                  { rate: 1.3, label: '1.3x', desc: 'Szybkie czytanie' }
                ].map(item => {
                  const isSelected = Math.abs(lectorSpeed - item.rate) < 0.05;
                  return (
                    <button
                      key={item.rate}
                      onClick={() => handleLectorSpeedChange(item.rate)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-600 dark:bg-amber-500 text-white font-bold border-amber-600 shadow-sm'
                          : 'bg-stone-50 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <div className="text-sm font-bold">{item.label}</div>
                      <div className="text-[10px] opacity-80">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 7. Section: Production Domains & Official Info */}
      {(activeTab === 'all' || activeTab === 'about') && (
        <section className="rounded-3xl bg-stone-100 dark:bg-[#111722] border border-stone-200 dark:border-stone-800 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-heading-cinzel text-stone-900 dark:text-stone-100">
                Informacje o domenie i architekturze
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                Oficjalne adresy domenowe wdrożone w chmurze Cloudflare Pages.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#161f2e] border border-stone-200 dark:border-stone-800 space-y-2">
              <div className="font-bold text-stone-900 dark:text-stone-100 font-sans-ui flex items-center justify-between">
                <span>Główna domena produkcyjna:</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">PROD</span>
              </div>
              <div className="text-sky-600 dark:text-sky-400 font-bold break-all">https://widokinaraj.pl</div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 font-sans-ui">
                Dedykowana domena z certyfikatem SSL i globalnym routingiem Cloudflare Edge.
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#161f2e] border border-stone-200 dark:border-stone-800 space-y-2">
              <div className="font-bold text-stone-900 dark:text-stone-100 font-sans-ui flex items-center justify-between">
                <span>Aliasy Cloudflare Pages:</span>
                <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 text-[10px] font-bold">PAGES</span>
              </div>
              <div className="text-stone-700 dark:text-stone-300 break-all">
                wnr365.pages.dev • embik365.pages.dev • viewsofparadise.pl
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 font-sans-ui">
                Automatyczna replikacja i obsługa wieloplatformowa mobile-first.
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
};
