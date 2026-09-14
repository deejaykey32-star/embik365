import React, { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  Download, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  ExternalLink, 
  Search, 
  Sparkles,
  Link2,
  Share2,
  Copy,
  Wand2,
  RefreshCw,
  Zap,
  Upload
} from 'lucide-react';
import { QrCodeItem } from '../types';
import QRCode from 'qrcode';
import { 
  getSavedQrCodes, 
  upsertQrCode, 
  deleteQrCode, 
  updateQrCodeFullUrl, 
  generateAndDownloadQrBadgePng,
  generateQrDataUrl,
  generateQrSvgDataUrl,
  shortenUrlViaApi,
  batchShortenAllQrCodes,
  exportQrCodesToJson,
  exportQrCodesToCsv,
  parseQrCodesFile,
  importQrCodes
} from '../utils/qrCodeService';

const QrImageDisplay: React.FC<{ text: string; title: string }> = ({ text, title }) => {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const target = (text || 'https://widokinaraj.pl').trim();

    QRCode.toDataURL(target, {
      width: 220,
      margin: 1,
      color: { dark: '#111827', light: '#ffffff' },
      errorCorrectionLevel: 'M'
    })
    .then(url => {
      if (isMounted) setSrc(url);
    })
    .catch(() => {
      generateQrSvgDataUrl(target, 220).then(svgUrl => {
        if (isMounted) setSrc(svgUrl);
      });
    });

    return () => { isMounted = false; };
  }, [text]);

  if (!src) {
    return (
      <div className="w-full h-full bg-stone-100 dark:bg-stone-800 rounded-lg animate-pulse flex items-center justify-center text-[10px] text-stone-400">
        Ładowanie QR...
      </div>
    );
  }

  return <img src={src} alt={title} className="w-full h-full object-contain pointer-events-auto" />;
};

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQrForWysiwyg?: (qrItem: QrCodeItem) => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  onSelectQrForWysiwyg
}) => {
  if (!isOpen) return null;

  const [qrCodes, setQrCodes] = useState<QrCodeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<QrCodeItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [qrPreviews, setQrPreviews] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isShortening, setIsShortening] = useState(false);
  const [shortenError, setShortenError] = useState<string | null>(null);

  // New item form state
  const [newTitle, setNewTitle] = useState('');
  const [newDisplayLabel, setNewDisplayLabel] = useState('');
  const [newShortUrl, setNewShortUrl] = useState('');
  const [newFullUrl, setNewFullUrl] = useState('');
  const [newCategory, setNewCategory] = useState('Ogólne');

  // Load QR codes
  useEffect(() => {
    const list = getSavedQrCodes();
    setQrCodes(list);
  }, []);

  // Generate previews for all QR codes
  useEffect(() => {
    let isMounted = true;
    const generateAll = async () => {
      const map: Record<string, string> = {};
      for (const item of qrCodes) {
        try {
          const url = await generateQrDataUrl(item.shortUrl || item.fullUrl, 160);
          map[item.id] = url;
        } catch {}
      }
      if (isMounted) setQrPreviews(map);
    };
    generateAll();
    return () => { isMounted = false; };
  }, [qrCodes]);

  const filtered = qrCodes.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.displayLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.shortUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.fullUrl.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadPng = async (item: QrCodeItem) => {
    setDownloadingId(item.id);
    try {
      await generateAndDownloadQrBadgePng(item);
    } catch (err) {
      console.error('Download PNG failed:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCopyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const updated = upsertQrCode(editingItem);
    setQrCodes(updated);
    setEditingItem(null);
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newShortUrl || !newFullUrl) return;

    const newItem: QrCodeItem = {
      id: `qr_${Date.now()}`,
      title: newTitle,
      displayLabel: newDisplayLabel || 'Zeskanuj smartfonem',
      shortUrl: newShortUrl,
      fullUrl: newFullUrl,
      category: newCategory,
      createdAt: new Date().toISOString()
    };

    const updated = upsertQrCode(newItem);
    setQrCodes(updated);
    setIsCreating(false);
    setNewTitle('');
    setNewDisplayLabel('');
    setNewShortUrl('');
    setNewFullUrl('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć ten kod QR z bazy?')) {
      const updated = deleteQrCode(id);
      setQrCodes(updated);
    }
  };

  const handleGenerateApiShortUrl = async () => {
    const targetUrl = isCreating ? newFullUrl : editingItem?.fullUrl;
    if (!targetUrl) {
      setShortenError('Wprowadź najpierw pełny adres docelowy.');
      return;
    }
    setIsShortening(true);
    setShortenError(null);
    try {
      const generatedShort = await shortenUrlViaApi(targetUrl);
      if (isCreating) {
        setNewShortUrl(generatedShort);
      } else if (editingItem) {
        setEditingItem(prev => prev ? ({ ...prev, shortUrl: generatedShort }) : null);
      }
    } catch (err: any) {
      setShortenError(err.message || 'Nie udało się wygenerować skrótu API.');
    } finally {
      setIsShortening(false);
    }
  };

  const handleBatchShortenAll = async () => {
    if (!confirm('Wygenerować bezreklamowe, natychmiastowe skróty (clck.ru / direct API - 0 reklam, natychmiastowe przekierowanie) dla wszystkich kodów QR?')) return;
    setIsShortening(true);
    try {
      const updated = await batchShortenAllQrCodes();
      setQrCodes(updated);
    } catch (err: any) {
      alert('Błąd skracania linków: ' + err.message);
    } finally {
      setIsShortening(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#0c121e] rounded-3xl p-5 sm:p-7 shadow-2xl border border-amber-500/30 my-auto max-h-[92vh] flex flex-col text-[#2c2219] dark:text-[#f1f5f9]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-heading-cinzel font-bold">
                Baza Kodów QR & Generator PNG
              </h3>
              <p className="text-xs text-[#786756] dark:text-[#94a3b8]">
                Zarządzaj stałymi skróconymi adresami API (darmowe, natychmiastowe 301, bez reklam) i dynamicznymi celami
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 my-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Szukaj w bazie kodów..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-100 dark:bg-[#141e30] border border-stone-200 dark:border-[#223350] text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input
              type="file"
              id="import-qr-file-modal"
              accept=".json,.csv"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const items = await parseQrCodesFile(file);
                  const mode = confirm(`Odczytano ${items.length} kodów QR z pliku "${file.name}".\n\nKliknij [OK], aby połączyć (scal) z obecną bazą.\nKliknij [Anuluj], aby zastąpić całą obecną bazę nowymi kodami.`) ? 'merge' : 'replace';
                  const updated = importQrCodes(items, mode);
                  setQrCodes(updated);
                  alert(`Pomyślnie zaimportowano ${items.length} kodów QR!`);
                } catch (err: any) {
                  alert(err.message || 'Błąd importu pliku');
                }
                e.target.value = '';
              }}
            />
            <button
              onClick={() => document.getElementById('import-qr-file-modal')?.click()}
              className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-[#182335] dark:hover:bg-[#22334c] text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-[#2b3d5c] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Importuj kody QR z pliku JSON lub CSV"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importuj</span>
            </button>

            <button
              onClick={() => exportQrCodesToJson(qrCodes)}
              className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-[#182335] dark:hover:bg-[#22334c] text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-[#2b3d5c] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Eksportuj całą bazę do JSON"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              <span>JSON</span>
            </button>

            <button
              onClick={() => exportQrCodesToCsv(qrCodes)}
              className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-[#182335] dark:hover:bg-[#22334c] text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-[#2b3d5c] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Eksportuj całą bazę do CSV (Excel)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleBatchShortenAll}
              disabled={isShortening}
              className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Skróć wszystkie linki przez bezreklamowe API (clck.ru / direct)"
            >
              {isShortening ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
              <span>Skróć Wszystkie</span>
            </button>

            <button
              onClick={() => { setIsCreating(true); setEditingItem(null); setShortenError(null); }}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Dodaj Nowy</span>
            </button>
          </div>
        </div>

        {/* Create / Edit Form Drawer */}
        {(isCreating || editingItem) && (
          <form 
            onSubmit={isCreating ? handleSaveNew : handleSaveEdit}
            className="mb-5 p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/25 border border-amber-500/30 text-xs space-y-3"
          >
            <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300">
              <span>{isCreating ? 'Tworzenie Nowego Kodu QR' : `Edycja Kodu: ${editingItem?.title}`}</span>
              <button
                type="button"
                onClick={() => { setIsCreating(false); setEditingItem(null); setShortenError(null); }}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                Anuluj
              </button>
            </div>

            {shortenError && (
              <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/50 border border-rose-300 text-rose-800 dark:text-rose-200 text-xs">
                {shortenError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1">Tytuł Kodu (nagłówek):</label>
                <input
                  type="text"
                  required
                  value={isCreating ? newTitle : editingItem?.title || ''}
                  onChange={(e) => isCreating ? setNewTitle(e.target.value) : setEditingItem(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                  placeholder="np. Widoki na Raj 25 XII"
                  className="w-full p-2 rounded-xl bg-white dark:bg-[#141e30] border border-stone-300 dark:border-stone-700"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Nazwa wyświetlana pod kodem:</label>
                <input
                  type="text"
                  required
                  value={isCreating ? newDisplayLabel : editingItem?.displayLabel || ''}
                  onChange={(e) => isCreating ? setNewDisplayLabel(e.target.value) : setEditingItem(prev => prev ? ({ ...prev, displayLabel: e.target.value }) : null)}
                  placeholder="np. Zeskanuj, aby przeczytać wpis w telefonie"
                  className="w-full p-2 rounded-xl bg-white dark:bg-[#141e30] border border-stone-300 dark:border-stone-700"
                />
              </div>

              <div>
                <label className="font-bold block mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>Skrócony adres URL (Stały do druku):</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateApiShortUrl}
                    disabled={isShortening}
                    className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Automatycznie pobierz skrót bezreklamowy (clck.ru / direct API)"
                  >
                    {isShortening ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    <span>Skróć z API</span>
                  </button>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    required
                    value={isCreating ? newShortUrl : editingItem?.shortUrl || ''}
                    onChange={(e) => isCreating ? setNewShortUrl(e.target.value) : setEditingItem(prev => prev ? ({ ...prev, shortUrl: e.target.value }) : null)}
                    placeholder="https://clck.ru/..."
                    className="w-full p-2 rounded-xl bg-white dark:bg-[#141e30] border border-stone-300 dark:border-stone-700 font-mono text-xs"
                  />
                </div>
                <span className="text-[10px] text-stone-500">Adres w kodzie QR (darmowe, natychmiastowe 301, zero reklam).</span>
              </div>

              <div>
                <label className="font-bold block mb-1 flex items-center gap-1">
                  <span className="text-amber-700 dark:text-amber-400">Pełny adres docelowy (Dynamiczny):</span>
                </label>
                <input
                  type="url"
                  required
                  value={isCreating ? newFullUrl : editingItem?.fullUrl || ''}
                  onChange={(e) => isCreating ? setNewFullUrl(e.target.value) : setEditingItem(prev => prev ? ({ ...prev, fullUrl: e.target.value }) : null)}
                  placeholder="https://widokinaraj.pl/#wnr365"
                  className="w-full p-2 rounded-xl bg-white dark:bg-[#141e30] border border-amber-500 dark:border-amber-400 font-mono text-xs"
                />
                <span className="text-[10px] text-amber-700 dark:text-amber-400">Możesz zmieniać ten cel w dowolnym momencie!</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer"
              >
                Zapisz Kod w Bazie
              </button>
            </div>
          </form>
        )}

        {/* QR Code Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-10 opacity-60 text-xs">
              Brak kodów QR spełniających kryteria.
            </div>
          ) : (
            filtered.map((item) => {
              const previewUrl = qrPreviews[item.id];
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-stone-200 dark:border-[#1e2a40] bg-stone-50/70 dark:bg-[#111827] flex flex-col sm:flex-row items-center gap-4 transition-all hover:border-amber-500/50"
                >
                  {/* QR Preview Box (Clickable active link) */}
                  <a
                    href={item.shortUrl || item.fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-28 h-28 rounded-xl bg-white p-2 border border-stone-200 shadow-xs hover:border-amber-500 hover:scale-105 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                    title="Kliknij, aby przetestować przekierowanie w nowej karcie"
                  >
                    <QrImageDisplay text={item.shortUrl || item.fullUrl} title={item.title} />
                  </a>

                  {/* Metadata */}
                  <div className="flex-1 text-xs space-y-1 w-full text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h4 className="font-bold text-sm text-[#3d2c1d] dark:text-[#f8fafc]">
                        {item.title}
                      </h4>
                      {item.category && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-200 dark:bg-stone-800">
                          {item.category}
                        </span>
                      )}
                    </div>

                    <p className="font-medium text-amber-800 dark:text-amber-300">
                      {item.displayLabel}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 font-mono text-[11px]">
                      <span className="text-stone-600 dark:text-stone-400">
                        <strong>Stały skrót: </strong>{item.shortUrl}
                      </span>
                      <button
                        onClick={() => handleCopyLink(item.shortUrl, `${item.id}_short`)}
                        className="opacity-70 hover:opacity-100 self-center sm:self-auto cursor-pointer"
                        title="Kopiuj krótki URL"
                      >
                        {copiedId === `${item.id}_short` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="font-mono text-[11px] text-amber-900 dark:text-amber-400 truncate max-w-md">
                      <strong>Dynamiczny cel: </strong>{item.fullUrl}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex sm:flex-col items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200 dark:border-stone-800">
                    {onSelectQrForWysiwyg && (
                      <button
                        onClick={() => onSelectQrForWysiwyg(item)}
                        className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Wklej ten kod QR do edytora tekstu"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Wstaw do edytora</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDownloadPng(item)}
                      disabled={downloadingId === item.id}
                      className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                      title="Pobierz plik graficzny PNG wysokiej rozdzielczości do druku"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{downloadingId === item.id ? 'Generowanie...' : 'Pobierz PNG'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        title="Edytuj dynamiczny cel lub etykiety"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg border border-red-300 dark:border-red-900 text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Usuń z bazy"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-black/10 dark:border-white/10 mt-3 flex items-center justify-between text-[11px] opacity-70">
          <span>Łącznie w bazie: {qrCodes.length} kodów QR</span>
          <span>PNG generowane w 300 DPI gotowe do Amazon KDP, Empik i druku</span>
        </div>
      </div>
    </div>
  );
};
