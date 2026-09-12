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
  Copy
} from 'lucide-react';
import { QrCodeItem } from '../types';
import { 
  getSavedQrCodes, 
  upsertQrCode, 
  deleteQrCode, 
  updateQrCodeFullUrl, 
  generateAndDownloadQrBadgePng,
  generateQrDataUrl 
} from '../utils/qrCodeService';

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
                Zarządzaj stałymi skróconymi adresami (dla druku) i dynamicznymi adresami docelowymi
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

          <button
            onClick={() => { setIsCreating(true); setEditingItem(null); }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Dodaj Nowy Kod QR</span>
          </button>
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
                onClick={() => { setIsCreating(false); setEditingItem(null); }}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                Anuluj
              </button>
            </div>

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
                <label className="font-bold block mb-1 flex items-center gap-1">
                  <span>Skrócony adres URL (Stały do druku):</span>
                </label>
                <input
                  type="url"
                  required
                  value={isCreating ? newShortUrl : editingItem?.shortUrl || ''}
                  onChange={(e) => isCreating ? setNewShortUrl(e.target.value) : setEditingItem(prev => prev ? ({ ...prev, shortUrl: e.target.value }) : null)}
                  placeholder="https://widokinaraj.pl/r/wnr"
                  className="w-full p-2 rounded-xl bg-white dark:bg-[#141e30] border border-stone-300 dark:border-stone-700 font-mono"
                />
                <span className="text-[10px] text-stone-500">Ten adres jest kodowany w grafice QR na stałe.</span>
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
                  className="w-full p-2 rounded-xl bg-white dark:bg-[#141e30] border border-amber-500 dark:border-amber-400 font-mono"
                />
                <span className="text-[10px] text-amber-700 dark:text-amber-400">Możesz zmieniać ten cel w dowolnym momencie bez przedruku!</span>
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
                  {/* QR Preview Box */}
                  <div className="w-28 h-28 rounded-xl bg-white p-2 border border-stone-200 shadow-sm flex items-center justify-center shrink-0">
                    {previewUrl ? (
                      <img src={previewUrl} alt={item.title} className="w-full h-full object-contain" />
                    ) : (
                      <div className="animate-pulse w-full h-full bg-stone-200 rounded-lg" />
                    )}
                  </div>

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
