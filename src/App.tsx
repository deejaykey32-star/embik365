import React, { useState, useEffect } from 'react';
import { SectionId, CycleDate, AdminUser, UploadedPdf, SectionEntry, AppTheme, GitHubConfig } from './types';
import { SECTIONS, getSectionById } from './data/defaultSections';
import { getTodayCycleDate, getCycleDateByDayNumber } from './utils/dateCycle';
import { getEntryForSectionAndDate } from './data/sampleEntries';
import { NavigationHeader } from './components/NavigationHeader';
import { SectionNav } from './components/SectionNav';
import { FlipbookReader } from './components/FlipbookReader';
import { StandardReader } from './components/StandardReader';
import { Info365View } from './components/Info365View';
import { MediaGallerySectionView } from './components/MediaGallerySectionView';
import { saveHomePageConfig } from './utils/homePageConfig';
import { CalendarModal } from './components/CalendarModal';
import { AdminPanel } from './components/AdminPanel';
import { PdfViewerModal } from './components/PdfViewerModal';
import { DownloadPublishModal } from './components/DownloadPublishModal';
import { LectorSettingsModal } from './components/LectorSettingsModal';
import { SearchModal } from './components/SearchModal';
import { fetchEntriesFromGitHub, syncStateToGitHub, getStoredGitHubConfig } from './utils/githubSync';
import { setSavedQrCodes, getSavedQrCodes } from './utils/qrCodeService';
import { translateEntry } from './utils/translationService';
import { MediaLibraryViewer } from './components/MediaLibraryViewer';
import { Sparkles, X } from 'lucide-react';

import { parseUrlRoute, updateBrowserUrlSlug } from './utils/slugRouter';

export default function App() {
  // Parse initial URL slug route
  const initialRoute = parseUrlRoute();

  // 1. Theme state: 'light' | 'dark'
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('drogowskazy_theme') as AppTheme;
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('drogowskazy_theme', theme);
    } catch {}
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // 2. Language state (supports all 16 languages)
  const [currentLang, setCurrentLang] = useState<string>(() => {
    try {
      return localStorage.getItem('drogowskazy_lang') || 'pl';
    } catch {
      return 'pl';
    }
  });

  const handleLanguageChange = (lang: string) => {
    setCurrentLang(lang);
    try {
      localStorage.setItem('drogowskazy_lang', lang);
    } catch {}
  };

  // 3. Current Section & Date initialized from URL slug
  const [activeSectionId, setActiveSectionId] = useState<SectionId>(initialRoute.sectionId);
  const [currentDate, setCurrentDate] = useState<CycleDate>(initialRoute.date);

  // 4. Modals state initialized from URL slug subview
  const [isCalendarOpen, setIsCalendarOpen] = useState(initialRoute.subview === 'kalendarz');
  const [isAdminOpen, setIsAdminOpen] = useState(
    initialRoute.subview === 'admin' || 
    initialRoute.subview === 'panel'
  );
  const [isPublicMediaViewerOpen, setIsPublicMediaViewerOpen] = useState(
    initialRoute.subview === 'aistudio' ||
    initialRoute.subview === 'ai-studio' ||
    initialRoute.subview === 'grafika' ||
    initialRoute.subview === 'media' ||
    initialRoute.subview === 'zasoby' ||
    initialRoute.subview === 'uploads' ||
    initialRoute.subview === 'galeria' ||
    initialRoute.subview === 'materialy'
  );
  const [publicMediaTab, setPublicMediaTab] = useState<'grid' | 'images' | 'video' | 'html' | '3d' | 'aistudio'>(() => {
    if (initialRoute.subview === 'aistudio' || initialRoute.subview === 'ai-studio') return 'aistudio';
    return 'grid';
  });
  const [viewingPdf, setViewingPdf] = useState<UploadedPdf | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(initialRoute.subview === 'pobierz' || initialRoute.subview === 'download');
  const [isLectorModalOpen, setIsLectorModalOpen] = useState(initialRoute.subview === 'lektor' || initialRoute.subview === 'lector');
  const [isSearchOpen, setIsSearchOpen] = useState(initialRoute.subview === 'szukaj' || initialRoute.subview === 'search');

  // Global Ctrl+K / Cmd+K keyboard shortcut listener for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 5. Admin Authentication state (defaulting to saved session if present)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem('drogowskazy_admin');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 6. GitHub Configuration State
  const [githubConfig, setGithubConfig] = useState<GitHubConfig>(() => getStoredGitHubConfig());

  const handleSaveGitHubConfig = (cfg: GitHubConfig) => {
    setGithubConfig(cfg);
    try {
      localStorage.setItem('drogowskazy_github_config', JSON.stringify(cfg));
    } catch {}
  };

  // Default system uploads (attached PDF books)
  const DEFAULT_SYSTEM_UPLOADS: UploadedPdf[] = [
    {
      id: 'pdf-wnr365-full',
      filename: '1789322144113-_WnR365_poprawiany-Calosc_Ksiega_A5_-_ca_o___-_13.09.2026.pdf',
      originalName: '_WnR365_poprawiany-Calosc_Ksiega_A5_-_ca_o___-_13.09.2026.pdf',
      format: 'pdf',
      url: '/uploads/1789322144113-_WnR365_poprawiany-Calosc_Ksiega_A5_-_ca_o___-_13.09.2026.pdf',
      size: 4358441,
      sectionId: 'ebook_wnr',
      title: 'Widoki na Raj (WnR365) - Pełny PDF 1:1',
      description: 'Zaimportowany przez administratora pełny plik PDF książki.',
      uploadedAt: '2026-09-13T12:00:00.000Z'
    }
  ];

  // 7. Entries and Uploads state
  const [customEntries, setCustomEntries] = useState<Record<string, Partial<SectionEntry>>>({});
  const [uploads, setUploads] = useState<UploadedPdf[]>(DEFAULT_SYSTEM_UPLOADS);
  const [adminTab, setAdminTab] = useState<'upload' | 'github' | 'files' | 'editor' | 'qrcodes' | 'media_library' | 'homepage' | 'aistudio'>(() => {
    if (initialRoute.subview === 'aistudio' || initialRoute.subview === 'ai-studio') return 'aistudio';
    if (initialRoute.subview === 'grafika' || initialRoute.subview === 'media' || initialRoute.subview === 'zasoby' || initialRoute.subview === 'uploads' || initialRoute.subview === 'galeria' || initialRoute.subview === 'materialy') return 'media_library';
    if (initialRoute.subview === 'kody-qr' || initialRoute.subview === 'qr') return 'qrcodes';
    return 'upload';
  });

  // 8. Translation cache and active translated entry
  const [translatedEntry, setTranslatedEntry] = useState<SectionEntry | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Fetch initial data: GitHub Raw > API > Static /data/entries.json
  useEffect(() => {
    const fetchData = async () => {
      // 1. Try GitHub raw directly (works for all visitors across all devices without needing a token)
      try {
        const ghData = await fetchEntriesFromGitHub(githubConfig);
        if (ghData && (ghData.entries || ghData.uploads || ghData.qrCodes)) {
          if (ghData.entries && Object.keys(ghData.entries).length > 0) {
            setCustomEntries(ghData.entries);
            if (ghData.entries['drogowskazy_home_config']?.homeConfig) {
              saveHomePageConfig(ghData.entries['drogowskazy_home_config'].homeConfig, false);
            }
          }
          if (ghData.uploads && ghData.uploads.length > 0) {
            setUploads(ghData.uploads);
          } else {
            setUploads(DEFAULT_SYSTEM_UPLOADS);
          }
          if (ghData.qrCodes && ghData.qrCodes.length > 0) {
            setSavedQrCodes(ghData.qrCodes);
          }
          return;
        }
      } catch (err) {
        console.warn('Could not fetch from GitHub raw:', err);
      }

      // 2. Try backend API server
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const json = await res.json();
          if (json.entries && Object.keys(json.entries).length > 0) {
            setCustomEntries(json.entries);
            if (json.entries['drogowskazy_home_config']?.homeConfig) {
              saveHomePageConfig(json.entries['drogowskazy_home_config'].homeConfig, false);
            }
          }
          if (json.uploads && json.uploads.length > 0) {
            setUploads(json.uploads);
          } else {
            setUploads(DEFAULT_SYSTEM_UPLOADS);
          }
          if (json.qrCodes && json.qrCodes.length > 0) {
            setSavedQrCodes(json.qrCodes);
          }
          return;
        }
      } catch (err) {
        console.warn('Could not fetch initial data from backend API:', err);
      }

      // 3. Fallback to static public /data/entries.json
      try {
        const res = await fetch('/data/entries.json');
        if (res.ok) {
          const json = await res.json();
          if (json.entries) {
            setCustomEntries(json.entries);
            if (json.entries['drogowskazy_home_config']?.homeConfig) {
              saveHomePageConfig(json.entries['drogowskazy_home_config'].homeConfig, false);
            }
          }
          if (json.uploads && json.uploads.length > 0) {
            setUploads(json.uploads);
          } else {
            setUploads(DEFAULT_SYSTEM_UPLOADS);
          }
          if (json.qrCodes && json.qrCodes.length > 0) {
            setSavedQrCodes(json.qrCodes);
          }
        }
      } catch (err) {
        console.warn('Could not fetch static entries.json:', err);
      }
    };

    fetchData();
  }, []);

  // 9. Two-way URL Slug Synchronization
  // A) Update browser URL hash slug whenever active section, date, subview, modal, or PDF viewer changes
  useEffect(() => {
    let subview: string | undefined = undefined;
    if (isCalendarOpen) subview = 'kalendarz';
    else if (isDownloadModalOpen) subview = 'pobierz';
    else if (isLectorModalOpen) subview = 'lektor';
    else if (isPublicMediaViewerOpen) {
      subview = publicMediaTab === 'aistudio' ? 'aistudio' : 'grafika';
    } else if (isAdminOpen) {
      subview = adminTab === 'aistudio' ? 'aistudio' : adminTab === 'media_library' ? 'grafika' : adminTab === 'qrcodes' ? 'kody-qr' : 'admin';
    }

    updateBrowserUrlSlug({
      sectionId: activeSectionId,
      date: currentDate,
      subview,
      pdfId: viewingPdf?.id
    });
  }, [activeSectionId, currentDate, isCalendarOpen, isPublicMediaViewerOpen, publicMediaTab, isAdminOpen, isDownloadModalOpen, isLectorModalOpen, viewingPdf, adminTab]);

  // B) Listen to browser URL hashchange and popstate events (direct link pasting / back / forward navigation)
  useEffect(() => {
    const handleRouteSync = () => {
      const route = parseUrlRoute();
      if (route.sectionId) setActiveSectionId(route.sectionId);
      if (route.date) setCurrentDate(route.date);
      if (route.subview === 'kalendarz') setIsCalendarOpen(true);
      if (route.subview === 'pobierz' || route.subview === 'download') setIsDownloadModalOpen(true);
      if (route.subview === 'lektor' || route.subview === 'lector') setIsLectorModalOpen(true);
      
      if (route.subview === 'aistudio' || route.subview === 'ai-studio') {
        setIsPublicMediaViewerOpen(true);
        setPublicMediaTab('aistudio');
      } else if (route.subview === 'grafika' || route.subview === 'media' || route.subview === 'zasoby' || route.subview === 'uploads' || route.subview === 'galeria' || route.subview === 'materialy') {
        setIsPublicMediaViewerOpen(true);
        setPublicMediaTab('grid');
      } else if (route.subview === 'kody-qr' || route.subview === 'qr') {
        setIsAdminOpen(true);
        setAdminTab('qrcodes');
      } else if (route.subview === 'admin' || route.subview === 'panel') {
        setIsAdminOpen(true);
        setAdminTab('upload');
      }

      if (route.pdfId && uploads.length > 0) {
        const match = uploads.find(u => u.id === route.pdfId);
        if (match) setViewingPdf(match);
      }
    };

    window.addEventListener('hashchange', handleRouteSync);
    window.addEventListener('popstate', handleRouteSync);
    return () => {
      window.removeEventListener('hashchange', handleRouteSync);
      window.removeEventListener('popstate', handleRouteSync);
    };
  }, [uploads]);

  // Compute active section metadata
  const activeSection = getSectionById(activeSectionId);

  // Compute current entry (combining default/generated text with any custom server edits)
  const baseEntry = getEntryForSectionAndDate(activeSectionId, currentDate, customEntries);
  const customOverride = customEntries[`${activeSectionId}-${currentDate.dateKey}`] ||
    (activeSectionId === 'ebook_wnr' ? customEntries[`wnr365-${currentDate.dateKey}`] : undefined) ||
    (activeSectionId === 'wnr365' ? customEntries[`ebook_wnr-${currentDate.dateKey}`] : undefined);
  const activeEntry: SectionEntry = {
    ...baseEntry,
    ...(customOverride || {}),
    pdfs: uploads.filter(
      p => (
        p.sectionId === activeSectionId ||
        ((activeSectionId === 'wnr365' || activeSectionId === 'ebook_wnr' || activeSectionId === 'wnr366') && (p.sectionId === 'wnr365' || p.sectionId === 'ebook_wnr')) ||
        ((activeSectionId === 'rhz365' || activeSectionId === 'ebook_rhz') && (p.sectionId === 'rhz365' || p.sectionId === 'ebook_rhz')) ||
        ((activeSectionId === 'biblia365' || activeSectionId === 'ebook_biblia') && (p.sectionId === 'biblia365' || p.sectionId === 'ebook_biblia')) ||
        ((activeSectionId === 'bio365' || activeSectionId === 'ebook_bio') && (p.sectionId === 'bio365' || p.sectionId === 'ebook_bio'))
      ) && (!p.dateKey || p.dateKey === currentDate.dateKey)
    )
  };

  // Handle translation when currentLang is not 'pl'
  useEffect(() => {
    if (currentLang === 'pl') {
      setTranslatedEntry(null);
      setIsTranslating(false);
      return;
    }

    let isMounted = true;
    setIsTranslating(true);

    translateEntry(activeEntry, currentLang)
      .then(result => {
        if (isMounted) {
          setTranslatedEntry(result);
          setIsTranslating(false);
        }
      })
      .catch(err => {
        console.error('Translation error:', err);
        if (isMounted) {
          setIsTranslating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeSectionId, currentDate.dateKey, currentLang, customOverride]);

  const displayedEntry = (currentLang !== 'pl' && translatedEntry) ? translatedEntry : activeEntry;

  // Date Navigation Handlers
  const handlePrevDay = () => {
    if (currentDate.dayNumber > 1) {
      setCurrentDate(getCycleDateByDayNumber(currentDate.dayNumber - 1));
    }
  };

  const handleNextDay = () => {
    if (currentDate.dayNumber < 366) {
      setCurrentDate(getCycleDateByDayNumber(currentDate.dayNumber + 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(getTodayCycleDate());
  };

  // Upload Handlers
  const handleUploadSuccess = (newPdf: UploadedPdf) => {
    setUploads(prev => [newPdf, ...prev]);
  };

  const handleDeleteUpload = async (id: string) => {
    const updatedUploads = uploads.filter(u => u.id !== id);
    setUploads(updatedUploads);

    // Call server delete if available
    try {
      await fetch(`/api/uploads/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting upload on server:', err);
    }

    // Auto-sync deletion to GitHub if enabled
    if (githubConfig.autoSync && githubConfig.token) {
      syncStateToGitHub(githubConfig, {
        entries: customEntries,
        uploads: updatedUploads,
        qrCodes: getSavedQrCodes()
      }).catch(console.error);
    }
  };

  // Save entry text handler
  const handleSaveEntryText = async (key: string, entryData: Partial<SectionEntry>) => {
    const updatedEntries = {
      ...customEntries,
      [key]: {
        ...(customEntries[key] || {}),
        ...entryData
      }
    };
    setCustomEntries(updatedEntries);

    // Call server API
    try {
      await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          entry: updatedEntries[key],
          githubConfig: githubConfig.token ? githubConfig : undefined
        })
      });
    } catch (err) {
      console.error('Failed to persist entry to server:', err);
    }

    // Direct GitHub sync fallback
    if (githubConfig.autoSync && githubConfig.token) {
      try {
        await syncStateToGitHub(githubConfig, {
          entries: updatedEntries,
          uploads,
          qrCodes: getSavedQrCodes()
        });
      } catch (ghErr) {
        console.warn('GitHub autoSync failed:', ghErr);
      }
    }
  };

  // Push all local data to GitHub
  const handleSyncAllToGitHub = async () => {
    if (!githubConfig.token) {
      return { success: false, message: 'Brak tokena GitHub. Skonfiguruj token w zakładce GitHub.' };
    }
    return await syncStateToGitHub(githubConfig, {
      entries: customEntries,
      uploads,
      qrCodes: getSavedQrCodes()
    });
  };

  // Count PDFs per section for badge indicators
  const pdfCounts: Record<string, number> = {};
  uploads.forEach(u => {
    pdfCounts[u.sectionId] = (pdfCounts[u.sectionId] || 0) + 1;
  });

  const uploadedDateKeys = new Set(uploads.map(u => u.dateKey).filter(Boolean) as string[]);

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#070b12] text-[#2c2621] dark:text-[#e6edf3] flex flex-col font-sans-ui selection:bg-[#d4b996]/40 dark:selection:bg-amber-600/30 transition-colors duration-200">
      {/* 1. Header with date navigation, Theme Toggle & Google Admin status */}
      <NavigationHeader
        currentDate={currentDate}
        onPrevDay={handlePrevDay}
        onNextDay={handleNextDay}
        onToday={handleToday}
        onOpenCalendar={() => setIsCalendarOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        adminUser={adminUser}
        onOpenAdmin={() => setIsAdminOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        githubConnected={Boolean(githubConfig.token)}
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
        onOpenLectorModal={() => setIsLectorModalOpen(true)}
      />

      {/* 2. Horizontal Section Tabs (7 sections) */}
      <SectionNav
        activeSection={activeSectionId}
        onSelectSection={setActiveSectionId}
        pdfCounts={pdfCounts}
        currentLang={currentLang}
      />

      {/* 3. Main Content: Info365 vs Flipbook vs Standard Reader */}
      <main className="flex-1">
        {activeSectionId === 'info365' ? (
          <Info365View
            key={`info365-${currentLang}`}
            onSelectSection={(id) => setActiveSectionId(id)}
            adminUser={adminUser}
            onLogin={(user) => {
              setAdminUser(user);
              try { localStorage.setItem('drogowskazy_admin', JSON.stringify(user)); } catch {}
            }}
            onOpenAdmin={() => setIsAdminOpen(true)}
            onOpenQrModal={() => setIsAdminOpen(true)}
            currentLang={currentLang}
          />
        ) : activeSectionId === 'grafika' ? (
          <MediaGallerySectionView
            key={`grafika-${currentLang}`}
            section={activeSection}
            adminUser={adminUser}
            onLogin={(user) => {
              setAdminUser(user);
              try { localStorage.setItem('drogowskazy_admin', JSON.stringify(user)); } catch {}
            }}
            onOpenAdmin={() => setIsAdminOpen(true)}
            onOpenQrModal={() => setIsAdminOpen(true)}
            currentLang={currentLang}
            customEntries={customEntries}
            onSaveEntryText={handleSaveEntryText}
          />
        ) : activeSection.type === 'flipbook' ? (

          <FlipbookReader
            key={`flipbook-${activeSectionId}-${currentLang}`}
            section={activeSection}
            currentDate={currentDate}
            entry={displayedEntry}
            onSelectDate={setCurrentDate}
            onOpenCalendar={() => setIsCalendarOpen(false)}
            onOpenPdf={setViewingPdf}
            sectionPdfs={uploads}
            onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
            onOpenLectorModal={() => setIsLectorModalOpen(true)}
            currentLang={currentLang}
            customEntries={customEntries}
          />
        ) : (
          <StandardReader
            key={`reader-${activeSectionId}-${currentDate.dateKey}-${currentLang}`}
            section={activeSection}
            currentDate={currentDate}
            entry={displayedEntry}
            onSelectDate={setCurrentDate}
            onOpenCalendar={() => setIsCalendarOpen(true)}
            onOpenPdf={setViewingPdf}
            sectionPdfs={uploads}
            onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
            onOpenLectorModal={() => setIsLectorModalOpen(true)}
            currentLang={currentLang}
            theme={theme}
          />
        )}
      </main>

      {/* 4. Footer */}
      <footer className="bg-[#f2ece3] dark:bg-[#0a0f18] border-t border-[#e2d5c7] dark:border-[#1d2636] py-6 px-4 text-center text-xs text-[#7b6b5c] dark:text-[#8b949e] transition-colors">
        <div className="max-w-4xl mx-auto space-y-1.5">
          <p className="font-heading-cinzel font-semibold text-[#423325] dark:text-[#f0f6fc]">
            Droga365 • info365 • WnR365 • RHZ365 • Biblia365 • Bio365 • Grafika365
          </p>
          <p>
            Roczny cykl czytań od <span className="font-semibold text-[#8c572b] dark:text-amber-400">25 grudnia</span> do <span className="font-semibold text-[#8c572b] dark:text-amber-400">24 grudnia</span> • Administrator: Dominik Kuta
          </p>
          <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-[#8a7969] dark:text-[#7d8590]">
            <span>Statyczna aplikacja Cloudflare Pages</span>
            <span>•</span>
            <span>Źródło prawdy: GitHub ({githubConfig.owner}/{githubConfig.repo})</span>
            <span>•</span>
            <span>Google Antigravity Ready</span>
          </div>
        </div>
      </footer>

      {/* 5. Calendar Modal (Select month and day) */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={currentDate}
        onSelectDate={setCurrentDate}
        uploadedDateKeys={uploadedDateKeys}
      />

      {/* 5.5 Public Media & Interactive Simulation Viewer Modal */}
      {isPublicMediaViewerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-7xl max-h-[92vh] bg-[#faf7f2] dark:bg-[#0c121e] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header bar with close button */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-amber-900/40 via-purple-900/30 to-amber-950/40 border-b border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Podgląd multimediów i symulacji interaktywnych</span>
              </div>
              <button
                onClick={() => setIsPublicMediaViewerOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Zamknij podgląd"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <MediaLibraryViewer initialTab={publicMediaTab} readOnly={!adminUser} />
            </div>
          </div>
        </div>
      )}

      {/* 6. Admin Panel Modal (Google Login, GitHub sync, PDF uploads & Content Editor) */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        adminUser={adminUser}
        onLogin={user => setAdminUser(user)}
        onLogout={() => {
          setAdminUser(null);
          localStorage.removeItem('drogowskazy_admin');
        }}
        currentDate={currentDate}
        currentSectionId={activeSectionId}
        onSelectDate={setCurrentDate}
        onSelectSection={setActiveSectionId}
        uploads={uploads}
        onUploadSuccess={handleUploadSuccess}
        onDeleteUpload={handleDeleteUpload}
        onOpenPdf={setViewingPdf}
        onSaveEntryText={handleSaveEntryText}
        currentEntry={activeEntry}
        githubConfig={githubConfig}
        onSaveGitHubConfig={handleSaveGitHubConfig}
        onSyncAllToGitHub={handleSyncAllToGitHub}
        allEntriesData={{ entries: customEntries, uploads }}
        initialTab={adminTab}
      />

      {/* 7. PDF Viewer Modal */}
      <PdfViewerModal
        pdf={viewingPdf}
        onClose={() => setViewingPdf(null)}
      />

      {/* 8. Download & POD Publishing Modal (PDF, ePUB, Word DOCX, 16 Languages) */}
      <DownloadPublishModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        entry={displayedEntry}
        meta={activeSection}
        uploadedFiles={uploads}
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
      />

      {/* 9. Audio Lector Settings Modal (Local Web Speech API & Online AI Cloud Voices) */}
      <LectorSettingsModal
        isOpen={isLectorModalOpen}
        onClose={() => setIsLectorModalOpen(false)}
        currentLang={currentLang}
      />

      {/* 10. Global Search Modal (Single Section / All Sections Search) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        currentSectionId={activeSectionId}
        onSelectResult={(secId, date) => {
          setActiveSectionId(secId);
          setCurrentDate(date);
        }}
        customEntries={customEntries}
      />
    </div>
  );
}
