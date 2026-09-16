import React, { useState, useEffect } from 'react';
import { SectionMeta, AdminUser } from '../types';
import { 
  Layers, 
  Sparkles, 
  ShieldCheck, 
  Unlock, 
  Edit3, 
  Upload, 
  QrCode, 
  Image as ImageIcon,
  Save
} from 'lucide-react';
import { MediaLibraryViewer } from './MediaLibraryViewer';
import { ElementEditorModal } from './ElementEditorModal';
import { getHomePageConfig, saveHomePageConfig } from '../utils/homePageConfig';

interface MediaGallerySectionViewProps {
  section: SectionMeta;
  adminUser: AdminUser | null;
  onLogin?: (user: AdminUser) => void;
  onOpenAdmin?: () => void;
  onOpenQrModal?: () => void;
  currentLang?: string;
  customEntries?: Record<string, any>;
  onSaveEntryText?: (key: string, data: any) => void;
}

const DEFAULT_GRAFIKA_INTRO = `
  <div style="font-size: 16px; line-height: 1.7;">
    <p style="margin-bottom: 12px;">
      Witaj w oficjalnym <strong>Repozytorium Materiałów Graficznych i Media (Grafika365)</strong>. 
      Sekcja ta gromadzi wszystkie ilustracje, okładki książek, banery promocyjne, animowane pliki GIF, wideo oraz materiały interaktywne opublikowane i zarządzane przez administratora serwisu.
    </p>
    <p style="font-size: 15px; color: #86198f; background: rgba(192, 38, 211, 0.08); padding: 12px 18px; border-left: 4px solid #c026d3; border-radius: 0 12px 12px 0;">
      ✨ Każdy materiał posiada generowany w czasie rzeczywistym kod QR (PNG 300 DPI) oraz stały skrócony adres URL (clck.ru) gotowy do użycia w druku i publikacjach cyfrowych.
    </p>
  </div>
`;

export const MediaGallerySectionView: React.FC<MediaGallerySectionViewProps> = ({
  section,
  adminUser,
  onLogin,
  onOpenAdmin,
  onOpenQrModal,
  currentLang = 'pl',
  customEntries = {},
  onSaveEntryText
}) => {
  // Load intro HTML from customEntries or localStorage
  const [introHtml, setIntroHtml] = useState<string>(() => {
    if (customEntries['grafika_section_intro']?.content) {
      return customEntries['grafika_section_intro'].content;
    }
    try {
      const saved = localStorage.getItem('drogowskazy_grafika_intro');
      if (saved) return saved;
    } catch {}
    return DEFAULT_GRAFIKA_INTRO;
  });

  const [isEditingIntro, setIsEditingIntro] = useState<boolean>(false);

  // Sync intro text if updated in customEntries
  useEffect(() => {
    if (customEntries['grafika_section_intro']?.content) {
      setIntroHtml(customEntries['grafika_section_intro'].content);
    }
  }, [customEntries]);

  const handleSaveIntro = (newContent: string) => {
    setIntroHtml(newContent);
    try {
      localStorage.setItem('drogowskazy_grafika_intro', newContent);
    } catch {}

    if (onSaveEntryText) {
      onSaveEntryText('grafika_section_intro', {
        title: 'Wstęp Sekcji Materiały & Ilustracje',
        content: newContent,
        sectionId: 'grafika',
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleQuickLoginAuthor = () => {
    const user: AdminUser = {
      email: 'kuta.dominik@gmail.com',
      name: 'Dominik Kuta',
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    };
    if (onLogin) {
      onLogin(user);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 animate-fade-in text-[#2c2219] dark:text-[#f1f5f9]">
      
      {/* ADMIN CONTROL TOOLBAR */}
      {!adminUser ? (
        <div className="mb-6 p-4 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-fuchsia-950 dark:text-fuchsia-200">
            <Sparkles className="w-5 h-5 text-fuchsia-600 shrink-0" />
            <span className="font-medium">
              Chcesz edytować opis wprowadzenia tej sekcji za pomocą edytora WYSIWYG? Włącz tryb autora jednym kliknięciem:
            </span>
          </div>
          <button
            onClick={handleQuickLoginAuthor}
            className="px-4 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 shrink-0"
          >
            <Unlock className="w-4 h-4" />
            <span>Włącz Tryb Edycji Autora (WYSIWYG)</span>
          </button>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-200 font-bold">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>ZARZĄDZANIE SEKCJA MATERIAŁÓW I ILUSTRACJI (WYSIWYG)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsEditingIntro(true)}
              className="px-4 py-2 rounded-xl bg-fuchsia-700 hover:bg-fuchsia-600 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edytuj Opis Wstępu (WYSIWYG)</span>
            </button>
          </div>
        </div>
      )}

      {/* Hero Banner for 9th Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-900/20 via-purple-900/15 to-amber-500/10 dark:from-fuchsia-950/40 dark:via-[#191024] dark:to-stone-900/30 p-6 sm:p-10 border border-fuchsia-500/30 shadow-xl mb-8">
        
        {/* Decorative background icon */}
        <div className="absolute -right-8 -top-8 w-44 h-44 opacity-10 pointer-events-none text-fuchsia-500">
          <ImageIcon className="w-full h-full" />
        </div>

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-fuchsia-500/20 text-fuchsia-900 dark:text-fuchsia-200 text-xs font-bold mb-4 border border-fuchsia-500/30">
            <Sparkles className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
            <span>Sekcja 9 • Materiały Graficzne & Galeria Media</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-heading-cinzel font-bold text-[#3b1237] dark:text-[#f8fafc] mb-3 leading-tight">
            {section.name || 'Materiały & Ilustracje'}
          </h1>
          <h2 className="text-base sm:text-lg font-serif-book italic text-[#772772] dark:text-[#e9d5ff] mb-6">
            {section.subtitle || 'Repozytorium graficzne, pliki i zasoby opublikowane przez administratora'}
          </h2>

          {/* WYSIWYG Editable Description Box */}
          <div 
            className="prose dark:prose-invert max-w-none text-stone-800 dark:text-stone-200"
            dangerouslySetInnerHTML={{ __html: introHtml }}
          />

          {adminUser && (
            <div className="mt-6 pt-4 border-t border-fuchsia-500/20 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold text-fuchsia-900 dark:text-fuchsia-300">
                Przycisk zarządczy edytora WYSIWYG opisów:
              </span>
              <button
                onClick={() => setIsEditingIntro(true)}
                className="px-4 py-2 rounded-xl bg-fuchsia-700 hover:bg-fuchsia-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Edit3 className="w-4 h-4" />
                <span>Otwórz Edytor WYSIWYG Opisu</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Full Interactive Media Gallery Viewer */}
      <div className="mt-6">
        <MediaLibraryViewer />
      </div>

      {/* WYSIWYG Modal for editing intro */}
      {isEditingIntro && (
        <ElementEditorModal
          isOpen={true}
          onClose={() => setIsEditingIntro(false)}
          title="Edycja Opisu Wstępu Sekcji (WYSIWYG)"
          elementLabel="Wstęp Sekcji Materiały & Ilustracje (Grafika365)"
          initialContent={introHtml}
          onSave={handleSaveIntro}
        />
      )}
    </div>
  );
};
