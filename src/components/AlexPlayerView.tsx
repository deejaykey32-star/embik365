import React, { useState, useRef } from 'react';
import { 
  Headphones, 
  ExternalLink, 
  Share2, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  CheckCircle2, 
  Music, 
  Youtube, 
  Mic2, 
  ListMusic, 
  Sparkles 
} from 'lucide-react';
import { SectionMeta } from '../types';

interface Props {
  section?: SectionMeta;
  currentLang?: string;
  theme?: 'light' | 'dark';
}

export const AlexPlayerView: React.FC<Props> = ({ currentLang = 'pl', theme = 'light' }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const playerUrl = 'https://widoki-alex-player.pages.dev';

  const handleReload = () => {
    setIframeKey(k => k + 1);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/widoki-alex-player`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Widoki na Raj & Alex i Dom — Odtwarzacz YouTube & Karaoke',
          text: 'Odtwarzacz wszystkich utworów z kanałów YouTube @widokinaraj i @0minik0 ze zsynchronizowanym tekstem karaoke.',
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
    <div className={`w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 animate-fade-in ${isFullscreen ? 'fixed inset-0 z-50 p-0 max-w-none bg-zinc-950' : ''}`}>
      {/* Baner Nagłówkowy */}
      {!isFullscreen && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-950 via-zinc-900 to-slate-950 border border-teal-500/30 text-white p-5 sm:p-7 mb-6 shadow-xl">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center gap-1.5 shadow-xs">
                  <Headphones className="w-3.5 h-3.5 text-teal-300" />
                  <span>Dedykowana Platforma • widoki-alex-player.pages.dev</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-zinc-200 flex items-center gap-1">
                  <Youtube className="w-3.5 h-3.5 text-red-400" />
                  <span>@widokinaraj & @0minik0</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading-cinzel tracking-tight text-white mb-2">
                Widoki na Raj & Alex i Dom — Odtwarzacz YouTube
              </h1>
              <p className="text-sm sm:text-base text-teal-100/90 max-w-3xl leading-relaxed">
                Kompletny odtwarzacz wszystkich utworów z kanałów YouTube @widokinaraj i @0minik0. Oferuje automatyczne i ręczne odtwarzanie w pętli, natychmiastowy zapis stanu odsłuchu oraz zsynchronizowany tekst pieśni karaoke wyraz po wyrazie na żywo.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <a
                href={playerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Otwórz aplikację w nowej karcie"
              >
                <span>Otwórz widoki-alex-player</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-200 hover:text-white transition-colors cursor-pointer"
                title="Udostępnij lub skopiuj link"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-200 hover:text-white transition-colors cursor-pointer"
                title={isFullscreen ? 'Opuść pełny ekran' : 'Pełny ekran'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={handleReload}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-200 hover:text-white transition-colors cursor-pointer"
                title="Odśwież widok"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {copiedLink && (
            <div className="mt-3 text-xs text-teal-300 font-semibold flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Skopiowano link do schowka!</span>
            </div>
          )}

          {/* Szybkie pigułki funkcjonalności */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-teal-500/20 text-xs">
            <div className="flex items-center gap-2 text-zinc-200">
              <Mic2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Tekst zsynchronizowany wyraz po wyrazie</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-200">
              <ListMusic className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Katalog utworów obu kanałów YouTube</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-200">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Zapamiętywanie postępu i odsłuchanych pieśni</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-200">
              <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Odtwarzanie losowe, powtarzanie i tło</span>
            </div>
          </div>
        </div>
      )}

      {/* Pasek kontrolny w trybie pełnoekranowym */}
      {isFullscreen && (
        <div className="fixed top-3 right-4 z-50 flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-2xl">
          <span className="text-xs font-semibold text-teal-400 mr-2 flex items-center gap-1">
            <Headphones className="w-3.5 h-3.5" />
            <span>Widoki & Alex Player</span>
          </span>
          <button
            onClick={handleReload}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
            title="Odśwież"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <a
            href={playerUrl}
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
      <div className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-teal-900/30 dark:border-teal-500/20 bg-zinc-950 shadow-2xl ${isFullscreen ? 'h-full rounded-none border-none' : 'h-[78vh] min-h-[640px]'}`}>
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={playerUrl}
          title="Widoki na Raj & Alex i Dom — Odtwarzacz YouTube"
          className="w-full h-full border-0"
          allow="clipboard-write; autoplay; fullscreen; encrypted-media"
          loading="lazy"
        />
      </div>
    </div>
  );
};
