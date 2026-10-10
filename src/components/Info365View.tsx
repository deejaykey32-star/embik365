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
  Unlock,
  Eye,
  EyeOff,
  ExternalLink,
  Radio,
  RadioTower,
  Headphones,
  Volume2,
  Video,
  Film,
  Play,
  Tv,
  CheckCircle2,
  Layers,
  MonitorPlay
} from 'lucide-react';
import { RADIO_STATIONS, RadioStationId, getRadioBroadcastItem, RadioBroadcastItem } from '../utils/radioContentService';
import { generateAndDownloadQrBadgePng, getSavedQrCodes, getQrCodeForSection } from '../utils/qrCodeService';
import { VideoYouTubeExportModal } from './VideoYouTubeExportModal';
import { QrImageDisplay } from './QrImageDisplay';
import { ElementEditorModal } from './ElementEditorModal';
import { 
  getHomePageConfig, 
  saveHomePageConfig, 
  resetHomePageConfig, 
  uploadImageFileToServer,
  SECTION_ICONS_MAP 
} from '../utils/homePageConfig';
import { SectionGuidePlayerBar } from './SectionGuidePlayerBar';
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

  // Dedicated Video YouTube generator modal state on main page
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [videoStationId, setVideoStationId] = useState<RadioStationId>('nowyrhz');
  const [videoDayNumber, setVideoDayNumber] = useState<number>(1);

  const currentVideoStationMeta = React.useMemo(() => {
    return RADIO_STATIONS.find(s => s.id === videoStationId) || RADIO_STATIONS[0];
  }, [videoStationId]);

  const currentVideoBroadcastItem: RadioBroadcastItem = React.useMemo(() => {
    return getRadioBroadcastItem(videoStationId, videoDayNumber);
  }, [videoStationId, videoDayNumber]);

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

  const handleToggleSectionVisibility = async (id: SectionId) => {
    const updatedShowcases = config.showcases.map(item => 
      item.id === id ? { ...item, hidden: !item.hidden } : item
    );
    const updated = { ...config, showcases: updatedShowcases };
    setConfig(updated);
    await saveHomePageConfig(updated);
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
        const slug = targetQrId.replace('qr_', '');
        const sectionQr = getQrCodeForSection(slug, title);
        await generateAndDownloadQrBadgePng(sectionQr);
      }
    } catch (err) {
      console.error('Download QR failed:', err);
    } finally {
      setDownloadingQrId(null);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-fade-in text-[#2c2219] dark:text-[#f1f5f9]">
      
      {/* AUTHOR / ADMIN PROMINENT CONTROL TOOLBAR - ONLY VISIBLE TO LOGGED IN ADMIN */}
      {adminUser && (
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

          {/* AI Lector Audio Guide Bar for Home Page & All Sections */}
          <div className="mt-6">
            <SectionGuidePlayerBar 
              sectionId="info365" 
              currentLang={currentLang} 
              variant="banner" 
            />
          </div>

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

        {adminUser && onOpenQrModal && (
          <button
            onClick={onOpenQrModal}
            className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-[#1a2538] hover:bg-amber-500/20 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-stone-300 dark:border-stone-700"
          >
            <QrCode className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Otwórz Bazę Kodów QR</span>
          </button>
        )}
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeConfig.showcases.filter(s => adminUser ? true : !s.hidden).map((section) => {
          const IconComponent = SECTION_ICONS_MAP[section.id] || Compass;
          const isHidden = Boolean(section.hidden);
          return (
            <div
              key={section.id}
              className={`group flex flex-col justify-between rounded-3xl bg-white dark:bg-[#0c121e] border shadow-sm hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 overflow-hidden relative ${
                isHidden 
                  ? 'border-rose-500/40 dark:border-rose-500/40 bg-rose-50/20 dark:bg-rose-950/10 ring-1 ring-rose-500/30' 
                  : 'border-stone-200 dark:border-[#1e2a40]'
              }`}
            >
              {/* Admin direct controls for this showcase card */}
              {adminUser && (
                <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSectionVisibility(section.id);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 active:scale-95 ${
                      isHidden
                        ? 'bg-rose-700 hover:bg-rose-600 text-white border border-rose-400/40'
                        : 'bg-emerald-700/90 hover:bg-emerald-600 text-white border border-emerald-400/40'
                    }`}
                    title={isHidden ? 'Odkryj sekcję na stronie głównej' : 'Ukryj sekcję dla odwiedzających na stronie głównej'}
                  >
                    {isHidden ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-rose-200" />
                        <span>Ukryta</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Widoczna</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingShowcase(section);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                    title="Edytuj treść i opisy oraz podmień ilustrację tej sekcji"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edytuj</span>
                  </button>
                </div>
              )}

              {/* Top illustration - Clickable to open section or external app */}
              <div 
                onClick={() => {
                  if (section.externalUrl) {
                    window.open(section.externalUrl, section.openInNewTab !== false ? '_blank' : '_self');
                  } else {
                    onSelectSection(section.id as SectionId);
                  }
                }}
                className="relative h-44 w-full overflow-hidden cursor-pointer bg-stone-100 dark:bg-stone-900"
                title={section.externalUrl ? `Kliknij, aby otworzyć platformę zewnętrzną: ${section.externalUrl}` : `Kliknij, aby otworzyć sekcję ${section.name}`}
              >
                <img
                  src={section.imageUrl}
                  alt={section.imageAlt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Badge on illustration */}
                <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 max-w-[85%]">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/90 dark:bg-[#0c121e]/90 text-stone-900 dark:text-white backdrop-blur-xs shadow-xs flex items-center gap-1.5">
                    <IconComponent className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>{section.badge}</span>
                  </span>
                  {section.externalUrl && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white backdrop-blur-xs shadow-xs flex items-center gap-1">
                      <ExternalLink className="w-2.5 h-2.5" />
                      <span>Zewnętrzny</span>
                    </span>
                  )}
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
                onClick={() => {
                  if (section.externalUrl) {
                    window.open(section.externalUrl, section.openInNewTab !== false ? '_blank' : '_self');
                  } else {
                    onSelectSection(section.id as SectionId);
                  }
                }}
                className="p-5 flex-1 cursor-pointer flex flex-col justify-between"
                title={section.externalUrl ? `Kliknij, aby otworzyć ${section.externalUrl}` : `Kliknij, aby otworzyć ${section.name}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-xs text-amber-800 dark:text-amber-300">
                        {section.shortDesc}
                      </p>
                      {section.externalUrl && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] font-mono text-amber-700 dark:text-amber-400">
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">{section.externalUrl.replace(/^https?:\/\//, '')}</span>
                        </div>
                      )}
                    </div>
                    {/* Visual QR Code Thumbnail */}
                    {(() => {
                      const qrItem = getQrCodeForSection(section.id, section.name);
                      return (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadQr(section.qrId, section.name);
                          }}
                          className="w-14 h-14 p-1 bg-white dark:bg-stone-900 rounded-lg border border-amber-500/30 shadow-xs shrink-0 hover:scale-105 transition-transform"
                          title="Kliknij, aby pobrać dedykowany kod QR (PNG)"
                        >
                          <QrImageDisplay text={qrItem.shortUrl || qrItem.fullUrl} title={section.name} />
                        </div>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-serif-book">
                    {section.fullDesc}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                  <span>
                    {section.externalUrl 
                      ? 'Otwórz platformę zewnętrzną' 
                      : (getUIText('readToday', currentLang) || 'Otwórz sekcję')}
                  </span>
                  {section.externalUrl ? <ExternalLink className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </div>
              </div>

              {/* Bottom Card Bar: Direct Jump & QR Download */}
              <div className="px-5 py-3 bg-stone-50/80 dark:bg-[#111827] border-t border-stone-200 dark:border-[#1e2a40] flex items-center justify-between text-xs gap-2">
                
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

                <div className="flex items-center gap-1.5">
                  {/* Secondary internal view button if section is 'mapa' */}
                  {section.id === 'mapa' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSection('mapa');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-medium text-xs transition-colors cursor-pointer"
                      title="Podgląd mapy wbudowany w aplikację"
                    >
                      Wbudowana
                    </button>
                  )}

                  {/* Primary Action Button */}
                  {section.externalUrl ? (
                    <a
                      href={section.externalUrl}
                      target={section.openInNewTab !== false ? '_blank' : '_self'}
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                      title={`Otwórz ${section.externalUrl}`}
                    >
                      <span>Otwórz</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <button
                      onClick={() => onSelectSection(section.id as SectionId)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Wejdź</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* DEDYKOWANA SEKCJA: STACJE RADIOWE 24/7 (DOLNA CZĘŚĆ GŁÓWNEGO EKRANU)     */}
      {/* ========================================================================= */}
      <section className="mt-14 mb-6 rounded-3xl bg-gradient-to-b from-stone-900 via-[#101827] to-[#0a0f1d] border border-amber-500/40 shadow-2xl overflow-hidden text-white relative">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 relative z-10">
          
          {/* Lewa kolumna: Duża ilustracja z dynamicznymi falami i oznaczeniem LIVE */}
          <div className="lg:col-span-5 relative min-h-[280px] sm:min-h-[360px] overflow-hidden group">
            <img
              src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1200&auto=format&fit=crop&q=80"
              alt="Radio Internetowe Widoki na Raj 24/7"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 brightness-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1d] via-[#0a0f1d]/40 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#101827]" />
            
            {/* Animowana plakietka LIVE na ilustracji */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/90 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-xs shadow-lg">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>NADAWANIE 24/7 W PĘTLI</span>
            </div>

            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <RadioTower className="w-4 h-4 animate-pulse" />
                <span>4 STACJE INTERNETOWE ONLINE</span>
              </div>
              <p className="text-sm font-serif-book italic text-stone-200">
                „Głoś słowo, nalegaj w porę i nie w porę, nauczaj z wszelką cierpliwością.”
              </p>
            </div>
          </div>

          {/* Prawa kolumna: Tytuł, skrócony opis i 4 kafelki stacji */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <Radio className="w-3.5 h-3.5" />
                  <span>Radio Internetowe • Ciągły Podsłuch Eteru</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  BEZ PRZERWY 24H
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold font-serif-book text-white leading-tight">
                Radio Widoki na Raj 24/7
              </h3>

              <p className="text-xs sm:text-sm text-stone-300 font-sans-ui leading-relaxed">
                Wszystkie 4 stacje radiowe nadają bez przerwy 24 godziny na dobę z automatycznym lektorem AI i odsłuchem na żywo. Nie musisz niczego włączać – w każdej chwili możesz dołączyć do podsłuchu i słuchać modlitwy oraz rozważań płynących w eterze.
              </p>
            </div>

            {/* 4 Stacje w pigułce z ilustracyjnym opisem */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              <div 
                onClick={() => onSelectSection('radio' as any)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-amber-400 group-hover:text-amber-300">1. Nowy RHZ</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">175 dni</span>
                </div>
                <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                  Nowy Różaniec Historii Zbawienia: pełne 10 dopowiedzeń po słowie Jezus w każdej tajemnicy od Stworzenia po Apokalipsę.
                </p>
              </div>

              <div 
                onClick={() => onSelectSection('radio' as any)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-sky-400 group-hover:text-sky-300">2. Widoki na Raj</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono">365 dni</span>
                </div>
                <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                  Codzienne duchowe wpisy blogowe, świadectwa, modlitwy i głębokie rozważania na każdy dzień roku.
                </p>
              </div>

              <div 
                onClick={() => onSelectSection('radio' as any)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-emerald-400 group-hover:text-emerald-300">3. Biblia i Apokryfy</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">4 lata</span>
                </div>
                <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                  Rozdziały Pisma Świętego i starożytnych apokryfów czytane w 4-letnim cyklu z komentarzem biblijnym.
                </p>
              </div>

              <div 
                onClick={() => onSelectSection('radio' as any)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-rose-400 group-hover:text-rose-300">4. Pierwotny RHZ</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">365 dni</span>
                </div>
                <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                  Tradycyjny 365-dniowy Różaniec Historii Zbawienia: Słowo Boże, wyjaśnienie i 3 konkretne wezwania do czynu.
                </p>
              </div>

            </div>

            {/* Przyciski wejścia i akcji */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectSection('radio' as any)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Headphones className="w-4 h-4" />
                  <span>Otwórz Studio Radiowe 24/7</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDownloadQr('qr_radio', 'Radio Widoki na Raj 24/7')}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-stone-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Pobierz kod QR radia jako grafikę PNG"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kod QR</span>
                </button>
              </div>

              <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Automatyczny podsłuch w tle</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* DEDYKOWANA SEKCJA: GENERATOR PLIKÓW WIDEO MP4 DLA YOUTUBE (STRONA GŁÓWNA)  */}
      {/* ========================================================================= */}
      <section className="mt-8 mb-6 rounded-3xl bg-gradient-to-b from-[#180a0e] via-[#120710] to-[#0a0309] border border-red-500/40 shadow-2xl overflow-hidden text-white relative">
        {/* Ambient glow effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 relative z-10">
          
          {/* Lewa kolumna: Wizualizacja ramki odtwarzacza wideo 16:9 z podglądem */}
          <div className="lg:col-span-5 relative min-h-[300px] sm:min-h-[380px] p-6 sm:p-8 flex flex-col justify-between bg-black/40 border-b lg:border-b-0 lg:border-r border-red-500/20">
            
            {/* Top Bar w ramce wideo */}
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/90 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-xs shadow-lg">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>STUDIO YOUTUBE MP4</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-stone-900 border border-red-500/30 text-amber-300 font-bold">
                1080p FULL HD
              </span>
            </div>

            {/* Wizualizacja ramki odtwarzacza wideo (16:9 mockup) */}
            <div className="my-auto py-4">
              <div className="rounded-2xl border border-red-500/30 bg-[#08080c] p-4 sm:p-5 shadow-2xl space-y-3">
                <div className="flex items-center justify-between text-[11px] text-stone-400 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-red-500" />
                    <span className="font-bold text-stone-200">Podgląd Formatowania YouTube</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-[10px]">Czarne Tło #000000</span>
                </div>

                <div className="text-center py-2 space-y-1.5">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                    Nowy RHZ • Tajemnica 1: Stworzenie Świata
                  </div>
                  <div className="text-xs sm:text-sm font-serif-book font-bold text-white line-clamp-1">
                    „Bądź pozdrowiona, łaski pełna, Pan z Tobą...”
                  </div>
                  <div className="inline-block px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] sm:text-xs text-stone-300 font-serif">
                    Napisy Karaoke: <span className="text-amber-300 font-bold underline decoration-amber-400">Jezus</span>, który nas stworzył...
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-400 pt-2 border-t border-white/10">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Lektor AI + Koraliki RGBA</span>
                  </span>
                  <span className="font-mono text-amber-400">16:9 • MP4</span>
                </div>
              </div>
            </div>

            {/* Dół lewej kolumny */}
            <div className="text-xs text-stone-300 italic font-serif">
              „Profesjonalny eksport do formatu MP4 bez znaków wodnych i bez instalacji zewnętrznych programów.”
            </div>
          </div>

          {/* Prawa kolumna: Nagłówek, opis, 4 stacje szybkiego startu i przyciski akcji */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider">
                  <Film className="w-3.5 h-3.5" />
                  <span>Dedykowany Generator • YouTube Ready</span>
                </div>
                <span className="text-[11px] font-mono text-amber-400 font-bold flex items-center gap-1">
                  <Tv className="w-3.5 h-3.5 text-amber-400" />
                  FULL HD 1080p & 720p
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold font-serif-book text-white leading-tight">
                Generator Plików Wideo MP4 dla YouTube
              </h3>

              <p className="text-xs sm:text-sm text-stone-300 font-sans-ui leading-relaxed">
                Twórz gotowe filmy wideo w formacie MP4 z czarnym tłem, wbudowanym automatycznym lektorem mowy, synchronizowanymi napisami karaoke oraz animacją koralików różańca. Gotowy plik pobierzesz bezpośrednio z przeglądarki i możesz od razu opublikować na kanale YouTube.
              </p>
            </div>

            {/* 4 Kafelki stacji dla szybkiego wyboru w generatorze wideo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              <div 
                onClick={() => {
                  setVideoStationId('nowyrhz');
                  setVideoDayNumber(1);
                  setIsVideoModalOpen(true);
                }}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-amber-400 group-hover:text-amber-300">1. Nowy RHZ</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-600/30 text-red-300 font-mono">Generuj Wideo</span>
                </div>
                <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                  175 tajemnic różańca z 10 dopowiedzeniami i animacją koralików (RGBA/CMYK).
                </p>
              </div>

              <div 
                onClick={() => {
                  setVideoStationId('wnr365');
                  setVideoDayNumber(1);
                  setIsVideoModalOpen(true);
                }}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-sky-400 group-hover:text-sky-300">2. Widoki na Raj</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-600/30 text-red-300 font-mono">Generuj Wideo</span>
                </div>
                <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                  365 dni wpisów blogowych, refleksji duchowych i świadectw z lektorem AI.
                </p>
              </div>

              <div 
                onClick={() => {
                  setVideoStationId('biblia365');
                  setVideoDayNumber(1);
                  setIsVideoModalOpen(true);
                }}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-emerald-400 group-hover:text-emerald-300">3. Biblia i Apokryfy</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-600/30 text-red-300 font-mono">Generuj Wideo</span>
                </div>
                <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                  Lektura Pisma Świętego i apokryfów w cyklu 4-letnim z napisami karaoke.
                </p>
              </div>

              <div 
                onClick={() => {
                  setVideoStationId('rhz365');
                  setVideoDayNumber(1);
                  setIsVideoModalOpen(true);
                }}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-rose-400 group-hover:text-rose-300">4. Pierwotny RHZ</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-600/30 text-red-300 font-mono">Generuj Wideo</span>
                </div>
                <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                  Tradycyjny 365-dniowy Różaniec Historii Zbawienia: Słowo Boże i 3 wezwania.
                </p>
              </div>

            </div>

            {/* Przyciski wejścia i akcji */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsVideoModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Video className="w-4 h-4" />
                  <span>Uruchom Generator Wideo (MP4)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onSelectSection('wideo')}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-stone-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Otwórz pełną podstronę studia wideo z katalogiem"
                >
                  <MonitorPlay className="w-3.5 h-3.5 text-red-400" />
                  <span>Pełne Studio Wideo</span>
                </button>

                <button
                  onClick={() => handleDownloadQr('qr_wideo', 'Generator Wideo YouTube MP4')}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-stone-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Pobierz kod QR generatora wideo jako grafikę PNG"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kod QR</span>
                </button>
              </div>

              <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% lokalny eksport MP4 w przeglądarce</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Modal Generatora Wideo MP4 uruchamiany ze strony głównej */}
      {isVideoModalOpen && (
        <VideoYouTubeExportModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          broadcastItem={currentVideoBroadcastItem}
          stationMeta={currentVideoStationMeta}
          currentDayNumber={videoDayNumber}
          totalDays={currentVideoStationMeta.totalDays}
        />
      )}

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
  const [hidden, setHidden] = useState(Boolean(item.hidden));
  const [externalUrl, setExternalUrl] = useState(item.externalUrl || '');
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
      imageAlt,
      hidden,
      externalUrl: externalUrl.trim() || undefined
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
          
          {/* Visibility switch */}
          <div className="p-3.5 bg-stone-100 dark:bg-[#131c2e] rounded-2xl border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-stone-900 dark:text-stone-100 block">
                Widoczność sekcji na stronie głównej
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                {hidden ? 'Sekcja jest ukryta dla odwiedzających (widoczna tylko w trybie admina)' : 'Sekcja jest widoczna dla wszystkich odwiedzających'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setHidden(!hidden)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                hidden
                  ? 'bg-rose-700 text-white hover:bg-rose-600'
                  : 'bg-emerald-700 text-white hover:bg-emerald-600'
              }`}
            >
              {hidden ? <EyeOff className="w-4 h-4 text-rose-200" /> : <Eye className="w-4 h-4 text-emerald-200" />}
              <span>{hidden ? 'Ukryta (Odkryj)' : 'Widoczna (Ukryj)'}</span>
            </button>
          </div>

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

          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              Adres URL Zewnętrznego Serwisu (opcjonalny, np. https://mapa-aon.pages.dev lub gra Histada)
            </label>
            <input
              type="text"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="np. https://mapa-aon.pages.dev"
              className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-[#131c2e] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-mono text-xs focus:outline-hidden focus:border-amber-500"
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
