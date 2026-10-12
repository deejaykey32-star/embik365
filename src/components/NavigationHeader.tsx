import React, { useState, useEffect, useRef } from 'react';
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
  Link as LinkIcon,
  Check,
  Search,
  Smartphone,
  Headphones,
  MoreVertical,
  X
} from 'lucide-react';
import { CycleDate, AdminUser, AppTheme, SUPPORTED_LANGUAGES } from '../types';
import { copyCurrentPageUrl } from '../utils/slugRouter';

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
  onOpenSettings?: () => void;
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
  onCopyLink,
  onOpenSettings
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalledPwa, setIsInstalledPwa] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      setIsInstalledPwa(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalledPwa(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Close the overflow menu on outside click / Escape
  useEffect(() => {
    if (!isMenuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [isMenuOpen]);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) {
      onOpenSettings?.();
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalledPwa(true);
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

  const runAndClose = (fn?: () => void) => () => {
    setIsMenuOpen(false);
    fn?.();
  };

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  const menuItemClass =
    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left text-[var(--c-text-soft)] hover:bg-[var(--c-accent-soft)] cursor-pointer';

  return (
    <header className="sticky top-0 z-40 bg-[var(--c-header)] backdrop-blur-md border-b border-[var(--c-border)] pt-safe transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap xl:flex-nowrap items-center justify-between gap-x-2 gap-y-2 py-2 xl:py-2.5">

          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="order-1 flex items-center gap-2 sm:gap-3 shrink-0 min-w-0 text-left"
            aria-label="Droga365 – początek strony"
          >
            <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-[#8a5327] to-[#452714] dark:from-amber-500 dark:to-amber-700 text-white flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#f6d8ae] dark:text-amber-50" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="font-heading-cinzel font-bold text-base sm:text-xl text-[var(--c-text)] tracking-wide leading-none">
                  Droga365
                </span>
                <span className="hidden 2xl:inline-flex ui-chip">25 XII – 24 XII</span>
                {githubConnected && (
                  <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" title="Zsynchronizowano z GitHub & Cloudflare Pages">
                    <GitBranch className="w-3 h-3" />
                    <span>Sync</span>
                  </span>
                )}
              </span>
              <span className="hidden sm:block text-[11px] ui-muted leading-tight mt-1">
                Widoki na Raj · RHZ · Biblia365
              </span>
            </span>
          </button>

          {/* Actions */}
          <div className="order-2 xl:order-3 flex items-center justify-end gap-1.5 sm:gap-2">
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                id="btn-header-search"
                className="ui-btn ui-btn-icon lg:w-auto lg:px-3"
                title="Szukaj (Ctrl+K)"
                aria-label="Szukaj"
              >
                <Search className="w-4 h-4 ui-accent" />
                <span className="hidden lg:inline">Szukaj</span>
                <kbd className="hidden 2xl:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded border border-[var(--c-border)] ui-muted">Ctrl K</kbd>
              </button>
            )}

            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                id="btn-header-app-settings"
                className="ui-btn hidden md:inline-flex"
                title="Ustawienia aplikacji oraz instalacja: Android, iOS, PWA, komputer"
              >
                <Smartphone className="w-4 h-4 ui-accent" />
                <span>Aplikacja</span>
              </button>
            )}

            {adminUser && (
              <button
                onClick={onOpenDownloadModal}
                id="btn-header-download-pod"
                className="ui-btn ui-btn-primary hidden lg:inline-flex"
                title="Pobierz E-book (PDF, ePUB, DOCX) do druku POD"
              >
                <Download className="w-4 h-4" />
                <span>POD</span>
              </button>
            )}

            {onOpenLectorModal && (
              <button
                onClick={onOpenLectorModal}
                id="btn-lector-settings"
                className="ui-btn ui-btn-icon hidden sm:inline-flex 2xl:w-auto 2xl:px-3"
                title="Lektor – wybór głosu"
                aria-label="Lektor"
              >
                <Headphones className="w-4 h-4 ui-accent" />
                <span className="hidden 2xl:inline">Lektor</span>
              </button>
            )}

            <label className="ui-btn px-2 gap-1 hidden xs:inline-flex" title="Język aplikacji i tłumaczenia">
              <span className="sr-only">Wybierz język</span>
              <span aria-hidden="true">{currentLangObj.flag}</span>
              <select
                id="select-app-language"
                value={currentLang}
                onChange={e => onLanguageChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[var(--c-text)] focus:outline-hidden cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code} className="bg-[var(--c-card)] text-[var(--c-text)]">
                    {lang.code.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>

            {deferredPrompt && !isInstalledPwa && (
              <button
                onClick={handleInstallPwa}
                id="btn-install-pwa"
                className="ui-btn ui-btn-primary hidden sm:inline-flex"
                title="Zainstaluj aplikację Droga365 (PWA)"
              >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Zainstaluj</span>
              </button>
            )}

            <button
              onClick={onToggleTheme}
              id="btn-theme-toggle"
              className="ui-btn ui-btn-icon"
              title={theme === 'dark' ? 'Przełącz na jasny motyw' : 'Przełącz na ciemny motyw'}
              aria-label={theme === 'dark' ? 'Jasny motyw' : 'Ciemny motyw'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-[#785434]" />}
            </button>

            {adminUser ? (
              <button
                onClick={onOpenAdmin}
                id="btn-admin-profile"
                className="ui-btn hidden sm:inline-flex bg-[#2e261f] dark:bg-[#1a2230] text-white border-[#524436] dark:border-[#334259] hover:bg-[#3f352b]"
                title="Panel administratora"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Admin</span>
              </button>
            ) : (
              <button
                onClick={onOpenAdmin}
                id="btn-login-google"
                className="ui-btn hidden sm:inline-flex"
                title="Zaloguj się"
              >
                <LogIn className="w-4 h-4 ui-accent" />
                <span className="hidden md:inline">Zaloguj</span>
              </button>
            )}

            {/* Overflow menu (smartphones & tablets) */}
            <div className="relative md:hidden" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(o => !o)}
                className="ui-btn ui-btn-icon"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                aria-label="Więcej opcji"
                id="btn-header-more"
              >
                {isMenuOpen ? <X className="w-4 h-4" /> : <MoreVertical className="w-4 h-4" />}
              </button>
              {isMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-[min(18rem,calc(100vw-1.5rem))] ui-card p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  {onOpenSettings && (
                    <button role="menuitem" className={menuItemClass} onClick={runAndClose(onOpenSettings)}>
                      <Smartphone className="w-4 h-4 ui-accent" />
                      <span>Aplikacja i ustawienia</span>
                    </button>
                  )}
                  {!isInstalledPwa && (
                    <button role="menuitem" className={menuItemClass} onClick={runAndClose(handleInstallPwa)}>
                      <Download className="w-4 h-4 ui-accent" />
                      <span>Zainstaluj aplikację</span>
                    </button>
                  )}
                  {onOpenLectorModal && (
                    <button role="menuitem" className={menuItemClass} onClick={runAndClose(onOpenLectorModal)}>
                      <Headphones className="w-4 h-4 ui-accent" />
                      <span>Lektor – wybór głosu</span>
                    </button>
                  )}
                  {adminUser && (
                    <button role="menuitem" className={menuItemClass} onClick={runAndClose(onOpenDownloadModal)}>
                      <Download className="w-4 h-4 ui-accent" />
                      <span>Pobierz e-book (POD)</span>
                    </button>
                  )}
                  <button role="menuitem" className={menuItemClass} onClick={runAndClose(onOpenAdmin)}>
                    {adminUser ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <LogIn className="w-4 h-4 ui-accent" />}
                    <span>{adminUser ? 'Panel administratora' : 'Zaloguj się'}</span>
                  </button>
                  <div className="xs:hidden border-t border-[var(--c-border)] mt-1 pt-2 px-3 pb-1">
                    <label htmlFor="select-app-language-menu" className="block text-[11px] font-semibold ui-muted mb-1">Język</label>
                    <select
                      id="select-app-language-menu"
                      value={currentLang}
                      onChange={e => { onLanguageChange(e.target.value); setIsMenuOpen(false); }}
                      className="ui-input text-sm"
                    >
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name || lang.code.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Date navigator: full-width second row on phones/tablets, centred on laptops */}
          <div className="order-3 xl:order-2 w-full xl:w-auto flex items-center gap-1 sm:gap-1.5 bg-[var(--c-surface)] p-1 rounded-2xl border border-[var(--c-border)]">
            <button
              onClick={onPrevDay}
              id="btn-prev-day"
              title="Poprzedni dzień"
              aria-label="Poprzedni dzień"
              className="ui-btn ui-btn-ghost ui-btn-icon"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={onOpenCalendar}
              id="btn-open-calendar"
              className="flex-1 xl:flex-initial xl:min-w-[12rem] flex items-center justify-center gap-2 px-3 min-h-10 rounded-xl bg-[var(--c-card)] hover:border-[var(--c-accent)] border border-[var(--c-border)] text-[var(--c-text)] transition-colors cursor-pointer min-w-0"
              title="Otwórz kalendarz"
            >
              <Calendar className="w-4 h-4 ui-accent shrink-0" />
              <span className="text-center min-w-0">
                <span className="block text-sm font-bold leading-tight font-serif-book truncate">
                  {currentDate.displayDate}
                </span>
                <span className="block text-[11px] ui-muted font-medium leading-tight truncate">
                  Dzień {currentDate.dayNumber} z 365
                </span>
              </span>
            </button>

            <button
              onClick={onNextDay}
              id="btn-next-day"
              title="Następny dzień"
              aria-label="Następny dzień"
              className="ui-btn ui-btn-ghost ui-btn-icon"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={onToday}
              id="btn-today"
              title="Przejdź do dzisiejszego dnia"
              className="ui-btn ui-btn-ghost ui-btn-icon xs:w-auto xs:px-2.5"
              aria-label="Dziś"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xs:inline text-xs">Dziś</span>
            </button>

            <button
              onClick={handleCopy}
              id="btn-copy-direct-link"
              className={`ui-btn ui-btn-icon xs:w-auto xs:px-2.5 ${copiedLink ? '!bg-emerald-600 !text-white !border-emerald-700' : 'ui-btn-ghost'}`}
              title="Kopiuj bezpośredni link do tej sekcji i dnia"
              aria-label="Kopiuj link"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4 ui-accent" />}
              <span className="hidden xs:inline text-xs">{copiedLink ? 'Skopiowano' : 'Link'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
