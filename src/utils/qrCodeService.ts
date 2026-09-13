import QRCode from 'qrcode';
import { QrCodeItem, SectionId } from '../types';

const STORAGE_KEY = 'drogowskazy_qr_database';

export const DEFAULT_QR_CODES: QrCodeItem[] = [
  {
    id: 'qr_info365',
    title: 'Wprowadzenie Drogowskazy 365',
    displayLabel: 'Zeskanuj, aby otworzyć przewodnik info365',
    shortUrl: 'https://tinyurl.com/26erofvm',
    fullUrl: 'https://widokinaraj.pl/#info365',
    sectionId: 'info365',
    category: 'Przewodnik',
    createdAt: '2026-01-01'
  },
  {
    id: 'qr_wnr365',
    title: 'Widoki na Raj (WnR365)',
    displayLabel: 'Zeskanuj, aby czytać wpis dnia WnR365',
    shortUrl: 'https://tinyurl.com/2yygjzkw',
    fullUrl: 'https://widokinaraj.pl/#wnr365',
    sectionId: 'wnr365',
    category: 'Blog',
    createdAt: '2026-01-01'
  },
  {
    id: 'qr_rhz365',
    title: 'Różaniec Historii Zbawienia (RHZ365)',
    displayLabel: 'Zeskanuj, aby odmówić Różaniec IN-LOVE',
    shortUrl: 'https://tinyurl.com/2d3bx2gu',
    fullUrl: 'https://widokinaraj.pl/#rhz365',
    sectionId: 'rhz365',
    category: 'Modlitwa',
    createdAt: '2026-01-01'
  },
  {
    id: 'qr_biblia365',
    title: 'Biblia365 i Apokryfy',
    displayLabel: 'Zeskanuj, aby przeczytać dzisiejszy fragment Pisma',
    shortUrl: 'https://tinyurl.com/29pjc97q',
    fullUrl: 'https://widokinaraj.pl/#biblia365',
    sectionId: 'biblia365',
    category: 'Słowo Boże',
    createdAt: '2026-01-01'
  },
  {
    id: 'qr_ebook_wnr',
    title: 'E-book Księga Widoki na Raj',
    displayLabel: 'Zeskanuj, aby otworzyć e-book WnR365',
    shortUrl: 'https://tinyurl.com/22ncdf9y',
    fullUrl: 'https://widokinaraj.pl/#ebook_wnr',
    sectionId: 'ebook_wnr',
    category: 'E-book',
    createdAt: '2026-01-01'
  },
  {
    id: 'qr_ebook_rhz',
    title: 'E-book Modlitewnik RHZ365',
    displayLabel: 'Zeskanuj, aby otworzyć e-book różańcowy',
    shortUrl: 'https://tinyurl.com/27mws567',
    fullUrl: 'https://widokinaraj.pl/#ebook_rhz',
    sectionId: 'ebook_rhz',
    category: 'E-book',
    createdAt: '2026-01-01'
  },
  {
    id: 'qr_ebook_biblia',
    title: 'E-book Księga Słowa i Apokryfów',
    displayLabel: 'Zeskanuj, aby otworzyć e-book Biblii365',
    shortUrl: 'https://tinyurl.com/24c87bu3',
    fullUrl: 'https://widokinaraj.pl/#ebook_biblia',
    sectionId: 'ebook_biblia',
    category: 'E-book',
    createdAt: '2026-01-01'
  },
  {
    id: 'qr_bio365',
    title: 'Biografia: Ja i Moja Żona (Bio365)',
    displayLabel: 'Zeskanuj, aby czytać wspomnienia małżeńskie',
    shortUrl: 'https://tinyurl.com/2bxofvfb',
    fullUrl: 'https://widokinaraj.pl/#bio365',
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
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load QR database:', err);
  }
  return DEFAULT_QR_CODES;
}

/**
 * Shorten a long URL via API (TinyURL / clck.ru) for instant 301/302 redirects, 100% free and without ads.
 */
export async function shortenUrlViaApi(longUrl: string): Promise<string> {
  if (!longUrl || !longUrl.trim()) {
    throw new Error('Adres URL nie może być pusty.');
  }
  const cleanUrl = longUrl.trim();

  // 1. Try local Cloudflare Pages /api/shorten endpoint
  try {
    const res = await fetch(`/api/shorten?url=${encodeURIComponent(cleanUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.shortUrl) return data.shortUrl;
    }
  } catch (err) {
    console.warn('Local /api/shorten endpoint failed, falling back to direct API calls:', err);
  }

  // 2. Direct TinyURL API call (Free, instant 301, no ads)
  try {
    const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(cleanUrl)}`);
    if (res.ok) {
      const text = await res.text();
      if (text && text.startsWith('http')) {
        return text.trim();
      }
    }
  } catch (err) {
    console.warn('Direct TinyURL API fetch failed, trying clck.ru:', err);
  }

  // 3. Direct clck.ru API call (Free, instant redirect, no ads)
  try {
    const res = await fetch(`https://clck.ru/--?url=${encodeURIComponent(cleanUrl)}`);
    if (res.ok) {
      const text = await res.text();
      if (text && text.startsWith('http')) {
        return text.trim();
      }
    }
  } catch (err) {
    console.warn('Direct clck.ru API fetch failed:', err);
  }

  throw new Error('Nie udało się połączyć z usługą skracania adresów URL (TinyURL API). Sprawdź połączenie z siecią.');
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

// Save all QR codes
export function saveAllQrCodes(codes: QrCodeItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
  } catch (err) {
    console.error('Failed to persist QR database:', err);
  }
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

// Generate an elegant, complete graphic badge with Title, crisp QR code, display label and URLs, and download as PNG
export async function generateAndDownloadQrBadgePng(item: QrCodeItem): Promise<void> {
  // Use destination or shortUrl (the shortUrl is permanent, redirecting to fullUrl in production)
  const targetUrl = item.shortUrl || item.fullUrl;
  const qrDataUrl = await generateQrDataUrl(targetUrl, 400);

  // Create an offscreen canvas to render the complete graphic badge
  const canvas = document.createElement('canvas');
  const width = 600;
  const height = 750;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get canvas context');

  // Load QR image
  const qrImg = new Image();
  qrImg.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    qrImg.onload = () => resolve();
    qrImg.onerror = reject;
    qrImg.src = qrDataUrl;
  });

  // 1. Background with subtle luxury styling
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
  ctx.fillText('Drogowskazy 365 • Zeskanuj smartfonem', width / 2, 100);

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
  ctx.fillText('STAŁY SKRÓCONY ADRES (DO DRUKU):', width / 2, 602);

  ctx.fillStyle = '#b45309';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(item.shortUrl, width / 2, 626);

  ctx.fillStyle = '#78716c';
  ctx.font = '12px "Plus Jakarta Sans", sans-serif';
  const truncatedFull = item.fullUrl.length > 55 ? item.fullUrl.substring(0, 52) + '...' : item.fullUrl;
  ctx.fillText(`Cel: ${truncatedFull}`, width / 2, 652);

  // 6. Bottom footer note
  ctx.fillStyle = '#a89989';
  ctx.font = '11px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Widoki na Raj • RHZ • Biblia • E-book • Bio • www.widokinaraj.pl', width / 2, 705);

  // Export to PNG & download
  const pngUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `QR_${item.id}_${item.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
  link.href = pngUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Generate embedded HTML for WYSIWYG editor (entire card is an active link)
export async function generateQrWysiwygHtml(item: QrCodeItem): Promise<string> {
  const targetUrl = item.shortUrl || item.fullUrl;
  const qrDataUrl = await generateQrDataUrl(targetUrl, 180);
  return `
    <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="qr-code-embed-card" style="display: block; margin: 20px auto; max-width: 380px; padding: 18px; border: 2px solid #d4b996; border-radius: 16px; background-color: #faf8f5; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.06); font-family: 'Plus Jakarta Sans', sans-serif; text-decoration: none; color: inherit; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease;">
      <div style="font-family: 'Cinzel', serif; font-size: 15px; font-weight: bold; color: #b45309; text-transform: uppercase; margin-bottom: 6px;">
        ${item.title}
      </div>
      <div style="margin: 12px auto; display: inline-block; padding: 8px; background: #ffffff; border-radius: 12px; border: 1px solid #e7ddd1; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
        <img src="${qrDataUrl}" alt="${item.title}" style="display: block; width: 150px; height: 150px; margin: 0 auto;" />
      </div>
      <div style="font-size: 13px; font-weight: 600; color: #292524; margin-top: 4px; margin-bottom: 8px;">
        ${item.displayLabel}
      </div>
      <div style="font-size: 11px; color: #78716c; background: #f4ede3; padding: 6px 10px; border-radius: 8px; word-break: break-all;">
        <span style="font-weight: bold; color: #854d0e;">Kliknij lub zeskanuj:</span> <span style="color: #b45309; text-decoration: underline;">${targetUrl}</span>
      </div>
    </a>
  `;
}
