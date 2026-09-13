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
  Key,
  QrCode,
  Download,
  Plus,
  Sparkles,
  RotateCcw,
  Image as ImageIcon
} from 'lucide-react';
import { SectionId, CycleDate, AdminUser, UploadedPdf, SectionEntry, GitHubConfig, QrCodeItem, HomePageConfig, SectionShowcaseConfig } from '../types';
import { SECTIONS } from '../data/defaultSections';
import { CYCLE_DAYS } from '../utils/dateCycle';
import { testGitHubConnection, uploadPdfDirectlyToGitHub } from '../utils/githubSync';
import { parseDocumentIntoDayEntries } from '../utils/documentParser';
import { getEntryForSectionAndDate } from '../data/sampleEntries';
import { WysiwygEditor } from './WysiwygEditor';
import { MediaLibraryViewer } from './MediaLibraryViewer';
import { getHomePageConfig, saveHomePageConfig, resetHomePageConfig, uploadImageFileToServer } from '../utils/homePageConfig';
import { 
  getSavedQrCodes, 
  generateAndDownloadQrBadgePng, 
  upsertQrCode, 
  deleteQrCode, 
  generateQrDataUrl,
  shortenUrlViaApi,
  batchShortenAllQrCodes,
  exportQrCodesToJson,
  exportQrCodesToCsv,
  parseQrCodesFile,

  importQrCodes
} from '../utils/qrCodeService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  adminUser: AdminUser | null;
  onLogin: (user: AdminUser) => void;
  onLogout: () => void;
  currentDate: CycleDate;
  currentSectionId: SectionId;
  onSelectDate?: (date: CycleDate) => void;
  onSelectSection?: (sectionId: SectionId) => void;
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
  onSelectDate,
  onSelectSection,
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

  // Active subtab inside admin panel: 'upload' | 'github' | 'files' | 'editor' | 'qrcodes' | 'media_library' | 'homepage'
  const [activeTab, setActiveTab] = useState<'upload' | 'github' | 'files' | 'editor' | 'qrcodes' | 'media_library' | 'homepage'>('upload');

  // Home Page (Info365) Configuration state
  const [homeConfig, setHomeConfig] = useState<HomePageConfig>(() => getHomePageConfig());
  const [homeSaveStatus, setHomeSaveStatus] = useState<string | null>(null);


  // QR Code Database state
  const [adminQrCodes, setAdminQrCodes] = useState<QrCodeItem[]>(() => getSavedQrCodes());
  const [qrPreviews, setQrPreviews] = useState<Record<string, string>>({});
  const [downloadingQrId, setDownloadingQrId] = useState<string | null>(null);

  // Form state for PDF upload
  const [targetSection, setTargetSection] = useState<SectionId>(currentSectionId);
  const [targetDateKey, setTargetDateKey] = useState<string>(currentDate.dateKey);
  const [isGlobalBook, setIsGlobalBook] = useState<boolean>(false);
  const [fileTitle, setFileTitle] = useState<string>('');
  const [fileDescription, setFileDescription] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [autoParseDays, setAutoParseDays] = useState<boolean>(true);
  const [uploadProgress, setUploadProgress] = useState<{ percent: number; stageMessage: string } | null>(null);
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

  // Sync editor fields whenever selected section or dateKey changes
  React.useEffect(() => {
    const cycleDate = CYCLE_DAYS.find(d => d.dateKey === editDateKey) || currentDate;
    const key = `${editSectionId}-${editDateKey}`;
    const custom = allEntriesData.entries[key] || 
      (editSectionId === 'ebook_wnr' ? allEntriesData.entries[`wnr365-${editDateKey}`] : undefined) ||
      (editSectionId === 'wnr365' ? allEntriesData.entries[`ebook_wnr-${editDateKey}`] : undefined);
    
    const base = getEntryForSectionAndDate(editSectionId, cycleDate);
    const entryToEdit = {
      ...base,
      ...(custom || {})
    };
    
    setEditTitle(entryToEdit.title || '');
    setEditContent(entryToEdit.content || '');
    setEditPrayer(entryToEdit.prayer || '');
    setSaveEntryStatus(null);
  }, [editSectionId, editDateKey, allEntriesData]);

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
      const ext = file.name.toLowerCase().split('.').pop() || '';
      const allowed = ['pdf', 'epub', 'docx', 'doc'];
      if (!allowed.includes(ext)) {
        setUploadStatus({ type: 'error', message: 'Dozwolone są pliki PDF, ePUB oraz Word DOCX.' });
        return;
      }
      setSelectedFile(file);
      if (!fileTitle) {
        setFileTitle(file.name.replace(/\.(pdf|epub|docx|doc)$/i, ''));
      }
      setUploadStatus(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.toLowerCase().split('.').pop() || '';
      const allowed = ['pdf', 'epub', 'docx', 'doc'];
      if (!allowed.includes(ext)) {
        setUploadStatus({ type: 'error', message: 'Dozwolone są pliki PDF, ePUB oraz Word DOCX.' });
        return;
      }
      setSelectedFile(file);
      if (!fileTitle) {
        setFileTitle(file.name.replace(/\.(pdf|epub|docx|doc)$/i, ''));
      }
      setUploadStatus(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadStatus({ type: 'error', message: 'Wybierz plik (PDF, ePUB lub Word DOCX) do wgrania.' });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);
    setUploadProgress({ percent: 10, stageMessage: 'Inicjalizacja przesyłania i odczyt pliku...' });

    const targetDateObj = CYCLE_DAYS.find(d => d.dateKey === targetDateKey);
    const dayNumberVal = !isGlobalBook && targetDateObj ? targetDateObj.dayNumber : undefined;
    const dateKeyVal = !isGlobalBook ? targetDateKey : '';

    // Detect file format
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    const fileFormat: 'pdf' | 'epub' | 'docx' = ext === 'epub' ? 'epub' : (ext === 'docx' || ext === 'doc') ? 'docx' : 'pdf';

    let parsedDaysCount = 0;

    // Auto-detect & update day entries if enabled
    if (autoParseDays) {
      setUploadProgress({ percent: 20, stageMessage: 'Analizowanie nagłówków rozdziałów i dni (np. Dzień 1, Dzień 2...)...' });
      try {
        const parseRes = await parseDocumentIntoDayEntries(selectedFile, targetSection, (stageMessage, percent) => {
          setUploadProgress({ percent, stageMessage });
        });

        if (parseRes.success && parseRes.totalDaysFound > 0) {
          parsedDaysCount = parseRes.totalDaysFound;
          setUploadProgress({ percent: 55, stageMessage: `Rozpoznano ${parsedDaysCount} wpisów. Zapisywanie wpisów dziennych w bazie...` });

          for (const key of Object.keys(parseRes.entries)) {
            const entry = parseRes.entries[key];
            await onSaveEntryText(key, {
              title: entry.title,
              content: entry.content,
              prayer: entry.prayer,
              mystery: entry.mystery,
              intention: entry.intention,
              dayNumber: entry.dayNumber,
              dateKey: entry.dateKey,
              sectionId: targetSection
            });
          }
          setUploadProgress({ percent: 75, stageMessage: `Pomyślnie zaktualizowano ${parsedDaysCount} wpisów. Przesyłanie pliku źródłowego...` });
        }
      } catch (parseErr) {
        console.warn('Wykrywanie dni z pliku zostało pominięte:', parseErr);
      }
    }

    setUploadProgress({ percent: 80, stageMessage: 'Wgrywanie dokumentu źródłowego i synchronizacja z GitHub...' });

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
            ? ' Plik i rozpoznane wpisy zostały pomyślnie wypchnięte do repozytorium GitHub i Cloudflare Pages!'
            : '';
          const parsedMsg = parsedDaysCount > 0 ? ` Automatycznie rozpoznano i zaktualizowano ${parsedDaysCount} wpisów dziennych.` : '';
          setUploadProgress({ percent: 100, stageMessage: 'Zakończono pomyślnie!' });
          setUploadStatus({
            type: 'success',
            message: `Plik ${fileFormat.toUpperCase()} został pomyślnie wgrany.${parsedMsg}${ghMsg}`,
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
          id: `${fileFormat}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          filename: `${Date.now()}-${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
          originalName: selectedFile.name,
          format: fileFormat,
          url: '',
          size: selectedFile.size,
          sectionId: targetSection,
          dayNumber: dayNumberVal,
          dateKey: dateKeyVal,
          title: fileTitle || selectedFile.name.replace(/\.[a-zA-Z0-9]+$/i, ''),
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
          const parsedMsg = parsedDaysCount > 0 ? ` Automatycznie zaktualizowano ${parsedDaysCount} wpisów dziennych.` : '';
          setUploadProgress({ percent: 100, stageMessage: 'Zakończono pomyślnie!' });
          setUploadStatus({
            type: 'success',
            message: `Plik ${fileFormat.toUpperCase()} został dodany do GitHub.${parsedMsg}`,
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

      // Synchronize active date and section so the reader view stays on this exact date/section
      const matchingCycleDate = CYCLE_DAYS.find(d => d.dateKey === editDateKey);
      if (matchingCycleDate && onSelectDate) {
        onSelectDate(matchingCycleDate);
      }
      if (onSelectSection) {
        onSelectSection(editSectionId);
      }

      setSaveEntryStatus(`Wpis dla dnia ${editDateKey} (${editSectionId}) został pomyślnie zaktualizowany i ustawiony w czytniku!`);
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
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[#e7ded2] dark:border-[#212b3c] bg-[#f8f3ea] dark:bg-[#0f1420] p-2 sm:px-6">
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
            <span>Wgraj Plik (PDF, ePUB, DOCX)</span>
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
            <span>Edycja Treści (WYSIWYG)</span>
          </button>

          <button
            onClick={() => {
              setAdminQrCodes(getSavedQrCodes());
              setActiveTab('qrcodes');
            }}
            id="tab-admin-qrcodes"
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'qrcodes'
                ? 'border-[#8c572b] dark:border-amber-400 text-[#8c572b] dark:text-amber-400 bg-white/60 dark:bg-[#161c28]'
                : 'border-transparent text-[#6e5d4d] dark:text-[#94a3b8] hover:text-[#382b20] dark:hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Baza Kodów QR & PNG</span>
          </button>

          <button
            onClick={() => setActiveTab('media_library')}
            id="tab-admin-media"
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'media_library'
                ? 'border-[#8c572b] dark:border-amber-400 text-[#8c572b] dark:text-amber-400 bg-white/60 dark:bg-[#161c28]'
                : 'border-transparent text-[#6e5d4d] dark:text-[#94a3b8] hover:text-[#382b20] dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Zasoby (src/pliki) & 2D/3D / HTML</span>
          </button>

          <button
            onClick={() => {
              setHomeConfig(getHomePageConfig());
              setActiveTab('homepage');
            }}
            id="tab-admin-homepage"
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'homepage'
                ? 'border-[#8c572b] dark:border-amber-400 text-[#8c572b] dark:text-amber-400 bg-white/60 dark:bg-[#161c28]'
                : 'border-transparent text-[#6e5d4d] dark:text-[#94a3b8] hover:text-[#382b20] dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Strona Startowa & Ilustracje</span>
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

                {/* Multi-format File Dropzone / Picker */}
                <div>
                  <label className="block text-xs font-bold text-[#443527] dark:text-[#cbd5e1] mb-1.5 uppercase tracking-wider">
                    Plik do przesłania (PDF, ePUB, Word DOCX)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-[#cbb8a3] dark:border-[#33425b] hover:border-[#8c572b] dark:hover:border-amber-500 rounded-3xl p-6 text-center bg-white/70 dark:bg-[#151c28]/60 hover:bg-[#faf4ec] dark:hover:bg-[#1a2333] transition-all cursor-pointer"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.epub,.docx,.doc,application/pdf,application/epub+zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 text-[#8c572b] dark:text-amber-400 mx-auto mb-2" />
                    {selectedFile ? (
                      <div>
                        <div className="font-bold text-sm text-[#2e2318] dark:text-white">{selectedFile.name}</div>
                        <div className="text-xs text-[#7d6b5b] dark:text-[#94a3b8] mt-1">
                          Rozmiar: {Math.round(selectedFile.size / 1024)} KB • Format: {selectedFile.name.split('.').pop()?.toUpperCase()} • Kliknij aby zmienić
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-semibold text-sm text-[#382b1f] dark:text-[#e2e8f0]">
                          Kliknij tutaj lub upuść plik PDF, ePUB lub Word DOCX
                        </div>
                        <div className="text-xs text-[#877565] dark:text-[#94a3b8] mt-1">
                          Gotowe dla Amazon KDP, Empik i Legimi • Maksymalny rozmiar: 100 MB
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Auto-detect & Parse Day Headings Checkbox */}
                <div className="bg-amber-50/70 dark:bg-[#182130]/70 p-4 rounded-2xl border border-[#e2d5c5] dark:border-[#2a384e]">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoParseDays}
                      onChange={(e) => setAutoParseDays(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-[#cbb8a3] dark:border-[#33425b] accent-amber-600 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-xs text-[#2e2318] dark:text-amber-300">
                        Automatycznie rozpoznaj i zaktualizuj wpisy dla poszczególnych dni
                      </div>
                      <div className="text-[11px] text-[#7d6b5b] dark:text-[#94a3b8] mt-0.5 leading-relaxed">
                        System przeszuka nagłówki pliku (DOCX, ePUB, tekst) w poszukiwaniu dni (np. <i>Dzień 1</i>, <i>Dzień 2</i>, <i>Rozdział 1</i>) i przypisze wyodrębnioną treść bezpośrednio do kalendarza wybranej sekcji.
                      </div>
                    </div>
                  </label>
                </div>

                {/* Animated Progress Bar */}
                {isUploading && uploadProgress && (
                  <div className="bg-amber-500/10 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-500/30 space-y-2 animate-fade-in">
                    <div className="flex justify-between items-center text-xs font-bold text-[#443527] dark:text-amber-300">
                      <span>{uploadProgress.stageMessage}</span>
                      <span className="font-mono text-amber-700 dark:text-amber-400 font-extrabold">{uploadProgress.percent}%</span>
                    </div>
                    <div className="w-full h-3 bg-[#e8ded1] dark:bg-[#1a2333] rounded-full overflow-hidden p-0.5 border border-[#d6c7b5]/50 dark:border-[#2b394e]">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-full transition-all duration-300 shadow-sm"
                        style={{ width: `${uploadProgress.percent}%` }}
                      />
                    </div>
                  </div>
                )}

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
                        <span>Trwa wgrywanie ({uploadProgress?.percent || 0}%)...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Wgraj Dokument (PDF, ePUB, Word DOCX) & Synchronizuj z GitHub</span>
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
                  Aplikacja Droga365 jest statycznym projektem (Vite + React) przygotowanym do hostingu na <strong>Cloudflare Pages</strong>. Każde wgranie pliku PDF lub edycja wpisu może bezpośrednio aktualizować pliki w repozytorium GitHub, a Cloudflare Pages pobiera i serwuje aktualne dane!
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
                      placeholder="embik365"
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
                      href="https://github.com/settings/tokens/new?scopes=repo&description=Droga365"
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
                    Baza Wgranych Plików (PDF, ePUB, DOCX)
                  </h3>
                  <p className="text-xs text-[#786756] dark:text-[#94a3b8]">
                    Łącznie wgrano {uploads.length} dokumentów. Pliki są dostępne w czytnikach, do pobrania oraz w repozytorium GitHub.
                  </p>
                </div>
              </div>

              {uploads.length === 0 ? (
                <div className="text-center py-12 bg-white/60 dark:bg-[#161c28]/60 rounded-3xl border border-[#e4d6c6] dark:border-[#232f42] p-6">
                  <FileText className="w-10 h-10 text-[#a3907e] dark:text-[#4b5563] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#4e3d2e] dark:text-[#cbd5e1]">
                    Brak wgranych plików w bazie.
                  </p>
                  <p className="text-xs text-[#8c7866] dark:text-[#94a3b8] mt-1">
                    Przejdź do zakładki "Wgraj Plik", aby dodać pierwszy dokument PDF, ePUB lub DOCX.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {uploads.map(file => {
                    const sec = SECTIONS.find(s => s.id === file.sectionId);
                    const isGitHubHosted = file.url.includes('github') || file.url.includes('raw.githubusercontent.com');
                    const ext = (file.originalName.split('.').pop() || 'pdf').toLowerCase();
                    const formatBadge = (file.format || (ext === 'docx' || ext === 'doc' ? 'docx' : ext === 'epub' ? 'epub' : 'pdf')).toUpperCase();
                    const isEpub = formatBadge === 'EPUB';
                    const isDocx = formatBadge === 'DOCX' || formatBadge === 'DOC';
                    const badgeColor = isEpub
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                      : isDocx
                      ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                      : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';

                    return (
                      <div
                        key={file.id}
                        className="p-4 rounded-2xl bg-white dark:bg-[#141a26] border border-[#e2d4c3] dark:border-[#212b3c] shadow-xs flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 font-bold text-xs ${badgeColor}`}>
                            {formatBadge}
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
                          <a
                            href={file.url}
                            download={file.originalName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-amber-600/15 hover:bg-amber-600/25 text-amber-800 dark:text-amber-300 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Pobierz plik"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Pobierz</span>
                          </a>

                          {formatBadge === 'PDF' && (
                            <button
                              onClick={() => onOpenPdf(file)}
                              className="px-3 py-1.5 rounded-xl bg-[#f0e4d4] dark:bg-[#1c2434] hover:bg-[#e4d6c4] dark:hover:bg-[#242f44] text-[#423223] dark:text-[#e2e8f0] text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span>Podgląd</span>
                            </button>
                          )}

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
                  Główna Treść / Rozważanie / Rozdział (Edytor WYSIWYG)
                </label>
                <div className="rounded-2xl border border-[#d6c7b5] dark:border-[#2b394e] overflow-hidden">
                  <WysiwygEditor
                    initialValue={editContent}
                    onChange={(val) => setEditContent(val)}
                    placeholder="Wprowadź treść rozważania, artykułu lub rozdziału. Użyj paska narzędzi do formatowania, wstawiania ilustracji lub kodów QR..."
                  />
                </div>
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

          {/* TAB 5: QR CODES DATABASE */}
          {activeTab === 'qrcodes' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-heading-cinzel font-bold text-base sm:text-lg text-[#2a2016] dark:text-[#f3e8d2] flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                    <span>Baza Kodów QR Droga365</span>
                  </h3>
                  <p className="text-xs text-[#786756] dark:text-[#94a3b8]">
                    Kody QR w formie grafiki z opcją pobrania jako plik PNG. Krótki adres Url jest przypisany na stałe, a pełny adres docelowy może być zmieniany dynamicznie.
                  </p>
                </div>

                {/* Import / Export Tool Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    id="import-qr-file-admin"
                    accept=".json,.csv"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const items = await parseQrCodesFile(file);
                        const mode = confirm(`Odczytano ${items.length} kodów QR z pliku "${file.name}".\n\nKliknij [OK], aby połączyć (scal) z obecną bazą.\nKliknij [Anuluj], aby zastąpić całą obecną bazę nowymi kodami.`) ? 'merge' : 'replace';
                        const updated = importQrCodes(items, mode);
                        setAdminQrCodes(updated);
                        alert(`Pomyślnie zaimportowano ${items.length} kodów QR!`);
                      } catch (err: any) {
                        alert(err.message || 'Błąd importu pliku');
                      }
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('import-qr-file-admin')?.click()}
                    className="px-3 py-1.5 rounded-xl bg-amber-700 dark:bg-amber-600 hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Importuj bazę kodów QR z pliku JSON lub CSV"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importuj (JSON/CSV)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportQrCodesToJson(adminQrCodes)}
                    className="px-3 py-1.5 rounded-xl bg-[#3f3125] dark:bg-[#1a2333] hover:bg-[#524132] text-white font-bold text-xs border border-[#524132] dark:border-[#2b394e] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Pobierz całą bazę kodów QR jako plik JSON"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Eksport JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportQrCodesToCsv(adminQrCodes)}
                    className="px-3 py-1.5 rounded-xl bg-[#3f3125] dark:bg-[#1a2333] hover:bg-[#524132] text-white font-bold text-xs border border-[#524132] dark:border-[#2b394e] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Pobierz całą bazę kodów QR jako plik CSV (Excel)"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Eksport CSV</span>
                  </button>
                </div>
              </div>

              {/* Grid of QR Codes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminQrCodes.map((item) => (
                  <div 
                    key={item.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#141a26] border border-[#e2d4c3] dark:border-[#212b3c] shadow-xs flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start gap-4">
                      {/* Visual QR Image Preview (Clickable active link) */}
                      <a 
                        href={item.shortUrl || item.fullUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="w-24 h-24 bg-white p-1.5 rounded-xl border border-gray-200 hover:border-amber-500 hover:scale-105 transition-all shadow-xs shrink-0 flex flex-col items-center justify-center cursor-pointer"
                        title="Kliknij, aby przetestować przekierowanie w nowej karcie"
                      >
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(item.shortUrl || item.fullUrl)}`}
                          alt={item.title}
                          className="w-full h-full object-contain"
                        />
                      </a>

                      {/* Info & URL details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-[#2d2217] dark:text-[#f3e8d2] truncate">
                          {item.title}
                        </h4>
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                          Podpis: &quot;{item.displayLabel}&quot;
                        </p>

                        <div className="mt-2 space-y-1 text-[11px]">
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Krótki URL (stały):</span>
                            <code className="bg-[#f2ece3] dark:bg-[#1c2434] px-1.5 py-0.5 rounded text-amber-800 dark:text-amber-300 font-mono truncate">
                              {item.shortUrl}
                            </code>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Pełny URL (dynamiczny):</span>
                            <input
                              type="text"
                              value={item.fullUrl}
                              onChange={(e) => {
                                const updated = adminQrCodes.map(q => q.id === item.id ? { ...q, fullUrl: e.target.value } : q);
                                setAdminQrCodes(updated);
                                upsertQrCode({ ...item, fullUrl: e.target.value });
                              }}
                              className="w-full mt-1 px-2 py-1 rounded bg-[#fbf8f4] dark:bg-[#182130] border border-[#d6c7b5] dark:border-[#2b394e] text-[11px] font-mono text-[#2f2318] dark:text-[#f1f5f9]"
                              title="Zmień dynamicznie docelowy adres tego kodu QR"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions: Download PNG & Copy */}
                    <div className="pt-2 border-t border-[#f0e4d6] dark:border-[#1e2738] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setDownloadingQrId(item.id);
                          await generateAndDownloadQrBadgePng(item);
                          setDownloadingQrId(null);
                        }}
                        disabled={downloadingQrId === item.id}
                        className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {downloadingQrId === item.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>Pobierz jako PNG (Druk 300 DPI)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Czy na pewno usunąć kod QR "${item.title}"?`)) {
                            deleteQrCode(item.id);
                            setAdminQrCodes(getSavedQrCodes());
                          }
                        }}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Usuń kod QR"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New QR Code to Database */}
              <div className="p-4 rounded-2xl bg-[#f4ebe1] dark:bg-[#141a26] border border-[#e5d8c8] dark:border-[#212b3c] space-y-3">
                <h4 className="font-bold text-sm text-[#2d2217] dark:text-[#f3e8d2] flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span>Dodaj Nowy Kod QR do Bazy</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Tytuł Kodu</label>
                    <input 
                      id="new-qr-title" 
                      placeholder="np. Dodatkowy Tom Rozważań" 
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#161c28] border border-[#d6c7b5] dark:border-[#2b394e]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Nazwa pod kodem (Wyświetlana)</label>
                    <input 
                      id="new-qr-label" 
                      placeholder="np. Skanuj: Droga365" 
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#161c28] border border-[#d6c7b5] dark:border-[#2b394e]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                      <span>Krótki Adres URL (API / Stały)</span>
                      <button
                        type="button"
                        onClick={async () => {
                          const fullEl = document.getElementById('new-qr-full') as HTMLInputElement;
                          const shortEl = document.getElementById('new-qr-short') as HTMLInputElement;
                          if (!fullEl || !fullEl.value) {
                            alert('Wpisz najpierw pełny adres docelowy.');
                            return;
                          }
                          try {
                            shortEl.value = 'Generowanie skrótu API...';
                            const short = await shortenUrlViaApi(fullEl.value);
                            shortEl.value = short;
                          } catch (err: any) {
                            alert(err.message || 'Błąd generowania skrótu');
                            shortEl.value = '';
                          }
                        }}
                        className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        ⚡ Skróć z Bezreklamowego API
                      </button>
                    </label>
                    <input 
                      id="new-qr-short" 
                      placeholder="https://clck.ru/..." 
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#161c28] border border-[#d6c7b5] dark:border-[#2b394e] font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Pełny Adres URL (Dynamiczny)</label>
                    <input 
                      id="new-qr-full" 
                      placeholder="https://drogowskazy365.pl/?section=wnr365" 
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#161c28] border border-[#d6c7b5] dark:border-[#2b394e]"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const titleEl = document.getElementById('new-qr-title') as HTMLInputElement;
                      const labelEl = document.getElementById('new-qr-label') as HTMLInputElement;
                      const shortEl = document.getElementById('new-qr-short') as HTMLInputElement;
                      const fullEl = document.getElementById('new-qr-full') as HTMLInputElement;
                      if (!titleEl.value || !shortEl.value) {
                        alert('Podaj przynajmniej tytuł i krótki adres URL');
                        return;
                      }
                      const newItem: QrCodeItem = {
                        id: `qr-${Date.now()}`,
                        title: titleEl.value,
                        displayLabel: labelEl.value || titleEl.value,
                        shortUrl: shortEl.value,
                        fullUrl: fullEl.value || `https://${shortEl.value}`,
                        createdAt: new Date().toISOString()
                      };
                      upsertQrCode(newItem);
                      setAdminQrCodes(getSavedQrCodes());
                      titleEl.value = '';
                      labelEl.value = '';
                      shortEl.value = '';
                      fullEl.value = '';
                    }}
                    className="px-4 py-2 rounded-xl bg-[#2e261f] dark:bg-amber-600 hover:bg-[#43372c] dark:hover:bg-amber-500 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Zapisz Kod QR w Bazie</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: MEDIA LIBRARY (src/pliki), VIDEO, HTML LIVE & 2D/3D */}
          {activeTab === 'media_library' && <MediaLibraryViewer />}

          {/* TAB 7: STRONA STARTOWA (INFO365) & ILUSTRACJE */}
          {activeTab === 'homepage' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in text-[#2c2219] dark:text-[#f1f5f9]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#e5d8c8] dark:border-[#212b3c]">
                <div>
                  <h3 className="font-heading-cinzel font-bold text-lg text-[#2a2016] dark:text-[#f3e8d2] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span>Zarządzanie Stroną Startową (Info365) & Ilustracjami</span>
                  </h3>
                  <p className="text-xs text-[#786756] dark:text-[#94a3b8]">
                    Dostosuj tytuł główny, podtytuł, opis oraz własne ilustracje graficzne dla wszystkich 7 sekcji.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (confirm('Czy na pewno chcesz przywrócić domyślne nagłówki i ilustracje?')) {
                        const def = resetHomePageConfig();
                        setHomeConfig(def);
                        setHomeSaveStatus('Przywrócono domyślne ustawienia fabryczne.');
                        setTimeout(() => setHomeSaveStatus(null), 3000);
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Do Domyślnych</span>
                  </button>

                  <button
                    onClick={async () => {
                      const success = await saveHomePageConfig(homeConfig);
                      if (success) {
                        setHomeSaveStatus('Zapisano pomyślnie zmiany strony startowej i zsynchronizowano!');
                      } else {
                        setHomeSaveStatus('Wystąpił błąd podczas zapisywania strony startowej.');
                      }
                      setTimeout(() => setHomeSaveStatus(null), 4000);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Zapisz Zmiany Strony Startowej</span>
                  </button>
                </div>
              </div>

              {homeSaveStatus && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{homeSaveStatus}</span>
                </div>
              )}

              {/* SECTION 1: HERO HEADER */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#111723] border border-[#e5d8c8] dark:border-[#212b3c] shadow-sm space-y-4">
                <h4 className="font-heading-cinzel font-bold text-sm text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                  1. Nagłówek Główny (Hero Banner)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Tytuł Główny (Hero Title)
                    </label>
                    <input
                      type="text"
                      value={homeConfig.heroTitle}
                      onChange={(e) => setHomeConfig({ ...homeConfig, heroTitle: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-[#182030] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Podtytuł (Hero Subtitle)
                    </label>
                    <input
                      type="text"
                      value={homeConfig.heroSubtitle}
                      onChange={(e) => setHomeConfig({ ...homeConfig, heroSubtitle: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-[#182030] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Wstęp do Aplikacji (Kod HTML / WYSIWYG)
                  </label>
                  <textarea
                    rows={4}
                    value={homeConfig.introHtml}
                    onChange={(e) => setHomeConfig({ ...homeConfig, introHtml: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-[#182030] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-mono text-[11px] leading-relaxed focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              {/* SECTION 2: SHOWCASE CARDS (7 SECTIONS) */}
              <div className="space-y-4">
                <h4 className="font-heading-cinzel font-bold text-sm text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                  2. Karty 7 Sekcji i Ilustracje Nagłówkowe
                </h4>

                <div className="grid grid-cols-1 gap-6">
                  {homeConfig.showcases.map((sc, idx) => (
                    <div
                      key={sc.id}
                      className="p-5 rounded-3xl bg-white dark:bg-[#111723] border border-[#e5d8c8] dark:border-[#212b3c] shadow-sm space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
                        <span className="font-heading-cinzel font-bold text-sm text-amber-800 dark:text-amber-400">
                          #{idx + 1} Sekcja: {sc.name} ({sc.id})
                        </span>
                        <span className="text-[11px] font-mono text-stone-400">ID: {sc.id}</span>
                      </div>

                      {/* Image Preview & Upload / Input */}
                      <div className="p-3 bg-stone-100 dark:bg-[#182030] rounded-2xl border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-full sm:w-48 h-28 rounded-xl overflow-hidden bg-stone-800 shrink-0 border border-amber-500/30">
                          <img
                            src={sc.imageUrl}
                            alt={sc.imageAlt || sc.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80');
                            }}
                          />
                        </div>
                        <div className="flex-1 w-full space-y-2 text-xs">
                          <label className="block font-bold text-stone-700 dark:text-stone-300">
                            URL Ilustracji Nagłówkowej (zdjęcie na karcie sekcji)
                          </label>
                          <input
                            type="text"
                            value={sc.imageUrl}
                            onChange={(e) => {
                              const updated = homeConfig.showcases.map(s => s.id === sc.id ? { ...s, imageUrl: e.target.value } : s);
                              setHomeConfig({ ...homeConfig, showcases: updated });
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#0c121e] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-mono text-[11px] focus:outline-hidden focus:border-amber-500"
                            placeholder="https://images.unsplash.com/..."
                          />
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30 font-bold text-[11px] cursor-pointer">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Wgraj z pliku graficznego</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const uploadedUrl = await uploadImageFileToServer(file);
                                    const updated = homeConfig.showcases.map(s => s.id === sc.id ? { ...s, imageUrl: uploadedUrl } : s);
                                    setHomeConfig({ ...homeConfig, showcases: updated });
                                  } catch (err: any) {
                                    alert(`Błąd wgrywania grafiki: ${err.message || err}`);
                                  }
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                            Nazwa Wyświetlana
                          </label>
                          <input
                            type="text"
                            value={sc.name}
                            onChange={(e) => {
                              const updated = homeConfig.showcases.map(s => s.id === sc.id ? { ...s, name: e.target.value } : s);
                              setHomeConfig({ ...homeConfig, showcases: updated });
                            }}
                            className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-[#182030] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                            Etykieta / Badge
                          </label>
                          <input
                            type="text"
                            value={sc.badge}
                            onChange={(e) => {
                              const updated = homeConfig.showcases.map(s => s.id === sc.id ? { ...s, badge: e.target.value } : s);
                              setHomeConfig({ ...homeConfig, showcases: updated });
                            }}
                            className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-[#182030] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="text-xs">
                        <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                          Krótki Wyróżnik (Short Description)
                        </label>
                        <input
                          type="text"
                          value={sc.shortDesc}
                          onChange={(e) => {
                            const updated = homeConfig.showcases.map(s => s.id === sc.id ? { ...s, shortDesc: e.target.value } : s);
                            setHomeConfig({ ...homeConfig, showcases: updated });
                          }}
                          className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-[#182030] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold focus:outline-hidden"
                        />
                      </div>

                      <div className="text-xs">
                        <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                          Pełny Opis Sekcji (Full Description)
                        </label>
                        <textarea
                          rows={2}
                          value={sc.fullDesc}
                          onChange={(e) => {
                            const updated = homeConfig.showcases.map(s => s.id === sc.id ? { ...s, fullDesc: e.target.value } : s);
                            setHomeConfig({ ...homeConfig, showcases: updated });
                          }}
                          className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-[#182030] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-serif-book leading-relaxed focus:outline-hidden"
                        />
                      </div>

                      <div className="text-xs">
                        <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                          Opis Alternatywny Grafiki (Alt)
                        </label>
                        <input
                          type="text"
                          value={sc.imageAlt}
                          onChange={(e) => {
                            const updated = homeConfig.showcases.map(s => s.id === sc.id ? { ...s, imageAlt: e.target.value } : s);
                            setHomeConfig({ ...homeConfig, showcases: updated });
                          }}
                          className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-[#182030] border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom save bar */}
              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => {
                    saveHomePageConfig(homeConfig);
                    setHomeSaveStatus('Zapisano pomyślnie wszystkie zmiany strony startowej!');
                    setTimeout(() => setHomeSaveStatus(null), 3000);
                  }}
                  className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg cursor-pointer transition-colors"
                >
                  <Save className="w-5 h-5" />
                  <span>Zapisz Wszystkie Zmiany Strony Startowej</span>
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

