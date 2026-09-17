import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RosaryVariant, AppTheme } from '../types';
import { getRosaryModel, RosaryBeadItem, RosaryModelDefinition } from '../data/rosaryData';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Eye, 
  EyeOff, 
  Sparkles, 
  BookOpen, 
  Layers, 
  Info,
  CheckCircle2,
  Volume2,
  VolumeX
} from 'lucide-react';

import { RhzDayEntry } from '../data/rhz365Data';

interface DigitalRosaryProps {
  mysteryTitle?: string;
  intention?: string;
  theme?: AppTheme;
  defaultVariant?: RosaryVariant;
  rhzEntry?: RhzDayEntry;
  onBeadChange?: (bead: RosaryBeadItem) => void;
  className?: string;
}

export const DigitalRosary: React.FC<DigitalRosaryProps> = ({
  mysteryTitle,
  intention,
  theme = 'light',
  defaultVariant = 'full_50_rgba',
  rhzEntry,
  onBeadChange,
  className = ''
}) => {
  // 1. Variant selection state (stored in localStorage for visitor preference)
  const [activeVariant, setActiveVariant] = useState<RosaryVariant>(() => {
    try {
      const saved = localStorage.getItem('rhz365_rosary_variant') as RosaryVariant;
      if (saved && [
        'full_50_rgba', 'full_50_cmyk', 
        'line_13_rgba', 'line_13_cmyk', 
        'circle_13_rgba', 'circle_13_cmyk'
      ].includes(saved)) {
        return saved;
      }
    } catch {}
    return defaultVariant;
  });

  const handleSelectVariant = (variant: RosaryVariant) => {
    setActiveVariant(variant);
    try {
      localStorage.setItem('rhz365_rosary_variant', variant);
    } catch {}
    setActiveStep(0); // reset to cross when switching models
  };

  // 2. Active step tracking
  const [activeStep, setActiveStep] = useState<number>(0);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [autoPray, setAutoPray] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 3. Compute model for current variant
  const model: RosaryModelDefinition = useMemo(() => {
    return getRosaryModel(activeVariant, mysteryTitle || rhzEntry?.stageTitle, rhzEntry);
  }, [activeVariant, mysteryTitle, rhzEntry]);

  const activeBead: RosaryBeadItem = model.beads[activeStep] || model.beads[0];

  // Notify parent on bead change
  useEffect(() => {
    if (onBeadChange && activeBead) {
      onBeadChange(activeBead);
    }
  }, [activeStep, activeBead, onBeadChange]);

  // Handle keyboard navigation (Left / Right arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStep, model.beads.length]);

  const handleNext = () => {
    setActiveStep((curr) => (curr + 1 < model.beads.length ? curr + 1 : 0));
    playChime();
  };

  const handlePrev = () => {
    setActiveStep((curr) => (curr > 0 ? curr - 1 : model.beads.length - 1));
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  // Subtle web audio chime for bead advance
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, ctx.currentTime); // 528 Hz Love/Meditation frequency
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch {}
  };

  const variantOptions: { id: RosaryVariant; label: string; tag: string; iconDesc: string }[] = [
    { id: 'full_50_rgba', label: 'Pełny 50+6 (RGBA)', tag: '6 dużych + 50 małych', iconDesc: '5 dziesiątek RGBA' },
    { id: 'full_50_cmyk', label: 'Pełny 50+6 (CMYK)', tag: '6 dużych + 50 małych', iconDesc: '5 dziesiątek CMYK' },
    { id: 'line_13_rgba', label: 'Linia 2+13 (RGBA)', tag: '2 duże + 13 małych', iconDesc: 'Układ pionowy RGBA' },
    { id: 'line_13_cmyk', label: 'Linia 2+13 (CMYK)', tag: '2 duże + 13 małych', iconDesc: 'Układ pionowy CMYK' },
    { id: 'circle_13_rgba', label: 'Okrąg 2+13 (RGBA)', tag: '2 duże + 13 małych', iconDesc: 'Dziesiątek w okręgu RGBA' },
    { id: 'circle_13_cmyk', label: 'Okrąg 2+13 (CMYK)', tag: '2 duże + 13 małych', iconDesc: 'Dziesiątek w okręgu CMYK' }
  ];

  return (
    <div 
      ref={containerRef}
      className={`rounded-3xl border transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-[#080d18] border-[#1e293b] text-[#e2e8f0]'
          : 'bg-[#fcfbf9] border-[#e7ddd1] text-[#2c2219]'
      } ${isFullscreen ? 'fixed inset-0 z-50 rounded-none overflow-y-auto p-4 sm:p-8' : 'p-4 sm:p-6'} ${className}`}
    >
      {/* 1. Header with Model Title, Variant Selector, and Controls */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-amber-500/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                Cyfrowy Różaniec RHZ365
              </span>
              <span className="text-xs font-semibold opacity-70">
                {model.colorModel === 'RGBA' ? 'Spektrum RGBA (Światło)' : 'Spektrum CMYK (Pigment)'}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-heading-cinzel font-bold mt-1 text-[#423120] dark:text-[#f8fafc]">
              {model.title}
            </h3>
            <p className="text-xs text-[#786756] dark:text-[#94a3b8] font-serif-book">
              {model.description}
            </p>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                showLabels
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-900 dark:text-amber-300'
                  : 'bg-black/5 dark:bg-white/5 border-transparent opacity-70 hover:opacity-100'
              }`}
              title="Pokaż / Ukryj podpisy paciorków"
            >
              {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="hidden md:inline">{showLabels ? 'Etykiety' : 'Ukryte'}</span>
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-900 dark:text-amber-300'
                  : 'bg-black/5 dark:bg-white/5 border-transparent opacity-70 hover:opacity-100'
              }`}
              title={soundEnabled ? 'Dźwięk dzwonka aktywny' : 'Włącz dźwięk dzwonka'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={handleReset}
              className="p-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium transition-colors cursor-pointer"
              title="Powrót do Krzyżyka"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium transition-colors cursor-pointer"
              title={isFullscreen ? 'Zmniejsz widok' : 'Pełny ekran różańca'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 2. Six Variant Choice Buttons (As requested by user: 1 to 6) */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider block mb-2 opacity-80 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Wybierz preferowaną formę wizualizacji różańca (6 modeli):</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {variantOptions.map((opt, idx) => {
              const isSelected = activeVariant === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectVariant(opt.id)}
                  className={`p-2.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-600/20 dark:bg-amber-500/25 border-amber-600 dark:border-amber-400 text-amber-950 dark:text-white shadow-sm ring-1 ring-amber-500/50 scale-101 font-semibold'
                      : 'bg-white/80 dark:bg-[#111a2e] border-[#dac9b7] dark:border-[#1e2d48] hover:bg-amber-50/50 dark:hover:bg-[#17233d] opacity-85 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isSelected
                        ? 'bg-amber-600 text-white dark:bg-amber-400 dark:text-black'
                        : 'bg-black/10 dark:bg-white/10 text-stone-700 dark:text-stone-300'
                    }`}>
                      {idx + 1}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                  </div>
                  <div>
                    <div className="text-xs leading-tight font-bold truncate">
                      {opt.label}
                    </div>
                    <div className="text-[10px] opacity-70 mt-0.5 truncate">
                      {opt.tag}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Main Interactive Canvas & Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SVG Visualization Area */}
        <div className={`lg:col-span-7 flex flex-col items-center justify-center rounded-3xl p-3 sm:p-5 border transition-colors ${
          theme === 'dark' 
            ? 'bg-[#050810] border-[#152033] shadow-inner shadow-black/80' 
            : 'bg-[#f4efe8] border-[#e2d5c5] shadow-inner shadow-stone-200'
        }`}>
          {/* Subtitle / Beads Summary */}
          <div className="w-full flex items-center justify-between text-xs px-2 mb-2 font-medium opacity-75">
            <span>{model.beadsCountLabel}</span>
            <span>Krok: {activeStep + 1} / {model.beads.length}</span>
          </div>

          <div className="w-full max-w-full relative flex items-center justify-center overflow-hidden select-none py-2">
            <svg
              viewBox={model.viewBox}
              className="max-h-[640px] w-auto drop-shadow-md transition-all duration-300"
              style={{ maxWidth: '100%', height: 'auto' }}
            >
              {/* SVG Definitions for 3D Realistic Spherical Beads & Shaders */}
              <defs>
                {/* 1. Transparent Glass Bead Shader */}
                <radialGradient id="glassSphereGrad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                  <stop offset="40%" stopColor="#c7dcf0" stopOpacity="0.35" />
                  <stop offset="85%" stopColor="#70a8d6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#1e3a5f" stopOpacity="0.95" />
                </radialGradient>

                <radialGradient id="glassSphereGradLight" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                  <stop offset="45%" stopColor="#e2e8f0" stopOpacity="0.4" />
                  <stop offset="85%" stopColor="#94a3b8" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#475569" stopOpacity="0.85" />
                </radialGradient>

                {/* 2. Red Bead (Rubin) */}
                <radialGradient id="redBeadGrad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#fca5a5" />
                  <stop offset="25%" stopColor="#ef4444" />
                  <stop offset="70%" stopColor="#b91c1c" />
                  <stop offset="100%" stopColor="#450a0a" />
                </radialGradient>

                {/* 3. Green Bead (Szmaragd) */}
                <radialGradient id="greenBeadGrad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#86efac" />
                  <stop offset="25%" stopColor="#22c55e" />
                  <stop offset="70%" stopColor="#15803d" />
                  <stop offset="100%" stopColor="#052e16" />
                </radialGradient>

                {/* 4. Blue Bead (Szafir) */}
                <radialGradient id="blueBeadGrad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="25%" stopColor="#3b82f6" />
                  <stop offset="70%" stopColor="#1d4ed8" />
                  <stop offset="100%" stopColor="#0f172a" />
                </radialGradient>

                {/* 5. White Bead (Perła / Paper) */}
                <radialGradient id="whiteBeadGrad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="45%" stopColor="#f8fafc" />
                  <stop offset="80%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#64748b" />
                </radialGradient>

                {/* 6. Black Bead (Onyks / Key) */}
                <radialGradient id="blackBeadGrad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#9ca3af" />
                  <stop offset="20%" stopColor="#374151" />
                  <stop offset="65%" stopColor="#18181b" />
                  <stop offset="100%" stopColor="#000000" />
                </radialGradient>

                {/* 7. Cyan Bead */}
                <radialGradient id="cyanBeadGrad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#a5f3fc" />
                  <stop offset="25%" stopColor="#06b6d4" />
                  <stop offset="70%" stopColor="#0891b2" />
                  <stop offset="100%" stopColor="#164e63" />
                </radialGradient>

                {/* 8. Magenta Bead */}
                <radialGradient id="magentaBeadGrad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#fbcfe8" />
                  <stop offset="25%" stopColor="#ec4899" />
                  <stop offset="70%" stopColor="#be185d" />
                  <stop offset="100%" stopColor="#500724" />
                </radialGradient>

                {/* 9. Yellow Bead */}
                <radialGradient id="yellowBeadGrad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="25%" stopColor="#eab308" />
                  <stop offset="70%" stopColor="#ca8a04" />
                  <stop offset="100%" stopColor="#422006" />
                </radialGradient>

                {/* Golden Chalice Gradient */}
                <linearGradient id="chaliceGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="35%" stopColor="#f59e0b" />
                  <stop offset="70%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#78350f" />
                </linearGradient>

                {/* Glow Filter */}
                <filter id="activeGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Connecting Chains / Lines */}
              <g opacity={theme === 'dark' ? 0.45 : 0.6}>
                {model.beads.map((bead, i) => {
                  if (i === 0) return null;
                  const prev = model.beads[i - 1];
                  // If line or circle, connect adjacent beads
                  return (
                    <line
                      key={`chain_${prev.id}_${bead.id}`}
                      x1={prev.x}
                      y1={prev.y}
                      x2={bead.x}
                      y2={bead.y}
                      stroke={theme === 'dark' ? '#94a3b8' : '#786656'}
                      strokeWidth="2.5"
                      strokeDasharray="2,3"
                    />
                  );
                })}

                {/* For full rosary circle: connect loop back to chalice */}
                {model.layoutType === 'circle_full' && (
                  <>
                    <line
                      x1={model.beads[6]?.x || 300}
                      y1={model.beads[6]?.y || 495}
                      x2={model.beads[7]?.x || 280}
                      y2={model.beads[7]?.y || 480}
                      stroke={theme === 'dark' ? '#94a3b8' : '#786656'}
                      strokeWidth="2"
                    />
                    <line
                      x1={model.beads[model.beads.length - 1]?.x}
                      y1={model.beads[model.beads.length - 1]?.y}
                      x2={model.beads[6]?.x || 300}
                      y2={model.beads[6]?.y || 495}
                      stroke={theme === 'dark' ? '#94a3b8' : '#786656'}
                      strokeWidth="2"
                    />
                  </>
                )}

                {/* For circle decade: connect loop ends back to chalice */}
                {model.layoutType === 'circle_decade' && (
                  <>
                    <line
                      x1={model.beads[6]?.x}
                      y1={model.beads[6]?.y}
                      x2={model.beads[7]?.x}
                      y2={model.beads[7]?.y}
                      stroke={theme === 'dark' ? '#94a3b8' : '#786656'}
                      strokeWidth="2"
                      strokeDasharray="2,3"
                    />
                    <line
                      x1={model.beads[model.beads.length - 1]?.x}
                      y1={model.beads[model.beads.length - 1]?.y}
                      x2={model.beads[6]?.x}
                      y2={model.beads[6]?.y}
                      stroke={theme === 'dark' ? '#94a3b8' : '#786656'}
                      strokeWidth="2"
                      strokeDasharray="2,3"
                    />
                  </>
                )}
              </g>

              {/* Render Every Bead, Chalice, Cross */}
              {model.beads.map((bead, index) => {
                const isActive = index === activeStep;
                const isPassed = index < activeStep;

                // Determine Fill based on colorType
                let fillUrl = 'url(#glassSphereGrad)';
                if (bead.colorType === 'transparent') {
                  fillUrl = theme === 'dark' ? 'url(#glassSphereGrad)' : 'url(#glassSphereGradLight)';
                } else if (bead.colorType === 'red') fillUrl = 'url(#redBeadGrad)';
                else if (bead.colorType === 'green') fillUrl = 'url(#greenBeadGrad)';
                else if (bead.colorType === 'blue') fillUrl = 'url(#blueBeadGrad)';
                else if (bead.colorType === 'white') fillUrl = 'url(#whiteBeadGrad)';
                else if (bead.colorType === 'black') fillUrl = 'url(#blackBeadGrad)';
                else if (bead.colorType === 'cyan') fillUrl = 'url(#cyanBeadGrad)';
                else if (bead.colorType === 'magenta') fillUrl = 'url(#magentaBeadGrad)';
                else if (bead.colorType === 'yellow') fillUrl = 'url(#yellowBeadGrad)';

                return (
                  <g
                    key={bead.id}
                    onClick={() => setActiveStep(index)}
                    className="cursor-pointer transition-transform duration-150 hover:scale-110"
                    style={{ transformOrigin: `${bead.x}px ${bead.y}px` }}
                  >
                    {/* Active Halo Highlight */}
                    {isActive && (
                      <circle
                        cx={bead.x}
                        cy={bead.y}
                        r={bead.radius + 7}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        strokeDasharray="4,2"
                        className="animate-spin-slow"
                        filter="url(#activeGlow)"
                      />
                    )}

                    {/* Render Special: Cross */}
                    {bead.type === 'cross' ? (
                      <g>
                        {/* Cross Shadow */}
                        <rect
                          x={bead.x - 14}
                          y={bead.y - 22}
                          width="28"
                          height="44"
                          rx="4"
                          fill="none"
                        />
                        {/* Cross Body */}
                        {(model.colorModel === 'CMYK' || bead.label.toLowerCase().includes('biały')) ? (
                          // White Cross (Model CMYK)
                          <g>
                            {/* Halo behind cross */}
                            <circle cx={bead.x} cy={bead.y - 4} r="22" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />
                            {/* Vertical bar */}
                            <rect x={bead.x - 6} y={bead.y - 22} width="12" height="44" rx="2" fill="#ffffff" stroke="#d97706" strokeWidth="1.5" />
                            {/* Horizontal bar */}
                            <rect x={bead.x - 17} y={bead.y - 12} width="34" height="10" rx="2" fill="#ffffff" stroke="#d97706" strokeWidth="1.5" />
                            {/* Corpus silhouette */}
                            <path d={`M ${bead.x} ${bead.y - 10} L ${bead.x} ${bead.y + 10} M ${bead.x - 10} ${bead.y - 7} L ${bead.x + 10} ${bead.y - 7}`} stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
                            {/* INRI Tablet */}
                            <rect x={bead.x - 6} y={bead.y - 20} width="12" height="5" rx="1" fill="#d97706" />
                            <text x={bead.x} y={bead.y - 16} textAnchor="middle" fontSize="4" fill="#ffffff" fontWeight="bold">INRI</text>
                          </g>
                        ) : (
                          // Black Ebony Cross (Model RGBA)
                          <g>
                            {/* Halo behind cross */}
                            <circle cx={bead.x} cy={bead.y - 4} r="22" fill="none" stroke="#ca8a04" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.4" />
                            {/* Vertical bar */}
                            <rect x={bead.x - 6} y={bead.y - 22} width="12" height="44" rx="2" fill="#18181b" stroke="#ca8a04" strokeWidth="1.5" />
                            {/* Horizontal bar */}
                            <rect x={bead.x - 17} y={bead.y - 12} width="34" height="10" rx="2" fill="#18181b" stroke="#ca8a04" strokeWidth="1.5" />
                            {/* Corpus silhouette */}
                            <path d={`M ${bead.x} ${bead.y - 10} L ${bead.x} ${bead.y + 10} M ${bead.x - 10} ${bead.y - 7} L ${bead.x + 10} ${bead.y - 7}`} stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
                            {/* INRI Tablet */}
                            <rect x={bead.x - 6} y={bead.y - 20} width="12" height="5" rx="1" fill="#ca8a04" />
                            <text x={bead.x} y={bead.y - 16} textAnchor="middle" fontSize="4" fill="#18181b" fontWeight="bold">INRI</text>
                          </g>
                        )}
                      </g>
                    ) : bead.type === 'chalice' ? (
                      // Render Special: Chalice with Host (Łącznik / Trójnik)
                      <g>
                        {/* Sunburst rays */}
                        <g opacity="0.8">
                          {[0, 45, 90, 135, 180, 225, 270, 315].map((ang, aIdx) => {
                            const rad = (ang * Math.PI) / 180;
                            const x1 = bead.x + 13 * Math.cos(rad);
                            const y1 = bead.y - 8 + 13 * Math.sin(rad);
                            const x2 = bead.x + 20 * Math.cos(rad);
                            const y2 = bead.y - 8 + 20 * Math.sin(rad);
                            return (
                              <line
                                key={aIdx}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="#f59e0b"
                                strokeWidth="1.5"
                              />
                            );
                          })}
                        </g>

                        {/* Chalice Hostia (White Sacred Host with IHS or cross) */}
                        <circle cx={bead.x} cy={bead.y - 8} r="11" fill="#ffffff" stroke="#ca8a04" strokeWidth="1.5" />
                        <path d={`M ${bead.x - 5} ${bead.y - 8} L ${bead.x + 5} ${bead.y - 8} M ${bead.x} ${bead.y - 13} L ${bead.x} ${bead.y - 3}`} stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round" />
                        <text x={bead.x} y={bead.y - 4} textAnchor="middle" fontSize="5" fontWeight="bold" fill="#78350f">IHS</text>

                        {/* Golden Chalice Cup & Stem */}
                        <path
                          d={`
                            M ${bead.x - 14} ${bead.y - 3} 
                            C ${bead.x - 14} ${bead.y + 11}, ${bead.x - 5} ${bead.y + 13}, ${bead.x - 3} ${bead.y + 15}
                            L ${bead.x - 3} ${bead.y + 19}
                            C ${bead.x - 8} ${bead.y + 21}, ${bead.x - 12} ${bead.y + 24}, ${bead.x - 12} ${bead.y + 26}
                            L ${bead.x + 12} ${bead.y + 26}
                            C ${bead.x + 12} ${bead.y + 24}, ${bead.x + 8} ${bead.y + 21}, ${bead.x + 3} ${bead.y + 19}
                            L ${bead.x + 3} ${bead.y + 15}
                            C ${bead.x + 5} ${bead.y + 13}, ${bead.x + 14} ${bead.y + 11}, ${bead.x + 14} ${bead.y - 3}
                            Z
                          `}
                          fill="url(#chaliceGoldGrad)"
                          stroke="#92400e"
                          strokeWidth="1.2"
                        />
                      </g>
                    ) : (
                      // Render Spherical Bead (Large Transparent with letter, or Small Colored Bead)
                      <g>
                        {/* Drop shadow */}
                        <ellipse
                          cx={bead.x}
                          cy={bead.y + bead.radius * 0.7}
                          rx={bead.radius * 0.8}
                          ry={bead.radius * 0.3}
                          fill="#000000"
                          opacity={theme === 'dark' ? 0.5 : 0.25}
                        />

                        {/* Spherical bead body */}
                        <circle
                          cx={bead.x}
                          cy={bead.y}
                          r={bead.radius}
                          fill={fillUrl}
                          stroke={bead.colorType === 'transparent' ? (theme === 'dark' ? '#70a8d6' : '#94a3b8') : 'rgba(0,0,0,0.2)'}
                          strokeWidth={bead.colorType === 'transparent' ? 1.5 : 0.5}
                        />

                        {/* Realistic crescent highlight on top left */}
                        <ellipse
                          cx={bead.x - bead.radius * 0.32}
                          cy={bead.y - bead.radius * 0.32}
                          rx={bead.radius * 0.35}
                          ry={bead.radius * 0.22}
                          fill="#ffffff"
                          opacity="0.8"
                          transform={`rotate(-25 ${bead.x - bead.radius * 0.32} ${bead.y - bead.radius * 0.32})`}
                        />

                        {/* Secondary bounce reflection on bottom right */}
                        <ellipse
                          cx={bead.x + bead.radius * 0.3}
                          cy={bead.y + bead.radius * 0.35}
                          rx={bead.radius * 0.25}
                          ry={bead.radius * 0.12}
                          fill="#ffffff"
                          opacity={bead.colorType === 'transparent' ? 0.5 : 0.2}
                          transform={`rotate(-25 ${bead.x + bead.radius * 0.3} ${bead.y + bead.radius * 0.35})`}
                        />

                        {/* Etched Letter inside transparent beads (I, N, L, O, V, E) */}
                        {bead.letter && (
                          <text
                            x={bead.x}
                            y={bead.y + 5}
                            textAnchor="middle"
                            fontSize={bead.radius * 0.95}
                            fontFamily="Cinzel, serif"
                            fontWeight="bold"
                            fill={theme === 'dark' ? '#f8fafc' : '#1e293b'}
                            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                          >
                            {bead.letter}
                          </text>
                        )}
                      </g>
                    )}

                    {/* Optional Bead Labels (callouts like in the user's reference images) */}
                    {showLabels && (
                      <g opacity={isActive ? 1 : 0.75} className="pointer-events-none">
                        {/* For linear/side layouts */}
                        {model.layoutType === 'line' && (
                          <g>
                            {/* Dashed connector line to label */}
                            <line
                              x1={bead.x + bead.radius + 6}
                              y1={bead.y}
                              x2={bead.x + 60}
                              y2={bead.y}
                              stroke={theme === 'dark' ? '#38bdf8' : '#ca8a04'}
                              strokeWidth="1"
                              strokeDasharray="2,2"
                              opacity={isActive ? 1 : 0.5}
                            />
                            {/* Label box */}
                            <rect
                              x={bead.x + 60}
                              y={bead.y - 12}
                              width="250"
                              height="24"
                              rx="6"
                              fill={theme === 'dark' ? '#0f172a' : '#ffffff'}
                              stroke={isActive ? '#f59e0b' : theme === 'dark' ? '#334155' : '#e2e8f0'}
                              strokeWidth={isActive ? 1.5 : 1}
                              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                            />
                            {/* Badge Number */}
                            {bead.badgeNumber && (
                              <text
                                x={bead.x + 72}
                                y={bead.y + 4}
                                fontSize="9"
                                fontWeight="bold"
                                fill={isActive ? '#f59e0b' : theme === 'dark' ? '#94a3b8' : '#64748b'}
                              >
                                {bead.badgeNumber}
                              </text>
                            )}
                            {/* Label Text */}
                            <text
                              x={bead.badgeNumber ? bead.x + 105 : bead.x + 72}
                              y={bead.y + 4}
                              fontSize="9.5"
                              fontWeight={isActive ? 'bold' : 'normal'}
                              fill={theme === 'dark' ? '#f1f5f9' : '#1e293b'}
                            >
                              {bead.label}
                            </text>
                          </g>
                        )}
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Stepper controls below canvas */}
          <div className="w-full flex items-center justify-between gap-2 pt-3 border-t border-black/10 dark:border-white/10 mt-2">
            <button
              onClick={handlePrev}
              className="px-3 py-1.5 rounded-xl border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Poprzedni</span>
            </button>

            {/* Quick jump to decade or crucial points */}
            <div className="flex items-center gap-1 overflow-x-auto py-1 text-[11px]">
              <span className="font-bold opacity-75">Koralik {activeStep + 1} / {model.beads.length}</span>
            </div>

            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
            >
              <span>Następny</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Prayer & Theological Symbolism Details Panel */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Bead Details Card */}
          <div className={`p-5 rounded-3xl border transition-all ${
            theme === 'dark'
              ? 'bg-[#0f172a] border-[#223354] shadow-md'
              : 'bg-white border-[#e3d7cb] shadow-sm'
          }`}>
            <div className="flex items-center justify-between gap-2 border-b pb-3 border-amber-500/20">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-amber-500 text-white dark:text-black">
                  {activeStep + 1}
                </span>
                <div>
                  <h4 className="text-sm font-bold leading-tight">
                    {activeBead.label}
                  </h4>
                  <div className="text-[11px] opacity-70">
                    {activeBead.subLabel || 'Krok modlitewny'}
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300">
                {model.colorModel}
              </span>
            </div>

            {/* Prayer Title and Text */}
            <div className="mt-4 space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-1">
                  Modlitwa do odmówienia na tym paciorku:
                </span>
                <h5 className="text-base font-heading-cinzel font-bold text-[#3d2c1d] dark:text-[#f8fafc]">
                  {activeBead.prayerName}
                </h5>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-white/5 border border-amber-500/20 text-xs sm:text-sm font-serif-book leading-relaxed italic text-justify">
                {activeBead.prayerText}
              </div>

              {/* Dopowiedzenie po słowie Jezus */}
              {activeBead.dopowiedzenie && (
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-xs sm:text-sm shadow-xs">
                  <span className="font-bold text-amber-900 dark:text-amber-300 block text-[10px] uppercase tracking-wider mb-1 font-sans-ui">
                    Dopowiedzenie po słowie „Jezus” dla tej tajemnicy:
                  </span>
                  <p className="font-serif-book italic text-stone-900 dark:text-amber-100 text-justify">
                    „...owoc żywota Twojego Jezus, <strong className="underline decoration-amber-500 text-amber-950 dark:text-amber-300">{activeBead.dopowiedzenie}</strong> Święta Maryjo...”
                  </p>
                </div>
              )}

              {/* Mystery Context for RHZ365 if available */}
              {mysteryTitle && (
                <div className="p-3 rounded-xl bg-sky-500/10 dark:bg-sky-900/20 border border-sky-500/20 text-xs">
                  <span className="font-bold text-sky-800 dark:text-sky-300 block mb-0.5 font-sans-ui">
                    Aktualna Tajemnica Dnia:
                  </span>
                  <span className="text-sky-950 dark:text-sky-100 font-medium">
                    {mysteryTitle}
                  </span>
                  {intention && (
                    <div className="mt-1 text-[11px] text-sky-900 dark:text-sky-200">
                      <strong>Intencja: </strong>{intention}
                    </div>
                  )}
                </div>
              )}

              {/* Theological and Color Symbolism */}
              <div className="pt-2 border-t border-black/10 dark:border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-75 flex items-center gap-1 mb-1">
                  <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Symbolika Teologiczna i Kolorystyczna:</span>
                </span>
                <p className="text-xs leading-relaxed opacity-90">
                  {activeBead.colorSymbolism}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Explanation of the 6 variants & In-Love spiritual concept */}
          <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
            theme === 'dark'
              ? 'bg-[#0a0f1d] border-[#1c293e] text-[#94a3b8]'
              : 'bg-[#f7f2ea] border-[#e7ddd1] text-[#6b5847]'
          }`}>
            <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>Różaniec Historii Zbawienia "IN-LOVE"</span>
            </div>
            <p className="leading-relaxed">
              Litery na 6 dużych paciorkach tworzą słowa <strong>I-N-L-O-V-E</strong> ("W Miłości"). 
              Różaniec łączy Boży zamysł stworzenia ze światłem (model <strong>RGBA</strong> — czerwień, zieleń, błękit, biel i czerń) oraz z materią i słowem pisanym (model <strong>CMYK</strong> — cyjan, magenta, żółć, czerń i biel).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
