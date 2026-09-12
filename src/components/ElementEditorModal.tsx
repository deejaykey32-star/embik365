import React, { useState } from 'react';
import { X, Save, Check, Sparkles, Edit3 } from 'lucide-react';
import { WysiwygEditor } from './WysiwygEditor';

interface ElementEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  elementLabel: string;
  initialContent: string;
  onSave: (newContent: string) => Promise<void> | void;
}

export const ElementEditorModal: React.FC<ElementEditorModalProps> = ({
  isOpen,
  onClose,
  title,
  elementLabel,
  initialContent,
  onSave
}) => {
  if (!isOpen) return null;

  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(content);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to save element content:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#0c121e] rounded-3xl p-5 sm:p-7 shadow-2xl border border-amber-500/30 my-auto max-h-[95vh] flex flex-col text-[#2c2219] dark:text-[#f1f5f9]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-heading-cinzel font-bold">
                Edycja Elementu WYSIWYG: {elementLabel}
              </h3>
              <p className="text-xs text-[#786756] dark:text-[#94a3b8]">
                {title} • Tryb administratora (Dominik Kuta)
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

        {/* Editor Body */}
        <div className="my-4 flex-1 overflow-y-auto">
          <WysiwygEditor
            initialValue={content}
            onChange={setContent}
            placeholder="Wpisz treść elementu..."
            minHeight="340px"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-black/10 dark:border-white/10">
          <span className="text-xs text-stone-500">
            Dostępne justowanie do obu stron, kody QR z bazy, wielkości i style czcionek
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Anuluj
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Zapisano!</span>
                </>
              ) : isSaving ? (
                <span>Zapisywanie...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Zapisz zmiany</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
