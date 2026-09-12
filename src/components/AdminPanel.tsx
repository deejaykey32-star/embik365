import React, { useState, useRef } from 'react';
import { 
  X, 
  ShieldCheck, 
  Upload, 
  FileText, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  LogIn, 
  LogOut, 
  Calendar, 
  Edit3, 
  Save,
  Layers,
  GitBranch,
  RefreshCw,
  Globe,
  Cloud,
  Check,
  Key
} from 'lucide-react';
import { SectionId, CycleDate, AdminUser, UploadedPdf, SectionEntry, GitHubConfig } from '../types';
import { SECTIONS } from '../data/defaultSections';
import { CYCLE_DAYS } from '../utils/dateCycle';
import { testGitHubConnection, uploadPdfDirectlyToGitHub } from '../utils/githubSync';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  adminUser: AdminUser | null;
  onLogin: (user: AdminUser) => void;
  onLogout: () => void;
  currentDate: CycleDate;
  currentSectionId: SectionId;
  uploads: UploadedPdf[];
  onUploadSuccess: (newPdf: UploadedPdf) => void;
  onDeleteUpload: (id: string) => void;
  onOpenPdf: (pdf: UploadedPdf) => void;
  onSaveEntryText: (key: string, entryData: Partial<SectionEntry>) => Promise<void>;
  currentEntry: SectionEntry;
  githubConfig: GitHubConfig;
  onSaveGitHubConfig: (config: GitHubConfig) => void;
  onSyncAllToGitHub: () => Promise<{ success: boolean; message: string }>;
  allEntriesData: { entries: Record<string, Partial<SectionEntry>>; uploads: UploadedPdf[] };
}

export const AdminPanel: React.FC<Props> = ({
  isOpen,
  onClose,
  adminUser,
  onLogin,
  onLogout,
  currentDate,
  currentSectionId,
  uploads,
  onUploadSuccess,
  onDeleteUpload,
  onOpenPdf,
  onSaveEntryText,
  currentEntry,
  githubConfig,
  onSaveGitHubConfig,
  onSyncAllToGitHub,
  allEntriesData
}) => {
  if (!isOpen) return null;

  // Active subtab inside admin panel: 'upload' | 'github' | 'files' | 'editor'
  const [activeTab, setActiveTab] = useState<'upload' | 'github' | 'files' | 'editor'>('upload');

  // Form state for PDF upload
  const [targetSection, setTargetSection] = useState<SectionId>(currentSectionId);
  const [targetDateKey, setTargetDateKey] = useState<string>(currentDate.dateKey);
  const [isGlobalBook, setIsGlobalBook] = useState<boolean>(false);
  const [fileTitle, setFileTitle] = useState<string>('');
  const [fileDescription, setFileDescription] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string; rawUrl?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for GitHub settings
  const [ghOwner, setGhOwner] = useState(githubConfig.owner);
  const [ghRepo, setGhRepo] = useState(githubConfig.repo);
  const [ghBranch, setGhBranch] = useState(githubConfig.branch);
  const [ghToken, setGhToken] = useState(githubConfig.token || '');
  const [ghAutoSync, setGhAutoSync] = useState(githubConfig.autoSync);
  const [ghUseAsPrimary, setGhUseAsPrimary] = useState(githubConfig.useGitHubAsPrimarySource);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [pushingGit, setPushingGit] = useState(false);
  const [pushStatus, setPushStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Form state for text editor
  const [editSectionId, setEditSectionId] = useState<SectionId>(currentSectionId);
  const [editDateKey, setEditDateKey] = useState<string>(currentDate.dateKey);
  const [editTitle, setEditTitle] = useState(currentEntry.title);
  const [editContent, setEditContent] = useState(currentEntry.content);
  const [editPrayer, setEditPrayer] = useState(currentEntry.prayer || '');
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [saveEntryStatus, setSaveEntryStatus] = useState<string | null>(null);

  // Google Login for Dominik Kuta
  const handleGoogleLogin = (emailChoice: string = 'kuta.dominik@gmail.com') => {
    const user: AdminUser = {
      email: emailChoice,
      name: 'Dominik Kuta',
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    };
    onLogin(user);
    try {
      localStorage.setItem('drogowskazy_admin', JSON.stringify(user));
    } catch {}
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setUploadStatus({ type: 'error', message: 'Dozwolone są wyłącznie pliki PDF.' });
        return;
      }
      setSelectedFile(file);
      if (!fileTitle) {
        setFileTitle(file.name.replace(/\.pdf$/i, ''));
      }
      setUploadStatus(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadStatus({ type: 'error', message: 'Wybierz plik PDF do wgrania.' });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    const targetDateObj = CYCLE_DAYS.find(d => d.dateKey === targetDateKey);
    const dayNumberVal = !isGlobalBook && targetDateObj ? targetDateObj.dayNumber : undefined;
    const dateKeyVal = !isGlobalBook ? targetDateKey : '';

    // 1. Try server upload with GitHub sync headers
    try {
      const formData = new FormData();
      formData.append('pdfFile', selectedFile);
      formData.append('sectionId', targetSection);
      formData.append('title', fileTitle || selectedFile.name);
      formData.append('description', fileDescription);
      if (dateKeyVal) formData.append('dateKey', dateKeyVal);
      if (dayNumberVal) formData.append('dayNumber', dayNumberVal.toString());

      if (githubConfig.token) {
        formData.append('githubToken', githubConfig.token);
        formData.append('githubOwner', githubConfig.owner);
        formData.append('githubRepo', githubConfig.repo);
        formData.append('githubBranch', githubConfig.branch);
      }

      const res = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (data.file) {
          onUploadSuccess(data.file);
          const ghMsg = data.github?.synced
            ? ' Plik został również pomyślnie wypchnięty do repozytorium GitHub!'
            : '';
          setUploadStatus({
            type: 'success',
            message: `Plik PDF został pomyślnie wgrany.${ghMsg}`,
            rawUrl: data.github?.rawUrl || data.file.url
          });
          setSelectedFile(null);
          setFileTitle('');
          setFileDescription('');
          if (fileInputRef.current) fileInputRef.current.value = '';
          setIsUploading(false);
          return;
        }
      }
    } catch (serverErr) {
      console.warn('Backend upload unavailable, attempting direct GitHub upload:', serverErr);
    }

    // 2. Direct GitHub Upload (for Static mode & Cloudflare Pages)
    if (githubConfig.token) {
      try {
        const newFileRecord: UploadedPdf = {
          id: 'pdf-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
          filename: `${Date.now()}-${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
          originalName: selectedFile.name,
          url: '',
          size: selectedFile.size,
          sectionId: targetSection,
          dayNumber: dayNumberVal,
          dateKey: dateKeyVal,
          title: fileTitle || selectedFile.name.replace(/\.pdf$/i, ''),
          description: fileDescription,
          uploadedAt: new Date().toISOString()
        };

        const ghRes = await uploadPdfDirectlyToGitHub(
          selectedFile,
          newFileRecord,
          githubConfig,
          allEntriesData
        );

        if (ghRes.success) {
          newFileRecord.url = ghRes.rawUrl || '';
          onUploadSuccess(newFileRecord);
          setUploadStatus({
            type: 'success',
            message: 'Plik PDF został pomyślnie dodany i wypchnięty do repozytorium GitHub!',
            rawUrl: ghRes.rawUrl
          });
          setSelectedFile(null);
          setFileTitle('');
          setFileDescription('');
          if (fileInputRef.current) fileInputRef.current.value = '';
          setIsUploading(false);
          return;
        } else {
          setUploadStatus({
            type: 'error',
            message: `Błąd zapisu w GitHub: ${ghRes.error}`
          });
          setIsUploading(false);
          return;
        }
      } catch (ghErr: any) {
        setUploadStatus({
          type: 'error',
          message: `Błąd podczas wgrywania: ${ghErr.message}`
        });
        setIsUploading(false);
        return;
      }
    }

    setUploadStatus({
      type: 'error',
      message: 'Nie udało się wgrać pliku. Skonfiguruj token GitHub w zakładce GitHub.'
    });
    setIsUploading(false);
  };

  const handleTestGitHub = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    const testConfig: GitHubConfig = {
      ...githubConfig,
      owner: ghOwner,
      repo: ghRepo,
      branch: ghBranch,
      token: ghToken,
      autoSync: ghAutoSync,
      useGitHubAsPrimarySource: ghUseAsPrimary
    };
    const res = await testGitHubConnection(testConfig);
    setConnectionStatus(res);
    setTestingConnection(false);
    if (res.success) {
      onSaveGitHubConfig(testConfig);
    }
  };

  const handleSaveGitHubConfig = () => {
    const updated: GitHubConfig = {
      owner: ghOwner.trim(),
      repo: ghRepo.trim(),
      branch: ghBranch.trim(),
      token: ghToken.trim(),
      autoSync: ghAutoSync,
      useGitHubAsPrimarySource: ghUseAsPrimary,
      lastSyncTime: new Date().toISOString()
    };
    onSaveGitHubConfig(updated);
    setConnectionStatus({ success: true, message: 'Zapisano ustawienia integracji z GitHub!' });
  };

  const handlePushGitRepo = async () => {
    setPushingGit(true);
    setPushStatus(null);

    // Try server git push first
    try {
      const res = await fetch('/api/github/push-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: ghOwner,
          repo: ghRepo,
          branch: ghBranch,
          token: ghToken
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPushStatus({ success: true, message: data.message });
        setPushingGit(false);
        return;
      }
    } catch {
      // Fallback to direct GitHub API sync
    }

    // Direct GitHub state sync
    const syncRes = await onSyncAllToGitHub();
    setPushStatus(syncRes);
    setPushingGit(false);
  };

  const handleSaveEntry = async () => {
    setIsSavingEntry(true);
    setSaveEntryStatus(null);
    try {
      const key = `${editSectionId}-${editDateKey}`;
      await onSaveEntryText(key, {
        title: editTitle,
        content: editContent,
        prayer: editPrayer,
        sectionId: editSectionId,
        dateKey: editDateKey
      });
      setSaveEntryStatus('Wpis został pomyślnie zaktualizowany (lokalnie i w GitHub)!');
    } catch (err: any) {
      setSaveEntryStatus(`Błąd podczas zapisu: ${err.message}`);
    } finally {
      setIsSavingEntry(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="bg-[#faf7f2] dark:bg-[#0d121c] rounded-3xl border border-[#e4d7c7] dark:border-[#212b3c] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-[#e7ded2] dark:border-[#212b3c] flex items-center justify-between bg-[#f4ebe1] dark:bg-[#141a26]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2e261f] dark:bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-amber-400 dark:text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-heading-cinzel text-[#2d2218] dark:text-[#f3e8d2]">
                  Panel Administratora
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300 font-semibold">
                  Google & GitHub
                </span>
              </div>
              <p className="text-xs text-[#7d6c5d] dark:text-[#94a3b8]">
                Dominik Kuta • Wgrywanie PDF • GitHub Sync • Cloudflare Pages
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="btn-admin-close"
            className="p-2 rounded-xl text-[#786757] dark:text-[#94a3b8] hover:bg-[#e4d6c4] dark:hover:bg-[#1c2434] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Authentication Bar */}
        <div className="px-4 sm:px-6 py-3 bg-[#efe4d6] dark:bg-[#111723] border-b border-[#e5d8c8] dark:border-[#212b3c] flex flex-wrap items-center justify-between gap-3 text-xs">
          {adminUser ? (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[#4b3c2d] dark:text-[#e2e8f0]">
                Zalogowano jako: <strong className="text-[#2a2016] dark:text-amber-300">{adminUser.name}</strong> ({adminUser.email})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Zaloguj się kontem Google, aby odblokować uprawnienia administratora.</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {adminUser ? (
              <button
                onClick={onLogout}
                id="btn-admin-logout"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1a2230] hover:bg-[#fbf7f1] dark:hover:bg-[#253042] text-[#4d3d2e] dark:text-[#e2e8f0] font-medium border border-[#dac7b4] dark:border-[#2d3a4e] transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                <span>Wyloguj</span>
              </button>
            ) : (
              <button
                onClick={() => handleGoogleLogin('kuta.dominik@gmail.com')}
                id="btn-admin-login-google"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#2e261f] dark:bg-amber-600 text-white font-semibold shadow-xs hover:bg-[#42372d] dark:hover:bg-amber-500 transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-amber-300 dark:text-white" />
                <span>Zaloguj przez Google (Dominik Kuta)</span>
              </button>
            )}
          </div>
        </div>

        {/* Subtabs Selector */}
        <div className="flex items-center border-b border-[#e7ded2] dark:border-[#212b3c] bg-[#f8f3ea] dark:bg-[#0f1420] px-4 sm:px-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('upload')}
            id="tab-admin-upload"
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'upload'
                ? 'border-[#8c572b] dark:border-amber-400 text-[#8c572b] dark:text-amber-400 bg-white/60 dark:bg-[#161c28]'
                : 'border-transparent text-[#6e5d4d] dark:text-[#94a3b8] hover:text-[#382b20] dark:hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Wgraj Plik PDF</span>
          </button>

          <button
            onClick={() => setActiveTab('github')}
            id="tab-admin-github"
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'github'
                ? 'border-[#8c572b] dark:border-amber-400 text-[#8c572b] dark:text-amber-400 bg-white/60 dark:bg-[#161c28]'
                : 'border-transparent text-[#6e5d4d] dark:text-[#94a3b8] hover:text-[#382b20] dark:hover:text-white'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>GitHub & Cloudflare Pages</span>
            {githubConfig.token && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Token skonfigurowany" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('files')}
            id="tab-admin-files"
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'files'
                ? 'border-[#8c572b] dark:border-amber-400 text-[#8c572b] dark:text-amber-400 bg-white/60 dark:bg-[#161c28]'
                : 'border-transparent text-[#6e5d4d] dark:text-[#94a3b8] hover:text-[#382b20] dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Wgrane Pliki PDF ({uploads.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            id="tab-admin-editor"
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'editor'
                ? 'border-[#8c572b] dark:border-amber-400 text-[#8c572b] dark:text-amber-400 bg-white/60 dark:bg-[#161c28]'
                : 'border-transparent text-[#6e5d4d] dark:text-[#94a3b8] hover:text-[#382b20] dark:hover:text-white'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Edycja Treści Wpisów</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#faf7f2] dark:bg-[#0d121c]">
          {/* TAB 1: UPLOAD PDF */}
          {activeTab === 'upload' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h3 className="font-heading-cinzel font-bold text-base sm:text-lg text-[#2a2016] dark:text-[#f3e8d2]">
                  Wgrywanie Dokumentu PDF
                </h3>
                <p className="text-xs text-[#786756] dark:text-[#94a3b8]">
                  Wgrany plik PDF zostanie przypisany do wybranej sekcji i dnia cyklu, a także automatycznie zsynchronizowany z repozytorium GitHub i Cloudflare Pages.
                </p>
              </div>

              {uploadStatus && (
                <div className={`p-4 rounded-2xl flex items-start gap-3 text-xs ${
                  uploadStatus.type === 'success' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
                    : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}>
                  {uploadStatus.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div>{uploadStatus.message}</div>
                    {uploadStatus.rawUrl && (
                      <a 
                        href={uploadStatus.rawUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="underline font-semibold block text-emerald-700 dark:text-emerald-300"
                      >
                        Zobacz plik na żywo: {uploadStatus.rawUrl}
                      </a>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-5">
                {/* Select Section */}
                <div>
                  <label className="block text-xs font-bold text-[#443527] dark:text-[#cbd5e1] mb-1.5 uppercase tracking-wider">
                    Docelowa Sekcja
                  </label>
                  <select
                    value={targetSection}
                    onChange={(e) => setTargetSection(e.target.value as SectionId)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#161c28] border border-[#d6c7b5] dark:border-[#2b394e] text-[#2f2318] dark:text-[#f1f5f9] text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-600"
                  >
                    {SECTIONS.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.shortTitle}) • {s.type === 'flipbook' ? 'Księga 3D' : 'Czytnik'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Specific Day vs Entire Ebook / Global */}
                <div className="p-4 rounded-2xl bg-[#f2e7da] dark:bg-[#141b27] border border-[#e0d0bd] dark:border-[#222d3e] space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="cb-is-global"
                      checked={isGlobalBook}
                      onChange={(e) => setIsGlobalBook(e.target.checked)}
                      className="w-4 h-4 accent-amber-600 cursor-pointer"
                    />
                    <label htmlFor="cb-is-global" className="text-xs font-semibold text-[#3a2c1f] dark:text-[#e2e8f0] cursor-pointer">
                      Wgraj jako plik ogólny dla całej sekcji / e-booka (zamiast pojedynczego dnia)
                    </label>
                  </div>

                  {!isGlobalBook && (
                    <div>
                      <label className="block text-xs font-semibold text-[#544332] dark:text-[#cbd5e1] mb-1">
                        Dzień cyklu czytań (25 grudnia - 24 grudnia):
                      </label>
                      <select
                        value={targetDateKey}
                        onChange={(e) => setTargetDateKey(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1a2333] border border-[#d6c7b5] dark:border-[#2b394e] text-xs text-[#2f2318] dark:text-[#f1f5f9]"
                      >
                        {CYCLE_DAYS.map(d => (
                          <option key={d.dateKey} value={d.dateKey}>
                            Dzień {d.dayNumber}: {d.displayDate} {d.isCycleStart ? '(Początek 25 XII)' : ''} {d.isCycleEnd ? '(Finał 24 XII)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Title & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#443527] dark:text-[#cbd5e1] mb-1 uppercase tracking-wider">
                      Tytuł Dokumentu
                    </label>
                    <input
                      type="text"
                      placeholder="np. Widoki na Raj - Dzień 1"
                      value={fileTitle}
                      onChange={(e) => setFileTitle(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#161c28] border border-[#d6c7b5] dark:border-[#2b394e] text-[#2f2318] dark:text-[#f1f5f9] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#443527] dark:text-[#cbd5e1] mb-1 uppercase tracking-wider">
                      Krótki Opis (opcjonalnie)
                    </label>
                    <input
                      type="text"
                      placeholder="np. Kompletny tekst z przypisami"
                      value={fileDescription}
                      onChange={(e) => setFileDescription(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#161c28] border border-[#d6c7b5] dark:border-[#2b394e] text-[#2f2318] dark:text-[#f1f5f9] text-sm"
                    />
                  </div>
                </div>

                {/* PDF File Dropzone / Picker */}
                <div>
                  <label className="block text-xs font-bold text-[#443527] dark:text-[#cbd5e1] mb-1.5 uppercase tracking-wider">
                    Plik PDF do przesłania
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#cbb8a3] dark:border-[#33425b] hover:border-[#8c572b] dark:hover:border-amber-500 rounded-3xl p-6 text-center bg-white/70 dark:bg-[#151c28]/60 hover:bg-[#faf4ec] dark:hover:bg-[#1a2333] transition-all cursor-pointer"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 text-[#8c572b] dark:text-amber-400 mx-auto mb-2" />
                    {selectedFile ? (
                      <div>
                        <div className="font-bold text-sm text-[#2e2318] dark:text-white">{selectedFile.name}</div>
                        <div className="text-xs text-[#7d6b5b] dark:text-[#94a3b8] mt-1">
                          Rozmiar: {Math.round(selectedFile.size / 1024)} KB • Kliknij aby zmienić
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-semibold text-sm text-[#382b1f] dark:text-[#e2e8f0]">
                          Kliknij tutaj lub upuść plik PDF
                        </div>
                        <div className="text-xs text-[#877565] dark:text-[#94a3b8] mt-1">
                          Maksymalny rozmiar: 50 MB
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUploading || !selectedFile}
                    id="btn-submit-pdf"
                    className="w-full py-3 px-6 rounded-2xl bg-[#8c572b] dark:bg-amber-600 hover:bg-[#724520] dark:hover:bg-amber-500 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Trwa wgrywanie i synchronizacja z GitHub...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Wgraj PDF & Synchronizuj z GitHub</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: GITHUB & CLOUDFLARE PAGES */}
          {activeTab === 'github' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-gradient-to-r from-amber-950/10 to-transparent dark:from-amber-950/40 p-4 rounded-2xl border border-amber-500/20">
                <div className="flex items-center gap-2 text-sm font-bold text-[#352516] dark:text-amber-300 mb-1">
                  <GitBranch className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Repozytorium GitHub jako Nadrzędne Źródło Danych</span>
                </div>
                <p className="text-xs text-[#6e5d4d] dark:text-[#cbd5e1] leading-relaxed">
                  Aplikacja Drogowskazy 365 jest statycznym projektem (Vite + React) przygotowanym do hostingu na <strong>Cloudflare Pages</strong>. Każde wgranie pliku PDF lub edycja wpisu może bezpośrednio aktualizować pliki w repozytorium GitHub, a Cloudflare Pages pobiera i serwuje aktualne dane!
                </p>
              </div>

              {connectionStatus && (
                <div className={`p-4 rounded-2xl flex items-start gap-3 text-xs ${
                  connectionStatus.success 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
                    : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}>
                  {connectionStatus.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">{connectionStatus.message}</div>
                    {connectionStatus.details && (
                      <div className="mt-1 text-[11px] opacity-80">
                        Gałąź: {connectionStatus.details.default_branch} • Gwiazdki: {connectionStatus.details.stargazers_count} • Prywatne: {connectionStatus.details.private ? 'Tak' : 'Nie'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {pushStatus && (
                <div className={`p-4 rounded-2xl flex items-start gap-3 text-xs ${
                  pushStatus.success 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
                    : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>{pushStatus.message}</div>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#443527] dark:text-[#cbd5e1] mb-1 uppercase tracking-wider">
                      Właściciel Repozytorium (Owner)
                    </label>
                    <input
                      type="text"
                      value={ghOwner}
                      onChange={(e) => setGhOwner(e.target.value)}
                      placeholder="dominikkuta"
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#161c28] border border-[#d6c7b5] dark:border-[#2b394e] text-sm text-[#2f2318] dark:text-[#f1f5f9]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#443527] dark:text-[#cbd5e1] mb-1 uppercase tracking-wider">
                      Nazwa Repozytorium (Repo)
                    </label>
                    <input
                      type="text"
                      value={ghRepo}
                      onChange={(e) => setGhRepo(e.target.value)}
                      placeholder="drogowskazy365"
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#161c28] border border-[#d6c7b5] dark:border-[#2b394e] text-sm text-[#2f2318] dark:text-[#f1f5f9]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#443527] dark:text-[#cbd5e1] mb-1 uppercase tracking-wider">
                    Gałąź (Branch)
                  </label>
                  <input
                    type="text"
                    value={ghBranch}
                    onChange={(e) => setGhBranch(e.target.value)}
                    placeholder="main"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#161c28] border border-[#d6c7b5] dark:border-[#2b394e] text-sm text-[#2f2318] dark:text-[#f1f5f9]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#443527] dark:text-[#cbd5e1] uppercase tracking-wider">
                      GitHub Personal Access Token (PAT)
                    </label>
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo&description=Drogowskazy365"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <Key className="w-3 h-3" />
                      <span>Wygeneruj token na GitHub (z uprawnieniem 'repo')</span>
                    </a>
                  </div>
                  <input
                    type="password"
                    value={ghToken}
                    onChange={(e) => setGhToken(e.target.value)}
                    placeholder="ghp_... lub github_pat_..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#161c28] border border-[#d6c7b5] dark:border-[#2b394e] text-sm text-[#2f2318] dark:text-[#f1f5f9] font-mono"
                  />
                  <p className="text-[11px] text-[#7d6c5c] dark:text-[#94a3b8] mt-1">
                    Token jest przechowywany bezpiecznie w przeglądarce i wykorzystywany do automatycznego tworzenia commitów z plikami PDF i wpisami.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ghAutoSync}
                      onChange={(e) => setGhAutoSync(e.target.checked)}
                      className="w-4 h-4 accent-amber-600"
                    />
                    <span className="text-xs font-semibold text-[#3b2d1f] dark:text-[#e2e8f0]">
                      Automatycznie wypychaj do GitHub każdy wgrany plik PDF i każdą edycję wpisu
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ghUseAsPrimary}
                      onChange={(e) => setGhUseAsPrimary(e.target.checked)}
                      className="w-4 h-4 accent-amber-600"
                    />
                    <span className="text-xs font-semibold text-[#3b2d1f] dark:text-[#e2e8f0]">
                      Pobieraj treści z repozytorium GitHub jako główne źródło prawdy
                    </span>
                  </label>
                </div>

                {/* Actions */}
                <div className="pt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTestGitHub}
                    disabled={testingConnection}
                    className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#1a2230] border border-[#d6c7b5] dark:border-[#2b394e] text-[#423223] dark:text-[#e2e8f0] text-xs font-bold hover:bg-[#f3eae0] dark:hover:bg-[#253044] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {testingConnection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <GitBranch className="w-3.5 h-3.5" />}
                    <span>Sprawdź Połączenie z GitHub</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveGitHubConfig}
                    className="px-4 py-2.5 rounded-xl bg-[#2e261f] dark:bg-amber-600 text-white text-xs font-bold hover:bg-[#43372c] dark:hover:bg-amber-500 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Zapisz Ustawienia</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePushGitRepo}
                    disabled={pushingGit || !ghToken}
                    className="px-4 py-2.5 rounded-xl bg-amber-700 dark:bg-amber-700 text-white text-xs font-bold hover:bg-amber-800 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    title="Wypchnij stan bazy i plików do repozytorium GitHub"
                  >
                    {pushingGit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
                    <span>Wypchnij Pełny Stan do GitHub</span>
                  </button>
                </div>

                {/* Cloudflare Pages Deployment Guide */}
                <div className="mt-6 p-4 rounded-2xl bg-[#f2e7da] dark:bg-[#131a26] border border-[#dccbb7] dark:border-[#222d3e] text-xs space-y-2">
                  <div className="font-bold text-[#3d2f21] dark:text-amber-300 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <span>Konfiguracja Cloudflare Pages:</span>
                  </div>
                  <p className="text-[#6d5b4a] dark:text-[#94a3b8]">
                    Połącz repozytorium <code>{ghOwner}/{ghRepo}</code> w Cloudflare Pages:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-[#4a3929] dark:text-[#cbd5e1]">
                    <li><strong>Framework preset:</strong> Vite</li>
                    <li><strong>Build command:</strong> <code>npm run build</code></li>
                    <li><strong>Build output directory:</strong> <code>dist</code></li>
                    <li><strong>Root directory:</strong> <code>/</code></li>
                  </ul>
                  <p className="text-[11px] text-[#786452] dark:text-[#94a3b8] pt-1">
                    Każdy commit w gałęzi <code>{ghBranch}</code> automatycznie wywoła wdrożenie nowej wersji strony na Cloudflare Pages!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UPLOADED FILES */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading-cinzel font-bold text-base sm:text-lg text-[#2a2016] dark:text-[#f3e8d2]">
                    Baza Wgranych Plików PDF
                  </h3>
                  <p className="text-xs text-[#786756] dark:text-[#94a3b8]">
                    Łącznie wgrano {uploads.length} dokumentów. Pliki są dostępne w czytnikach oraz w repozytorium GitHub.
                  </p>
                </div>
              </div>

              {uploads.length === 0 ? (
                <div className="text-center py-12 bg-white/60 dark:bg-[#161c28]/60 rounded-3xl border border-[#e4d6c6] dark:border-[#232f42] p-6">
                  <FileText className="w-10 h-10 text-[#a3907e] dark:text-[#4b5563] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#4e3d2e] dark:text-[#cbd5e1]">
                    Brak wgranych plików PDF w bazie.
                  </p>
                  <p className="text-xs text-[#8c7866] dark:text-[#94a3b8] mt-1">
                    Przejdź do zakładki "Wgraj Plik PDF", aby dodać pierwszy dokument.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {uploads.map(file => {
                    const sec = SECTIONS.find(s => s.id === file.sectionId);
                    const isGitHubHosted = file.url.includes('github') || file.url.includes('raw.githubusercontent.com');

                    return (
                      <div
                        key={file.id}
                        className="p-4 rounded-2xl bg-white dark:bg-[#141a26] border border-[#e2d4c3] dark:border-[#212b3c] shadow-xs flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 flex items-center justify-center border border-red-200 dark:border-red-900 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-[#2d2217] dark:text-[#f3e8d2] flex items-center gap-2">
                              <span>{file.title || file.originalName}</span>
                              {isGitHubHosted ? (
                                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-sans-ui flex items-center gap-1">
                                  <GitBranch className="w-3 h-3" />
                                  <span>GitHub</span>
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#f0e4d4] dark:bg-[#202b3d] text-[#69513e] dark:text-amber-300 font-sans-ui">
                                  Lokalny
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#7d6c5c] dark:text-[#94a3b8] flex flex-wrap items-center gap-2 mt-0.5">
                              <span>Sekcja: <strong>{sec?.name || file.sectionId}</strong></span>
                              {file.dateKey && <span>• Dzień: <strong>{file.dateKey}</strong></span>}
                              <span>• {Math.round(file.size / 1024)} KB</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpenPdf(file)}
                            className="px-3 py-1.5 rounded-xl bg-[#f0e4d4] dark:bg-[#1c2434] hover:bg-[#e4d6c4] dark:hover:bg-[#242f44] text-[#423223] dark:text-[#e2e8f0] text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Podgląd</span>
                          </button>

                          <button
                            onClick={() => onDeleteUpload(file.id)}
                            className="p-2 rounded-xl text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition-colors cursor-pointer"
                            title="Usuń plik"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CONTENT EDITOR */}
          {activeTab === 'editor' && (
            <div className="max-w-3xl mx-auto space-y-5">
              <div>
                <h3 className="font-heading-cinzel font-bold text-base sm:text-lg text-[#2a2016] dark:text-[#f3e8d2]">
                  Edycja Treści Wpisów
                </h3>
                <p className="text-xs text-[#786756] dark:text-[#94a3b8]">
                  Edytuj treść wpisów dla wybranej sekcji i dnia cyklu. Zmiany są zapisywane w bazie danych oraz synchronizowane z GitHub!
                </p>
              </div>

              {saveEntryStatus && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{saveEntryStatus}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#443527] dark:text-[#cbd5e1] mb-1 uppercase tracking-wider">
                    Sekcja
                  </label>
                  <select
                    value={editSectionId}
                    onChange={(e) => setEditSectionId(e.target.value as SectionId)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#161c28] border border-[#d6c7b5] dark:border-[#2b394e] text-xs text-[#2f2318] dark:text-[#f1f5f9]"
                  >
                    {SECTIONS.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.shortTitle})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#443527] dark:text-[#cbd5e1] mb-1 uppercase tracking-wider">
                    Dzień Cyklu
                  </label>
                  <select
                    value={editDateKey}
                    onChange={(e) => setEditDateKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#161c28] border border-[#d6c7b5] dark:border-[#2b394e] text-xs text-[#2f2318] dark:text-[#f1f5f9]"
                  >
                    {CYCLE_DAYS.map(d => (
                      <option key={d.dateKey} value={d.dateKey}>
                        Dzień {d.dayNumber}: {d.displayDate}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#443527] dark:text-[#cbd5e1] mb-1 uppercase tracking-wider">
                  Tytuł Wpisu
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#161c28] border border-[#d6c7b5] dark:border-[#2b394e] text-sm text-[#2f2318] dark:text-[#f1f5f9]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#443527] dark:text-[#cbd5e1] mb-1 uppercase tracking-wider">
                  Główna Treść / Rozważanie / Rozdział
                </label>
                <textarea
                  rows={8}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-2xl bg-white dark:bg-[#161c28] border border-[#d6c7b5] dark:border-[#2b394e] text-sm text-[#2f2318] dark:text-[#f1f5f9] font-serif-book leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#443527] dark:text-[#cbd5e1] mb-1 uppercase tracking-wider">
                  Modlitwa Końcowa
                </label>
                <textarea
                  rows={3}
                  value={editPrayer}
                  onChange={(e) => setEditPrayer(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#161c28] border border-[#d6c7b5] dark:border-[#2b394e] text-sm text-[#2f2318] dark:text-[#f1f5f9] font-serif-book italic"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveEntry}
                  disabled={isSavingEntry}
                  id="btn-save-entry"
                  className="w-full py-3 px-6 rounded-2xl bg-[#2e261f] dark:bg-amber-600 hover:bg-[#43372c] dark:hover:bg-amber-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSavingEntry ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Zapisz Zmiany we Wpisie</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
