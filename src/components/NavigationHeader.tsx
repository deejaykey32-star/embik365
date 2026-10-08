import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  ShieldCheck, 
  LogIn, 
  Sparkles, 
  Sun, 
  Moon,
  GitBranch,
  Download,
  Globe,
  Link as LinkIcon,
  Check,
  Search,
  Smartphone,
  Headphones,
  Play,
  Pause
} from 'lucide-react';
import { CycleDate, AdminUser, AppTheme, SUPPORTED_LANGUAGES } from '../types';
import { getUIText } from '../utils/translationService';
import { copyCurrentPageUrl } from '../utils/slugRouter';
import { getSerialLectorState, saveSerialLectorState, stopLectorSpeech } from '../utils/audioLectorService';

interface Props {
  currentDate: CycleDate;
  onPrevDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onOpenCalendar: () => void;
  onOpenSearch?: () => void;
  adminUser: AdminUser | null;
  onOpenAdmin: () => void;
  theme: AppTheme;
  onToggleTheme: () => void;
  githubConnected?: boolean;
  currentLang: string;
  onLanguageChange: (lang: string) => void;
  onOpenDownloadModal: () => void;
  onOpenLectorModal?: () => void;
  onCopyLink?: () => void;
}

export const NavigationHeader: React.FC<Props> = ({
  currentDate,
  onPrevDay,
  onNextDay,
  onToday,
  onOpenCalendar,
  onOpenSearch,
  adminUser,
  onOpenAdmin,
  theme,
  onToggleTheme,
  githubConnected = false,
  currentLang,
  onLanguageChange,
  onOpenDownloadModal,
  onOpenLectorModal,
  onCopyLink
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalledPwa, setIsInstalledPwa] = useState(false);
  const [serialState, setSerialState] = useState(() => getSerialLectorState());

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalledPwa(true);
      setDeferredPrompt(null);
    };

    const handleSerialUpdated = (e: CustomEvent) => {
      if (e.detail) {
        setSerialState(e.detail);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('drogowskazy_serial_lector_updated', handleSerialUpdated as EventListener);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalledPwa(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('drogowskazy_serial_lector_updated', handleSerialUpdated as EventListener);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalledPwa(true);
    }
    setDeferredPrompt(null);
  };

  const handleCopy = async () => {
    if (onCopyLink) {
      onCopyLink();
    } else {
      await copyCurrentPageUrl();
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40 bg-[#fdfbf7]/95 dark:bg-[#0b0f17]/95 backdrop-blur-md border-b border-[#e7ded4] dark:border-[#1e2638] shadow-xs transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between py-2 sm:py-2.5 min-h-[3.75rem] lg:min-h-[4.5rem] gap-2 lg:gap-4">
          
          {/* Logo & App Title: order-1 (Top Left on Mobile, Left on Desktop) */}
          <div className="order-1 flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-linear-to-br from-[#8a5327] to-[#452714] dark:from-amber-600 dark:to-amber-800 text-white flex items-center justify-center shadow-md shadow-[#8a5327]/20 dark:shadow-amber-950/40 border border-[#b47a46]/30 dark:border-amber-500/30 shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#f6d8ae] dark:text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-heading-cinzel font-bold text-base sm:text-2xl text-[#2a221b] dark:text-[#f3e8d2] tracking-wide">
                  Droga365
                </h1>
                <span className="hidden md:inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-[#eee4d6] dark:bg-[#1a2333] text-[#785434] dark:text-amber-300 border border-[#dac7b3] dark:border-[#2a374f]">
                  25 XII - 24 XII
                </span>
                {githubConnected && (
                  <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" title="Zsynchronizowano z GitHub & Cloudflare Pages">
                    <GitBranch className="w-3 h-3" />
                    <span>GitHub Sync</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-[#7e6e5f] dark:text-[#94a3b8] font-sans-ui hidden sm:block leading-none">
                {adminUser ? 'WnR365 • RHZ365 • Biblia365 • Flipbooki • Bio365' : 'WnR365 • RHZ365 • Flipbooki'}
              </p>
            </div>
          </div>

          {/* Right Action Bar: order-2 on mobile (Top Right), order-3 on desktop (Right) */}
          <div className="order-2 lg:order-3 flex items-center gap-1 sm:gap-1.5 lg:gap-2 shrink-0">
            {/* Prominent Search Button (LUPA) - Always fully visible, never clipped! */}
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                id="btn-header-search"
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-[#f0e4d4] hover:bg-[#e6d7c4] dark:bg-[#192232] dark:hover:bg-[#232e42] text-[#4d3d2e] dark:text-amber-300 border border-[#d6c7b5] dark:border-[#2a374f] font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                title="Szukaj frazy we wszystkich tomach lub wybranej sekcji (Skrót: Ctrl+K)"
              >
                <Search className="w-4 h-4 text-[#8a5327] dark:text-amber-400 shrink-0" />
                <span className="font-bold text-xs sm:text-sm">Szukaj</span>
                <kbd className="hidden xl:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-[#0f1522] rounded border border-amber-500/30 text-[#6e5d4e] dark:text-amber-300 ml-1">
                  Ctrl+K
                </kbd>
              </button>
            )}

            {/* Download & Publish Button (Admin only) */}
            {adminUser && (
              <button
                onClick={onOpenDownloadModal}
                id="btn-header-download-pod"
                className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all cursor-pointer shrink-0"
                title="Pobierz E-book (PDF, ePUB, Word DOCX) gotowe do druku POD"
              >
                <Download className="w-4 h-4 text-amber-200 shrink-0" />
                <span>POD</span>
              </button>
            )}

            {/* Audio Lector Settings Button (Local / Online Voices) */}
            {onOpenLectorModal && (
              <button
                onClick={onOpenLectorModal}
                id="btn-lector-settings"
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-[#d6c7b5] dark:border-[#2a374f] bg-white dark:bg-[#161f2e] text-[#4d3d2e] dark:text-amber-300 hover:bg-[#f4ece1] dark:hover:bg-[#212d42] transition-all shadow-xs cursor-pointer text-xs font-semibold shrink-0"
                title="Wybór lektora mowy (Wersja Lokalna & Online AI)"
              >
                <span className="text-sm">🎧</span>
                <span className="hidden xl:inline ml-1">Lektor</span>
              </button>
            )}

            {/* Language Selector Dropdown */}
            <div className="relative shrink-0">
              <label htmlFor="select-app-language" className="sr-only">Wybierz język</label>
              <div className="flex items-center bg-white dark:bg-[#161f2e] border border-[#d6c7b5] dark:border-[#2a374f] rounded-xl px-1.5 sm:px-2 py-1 sm:py-1.5 shadow-xs">
                <span className="text-xs sm:text-sm">{currentLangObj.flag}</span>
                <select
                  id="select-app-language"
                  value={currentLang}
                  onChange={e => onLanguageChange(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-[#3a2e22] dark:text-[#e2e8f0] focus:outline-hidden cursor-pointer ml-0.5"
                  title="Wybierz język aplikacji i tłumaczenia"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code} className="dark:bg-[#161f2e] dark:text-white">
                      {lang.flag} {lang.code.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* PWA Install Button */}
            {deferredPrompt && !isInstalledPwa && (
              <button
                onClick={handleInstallPwa}
                id="btn-install-pwa"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer animate-pulse shrink-0"
                title="Zainstaluj aplikację Droga365 na pulpicie (PWA)"
              >
                <Smartphone className="w-4 h-4 text-amber-200" />
                <span className="hidden md:inline">PWA</span>
              </button>
            )}

            {/* Theme Toggle Button (Light / Dark) */}
            <button
              onClick={onToggleTheme}
              id="btn-theme-toggle"
              className="p-1.5 sm:p-2.5 rounded-xl border border-[#d6c7b5] dark:border-[#2a374f] bg-white dark:bg-[#161f2e] text-[#4d3d2e] dark:text-amber-300 hover:bg-[#f4ece1] dark:hover:bg-[#212d42] transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
              title={theme === 'dark' ? 'Przełącz na jasny motyw' : 'Przełącz na ciemny motyw'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-300 animate-in spin-in-180 duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-[#785434] animate-in spin-in-180 duration-300" />
              )}
            </button>

            {/* Admin / Google Login button */}
            {adminUser ? (
              <button
                onClick={onOpenAdmin}
                id="btn-admin-profile"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-[#2e261f] dark:bg-[#1a2230] text-white hover:bg-[#3f352b] dark:hover:bg-[#242f42] transition-all shadow-sm active:scale-95 border border-[#524436] dark:border-[#334259] cursor-pointer shrink-0"
                title="Profil administratora"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-left hidden xl:block">
                  <div className="text-xs font-semibold leading-tight text-white">Dominik Kuta</div>
                  <div className="text-[10px] text-[#c7b9ab] dark:text-[#94a3b8] leading-none">Admin</div>
                </div>
                <span className="text-xs font-bold text-amber-300 xl:hidden">Admin</span>
              </button>
            ) : (
              <button
                onClick={onOpenAdmin}
                id="btn-login-google"
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white dark:bg-[#161f2e] hover:bg-[#fbf7f1] dark:hover:bg-[#212d42] border border-[#d6c7b5] dark:border-[#2a374f] text-[#2c221a] dark:text-[#e2e8f0] text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                title="Zaloguj się"
              >
                <LogIn className="w-4 h-4 text-[#8a5327] dark:text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Zaloguj</span>
              </button>
            )}
          </div>

          {/* Date Selector & Navigation Controls: order-3 on mobile (Full-width Line 2), order-2 on desktop (Center) */}
          <div className="order-3 lg:order-2 w-full lg:w-auto flex items-center justify-between sm:justify-center gap-1 sm:gap-2 bg-[#f4ebe1] dark:bg-[#131924] p-1 sm:p-1.5 rounded-2xl border border-[#e2d4c3] dark:border-[#212b3c] shadow-inner shrink-0">
            <button
              onClick={onPrevDay}
              id="btn-prev-day"
              title="Poprzedni dzień"
              className="p-1.5 sm:p-2 rounded-xl hover:bg-[#eae0d2] dark:hover:bg-[#1c2434] text-[#4d3d2e] dark:text-[#cbd5e1] transition-colors active:scale-95 cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={onOpenCalendar}
              id="btn-open-calendar"
              className="flex-1 lg:flex-initial flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-[#1a2230] hover:bg-[#faf6f0] dark:hover:bg-[#222c3d] border border-[#dacabb] dark:border-[#2d3a4f] text-[#2c221a] dark:text-[#f1f5f9] shadow-xs transition-all active:scale-98 cursor-pointer min-w-0"
            >
              <Calendar className="w-4 h-4 text-[#8a5327] dark:text-amber-400 shrink-0" />
              <div className="text-center sm:text-left min-w-0">
                <div className="text-xs sm:text-sm font-bold leading-tight font-serif-book text-[#2c221a] dark:text-[#f8fafc] truncate">
                  {currentDate.displayDate}
                </div>
                <div className="text-[10px] text-[#7a6a5b] dark:text-[#94a3b8] font-medium leading-none truncate">
                  Dzień {currentDate.dayNumber} z 365
                </div>
              </div>
            </button>

            <button
              onClick={onNextDay}
              id="btn-next-day"
              title="Następny dzień"
              className="p-1.5 sm:p-2 rounded-xl hover:bg-[#eae0d2] dark:hover:bg-[#1c2434] text-[#4d3d2e] dark:text-[#cbd5e1] transition-colors active:scale-95 cursor-pointer shrink-0"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={onToday}
              id="btn-today"
              title="Przejdź do dzisiejszego dnia"
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-[#e6d8c7] dark:bg-[#20293a] hover:bg-[#dccbbb] dark:hover:bg-[#2a364d] text-[#4a3a2a] dark:text-[#e2e8f0] transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Dziś</span>
            </button>

            {/* Copy Direct URL Slug Link Button */}
            <button
              onClick={handleCopy}
              id="btn-copy-direct-link"
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl border transition-all shadow-xs cursor-pointer text-xs font-semibold shrink-0 ${
                copiedLink
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'border-[#d6c7b5] dark:border-[#2a374f] bg-white dark:bg-[#161f2e] text-[#4d3d2e] dark:text-amber-300 hover:bg-[#f4ece1] dark:hover:bg-[#212d42]'
              }`}
              title="Kopiuj bezpośredni odnośnik URL do tej sekcji, dnia i podwidoku"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <LinkIcon className="w-3.5 h-3.5 text-[#8a5327] dark:text-amber-400" />}
              <span className="text-xs font-semibold hidden xs:inline">{copiedLink ? 'Skopiowano!' : 'Link'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
