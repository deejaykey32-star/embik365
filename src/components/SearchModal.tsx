import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  X, 
  Calendar, 
  BookOpen, 
  ArrowRight, 
  Filter, 
  FileText,
  Sparkles,
  Tag,
  Check,
  Layers
} from 'lucide-react';
import { SectionId, CycleDate, SectionEntry } from '../types';
import { SECTIONS, getSectionById } from '../data/defaultSections';
import { CYCLE_DAYS } from '../utils/dateCycle';
import { getEntryForSectionAndDate } from '../data/sampleEntries';

export interface SearchResultItem {
  id: string;
  sectionId: SectionId;
  sectionName: string;
  sectionBadge: string;
  accentColor: string;
  date: CycleDate;
  title: string;
  subtitle?: string;
  matchedField: 'Tytuł' | 'Treść' | 'Modlitwa' | 'Tajemnica' | 'Fragment';
  snippet: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSectionId: SectionId;
  onSelectResult: (sectionId: SectionId, date: CycleDate) => void;
  customEntries?: Record<string, SectionEntry>;
}

// Popular suggested search keywords
const SUGGESTED_TAGS = [
  'Cisza',
  'Boże Narodzenie',
  'Różaniec',
  'Przebaczenie',
  'Modlitwa',
  'Miłość',
  'Wcielenie',
  'Pokój',
  'Zaufanie',
  'Światło'
];

function getSnippet(fullText: string, query: string): string {
  const clean = fullText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const lower = clean.toLowerCase();
  const qLower = query.toLowerCase();
  const idx = lower.indexOf(qLower);

  if (idx === -1) {
    return clean.slice(0, 140) + (clean.length > 140 ? '...' : '');
  }

  const start = Math.max(0, idx - 50);
  const end = Math.min(clean.length, idx + query.length + 80);
  
  let snippet = clean.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < clean.length) snippet = snippet + '...';

  return snippet;
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim()) return <>{text}</>;
  
  const q = query.trim();
  const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-300 dark:bg-amber-500/60 text-[#2c1a0e] dark:text-amber-100 font-bold px-1 py-0.5 rounded-xs">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  currentSectionId,
  onSelectResult,
  customEntries
}) => {
  const [query, setQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'all' | 'current' | string>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  const currentSectionMeta = getSectionById(currentSectionId);

  // Focus input on modal open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Perform search across the 365 days of the selected section(s)
  const results = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const targetSections = searchScope === 'all'
      ? SECTIONS.map(s => s.id)
      : searchScope === 'current'
        ? [currentSectionId]
        : [searchScope as SectionId];

    const found: SearchResultItem[] = [];
    const qLower = trimmed.toLowerCase();

    // Iterate through targeted sections
    for (const secId of targetSections) {
      const secMeta = getSectionById(secId);

      // Iterate through 365 calendar days
      for (const dateObj of CYCLE_DAYS) {
        const entry = getEntryForSectionAndDate(secId, dateObj, customEntries);
        let matchedField: 'Tytuł' | 'Treść' | 'Modlitwa' | 'Tajemnica' | 'Fragment' | null = null;
        let matchSource = '';

        if (entry.title && entry.title.toLowerCase().includes(qLower)) {
          matchedField = 'Tytuł';
          matchSource = entry.content || entry.title;
        } else if (entry.content && entry.content.toLowerCase().includes(qLower)) {
          matchedField = 'Treść';
          matchSource = entry.content;
        } else if (entry.prayer && entry.prayer.toLowerCase().includes(qLower)) {
          matchedField = 'Modlitwa';
          matchSource = entry.prayer;
        } else if (entry.mystery && entry.mystery.toLowerCase().includes(qLower)) {
          matchedField = 'Tajemnica';
          matchSource = entry.mystery;
        } else if (entry.passage && entry.passage.toLowerCase().includes(qLower)) {
          matchedField = 'Fragment';
          matchSource = entry.passage;
        }

        if (matchedField && matchSource) {
          found.push({
            id: `${secId}-${dateObj.dateKey}`,
            sectionId: secId,
            sectionName: secMeta.name,
            sectionBadge: secMeta.shortTitle,
            accentColor: secMeta.accentColor,
            date: dateObj,
            title: entry.title || `Dzień ${dateObj.dayNumber}`,
            subtitle: entry.subtitle,
            matchedField,
            snippet: getSnippet(matchSource, trimmed)
          });
        }

        // Limit results max to 100 for fast UI performance
        if (found.length >= 100) break;
      }
      if (found.length >= 100) break;
    }

    return found;
  }, [query, searchScope, currentSectionId, customEntries]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-[#faf8f4] dark:bg-[#0d131f] w-full max-w-3xl rounded-3xl shadow-2xl border border-[#dbcabb] dark:border-[#212b3c] my-4 sm:my-8 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Search Header Bar with Input */}
        <div className="p-4 sm:p-6 bg-white dark:bg-[#121927] border-b border-[#e2d5c6] dark:border-[#1e2738] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-600/15 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                <Search className="w-4 h-4" />
              </div>
              <h2 className="font-heading-cinzel font-bold text-base sm:text-lg text-[#2e2319] dark:text-[#f1f5f9]">
                Wyszukiwarka Treści Droga365
              </h2>
            </div>
            <button
              onClick={onClose}
              id="btn-close-search-modal"
              className="p-1.5 rounded-xl hover:bg-[#ede3d5] dark:hover:bg-[#1b2333] text-[#5e4e3e] dark:text-[#94a3b8] cursor-pointer transition-colors"
              title="Zamknij (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Search Input Field */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8a7967] dark:text-[#94a3b8]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='Wpisz szukaną frazę (np. "Cisza", "Boże Narodzenie", "Różaniec", "Przebaczenie")...'
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-[#f5ecdf] dark:bg-[#182130] text-[#2c221a] dark:text-white placeholder-[#8c7967] dark:placeholder-[#64748b] text-sm font-medium border border-[#d8c8b5] dark:border-[#283549] focus:outline-hidden focus:border-amber-600 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-inner"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[#8c7967] dark:text-[#94a3b8] cursor-pointer"
                title="Wyczyść frazę"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Scope Selector: All Sections vs Current Section vs Individual Section */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-[#716152] dark:text-[#94a3b8] font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Zakres:
            </span>

            {/* Scope Option: All Sections */}
            <button
              onClick={() => setSearchScope('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                searchScope === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-[#ebe0d3] dark:bg-[#182130] text-[#524334] dark:text-[#cbd5e1] hover:bg-[#e2d5c5] dark:hover:bg-[#202b3d]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Wszystkie sekcje</span>
            </button>

            {/* Scope Option: Current Active Section */}
            <button
              onClick={() => setSearchScope('current')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                searchScope === 'current'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-[#ebe0d3] dark:bg-[#182130] text-[#524334] dark:text-[#cbd5e1] hover:bg-[#e2d5c5] dark:hover:bg-[#202b3d]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Tylko sekcja {currentSectionMeta.shortTitle}</span>
            </button>

            {/* Specific Section Selector Dropdown */}
            <select
              value={searchScope === 'all' || searchScope === 'current' ? '' : searchScope}
              onChange={e => {
                if (e.target.value) setSearchScope(e.target.value);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-[#ebe0d3] dark:bg-[#182130] text-[#524334] dark:text-[#cbd5e1] font-semibold border-0 cursor-pointer focus:outline-hidden"
              title="Wybierz konkretny tom do przeszukania"
            >
              <option value="">Wybierz inny tom...</option>
              {SECTIONS.map(s => (
                <option key={s.id} value={s.id} className="dark:bg-[#182130] dark:text-white">
                  {s.name} ({s.shortTitle})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Results Area (Displayed directly under search input field) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {/* Direct Search Stats Banner */}
          {query.trim().length >= 2 && (
            <div className="flex items-center justify-between text-xs text-[#716152] dark:text-[#94a3b8] pb-1 border-b border-[#e2d5c6]/60 dark:border-[#1e2738]/60">
              <span>
                Znaleziono <strong className="text-amber-800 dark:text-amber-400 font-bold">{results.length}</strong> wyników dla frazy <strong className="text-[#2c221a] dark:text-white font-bold">"{query}"</strong>
              </span>
              <span className="font-mono text-[11px]">
                Zakres: {searchScope === 'all' ? 'Wszystkie 7 tomów' : searchScope === 'current' ? currentSectionMeta.name : getSectionById(searchScope).name}
              </span>
            </div>
          )}

          {/* Empty Query / Suggested Tags */}
          {query.trim().length < 2 && (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading-cinzel font-bold text-[#35281d] dark:text-[#f1f5f9] text-base">
                  Wpisz przynajmniej 2 znaki, aby rozpocząć przeszukiwanie
                </h3>
                <p className="text-xs text-[#786858] dark:text-[#94a3b8] mt-1">
                  System przeszuka wszystkie 365 dni oraz wszystkie sekcje e-booków i rozważań.
                </p>
              </div>

              {/* Popular tags buttons */}
              <div className="pt-2">
                <p className="text-xs text-[#8c7967] dark:text-[#64748b] font-medium mb-2">Popularne frazy do wyszukania:</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {SUGGESTED_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="px-3 py-1 rounded-full bg-[#eee3d5] dark:bg-[#182130] hover:bg-amber-600 hover:text-white text-[#4e3f31] dark:text-[#cbd5e1] text-xs font-medium transition-colors cursor-pointer"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* No Results Found */}
          {query.trim().length >= 2 && results.length === 0 && (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-heading-cinzel font-bold text-base text-[#35281d] dark:text-[#f1f5f9]">
                Brak wyników dla frazy "{query}"
              </h3>
              <p className="text-xs text-[#786858] dark:text-[#94a3b8]">
                Spróbuj wpisać inną frazę lub przełącz zakres na "Wszystkie sekcje".
              </p>
            </div>
          )}

          {/* Results List */}
          {results.map(item => (
            <div
              key={item.id}
              onClick={() => {
                onSelectResult(item.sectionId, item.date);
                onClose();
              }}
              className="p-4 rounded-2xl bg-white dark:bg-[#121927] hover:bg-[#f6efe6] dark:hover:bg-[#1b2538] border border-[#e2d5c6] dark:border-[#1e2738] shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300/40">
                    {item.sectionBadge}
                  </span>
                  <span className="text-xs font-semibold text-[#6e5d4e] dark:text-[#94a3b8] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {item.date.displayDate} • Dzień {item.date.dayNumber} z 365
                  </span>
                </div>

                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/40">
                  Dopasowanie w: {item.matchedField}
                </span>
              </div>

              {/* Title */}
              <h4 className="font-heading-cinzel font-bold text-sm sm:text-base text-[#281e15] dark:text-[#f1f5f9] group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                <HighlightedText text={item.title} query={query} />
              </h4>

              {/* Matched Snippet */}
              <p className="text-xs font-serif-book text-[#4a3e33] dark:text-[#cbd5e1] leading-relaxed bg-[#faf6f0] dark:bg-[#0b0f17] p-2.5 rounded-xl border border-black/5 dark:border-white/5">
                "<HighlightedText text={item.snippet} query={query} />"
              </p>

              {/* Bottom Action Link */}
              <div className="flex items-center justify-between pt-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <span className="text-[11px] text-[#8c7967] dark:text-[#64748b]">
                  Sekcja: {item.sectionName}
                </span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Przejdź do tego wpisu <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-white dark:bg-[#121927] border-t border-[#e2d5c6] dark:border-[#1e2738] flex items-center justify-between text-xs text-[#786858] dark:text-[#94a3b8]">
          <span>
            Naciśnij <kbd className="px-1.5 py-0.5 rounded bg-[#ebdccb] dark:bg-[#1b2333] font-mono text-[11px]">Esc</kbd>, aby zamknąć
          </span>
          <span className="font-medium">
            Klawiatura: użyj <kbd className="px-1.5 py-0.5 rounded bg-[#ebdccb] dark:bg-[#1b2333] font-mono text-[11px]">Ctrl+K</kbd> w dowolnym miejscu
          </span>
        </div>

      </div>
    </div>
  );
};
