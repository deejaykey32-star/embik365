import React, { useState, useMemo } from 'react';
import {
  Video,
  Play,
  Film,
  Sparkles,
  Layers,
  Clock,
  Radio,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Info,
  CheckCircle2,
  Tv,
  QrCode,
  ArrowLeft,
  Sliders,
  Volume2,
  ExternalLink,
  Flame,
  MonitorPlay
} from 'lucide-react';
import {
  RADIO_STATIONS,
  RadioStationId,
  RadioStationMeta,
  getRadioBroadcastItem,
  RadioBroadcastItem
} from '../utils/radioContentService';
import { generateAndDownloadQrBadgePng, getQrCodeForSection } from '../utils/qrCodeService';
import { VideoYouTubeExportModal } from './VideoYouTubeExportModal';
import { SectionGuidePlayerBar } from './SectionGuidePlayerBar';

interface Props {
  onBackToHome?: () => void;
  currentLang?: string;
  theme?: 'light' | 'dark';
}

export const VideoStudioView: React.FC<Props> = ({
  onBackToHome,
  currentLang = 'pl',
  theme = 'light'
}) => {
  const [selectedStationId, setSelectedStationId] = useState<RadioStationId>('nowyrhz');
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [selectedBibliaYear, setSelectedBibliaYear] = useState<1 | 2 | 3 | 4>(1);
  const [searchFilter, setSearchFilter] = useState('');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);

  const activeStation = useMemo(() => {
    return RADIO_STATIONS.find(s => s.id === selectedStationId) || RADIO_STATIONS[0];
  }, [selectedStationId]);

  const safeDayNumber = Math.max(1, Math.min(activeStation.totalDays, selectedDayNumber));

  const activeBroadcastItem: RadioBroadcastItem = useMemo(() => {
    return getRadioBroadcastItem(selectedStationId, safeDayNumber, selectedBibliaYear);
  }, [selectedStationId, safeDayNumber, selectedBibliaYear]);

  // List of all items in current station for quick picker
  const allStationItems = useMemo(() => {
    const list: { day: number; title: string; subtitle: string; ref?: string }[] = [];
    for (let d = 1; d <= activeStation.totalDays; d++) {
      const item = getRadioBroadcastItem(selectedStationId, d, selectedBibliaYear);
      list.push({
        day: d,
        title: item.headlineTitle,
        subtitle: item.subtitle,
        ref: item.reference
      });
    }
    return list;
  }, [selectedStationId, activeStation.totalDays, selectedBibliaYear]);

  const filteredItems = useMemo(() => {
    if (!searchFilter.trim()) return allStationItems;
    const q = searchFilter.toLowerCase();
    return allStationItems.filter(
      item =>
        item.day.toString().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        (item.ref && item.ref.toLowerCase().includes(q))
    );
  }, [allStationItems, searchFilter]);

  const handleDownloadQr = async () => {
    setDownloadingQr(true);
    try {
      const sectionQr = getQrCodeForSection('wideo', 'Generator Wideo YouTube (MP4)');
      await generateAndDownloadQrBadgePng(sectionQr);
    } catch (err) {
      console.error('Error generating QR badge:', err);
    } finally {
      setDownloadingQr(false);
    }
  };

  const wordCount = useMemo(() => {
    const text = activeBroadcastItem.speechText || '';
    return text.trim().split(/\s+/).filter(Boolean).length;
  }, [activeBroadcastItem]);

  const estMinutes = Math.max(1, Math.round(wordCount / 130));

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#080d1a] text-[#2c2621] dark:text-[#e6edf3] pb-24 transition-colors">
      
      {/* 1. Header Bar */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#180808] via-[#100609] to-[#0a0408] text-white border-b border-red-500/30 py-10 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Wróć do strony głównej</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadQr}
                disabled={downloadingQr}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Pobierz kod QR generatora wideo jako grafikę PNG"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>{downloadingQr ? 'Generowanie...' : 'Kod QR (PNG)'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-wider">
                <Video className="w-3.5 h-3.5 animate-pulse" />
                <span>Studio Wideo • Generator YouTube MP4</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-book tracking-tight leading-tight text-white">
                Generator Plików Wideo MP4 <br />
                <span className="bg-gradient-to-r from-red-400 via-rose-300 to-amber-300 bg-clip-text text-transparent">
                  dla Serwisu YouTube
                </span>
              </h1>

              <p className="text-sm sm:text-base text-stone-300 font-sans-ui max-w-2xl leading-relaxed">
                Generuj gotowe filmy Full HD (1080p lub 720p) z czarnym tłem (16:9), animacją koralików różańca (RGBA/CMYK), wbudowanym lektorem syntezy mowy oraz synchronizowanymi słowo po słowie napisami karaoke. Cały proces odbywa się bezpośrednio w Twojej przeglądarce.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsVideoModalOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-xl shadow-red-950/50 hover:shadow-2xl transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Uruchom Generator Wideo MP4</span>
                </button>
              </div>

              {/* Lektor AI Audio Guide Bar */}
              <div className="pt-2">
                <SectionGuidePlayerBar 
                  sectionId="wideo" 
                  currentLang={currentLang} 
                  variant="banner" 
                />
              </div>
            </div>

            {/* Video mockup frame */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-red-500/40 bg-black shadow-2xl p-4 sm:p-5 text-white font-sans-ui aspect-video flex flex-col justify-between">
                
                <div className="flex items-center justify-between text-[11px] text-stone-400 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                    <span className="font-bold text-red-400 uppercase tracking-wider">REC • 1080p FULL HD</span>
                  </div>
                  <span className="font-mono text-amber-300">Format: MP4 (H.264)</span>
                </div>

                <div className="my-auto text-center space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-amber-400">
                    {activeStation.name} • Dzień {safeDayNumber}
                  </div>
                  <div className="font-serif-book font-bold text-sm sm:text-base text-stone-100 line-clamp-1">
                    {activeBroadcastItem.headlineTitle}
                  </div>
                  {/* Karaoke simulated subtitle */}
                  <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 inline-block max-w-full">
                    <span className="text-xs sm:text-sm text-stone-400 font-serif">
                      „...Zanim Abraham stał się, <span className="text-amber-300 font-bold bg-amber-500/20 px-1 rounded-sm">JA JESTEM</span>...”
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-400 pt-2 border-t border-white/10">
                  <span>Czasy i dopowiedzenia zsynchronizowane</span>
                  <span className="font-mono text-emerald-400">YouTube 16:9 Gotowe</span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 2. Station Selector Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold font-serif-book">
              Krok 1: Wybierz Stację / Dzieło do Wygenerowania
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Każde dzieło ma własny szablon wideo, animacje koralików i bazę tekstową.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {RADIO_STATIONS.map((station) => {
            const isSelected = station.id === selectedStationId;
            return (
              <div
                key={station.id}
                onClick={() => {
                  setSelectedStationId(station.id);
                  if (selectedDayNumber > station.totalDays) {
                    setSelectedDayNumber(1);
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-gradient-to-b from-red-950/30 to-amber-950/20 border-red-500 shadow-md ring-1 ring-red-500/50'
                    : 'bg-white dark:bg-[#0f172a] border-stone-200 dark:border-stone-800 hover:border-red-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-red-600 text-white' : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}>
                    {station.badge}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-red-500" />
                  )}
                </div>

                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 mb-1">
                  {station.name}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                  {station.description}
                </p>

                <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800/60 flex items-center justify-between text-[11px] text-stone-500">
                  <span>Łącznie pozycji:</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{station.totalDays}</span>
                </div>
              </div>
            );
          })}
        </div>

      </section>

      {/* 3. Day / Mystery Selector & Item Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Lewa kolumna: Lista i wyszukiwarka pozycji */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold font-serif-book">
                Krok 2: Wybierz Dzień lub Tajemnicę
              </h2>
              <span className="text-xs font-mono text-stone-500">
                {filteredItems.length} pozycji
              </span>
            </div>

            {selectedStationId === 'biblia365' && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                <span className="font-medium text-emerald-800 dark:text-emerald-300">Cykl czytań Pisma Świętego:</span>
                <div className="flex items-center gap-1 font-bold">
                  {([1, 2, 3, 4] as const).map(year => (
                    <button
                      key={year}
                      onClick={() => setSelectedBibliaYear(year)}
                      className={`px-2 py-0.5 rounded-lg text-xs cursor-pointer ${
                        selectedBibliaYear === year
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      Rok {year}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Wyszukiwarka */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Szukaj po numerze, tytule lub fragmencie..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-[#0f172a] border border-stone-300 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>

            {/* Lista kafelków */}
            <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1 custom-scrollbar rounded-xl border border-stone-200 dark:border-stone-800 p-2 bg-stone-50/50 dark:bg-[#0c1220]">
              {filteredItems.map((item) => {
                const isSelected = item.day === safeDayNumber;
                return (
                  <div
                    key={item.day}
                    onClick={() => setSelectedDayNumber(item.day)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-600 text-white border-red-600 shadow-sm'
                        : 'bg-white dark:bg-[#131d31] border-stone-200 dark:border-stone-800/80 hover:border-red-400 text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className={isSelected ? 'text-white' : 'text-red-700 dark:text-red-400'}>
                        {selectedStationId === 'nowyrhz' ? `Tajemnica ${item.day}` : `Dzień ${item.day}`}
                      </span>
                      {item.ref && (
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-stone-500'}`}>
                          {item.ref}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-xs leading-snug line-clamp-1">
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className={`text-[11px] line-clamp-1 mt-0.5 ${isSelected ? 'text-white/80' : 'text-stone-500 dark:text-stone-400'}`}>
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

          {/* Prawa kolumna: Szczegółowy podgląd wybranej pozycji + Przycisk generowania */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold font-serif-book">
                Krok 3: Podgląd Treści i Rozpoczęcie Generowania
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedDayNumber(Math.max(1, safeDayNumber - 1))}
                  disabled={safeDayNumber <= 1}
                  className="p-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 disabled:opacity-30 cursor-pointer"
                  title="Poprzednia pozycja"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold px-2">
                  {safeDayNumber} / {activeStation.totalDays}
                </span>
                <button
                  onClick={() => setSelectedDayNumber(Math.min(activeStation.totalDays, safeDayNumber + 1))}
                  disabled={safeDayNumber >= activeStation.totalDays}
                  className="p-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 disabled:opacity-30 cursor-pointer"
                  title="Następna pozycja"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-[#0f172a] border border-stone-200 dark:border-stone-800 shadow-md space-y-5">
              
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">
                  <span>{activeStation.name}</span>
                  <span>•</span>
                  <span>Pozycja {safeDayNumber} z {activeStation.totalDays}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-serif-book text-stone-900 dark:text-stone-100">
                  {activeBroadcastItem.headlineTitle}
                </h3>
                {activeBroadcastItem.subtitle && (
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                    {activeBroadcastItem.subtitle}
                  </p>
                )}
              </div>

              {/* Informacje statystyczne o wideo */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-[#152035] border border-stone-200 dark:border-stone-800/80 text-center">
                <div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold">Liczba słów</div>
                  <div className="text-sm sm:text-base font-bold font-mono text-stone-900 dark:text-stone-100">{wordCount}</div>
                </div>
                <div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold">Szacowany czas</div>
                  <div className="text-sm sm:text-base font-bold font-mono text-amber-600 dark:text-amber-400">~{estMinutes} min</div>
                </div>
                <div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold">Rozdzielczość</div>
                  <div className="text-sm sm:text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">1080p / 720p</div>
                </div>
              </div>

              {/* Podgląd tekstu lektora */}
              <div>
                <div className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5 flex items-center justify-between">
                  <span>Podgląd tekstu do przeczytania przez lektora:</span>
                  <span className="text-[10px] text-stone-400">Napisy zsynchronizowane w wideo</span>
                </div>
                <div className="max-h-48 overflow-y-auto p-4 rounded-2xl bg-stone-100 dark:bg-[#070b14] border border-stone-200 dark:border-stone-800 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-serif leading-relaxed whitespace-pre-line custom-scrollbar">
                  {activeBroadcastItem.displayContent || activeBroadcastItem.speechText}
                </div>
              </div>

              {/* Wielki przycisk akcji: Uruchom generator wideo */}
              <div className="pt-2">
                <button
                  onClick={() => setIsVideoModalOpen(true)}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-base sm:text-lg flex items-center justify-center gap-3 shadow-xl shadow-red-950/40 hover:shadow-2xl transition-all cursor-pointer hover:scale-[1.01] active:scale-95"
                >
                  <Video className="w-6 h-6 animate-pulse" />
                  <span>Otwórz Generator i Nagraj Wideo MP4</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* 4. Poradnik i Checklist Publikacji na YouTube */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-stone-900 via-[#101827] to-[#0a0f1d] text-white border border-red-500/30 shadow-xl space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-bold font-serif-book">
                Jak opublikować wygenerowany plik na kanale YouTube?
              </h3>
            </div>
            <span className="text-xs text-amber-400 font-mono font-bold">
              100% Zgodność z YouTube Full HD
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-red-600/30 text-red-400 font-bold flex items-center justify-center">1</div>
              <div className="font-bold text-sm text-stone-100">Kliknij Generuj</div>
              <p className="text-stone-400 leading-relaxed">
                Wybierz stację i dzień, kliknij nagraj, a przeglądarka wyrenderuje obraz z dźwiękiem w czasie rzeczywistym.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-red-600/30 text-red-400 font-bold flex items-center justify-center">2</div>
              <div className="font-bold text-sm text-stone-100">Pobierz plik MP4</div>
              <p className="text-stone-400 leading-relaxed">
                Po zakończeniu nagrania kliknij „Pobierz wideo MP4”. Plik zostanie zapisany w Twoim folderze Pobrane.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-red-600/30 text-red-400 font-bold flex items-center justify-center">3</div>
              <div className="font-bold text-sm text-stone-100">Wgraj na YouTube</div>
              <p className="text-stone-400 leading-relaxed">
                Przejdź do YouTube Studio (studio.youtube.com), kliknij Utwórz → Prześlij film i upuść pobrany plik MP4.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-red-600/30 text-red-400 font-bold flex items-center justify-center">4</div>
              <div className="font-bold text-sm text-stone-100">Czarne tło i OLED</div>
              <p className="text-stone-400 leading-relaxed">
                Wideo posiada czyste tło #000000, dzięki czemu idealnie prezentuje się na ekranach TV, smartfonach oraz w trybie ciemnym.
              </p>
            </div>

          </div>

        </div>

      </section>

      {/* 5. Modal Generatora Wideo MP4 */}
      {isVideoModalOpen && (
        <VideoYouTubeExportModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          broadcastItem={activeBroadcastItem}
          stationMeta={activeStation}
          currentDayNumber={safeDayNumber}
          totalDays={activeStation.totalDays}
        />
      )}

    </div>
  );
};
