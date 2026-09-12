import React from 'react';
import { X, Download, ExternalLink, FileText, Maximize2 } from 'lucide-react';
import { UploadedPdf } from '../types';

interface Props {
  pdf: UploadedPdf | null;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<Props> = ({ pdf, onClose }) => {
  if (!pdf) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs">
      <div 
        className="bg-[#2a241e] rounded-3xl border border-[#4d3d2e] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="p-4 bg-[#1f1a15] border-b border-[#3d3023] flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading-cinzel font-bold text-sm sm:text-base text-[#f5ebe1] truncate max-w-[240px] sm:max-w-md">
                {pdf.title || pdf.originalName}
              </h3>
              <p className="text-[11px] text-[#b49e89]">
                Sekcja: {pdf.sectionId} {pdf.dateKey ? `• Dzień: ${pdf.dateKey}` : ''} • Rozmiar: {Math.round(pdf.size / 1024)} KB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={pdf.url}
              download={pdf.originalName}
              className="p-2 rounded-xl bg-[#382d22] hover:bg-[#4d3d2e] text-[#e6d8c8] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Pobierz plik PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Pobierz</span>
            </a>

            <a
              href={pdf.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-[#382d22] hover:bg-[#4d3d2e] text-[#e6d8c8] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Otwórz w nowej karcie"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Nowe okno</span>
            </a>

            <button
              onClick={onClose}
              id="btn-close-pdf-modal"
              className="p-2 rounded-xl text-[#b49e89] hover:bg-[#382d22] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Frame / Object */}
        <div className="flex-1 bg-[#1a1613] p-2 overflow-hidden flex flex-col">
          <iframe
            src={`${pdf.url}#toolbar=1&navpanes=1`}
            title={pdf.title || pdf.originalName}
            className="w-full h-full rounded-2xl border border-[#3d3023] bg-white"
          />
        </div>
      </div>
    </div>
  );
};
