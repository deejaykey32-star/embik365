import React, { useState } from 'react';
import { 
  BookOpen, 
  Quote, 
  Heart, 
  FileText, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Calendar, 
  Scroll, 
  Cross,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { SectionMeta, CycleDate, SectionEntry, UploadedPdf } from '../types';
import { getCycleDateByDayNumber } from '../utils/dateCycle';

interface Props {
  section: SectionMeta;
  currentDate: CycleDate;
  entry: SectionEntry;
  onSelectDate: (date: CycleDate) => void;
  onOpenCalendar: () => void;
  onOpenPdf: (pdf: UploadedPdf) => void;
  sectionPdfs: UploadedPdf[];
}

export const StandardReader: React.FC<Props> = ({
  section,
  currentDate,
  entry,
  onSelectDate,
  onOpenCalendar,
  onOpenPdf,
  sectionPdfs
}) => {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rosaryDecadeCount, setRosaryDecadeCount] = useState(0);

  // Find PDFs for this section and day
  const matchingPdfs = sectionPdfs.filter(
    p => p.sectionId === section.id && (!p.dateKey || p.dateKey === currentDate.dateKey)
  );

  const handleCopy = () => {
    const textToCopy = `${entry.title}\n\n${entry.content}\n\n${entry.prayer || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Twoja przeglądarka nie obsługuje syntezy mowy.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const text = `${entry.title}. ${entry.content}. ${entry.prayer ? 'Modlitwa: ' + entry.prayer : ''}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pl-PL';
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 transition-colors duration-300">
      {/* Top Banner & Date indicator */}
      <div className="bg-[#f7f2ea] dark:bg-[#111722] rounded-3xl p-6 sm:p-8 border border-[#e5d8ca] dark:border-[#1f293d] shadow-xs mb-8 transition-colors duration-300">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#e7d8c6] dark:bg-[#1e293b] text-[#6d4f33] dark:text-amber-300 border border-[#d6c3ae] dark:border-[#334155]">
              {section.badge}
            </span>
            <span className="text-xs text-[#7b6b5d] dark:text-[#94a3b8] font-medium">
              Dzień {currentDate.dayNumber} z 366 (cykl od 25 XII)
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Font size picker */}
            <div className="flex items-center bg-white dark:bg-[#17202f] rounded-xl border border-[#dccdc0] dark:border-[#29364b] p-0.5 text-xs">
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  fontSize === 'normal' 
                    ? 'bg-[#3b2d21] dark:bg-amber-600 text-white shadow-xs' 
                    : 'text-[#6d5b4a] dark:text-[#94a3b8] hover:text-[#2c2219] dark:hover:text-white'
                }`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2 py-1 rounded-lg font-medium transition-all text-sm cursor-pointer ${
                  fontSize === 'large' 
                    ? 'bg-[#3b2d21] dark:bg-amber-600 text-white shadow-xs' 
                    : 'text-[#6d5b4a] dark:text-[#94a3b8] hover:text-[#2c2219] dark:hover:text-white'
                }`}
              >
                A+
              </button>
              <button
                onClick={() => setFontSize('xlarge')}
                className={`px-2 py-1 rounded-lg font-medium transition-all text-base cursor-pointer ${
                  fontSize === 'xlarge' 
                    ? 'bg-[#3b2d21] dark:bg-amber-600 text-white shadow-xs' 
                    : 'text-[#6d5b4a] dark:text-[#94a3b8] hover:text-[#2c2219] dark:hover:text-white'
                }`}
              >
                A++
              </button>
            </div>

            {/* Read aloud toggle */}
            <button
              onClick={toggleSpeech}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                isSpeaking
                  ? 'bg-amber-600 text-white border-amber-700 animate-pulse'
                  : 'bg-white dark:bg-[#17202f] hover:bg-[#f1e6d7] dark:hover:bg-[#202c40] text-[#4d3d2e] dark:text-[#e2e8f0] border-[#dccdc0] dark:border-[#29364b]'
              }`}
              title={isSpeaking ? 'Zatrzymaj lektora' : 'Włącz czytanie na głos (Lektor)'}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#8a572c] dark:text-amber-400" />}
              <span className="hidden sm:inline">{isSpeaking ? 'Głos gra' : 'Lektor'}</span>
            </button>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-white dark:bg-[#17202f] hover:bg-[#f1e6d7] dark:hover:bg-[#202c40] text-[#4d3d2e] dark:text-[#e2e8f0] border border-[#dccdc0] dark:border-[#29364b] transition-colors cursor-pointer"
              title="Kopiuj treść wpisu"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Entry Title & Liturgical Date */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider font-sans-ui">
            <span>{currentDate.season}</span>
            <span>•</span>
            <span>{currentDate.displayDate}</span>
          </div>
          <h1 className="font-heading-cinzel text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2a2016] dark:text-[#f3e8d2] leading-tight">
            {entry.title}
          </h1>
          {entry.subtitle && (
            <p className="font-serif-book italic text-base sm:text-lg text-[#715f50] dark:text-[#a0aec0]">
              {entry.subtitle}
            </p>
          )}
        </div>

        {/* Attached PDF notification banner if available */}
        {matchingPdfs.length > 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-[#fbf2e9] dark:bg-red-950/30 border border-[#e4ccb5] dark:border-red-900/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 flex items-center justify-center border border-red-200 dark:border-red-700">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-red-900 dark:text-red-200">
                  Dostępny plik PDF wgrany przez Administratora
                </div>
                <div className="text-xs text-[#6e5d4d] dark:text-[#cbd5e1]">
                  {matchingPdfs[0].title || matchingPdfs[0].originalName} ({Math.round(matchingPdfs[0].size / 1024)} KB)
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenPdf(matchingPdfs[0])}
              className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Otwórz plik PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* RHZ365 Special: Rosary Mystery & Decade Bead Counter */}
      {section.id === 'rhz365' && (
        <div className="bg-[#eff6ff] dark:bg-[#0d1728] rounded-3xl p-6 border border-[#bfdbfe] dark:border-[#1e2d4a] mb-8 space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-900 dark:text-sky-300 font-bold text-sm">
              <Cross className="w-4 h-4 text-sky-700 dark:text-amber-400" />
              <span>{entry.mystery || 'Tajemnica Różańcowa'}</span>
            </div>
            <span className="text-xs text-sky-700 dark:text-sky-400 font-medium">
              Dziesiątek: {rosaryDecadeCount} / 10
            </span>
          </div>

          {entry.intention && (
            <p className="text-xs sm:text-sm text-sky-950 dark:text-sky-100 font-serif-book italic bg-white/70 dark:bg-[#131d31] p-3 rounded-xl border border-sky-200 dark:border-[#223352]">
              <strong className="not-italic text-sky-900 dark:text-sky-300 font-sans-ui">Intencja: </strong>
              {entry.intention}
            </p>
          )}

          {/* Interactive Rosary Beads */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-sky-800 dark:text-sky-400 uppercase tracking-wider">
              Dotknij paciorka po zmówieniu "Zdrowaś Maryjo":
            </span>
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              {[...Array(10)].map((_, i) => {
                const isPrayed = i < rosaryDecadeCount;
                return (
                  <button
                    key={i}
                    onClick={() => setRosaryDecadeCount(i + 1)}
                    className={`flex-1 h-9 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                      isPrayed
                        ? 'bg-sky-700 dark:bg-amber-500 text-white dark:text-black shadow-xs scale-102 dark:shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                        : 'bg-white dark:bg-[#152033] hover:bg-sky-100 dark:hover:bg-[#1c2c47] text-sky-900 dark:text-sky-300 border border-sky-300 dark:border-[#233352]'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            {rosaryDecadeCount > 0 && (
              <button
                onClick={() => setRosaryDecadeCount(0)}
                className="text-[11px] text-sky-700 dark:text-amber-400 hover:text-sky-900 dark:hover:text-amber-300 underline mt-1 cursor-pointer"
              >
                Wyzeruj dziesiątek
              </button>
            )}
          </div>
        </div>
      )}

      {/* Biblia365 Special: Scripture Readings & Apocrypha Box */}
      {section.id === 'biblia365' && (
        <div className="space-y-4 mb-8">
          {entry.passage && (
            <div className="bg-[#f0fdf4] dark:bg-[#071f16] rounded-2xl p-5 border border-[#bbf7d0] dark:border-[#0f4d36] transition-colors">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>Wyznaczone Fragmenty Pisma Świętego</span>
              </div>
              <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100 font-serif-book">
                {entry.passage}
              </p>
            </div>
          )}

          {entry.apocryphaPassage && (
            <div className="bg-[#fffbeb] dark:bg-[#1f1708] rounded-2xl p-5 border border-[#fde68a] dark:border-[#533910] transition-colors">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                <Scroll className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span>Teksty Apokryficzne i Tradycja Ojców Kościoła</span>
              </div>
              <p className="text-sm font-semibold text-amber-950 dark:text-amber-100 font-serif-book">
                {entry.apocryphaPassage}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main Reading Card */}
      <article className="bg-white dark:bg-[#111722] rounded-3xl p-6 sm:p-10 border border-[#e8ded3] dark:border-[#1f293d] shadow-xs dark:shadow-xl dark:shadow-black/40 space-y-6 transition-colors duration-300">
        {/* Main Content */}
        <div className={`font-serif-book text-[#2e241c] dark:text-[#e2e8f0] leading-relaxed whitespace-pre-line text-justify ${
          fontSize === 'normal' ? 'text-base sm:text-lg leading-7 sm:leading-8' :
          fontSize === 'large' ? 'text-lg sm:text-xl leading-8 sm:leading-9' :
          'text-xl sm:text-2xl leading-9 sm:leading-10'
        }`}>
          {entry.content}
        </div>

        {/* Quote if present */}
        {entry.quote && (
          <div className="p-6 rounded-2xl bg-[#faf5ee] dark:bg-[#18202d] border-l-4 border-[#8c572b] dark:border-amber-500 my-6 space-y-2 transition-colors">
            <Quote className="w-6 h-6 text-[#8c572b] dark:text-amber-400" />
            <p className="font-serif-book italic text-base sm:text-lg text-[#473729] dark:text-amber-100">
              {entry.quote}
            </p>
          </div>
        )}

        {/* Prayer if present */}
        {entry.prayer && (
          <div className="p-6 rounded-2xl bg-[#fdf9f4] dark:bg-[#161f2c] border border-[#e8ded4] dark:border-[#243042] space-y-2 transition-colors">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8c572b] dark:text-amber-400 font-sans-ui">
              <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Modlitwa Końcowa</span>
            </div>
            <p className="font-serif-book italic text-base sm:text-lg text-[#3f3125] dark:text-[#cbd5e1] leading-relaxed">
              {entry.prayer}
            </p>
          </div>
        )}
      </article>

      {/* Bottom Nav between days */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          onClick={() => {
            const prev = getCycleDateByDayNumber(currentDate.dayNumber - 1);
            onSelectDate(prev);
          }}
          disabled={currentDate.dayNumber <= 1}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#151c28] hover:bg-[#f5ecdf] dark:hover:bg-[#1f293a] border border-[#dccdc0] dark:border-[#28354a] text-[#3d2f23] dark:text-[#e2e8f0] text-sm font-semibold disabled:opacity-40 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Poprzedni dzień</span>
        </button>

        <button
          onClick={onOpenCalendar}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#f0e4d4] dark:bg-[#1e2738] hover:bg-[#e4d6c4] dark:hover:bg-[#273349] border border-[#d6c5b2] dark:border-[#2d3a50] text-[#423223] dark:text-[#f1f5f9] text-sm font-semibold transition-all cursor-pointer"
        >
          <Calendar className="w-4 h-4 text-[#8a572c] dark:text-amber-400" />
          <span>Wybierz inny dzień</span>
        </button>

        <button
          onClick={() => {
            const next = getCycleDateByDayNumber(currentDate.dayNumber + 1);
            onSelectDate(next);
          }}
          disabled={currentDate.dayNumber >= 366}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#151c28] hover:bg-[#f5ecdf] dark:hover:bg-[#1f293a] border border-[#dccdc0] dark:border-[#28354a] text-[#3d2f23] dark:text-[#e2e8f0] text-sm font-semibold disabled:opacity-40 transition-all cursor-pointer"
        >
          <span>Następny dzień</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
