import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  List, 
  ListOrdered, 
  Image as ImageIcon, 
  QrCode, 
  Code, 
  Undo, 
  Redo, 
  Subscript, 
  Superscript, 
  Highlighter, 
  Palette, 
  Type, 
  Quote, 
  Minus, 
  Table, 
  SlidersHorizontal, 
  Sparkles, 
  Check, 
  Maximize2, 
  Minimize2,
  Heading1,
  Heading2,
  Heading3,
  RemoveFormatting
} from 'lucide-react';
import { QrCodeItem } from '../types';
import { generateQrWysiwygHtml } from '../utils/qrCodeService';
import { QrCodeModal } from './QrCodeModal';

interface WysiwygEditorProps {
  initialValue: string;
  onChange: (htmlContent: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  title?: string;
}

export const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
  initialValue,
  onChange,
  placeholder = 'Wpisz treść...',
  minHeight = '280px',
  className = '',
  title
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'simple' | 'advanced' | 'html'>('simple');
  const [htmlCode, setHtmlCode] = useState(initialValue);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Styling state pickers
  const [textColor, setTextColor] = useState('#2c2219');
  const [highlightColor, setHighlightColor] = useState('#fef08a');
  const [fontSize, setFontSize] = useState('16px');
  const [fontFamily, setFontFamily] = useState('Georgia');
  const [lineHeight, setLineHeight] = useState('1.6');

  // Sync initial content once or on external entry/section change (only when editor is NOT actively focused)
  useEffect(() => {
    setHtmlCode(initialValue || '');
    if (editorRef.current && mode !== 'html' && document.activeElement !== editorRef.current) {
      if (editorRef.current.innerHTML !== initialValue) {
        editorRef.current.innerHTML = initialValue || '';
      }
    }
  }, [initialValue]);

  // Keep editorRef innerHTML in sync when switching mode from 'html' to visual mode
  useEffect(() => {
    if (mode !== 'html' && editorRef.current && document.activeElement !== editorRef.current) {
      if (editorRef.current.innerHTML !== htmlCode) {
        editorRef.current.innerHTML = htmlCode || '';
      }
    }
  }, [mode]);

  const switchMode = (newMode: 'simple' | 'advanced' | 'html') => {
    if (mode !== 'html' && editorRef.current) {
      const currentContent = editorRef.current.innerHTML;
      setHtmlCode(currentContent);
      onChange(currentContent);
    }
    setMode(newMode);
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    const content = editorRef.current.innerHTML;
    setHtmlCode(content);
    onChange(content);
  };

  const handleHtmlCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setHtmlCode(newCode);
    onChange(newCode);
    if (editorRef.current) {
      editorRef.current.innerHTML = newCode;
    }
  };

  // Execute standard formatting command
  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    handleInput();
  };

  // Insert custom HTML node at current cursor position
  const insertHtmlAtCursor = (html: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const el = document.createElement('div');
      el.innerHTML = html;
      const frag = document.createDocumentFragment();
      let node: ChildNode | null;
      let lastNode: ChildNode | null = null;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);
      if (lastNode) {
        range.setStartAfter(lastNode);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } else {
      if (editorRef.current) {
        editorRef.current.innerHTML += html;
      }
    }
    handleInput();
  };

  // Insert Image via URL or local file upload
  const handleInsertImage = () => {
    const url = prompt('Wklej adres URL ilustracji lub wybierz plik w administratorze:', 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800&auto=format&fit=crop&q=80');
    if (!url) return;
    const caption = prompt('Podpis pod ilustracją (opcjonalnie):', '');
    const imgHtml = `
      <figure style="margin: 20px auto; text-align: center; max-width: 100%;">
        <img src="${url}" alt="${caption || 'Ilustracja'}" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 0 auto; display: block;" />
        ${caption ? `<figcaption style="font-size: 12px; color: #6b7280; font-style: italic; margin-top: 6px;">${caption}</figcaption>` : ''}
      </figure>
      <p><br/></p>
    `;
    insertHtmlAtCursor(imgHtml);
  };

  // Insert Table
  const handleInsertTable = () => {
    const rows = parseInt(prompt('Liczba wierszy:', '3') || '3', 10);
    const cols = parseInt(prompt('Liczba kolumn:', '3') || '3', 10);
    if (isNaN(rows) || isNaN(cols) || rows < 1 || cols < 1) return;

    let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #d4b996;">';
    for (let r = 0; r < rows; r++) {
      tableHtml += '<tr>';
      for (let c = 0; c < cols; c++) {
        if (r === 0) {
          tableHtml += `<th style="border: 1px solid #d4b996; padding: 8px; background-color: #f5ede3; font-weight: bold; text-align: left;">Nagłówek ${c + 1}</th>`;
        } else {
          tableHtml += `<td style="border: 1px solid #e7ddd1; padding: 8px;">Komórka ${r},${c + 1}</td>`;
        }
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</table><p><br/></p>';
    insertHtmlAtCursor(tableHtml);
  };

  // Insert Styled Quote / Callout box
  const handleInsertCallout = (type: 'quote' | 'prayer' | 'bible') => {
    if (type === 'quote') {
      const quoteHtml = `
        <blockquote style="border-left: 4px solid #b45309; padding: 12px 18px; margin: 16px 0; background-color: #fdfaf6; font-style: italic; font-family: 'Newsreader', Georgia, serif; font-size: 17px; color: #423120; border-radius: 0 12px 12px 0;">
          „Wpisz tutaj treść cytatu lub aforyzmu...”
        </blockquote>
        <p><br/></p>
      `;
      insertHtmlAtCursor(quoteHtml);
    } else if (type === 'prayer') {
      const prayerHtml = `
        <div style="background: linear-gradient(135deg, rgba(180,83,9,0.08), rgba(217,119,6,0.03)); border: 1px solid rgba(180,83,9,0.3); border-radius: 16px; padding: 16px 20px; margin: 16px 0;">
          <div style="font-family: 'Cinzel', serif; font-weight: bold; color: #92400e; font-size: 14px; text-transform: uppercase; margin-bottom: 6px;">✝ Modlitwa Serdeczna</div>
          <div style="font-style: italic; font-size: 15px; color: #292524; line-height: 1.6;">Panie, otwórz moje oczy na Twoje łaski w tym dniu...</div>
        </div>
        <p><br/></p>
      `;
      insertHtmlAtCursor(prayerHtml);
    } else {
      const bibleHtml = `
        <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 14px; padding: 14px 18px; margin: 16px 0; color: #14532d;">
          <div style="font-weight: bold; font-size: 13px; margin-bottom: 4px;">📖 Słowo Boże (Pismo Święte)</div>
          <div style="font-family: 'Newsreader', serif; font-size: 16px; line-height: 1.6;">„Bądź mężny i mocny, nie bój się i nie lękaj, gdyż Pan, Bóg twój, będzie z tobą wszędzie, dokądkolwiek pójdziesz.” (Joz 1, 9)</div>
        </div>
        <p><br/></p>
      `;
      insertHtmlAtCursor(bibleHtml);
    }
  };

  // Handle QR code selected from database modal
  const handleSelectQrForWysiwyg = async (qrItem: QrCodeItem) => {
    setIsQrModalOpen(false);
    const cardHtml = await generateQrWysiwygHtml(qrItem);
    insertHtmlAtCursor(cardHtml);
  };

  // Change font family
  const handleFontFamilyChange = (font: string) => {
    setFontFamily(font);
    execCmd('fontName', font);
  };

  // Change font size
  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    // Wrap selection in span with font-size style
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const span = document.createElement('span');
      span.style.fontSize = size;
      const range = sel.getRangeAt(0);
      span.appendChild(range.extractContents());
      range.insertNode(span);
      handleInput();
    }
  };

  return (
    <div className={`rounded-2xl border border-stone-300 dark:border-[#1e293b] bg-white dark:bg-[#0c121e] shadow-xs flex flex-col transition-all ${isFullscreen ? 'fixed inset-0 z-50 rounded-none p-4' : ''} ${className}`}>
      
      {/* Editor Header: Title, Mode Tabs (Prosta / Zaawansowana / HTML), Fullscreen */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-stone-100/80 dark:bg-[#111827] border-b border-stone-200 dark:border-[#1e293b] rounded-t-2xl">
        <div className="flex items-center gap-2">
          {title && (
            <span className="text-xs font-bold text-[#3d2c1d] dark:text-[#f8fafc] mr-2">
              {title}
            </span>
          )}
          
          {/* Mode Tabs */}
          <div className="flex items-center bg-stone-200/80 dark:bg-[#1f293d] p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => switchMode('simple')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                mode === 'simple'
                  ? 'bg-white dark:bg-[#0c121e] text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Prosta edycja
            </button>
            <button
              type="button"
              onClick={() => switchMode('advanced')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                mode === 'advanced'
                  ? 'bg-white dark:bg-[#0c121e] text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Zaawansowana edycja</span>
            </button>
            <button
              type="button"
              onClick={() => switchMode('html')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                mode === 'html'
                  ? 'bg-white dark:bg-[#0c121e] text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white'
              }`}
              title="Edycja surowego kodu HTML"
            >
              <Code className="w-3.5 h-3.5" />
              <span>HTML</span>
            </button>
          </div>
        </div>

        {/* Right side utility buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-amber-600/15 hover:bg-amber-600/25 text-amber-900 dark:text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Wstaw kod QR z bazy kodów lub utwórz nowy"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Kody QR</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title={isFullscreen ? 'Zmniejsz' : 'Pełny ekran edytora'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 1. SIMPLE TOOLBAR (Prosta edycja) */}
      {mode !== 'html' && (
        <div className="p-2 bg-stone-50 dark:bg-[#0f172a] border-b border-stone-200 dark:border-[#1e293b] flex flex-wrap items-center gap-1 text-xs">
          {/* Undo / Redo */}
          <button
            type="button"
            onClick={() => execCmd('undo')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-pointer"
            title="Cofnij (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('redo')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-pointer"
            title="Ponów (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-stone-300 dark:bg-stone-700 mx-1" />

          {/* Bold, Italic, Underline, Strikethrough */}
          <button
            type="button"
            onClick={() => execCmd('bold')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 font-bold text-stone-800 dark:text-stone-200 cursor-pointer"
            title="Pogrubienie (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('italic')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 italic text-stone-800 dark:text-stone-200 cursor-pointer"
            title="Kursywa (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('underline')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 underline text-stone-800 dark:text-stone-200 cursor-pointer"
            title="Podkreślenie (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('strikeThrough')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 line-through text-stone-800 dark:text-stone-200 cursor-pointer"
            title="Przekreślenie"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-stone-300 dark:bg-stone-700 mx-1" />

          {/* Alignment: Left, Center, Right, Full Justify */}
          <button
            type="button"
            onClick={() => execCmd('justifyLeft')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-pointer"
            title="Justowanie do lewej"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('justifyCenter')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-pointer"
            title="Wyśrodkowanie"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('justifyRight')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-pointer"
            title="Justowanie do prawej"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('justifyFull')}
            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold cursor-pointer"
            title="Justowanie do obu stron (Pełne wyrównanie tekstu)"
          >
            <AlignJustify className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-stone-300 dark:bg-stone-700 mx-1" />

          {/* Quick Heading formatting */}
          <button
            type="button"
            onClick={() => execCmd('formatBlock', '<h1>')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 font-bold text-xs cursor-pointer"
            title="Nagłówek H1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => execCmd('formatBlock', '<h2>')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 font-bold text-xs cursor-pointer"
            title="Nagłówek H2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => execCmd('formatBlock', '<p>')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 font-medium text-xs cursor-pointer"
            title="Akapit zwykły"
          >
            P
          </button>

          <div className="h-5 w-px bg-stone-300 dark:bg-stone-700 mx-1" />

          {/* Lists */}
          <button
            type="button"
            onClick={() => execCmd('insertUnorderedList')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-pointer"
            title="Lista punktowana"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('insertOrderedList')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-pointer"
            title="Lista numerowana"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-stone-300 dark:bg-stone-700 mx-1" />

          {/* Insert Illustration & QR Code */}
          <button
            type="button"
            onClick={handleInsertImage}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-amber-700 dark:text-amber-400 flex items-center gap-1 font-bold cursor-pointer"
            title="Wstaw ilustrację"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="hidden md:inline">Ilustracja</span>
          </button>

          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="p-1.5 rounded-lg bg-amber-600/10 hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 flex items-center gap-1 font-bold cursor-pointer"
            title="Wstaw Kod QR z bazy"
          >
            <QrCode className="w-4 h-4 text-amber-600" />
            <span className="hidden md:inline">Kod QR</span>
          </button>

          {/* Clear formatting */}
          <button
            type="button"
            onClick={() => execCmd('removeFormat')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 cursor-pointer ml-auto"
            title="Wyczyść formatowanie"
          >
            <RemoveFormatting className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. ADVANCED TOOLBAR (Zaawansowana edycja) */}
      {mode === 'advanced' && (
        <div className="p-2 bg-stone-100 dark:bg-[#141e30] border-b border-stone-200 dark:border-[#1e293b] flex flex-wrap items-center gap-2 text-xs">
          
          {/* Font Family Selector */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold opacity-75">Krój:</span>
            <select
              value={fontFamily}
              onChange={(e) => handleFontFamilyChange(e.target.value)}
              className="px-2 py-1 rounded-lg bg-white dark:bg-[#0c121e] border border-stone-300 dark:border-stone-700 text-xs font-medium cursor-pointer"
            >
              <option value="Georgia, serif">Georgia (Szeryfowa)</option>
              <option value="'Newsreader', Georgia, serif">Newsreader (Dziełowa)</option>
              <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta (Modern)</option>
              <option value="'Cinzel', Georgia, serif">Cinzel (Tytularna)</option>
              <option value="Courier New, monospace">Maszynowa (Monospace)</option>
            </select>
          </div>

          {/* Font Size Selector */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold opacity-75">Rozmiar:</span>
            <select
              value={fontSize}
              onChange={(e) => handleFontSizeChange(e.target.value)}
              className="px-2 py-1 rounded-lg bg-white dark:bg-[#0c121e] border border-stone-300 dark:border-stone-700 text-xs font-medium cursor-pointer"
            >
              <option value="12px">12px (Drobny)</option>
              <option value="14px">14px (Kompaktowy)</option>
              <option value="16px">16px (Standardowy)</option>
              <option value="18px">18px (Średni)</option>
              <option value="20px">20px (Większy)</option>
              <option value="24px">24px (Podtytuł H3)</option>
              <option value="28px">28px (Nagłówek H2)</option>
              <option value="36px">36px (Tytuł Główny H1)</option>
            </select>
          </div>

          {/* Text Color Picker */}
          <div className="flex items-center gap-1">
            <Palette className="w-3.5 h-3.5 text-amber-600" />
            <input
              type="color"
              value={textColor}
              onChange={(e) => {
                setTextColor(e.target.value);
                execCmd('foreColor', e.target.value);
              }}
              title="Kolor czcionki"
              className="w-6 h-6 rounded cursor-pointer border-0 p-0"
            />
          </div>

          {/* Background / Highlight Picker */}
          <div className="flex items-center gap-1">
            <Highlighter className="w-3.5 h-3.5 text-yellow-600" />
            <input
              type="color"
              value={highlightColor}
              onChange={(e) => {
                setHighlightColor(e.target.value);
                execCmd('hiliteColor', e.target.value);
              }}
              title="Zakreślacz tła"
              className="w-6 h-6 rounded cursor-pointer border-0 p-0"
            />
          </div>

          <div className="h-5 w-px bg-stone-300 dark:bg-stone-700" />

          {/* Subscript / Superscript */}
          <button
            type="button"
            onClick={() => execCmd('subscript')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-pointer"
            title="Indeks dolny (x₂)"
          >
            <Subscript className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('superscript')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-pointer"
            title="Indeks górny (x²)"
          >
            <Superscript className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-stone-300 dark:bg-stone-700" />

          {/* Insert Quote & Callout components */}
          <button
            type="button"
            onClick={() => handleInsertCallout('quote')}
            className="px-2 py-1 rounded-lg bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 text-stone-800 dark:text-stone-200 flex items-center gap-1 font-medium cursor-pointer"
            title="Wstaw blok cytatu"
          >
            <Quote className="w-3.5 h-3.5" />
            <span>Cytat</span>
          </button>

          <button
            type="button"
            onClick={() => handleInsertCallout('prayer')}
            className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 flex items-center gap-1 font-bold cursor-pointer"
            title="Wstaw ramkę modlitewną"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modlitwa</span>
          </button>

          <button
            type="button"
            onClick={handleInsertTable}
            className="px-2 py-1 rounded-lg bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 text-stone-800 dark:text-stone-200 flex items-center gap-1 font-medium cursor-pointer"
            title="Wstaw tabelę"
          >
            <Table className="w-3.5 h-3.5" />
            <span>Tabela</span>
          </button>

          <button
            type="button"
            onClick={() => execCmd('insertHorizontalRule')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-pointer"
            title="Pozioma linia oddzielająca (HR)"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editor Body: Visual contentEditable vs Raw HTML textarea */}
      <div className="flex-1 relative">
        {mode === 'html' ? (
          <textarea
            value={htmlCode}
            onChange={handleHtmlCodeChange}
            className="w-full p-4 font-mono text-xs bg-[#0f172a] text-[#38bdf8] focus:outline-none resize-y min-h-[280px]"
            style={{ minHeight }}
            placeholder="Wklej lub edytuj czysty kod HTML..."
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            className="p-4 sm:p-6 focus:outline-none prose dark:prose-invert max-w-none text-left overflow-y-auto"
            style={{ minHeight }}
            data-placeholder={placeholder}
          />
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2 border-t border-stone-200 dark:border-[#1e293b] bg-stone-50/50 dark:bg-[#0c121e] flex items-center justify-between text-[11px] text-stone-500 rounded-b-2xl">
        <span>Tryb: {mode === 'simple' ? 'Prosta edycja' : mode === 'advanced' ? 'Zaawansowana edycja' : 'Kod źródłowy HTML'}</span>
        <span className="opacity-75">Obsługuje justowanie do obu stron, kody QR i ilustracje</span>
      </div>

      {/* QR Code Selection Modal */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onSelectQrForWysiwyg={handleSelectQrForWysiwyg}
      />
    </div>
  );
};
