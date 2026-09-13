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
import { CalendarModal } from './components/CalendarModal';
import { AdminPanel } from './components/AdminPanel';
import { PdfViewerModal } from './components/PdfViewerModal';
import { DownloadPublishModal } from './components/DownloadPublishModal';
import { fetchEntriesFromGitHub, syncStateToGitHub } from './utils/githubSync';
import { translateEntry } from './utils/translationService';

export default function App() {
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

  // 3. Current Section & Date (defaulting to info365 as first section and today's date in cycle starting Dec 25)
  const [activeSectionId, setActiveSectionId] = useState<SectionId>('info365');
  const [currentDate, setCurrentDate] = useState<CycleDate>(() => getTodayCycleDate());

  // 4. Modals state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [viewingPdf, setViewingPdf] = useState<UploadedPdf | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

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
  const [githubConfig, setGithubConfig] = useState<GitHubConfig>(() => {
    try {
      const saved = localStorage.getItem('drogowskazy_github_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      owner: 'deejaykey32-star',
      repo: 'embik365',
      branch: 'main',
      token: '',
      autoSync: true,
      useGitHubAsPrimarySource: false
    };
  });

  const handleSaveGitHubConfig = (cfg: GitHubConfig) => {
    setGithubConfig(cfg);
    try {
      localStorage.setItem('drogowskazy_github_config', JSON.stringify(cfg));
    } catch {}
  };

  // 7. Entries and Uploads state
  const [customEntries, setCustomEntries] = useState<Record<string, Partial<SectionEntry>>>({});
  const [uploads, setUploads] = useState<UploadedPdf[]>([]);

  // 8. Translation cache and active translated entry
  const [translatedEntry, setTranslatedEntry] = useState<SectionEntry | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Fetch initial data: GitHub > API > Static /data/entries.json
  useEffect(() => {
    const fetchData = async () => {
      // 1. Try GitHub directly if configured as primary source
      if (githubConfig.token && githubConfig.useGitHubAsPrimarySource) {
        try {
          const ghData = await fetchEntriesFromGitHub(githubConfig);
          if (ghData) {
            if (ghData.entries) setCustomEntries(ghData.entries);
            if (ghData.uploads) setUploads(ghData.uploads);
            return;
          }
        } catch (e) {
          console.warn('Could not load from GitHub primary source, falling back to local:', e);
        }
      }

      // 2. Try dev server API
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const json = await res.json();
          if (json.entries) setCustomEntries(json.entries);
          if (json.uploads) setUploads(json.uploads);
          return;
        }
      } catch {}

      // 3. Try static file /data/entries.json (for Cloudflare Pages static hosting)
      try {
        const staticRes = await fetch('/data/entries.json');
        if (staticRes.ok) {
          const json = await staticRes.json();
          if (json.entries) setCustomEntries(json.entries);
          if (json.uploads) setUploads(json.uploads);
        }
      } catch (err) {
        console.warn('Could not fetch static entries.json:', err);
      }
    };

    fetchData();
  }, [githubConfig.useGitHubAsPrimarySource]);

  // Compute active section metadata
  const activeSection = getSectionById(activeSectionId);

  // Compute current entry (combining default/generated text with any custom server edits)
  const baseEntry = getEntryForSectionAndDate(activeSectionId, currentDate);
  const customOverride = customEntries[`${activeSectionId}-${currentDate.dateKey}`] ||
    (activeSectionId === 'ebook_wnr' ? customEntries[`wnr365-${currentDate.dateKey}`] : undefined) ||
    (activeSectionId === 'wnr365' ? customEntries[`ebook_wnr-${currentDate.dateKey}`] : undefined);
  const activeEntry: SectionEntry = {
    ...baseEntry,
    ...(customOverride || {}),
    pdfs: uploads.filter(
      p => p.sectionId === activeSectionId && (!p.dateKey || p.dateKey === currentDate.dateKey)
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
        uploads: updatedUploads
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
          uploads
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
      uploads
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
        adminUser={adminUser}
        onOpenAdmin={() => setIsAdminOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        githubConnected={Boolean(githubConfig.token)}
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
      />

      {/* 2. Horizontal Section Tabs (7 sections) */}
      <SectionNav
        activeSection={activeSectionId}
        onSelectSection={setActiveSectionId}
        pdfCounts={pdfCounts}
      />

      {/* 3. Main Content: Info365 vs Flipbook vs Standard Reader */}
      <main className="flex-1">
        {activeSectionId === 'info365' ? (
          <Info365View
            key={`info365-${currentDate.dateKey}-${currentLang}`}
            onNavigateToSection={(id) => setActiveSectionId(id)}
            onOpenCalendar={() => setIsCalendarOpen(true)}
            onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
            currentDate={currentDate}
            theme={theme}
          />
        ) : activeSection.type === 'flipbook' ? (
          <FlipbookReader
            key={`flipbook-${activeSectionId}-${currentDate.dateKey}-${currentLang}`}
            section={activeSection}
            currentDate={currentDate}
            entry={displayedEntry}
            onSelectDate={setCurrentDate}
            onOpenCalendar={() => setIsCalendarOpen(true)}
            onOpenPdf={setViewingPdf}
            sectionPdfs={uploads}
            onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
            currentLang={currentLang}
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
            currentLang={currentLang}
            theme={theme}
          />
        )}
      </main>

      {/* 4. Footer */}
      <footer className="bg-[#f2ece3] dark:bg-[#0a0f18] border-t border-[#e2d5c7] dark:border-[#1d2636] py-6 px-4 text-center text-xs text-[#7b6b5c] dark:text-[#8b949e] transition-colors">
        <div className="max-w-4xl mx-auto space-y-1.5">
          <p className="font-heading-cinzel font-semibold text-[#423325] dark:text-[#f0f6fc]">
            Drogowskazy 365 • info365 • WnR365 • RHZ365 • Biblia365 • Bio365
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
    </div>
  );
}
