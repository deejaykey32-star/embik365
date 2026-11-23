import React, { useState } from 'react';
import { 
  ShoppingBag, 
  ExternalLink, 
  Share2, 
  CheckCircle2, 
  BookOpen, 
  Truck, 
  Sparkles, 
  Bookmark, 
  ArrowRight,
  ShieldCheck,
  Star,
  Download
} from 'lucide-react';
import { SectionMeta } from '../types';
import okladkiKompletImg from '../pliki/okładki-komplet.png';
import zimaTom1Img from '../pliki/zima-tom-1.jpg';
import wiosnaTom2Img from '../pliki/wiosna-tom-2.jpg';
import latoTom3Img from '../pliki/lato-tom-3.jpg';
import jesienTom4Img from '../pliki/jesien-tom-4.jpg';
import rhzTom5Img from '../pliki/RHZ-tom-5.jpg';

interface Props {
  section?: SectionMeta;
  currentLang?: string;
  theme?: 'light' | 'dark';
}

export const AMAZON_SERIES_URL = 'https://www.amazon.pl/s?k=%22widoki+na+raj%22&__mk_pl_PL=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=I13271BC0RVI&sprefix=widoki+na+raj+%2Caps%2C119&ref=nb_sb_noss_2';

export const KsiazkiAmazonView: React.FC<Props> = ({ currentLang = 'pl', theme = 'light' }) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShare = async () => {
    const shareUrl = AMAZON_SERIES_URL;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Seria Książkowa „Widoki na Raj” na Amazon.pl',
          text: 'Kup oficjalną serię książek „Widoki na Raj” (Tomy 1–4 i RHZ) w druku lub jako e-book na Amazon.pl.',
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

  const books = [
    {
      tom: 1,
      title: 'Widoki na Raj — Tom 1: Zima',
      subtitle: '25 grudnia – 24 marca • Dni 1–90',
      desc: 'Pierwsza ćwiartka rocznego cyklu. Narodzenie Pańskie, początek drogi, czas wyciszenia i zimowej kontemplacji.',
      img: zimaTom1Img,
      color: 'from-sky-900/30 to-blue-950/40',
      border: 'border-sky-500/30',
      badge: 'Tom 1 • Zima'
    },
    {
      tom: 2,
      title: 'Widoki na Raj — Tom 2: Wiosna',
      subtitle: '25 marca – 24 czerwca • Dni 91–182',
      desc: 'Czas Zwiastowania, Wielkiego Postu, Paschy i Zmartwychwstania. Odrodzenie życia, nadzieja i eksplozja łaski.',
      img: wiosnaTom2Img,
      color: 'from-emerald-900/30 to-teal-950/40',
      border: 'border-emerald-500/30',
      badge: 'Tom 2 • Wiosna'
    },
    {
      tom: 3,
      title: 'Widoki na Raj — Tom 3: Lato',
      subtitle: '25 czerwca – 24 września • Dni 183–274',
      desc: 'Pełnia światła, dojrzałość wiary, wakacyjne wędrówki, szlaki pielgrzymkowe i owocowanie Ducha Świętego.',
      img: latoTom3Img,
      color: 'from-amber-900/30 to-orange-950/40',
      border: 'border-amber-500/30',
      badge: 'Tom 3 • Lato'
    },
    {
      tom: 4,
      title: 'Widoki na Raj — Tom 4: Jesień',
      subtitle: '25 września – 24 grudnia • Dni 275–365',
      desc: 'Czas zbiorów, zadumy nad wiecznością, adwentowe oczekiwanie i przygotowanie serca na ponowne przyjście Pana.',
      img: jesienTom4Img,
      color: 'from-rose-900/30 to-amber-950/40',
      border: 'border-orange-500/30',
      badge: 'Tom 4 • Jesień'
    },
    {
      tom: 5,
      title: 'Różaniec Historii Zbawienia (RHZ)',
      subtitle: 'Tom Modlitewny • Koncepcja IN-LOVE',
      desc: 'Kompletny modlitewnik różańcowy prowadzący przez całą Historię Zbawienia z biblijnymi rozważaniami i wezwaniami.',
      img: rhzTom5Img,
      color: 'from-purple-900/30 to-indigo-950/40',
      border: 'border-purple-500/30',
      badge: 'Tom 5 • RHZ'
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 animate-fade-in text-[#2c2219] dark:text-[#f1f5f9]">
      
      {/* Główny Hero Baner Promocyjny Amazon */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c130c] via-[#2a1708] to-[#120d08] border-2 border-amber-500/40 text-white p-6 sm:p-10 mb-8 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Lewa kolumna: Tekst i wezwanie do zakupu */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-500/25 text-amber-300 border border-amber-500/50 flex items-center gap-1.5 shadow-xs">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                <span>Oficjalna Księgarnia • Amazon.pl</span>
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-stone-200 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dostawa do domu • Amazon Prime</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-heading-cinzel tracking-tight text-white leading-tight">
              Kup Serię Książek <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200 bg-clip-text text-transparent">
                „Widoki na Raj”
              </span>
            </h1>

            <p className="text-sm sm:text-base text-stone-200 leading-relaxed font-sans-ui">
              Przeżyj 365 dni z książką w dłoni! Cała monumentalna seria rozważań, aforyzmów i medytacji duchowych 
              autorstwa Dominika Kłosa jest teraz dostępna w eleganckim wydaniu drukowanym (papierowa oprawa / twarda oprawa) 
              oraz w formacie elektronicznym Kindle na platformie <strong>Amazon.pl</strong>.
            </p>

            {/* Atuty wydania */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Druk na żądanie (wysoka jakość)</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Komplet 4 tomów + RHZ</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Bezpieczne zakupy na Amazon</span>
              </div>
            </div>

            {/* Przyciski CTA */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <a
                href={AMAZON_SERIES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 font-black text-sm sm:text-base flex items-center gap-2.5 shadow-xl hover:shadow-amber-500/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Przejdź do oferty na Amazon.pl"
              >
                <ShoppingBag className="w-5 h-5 text-stone-950" />
                <span>Kup serię książek na Amazon.pl</span>
                <ExternalLink className="w-4 h-4 text-stone-950" />
              </a>

              <button
                onClick={handleShare}
                className="px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
                title="Skopiuj odnośnik do Amazon"
              >
                <Share2 className="w-4 h-4 text-amber-300" />
                <span>Udostępnij</span>
              </button>
            </div>

            {copiedLink && (
              <div className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Skopiowano link do oferty na Amazon.pl do schowka!</span>
              </div>
            )}
          </div>

          {/* Prawa kolumna: Duża grafika kompletu okładek */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <a
              href={AMAZON_SERIES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group block relative w-full max-w-md cursor-pointer"
              title="Kliknij, aby otworzyć całą serię książek na Amazon.pl"
            >
              <div className="absolute inset-0 bg-amber-500/20 rounded-3xl blur-2xl group-hover:bg-amber-500/35 transition-all duration-500" />
              <img
                src={okladkiKompletImg}
                alt="Komplet okładek serii książek Widoki na Raj na Amazon.pl"
                className="relative z-10 w-full h-auto max-h-[360px] object-contain mx-auto drop-shadow-[0_16px_30px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-500 rounded-2xl"
              />
              <div className="mt-3 text-center text-xs text-amber-300/90 font-semibold flex items-center justify-center gap-1.5">
                <span>Kliknij ilustrację, aby przejść do Amazon.pl</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </a>
          </div>

        </div>
      </div>

      {/* Prezentacja Poszczególnych Tomów w Serii */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-heading-cinzel font-bold text-[#3a2717] dark:text-[#f8fafc] mb-1">
          Tomy Wchodzące w Skład Serii
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
          Możesz zamówić całą serię lub poszczególne tomy według pory roku
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {books.map((b) => (
          <div
            key={b.tom}
            className={`group flex flex-col justify-between rounded-3xl bg-white dark:bg-[#0c121e] border ${b.border} shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative`}
          >
            <div className="p-5 sm:p-6 space-y-4">
              
              {/* Okładka tomu */}
              <div className="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-center group-hover:scale-[1.02] transition-transform">
                <img
                  src={b.img}
                  alt={b.title}
                  className="w-full h-full object-contain p-2 drop-shadow-md"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-xs text-amber-300 font-bold text-[11px] border border-amber-500/30">
                  {b.badge}
                </div>
              </div>

              {/* Informacje o tomie */}
              <div>
                <h3 className="font-heading-cinzel font-bold text-base sm:text-lg text-[#2c1d11] dark:text-[#f8fafc] mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {b.title}
                </h3>
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">
                  {b.subtitle}
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-serif-book">
                  {b.desc}
                </p>
              </div>

            </div>

            {/* Dolny pasek z bezpośrednim linkiem do Amazon */}
            <div className="px-5 py-3.5 bg-stone-50 dark:bg-[#111827] border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1 font-medium">
                <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                <span>Paperback & E-book</span>
              </span>

              <a
                href={AMAZON_SERIES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                title={`Kup ${b.title} na Amazon.pl`}
              >
                <span>Kup na Amazon</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        ))}
      </div>

      {/* Dodatkowe informacje o zamówieniu i dostawie */}
      <div className="rounded-3xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Dlaczego warto mieć wydanie drukowane?</span>
          </div>
          <h3 className="text-lg sm:text-xl font-heading-cinzel font-bold text-[#2a1a0d] dark:text-[#f3e8d2]">
            Książka, która towarzyszy przez cały rok
          </h3>
          <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 max-w-2xl leading-relaxed">
            Papierowe wydanie to doskonały pomysł na prezent dla siebie i bliskich. Każdy dzień zaczyna się od refleksji, 
            a czytanie z fizycznej książki pozwala na głębokie skupienie z dala od ekranów i powiadomień telefonu.
          </p>
        </div>

        <a
          href={AMAZON_SERIES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Zobacz całą ofertę na Amazon.pl</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

    </div>
  );
};
