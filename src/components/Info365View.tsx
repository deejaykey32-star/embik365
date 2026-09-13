import React, { useState, useEffect } from 'react';
import { 
  SectionId, 
  AdminUser,
  SectionShowcaseConfig,
  HomePageConfig
} from '../types';
import { 
  Compass, 
  ArrowRight, 
  Feather, 
  Cross, 
  BookOpen, 
  Book, 
  Library, 
  HeartHandshake, 
  QrCode, 
  Edit3, 
  Sparkles, 
  Image as ImageIcon,
  RotateCcw,
  X,
  Save,
  Check,
  ShieldCheck,
  Globe,
  Lock,
  Unlock
} from 'lucide-react';
import { generateAndDownloadQrBadgePng, getSavedQrCodes } from '../utils/qrCodeService';
import { ElementEditorModal } from './ElementEditorModal';
import { 
  getHomePageConfig, 
  saveHomePageConfig, 
  resetHomePageConfig, 
  uploadImageFileToServer,
  SECTION_ICONS_MAP 
} from '../utils/homePageConfig';
import { getUIText, translateTextWithFreeApi } from '../utils/translationService';

interface Info365ViewProps {
  onSelectSection: (id: SectionId) => void;
  adminUser: AdminUser | null;
  onLogin?: (user: AdminUser) => void;
  onOpenAdmin?: () => void;
  onOpenQrModal?: () => void;
  currentLang?: string;
}

export const Info365View: React.FC<Info365ViewProps> = ({
  onSelectSection,
  adminUser,
  onLogin,
  onOpenAdmin,
  onOpenQrModal,
  currentLang = 'pl'
}) => {
  const [config, setConfig] = useState<HomePageConfig>(() => getHomePageConfig());
  const [translatedConfig, setTranslatedConfig] = useState<HomePageConfig | null>(null);
  const [isTranslatingPage, setIsTranslatingPage] = useState<boolean>(false);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
      } else {
        setConfig(getHomePageConfig());
      }
    };
    window.addEventListener('drogowskazy_home_config_updated', handleUpdate);
    return () => window.removeEventListener('drogowskazy_home_config_updated', handleUpdate);
  }, []);

  // Live on-the-fly translation effect for Home Page (Info365)
  useEffect(() => {
    if (currentLang === 'pl') {
      setTranslatedConfig(null);
      setIsTranslatingPage(false);
      return;
    }

    let isMounted = true;
    setIsTranslatingPage(true);

    const translatePageConfig = async () => {
      try {
        const [tHeroTitle, tHeroSub, tIntro] = await Promise.all([
          translateTextWithFreeApi(config.heroTitle, currentLang),
          translateTextWithFreeApi(config.heroSubtitle, currentLang),
          translateTextWithFreeApi(config.introHtml, currentLang)
        ]);

        const tShowcases = await Promise.all(
          config.showcases.map(async (s) => {
            const [tName, tBadge, tShort, tFull] = await Promise.all([
              translateTextWithFreeApi(s.name, currentLang),
              translateTextWithFreeApi(s.badge, currentLang),
              translateTextWithFreeApi(s.shortDesc, currentLang),
              translateTextWithFreeApi(s.fullDesc, currentLang)
            ]);
            return {
              ...s,
              name: tName.replace(/<[^>]*>/g, '').trim() || s.name,
              badge: tBadge.replace(/<[^>]*>/g, '').trim() || s.badge,
              shortDesc: tShort.replace(/<[^>]*>/g, '').trim() || s.shortDesc,
              fullDesc: tFull || s.fullDesc
            };
          })
        );

        if (isMounted) {
          setTranslatedConfig({
            heroTitle: tHeroTitle.replace(/<[^>]*>/g, '').trim() || config.heroTitle,
            heroSubtitle: tHeroSub.replace(/<[^>]*>/g, '').trim() || config.heroSubtitle,
            introHtml: tIntro || config.introHtml,
            showcases: tShowcases
          });
          setIsTranslatingPage(false);
        }
      } catch (err) {
        console.warn('Page translation failed:', err);
        if (isMounted) setIsTranslatingPage(false);
      }
    };

    translatePageConfig();

    return () => {
      isMounted = false;
    };
  }, [config, currentLang]);

  const activeConfig = (currentLang !== 'pl' && translatedConfig) ? translatedConfig : config;

  // Modal editing state for Intro WYSIWYG
  const [editingIntro, setEditingIntro] = useState<boolean>(false);

  // Modal editing state for Hero Title/Subtitle
  const [editingHero, setEditingHero] = useState<boolean>(false);
  const [heroTitleInput, setHeroTitleInput] = useState<string>('');
  const [heroSubtitleInput, setHeroSubtitleInput] = useState<string>('');

  // Modal editing state for a Section Showcase Card
  const [editingShowcase, setEditingShowcase] = useState<SectionShowcaseConfig | null>(null);

  const [downloadingQrId, setDownloadingQrId] = useState<string | null>(null);

  const handleSaveIntro = (newContent: string) => {
    const updated = { ...config, introHtml: newContent };
    setConfig(updated);
    saveHomePageConfig(updated);
  };

  const handleSaveHeroHeader = () => {
    const updated = {
      ...config,
      heroTitle: heroTitleInput,
      heroSubtitle: heroSubtitleInput
    };
    setConfig(updated);
    saveHomePageConfig(updated);
    setEditingHero(false);
  };

  const handleSaveShowcase = async (updatedItem: SectionShowcaseConfig) => {
    const updatedShowcases = config.showcases.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    const updated = { ...config, showcases: updatedShowcases };
    setConfig(updated);
    await saveHomePageConfig(updated);
    setEditingShowcase(null);
  };

  const handleResetToDefaults = () => {
    if (confirm('Czy na pewno chcesz przywrócić domyślne nagłówki, opisy i ilustracje strony startowej?')) {
      const def = resetHomePageConfig();
      setConfig(def);
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

  const handleDownloadQr = async (qrId: string | undefined, title: string) => {
    const targetQrId = qrId || `qr_${title.toLowerCase()}`;
    setDownloadingQrId(targetQrId);
    try {
      const allQrs = getSavedQrCodes();
      const match = allQrs.find(q => q.id === targetQrId || q.sectionId === targetQrId.replace('qr_', ''));
      if (match) {
        await generateAndDownloadQrBadgePng(match);
      } else {
        await generateAndDownloadQrBadgePng({
          id: targetQrId,
          title,
          displayLabel: `Zeskanuj, aby przejść do ${title}`,
          shortUrl: `https://widokinaraj.pl/r/${targetQrId.replace('qr_', '')}`,
          fullUrl: `https://widokinaraj.pl/#${targetQrId.replace('qr_', '')}`,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Download QR failed:', err);
    } finally {
      setDownloadingQrId(null);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-fade-in text-[#2c2219] dark:text-[#f1f5f9]">
      
      {/* AUTHOR / ADMIN PROMINENT CONTROL TOOLBAR */}
      {!adminUser ? (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-amber-950 dark:text-amber-200">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="font-medium">
              Chcesz edytować tytuły, opisy lub zdjęcia na stronie domowej? Aktywuj tryb edycji autora jednym kliknięciem:
            </span>
          </div>
          <button
            onClick={handleQuickLoginAuthor}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 shrink-0"
          >
            <Unlock className="w-4 h-4" />
            <span>Włącz Tryb Edycji Autora (Dominik Kuta)</span>
          </button>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-200 font-bold">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>TRYB EDYCJI STRONY DOMOWEJ AKTYWNY (Autor: {adminUser.name})</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setHeroTitleInput(config.heroTitle);
                setHeroSubtitleInput(config.heroSubtitle);
                setEditingHero(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edytuj Tytuł i Podtytuł</span>
            </button>

            <button
              onClick={() => setEditingIntro(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edytuj Wstęp (WYSIWYG)</span>
            </button>

            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="px-3.5 py-2 rounded-xl bg-stone-800 dark:bg-stone-700 hover:bg-stone-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Panel Wszystkich Ilustracji</span>
              </button>
            )}

            <button
              onClick={handleResetToDefaults}
              className="px-3 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-800 dark:text-stone-200 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="Przywróć domyślne nagłówki i ilustracje"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-amber-500/15 via-orange-500/10 to-violet-500/10 dark:from-amber-950/40 dark:via-[#131b2e] dark:to-purple-950/30 p-6 sm:p-10 border border-amber-500/30 shadow-xl mb-10">
        
        {/* Decorative corner icon */}
        <div className="absolute -right-8 -top-8 w-40 h-40 opacity-10 pointer-events-none text-amber-700 dark:text-amber-400">
          <Compass className="w-full h-full" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 dark:bg-amber-400/20 text-amber-900 dark:text-amber-200 text-xs font-bold mb-4">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>info365 • Przewodnik & Strona Startowa Aplikacji</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-heading-cinzel font-bold text-[#3a2717] dark:text-[#f8fafc] mb-3 leading-tight">
            {activeConfig.heroTitle}
          </h1>
          <h2 className="text-base sm:text-lg font-serif-book italic text-[#785b3a] dark:text-[#cbd5e1] mb-6">
            {activeConfig.heroSubtitle}
          </h2>

          {/* Rendered Intro HTML */}
          <div 
            className="prose dark:prose-invert max-w-none text-stone-800 dark:text-stone-200"
            dangerouslySetInnerHTML={{ __html: activeConfig.introHtml }}
          />

          {/* Admin toolbar inside Hero Banner */}
          {adminUser && (
            <div className="mt-6 pt-4 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                Szybkie modyfikacje nagłówka banera:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setHeroTitleInput(config.heroTitle);
                    setHeroSubtitleInput(config.heroSubtitle);
                    setEditingHero(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edytuj Tytuł</span>
                </button>
                <button
                  onClick={() => setEditingIntro(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edytuj Wstęp (WYSIWYG)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sections Grid Overview */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl sm:text-2xl font-heading-cinzel font-bold text-[#3a2717] dark:text-[#f8fafc]">
            Przegląd Sekcji & Szybki Dostęp
          </h3>
          <p className="text-xs text-[#786756] dark:text-[#94a3b8]">
            Kliknij w ilustrację lub opis dowolnej sekcji, aby natychmiast ją otworzyć
          </p>
        </div>

        {onOpenQrModal && (
          <button
            onClick={onOpenQrModal}
            className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-[#1a2538] hover:bg-amber-500/20 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-stone-300 dark:border-stone-700"
          >
            <QrCode className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Otwórz Bazę Kodów QR</span>
          </button>
        )}
      </div>

      {/* Grid of 7 Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeConfig.showcases.map((section) => {
          const IconComponent = SECTION_ICONS_MAP[section.id] || Compass;
          return (
            <div
              key={section.id}
              className="group flex flex-col justify-between rounded-3xl bg-white dark:bg-[#0c121e] border border-stone-200 dark:border-[#1e2a40] shadow-sm hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 overflow-hidden relative"
            >
              {/* Admin direct edit button for this showcase card */}
              {adminUser && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingShowcase(section);
                  }}
                  className="absolute top-3 right-3 z-30 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  title="Edytuj treść i opisy oraz podmień ilustrację tej sekcji"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edytuj Kartę</span>
                </button>
              )}

              {/* Top illustration - Clickable to open section */}
              <div 
                onClick={() => onSelectSection(section.id)}
                className="relative h-44 w-full overflow-hidden cursor-pointer bg-stone-100 dark:bg-stone-900"
                title={`Kliknij, aby otworzyć sekcję ${section.name}`}
              >
                <img
                  src={section.imageUrl}
                  alt={section.imageAlt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Badge on illustration */}
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/90 dark:bg-[#0c121e]/90 text-stone-900 dark:text-white backdrop-blur-xs shadow-xs flex items-center gap-1.5">
                    <IconComponent className="w-3.5 h-3.5 text-amber-600" />
                    <span>{section.badge}</span>
                  </span>
                </div>

                {/* Section title over image */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h4 className="text-lg font-heading-cinzel font-bold drop-shadow-md">
                    {section.name}
                  </h4>
                </div>
              </div>

              {/* Description body - Clickable to open section */}
              <div 
                onClick={() => onSelectSection(section.id)}
                className="p-5 flex-1 cursor-pointer flex flex-col justify-between"
                title={`Kliknij, aby otworzyć ${section.name}`}
              >
                <div>
                  <p className="font-semibold text-xs text-amber-800 dark:text-amber-300 mb-2">
                    {section.shortDesc}
                  </p>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-serif-book">
                    {section.fullDesc}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                  <span>{getUIText('readToday', currentLang) || 'Otwórz sekcję'}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Bottom Card Bar: Direct Jump & QR Download */}
              <div className="px-5 py-3 bg-stone-50/80 dark:bg-[#111827] border-t border-stone-200 dark:border-[#1e2a40] flex items-center justify-between text-xs">
                
                {/* QR Code Quick Download */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadQr(section.qrId, section.name);
                  }}
                  disabled={downloadingQrId === (section.qrId || `qr_${section.name}`)}
                  className="px-2.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-[11px]"
                  title="Pobierz kod QR sekcji jako grafikę PNG (300 DPI do druku)"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{downloadingQrId === (section.qrId || `qr_${section.name}`) ? 'Pobieranie...' : 'Kod QR (PNG)'}</span>
                </button>

                {/* Primary Button to Jump */}
                <button
                  onClick={() => onSelectSection(section.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                >
                  <span>Wejdź</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* WYSIWYG Editor Modal for Intro */}
      {editingIntro && (
        <ElementEditorModal
          isOpen={true}
          onClose={() => setEditingIntro(false)}
          title="Edycja Treści Wstępu info365"
          elementLabel="Wstęp Strony Startowej (HTML / WYSIWYG)"
          initialContent={config.introHtml}
          onSave={handleSaveIntro}
        />
      )}

      {/* Modal for editing Hero Title and Subtitle */}
      {editingHero && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#0c121e] rounded-3xl border border-amber-500/30 shadow-2xl p-6 relative">
            <button
              onClick={() => setEditingHero(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-heading-cinzel font-bold text-amber-900 dark:text-amber-300 mb-4 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-600" />
              <span>Edycja Tytułu i Podtytułu Strony Startowej</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Tytuł Główny (Hero Title)
                </label>
                <input
                  type="text"
                  value={heroTitleInput}
                  onChange={(e) => setHeroTitleInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-[#131c2e] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold focus:outline-hidden focus:border-amber-500"
                  placeholder="np. Droga365"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Podtytuł (Hero Subtitle)
                </label>
                <input
                  type="text"
                  value={heroSubtitleInput}
                  onChange={(e) => setHeroSubtitleInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-[#131c2e] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold focus:outline-hidden focus:border-amber-500"
                  placeholder="np. Roczny cykl od 25 grudnia..."
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingHero(false)}
                className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs cursor-pointer"
              >
                Anuluj
              </button>
              <button
                onClick={handleSaveHeroHeader}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Zapisz Nagłówek</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for editing a Section Showcase Card & Illustration */}
      {editingShowcase && (
        <ShowcaseEditModal
          item={editingShowcase}
          onClose={() => setEditingShowcase(null)}
          onSave={handleSaveShowcase}
        />
      )}

    </div>
  );
};

// Component Modal for editing a single section showcase card (Name, Badge, Descriptions, Image URL, Alt)
const ShowcaseEditModal: React.FC<{
  item: SectionShowcaseConfig;
  onClose: () => void;
  onSave: (updated: SectionShowcaseConfig) => void;
}> = ({ item, onClose, onSave }) => {
  const [name, setName] = useState(item.name);
  const [badge, setBadge] = useState(item.badge);
  const [shortDesc, setShortDesc] = useState(item.shortDesc);
  const [fullDesc, setFullDesc] = useState(item.fullDesc);
  const [imageUrl, setImageUrl] = useState(item.imageUrl);
  const [imageAlt, setImageAlt] = useState(item.imageAlt);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleLocalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const uploadedUrl = await uploadImageFileToServer(file);
      setImageUrl(uploadedUrl);
    } catch (err: any) {
      alert(`Błąd wgrywania pliku graficznego: ${err.message || err}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...item,
      name,
      badge,
      shortDesc,
      fullDesc,
      imageUrl,
      imageAlt
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0c121e] rounded-3xl border border-amber-500/30 shadow-2xl p-6 my-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-heading-cinzel font-bold text-amber-900 dark:text-amber-300 mb-1 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-amber-600" />
          <span>Edycja Karty & Ilustracji: {item.name}</span>
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
          Zmień treść opisu oraz własną ilustrację nagłówkową dla sekcji na stronie startowej.
        </p>

        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          
          {/* Image Preview Box */}
          <div className="p-3 bg-stone-100 dark:bg-[#131c2e] rounded-2xl border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-48 h-28 rounded-xl overflow-hidden bg-stone-800 shrink-0 border border-amber-500/30">
              <img
                src={imageUrl}
                alt={imageAlt || 'Podgląd ilustracji'}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80');
                }}
              />
            </div>
            <div className="flex-1 w-full space-y-2">
              <label className="block font-bold text-stone-700 dark:text-stone-300">
                URL Ilustracji / Zdjęcia (lub przesłanie pliku)
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0c121e] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-mono text-[11px] focus:outline-hidden focus:border-amber-500"
                placeholder="https://images.unsplash.com/..."
              />
              <div className="flex items-center gap-2">
                <label className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30 font-bold text-[11px] cursor-pointer flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Wybierz plik ze swojego komputera</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLocalImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Nazwa Sekcji
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-[#131c2e] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                Etykieta / Badge
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-[#131c2e] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Krótki Opis (Wyróżnik)
            </label>
            <input
              type="text"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-[#131c2e] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Pełny Opis Karty
            </label>
            <textarea
              rows={3}
              value={fullDesc}
              onChange={(e) => setFullDesc(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-[#131c2e] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-serif-book leading-relaxed focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Tekst Alternatywny Grafiki (Alt)
            </label>
            <input
              type="text"
              value={imageAlt}
              onChange={(e) => setImageAlt(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-[#131c2e] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold cursor-pointer"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Zapisz Zmiany Karty</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
