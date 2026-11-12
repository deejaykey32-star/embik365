import React, { useState, useRef } from 'react';
import { 
  BookOpen, 
  ExternalLink, 
  Sparkles, 
  Share2, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Layers, 
  CheckCircle2, 
  Headphones, 
  Compass, 
  Globe
} from 'lucide-react';
import { SectionMeta } from '../types';

interface Props {
  section?: SectionMeta;
  currentLang?: string;
  theme?: 'light' | 'dark';
}

export const Biblia365PlanView: React.FC<Props> = ({ currentLang = 'pl', theme = 'light' }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const planUrl = 'https://biblia365plan.pages.dev';

  const handleReload = () => {
    setIframeKey(k => k + 1);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/biblia365plan`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Biblia 365 – Plan Czytania, Komentarz & Lektor AI',
          text: 'Roczny plan czytania Pisma Świętego dzień po dniu, księga po księdze z komentarzem hebrajsko-greckim i lektorem AI.',
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      // ignore
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 animate-fade-in ${isFullscreen ? 'fixed inset-0 z-50 p-0 max-w-none bg-stone-900' : ''}`}>
      {/* Baner Nagłówkowy */}
      {!isFullscreen && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 border border-emerald-500/30 text-white p-5 sm:p-7 mb-6 shadow-xl">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-xs">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Dedykowana Platforma • biblia365plan.pages.dev</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-stone-200">
                  Lektor AI & Komentarz
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading-cinzel tracking-tight text-white mb-2">
                Biblia 365 – Plan Czytania, Komentarz & Lektor AI
              </h1>
              <p className="text-sm sm:text-base text-emerald-100/90 max-w-3xl leading-relaxed">
                Kompleksowy plan lektury Pisma Świętego dzień po dniu, księga po księdze i rozdział po rozdziale z automatycznym śledzeniem postępów, analizą lingwistyczną (hebrajski, aramejski, grecki, łacina), kontekstem geopolitycznym, florą i fauną oraz lektorem syntezy mowy.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <a
                href={planUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Otwórz platformę w nowej karcie"
              >
                <span>Otwórz biblia365plan.pages.dev</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-stone-200 hover:text-white transition-colors cursor-pointer"
                title="Udostępnij lub skopiuj link"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-stone-200 hover:text-white transition-colors cursor-pointer"
                title={isFullscreen ? 'Opuść pełny ekran' : 'Pełny ekran'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={handleReload}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-stone-200 hover:text-white transition-colors cursor-pointer"
                title="Odśwież widok"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {copiedLink && (
            <div className="mt-3 text-xs text-emerald-300 font-semibold flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Skopiowano link do schowka!</span>
            </div>
          )}

          {/* Szybkie pigułki funkcjonalności */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-emerald-500/20 text-xs">
            <div className="flex items-center gap-2 text-stone-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Śledzenie postępów na żywo</span>
            </div>
            <div className="flex items-center gap-2 text-stone-200">
              <Headphones className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Lektor mowy AI dla każdego rozdziału</span>
            </div>
            <div className="flex items-center gap-2 text-stone-200">
              <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Komentarz hebrajski, grecki i łaciński</span>
            </div>
            <div className="flex items-center gap-2 text-stone-200">
              <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Geopolityka, archeologia, flora i fauna</span>
            </div>
          </div>
        </div>
      )}

      {/* Pasek kontrolny w trybie pełnoekranowym */}
      {isFullscreen && (
        <div className="fixed top-3 right-4 z-50 flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-2xl">
          <span className="text-xs font-semibold text-emerald-400 mr-2 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Biblia365 Plan</span>
          </span>
          <button
            onClick={handleReload}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
            title="Odśwież"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <a
            href={planUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
            title="Otwórz w nowej karcie"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
            title="Zamknij pełny ekran"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Główny kontener iframe */}
      <div className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-emerald-900/30 dark:border-emerald-500/20 bg-stone-950 shadow-2xl ${isFullscreen ? 'h-full rounded-none border-none' : 'h-[78vh] min-h-[640px]'}`}>
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={planUrl}
          title="Biblia 365 – Plan Czytania, Komentarz & Lektor AI"
          className="w-full h-full border-0"
          allow="clipboard-write; autoplay; fullscreen"
          loading="lazy"
        />
      </div>
    </div>
  );
};

