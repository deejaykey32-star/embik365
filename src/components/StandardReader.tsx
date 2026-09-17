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
  ChevronRight,
  Download,
  Globe,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { SectionMeta, CycleDate, SectionEntry, UploadedPdf, SUPPORTED_LANGUAGES, AppTheme } from '../types';
import { getCycleDateByDayNumber } from '../utils/dateCycle';
import { DigitalRosary } from './DigitalRosary';
import { playLectorSpeech, stopLectorSpeech, getLectorConfig, unlockMobileAudio } from '../utils/audioLectorService';
import { getQrCodeForSection, generateAndDownloadQrBadgePng } from '../utils/qrCodeService';
import { QrImageDisplay } from './QrImageDisplay';

interface Props {
  section: SectionMeta;
  currentDate: CycleDate;
  entry: SectionEntry;
  onSelectDate: (date: CycleDate) => void;
  onOpenCalendar: () => void;
  onOpenPdf: (pdf: UploadedPdf) => void;
  sectionPdfs: UploadedPdf[];
  onOpenDownloadModal?: () => void;
  onOpenLectorModal?: () => void;
  currentLang?: string;
  theme?: AppTheme;
}


export const StandardReader: React.FC<Props> = ({
  section,
  currentDate,
  entry,
  onSelectDate,
  onOpenCalendar,
  onOpenPdf,
  sectionPdfs,
  onOpenDownloadModal,
  onOpenLectorModal,
  currentLang = 'pl',
  theme = 'light'
}) => {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rosaryDecadeCount, setRosaryDecadeCount] = useState(0);

  const activeLangObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  // Find PDFs/ebooks for this section and day
  const matchingPdfs = sectionPdfs.filter(
    p => p.sectionId === section.id && (!p.dateKey || p.dateKey === currentDate.dateKey)
  );

  const handleCopy = () => {
    const textToCopy = `${entry.title}\n\n${entry.content}\n\n${entry.prayer || ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSpeech = async (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    unlockMobileAudio();

    if (isSpeaking) {
      stopLectorSpeech();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${entry.title}. ${entry.content.replace(/<[^>]*>/g, '')}. ${entry.prayer ? 'Modlitwa: ' + entry.prayer.replace(/<[^>]*>/g, '') : ''}`;
    const lectorCfg = getLectorConfig();

    await playLectorSpeech({
      text: textToSpeak,
      config: lectorCfg,
      overrideLang: currentLang,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
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
              onClick={(e) => toggleSpeech(e)}
              onTouchEnd={(e) => {
                e.preventDefault();
                toggleSpeech(e);
              }}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer touch-manipulation ${
                isSpeaking
                  ? 'bg-amber-600 text-white border-amber-700 animate-pulse'
                  : 'bg-white dark:bg-[#17202f] hover:bg-[#f1e6d7] dark:hover:bg-[#202c40] text-[#4d3d2e] dark:text-[#e2e8f0] border-[#dccdc0] dark:border-[#29364b]'
              }`}
              title={isSpeaking ? 'Zatrzymaj lektora' : 'Włącz czytanie na głos (Lektor)'}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#8a572c] dark:text-amber-400" />}
              <span className="hidden sm:inline">{isSpeaking ? 'Głos gra' : 'Lektor'}</span>
            </button>

            {/* Lector Settings Modal Button */}
            {onOpenLectorModal && (
              <button
                onClick={onOpenLectorModal}
                className="p-2 rounded-xl bg-white dark:bg-[#17202f] hover:bg-[#f1e6d7] dark:hover:bg-[#202c40] text-[#4d3d2e] dark:text-[#e2e8f0] border border-[#dccdc0] dark:border-[#29364b] transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                title="Ustawienia Lektora (Wersja Lokalna / Online AI, Język, Wybór głosu)"
              >
                <span>🎧</span>
                <span className="hidden lg:inline">Głos Lektora</span>
              </button>
            )}


            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-white dark:bg-[#17202f] hover:bg-[#f1e6d7] dark:hover:bg-[#202c40] text-[#4d3d2e] dark:text-[#e2e8f0] border border-[#dccdc0] dark:border-[#29364b] transition-colors cursor-pointer"
              title="Kopiuj treść wpisu"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Download E-book / POD button */}
            {onOpenDownloadModal && (
              <button
                onClick={onOpenDownloadModal}
                className="p-2 sm:px-3 rounded-xl bg-amber-600/15 hover:bg-amber-600/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Pobierz E-book (PDF POD, Word DOCX, ePUB) gotowe do druku i publikacji"
              >
                <Download className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span className="hidden md:inline">Pobierz E-book / Druk</span>
              </button>
            )}
          </div>
        </div>

        {/* Entry Title & Liturgical Date */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider font-sans-ui">
            <span>{currentDate.season}</span>
            <span>•</span>
            <span>{currentDate.displayDate}</span>
            {currentLang !== 'pl' && (
              <span className="px-2 py-0.5 rounded-md bg-amber-600/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 normal-case font-medium flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>Tłumaczenie: {activeLangObj.flag} {activeLangObj.nativeName}</span>
              </span>
            )}
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

        {/* Attached files notification banner if available (PDF, ePUB, DOCX) */}
        {matchingPdfs.length > 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-[#fbf2e9] dark:bg-amber-950/20 border border-[#e4ccb5] dark:border-amber-900/40 space-y-2">
            <div className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
              Załączone pliki źródłowe ({matchingPdfs.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {matchingPdfs.map(f => {
                const ext = (f.originalName.split('.').pop() || 'pdf').toLowerCase();
                const format = (f.format || (ext === 'docx' || ext === 'doc' ? 'docx' : ext === 'epub' ? 'epub' : 'pdf')).toUpperCase();
                const isPdf = format === 'PDF';
                const badgeColor = format === 'EPUB' 
                  ? 'bg-emerald-600/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                  : format === 'DOCX' || format === 'DOC'
                  ? 'bg-blue-600/20 text-blue-800 dark:text-blue-300 border-blue-500/30'
                  : 'bg-red-600/20 text-red-800 dark:text-red-300 border-red-500/30';

                return (
                  <div 
                    key={f.id} 
                    className="p-3 rounded-xl bg-white dark:bg-[#1a2333] border border-[#dacabb] dark:border-[#2d3a4f] flex items-center justify-between gap-2 shadow-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${badgeColor}`}>
                        {format}
                      </span>
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-[#2d2217] dark:text-[#f3e8d2] truncate">
                          {f.title || f.originalName}
                        </div>
                        <div className="text-[10px] text-[#7d6c5c] dark:text-[#94a3b8]">
                          {Math.round(f.size / 1024)} KB
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={f.url}
                        download={f.originalName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-amber-600/15 hover:bg-amber-600/25 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1 transition-colors"
                        title="Pobierz plik"
                      >
                        <Download className="w-3 h-3" />
                        <span>Pobierz</span>
                      </a>
                      {isPdf && (
                        <button
                          onClick={() => onOpenPdf(f)}
                          className="px-2.5 py-1 rounded-lg bg-stone-200 dark:bg-[#283549] hover:bg-stone-300 dark:hover:bg-[#34445d] text-stone-800 dark:text-stone-200 text-xs font-medium transition-colors"
                        >
                          Podgląd
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* RHZ365 Special: Digital Rosary Visualizer with 6 User Variants */}
      {section.id === 'rhz365' && (
        <div className="mb-8">
          <DigitalRosary
            mysteryTitle={entry.mystery}
            intention={entry.intention}
            theme={theme}
          />
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
        <div className={`font-serif-book text-[#2e241c] dark:text-[#e2e8f0] leading-relaxed text-justify ${
          fontSize === 'normal' ? 'text-base sm:text-lg leading-7 sm:leading-8' :
          fontSize === 'large' ? 'text-lg sm:text-xl leading-8 sm:leading-9' :
          'text-xl sm:text-2xl leading-9 sm:leading-10'
        }`}>
          {/<[a-z][\s\S]*>/i.test(entry.content || '') ? (
            <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: entry.content }} />
          ) : (
            <div className="whitespace-pre-line">{entry.content}</div>
          )}
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
            <div className="font-serif-book italic text-base sm:text-lg text-[#3f3125] dark:text-[#cbd5e1] leading-relaxed">
              {/<[a-z][\s\S]*>/i.test(entry.prayer || '') ? (
                <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: entry.prayer }} />
              ) : (
                <div className="whitespace-pre-line">{entry.prayer}</div>
              )}
            </div>
          </div>
        )}

        {/* Official QR Code Badge Box for sharing and printing */}
        {(() => {
          const qrItem = getQrCodeForSection(section.id, section.name);
          return (
            <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-[#faf7f2] dark:bg-[#151c27] border border-[#e5d9ca] dark:border-[#212c3e] flex flex-col sm:flex-row items-center gap-6 shadow-xs">
              <a
                href={qrItem.shortUrl || qrItem.fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-28 h-28 sm:w-32 sm:h-32 p-2 bg-white rounded-2xl border border-[#dfd2c2] dark:border-[#2b384e] shadow-md hover:scale-105 transition-transform shrink-0 flex items-center justify-center cursor-pointer"
                title="Kliknij, aby przetestować przekierowanie QR"
              >
                <QrImageDisplay text={qrItem.shortUrl || qrItem.fullUrl} title={qrItem.title} />
              </a>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-600/15 text-amber-900 dark:text-amber-300 border border-amber-500/30 uppercase tracking-wider flex items-center gap-1">
                    <QrCode className="w-3 h-3" />
                    <span>Oficjalny Kod QR</span>
                  </span>
                  <span className="text-xs font-mono text-[#7d6c5d] dark:text-[#94a3b8]">
                    {qrItem.shortUrl || qrItem.fullUrl}
                  </span>
                </div>
                <h4 className="font-bold text-base text-[#2d2217] dark:text-[#f3e8d2] font-heading-cinzel">
                  {qrItem.title}
                </h4>
                <p className="text-xs text-[#6e5d4e] dark:text-[#a0aec0] font-serif-book">
                  {qrItem.displayLabel || `Zeskanuj smartfonem lub kliknij kod QR, aby przejść bezpośrednio do tej sekcji.`}
                </p>

                <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    onClick={async () => {
                      await generateAndDownloadQrBadgePng(qrItem);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Pobierz plik graficzny PNG wysokiej rozdzielczości (300 DPI) do druku"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Pobierz Kod QR (PNG 300 DPI)</span>
                  </button>
                  <a
                    href={qrItem.shortUrl || qrItem.fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[#e8ded1] dark:bg-[#1e2738] hover:bg-[#dcd0c2] dark:hover:bg-[#28354c] text-[#3d2f23] dark:text-[#f1f5f9] text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                    <span>Otwórz link</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })()}
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
