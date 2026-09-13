import React, { useState } from 'react';
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
  Globe
} from 'lucide-react';
import { CycleDate, AdminUser, AppTheme, SUPPORTED_LANGUAGES } from '../types';
import { getUIText } from '../utils/translationService';

interface Props {
  currentDate: CycleDate;
  onPrevDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onOpenCalendar: () => void;
  adminUser: AdminUser | null;
  onOpenAdmin: () => void;
  theme: AppTheme;
  onToggleTheme: () => void;
  githubConnected?: boolean;
  currentLang: string;
  onLanguageChange: (lang: string) => void;
  onOpenDownloadModal: () => void;
}

export const NavigationHeader: React.FC<Props> = ({
  currentDate,
  onPrevDay,
  onNextDay,
  onToday,
  onOpenCalendar,
  adminUser,
  onOpenAdmin,
  theme,
  onToggleTheme,
  githubConnected = false,
  currentLang,
  onLanguageChange,
  onOpenDownloadModal
}) => {
  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40 bg-[#fdfbf7]/95 dark:bg-[#0b0f17]/95 backdrop-blur-md border-b border-[#e7ded4] dark:border-[#1e2638] shadow-xs transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-2 sm:gap-4">
          {/* Logo & App Title */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-linear-to-br from-[#8a5327] to-[#452714] dark:from-amber-600 dark:to-amber-800 text-white flex items-center justify-center shadow-md shadow-[#8a5327]/20 dark:shadow-amber-950/40 border border-[#b47a46]/30 dark:border-amber-500/30 shrink-0">
              <Sparkles className="w-5 h-5 text-[#f6d8ae] dark:text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading-cinzel font-bold text-lg sm:text-2xl text-[#2a221b] dark:text-[#f3e8d2] tracking-wide">
                  Droga365
                </h1>
                <span className="hidden md:inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-[#eee4d6] dark:bg-[#1a2333] text-[#785434] dark:text-amber-300 border border-[#dac7b3] dark:border-[#2a374f]">
                  25 XII - 24 XII
                </span>
                {githubConnected && (
                  <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" title="Zsynchronizowano z GitHub & Cloudflare Pages">
                    <GitBranch className="w-3 h-3" />
                    <span>GitHub Sync</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7e6e5f] dark:text-[#94a3b8] font-sans-ui hidden sm:block">
                WnR366 • RHZ365 • Biblia365 • Flipbooki • Bio365
              </p>
            </div>
          </div>

          {/* Date Selector & Navigation Controls */}
          <div className="flex items-center gap-1 sm:gap-2 bg-[#f4ebe1] dark:bg-[#131924] p-1.5 rounded-2xl border border-[#e2d4c3] dark:border-[#212b3c] shadow-inner">
            <button
              onClick={onPrevDay}
              id="btn-prev-day"
              title="Poprzedni dzień"
              className="p-1.5 sm:p-2 rounded-xl hover:bg-[#eae0d2] dark:hover:bg-[#1c2434] text-[#4d3d2e] dark:text-[#cbd5e1] transition-colors active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={onOpenCalendar}
              id="btn-open-calendar"
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-[#1a2230] hover:bg-[#faf6f0] dark:hover:bg-[#222c3d] border border-[#dacabb] dark:border-[#2d3a4f] text-[#2c221a] dark:text-[#f1f5f9] shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-[#8a5327] dark:text-amber-400 shrink-0" />
              <div className="text-left">
                <div className="text-xs sm:text-sm font-bold leading-tight font-serif-book text-[#2c221a] dark:text-[#f8fafc]">
                  {currentDate.displayDate}
                </div>
                <div className="text-[10px] text-[#7a6a5b] dark:text-[#94a3b8] font-medium leading-none">
                  Dzień {currentDate.dayNumber} z 366
                </div>
              </div>
            </button>

            <button
              onClick={onNextDay}
              id="btn-next-day"
              title="Następny dzień"
              className="p-1.5 sm:p-2 rounded-xl hover:bg-[#eae0d2] dark:hover:bg-[#1c2434] text-[#4d3d2e] dark:text-[#cbd5e1] transition-colors active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={onToday}
              id="btn-today"
              title="Przejdź do dzisiejszego dnia"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-[#e6d8c7] dark:bg-[#20293a] hover:bg-[#dccbbb] dark:hover:bg-[#2a364d] text-[#4a3a2a] dark:text-[#e2e8f0] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Dziś</span>
            </button>
          </div>

          {/* Right Action Bar: Download/Publish + Language + Theme + Admin */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Download & Publish Button (KDP, Empik, Legimi, PDF, DOCX, ePUB) */}
            <button
              onClick={onOpenDownloadModal}
              id="btn-header-download-pod"
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all cursor-pointer"
              title="Pobierz E-book (PDF, ePUB, Word DOCX) gotowe do druku POD (0 zł na start)"
            >
              <Download className="w-4 h-4 text-amber-200" />
              <span className="hidden md:inline">Pobierz E-book / POD</span>
              <span className="md:hidden">E-book</span>
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <label htmlFor="select-app-language" className="sr-only">Wybierz język</label>
              <div className="flex items-center bg-white dark:bg-[#161f2e] border border-[#d6c7b5] dark:border-[#2a374f] rounded-xl px-2 py-1.5 shadow-xs">
                <span className="mr-1 text-sm">{currentLangObj.flag}</span>
                <select
                  id="select-app-language"
                  value={currentLang}
                  onChange={e => onLanguageChange(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-[#3a2e22] dark:text-[#e2e8f0] focus:outline-hidden cursor-pointer"
                  title="Wybierz język aplikacji i tłumaczenia"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code} className="dark:bg-[#161f2e] dark:text-white">
                      {lang.flag} {lang.code.toUpperCase()} - {lang.nativeName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Theme Toggle Button (Light / Dark) */}
            <button
              onClick={onToggleTheme}
              id="btn-theme-toggle"
              className="p-2.5 rounded-xl border border-[#d6c7b5] dark:border-[#2a374f] bg-white dark:bg-[#161f2e] text-[#4d3d2e] dark:text-amber-300 hover:bg-[#f4ece1] dark:hover:bg-[#212d42] transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center"
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
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#2e261f] dark:bg-[#1a2230] text-white hover:bg-[#3f352b] dark:hover:bg-[#242f42] transition-all shadow-sm active:scale-95 border border-[#524436] dark:border-[#334259] cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-left hidden xl:block">
                  <div className="text-xs font-semibold leading-tight text-white">Dominik Kuta</div>
                  <div className="text-[10px] text-[#c7b9ab] dark:text-[#94a3b8] leading-none">Admin & Autor</div>
                </div>
                <span className="xl:hidden text-xs font-bold text-amber-300">Admin</span>
              </button>
            ) : (
              <button
                onClick={onOpenAdmin}
                id="btn-login-google"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#161f2e] hover:bg-[#fbf7f1] dark:hover:bg-[#212d42] border border-[#d6c7b5] dark:border-[#2a374f] text-[#2c221a] dark:text-[#e2e8f0] text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-[#8a5327] dark:text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Panel Autora</span>
                <span className="sm:hidden">Zaloguj</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
