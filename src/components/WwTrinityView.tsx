import React, { useState, useRef } from 'react';
import { 
  Globe, 
  ExternalLink, 
  Share2, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  CheckCircle2, 
  MapPin, 
  Compass, 
  Navigation, 
  Layers, 
  Sparkles 
} from 'lucide-react';
import { SectionMeta } from '../types';

interface Props {
  section?: SectionMeta;
  currentLang?: string;
  theme?: 'light' | 'dark';
}

export const WwTrinityView: React.FC<Props> = ({ currentLang = 'pl', theme = 'light' }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const trinityUrl = 'https://ww-trinity.pages.dev';

  const handleReload = () => {
    setIframeKey(k => k + 1);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/ww-trinity`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'WW Trinity — Ogólnoświatowa Trójjedyna Pielgrzymka Gwiaździsta',
          text: 'Wyznacz trzyetapową trasę pielgrzymkową dla dowolnej diecezji na świecie: Katedra → Sanktuarium Maryjne → Miłosierdzie Boże → Powrót.',
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
    <div className={`w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 animate-fade-in ${isFullscreen ? 'fixed inset-0 z-50 p-0 max-w-none bg-slate-950' : ''}`}>
      {/* Baner Nagłówkowy */}
      {!isFullscreen && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 border border-indigo-500/30 text-white p-5 sm:p-7 mb-6 shadow-xl">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 shadow-xs">
                  <Globe className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Dedykowana Platforma • ww-trinity.pages.dev</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-slate-200 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pętla Trzech Sanktuariów • Worldwide Atlas</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading-cinzel tracking-tight text-white mb-2">
                WW Trinity — Ogólnoświatowa Trójjedyna Pielgrzymka Gwiaździsta
              </h1>
              <p className="text-sm sm:text-base text-indigo-100/90 max-w-3xl leading-relaxed">
                Ogólnoświatowy atlas pielgrzymkowy wyznaczający trzyetapowe pętle pielgrzymki gwiaździstej (przez Maryję do Jezusa) dla dowolnej diecezji na świecie: od katedry biskupiej, przez diecezjalne sanktuarium maryjne, ku sanktuarium Bożego Miłosierdzia i powrót.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <a
                href={trinityUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Otwórz aplikację w nowej karcie"
              >
                <span>Otwórz ww-trinity.pages.dev</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 hover:text-white transition-colors cursor-pointer"
                title="Udostępnij lub skopiuj link"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 hover:text-white transition-colors cursor-pointer"
                title={isFullscreen ? 'Opuść pełny ekran' : 'Pełny ekran'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={handleReload}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 hover:text-white transition-colors cursor-pointer"
                title="Odśwież widok"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {copiedLink && (
            <div className="mt-3 text-xs text-indigo-300 font-semibold flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>Skopiowano link do schowka!</span>
            </div>
          )}

          {/* Szybkie pigułki funkcjonalności */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-indigo-500/20 text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Dla każdej diecezji na świecie</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Katedra → Maryja → Miłosierdzie Boże</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <Navigation className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Generowanie tras pieszych i rowerowych</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Dwujęzyczny Atlas PL / EN z mapami</span>
            </div>
          </div>
        </div>
      )}

      {/* Pasek kontrolny w trybie pełnoekranowym */}
      {isFullscreen && (
        <div className="fixed top-3 right-4 z-50 flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-2xl">
          <span className="text-xs font-semibold text-indigo-400 mr-2 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            <span>WW Trinity</span>
          </span>
          <button
            onClick={handleReload}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
            title="Odśwież"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <a
            href={trinityUrl}
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
      <div className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-indigo-900/30 dark:border-indigo-500/20 bg-slate-950 shadow-2xl ${isFullscreen ? 'h-full rounded-none border-none' : 'h-[78vh] min-h-[640px]'}`}>
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={trinityUrl}
          title="WW Trinity — Worldwide Trinity | Ogólnoświatowa Trójjedyna Pielgrzymka Gwiaździsta"
          className="w-full h-full border-0"
          allow="geolocation; clipboard-write; autoplay; fullscreen"
          loading="lazy"
        />
      </div>
    </div>
  );
};
