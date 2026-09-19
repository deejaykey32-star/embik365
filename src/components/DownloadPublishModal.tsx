import React, { useState } from 'react';
import { 
  X, Download, FileText, BookOpen, Layers, CheckCircle2, Sparkles, 
  Globe, Loader2, Printer, Calendar
} from 'lucide-react';
import { SectionEntry, SectionMeta, SUPPORTED_LANGUAGES, UploadedPdf } from '../types';
import { generatePodPdf, generatePodDocx, generateEpub, triggerBrowserDownload } from '../utils/ebookGenerators';
import { translateEntry } from '../utils/translationService';
import { getBibliaEntryForDayAndYear } from '../data/biblia365Data';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entry: SectionEntry;
  meta: SectionMeta;
  uploadedFiles?: UploadedPdf[];
  currentLang: string;
  onLanguageChange?: (lang: string) => void;
}

export const DownloadPublishModal: React.FC<Props> = ({
  isOpen,
  onClose,
  entry,
  meta,
  uploadedFiles = [],
  currentLang,
  onLanguageChange
}) => {
  const [activeTab, setActiveTab] = useState<'download' | 'platforms' | 'uploaded'>('download');
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'docx' | 'epub'>('pdf');
  const [exportScope, setExportScope] = useState<'single' | 'year'>('year');
  const [selectedYear, setSelectedYear] = useState<1 | 2 | 3 | 4>(1);
  const [pageSize, setPageSize] = useState<'6x9' | 'a5'>('6x9');
  const [exportLang, setExportLang] = useState<string>(currentLang || 'pl');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter uploaded files for this section
  const sectionUploads = uploadedFiles.filter(
    f => f.sectionId === meta.id || f.sectionId === 'general'
  );

  const selectedLangObj = SUPPORTED_LANGUAGES.find(l => l.code === exportLang) || SUPPORTED_LANGUAGES[0];

  const handleDownload = async () => {
    setIsGenerating(true);
    setDownloadSuccess(null);

    try {
      let entryToExport = entry;
      let allYearEntries: SectionEntry[] = [];

      if (exportScope === 'year') {
        for (let day = 1; day <= 365; day++) {
          const bEntry = getBibliaEntryForDayAndYear(day, selectedYear);
          allYearEntries.push({
            dayNumber: day,
            dateKey: `Dzień ${day}`,
            title: bEntry.title || `${bEntry.bookTitle} – Rozdział ${bEntry.chapter}`,
            passage: bEntry.passage,
            content: bEntry.content,
            prayer: `Panie Boże, dziękuję Ci za dar Twojego Słowa z księgi ${bEntry.bookTitle}. Niech Twoja łaska oświeca moje myśli i prowadzi moje kroki. Amen.`
          });
        }
      }

      // If exporting in another language and single entry, translate if needed
      if (exportLang !== 'pl' && exportScope === 'single') {
        setIsTranslating(true);
        const translated = await translateEntry(entry, exportLang, selectedLangObj.name);
        entryToExport = {
          ...entry,
          title: translated.title,
          mystery: translated.mystery,
          intention: translated.intention,
          content: translated.content,
          prayer: translated.prayer
        };
        setIsTranslating(false);
      }

      const safeSection = meta.id.replace(/[^a-zA-Z0-9]/g, '_');
      const safeScope = exportScope === 'year' ? `Rok_${selectedYear}_Tom_365_Dni` : (entry.dateKey || `${entry.dayNumber}`).replace(/[^a-zA-Z0-9]/g, '_');
      const baseFilename = `Biblia365_${safeSection}_${safeScope}_${exportLang}`;

      const options = {
        format: selectedFormat,
        size: pageSize,
        language: exportLang,
        languageName: selectedLangObj.name,
        exportScope,
        selectedYear,
        allYearEntries: exportScope === 'year' ? allYearEntries : undefined
      };

      if (selectedFormat === 'pdf') {
        const blob = await generatePodPdf(entryToExport, meta, options);
        triggerBrowserDownload(blob, `${baseFilename}_POD_${pageSize}.pdf`);
        setDownloadSuccess(`Wygenerowano czysty plik PDF do druku POD (${pageSize.toUpperCase()}) dla ${exportScope === 'year' ? `Roku ${selectedYear} (365 dni)` : 'pojedynczego rozdziału'} w języku: ${selectedLangObj.nativeName}`);
      } else if (selectedFormat === 'docx') {
        const blob = await generatePodDocx(entryToExport, meta, options);
        triggerBrowserDownload(blob, `${baseFilename}_KDP_Format.docx`);
        setDownloadSuccess(`Wygenerowano czysty dokument DOCX (Word UTF-8) dla KDP i Empik (${exportScope === 'year' ? `Rok ${selectedYear} - 365 dni` : 'pojedynczy rozdział'}) w języku: ${selectedLangObj.nativeName}`);
      } else if (selectedFormat === 'epub') {
        const blob = await generateEpub(entryToExport, meta, options);
        triggerBrowserDownload(blob, `${baseFilename}_Ebook.epub`);
        setDownloadSuccess(`Wygenerowano czysty e-book ePUB 3 z pełnym spisem treści (${exportScope === 'year' ? `Rok ${selectedYear} - 365 dni` : 'pojedynczy rozdział'}) w języku: ${selectedLangObj.nativeName}`);
      }
    } catch (err: any) {
      console.error('Błąd generowania pliku:', err);
      alert(`Wystąpił błąd podczas generowania pliku: ${err.message || err}`);
    } finally {
      setIsGenerating(false);
      setIsTranslating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#231e19] text-stone-900 dark:text-[#f3eae0] rounded-3xl border border-stone-200 dark:border-[#423425] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-stone-50 dark:bg-[#1c1813] border-b border-stone-200 dark:border-[#382d20] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/15 border border-amber-600/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading-cinzel font-bold text-base sm:text-lg text-stone-900 dark:text-white flex items-center gap-2">
                Pobierz E-book & Druk POD (0 zł na start)
                <span className="text-[11px] font-sans px-2 py-0.5 rounded-full bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                  KDP • Empik • Legimi
                </span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-[#b49e89] truncate max-w-md">
                Sekcja: <span className="font-semibold">{meta.name}</span> • Wpis: {entry.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="btn-close-download-modal"
            className="p-2 rounded-xl text-stone-400 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-[#34291e] hover:text-stone-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="px-4 sm:px-6 bg-stone-100/70 dark:bg-[#1e1914] border-b border-stone-200 dark:border-[#33281c] flex gap-2">
          <button
            onClick={() => setActiveTab('download')}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'download'
                ? 'border-amber-600 text-amber-700 dark:text-amber-400'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            Generuj PDF, DOCX, ePUB
          </button>

          <button
            onClick={() => setActiveTab('uploaded')}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'uploaded'
                ? 'border-amber-600 text-amber-700 dark:text-amber-400'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Pliki Autora ({sectionUploads.length})
          </button>

          <button
            onClick={() => setActiveTab('platforms')}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'platforms'
                ? 'border-amber-600 text-amber-700 dark:text-amber-400'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Platformy za 0 zł na start
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'download' && (
            <div className="space-y-6">
              {/* Scope & Year Selection */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Wybierz Zakres i Tom Cyklu do Pobrania:
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    100% Czysty Tekst i Polskie Znaki
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Full Year Volume Option */}
                  <button
                    type="button"
                    onClick={() => setExportScope('year')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      exportScope === 'year'
                        ? 'border-amber-600 bg-amber-600/15 ring-2 ring-amber-600/30 font-bold'
                        : 'border-stone-200 dark:border-[#423425] bg-white dark:bg-[#282119] opacity-80'
                    }`}
                  >
                    <div className="text-xs text-stone-900 dark:text-white font-bold">Pełny Tom Roczny (365 Czytań)</div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Pobiera cały rok czytań (365 rozdziałów) w jednym kompletnym e-booku/pliku do druku.</div>
                  </button>

                  {/* Single Chapter Option */}
                  <button
                    type="button"
                    onClick={() => setExportScope('single')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      exportScope === 'single'
                        ? 'border-amber-600 bg-amber-600/15 ring-2 ring-amber-600/30 font-bold'
                        : 'border-stone-200 dark:border-[#423425] bg-white dark:bg-[#282119] opacity-80'
                    }`}
                  >
                    <div className="text-xs text-stone-900 dark:text-white font-bold">Pojedynczy Rozdział Dnia</div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Pobiera wyłącznie aktualnie otwarty rozdział/wpis z tego dnia.</div>
                  </button>
                </div>

                {/* Year Selector */}
                {exportScope === 'year' && (
                  <div className="pt-2 flex items-center gap-2">
                    <span className="text-xs font-semibold text-stone-700 dark:text-[#f0e3d5]">Wybierz Tom (Rok):</span>
                    <div className="grid grid-cols-4 gap-2 flex-1">
                      {([1, 2, 3, 4] as const).map(yr => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => setSelectedYear(yr)}
                          className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all border text-center ${
                            selectedYear === yr
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-white dark:bg-[#282119] border-stone-300 dark:border-[#423425] text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          Rok {yr}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Format selection cards */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-[#b49e89] mb-3">
                  Wybierz Format Pliku do Publikacji i Druku:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* PDF Card */}
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('pdf')}
                    className={`p-4 rounded-2xl border text-left transition-all relative ${
                      selectedFormat === 'pdf'
                        ? 'border-amber-600 dark:border-amber-500 bg-amber-50/60 dark:bg-amber-950/25 ring-2 ring-amber-600/30'
                        : 'border-stone-200 dark:border-[#3d3023] bg-white dark:bg-[#282119] hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-8 h-8 rounded-lg bg-red-600/15 text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-center">
                        PDF
                      </span>
                      {selectedFormat === 'pdf' && <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                    </div>
                    <div className="font-bold text-sm text-stone-900 dark:text-white">PDF do Druku POD</div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                      Naprawione kodowanie znaków, brak kwadratowych nawiasów. Marginesy 0.8", pagina, numeracja stron, metryka praw autorskich. Gotowy do Amazon KDP i Empik.
                    </p>
                  </button>

                  {/* DOCX Card */}
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('docx')}
                    className={`p-4 rounded-2xl border text-left transition-all relative ${
                      selectedFormat === 'docx'
                        ? 'border-amber-600 dark:border-amber-500 bg-amber-50/60 dark:bg-amber-950/25 ring-2 ring-amber-600/30'
                        : 'border-stone-200 dark:border-[#3d3023] bg-white dark:bg-[#282119] hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-8 h-8 rounded-lg bg-blue-600/15 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center">
                        DOCX
                      </span>
                      {selectedFormat === 'docx' && <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                    </div>
                    <div className="font-bold text-sm text-stone-900 dark:text-white">Microsoft Word (.docx)</div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                      Pełne natywne polskie znaki UTF-8. Czyste style nagłówków, podziały stron. KDP i Empik automatycznie konwertują DOCX.
                    </p>
                  </button>

                  {/* ePUB Card */}
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('epub')}
                    className={`p-4 rounded-2xl border text-left transition-all relative ${
                      selectedFormat === 'epub'
                        ? 'border-amber-600 dark:border-amber-500 bg-amber-50/60 dark:bg-amber-950/25 ring-2 ring-amber-600/30'
                        : 'border-stone-200 dark:border-[#3d3023] bg-white dark:bg-[#282119] hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-8 h-8 rounded-lg bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center">
                        ePUB
                      </span>
                      {selectedFormat === 'epub' && <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                    </div>
                    <div className="font-bold text-sm text-stone-900 dark:text-white">ePUB 3 (E-book)</div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                      Pełne natywne polskie znaki UTF-8. Format dla czytników: Legimi, Empik Go, Apple Books, Kobo, Kindle. Skalowalna typografia, ncx/nav.
                    </p>
                  </button>
                </div>
              </div>

              {/* Language and Page Setup Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-[#1b1712] border border-stone-200 dark:border-[#382d20]">
                {/* Language selection */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-[#f0e3d5] mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Język pliku do pobrania (Tłumaczenie):
                  </label>
                  <select
                    value={exportLang}
                    onChange={e => setExportLang(e.target.value)}
                    className="w-full bg-white dark:bg-[#28221a] border border-stone-300 dark:border-[#4d3d2e] rounded-xl px-3 py-2 text-sm text-stone-800 dark:text-[#f5ebe1] focus:outline-hidden focus:border-amber-600"
                  >
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.nativeName} ({lang.name})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-stone-500 dark:text-[#a8937e] mt-1">
                    {exportLang === 'pl'
                      ? 'Oryginalna treść w języku polskim.'
                      : `Plik zostanie przetłumaczony na język: ${selectedLangObj.nativeName} zachowując styl teologiczny.`}
                  </p>
                </div>

                {/* Page Size Selection for PDF/DOCX */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-[#f0e3d5] mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Wymiary książki papierowej (Trim Size):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPageSize('6x9')}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                        pageSize === '6x9'
                          ? 'border-amber-600 bg-amber-600/10 text-amber-700 dark:text-amber-400 font-bold'
                          : 'border-stone-200 dark:border-[#423425] text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      <div>6 x 9 cali (Trade)</div>
                      <div className="text-[10px] font-normal opacity-80">Główny standard Amazon KDP</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPageSize('a5')}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                        pageSize === 'a5'
                          ? 'border-amber-600 bg-amber-600/10 text-amber-700 dark:text-amber-400 font-bold'
                          : 'border-stone-200 dark:border-[#423425] text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      <div>Format A5 (148x210)</div>
                      <div className="text-[10px] font-normal opacity-80">Popularny w Empik i Polsce</div>
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-[#a8937e] mt-1">
                    Automatycznie uwzględnia margines grzbietowy 20 mm (0.8") niezbędny do oprawy klejonej.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isGenerating}
                  className="w-full py-4 px-6 rounded-2xl bg-linear-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white font-bold text-sm sm:text-base shadow-lg shadow-amber-900/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{isTranslating ? 'Tłumaczenie treści na wybrany język...' : 'Generowanie pliku...'}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>
                        Pobierz {selectedFormat.toUpperCase()} ({exportScope === 'year' ? `Tom Rok ${selectedYear} - 365 Dni` : `Rozdział Dnia`})
                      </span>
                    </>
                  )}
                </button>
              </div>

              {downloadSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{downloadSuccess}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'uploaded' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Poniżej znajdują się oryginalne pliki wgrane przez Dominika Kutę w Panelu Autora:
                </p>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  {sectionUploads.length} plików
                </span>
              </div>

              {sectionUploads.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-stone-300 dark:border-[#423425] bg-stone-50/50 dark:bg-[#1f1a14]">
                  <FileText className="w-10 h-10 mx-auto text-stone-400 mb-2" />
                  <h4 className="font-bold text-sm text-stone-700 dark:text-stone-300">Brak wgranych plików</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-1">
                    Możesz w każdej chwili wgrać własne pliki PDF, ePUB lub DOCX w Panelu Administratora lub wygenerować je w zakładce „Generuj PDF, DOCX, ePUB”.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sectionUploads.map(file => {
                    const isEpub = file.originalName.toLowerCase().endsWith('.epub') || file.format === 'epub';
                    const isDocx = file.originalName.toLowerCase().endsWith('.docx') || file.format === 'docx';
                    const badge = isEpub ? 'ePUB' : isDocx ? 'DOCX' : 'PDF';
                    const badgeColor = isEpub 
                      ? 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : isDocx
                      ? 'bg-blue-600/20 text-blue-700 dark:text-blue-400 border-blue-500/30'
                      : 'bg-red-600/20 text-red-700 dark:text-red-400 border-red-500/30';

                    return (
                      <div
                        key={file.id}
                        className="p-3.5 rounded-2xl border border-stone-200 dark:border-[#3d3023] bg-white dark:bg-[#251f18] flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold border shrink-0 ${badgeColor}`}>
                            {badge}
                          </span>
                          <div className="overflow-hidden">
                            <h4 className="text-xs font-bold text-stone-900 dark:text-white truncate">
                              {file.title || file.originalName}
                            </h4>
                            <p className="text-[11px] text-stone-500 dark:text-[#a8937e]">
                              {Math.round(file.size / 1024)} KB • {new Date(file.uploadedAt).toLocaleDateString('pl-PL')}
                            </p>
                          </div>
                        </div>

                        <a
                          href={file.url}
                          download={file.originalName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl bg-amber-600/15 hover:bg-amber-600/25 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Pobierz</span>
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'platforms' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <strong className="block text-sm font-semibold mb-0.5">Platformy za 0 zł opłat wstępnych:</strong>
                  Wszystkie pliki wygenerowane przez aplikację (PDF POD 6x9"/A5, Word DOCX oraz ePUB) spełniają wytyczne techniczne największych bezpłatnych dystrybutorów książek papierowych i elektronicznych.
                </div>
              </div>

              {/* Grid of Platforms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Amazon KDP */}
                <div className="p-4 rounded-2xl border border-stone-200 dark:border-[#3d3023] bg-white dark:bg-[#251f18] space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Amazon KDP (Kindle Direct Publishing)
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      0 zł na start
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    Druk książki papierowej na żądanie (Paperback 6x9", Hardcover) oraz e-book na cały świat (Amazon.pl, Amazon.de, Amazon.com).
                  </p>
                  <ul className="text-[11px] text-stone-500 dark:text-stone-400 space-y-1 list-disc list-inside">
                    <li>Darmowy numer ISBN od Amazon</li>
                    <li>Format: Wybierz <strong>PDF POD 6x9"</strong> lub <strong>Word DOCX</strong></li>
                    <li>Amazon sam drukuje i wysyła egzemplarze kupującym</li>
                  </ul>
                </div>

                {/* Empik Selfpublishing */}
                <div className="p-4 rounded-2xl border border-stone-200 dark:border-[#3d3023] bg-white dark:bg-[#251f18] space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      Empik Selfpublishing & Empik Go
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      0 zł na start
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    Sprzedaż książki drukowanej w sklepie Empik.com, salonach Empik oraz e-booka w abonamencie Empik Go.
                  </p>
                  <ul className="text-[11px] text-stone-500 dark:text-stone-400 space-y-1 list-disc list-inside">
                    <li>Darmowy polski numer ISBN dla książki drukowanej i e-booka</li>
                    <li>Format druku: <strong>A5 lub 6x9"</strong> (oprawa miękka/twarda)</li>
                    <li>Format ebooka: <strong>ePUB 3</strong> lub <strong>PDF</strong></li>
                  </ul>
                </div>

                {/* Ridero & Legimi */}
                <div className="p-4 rounded-2xl border border-stone-200 dark:border-[#3d3023] bg-white dark:bg-[#251f18] space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      Ridero & Legimi Distribution
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      0 zł na start
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    Automatyczna dystrybucja do Legimi, Virtualo, Woblink, Ebookpoint oraz sieci księgarskich w Polsce.
                  </p>
                  <ul className="text-[11px] text-stone-500 dark:text-stone-400 space-y-1 list-disc list-inside">
                    <li>Bezpłatny polski numer ISBN</li>
                    <li>Format: <strong>Word DOCX</strong> lub <strong>ePUB</strong></li>
                    <li>Obecność w bibliotekach cyfrowych i abonamencie Legimi</li>
                  </ul>
                </div>

                {/* Google Play Books & Apple Books */}
                <div className="p-4 rounded-2xl border border-stone-200 dark:border-[#3d3023] bg-white dark:bg-[#251f18] space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                      Google Play Books & Apple Books
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      0 zł na start
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    Dotarcie do ponad 3 miliardów użytkowników telefonów i tabletów z systemami Android oraz iOS na całym świecie.
                  </p>
                  <ul className="text-[11px] text-stone-500 dark:text-stone-400 space-y-1 list-disc list-inside">
                    <li>0 zł za konto wydawcy i dodanie książki</li>
                    <li>Wymagany format: <strong>ePUB 3</strong> lub <strong>PDF</strong></li>
                    <li>Wypłata tantiem do 70% bezpośrednio na polskie konto bankowe</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 dark:bg-[#1b1712] border-t border-stone-200 dark:border-[#33281c] flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Wszystkie formaty (PDF, DOCX, ePUB) 100% sprawne z polskimi znakami</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-300 dark:border-[#4d3d2e] bg-white dark:bg-[#2a231b] hover:bg-stone-100 dark:hover:bg-[#382f25] text-stone-800 dark:text-white font-semibold transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
