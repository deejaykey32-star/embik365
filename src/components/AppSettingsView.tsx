import React, { useState, useEffect, useMemo } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Sun,
  Moon,
  Laptop,
  Apple,
  Share,
  PlusSquare,
  QrCode,
  Globe,
  RefreshCw,
  HardDrive,
  Volume2,
  Type,
  ChevronRight,
  Check,
  Copy,
  MonitorSmartphone,
  Package,
  Info,
  Trash2,
  Wifi,
  WifiOff,
  Tablet,
  MoreVertical
} from 'lucide-react';
import { AppTheme, AppThemeMode } from '../types';
import { QrImageDisplay } from './QrImageDisplay';
import { getLectorConfig, saveLectorConfig } from '../utils/audioLectorService';

interface AppSettingsViewProps {
  theme: AppTheme;
  themeMode: AppThemeMode;
  onChangeThemeMode: (mode: AppThemeMode) => void;
  currentLang: string;
  onNavigateSection?: (sectionId: string) => void;
  onOpenLectorModal?: () => void;
}

type Platform = 'android' | 'ios' | 'desktop';
type TabId = 'install' | 'appearance' | 'offline' | 'about';

// Pakiety instalacyjne publikowane w /public/downloads (budowane z katalogu /android-twa)
const APP_PACKAGES = {
  apk: { href: '/downloads/droga365.apk', name: 'droga365.apk', size: '320 KB' },
  aab: { href: '/downloads/droga365.aab', name: 'droga365.aab', size: '336 KB' },
  legacyApk: { href: '/downloads/rozaniec-historii-zbawienia.apk', name: 'rozaniec-historii-zbawienia.apk', size: '149 KB' },
  legacyAab: { href: '/downloads/rozaniec-historii-zbawienia.aab', name: 'rozaniec-historii-zbawienia.aab', size: '145 KB' }
};

const APP_VERSION = '2.0.0';

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/i.test(ua) || isIPadOS) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const SectionTitle: React.FC<{ icon: React.ElementType; title: string; subtitle?: string }> = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-3">
    <span className="w-10 h-10 rounded-xl bg-[var(--c-accent-soft)] ui-accent flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5" />
    </span>
    <div className="min-w-0">
      <h2 className="ui-heading text-lg sm:text-xl leading-tight">{title}</h2>
      {subtitle && <p className="text-sm ui-muted mt-1 leading-snug">{subtitle}</p>}
    </div>
  </div>
);

const Step: React.FC<{ n: React.ReactNode; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <li className="flex gap-3">
    <span className="w-7 h-7 rounded-lg bg-[var(--c-accent-soft)] ui-accent text-xs font-bold flex items-center justify-center shrink-0">{n}</span>
    <div className="min-w-0 text-sm">
      <div className="font-semibold text-[var(--c-text)]">{title}</div>
      <div className="ui-muted leading-snug">{children}</div>
    </div>
  </li>
);

export const AppSettingsView: React.FC<AppSettingsViewProps> = ({
  theme,
  themeMode,
  onChangeThemeMode,
  onOpenLectorModal
}) => {
  const platform = useMemo(detectPlatform, []);
  const [activeTab, setActiveTab] = useState<TabId>('install');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [swState, setSwState] = useState<'checking' | 'active' | 'none' | 'unsupported'>('checking');
  const [cacheCount, setCacheCount] = useState<number | null>(null);
  const [storageUsage, setStorageUsage] = useState<{ usage: number; quota: number } | null>(null);
  const [isPersisted, setIsPersisted] = useState<boolean | null>(null);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

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

  const refreshStorageInfo = async () => {
    try {
      if ('caches' in window) setCacheCount((await caches.keys()).length);
      if (navigator.storage?.estimate) {
        const est = await navigator.storage.estimate();
        setStorageUsage({ usage: est.usage || 0, quota: est.quota || 0 });
      }
      if (navigator.storage?.persisted) setIsPersisted(await navigator.storage.persisted());
    } catch {}
  };

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => setSwState(reg?.active ? 'active' : 'none')).catch(() => setSwState('none'));
    } else {
      setSwState('unsupported');
    }
    refreshStorageInfo();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) {
      setActiveTab('install');
      document.getElementById('install-instructions')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsStandalone(true);
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

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
    setCopied(label);
    setTimeout(() => setCopied(null), 2200);
  };

  const handleShare = async () => {
    const data = { title: 'Droga365 – Widoki na Raj', text: 'Roczny cykl czytań duchowych', url: appUrl };
    if ((navigator as any).share) {
      try {
        await (navigator as any).share(data);
        return;
      } catch {}
    }
    handleCopy(appUrl, 'share');
  };

  const handleCheckUpdate = async () => {
    setUpdateMsg('Sprawdzanie…');
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      await reg?.update();
      setUpdateMsg(reg?.waiting ? 'Dostępna nowa wersja – odśwież aplikację.' : 'Masz najnowszą wersję.');
    } catch {
      setUpdateMsg('Nie udało się sprawdzić aktualizacji (brak połączenia?).');
    }
  };

  const handleRequestPersist = async () => {
    try {
      if (navigator.storage?.persist) setIsPersisted(await navigator.storage.persist());
    } catch {}
  };

  const handleClearCacheAndReload = async () => {
    if (!window.confirm('Wyczyścić pamięć offline i pobrać najnowszą wersję aplikacji? Ustawienia zostaną zachowane.')) return;
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.update().catch(() => undefined)));
    }
    window.location.reload();
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://new.widokinaraj.pl';
  const appUrl = `${origin}/`;
  const apkUrl = `${origin}${APP_PACKAGES.apk.href}`;

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'install', label: 'Instalacja', icon: MonitorSmartphone },
    { id: 'appearance', label: 'Wygląd i czytanie', icon: Type },
    { id: 'offline', label: 'Offline i dane', icon: HardDrive },
    { id: 'about', label: 'Informacje', icon: Info }
  ];

  const platformLabel = platform === 'android' ? 'Android' : platform === 'ios' ? 'iPhone / iPad' : 'komputer';

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">

      {/* Header */}
      <header className="ui-card p-5 sm:p-8 overflow-hidden relative">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[var(--c-accent-soft)] blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="ui-chip"><Smartphone className="w-3.5 h-3.5" /> Android · iOS · PWA · Windows · macOS · Linux</span>
              {isStandalone && <span className="ui-chip !text-emerald-700 dark:!text-emerald-300 !bg-emerald-500/10 !border-emerald-500/30"><CheckCircle2 className="w-3.5 h-3.5" /> Zainstalowano</span>}
            </div>
            <h1 className="ui-heading text-2xl sm:text-3xl lg:text-4xl leading-tight">Aplikacja i ustawienia</h1>
            <p className="ui-text text-sm sm:text-base leading-relaxed max-w-2xl">
              Zainstaluj Droga365 na telefonie, tablecie lub komputerze, korzystaj offline i dopasuj wygląd czytnika do swojego urządzenia.
            </p>
          </div>

          <div className="flex flex-col xs:flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
            {!isStandalone && (
              <button onClick={handleInstallPwa} id="btn-settings-install-pwa" className="ui-btn ui-btn-primary min-h-12 px-5 text-sm flex-1">
                <Download className="w-4 h-4" />
                <span>Zainstaluj na tym urządzeniu</span>
              </button>
            )}
            <button onClick={handleShare} className="ui-btn min-h-12 px-5 text-sm flex-1">
              {copied === 'share' ? <Check className="w-4 h-4 text-emerald-600" /> : <Share className="w-4 h-4 ui-accent" />}
              <span>{copied === 'share' ? 'Skopiowano link' : 'Udostępnij aplikację'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div role="tablist" aria-label="Ustawienia" className="">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar p-1 rounded-2xl bg-[var(--c-surface)] border border-[var(--c-border)]">
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-max flex items-center justify-center gap-2 px-3.5 min-h-10 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selected
                    ? 'bg-[var(--c-card)] text-[var(--c-text)] shadow-sm ring-1 ring-[var(--c-border-strong)]'
                    : 'ui-muted hover:text-[var(--c-text)]'
                }`}
              >
                <TabIcon className={`w-4 h-4 ${selected ? 'ui-accent' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============ INSTALACJA ============ */}
      {activeTab === 'install' && (
        <div className="space-y-6 sm:space-y-8">
          {/* Recommended for the detected device */}
          <section className="ui-card p-5 sm:p-7 border-[var(--c-accent)]/40 space-y-5" id="install-instructions">
            <SectionTitle
              icon={platform === 'ios' ? Apple : platform === 'android' ? Smartphone : Laptop}
              title={`Zalecana instalacja – ${platformLabel}`}
              subtitle="Wykryliśmy Twoje urządzenie. Postępuj zgodnie z krokami poniżej."
            />

            {platform === 'ios' && (
              <ol className="grid gap-4 sm:grid-cols-3">
                <Step n="1" title="Otwórz w Safari">Wejdź na <strong>{origin.replace('https://', '')}</strong> w przeglądarce Safari.</Step>
                <Step n={<Share className="w-3.5 h-3.5" />} title="Stuknij „Udostępnij”">Ikona kwadratu ze strzałką na pasku Safari.</Step>
                <Step n={<PlusSquare className="w-3.5 h-3.5" />} title="„Do ekranu początkowego”">Potwierdź przyciskiem „Dodaj”. Aplikacja otworzy się na pełnym ekranie.</Step>
              </ol>
            )}

            {platform === 'android' && (
              <div className="grid gap-5 md:grid-cols-2">
                <ol className="space-y-4">
                  <Step n="1" title="Zainstaluj z przeglądarki (zalecane)">Stuknij „Zainstaluj na tym urządzeniu” lub w Chrome: menu <MoreVertical className="inline w-3.5 h-3.5" /> → „Zainstaluj aplikację”.</Step>
                  <Step n="2" title="Albo pobierz plik APK">Otwórz pobrany plik i zezwól na instalację z tego źródła.</Step>
                </ol>
                <div className="flex flex-col gap-2">
                  {deferredPrompt && (
                    <button onClick={handleInstallPwa} className="ui-btn ui-btn-primary min-h-12 text-sm">
                      <Download className="w-4 h-4" /> Zainstaluj aplikację (PWA)
                    </button>
                  )}
                  <a href={APP_PACKAGES.apk.href} download={APP_PACKAGES.apk.name} className="ui-btn min-h-12 text-sm">
                    <Package className="w-4 h-4 ui-accent" /> Pobierz APK ({APP_PACKAGES.apk.size})
                  </a>
                </div>
              </div>
            )}

            {platform === 'desktop' && (
              <div className="grid gap-5 md:grid-cols-2">
                <ol className="space-y-4">
                  <Step n="1" title="Chrome, Edge, Opera, Brave">Kliknij „Zainstaluj na tym urządzeniu” lub ikonę instalacji w pasku adresu.</Step>
                  <Step n="2" title="Safari (macOS Sonoma i nowsze)">Menu Plik → „Dodaj do Docka”.</Step>
                  <Step n="3" title="Firefox">Dodaj stronę do zakładek lub użyj Chrome/Edge, aby zainstalować aplikację.</Step>
                </ol>
                <div className="ui-card-muted p-4 flex items-center gap-4">
                  <div className="w-28 h-28 bg-white p-1.5 rounded-xl border border-[var(--c-border)] shrink-0">
                    <QrImageDisplay text={appUrl} title="Zeskanuj, aby otworzyć na telefonie" />
                  </div>
                  <div className="text-sm min-w-0">
                    <div className="font-semibold text-[var(--c-text)] flex items-center gap-1.5"><QrCode className="w-4 h-4 ui-accent" /> Na telefon</div>
                    <p className="ui-muted leading-snug mt-1">Zeskanuj kod aparatem, aby otworzyć aplikację na smartfonie lub tablecie.</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* All platforms */}
          <section className="space-y-4">
            <SectionTitle icon={Package} title="Wszystkie wersje i pliki" subtitle="Pakiety natywne oraz Progresywna Aplikacja Internetowa (PWA)." />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {/* Android */}
              <article className="ui-card p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><Smartphone className="w-5 h-5" /></span>
                  <span className="text-[11px] font-bold uppercase tracking-wide ui-muted">APK · AAB</span>
                </div>
                <div>
                  <h3 className="ui-heading text-base">Android</h3>
                  <p className="text-sm ui-muted leading-snug mt-1">Natywna aplikacja (Trusted Web Activity) dla telefonów i tabletów z Androidem 5+.</p>
                </div>
                <div className="mt-auto flex flex-col gap-2">
                  <a href={APP_PACKAGES.apk.href} download={APP_PACKAGES.apk.name} className="ui-btn ui-btn-primary">
                    <Download className="w-4 h-4" /> APK · {APP_PACKAGES.apk.size}
                  </a>
                  <a href={APP_PACKAGES.aab.href} download={APP_PACKAGES.aab.name} className="ui-btn" title="Android App Bundle do publikacji w Google Play">
                    <Package className="w-4 h-4 ui-accent" /> AAB (Google Play)
                  </a>
                  <button onClick={() => handleCopy(apkUrl, 'apk')} className="ui-btn ui-btn-ghost text-xs">
                    {copied === 'apk' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === 'apk' ? 'Skopiowano' : 'Kopiuj link do APK'}
                  </button>
                </div>
              </article>

              {/* iOS */}
              <article className="ui-card p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-700 dark:text-slate-300 flex items-center justify-center"><Apple className="w-5 h-5" /></span>
                  <span className="text-[11px] font-bold uppercase tracking-wide ui-muted">iPhone · iPad</span>
                </div>
                <div>
                  <h3 className="ui-heading text-base">iOS / iPadOS</h3>
                  <p className="text-sm ui-muted leading-snug mt-1">
                    Safari → „Udostępnij” → „Do ekranu początkowego”. Pełny ekran, praca offline i ikona jak w aplikacji natywnej.
                  </p>
                </div>
                <div className="ui-card-muted p-3 text-xs ui-muted leading-snug">
                  Pakiet <strong>IPA</strong> wymaga podpisu certyfikatem Apple (App Store / TestFlight). Do tego czasu zalecana jest instalacja PWA – działa identycznie.
                </div>
                <div className="mt-auto">
                  <button onClick={() => handleCopy(appUrl, 'ios')} className="ui-btn w-full">
                    {copied === 'ios' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 ui-accent" />}
                    {copied === 'ios' ? 'Skopiowano adres' : 'Kopiuj adres dla Safari'}
                  </button>
                </div>
              </article>

              {/* PWA */}
              <article className="ui-card p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="w-10 h-10 rounded-xl bg-[var(--c-accent-soft)] ui-accent flex items-center justify-center"><MonitorSmartphone className="w-5 h-5" /></span>
                  <span className="text-[11px] font-bold uppercase tracking-wide ui-muted">Każde urządzenie</span>
                </div>
                <div>
                  <h3 className="ui-heading text-base">PWA</h3>
                  <p className="text-sm ui-muted leading-snug mt-1">Instalacja bez sklepu, automatyczne aktualizacje i działanie offline.</p>
                </div>
                <div className="mt-auto">
                  <button onClick={handleInstallPwa} disabled={isStandalone} className="ui-btn ui-btn-primary w-full disabled:opacity-60">
                    {isStandalone ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                    {isStandalone ? 'Zainstalowano' : 'Zainstaluj PWA'}
                  </button>
                </div>
              </article>

              {/* Desktop */}
              <article className="ui-card p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center"><Laptop className="w-5 h-5" /></span>
                  <span className="text-[11px] font-bold uppercase tracking-wide ui-muted">Win · Mac · Linux</span>
                </div>
                <div>
                  <h3 className="ui-heading text-base">Komputer</h3>
                  <p className="text-sm ui-muted leading-snug mt-1">Chrome / Edge: ikona instalacji w pasku adresu. Safari na macOS: Plik → „Dodaj do Docka”.</p>
                </div>
                <div className="mt-auto">
                  <button onClick={handleInstallPwa} disabled={isStandalone} className="ui-btn w-full disabled:opacity-60">
                    <Laptop className="w-4 h-4 ui-accent" /> {isStandalone ? 'Zainstalowano' : 'Zainstaluj na komputerze'}
                  </button>
                </div>
              </article>
            </div>
          </section>

          {/* QR + other packages */}
          <section className="grid gap-4 md:grid-cols-2">
            <div className="ui-card p-5 flex items-center gap-4">
              <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white p-1.5 rounded-xl border border-[var(--c-border)] shrink-0">
                <QrImageDisplay text={apkUrl} title="Zeskanuj, aby pobrać APK" />
              </div>
              <div className="min-w-0 text-sm">
                <h3 className="ui-heading text-base flex items-center gap-2"><QrCode className="w-4 h-4 ui-accent" /> Pobierz telefonem</h3>
                <p className="ui-muted leading-snug mt-1">Zeskanuj kod aparatem telefonu z Androidem, aby od razu pobrać plik APK.</p>
              </div>
            </div>

            <div className="ui-card p-5 space-y-3">
              <h3 className="ui-heading text-base">Inne aplikacje</h3>
              <p className="text-sm ui-muted leading-snug">Różaniec Historii Zbawienia – osobna, lekka aplikacja offline na Androida.</p>
              <div className="flex flex-wrap gap-2">
                <a href={APP_PACKAGES.legacyApk.href} download={APP_PACKAGES.legacyApk.name} className="ui-btn flex-1">
                  <Download className="w-4 h-4 ui-accent" /> APK · {APP_PACKAGES.legacyApk.size}
                </a>
                <a href={APP_PACKAGES.legacyAab.href} download={APP_PACKAGES.legacyAab.name} className="ui-btn flex-1">
                  <Package className="w-4 h-4 ui-accent" /> AAB · {APP_PACKAGES.legacyAab.size}
                </a>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ============ WYGLĄD ============ */}
      {activeTab === 'appearance' && (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          <section className="ui-card p-5 sm:p-6 space-y-4">
            <SectionTitle icon={theme === 'dark' ? Moon : Sun} title="Motyw" subtitle="Jasny w dzień, ciemny wieczorem – lub automatycznie wg systemu." />
            <div className="ui-segment grid-cols-3" role="radiogroup" aria-label="Motyw">
              {([
                { id: 'light', label: 'Jasny', icon: Sun },
                { id: 'dark', label: 'Ciemny', icon: Moon },
                { id: 'system', label: 'Systemowy', icon: MonitorSmartphone }
              ] as const).map(opt => (
                <button
                  key={opt.id}
                  role="radio"
                  aria-checked={themeMode === opt.id}
                  onClick={() => onChangeThemeMode(opt.id)}
                  className="ui-option flex flex-col items-center justify-center gap-1.5 text-center"
                >
                  <opt.icon className="w-5 h-5 ui-accent" />
                  <span className="text-sm font-semibold">{opt.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="ui-card p-5 sm:p-6 space-y-4">
            <SectionTitle icon={Type} title="Czcionka czytnika" subtitle="Rozmiar i krój tekstu we wpisach, modlitwach i czytaniach." />
            <div className="ui-segment grid-cols-4" role="radiogroup" aria-label="Rozmiar czcionki">
              {([
                { id: 'compact', label: 'A', size: 'text-sm', desc: 'Mała' },
                { id: 'normal', label: 'A', size: 'text-base', desc: 'Średnia' },
                { id: 'large', label: 'A', size: 'text-lg', desc: 'Duża' },
                { id: 'xlarge', label: 'A', size: 'text-xl', desc: 'B. duża' }
              ] as const).map(item => (
                <button
                  key={item.id}
                  role="radio"
                  aria-checked={readerFontSize === item.id}
                  onClick={() => handleFontSizeChange(item.id)}
                  className="ui-option flex flex-col items-center justify-center text-center px-1"
                >
                  <span className={`${item.size} font-bold font-serif-book leading-none`}>{item.label}</span>
                  <span className="text-[11px] ui-muted mt-1">{item.desc}</span>
                </button>
              ))}
            </div>
            <div className="ui-segment grid-cols-2" role="radiogroup" aria-label="Krój pisma">
              <button role="radio" aria-checked={readerFontFamily === 'serif'} onClick={() => handleFontFamilyChange('serif')} className="ui-option">
                <div className="font-serif-book text-base">Szeryfowy</div>
                <div className="text-[11px] ui-muted">Times New Roman – książkowy</div>
              </button>
              <button role="radio" aria-checked={readerFontFamily === 'sans'} onClick={() => handleFontFamilyChange('sans')} className="ui-option">
                <div className="font-sans-ui text-base font-semibold">Bezszeryfowy</div>
                <div className="text-[11px] ui-muted">Plus Jakarta Sans – ekranowy</div>
              </button>
            </div>
          </section>

          <section className="ui-card p-5 sm:p-6 space-y-4 md:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <SectionTitle icon={Volume2} title="Lektor" subtitle="Tempo czytania wpisów, tajemnic i czytań biblijnych." />
              {onOpenLectorModal && (
                <button onClick={onOpenLectorModal} className="ui-btn shrink-0">
                  Wybór głosu i opcje <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="ui-segment grid-cols-2 sm:grid-cols-4" role="radiogroup" aria-label="Tempo lektora">
              {[
                { rate: 0.85, label: '0,85×', desc: 'Spokojne' },
                { rate: 1.0, label: '1×', desc: 'Standardowe' },
                { rate: 1.15, label: '1,15×', desc: 'Szybsze' },
                { rate: 1.3, label: '1,3×', desc: 'Szybkie' }
              ].map(item => (
                <button
                  key={item.rate}
                  role="radio"
                  aria-checked={Math.abs(lectorSpeed - item.rate) < 0.05}
                  onClick={() => handleLectorSpeedChange(item.rate)}
                  className="ui-option text-center"
                >
                  <div className="text-base font-bold">{item.label}</div>
                  <div className="text-[11px] ui-muted">{item.desc}</div>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ============ OFFLINE ============ */}
      {activeTab === 'offline' && (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          <section className="ui-card p-5 sm:p-6 space-y-4">
            <SectionTitle icon={isOnline ? Wifi : WifiOff} title="Stan aplikacji" />
            <dl className="divide-y divide-[var(--c-border)] text-sm">
              {[
                ['Połączenie', isOnline ? 'Online' : 'Offline – dane z pamięci urządzenia'],
                ['Tryb', isStandalone ? 'Zainstalowana aplikacja' : 'Przeglądarka'],
                ['Service Worker', swState === 'active' ? 'Aktywny' : swState === 'checking' ? 'Sprawdzanie…' : swState === 'unsupported' ? 'Nieobsługiwany' : 'Nieaktywny'],
                ['Magazyny offline', cacheCount === null ? '—' : String(cacheCount)],
                ['Zajęte miejsce', storageUsage ? `${formatBytes(storageUsage.usage)} z ${formatBytes(storageUsage.quota)}` : '—'],
                ['Trwałe dane', isPersisted === null ? '—' : isPersisted ? 'Tak' : 'Nie']
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="ui-muted">{k}</dt>
                  <dd className="font-semibold text-[var(--c-text)] text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="ui-card p-5 sm:p-6 space-y-4">
            <SectionTitle icon={RefreshCw} title="Aktualizacje i pamięć" subtitle="Aplikacja aktualizuje się automatycznie po połączeniu z internetem." />
            <div className="flex flex-col gap-2">
              <button onClick={handleCheckUpdate} className="ui-btn">
                <RefreshCw className="w-4 h-4 ui-accent" /> Sprawdź aktualizacje
              </button>
              {isPersisted === false && (
                <button onClick={handleRequestPersist} className="ui-btn">
                  <HardDrive className="w-4 h-4 ui-accent" /> Zachowaj dane offline na stałe
                </button>
              )}
              <button onClick={handleClearCacheAndReload} className="ui-btn text-rose-700 dark:text-rose-300 hover:!border-rose-500">
                <Trash2 className="w-4 h-4" /> Wyczyść pamięć offline i odśwież
              </button>
              {updateMsg && <p className="text-sm ui-muted" role="status">{updateMsg}</p>}
            </div>
          </section>
        </div>
      )}

      {/* ============ INFORMACJE ============ */}
      {activeTab === 'about' && (
        <section className="ui-card p-5 sm:p-6 space-y-4">
          <SectionTitle icon={Globe} title="O aplikacji" />
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            {[
              ['Wersja', APP_VERSION],
              ['Adres', origin.replace(/^https?:\/\//, '')],
              ['Domena główna', 'widokinaraj.pl'],
              ['Hosting', 'Cloudflare Pages'],
              ['Obsługiwane urządzenia', 'Smartfony, tablety (pion i poziom), laptopy i komputery'],
              ['Systemy', 'Android, iOS / iPadOS, Windows, macOS, Linux, ChromeOS']
            ].map(([k, v]) => (
              <div key={k} className="ui-card-muted p-3.5">
                <dt className="text-[11px] font-bold uppercase tracking-wide ui-muted">{k}</dt>
                <dd className="font-semibold text-[var(--c-text)] mt-0.5 break-words">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex items-center gap-2 text-xs ui-muted">
            <Tablet className="w-4 h-4" /> Układ dopasowuje się automatycznie do rozmiaru i orientacji ekranu.
          </div>
        </section>
      )}
    </div>
  );
};
