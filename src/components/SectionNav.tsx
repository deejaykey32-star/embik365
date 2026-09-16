import React from 'react';
import { 
  Feather, 
  Cross, 
  BookOpen, 
  BookMarked, 
  Compass, 
  Library, 
  HeartHandshake,
  Image as ImageIcon
} from 'lucide-react';
import { SectionId } from '../types';
import { SECTIONS } from '../data/defaultSections';
import { getTranslatedSectionMeta } from '../utils/translationService';

interface Props {
  activeSection: SectionId;
  onSelectSection: (id: SectionId) => void;
  pdfCounts?: Record<string, number>;
  currentLang?: string;
}

const ICONS: Record<string, React.ElementType> = {
  Feather,
  Cross,
  BookOpen,
  Book: BookMarked,
  Compass,
  Library,
  HeartHandshake,
  Image: ImageIcon
};

export const SectionNav: React.FC<Props> = ({
  activeSection,
  onSelectSection,
  pdfCounts = {},
  currentLang = 'pl'
}) => {
  return (
    <div className="bg-[#f7f2ea] dark:bg-[#0e131d] border-b border-[#e5d9cc] dark:border-[#1e2638] py-2.5 px-3 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 py-0.5">

          {SECTIONS.map((sec) => {
            const IconComponent = ICONS[sec.icon] || BookOpen;
            const isActive = activeSection === sec.id;
            const hasPdf = (pdfCounts[sec.id] || 0) > 0;
            const meta = getTranslatedSectionMeta(sec, currentLang);

            return (
              <button
                key={sec.id}
                id={`nav-section-${sec.id}`}
                onClick={() => onSelectSection(sec.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl whitespace-nowrap text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#2f251c] dark:bg-gradient-to-r dark:from-amber-600 dark:to-amber-700 text-white shadow-sm ring-1 ring-[#5a4838] dark:ring-amber-400/40 dark:shadow-[0_0_15px_rgba(217,119,6,0.3)]'
                    : 'bg-white dark:bg-[#151c28] hover:bg-[#eae0d2] dark:hover:bg-[#1d2636] text-[#4d3d2e] dark:text-[#c9d1d9] border border-[#dccdc0] dark:border-[#273244]'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    isActive 
                      ? 'bg-[#534132] dark:bg-black/30 text-amber-300' 
                      : 'bg-[#f4ebe1] dark:bg-[#202a3a] text-[#735339] dark:text-amber-400'
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                </div>

                <div className="text-left">
                  <div className="font-semibold leading-tight flex items-center gap-1.5">
                    <span>{meta.name}</span>
                    {sec.type === 'info' && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-sans-ui ${
                        isActive 
                          ? 'bg-violet-500/30 text-violet-200' 
                          : 'bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300'
                      }`}>
                        Start
                      </span>
                    )}
                    {sec.type === 'flipbook' && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-sans-ui ${
                        isActive 
                          ? 'bg-amber-500/20 text-amber-200' 
                          : 'bg-[#ede1d3] dark:bg-[#222d3e] text-[#735339] dark:text-amber-300'
                      }`}>
                        Kartki
                      </span>
                    )}
                  </div>
                  <div className={`text-[11px] leading-none truncate max-w-[130px] sm:max-w-none ${
                    isActive ? 'text-[#d6c7b7] dark:text-amber-100' : 'text-[#847363] dark:text-[#8b949e]'
                  }`}>
                    {meta.shortTitle}
                  </div>
                </div>

                {hasPdf && (
                  <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#151c28]" title="Zawiera wgrany plik PDF" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
