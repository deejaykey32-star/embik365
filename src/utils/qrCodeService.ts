import QRCode from 'qrcode';
import { QrCodeItem, SectionId } from '../types';

const STORAGE_KEY = 'drogowskazy_qr_database';

export const DEFAULT_QR_CODES: QrCodeItem[] = [
  {
    id: 'qr_info365',
    title: 'Wprowadzenie Droga365',
    displayLabel: 'Zeskanuj, aby otworzyć przewodnik info365',
    shortUrl: 'https://clck.ru/3Vnjrc',
    fullUrl: 'https://widokinaraj.pl/#/info365',
    sectionId: 'info365',
    category: 'Przewodnik',
    createdAt: '2026-01-01'
  },
  {
    id: 'qr_wnr365',
    title: 'Widoki na Raj (WnR365)',
    displayLabel: 'Zeskanuj, aby czytać wpis dnia WnR365',
    shortUrl: 'https://clck.ru/3Vnjri',
    fullUrl: 'https://widokinaraj.pl/#/wnr365',
    sectionId: 'wnr365',
    category: 'Blog',
    createdAt: '2026-01-01'
  },
  {
    id: 'qr_rhz365',
    title: 'Różaniec Historii Zbawienia (RHZ365)',
    displayLabel: 'Zeskanuj, aby odmówić Różaniec IN-LOVE',
    shortUrl: 'https://clck.ru/3Vnjrj',
    fullUrl: 'https://widokinaraj.pl/#/rhz365',
    sectionId: 'rhz365',
    category: 'Modlitwa',
    createdAt: '2026-01-01'
  },
  {
    id: 'qr_biblia365',
    title: 'Biblia365 i Apokryfy',
    displayLabel: 'Zeskanuj, aby przeczytać dzisiejszy fragment Pisma',
    shortUrl: 'https://clck.ru/3Vnjrd',
    fullUrl: 'https://widokinaraj.pl/#/biblia365',
    sectionId: 'biblia365',
    category: 'Słowo Boże',
    createdAt: '2026-01-01'
  },
  {
    id: 'qr_ebook_wnr',
    title: 'E-book Księga Widoki na Raj',
    displayLabel: 'Zeskanuj, aby otworzyć e-book WnR365',
    shortUrl: 'https://clck.ru/3Vnjrh',
    fullUrl: 'https://widokinaraj.pl/#/ebook_wnr',
    sectionId: 'ebook_wnr',
    category: 'E-book',
    createdAt: '2026-01-01'
  },
  {
    id: 'qr_ebook_rhz',
    title: 'E-book Modlitewnik RHZ365',
    displayLabel: 'Zeskanuj, aby otworzyć e-book różańcowy',
    shortUrl: 'https://clck.ru/3Vnjrf',
    fullUrl: 'https://widokinaraj.pl/#/ebook_rhz',
    sectionId: 'ebook_rhz',
    category: 'E-book',
    createdAt: '2026-01-01'
  },
  {
    id: 'qr_ebook_biblia',
    title: 'E-book Księga Słowa i Apokryfów',
    displayLabel: 'Zeskanuj, aby otworzyć e-book Biblii365',
    shortUrl: 'https://clck.ru/3Vnjrg',
    fullUrl: 'https://widokinaraj.pl/#/ebook_biblia',
    sectionId: 'ebook_biblia',
    category: 'E-book',
    createdAt: '2026-01-01'
  },
  {
    id: 'qr_bio365',
    title: 'Biografia: Ja i Moja Żona (Bio365)',
    displayLabel: 'Zeskanuj, aby czytać wspomnienia małżeńskie',
    shortUrl: 'https://clck.ru/3Vnjre',
    fullUrl: 'https://widokinaraj.pl/#/bio365',
    sectionId: 'bio365',
    category: 'Biografia',
    createdAt: '2026-01-01'
  }
];

// Retrieve all QR codes from local storage or defaults
export function getSavedQrCodes(): QrCodeItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: QrCodeItem) => {
          if (item.shortUrl && item.shortUrl.includes('tinyurl.com')) {
            const def = DEFAULT_QR_CODES.find(d => d.id === item.id);
            return {
              ...item,
              shortUrl: def ? def.shortUrl : item.fullUrl
            };
          }
          return item;
        });
      }
    }
  } catch (err) {
    console.warn('Failed to load QR database:', err);
  }
  return DEFAULT_QR_CODES;
}

// Save all QR codes to local storage
export function saveAllQrCodes(codes: QrCodeItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
  } catch (err) {
    console.error('Failed to save QR database:', err);
  }
}

/**
 * Shorten URL via direct free API (clck.ru / is.gd) with 0 ads and instant 301/302 redirection.
 */
export async function shortenUrlViaApi(longUrl: string): Promise<string> {
  let cleanUrl = longUrl.trim();
  if (!cleanUrl) return 'https://widokinaraj.pl';

  // Normalize relative paths (e.g. /assets/RGB-model-1-UU-G6evC.jpg) to full URLs for clck.ru API
  if (cleanUrl.startsWith('/')) {
    const origin = typeof window !== 'undefined' && window.location?.origin 
      ? window.location.origin 
      : 'https://widokinaraj.pl';
    cleanUrl = `${origin}${cleanUrl}`;
  } else if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }

  // 1. Direct clck.ru API call (fastest)
  try {
    const res = await fetch(`https://clck.ru/--?url=${encodeURIComponent(cleanUrl)}`);
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().startsWith('http')) {
        return text.trim();
      }
    }
  } catch (err) {
    console.warn('Direct clck.ru API fetch failed, trying backend /api/shorten:', err);
  }

  // 2. Try backend API (/api/shorten - Server-side fetch with NO CORS restrictions!)
  try {
    const res = await fetch(`/api/shorten?url=${encodeURIComponent(cleanUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.shortUrl && data.shortUrl.startsWith('http')) {
        return data.shortUrl;
      }
    }
  } catch (err) {
    console.warn('/api/shorten endpoint failed, trying client fallbacks:', err);
  }

  // 3. Fallback: is.gd API call
  try {
    const cleanNoHash = cleanUrl.replace(/#.*$/, '');
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

  return cleanUrl;
}

/**
 * Batch shorten all QR codes in the database using the free ad-free API.
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

// Add or update a QR code
export function upsertQrCode(item: QrCodeItem): QrCodeItem[] {
  const current = getSavedQrCodes();
  const existingIdx = current.findIndex(c => c.id === item.id);
  let updated: QrCodeItem[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = {
      ...updated[existingIdx],
      ...item,
      updatedAt: new Date().toISOString()
    };
  } else {
    updated = [item, ...current];
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
  return await QRCode.toDataURL(text, {
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
export async function generateQrBadgeDataUrl(item: QrCodeItem): Promise<string> {
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
  qrImg.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    qrImg.onload = () => resolve();
    qrImg.onerror = reject;
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
  ctx.fillText(item.title.toUpperCase(), width / 2, 70);

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
  ctx.fillText(item.displayLabel, width / 2, 545);

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
  link.download = `QR_${item.id}_${item.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
  link.href = pngUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Generate embedded HTML for WYSIWYG editor (active PNG badge image linked to short URL redirect)
export async function generateQrWysiwygHtml(item: QrCodeItem): Promise<string> {
  const targetUrl = item.shortUrl || item.fullUrl;
  const badgePngUrl = await generateQrBadgeDataUrl(item);
  return `
    <div style="text-align: center; margin: 24px auto; max-width: 400px;">
      <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" title="Kliknij, aby przejść do ${item.title} (${targetUrl})" style="display: inline-block; text-decoration: none;">
        <img src="${badgePngUrl}" alt="${item.title}" style="display: block; max-width: 100%; width: 380px; height: auto; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); border: 2px solid #d4b996; margin: 0 auto; transition: transform 0.2s ease;" />
      </a>
    </div>
    <p><br/></p>
  `;
}
