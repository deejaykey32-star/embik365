import { GitHubConfig, UploadedPdf, SectionEntry, QrCodeItem } from '../types';

const STORAGE_KEY = 'drogowskazy_github_config';

export const DEFAULT_GITHUB_CONFIG: GitHubConfig = {
  owner: 'deejaykey32-star',
  repo: 'embik365',
  branch: 'main',
  token: '',
  autoSync: true,
  useGitHubAsPrimarySource: true
};

export function getStoredGitHubConfig(): GitHubConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_GITHUB_CONFIG, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.error('Failed to parse GitHub config:', err);
  }
  return DEFAULT_GITHUB_CONFIG;
}

export function saveStoredGitHubConfig(config: GitHubConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save GitHub config:', err);
  }
}

// Helper: convert File to base64 string
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip "data:*/*;base64," prefix
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

// Test GitHub connection
export async function testGitHubConnection(config: GitHubConfig): Promise<{
  success: boolean;
  message: string;
  repoDetails?: any;
}> {
  if (!config.owner || !config.repo) {
    return { success: false, message: 'Podaj nazwę właściciela (owner) i repozytorium (repo).' };
  }

  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json'
    };
    if (config.token?.trim()) {
      headers.Authorization = `Bearer ${config.token.trim()}`;
    }

    const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}`, {
      headers
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        success: false,
        message: errJson.message || `Błąd połączenia z GitHub (Status: ${res.status}). Sprawdź uprawnienia tokenu lub nazwę repozytorium.`
      };
    }

    const repoDetails = await res.json();
    return {
      success: true,
      message: `Połączono z repozytorium ${repoDetails.full_name} (${repoDetails.private ? 'Prywatne' : 'Publiczne'})`,
      repoDetails
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Błąd sieci podczas testowania połączenia z GitHub: ${err.message}`
    };
  }
}

// Fetch existing file SHA and content from GitHub if it exists
async function getFileSha(
  owner: string,
  repo: string,
  path: string,
  branch: string,
  token?: string
): Promise<string | undefined> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json'
    };
    if (token) headers.Authorization = `Bearer ${token.trim()}`;

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      { headers }
    );
    if (res.ok) {
      const data = await res.json();
      return data.sha;
    }
  } catch {
    // File may not exist yet
  }
  return undefined;
}

// Commit or update a file in GitHub repository via GitHub REST API
export async function commitFileToGitHub(
  path: string,
  contentBase64: string,
  commitMessage: string,
  config: GitHubConfig
): Promise<{ success: boolean; sha?: string; error?: string }> {
  if (!config.token?.trim()) {
    return {
      success: false,
      error: 'Wymagany jest osobisty token dostępu GitHub (PAT) do zapisywania plików w repozytorium.'
    };
  }

  try {
    const sha = await getFileSha(config.owner, config.repo, path, config.branch, config.token);

    const body: Record<string, any> = {
      message: commitMessage,
      content: contentBase64,
      branch: config.branch
    };
    if (sha) {
      body.sha = sha;
    }

    const res = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${config.token.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errJson.message || `Błąd zapisu pliku ${path} w GitHub (status ${res.status})`
      };
    }

    const result = await res.json();
    return { success: true, sha: result.content?.sha };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Fetch database entries from GitHub raw repository
export async function fetchEntriesFromGitHub(
  config?: Partial<GitHubConfig>
): Promise<{ entries: Record<string, Partial<SectionEntry>>; uploads: UploadedPdf[]; qrCodes?: QrCodeItem[] } | null> {
  const owner = config?.owner || DEFAULT_GITHUB_CONFIG.owner;
  const repo = config?.repo || DEFAULT_GITHUB_CONFIG.repo;
  const branch = config?.branch || DEFAULT_GITHUB_CONFIG.branch;

  const rawUrls = [
    `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/public/data/entries.json`,
    `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/data/entries.json`
  ];

  for (const url of rawUrls) {
    try {
      // Add timestamp to prevent browser cache
      const res = await fetch(`${url}?t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const json = await res.json();
        if (json && (json.entries || json.uploads || json.qrCodes)) {
          return {
            entries: json.entries || {},
            uploads: (json.uploads || []).map((u: UploadedPdf) => ({
              ...u,
              // If URL is relative, point it to raw GitHub or local
              url: u.url.startsWith('http')
                ? u.url
                : `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/public${u.url}`
            })),
            qrCodes: json.qrCodes || []
          };
        }
      }
    } catch {
      // Try next URL
    }
  }

  // If token is provided, try GitHub Contents API (works for private repos too!)
  if (config?.token?.trim()) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${config.owner}/${config.repo}/contents/public/data/entries.json?ref=${config.branch}`,
        {
          headers: {
            Accept: 'application/vnd.github.v3.raw',
            Authorization: `Bearer ${config.token.trim()}`
          }
        }
      );
      if (res.ok) {
        const json = await res.json();
        return {
          entries: json.entries || {},
          uploads: json.uploads || [],
          qrCodes: json.qrCodes || []
        };
      }
    } catch (e) {
      console.warn('GitHub API fetch fallback failed:', e);
    }
  }

  return null;
}

// Upload PDF to GitHub + update database entries on GitHub
export async function uploadPdfDirectlyToGitHub(
  file: File,
  fileRecord: UploadedPdf,
  config: GitHubConfig,
  currentData: { entries: Record<string, Partial<SectionEntry>>; uploads: UploadedPdf[]; qrCodes?: QrCodeItem[] }
): Promise<{ success: boolean; rawUrl?: string; error?: string }> {
  if (!config.token?.trim()) {
    return {
      success: false,
      error: 'Brak tokenu GitHub. Skonfiguruj token w zakładce GitHub w Panelu Administratora.'
    };
  }

  try {
    // 1. Convert PDF to base64
    const base64Content = await fileToBase64(file);
    const pdfPath = `public/uploads/${fileRecord.filename}`;

    // 2. Commit PDF file to GitHub
    const pdfCommit = await commitFileToGitHub(
      pdfPath,
      base64Content,
      `feat(pdf): dodano dokument ${fileRecord.originalName} dla sekcji ${fileRecord.sectionId}`,
      config
    );

    if (!pdfCommit.success) {
      return { success: false, error: pdfCommit.error };
    }

    // 3. Construct Raw URL for public access
    const rawUrl = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${pdfPath}`;
    const updatedRecord: UploadedPdf = {
      ...fileRecord,
      url: rawUrl
    };

    // 4. Update entries and uploads array
    const updatedUploads = [updatedRecord, ...currentData.uploads.filter(u => u.id !== fileRecord.id)];
    const updatedEntries = { ...currentData.entries };

    if (fileRecord.sectionId && fileRecord.dateKey) {
      const key = `${fileRecord.sectionId}-${fileRecord.dateKey}`;
      const existingEntry = updatedEntries[key] || {};
      const existingPdfs = Array.isArray(existingEntry.pdfs) ? existingEntry.pdfs : [];
      updatedEntries[key] = {
        ...existingEntry,
        pdfs: [updatedRecord, ...existingPdfs.filter(p => p.id !== fileRecord.id)],
        updatedAt: new Date().toISOString()
      };
    }

    const newDataPayload = {
      entries: updatedEntries,
      uploads: updatedUploads,
      qrCodes: currentData.qrCodes || [],
      lastUpdated: new Date().toISOString()
    };

    // 5. Commit updated entries.json to GitHub
    const utf8Bytes = new TextEncoder().encode(JSON.stringify(newDataPayload, null, 2));
    let binary = '';
    utf8Bytes.forEach(byte => {
      binary += String.fromCharCode(byte);
    });
    const jsonBase64 = btoa(binary);

    await commitFileToGitHub(
      'public/data/entries.json',
      jsonBase64,
      `chore(db): aktualizacja indeksu wpisów po dodaniu ${fileRecord.filename}`,
      config
    );

    return { success: true, rawUrl };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Sync full state to GitHub
export async function syncStateToGitHub(
  config: GitHubConfig,
  data: { entries: Record<string, Partial<SectionEntry>>; uploads: UploadedPdf[]; qrCodes?: QrCodeItem[] }
): Promise<{ success: boolean; message: string }> {
  if (!config.token?.trim()) {
    return { success: false, message: 'Wymagany jest token GitHub do synchronizacji.' };
  }

  try {
    const payload = {
      entries: data.entries,
      uploads: data.uploads,
      qrCodes: data.qrCodes || [],
      lastUpdated: new Date().toISOString(),
      updatedBy: 'Admin Dominik Kuta'
    };

    const utf8Bytes = new TextEncoder().encode(JSON.stringify(payload, null, 2));
    let binary = '';
    utf8Bytes.forEach(byte => {
      binary += String.fromCharCode(byte);
    });
    const jsonBase64 = btoa(binary);

    const res = await commitFileToGitHub(
      'public/data/entries.json',
      jsonBase64,
      `chore(sync): pełna synchronizacja danych aplikacji z GitHub (${new Date().toLocaleDateString('pl-PL')})`,
      config
    );

    if (res.success) {
      return { success: true, message: 'Dane zostały pomyślnie zapisane w repozytorium GitHub!' };
    }
    return { success: false, message: res.error || 'Nieznany błąd podczas zapisu w GitHub.' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
