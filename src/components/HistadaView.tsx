import React, { useState, useRef } from 'react';
import { 
  Gamepad2, 
  ExternalLink, 
  Sparkles, 
  Share2, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  QrCode, 
  ShieldCheck, 
  BookOpen, 
  Compass, 
  Globe, 
  ScrollText, 
  Heart,
  ChevronRight,
  Layers,
  Cpu,
  Flame,
  Award
} from 'lucide-react';
import { SectionMeta } from '../types';
import { generateAndDownloadQrBadgePng } from '../utils/qrCodeService';
import { QrImageDisplay } from './QrImageDisplay';
import { SectionGuidePlayerBar } from './SectionGuidePlayerBar';

interface Props {
  section?: SectionMeta;
  currentLang?: string;
  theme?: 'light' | 'dark';
}

export const HistadaView: React.FC<Props> = ({ currentLang = 'pl', theme = 'light' }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const histadaUrl = 'https://histada-app.pages.dev';

  const handleReload = () => {
    setIframeKey(k => k + 1);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/histada`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Histada – Dzieje i historia (Trylogia dla poszukujących)',
          text: '„Dzieje i historia – historia się dzieje.” Gra łącząca historię, naukę, kulturę i wiarę.',
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDownloadQr = () => {
    generateAndDownloadQrBadgePng({
      id: 'histada',
      title: 'Gra Histada – Dzieje i Historia',
      displayLabel: 'histada-app.pages.dev',
      shortUrl: 'https://histada-app.pages.dev',
      fullUrl: 'https://histada-app.pages.dev',
      category: 'histada',
      createdAt: new Date().toISOString()
    });
  };

  // 3 Tomy / Części Trylogii Histada
  const trilogyParts = [
    {
      part: 'Część I',
      title: 'Świt i Narodziny Myśli',
      subtitle: 'Początki cywilizacji, pierwotne pytania o sens, wiarę i prawdę',
      desc: 'Wyruszasz w podróż ku korzeniom ludzkości. Poznajesz narodziny pisma, pierwszych praw, religii pierwotnych i wielkich kultur starożytnych. Każda decyzja kształtuje fundament pod kolejne wieki.',
      color: 'from-amber-600 to-orange-700',
      badge: 'Tom I • Korzenie'
    },
    {
      part: 'Część II',
      title: 'Zmaganie Epok i Dziedzictwo',
      subtitle: 'Ścieranie się imperiów, triumf rozumu, sztuki i duchowości',
      desc: 'Przemierzaj wieki średniowiecza, renesansu i rewolucji naukowej. Odkryj, jak wiara współgra z nauką, jak rodziły się uniwersytety, szpitale i arcydzieła, oraz jak odpowiedzialność ludzka chroniła wolność.',
      color: 'from-purple-600 to-violet-800',
      badge: 'Tom II • Dziedzictwo'
    },
    {
      part: 'Część III',
      title: 'Horyzont Wieczności',
      subtitle: 'Współczesność, przyszłość techniki i ostateczna nadzieja',
      desc: 'Spotkanie postępu technologicznego z etyką miłości. Odpowiedź na dramaty współczesnego człowieka, odnowienie zaufania do Boga i perspektywa Nowego Stworzenia, w którym drzewo życia daje wieczny owoc.',
      color: 'from-indigo-600 to-blue-800',
      badge: 'Tom III • Transcendencja'
    }
  ];

  // 4 Kluczowe Filary Gry
  const pillars = [
    {
      title: 'Dzieje i Historia',
      quote: '„Historia się dzieje w każdym ludzkim wyborze.”',
      desc: 'Poznawanie autentycznych wydarzeń, przełomowych odkryć i postaci, które zmieniły bieg świata. Zrozumienie, skąd przychodzimy i dokąd zmierzamy.',
      icon: ScrollText,
      accent: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/20'
    },
    {
      title: 'Wiara i Rozum (Fides et Ratio)',
      quote: '„Nauka i wiara nie wykluczają się, lecz wspólnie służą człowiekowi.”',
      desc: 'Duch Święty prowadzi człowieka zarówno przez wiarę, jak i przez rozum. Prawdziwa nauka jest darem Boga pomagającym leczyć, budować i zgłębiać piękno stworzenia.',
      icon: Compass,
      accent: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-500/20'
    },
    {
      title: 'Odpowiedzialność i Etyka',
      quote: '„Wybór pomiędzy drogą życia a drogą zniszczenia.”',
      desc: 'Gra, która nie tylko bawi, ale uczy szacunku do życia od poczęcia do naturalnej śmierci, sprawiedliwości społecznej i miłości bliźniego.',
      icon: ShieldCheck,
      accent: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/20'
    },
    {
      title: 'Kultura, Sztuka i Prawda',
      quote: '„Pobudzanie do myślenia i odkrywania bogactwa dorobku ludzkości.”',
      desc: 'Interaktywny świat nasycony architekturą, muzyką, literaturą i symboliką chrześcijańską oraz światową, inspirujący do rozwijania własnych talentów.',
      icon: Sparkles,
      accent: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-500/20'
    }
  ];

  return (
    <div className="min-h-screen bg-[#fcf9f4] dark:bg-[#0b0f17] text-[#2e241c] dark:text-[#e2e8f0] pb-24 transition-colors">
      
      {/* 1. Header Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f5ede3] via-[#faf5ee] to-[#fcf9f4] dark:from-[#131124] dark:via-[#0e121d] dark:to-[#0b0f17] border-b border-[#e8ded3] dark:border-[#1e293b] pt-8 pb-10 px-4 sm:px-6 lg:px-8">
        {/* Glow ambient background effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-amber-500/10 dark:bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-6 relative z-10">
          
          {/* Top Bar Badges and Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 text-purple-800 dark:text-purple-300 text-xs font-bold tracking-wider uppercase border border-purple-500/30">
                <Gamepad2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                TRYLOGIA DLA POSZUKUJĄCYCH
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-300 text-xs font-semibold border border-amber-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                histada-app.pages.dev
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-200/80 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 text-xs font-medium">
                DevHybrid360 P.S.A.
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#18202f] border border-[#e2d6c7] dark:border-[#2a374d] text-xs font-medium text-[#6b5745] dark:text-[#94a3b8] hover:text-[#2e241c] dark:hover:text-white shadow-xs transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Skopiowano link!' : 'Udostępnij'}</span>
              </button>

              <button
                onClick={handleDownloadQr}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#18202f] border border-[#e2d6c7] dark:border-[#2a374d] text-xs font-medium text-[#6b5745] dark:text-[#94a3b8] hover:text-[#2e241c] dark:hover:text-white shadow-xs transition cursor-pointer"
                title="Pobierz kod QR do aplikacji Histada"
              >
                <QrCode className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Kod QR</span>
              </button>

              <a
                href={histadaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Przejdź do platformy https://histada-app.pages.dev"
              >
                <span>Otwórz grę (histada-app.pages.dev)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Hero Main Header Content */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-book tracking-tight text-[#1f1712] dark:text-white flex items-center gap-3">
              <span>Histada</span>
              <span className="text-lg sm:text-2xl font-light text-purple-700 dark:text-purple-400 font-sans-ui">
                – Dzieje i historia
              </span>
            </h1>

            <div className="inline-block px-4 py-1.5 rounded-xl bg-purple-100/80 dark:bg-purple-950/40 border border-purple-300/60 dark:border-purple-800/40">
              <p className="font-heading-cinzel font-bold text-sm sm:text-base text-purple-900 dark:text-purple-200 tracking-wide">
                „Dzieje i historia – historia się dzieje.”
              </p>
            </div>

            <p className="text-base sm:text-lg text-[#614e3e] dark:text-[#94a3b8] max-w-4xl font-sans-ui leading-relaxed">
              Autorski projekt gry łączącej <span className="font-semibold text-purple-800 dark:text-purple-300">historię, kulturę, naukę, filozofię i wiarę</span>. 
              Interaktywny świat zachęcający do odkrywania prawdy, pobudzający do myślenia, 
              uczący odpowiedzialności za losy świata i motywujący do zgłębiania wielkiego dorobku całej ludzkości.
            </p>

            {/* Lektor AI Audio Guide Bar */}
            <div className="pt-2">
              <SectionGuidePlayerBar 
                sectionId="histada" 
                currentLang={currentLang} 
                variant="banner" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Live Frame / View */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className={`relative bg-white dark:bg-[#0f1422] rounded-3xl border border-purple-500/30 shadow-xl overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'fixed inset-2 z-50 rounded-2xl flex flex-col' : ''
        }`}>
          {/* Frame Toolbar */}
          <div className="px-4 py-3 bg-gradient-to-r from-purple-950/90 via-[#181628] to-[#121929] text-white flex items-center justify-between gap-3 border-b border-purple-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-400/30">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Podgląd na żywo: Histada</span>
                  <span className="hidden sm:inline-block px-2 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Online
                  </span>
                </div>
                <div className="text-[11px] text-purple-200/70 font-mono truncate max-w-[200px] sm:max-w-none">
                  {histadaUrl}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReload}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Odśwież aplikację"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsFullscreen(f => !f)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title={isFullscreen ? 'Zmniejsz okno' : 'Powiększ na pełny ekran'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <a
                href={histadaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer"
                title="Otwórz w nowej karcie"
              >
                <span className="hidden sm:inline">Nowe okno</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Iframe View */}
          <div className={`relative w-full ${isFullscreen ? 'flex-1' : 'h-[620px] sm:h-[720px]'} bg-slate-950`}>
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={histadaUrl}
              title="Gra Histada – histada-app.pages.dev"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
            />
          </div>

          {/* Bottom helper bar */}
          <div className="px-4 py-2.5 bg-[#faf6f0] dark:bg-[#121826] border-t border-[#e8ded3] dark:border-[#1e293b] flex flex-wrap items-center justify-between text-xs text-[#7d6b5b] dark:text-[#94a3b8] gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Jeśli podgląd w ramce nie reaguje w Twojej przeglądarce, możesz otworzyć grę bezpośrednio.</span>
            </div>
            <a
              href={histadaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-purple-700 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              <span>Uruchom pełną wersję na histada-app.pages.dev</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </section>

      {/* 3. Trilogy Presentation (3 Części) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 space-y-6">
        <div className="text-center sm:text-left space-y-2">
          <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
            Struktura Dzieła
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif-book text-[#1f1712] dark:text-white">
            Trylogia Histada – Trzy Epoki Poszukiwania Prawdy
          </h2>
          <p className="text-sm sm:text-base text-[#614e3e] dark:text-[#94a3b8] max-w-3xl">
            Projekt podzielony jest na trzy powiązane ze sobą tomy, prowadzące gracza od początków myśli ludzkiej ku perspektywie wieczności.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trilogyParts.map((part, idx) => (
            <div
              key={idx}
              className="rounded-3xl bg-white dark:bg-[#101624] border border-stone-200 dark:border-[#1e293b] p-6 shadow-sm hover:shadow-xl hover:border-purple-500/50 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${part.color} shadow-sm`}>
                    {part.badge}
                  </span>
                  <span className="text-xs font-mono text-stone-400 dark:text-stone-500">
                    Tom {idx + 1} / 3
                  </span>
                </div>

                <h3 className="text-xl font-heading-cinzel font-bold text-[#231a14] dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {part.title}
                </h3>
                
                <p className="text-xs font-semibold text-purple-800 dark:text-purple-300 mt-1 mb-3">
                  {part.subtitle}
                </p>

                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-serif-book">
                  {part.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs font-bold text-purple-700 dark:text-purple-400">
                <span>Poznaj świat części {idx + 1}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. 4 Pillars of the Game (Filary Gry) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 space-y-6">
        <div className="text-center sm:text-left space-y-2">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            Koncepcja i Wartości
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif-book text-[#1f1712] dark:text-white">
            Cztery Filary Projektu Histada
          </h2>
          <p className="text-sm sm:text-base text-[#614e3e] dark:text-[#94a3b8] max-w-3xl">
            Histada nie jest zwykłą rozrywką – to przestrzeń formacyjna, w której wiedza i wartości tworzą spójną całość.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((pillar, idx) => {
            const IconComponent = pillar.icon;
            return (
              <div
                key={idx}
                className={`rounded-2xl bg-white dark:bg-[#111726] border ${pillar.border} p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-4">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  <h4 className="font-heading-cinzel font-bold text-base text-[#1f1712] dark:text-white">
                    {pillar.title}
                  </h4>

                  <p className="text-xs italic text-stone-500 dark:text-stone-400 my-2">
                    {pillar.quote}
                  </p>

                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-sans-ui">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Author's Manifesto & Vision Card (Geneza z WnR365) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-[#181628] to-stone-900 text-white p-6 sm:p-10 shadow-2xl relative overflow-hidden border border-purple-500/30">
          <div className="max-w-4xl space-y-5 relative z-10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <ScrollText className="w-4 h-4" />
              <span>Manifest Twórcy • Wpisy Widoki na Raj</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-serif-book font-bold leading-tight">
              „Jednym z moich największych marzeń pozostaje projekt Histada – trylogia gier dla ludzi poszukujących prawdy.”
            </h3>

            <div className="space-y-3 text-sm sm:text-base text-purple-100/90 font-serif-book leading-relaxed border-l-2 border-amber-400/60 pl-4 py-1">
              <p>
                <em>
                  „Chciałbym stworzyć świat, który będzie zachęcał do poznawania historii, nauki, kultury i wiary. 
                  Marzy mi się gra, która nie tylko będzie bawić, ale także uczyć odpowiedzialności, pobudzać do myślenia 
                  i motywować do odkrywania bogactwa dorobku całej ludzkości. Czasami Bóg prowadzi człowieka drogami, 
                  których sens odkrywamy dopiero po latach.”
                </em>
              </p>
              <p className="text-xs font-sans-ui text-amber-300/90 font-semibold">
                — Dominik, założyciel DevHybrid360 P.S.A. & autor projektu Droga365
              </p>
            </div>

            <div className="pt-3 flex flex-wrap items-center gap-4">
              <a
                href={histadaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg hover:shadow-amber-500/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>Zagraj w Histadę na histada-app.pages.dev</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={handleDownloadQr}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>Pobierz kod QR gry</span>
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
