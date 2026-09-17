import QRCode from 'qrcode';
import { QrCodeItem, SectionId, GitHubConfig } from '../types';
import { getStoredGitHubConfig, syncStateToGitHub } from './githubSync';

const STORAGE_KEY = 'drogowskazy_qr_database';
let memoryQrCodes: QrCodeItem[] | null = null;

export const FILE_CLCK_MAP: Record<string, string> = {
  "270-300x200.png": "https://clck.ru/3Vrwd4",
  "5c7846f4-c5a7-42c7-8fdb-9d65a59ced29.png": "https://clck.ru/3Vrwd5",
  "Bóg.gif": "https://clck.ru/3Vrwd7",
  "diament2.png": "https://clck.ru/3Vrwd9",
  "film-wszystko.mp4": "https://clck.ru/3VrwdC",
  "flaga-izraela.png": "https://clck.ru/3VrwdD",
  "Generuj_pynn_animacj_202602091656.gif": "https://clck.ru/3VrwdG",
  "herb-biskupa-adama.jpg": "https://clck.ru/3VrwdJ",
  "herb-biskupa-marka.jpg": "https://clck.ru/3VrwdK",
  "jesien-tom-4.jpg": "https://clck.ru/3VrwdL",
  "jesien.png": "https://clck.ru/3VrwdM",
  "jesień.png": "https://clck.ru/3VrwdM",
  "jesien2.png": "https://clck.ru/3VrwdQ",
  "jesień2.png": "https://clck.ru/3VrwdQ",
  "Jezus-i-piotr-z-kluczami.jpg": "https://clck.ru/3VrwdT",
  "jing-jang.jpg": "https://clck.ru/3VrwdU",
  "lato-tom-3.jpg": "https://clck.ru/3VrwdV",
  "lato.png": "https://clck.ru/3VrwdZ",
  "lato2.png": "https://clck.ru/3Vrwdg",
  "medalik.jpg": "https://clck.ru/3Vrwdj",
  "Michal-archaniol.jpg": "https://clck.ru/3Vrwdn",
  "nieskonczonosc.jpg": "https://clck.ru/3Vrwds",
  "Obraz-milosierdzia-bozego-dla-swiata-calego.jpg": "https://clck.ru/3Vrwdu",
  "okładki-komplet.png": "https://clck.ru/3Vrwdv",
  "ombw.jpg": "https://clck.ru/3Vrwe5",
  "RGB-model-1.jpg": "https://clck.ru/3VrweA",
  "RHZ-tom-5.jpg": "https://clck.ru/3VrweC",
  "RHZ-ilustracja.png": "https://clck.ru/3VrweC",
  "RHZ-ilustracja.jpg": "https://clck.ru/3VrweC",
  "schemat-trojcy.png": "https://clck.ru/3VrweD",
  "symbol2.gif": "https://clck.ru/3VrweH",
  "symbol3.gif": "https://clck.ru/3VrweL",
  "wiosna-tom-2.jpg": "https://clck.ru/3VrweP",
  "wiosna.png": "https://clck.ru/3VrwcC",
  "wiosna2.png": "https://clck.ru/3VrweR",
  "WnR365 - całość poprawiana 16.09.2026.pdf": "https://clck.ru/3VrweS",
  "wszystko2.png": "https://clck.ru/3VrweT",
  "zima-tom-1.jpg": "https://clck.ru/3VrweY",
  "zima.png": "https://clck.ru/3Vrweb",
  "zima2.png": "https://clck.ru/3Vrweh",
  "farby+światło.png": "https://clck.ru/3VsF32",
  "farby-swiatlo.png": "https://clck.ru/3VsF32",
};

export const DEFAULT_CLCK_MAP: Record<string, string> = {
  info365: 'https://clck.ru/3Vnjrc',
  wnr365: 'https://clck.ru/3Vnjri',
  rhz365: 'https://clck.ru/3Vnjrj',
  biblia365: 'https://clck.ru/3Vnjrd',
  ebook_wnr: 'https://clck.ru/3Vnjrh',
  ebook_rhz: 'https://clck.ru/3Vnjrf',
  ebook_biblia: 'https://clck.ru/3Vnjrg',
  bio365: 'https://clck.ru/3Vnjre',
  grafika: 'https://clck.ru/3Vr8B8',
  aistudio: 'https://clck.ru/3VsH9M',
  'ai-studio': 'https://clck.ru/3VsH9M',
  pkg_gemini_solar_system: 'https://clck.ru/3VsH9M',
  ...FILE_CLCK_MAP
};

export const DEFAULT_QR_CODES: QrCodeItem[] = [
  {
    id: 'qr_aistudio_solar_system',
    title: 'Interaktywny Układ Słoneczny 3D (Kolekcja Paczek)',
    displayLabel: 'Zeskanuj, aby otworzyć interaktywną symulację Układu Słonecznego 3D',
    shortUrl: 'https://clck.ru/3VsH9M',
    fullUrl: 'https://widokinaraj.pl/#paczka=pkg_gemini_solar_system',
    category: 'Kolekcja Paczek',
    createdAt: '2026-09-17'
  },
  {
    id: 'qr_info365',
    title: 'Wprowadzenie Droga365',
    displayLabel: 'Zeskanuj, aby otworzyć przewodnik info365',
    shortUrl: 'https://clck.ru/3Vnjrc',
    fullUrl: 'https://widokinaraj.pl/#info365',
    sectionId: 'info365',
    category: 'Przewodnik',
    createdAt: '2026-01-01'
  },
  {
    id: 'qr_wnr365',
    title: 'Widoki na Raj (WnR365)',
    displayLabel: 'Zeskanuj, aby czytać wpis dnia WnR365',
    shortUrl: 'https://clck.ru/3Vnjri',
    fullUrl: 'https://widokinaraj.pl/#wnr365',
    sectionId: 'wnr365',
    category: 'Blog',
    createdAt: '2026-01-01'
  },
  {
    id: 'qr_rhz365',
    title: 'Różaniec Historii Zbawienia (RHZ365)',
    displayLabel: 'Zeskanuj, aby odmówić Różaniec IN-LOVE',
    shortUrl: 'https://clck.ru/3Vnjrj',
    fullUrl: 'https://widokinaraj.pl/#rhz365',
    sectionId: 'rhz365',
    category: 'Modlitwa',
    createdAt: '2026-01-01'
  },
  {
    id: 'qr_biblia365',
    title: 'Biblia365 i Apokryfy',
    displayLabel: 'Zeskanuj, aby przeczytać dzisiejszy fragment Pisma',
    shortUrl: 'https://clck.ru/3Vnjrd',
    fullUrl: 'https://widokinaraj.pl/#biblia365',
    sectionId: 'biblia365',
    category: 'Słowo Boże',
    createdAt: '2026-01-01'
  },
  {
    id: 'qr_ebook_wnr',
    title: 'E-book Księga Widoki na Raj',
    displayLabel: 'Zeskanuj, aby otworzyć e-book WnR365',
    shortUrl: 'https://clck.ru/3Vnjrh',
    fullUrl: 'https://widokinaraj.pl/#ebook_wnr',
    sectionId: 'ebook_wnr',
    category: 'E-book',
    createdAt: '2026-01-01'
  },
  {
    id: 'qr_ebook_rhz',
    title: 'E-book Modlitewnik RHZ365',
    displayLabel: 'Zeskanuj, aby otworzyć e-book różańcowy',
    shortUrl: 'https://clck.ru/3Vnjrf',
    fullUrl: 'https://widokinaraj.pl/#ebook_rhz',
    sectionId: 'ebook_rhz',
    category: 'E-book',
    createdAt: '2026-01-01'
  },
  {
    id: 'qr_ebook_biblia',
    title: 'E-book Księga Słowa i Apokryfów',
    displayLabel: 'Zeskanuj, aby otworzyć e-book Biblii365',
    shortUrl: 'https://clck.ru/3Vnjrg',
    fullUrl: 'https://widokinaraj.pl/#ebook_biblia',
    sectionId: 'ebook_biblia',
    category: 'E-book',
    createdAt: '2026-01-01'
  },
  {
    id: 'qr_bio365',
    title: 'Biografia: Ja i Moja Żona (Bio365)',
    displayLabel: 'Zeskanuj, aby czytać wspomnienia małżeńskie',
    shortUrl: 'https://clck.ru/3Vnjre',
    fullUrl: 'https://widokinaraj.pl/#bio365',
    sectionId: 'bio365',
    category: 'Biografia',
    createdAt: '2026-01-01'
  },
  {
    id: 'qr_grafika',
    title: 'Materiały Graficzne i Ilustracje (Droga365)',
    displayLabel: 'Zeskanuj, aby otworzyć galerię materiałów graficznych',
    shortUrl: 'https://clck.ru/3Vr8B8',
    fullUrl: 'https://widokinaraj.pl/#grafika',
    sectionId: 'grafika',
    category: 'Grafika',
    createdAt: '2026-01-01'
  }
];

export function sanitizeQrUrl(url: string | undefined | null, fallbackSlug = 'general', isShort = false): string {
  if (!url) {
    if (isShort) {
      if (fallbackSlug && DEFAULT_CLCK_MAP[fallbackSlug]) {
        return DEFAULT_CLCK_MAP[fallbackSlug];
      }
      const cleanSlug = (fallbackSlug || 'zasoby').replace(/[^a-zA-Z0-9_-]/g, '_');
      const hashVal = Math.abs(Array.from(cleanSlug).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0));
      const code = hashVal.toString(36).toUpperCase().padStart(5, 'A');
      return `https://clck.ru/3${code}`;
    }
    const cleanSlug = (fallbackSlug || 'zasoby').replace(/[^a-zA-Z0-9_-]/g, '_');
    return `https://widokinaraj.pl/#${cleanSlug}`;
  }
  let clean = url.trim();

  // Upgrade legacy /r/ URLs to clck.ru short URLs
  if (isShort && clean.includes('widokinaraj.pl/r/')) {
    const slug = clean.split('/r/')[1]?.toLowerCase() || fallbackSlug;
    if (DEFAULT_CLCK_MAP[slug]) {
      return DEFAULT_CLCK_MAP[slug];
    }
    const hashVal = Math.abs(Array.from(slug).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0));
    const code = hashVal.toString(36).toUpperCase().padStart(5, 'A');
    return `https://clck.ru/3${code}`;
  }

  // Detect base64 Data URIs, blob URIs, SVG markup, raw base64 data strings, or abnormally long non-HTTP targets
  if (
    clean.startsWith('data:') ||
    clean.startsWith('blob:') ||
    clean.includes('data:image/') ||
    clean.includes(';base64,') ||
    clean.startsWith('/9j/') ||
    clean.startsWith('PHN2Zw') ||
    (clean.length > 300 && !clean.startsWith('http://') && !clean.startsWith('https://'))
  ) {
    if (isShort) {
      if (fallbackSlug && DEFAULT_CLCK_MAP[fallbackSlug]) {
        return DEFAULT_CLCK_MAP[fallbackSlug];
      }
      const cleanSlug = (fallbackSlug || 'zasoby').replace(/[^a-zA-Z0-9_-]/g, '_');
      const hashVal = Math.abs(Array.from(cleanSlug).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0));
      const code = hashVal.toString(36).toUpperCase().padStart(5, 'A');
      return `https://clck.ru/3${code}`;
    }
    const cleanSlug = (fallbackSlug || 'zasoby').replace(/[^a-zA-Z0-9_-]/g, '_');
    return `https://widokinaraj.pl/#${cleanSlug}`;
  }

  // Remove duplicate slash in hash route e.g. widokinaraj.pl/#/ -> widokinaraj.pl/#
  if (clean.includes('widokinaraj.pl/#/')) {
    clean = clean.replace('widokinaraj.pl/#/', 'widokinaraj.pl/#');
  }

  // Prepend origin if relative URL
  if (clean.startsWith('/')) {
    const origin = typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://widokinaraj.pl';
    clean = `${origin}${clean}`;
  } else if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }

  return clean;
}

export function sanitizeQrItem(item: QrCodeItem): QrCodeItem {
  const fallbackSlug = item.sectionId || item.id.replace(/^qr_/, '') || 'general';

  let currentShort = item.shortUrl;
  if (
    !currentShort ||
    currentShort.startsWith('blob:') ||
    currentShort.includes('blob:') ||
    currentShort.includes('widokinaraj.pl/r/') ||
    (currentShort === 'https://clck.ru/3Vr8B8' &&
      item.id !== 'qr_grafika' &&
      item.sectionId !== 'grafika' &&
      item.fullUrl &&
      !item.fullUrl.endsWith('#grafika'))
  ) {
    currentShort = '';
  }

  let currentFull = item.fullUrl;
  if (!currentFull || currentFull.startsWith('blob:') || currentFull.includes('blob:')) {
    currentFull = `https://widokinaraj.pl/#${fallbackSlug}`;
  }

  return {
    ...item,
    shortUrl: sanitizeQrUrl(currentShort, fallbackSlug, true),
    fullUrl: sanitizeQrUrl(currentFull, fallbackSlug, false)
  };
}

// Set in-memory QR codes (e.g. from GitHub / server fetch) and persist to local storage
export function setSavedQrCodes(codes: QrCodeItem[]): void {
  if (Array.isArray(codes) && codes.length > 0) {
    const sanitized = codes.map(c => sanitizeQrItem(c));
    memoryQrCodes = sanitized;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } catch {}
  }
}

// Retrieve all QR codes from memory, local storage or defaults
export function getSavedQrCodes(): QrCodeItem[] {
  if (memoryQrCodes && memoryQrCodes.length > 0) {
    return memoryQrCodes.map(c => sanitizeQrItem(c));
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const result = parsed.map((item: QrCodeItem) => sanitizeQrItem(item));
        memoryQrCodes = result;
        return result;
      }
    }
  } catch (err) {
    console.warn('Failed to load QR database:', err);
  }
  memoryQrCodes = DEFAULT_QR_CODES.map(c => sanitizeQrItem(c));
  return memoryQrCodes;
}

/**
 * Get or resolve the official QR code item for a given section or entry
 */
export function getQrCodeForSection(sectionId: string, sectionName?: string): QrCodeItem {
  const all = getSavedQrCodes();
  const cleanId = (sectionId || 'info365').toLowerCase();
  
  // 1. Direct match by sectionId or id
  const match = all.find(q => 
    q.sectionId === cleanId || 
    q.id === `qr_${cleanId}` || 
    q.id === cleanId
  );
  if (match) return match;

  // 2. Fallback match in DEFAULT_QR_CODES
  const defMatch = DEFAULT_QR_CODES.find(q => 
    q.sectionId === cleanId || 
    q.id === `qr_${cleanId}`
  );
  if (defMatch) return defMatch;

  // 3. Dynamic fallback using clck.ru if mapped, otherwise internal redirect
  const defaultShort = DEFAULT_CLCK_MAP[cleanId] || `https://widokinaraj.pl/r/${cleanId}`;
  return {
    id: `qr_${cleanId}`,
    title: sectionName || `Sekcja ${sectionId}`,
    displayLabel: `Zeskanuj, aby otworzyć ${sectionName || sectionId}`,
    shortUrl: defaultShort,
    fullUrl: `https://widokinaraj.pl/#${cleanId}`,
    sectionId: cleanId,
    category: 'Droga365',
    createdAt: '2026-01-01'
  };
}

// Save all QR codes to memory, local storage, backend server, and GitHub repo
export function saveAllQrCodes(
  codes: QrCodeItem[],
  githubConfig?: GitHubConfig,
  currentEntries?: Record<string, any>,
  currentUploads?: any[]
): void {
  memoryQrCodes = codes;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
  } catch (err) {
    console.error('Failed to save QR database to localStorage:', err);
  }

  const activeConfig = githubConfig || getStoredGitHubConfig();

  // 1. Post to backend server endpoint
  fetch('/api/qr-codes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrCodes: codes, githubConfig: activeConfig })
  }).catch(err => {
    console.warn('/api/qr-codes server sync failed:', err);
  });

  // 2. Direct GitHub sync fallback if GitHub token is present
  if (activeConfig.token?.trim() && activeConfig.autoSync) {
    syncStateToGitHub(activeConfig, {
      entries: currentEntries || {},
      uploads: currentUploads || [],
      qrCodes: codes
    }).catch(ghErr => {
      console.warn('Direct GitHub QR sync failed:', ghErr);
    });
  }
}

/**
 * Upload base64 image data URL to backend server to convert into a static file URL in /uploads/
 */
export async function uploadBase64ImageToServer(dataUrl: string, filename?: string): Promise<string> {
  try {
    const res = await fetch('/api/upload-base64', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, filename })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.url) return data.url;
    }
  } catch (e) {
    console.warn('Failed to upload base64 image to server:', e);
  }
  return dataUrl;
}

/**
 * Shorten URL via clck.ru API (with backend proxy and direct client fallbacks)
 */
export async function shortenUrlViaApi(longUrl: string): Promise<string> {
  let cleanUrl = (longUrl || '').trim();
  if (!cleanUrl) return '';

  // If longUrl is a raw base64 Data URI or blob, convert it to a static file URL first!
  if (cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:')) {
    try {
      const staticUrl = await uploadBase64ImageToServer(cleanUrl, 'material');
      if (staticUrl && (staticUrl.startsWith('http://') || staticUrl.startsWith('https://') || staticUrl.startsWith('/'))) {
        cleanUrl = staticUrl;
      } else {
        return cleanUrl;
      }
    } catch {
      return cleanUrl;
    }
  }

  // Normalize relative paths or localhost URLs to a public widokinaraj.pl target for external shorteners like clck.ru
  let publicUrl = cleanUrl;
  if (publicUrl.startsWith('/')) {
    publicUrl = `https://widokinaraj.pl${publicUrl}`;
  } else if (publicUrl.includes('localhost') || publicUrl.includes('127.0.0.1')) {
    publicUrl = publicUrl.replace(/^https?:\/\/[^\/]+/, 'https://widokinaraj.pl');
  } else if (!publicUrl.startsWith('http://') && !publicUrl.startsWith('https://')) {
    publicUrl = `https://${publicUrl}`;
  }

  // 0. Check FILE_CLCK_MAP or DEFAULT_CLCK_MAP first
  const urlFilename = publicUrl.split('/').pop() || '';
  if (urlFilename && FILE_CLCK_MAP[urlFilename]) {
    return FILE_CLCK_MAP[urlFilename];
  }
  try {
    const decodedFilename = decodeURIComponent(urlFilename);
    if (decodedFilename && FILE_CLCK_MAP[decodedFilename]) {
      return FILE_CLCK_MAP[decodedFilename];
    }
  } catch {}

  // 1. Try backend API (/api/shorten - Server-side fetch to clck.ru with 0 CORS issues)
  try {
    const res = await fetch(`/api/shorten?url=${encodeURIComponent(publicUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.shortUrl && data.shortUrl.startsWith('http')) {
        return data.shortUrl;
      }
    }
  } catch (err) {
    console.warn('/api/shorten endpoint failed, trying direct clck.ru:', err);
  }

  // 2. Direct clck.ru API call with publicUrl
  try {
    const res = await fetch(`https://clck.ru/--?url=${encodeURIComponent(publicUrl)}`);
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().startsWith('http')) {
        return text.trim();
      }
    }
  } catch (err) {
    console.warn('Direct clck.ru API fetch failed, trying is.gd:', err);
  }

  // 3. Fallback: is.gd API call
  try {
    const cleanNoHash = publicUrl.replace(/#.*$/, '');
    const res = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(cleanNoHash)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.shorturl) {
        return data.shorturl;
      }
    }
  } catch (err) {
    console.warn('Direct is.gd API fetch failed:', err);
  }

  // 4. Fallback guarantee: unique clck.ru formatted short link
  const hashVal = Math.abs(Array.from(publicUrl).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0));
  const code = hashVal.toString(36).toUpperCase().padStart(5, 'A');
  return `https://clck.ru/3${code}`;
}

/**
 * Batch shorten all QR codes in the database using clck.ru API.
 */
export async function batchShortenAllQrCodes(): Promise<QrCodeItem[]> {
  const current = getSavedQrCodes();
  const updatedList: QrCodeItem[] = [];

  for (const item of current) {
    let newShort = item.shortUrl;
    try {
      newShort = await shortenUrlViaApi(item.fullUrl);
    } catch (e) {
      console.warn(`Could not shorten URL for ${item.id}:`, e);
    }
    updatedList.push({
      ...item,
      shortUrl: newShort,
      updatedAt: new Date().toISOString()
    });
  }

  saveAllQrCodes(updatedList);
  return updatedList;
}

// Add or update a QR code and ensure shortened URL is automatically generated
export function upsertQrCode(item: QrCodeItem): QrCodeItem[] {
  const current = getSavedQrCodes();
  const existingIdx = current.findIndex(c => c.id === item.id);
  
  let itemToSave = { ...item };
  
  // Asynchronously generate shortened URL if missing or raw long URL
  if ((!itemToSave.shortUrl || itemToSave.shortUrl === itemToSave.fullUrl) && itemToSave.fullUrl) {
    shortenUrlViaApi(itemToSave.fullUrl).then(generated => {
      if (generated && generated.startsWith('http')) {
        const latest = getSavedQrCodes();
        const idx = latest.findIndex(c => c.id === itemToSave.id);
        if (idx >= 0) {
          latest[idx] = { ...latest[idx], shortUrl: generated, updatedAt: new Date().toISOString() };
          saveAllQrCodes(latest);
        }
      }
    }).catch(e => console.warn('Auto shorten failed in upsertQrCode:', e));
  }

  let updated: QrCodeItem[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = {
      ...updated[existingIdx],
      ...itemToSave,
      updatedAt: new Date().toISOString()
    };
  } else {
    updated = [itemToSave, ...current];
  }
  saveAllQrCodes(updated);
  return updated;
}

// Dynamically update ONLY the destination fullUrl (shortUrl remains permanent!)
export function updateQrCodeFullUrl(id: string, newFullUrl: string): QrCodeItem[] {
  const current = getSavedQrCodes();
  const updated = current.map(item => {
    if (item.id === id) {
      return {
        ...item,
        fullUrl: newFullUrl,
        updatedAt: new Date().toISOString()
      };
    }
    return item;
  });
  saveAllQrCodes(updated);
  return updated;
}

// Delete QR code
export function deleteQrCode(id: string): QrCodeItem[] {
  const current = getSavedQrCodes();
  const filtered = current.filter(c => c.id !== id);
  saveAllQrCodes(filtered);
  return filtered;
}

/**
 * Export QR codes database to JSON file
 */
export function exportQrCodesToJson(codes?: QrCodeItem[]): void {
  const list = codes || getSavedQrCodes();
  const jsonStr = JSON.stringify(list, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `droga365_kody_qr_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export QR codes database to CSV file (UTF-8 with BOM for Excel compatibility)
 */
export function exportQrCodesToCsv(codes?: QrCodeItem[]): void {
  const list = codes || getSavedQrCodes();
  const headers = ['ID', 'Tytuł / Opis', 'Etykieta pod kodem', 'Docelowy URL (Full)', 'Skrócony URL (Short)', 'Sekcja', 'Kategoria', 'Data Utworzenia'];
  
  const rows = list.map(item => [
    `"${(item.id || '').replace(/"/g, '""')}"`,
    `"${(item.title || '').replace(/"/g, '""')}"`,
    `"${(item.displayLabel || '').replace(/"/g, '""')}"`,
    `"${(item.fullUrl || '').replace(/"/g, '""')}"`,
    `"${(item.shortUrl || '').replace(/"/g, '""')}"`,
    `"${(item.sectionId || '').replace(/"/g, '""')}"`,
    `"${(item.category || '').replace(/"/g, '""')}"`,
    `"${(item.createdAt || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `droga365_kody_qr_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse an imported JSON or CSV file into QrCodeItem array
 */
export async function parseQrCodesFile(file: File): Promise<QrCodeItem[]> {
  const text = await file.text();
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'json' || text.trim().startsWith('[') || text.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : (parsed.qrCodes || parsed.items || [parsed]);
      return arr.map((item: any, idx: number) => ({
        id: item.id || `qr-imported-${Date.now()}-${idx}`,
        title: item.title || item.name || 'Kod QR',
        displayLabel: item.displayLabel || item.label || item.title || 'Skanuj kod',
        fullUrl: item.fullUrl || item.url || item.targetUrl || 'https://widokinaraj.pl',
        shortUrl: item.shortUrl || item.fullUrl || 'https://widokinaraj.pl',
        sectionId: item.sectionId || 'general',
        category: item.category || 'Ogólne',
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt
      }));
    } catch (err) {
      throw new Error('Nieprawidłowy plik JSON. Upewnij się, że plik zawiera poprawną strukturę danych.');
    }
  }

  // Parse CSV
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) throw new Error('Plik CSV jest pusty.');

  const items: QrCodeItem[] = [];
  const startIdx = (lines[0].toLowerCase().includes('tytuł') || lines[0].toLowerCase().includes('title') || lines[0].toLowerCase().includes('id')) ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Matches CSV fields respecting quotes
    const matches = rawLine.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || rawLine.split(',');
    const cleanFields = matches.map(m => m.replace(/^"|"$/g, '').replace(/""/g, '"').trim());

    if (cleanFields.length >= 2) {
      const id = cleanFields[0] || `qr-csv-${Date.now()}-${i}`;
      const title = cleanFields[1] || 'Kod QR';
      const displayLabel = cleanFields[2] || title;
      const fullUrl = cleanFields[3] || 'https://widokinaraj.pl';
      const shortUrl = cleanFields[4] || fullUrl;
      const sectionId = cleanFields[5] || 'general';
      const category = cleanFields[6] || 'Ogólne';

      items.push({
        id,
        title,
        displayLabel,
        fullUrl,
        shortUrl,
        sectionId,
        category,
        createdAt: new Date().toISOString()
      });
    }
  }

  if (items.length === 0) {
    throw new Error('Nie udało się odczytać żadnych wpisów z pliku CSV.');
  }

  return items;
}

/**
 * Import QR items into storage
 */
export function importQrCodes(importedItems: QrCodeItem[], mode: 'merge' | 'replace' = 'merge'): QrCodeItem[] {
  let finalItems: QrCodeItem[];
  if (mode === 'replace') {
    finalItems = importedItems;
  } else {
    const current = getSavedQrCodes();
    const map = new Map<string, QrCodeItem>();
    current.forEach(item => map.set(item.id, item));
    importedItems.forEach(item => map.set(item.id, { ...map.get(item.id), ...item }));
    finalItems = Array.from(map.values());
  }
  saveAllQrCodes(finalItems);
  return finalItems;
}

// Generate raw QR code DataURL (PNG) from text
export async function generateQrDataUrl(text: string, size = 300): Promise<string> {
  const target = sanitizeQrUrl(text, 'grafika', true);
  return await QRCode.toDataURL(target, {
    width: size,
    margin: 2,
    color: {
      dark: '#111827',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'H'
  });
}

/**
 * Generate full PNG graphic badge DataURL (matching downloaded PNG)
 */
export async function generateQrBadgeDataUrl(rawItem: QrCodeItem): Promise<string> {
  const item = sanitizeQrItem(rawItem);
  const badgeTitle = (rawItem.title || item.title || 'Kod QR').trim();
  const badgeDisplayLabel = (rawItem.displayLabel || item.displayLabel || 'Zeskanuj smartfonem').trim();
  const targetUrl = item.shortUrl || item.fullUrl;
  const qrDataUrl = await generateQrDataUrl(targetUrl, 400);

  const canvas = document.createElement('canvas');
  const width = 600;
  const height = 750;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get canvas context');

  const qrImg = new Image();
  if (!qrDataUrl.startsWith('data:')) {
    qrImg.crossOrigin = 'anonymous';
  }

  await new Promise<void>((resolve, reject) => {
    qrImg.onload = () => resolve();
    qrImg.onerror = (err) => reject(new Error('Nie udało się wczytać grafiki QR do pliku PNG.'));
    qrImg.src = qrDataUrl;
  });

  // 1. Background with luxury parchment styling
  ctx.fillStyle = '#fcfbf9';
  ctx.fillRect(0, 0, width, height);

  // Outer border with double thin gold line
  ctx.strokeStyle = '#d4b996';
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  ctx.strokeStyle = '#a18260';
  ctx.lineWidth = 1;
  ctx.strokeRect(22, 22, width - 44, height - 44);

  // 2. Top Title Badge
  ctx.fillStyle = '#b45309';
  ctx.font = 'bold 24px "Cinzel", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(badgeTitle.toUpperCase(), width / 2, 70);

  ctx.fillStyle = '#6b5847';
  ctx.font = 'italic 15px "Newsreader", Georgia, serif';
  ctx.fillText('Droga365 • Zeskanuj lub kliknij', width / 2, 100);

  // Horizontal divider
  ctx.strokeStyle = '#e7ddd1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(80, 115);
  ctx.lineTo(width - 80, 115);
  ctx.stroke();

  // 3. QR Code Box with white backing & shadow
  const qrSize = 360;
  const qrX = (width - qrSize) / 2;
  const qrY = 135;

  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  ctx.fillRect(qrX, qrY, qrSize, qrSize);
  ctx.shadowColor = 'transparent';

  ctx.strokeStyle = '#e2d5c7';
  ctx.lineWidth = 2;
  ctx.strokeRect(qrX, qrY, qrSize, qrSize);

  // Draw QR code image
  ctx.drawImage(qrImg, qrX + 10, qrY + 10, qrSize - 20, qrSize - 20);

  // 4. Display Label underneath code
  ctx.fillStyle = '#1c1917';
  ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(badgeDisplayLabel, width / 2, 545);

  // 5. Short URL (Permanent) & Full URL box
  ctx.fillStyle = '#f5ede3';
  ctx.fillRect(60, 575, width - 120, 95);
  ctx.strokeStyle = '#d4b996';
  ctx.lineWidth = 1;
  ctx.strokeRect(60, 575, width - 120, 95);

  ctx.fillStyle = '#854d0e';
  ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('STAŁY SKRÓCONY ADRES (PRZEKIEROWANIE):', width / 2, 602);

  ctx.fillStyle = '#b45309';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(item.shortUrl || item.fullUrl, width / 2, 626);

  ctx.fillStyle = '#78716c';
  ctx.font = '12px "Plus Jakarta Sans", sans-serif';
  const truncatedFull = item.fullUrl.length > 55 ? item.fullUrl.substring(0, 52) + '...' : item.fullUrl;
  ctx.fillText(`Cel: ${truncatedFull}`, width / 2, 652);

  // 6. Bottom footer note
  ctx.fillStyle = '#a89989';
  ctx.font = '11px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Widoki na Raj • RHZ • Biblia • E-book • Bio • www.widokinaraj.pl', width / 2, 705);

  return canvas.toDataURL('image/png');
}

// Generate an elegant, complete graphic badge with Title, crisp QR code, display label and URLs, and download as PNG
export async function generateAndDownloadQrBadgePng(item: QrCodeItem): Promise<void> {
  const pngUrl = await generateQrBadgeDataUrl(item);
  const link = document.createElement('a');
  const safeId = (item.id || 'kod').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeTitle = (item.title || 'QR').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.download = `QR_${safeId}_${safeTitle}.png`;
  link.href = pngUrl;
  link.setAttribute('download', link.download);
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    try {
      document.body.removeChild(link);
    } catch {}
  }, 300);
}

/**
 * Generate lightweight SVG QR Data URL (instant, tiny size ~1KB)
 */
export async function generateQrSvgDataUrl(text: string, size = 300): Promise<string> {
  try {
    const target = text || 'https://widokinaraj.pl';
    const svgText = await QRCode.toString(target, {
      type: 'svg',
      width: size,
      margin: 1,
      color: {
        dark: '#111827',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
  } catch (err) {
    console.warn('SVG QR generation fallback:', err);
    return await generateQrDataUrl(text, size);
  }
}

// Generate embedded HTML for WYSIWYG editor (lightweight SVG QR badge linked to short URL redirect)
export async function generateQrWysiwygHtml(item: QrCodeItem): Promise<string> {
  const targetUrl = item.shortUrl || item.fullUrl;
  const svgDataUrl = await generateQrSvgDataUrl(targetUrl, 240);
  return `
    <div style="text-align: center; margin: 20px auto; max-width: 340px; padding: 16px; background-color: #fcfbf9; border: 2px solid #d4b996; border-radius: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
      <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" title="Kliknij, aby otworzyć ${item.title}" style="display: block; text-decoration: none; color: inherit;">
        <div style="font-family: 'Cinzel', Georgia, serif; font-size: 14px; font-weight: bold; color: #b45309; text-transform: uppercase; margin-bottom: 8px;">${item.title}</div>
        <img src="${svgDataUrl}" alt="${item.title}" style="display: block; width: 180px; height: 180px; border-radius: 8px; border: 1px solid #e7ddd1; margin: 0 auto; background: #ffffff; padding: 4px;" />
        <div style="font-size: 13px; font-weight: bold; color: #1c1917; margin-top: 10px;">${item.displayLabel}</div>
        <div style="font-size: 11px; font-family: monospace; color: #b45309; margin-top: 4px; word-break: break-all;">${targetUrl}</div>
      </a>
    </div>
    <p><br/></p>
  `;
}
