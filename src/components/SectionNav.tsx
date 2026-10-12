import React, { useEffect, useRef } from 'react';
import { 
  Feather, 
  Cross, 
  BookOpen, 
  BookMarked, 
  Compass, 
  Library, 
  HeartHandshake,
  Image as ImageIcon,
  MapPin,
  Map,
  Gamepad2,
  Sparkles,
  Radio,
  Video,
  EyeOff,
  Smartphone,
  Settings
} from 'lucide-react';
import { SectionId, AdminUser } from '../types';
import { SECTIONS } from '../data/defaultSections';
import { getTranslatedSectionMeta } from '../utils/translationService';

interface Props {
  activeSection: SectionId;
  onSelectSection: (id: SectionId) => void;
  pdfCounts?: Record<string, number>;
  currentLang?: string;
  adminUser?: AdminUser | null;
  hiddenSectionIds?: string[];
}

const ICONS: Record<string, React.ElementType> = {
  Feather,
  Cross,
  BookOpen,
  Book: BookMarked,
  Compass,
  Library,
  HeartHandshake,
  Image: ImageIcon,
  MapPin,
  Map,
  Gamepad2,
  Sparkles,
  Radio,
  Video,
  Smartphone,
  Settings
};

export const SectionNav: React.FC<Props> = ({
  activeSection,
  onSelectSection,
  pdfCounts = {},
  currentLang = 'pl',
  adminUser,
  hiddenSectionIds = []
}) => {
  const visibleSections = SECTIONS.filter(sec => {
    if (sec.id === 'info365' || sec.id === 'ustawienia') return true;
    if (adminUser) return true;
    return !hiddenSectionIds.includes(sec.id);
  });

  const scrollerRef = useRef<HTMLDivElement>(null);

  // Keep the active tab visible inside the horizontally scrolling row
  useEffect(() => {
    const el = scrollerRef.current?.querySelector<HTMLElement>(`#nav-section-${activeSection}`);
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [activeSection]);

  const badgeFor = (sec: typeof SECTIONS[number]) => {
    if (sec.type === 'flipbook') return 'Kartki';
    if (sec.type !== 'info') return null;
    return sec.id === 'histada' ? 'Gra' : sec.id === 'mapa' ? 'Mapa' : sec.id === 'grafika' ? 'Media' : sec.id === 'ustawienia' ? 'PWA' : 'Start';
  };

  return (
    <nav aria-label="Sekcje aplikacji" className="bg-[var(--c-surface)] border-b border-[var(--c-border)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
        <div
          ref={scrollerRef}
          className="flex items-stretch gap-1.5 sm:gap-2 py-2 px-3 sm:px-0 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-proximity scroll-fade-x xl:flex-wrap xl:overflow-visible xl:[mask-image:none]"
        >
          {visibleSections.map((sec) => {
            const IconComponent = ICONS[sec.icon] || BookOpen;
            const isActive = activeSection === sec.id;
            const hasPdf = (pdfCounts[sec.id] || 0) > 0;
            const meta = getTranslatedSectionMeta(sec, currentLang);
            const isHiddenForVisitors = hiddenSectionIds.includes(sec.id);
            const badge = badgeFor(sec);

            return (
              <button
                key={sec.id}
                id={`nav-section-${sec.id}`}
                onClick={() => onSelectSection(sec.id)}
                aria-current={isActive ? 'page' : undefined}
                title={meta.shortTitle}
                className={`snap-start relative flex items-center gap-2 pl-1.5 pr-3 min-h-10 rounded-xl whitespace-nowrap text-[13px] font-semibold transition-colors shrink-0 cursor-pointer border ${
                  isActive
                    ? 'bg-[#2f251c] dark:bg-amber-500 text-white dark:text-[#1a1206] border-transparent shadow-sm'
                    : isHiddenForVisitors
                    ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-900/60'
                    : 'bg-[var(--c-card)] hover:border-[var(--c-accent)] text-[var(--c-text-soft)] border-[var(--c-border)]'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-white/15 dark:bg-black/15 text-amber-300 dark:text-[#1a1206]'
                      : 'bg-[var(--c-accent-soft)] text-[var(--c-accent)]'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                </span>

                <span className="text-left leading-tight">
                  <span className="flex items-center gap-1.5">
                    <span>{meta.name}</span>
                    {badge && (
                      <span className={`hidden sm:inline text-[10px] px-1.5 py-px rounded-md font-bold ${
                        isActive ? 'bg-white/15 dark:bg-black/15' : 'bg-[var(--c-accent-soft)] text-[var(--c-accent)]'
                      }`}>
                        {badge}
                      </span>
                    )}
                    {isHiddenForVisitors && (
                      <span className="text-[10px] px-1.5 py-px rounded-md bg-rose-600 text-white font-bold inline-flex items-center gap-0.5" title="Sekcja ukryta dla odwiedzających">
                        <EyeOff className="w-2.5 h-2.5" />
                        <span>Ukryta</span>
                      </span>
                    )}
                  </span>
                </span>

                {hasPdf && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" title="Zawiera plik PDF" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
