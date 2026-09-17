/// <reference types="vite/client" />
import React, { useState, useEffect, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Film, 
  Code as CodeIcon, 
  Box, 
  Search, 
  Maximize2, 
  Download, 
  Copy, 
  Check, 
  Play, 
  Pause, 
  RotateCw, 
  Eye, 
  Sparkles, 
  FileCode, 
  Layers, 
  Palette, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Monitor, 
  Upload, 
  FileText,
  Link2,
  QrCode,
  Package,
  Lock
} from 'lucide-react';
import { SectionId } from '../types';
import { SECTIONS } from '../data/defaultSections';
import { shortenUrlViaApi, upsertQrCode, uploadBase64ImageToServer, FILE_CLCK_MAP, sanitizeQrUrl } from '../utils/qrCodeService';
import { AiStudioPackageBuilder, stripTypeScriptTypes } from './AiStudioPackageBuilder';

// Automatically import all files from src/pliki using Vite's import.meta.glob
const plikiModules = (import.meta as any).glob('../pliki/*', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export interface PlikItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'gif' | 'html' | '3d' | 'pdf' | 'other';
  ext: string;
  filename: string;
  sectionId?: SectionId | string;
  dateKey?: string;
  dayNumber?: number;
  description?: string;
  category?: string;
  shortUrl?: string;
  isPublishedPublic?: boolean;
  uploadedAt?: string;
}

export function getItemClckRuUrl(item: PlikItem): string {
  const fileKey = item.filename || item.name || '';
  if (fileKey && FILE_CLCK_MAP[fileKey]) {
    return FILE_CLCK_MAP[fileKey];
  }
  if (item.shortUrl && item.shortUrl.startsWith('https://clck.ru/') && item.shortUrl !== 'https://clck.ru/3Vr8B8') {
    return item.shortUrl;
  }
  return sanitizeQrUrl('', fileKey || item.id, true);
}

export interface MediaLibraryViewerProps {
  initialTab?: 'grid' | 'images' | 'video' | 'html' | '3d' | 'aistudio';
  readOnly?: boolean;
}

export const MediaLibraryViewer: React.FC<MediaLibraryViewerProps> = ({ initialTab, readOnly = false }) => {
  // 1. Prepare items list from src/pliki & user uploaded materials
  const [items, setItems] = useState<PlikItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'gif' | 'video' | 'html' | '3d' | 'pdf'>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    name: '',
    description: '',
    category: 'Grafika 2D',
    sectionId: 'wnr365',
    dateKey: '',
    dayNumber: '',
    isPublishedPublic: true,
    createExternal: true,
  });

  // Active main tab in Media Viewer: 'grid' | 'images' | 'video' | 'html' | '3d' | 'aistudio'
  const [activeMediaTab, setActiveMediaTab] = useState<'grid' | 'images' | 'video' | 'html' | '3d' | 'aistudio'>(() => {
    if (initialTab) return initialTab;
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      if (hash.includes('aistudio') || hash.includes('ai-studio') || hash.includes('symulacj') || path.includes('aistudio')) {
        return 'aistudio';
      }
    }
    return 'grid';
  });

  const handleSaveNewMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file && !uploadForm.name) {
      alert('Wybierz plik z dysku lub podaj nazwę materiału!');
      return;
    }
    setIsUploading(true);
    try {
      let finalUrl = '';
      let filename = uploadForm.name || 'material';

      if (uploadForm.file) {
        filename = uploadForm.file.name;
        const formData = new FormData();
        formData.append('file', uploadForm.file);
        formData.append('pdfFile', uploadForm.file);
        formData.append('title', uploadForm.name || filename);

        try {
          const res = await fetch('/api/upload-file', {
            method: 'POST',
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            finalUrl = data.url || data.file?.url || '';
          }
        } catch (err) {
          console.warn('Upload endpoint error:', err);
        }

        if (!finalUrl || finalUrl.startsWith('blob:')) {
          const cleanFileName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
          finalUrl = `/uploads/${cleanFileName}`;
        }
      } else {
        finalUrl = `/pliki/${filename}`;
      }

      const ext = filename.split('.').pop()?.toLowerCase() || 'png';
      let type: 'image' | 'video' | 'gif' | 'html' | '3d' | 'pdf' | 'other' = 'image';
      if (ext === 'gif') type = 'gif';
      else if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) type = 'video';
      else if (['html', 'htm'].includes(ext)) type = 'html';
      else if (['glb', 'gltf', 'obj'].includes(ext)) type = '3d';
      else if (ext === 'pdf') type = 'pdf';

      let shortUrl = '';
      if (uploadForm.createExternal) {
        try {
          const absoluteUrl = finalUrl.startsWith('/')
            ? `${window.location.origin}${finalUrl}`
            : finalUrl;
          shortUrl = await shortenUrlViaApi(absoluteUrl);
          upsertQrCode({
            id: `qr_mat_${Date.now()}`,
            title: uploadForm.name || filename,
            displayLabel: `Materiały: ${uploadForm.name || filename}`,
            shortUrl,
            fullUrl: absoluteUrl,
            category: `Zasoby - ${uploadForm.sectionId}`,
            createdAt: new Date().toISOString()
          });
        } catch (err) {
          console.warn('Could not create short URL or QR code:', err);
        }
      }

      const newItem: PlikItem = {
        id: `custom_${Date.now()}`,
        name: uploadForm.name || filename,
        filename,
        url: finalUrl,
        type,
        ext,
        sectionId: uploadForm.sectionId,
        dateKey: uploadForm.dateKey || undefined,
        dayNumber: uploadForm.dayNumber ? parseInt(uploadForm.dayNumber, 10) : undefined,
        description: uploadForm.description || undefined,
        category: uploadForm.category,
        shortUrl: shortUrl || undefined,
        isPublishedPublic: uploadForm.isPublishedPublic,
        uploadedAt: new Date().toISOString()
      };

      const updatedItems = [newItem, ...items];
      setItems(updatedItems);

      const storedCustom = updatedItems.filter(i => i.id.startsWith('custom_'));
      localStorage.setItem('drogowskazy_custom_pliki', JSON.stringify(storedCustom));

      setIsUploadModalOpen(false);
      setUploadForm({
        file: null,
        name: '',
        description: '',
        category: 'Grafika 2D',
        sectionId: 'wnr365',
        dateKey: '',
        dayNumber: '',
        isPublishedPublic: true,
        createExternal: true,
      });
      alert(`Pomyślnie opublikowano i dodano materiał "${newItem.name}"!`);
    } catch (err: any) {
      alert(`Błąd tworzenia materiału: ${err.message || err}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Lightbox modal state for images
  const [selectedImage, setSelectedImage] = useState<PlikItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [bgMode, setBgMode] = useState<'light' | 'dark' | 'checker'>('dark');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Video state
  const [selectedVideo, setSelectedVideo] = useState<PlikItem | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(true);

  // HTML Live Sandbox state
  const [htmlCode, setHtmlCode] = useState<string>(`<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: rgba(255, 255, 255, 0.07);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 24px;
      padding: 32px;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      transform-style: preserve-3d;
      transition: transform 0.3s ease;
    }
    .card:hover {
      transform: translateY(-5px) rotateX(4deg) rotateY(-4deg);
    }
    h1 {
      color: #fbbf24;
      font-family: Georgia, serif;
      margin-top: 0;
      font-size: 24px;
    }
    p {
      color: #cbd5e1;
      line-height: 1.6;
      font-size: 15px;
    }
    .badge {
      display: inline-block;
      background: linear-gradient(90deg, #b45309, #d97706);
      color: white;
      padding: 6px 16px;
      border-radius: 999px;
      font-weight: bold;
      font-size: 12px;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
    .media-preview {
      width: 100%;
      max-height: 200px;
      object-fit: cover;
      border-radius: 12px;
      margin: 16px 0;
      border: 1px solid rgba(255,255,255,0.2);
    }
    button {
      background: #f59e0b;
      color: #0f172a;
      border: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    button:hover {
      background: #fbbf24;
      transform: scale(1.05);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Podgląd HTML Live • Droga365</div>
    <h1>Materiały Graficzne & Interaktywny Wynik HTML</h1>
    <p>Ten panel pozwala na żywo edytować i podglądać kod HTML/CSS z natychmiastowym renderowaniem w osadzonym oknie iframe.</p>
    <button onclick="alert('Witaj w interaktywnym podglądzie HTML Droga365!')">Kliknij tutaj</button>
  </div>
</body>
</html>`);
  
  const [activeHtmlTab, setActiveHtmlTab] = useState<'preview' | 'code' | 'split'>('split');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 3D Canvas WebGL / 2D Engine state
  const [selected3dShape, setSelected3dShape] = useState<'cube' | 'diamond' | 'sphere' | 'torus' | 'pyramid'>('cube');
  const [renderMode, setRenderMode] = useState<'solid' | 'wireframe' | 'glow' | 'points'>('solid');
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedTextureUrl, setSelectedTextureUrl] = useState<string | null>(null);
  const [objectColor, setObjectColor] = useState('#f59e0b');
  const canvas3dRef = useRef<HTMLCanvasElement>(null);
  
  // Mouse rotation for 3D viewport
  const isDragging3d = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const rotation3d = useRef({ x: 0.5, y: 0.8 });
  const zoom3d = useRef(1);

  // Populate items from import.meta.glob on mount + load stored custom materials from localStorage
  useEffect(() => {
    const list: PlikItem[] = [];
    Object.entries(plikiModules).forEach(([path, url]) => {
      const filename = path.split('/').pop() || '';
      const ext = filename.split('.').pop()?.toLowerCase() || '';
      
      let type: 'image' | 'video' | 'gif' | 'html' | '3d' | 'pdf' | 'other' = 'image';
      if (ext === 'gif') {
        type = 'gif';
      } else if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
        type = 'video';
      } else if (['html', 'htm'].includes(ext)) {
        type = 'html';
      } else if (['glb', 'gltf', 'obj'].includes(ext)) {
        type = '3d';
      } else if (ext === 'pdf') {
        type = 'pdf';
      } else if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'bmp'].includes(ext)) {
        type = 'image';
      } else {
        type = 'other';
      }

      const fileShortUrl = getItemClckRuUrl({ filename, name: filename, id: filename } as PlikItem);
      list.push({
        id: filename,
        name: filename,
        filename,
        url: `/pliki/${filename}`,
        type,
        ext,
        sectionId: 'general',
        category: type === 'video' ? 'Film Wideo MP4' : type === 'gif' ? 'Animacja GIF' : type === '3d' ? 'Model 3D / Tekstura' : type === 'html' ? 'Skrypt HTML' : 'Grafika 2D',
        shortUrl: fileShortUrl,
        isPublishedPublic: true,
        uploadedAt: new Date().toISOString()
      });
    });

    // Load user uploaded materials from localStorage
    try {
      const saved = localStorage.getItem('drogowskazy_custom_pliki');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((customItem: PlikItem) => {
            if (customItem.url && customItem.url.startsWith('blob:')) {
              const cleanName = (customItem.filename || customItem.name || 'material').replace(/[^a-zA-Z0-9._-]/g, '_');
              customItem.url = `/uploads/${cleanName}`;
            }
            if (!list.some(i => i.id === customItem.id)) {
              customItem.shortUrl = getItemClckRuUrl(customItem);
              list.unshift(customItem);
            }
          });
        }
      }
    } catch (e) {
      console.warn('Could not load custom pliki from localStorage:', e);
    }

    setItems(list);

    // Set initial video if available
    const vid = list.find(i => i.type === 'video');
    if (vid) {
      setSelectedVideo(vid);
    }
  }, []);

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>, filename: string) => {
    const target = e.currentTarget;
    const stage = parseInt(target.dataset.fallbackStage || '0', 10);
    if (stage === 0) {
      target.dataset.fallbackStage = '1';
      target.src = `/pliki/${filename}`;
    } else if (stage === 1) {
      target.dataset.fallbackStage = '2';
      target.src = `/pliki/${encodeURIComponent(filename)}`;
    } else if (stage === 2) {
      target.dataset.fallbackStage = '3';
      let alt = filename;
      if (filename.includes('jesien')) alt = filename.replace('jesien', 'jesień');
      else if (filename.includes('jesień')) alt = filename.replace('jesień', 'jesien');
      target.src = `/pliki/${alt}`;
    } else if (stage === 3) {
      target.dataset.fallbackStage = '4';
      let alt = filename;
      if (filename.includes('jesien')) alt = filename.replace('jesien', 'jesień');
      else if (filename.includes('jesień')) alt = filename.replace('jesień', 'jesien');
      target.src = `/pliki/${encodeURIComponent(alt)}`;
    }
  };

  // Update HTML Iframe preview with Babel transpile & ESM import stripping support
  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();

        let rawHtml = htmlCode || '';
        const needsTranspile = rawHtml.includes('import ') || rawHtml.includes('export ') || rawHtml.includes('React.') || rawHtml.includes('ReactDOM') || /<[A-Za-z][\s\S]*?>/.test(rawHtml);

        if (needsTranspile) {
          let inlineScripts = '';
          let bodyMarkup = rawHtml.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (match, scriptContent) => {
            if (scriptContent && scriptContent.trim()) {
              inlineScripts += '\n\n' + scriptContent.trim();
            }
            return '';
          });

          if (!inlineScripts.trim() && !bodyMarkup.includes('<div') && !bodyMarkup.includes('<p') && !bodyMarkup.includes('<h')) {
            inlineScripts = rawHtml;
            bodyMarkup = '<div id="root"></div>\n<div id="app"></div>';
          }

          const cleanedJs = stripTypeScriptTypes(inlineScripts);
          const escapedJs = JSON.stringify(cleanedJs);

          doc.write(`<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js" crossorigin="anonymous"></script>
  <script>
    window.global = window;
    window.process = { env: { NODE_ENV: 'production' } };
    window.require = function(m) { return window.React || {}; };
    if (window.React) {
      window.useState = window.React.useState;
      window.useEffect = window.React.useEffect;
      window.useRef = window.React.useRef;
      window.useCallback = window.React.useCallback;
      window.useMemo = window.React.useMemo;
    }
  </script>
</head>
<body style="margin:0;padding:16px;font-family:system-ui,sans-serif;">
  ${bodyMarkup}
  <script>
    (function() {
      try {
        var rawCode = ${escapedJs};
        if (typeof window.Babel !== 'undefined') {
          var compiled = window.Babel.transform(rawCode, { presets: ['react', 'typescript'], filename: 'app.tsx' }).code;
          eval(compiled);
        } else {
          eval(rawCode);
        }
        setTimeout(function() {
          var TargetApp = window.App || (typeof App !== 'undefined' ? App : null);
          var rootEl = document.getElementById('root') || document.getElementById('app');
          if (TargetApp && rootEl && rootEl.children.length === 0 && window.ReactDOM) {
            if (window.ReactDOM.createRoot) {
              window.ReactDOM.createRoot(rootEl).render(window.React.createElement(TargetApp));
            } else {
              window.ReactDOM.render(window.React.createElement(TargetApp), rootEl);
            }
          }
        }, 80);
      } catch (err) {
        console.error('Preview Execution Error:', err);
      }
    })();
  </script>
</body>
</html>`);
        } else {
          doc.write(rawHtml);
        }

        doc.close();
      }
    }
  }, [htmlCode, activeMediaTab, activeHtmlTab]);

  // -------------------------------------------------------------
  // 3D CANVAS RENDER LOOP (Custom 3D Engine in HTML5 Canvas WebGL/2D)
  // -------------------------------------------------------------
  useEffect(() => {
    if (activeMediaTab !== '3d' || !canvas3dRef.current) return;

    const canvas = canvas3dRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Load texture image if selected
    let textureImage: HTMLImageElement | null = null;
    if (selectedTextureUrl) {
      textureImage = new Image();
      textureImage.crossOrigin = 'anonymous';
      textureImage.src = selectedTextureUrl;
    }

    const render3D = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Gradient space background
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width / 1.2);
      bgGrad.addColorStop(0, '#1e1b4b');
      bgGrad.addColorStop(0.5, '#0f172a');
      bgGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid floor
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.lineWidth = 1;
      const gridCount = 12;
      const gridSpacing = width / gridCount;
      for (let i = 0; i <= gridCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSpacing, 0);
        ctx.lineTo(i * gridSpacing, height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * gridSpacing);
        ctx.lineTo(width, i * gridSpacing);
        ctx.stroke();
      }

      if (autoRotate) {
        rotation3d.current.y += 0.015;
        rotation3d.current.x += 0.005;
      }

      const rotX = rotation3d.current.x;
      const rotY = rotation3d.current.y;
      const scale = (Math.min(width, height) / 3.2) * zoom3d.current;

      // Define 3D Mesh vertices based on shape
      let vertices: Array<[number, number, number]> = [];
      let faces: Array<number[]> = [];

      if (selected3dShape === 'cube') {
        vertices = [
          [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
          [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1]
        ];
        faces = [
          [0, 1, 2, 3], // Front
          [5, 4, 7, 6], // Back
          [4, 0, 3, 7], // Left
          [1, 5, 6, 2], // Right
          [4, 5, 1, 0], // Top
          [3, 2, 6, 7]  // Bottom
        ];
      } else if (selected3dShape === 'diamond' || selected3dShape === 'pyramid') {
        vertices = [
          [0, -1.4, 0],   // Top point
          [-1, 0.2, -1],  [1, 0.2, -1], [1, 0.2, 1], [-1, 0.2, 1], // Middle ring
          [0, 1.4, 0]     // Bottom point
        ];
        faces = [
          [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1], // Top pyramids
          [5, 2, 1], [5, 3, 2], [5, 4, 3], [5, 1, 4]  // Bottom pyramids
        ];
      } else if (selected3dShape === 'sphere') {
        // Generate UV sphere vertices
        const latBands = 10;
        const longBands = 14;
        for (let lat = 0; lat <= latBands; lat++) {
          const theta = (lat * Math.PI) / latBands;
          const sinTheta = Math.sin(theta);
          const cosTheta = Math.cos(theta);

          for (let long = 0; long <= longBands; long++) {
            const phi = (long * 2 * Math.PI) / longBands;
            const x = Math.cos(phi) * sinTheta;
            const y = cosTheta;
            const z = Math.sin(phi) * sinTheta;
            vertices.push([x, y, z]);
          }
        }
        for (let lat = 0; lat < latBands; lat++) {
          for (let long = 0; long < longBands; long++) {
            const first = lat * (longBands + 1) + long;
            const second = first + longBands + 1;
            faces.push([first, second, second + 1, first + 1]);
          }
        }
      } else if (selected3dShape === 'torus') {
        const ringSegments = 16;
        const pipeSegments = 10;
        const R = 0.85;
        const r = 0.35;

        for (let i = 0; i < ringSegments; i++) {
          const u = (i * 2 * Math.PI) / ringSegments;
          for (let j = 0; j < pipeSegments; j++) {
            const v = (j * 2 * Math.PI) / pipeSegments;
            const x = (R + r * Math.cos(v)) * Math.cos(u);
            const y = (R + r * Math.cos(v)) * Math.sin(u);
            const z = r * Math.sin(v);
            vertices.push([x, y, z]);
          }
        }
        for (let i = 0; i < ringSegments; i++) {
          for (let j = 0; j < pipeSegments; j++) {
            const nextI = (i + 1) % ringSegments;
            const nextJ = (j + 1) % pipeSegments;
            const p1 = i * pipeSegments + j;
            const p2 = nextI * pipeSegments + j;
            const p3 = nextI * pipeSegments + nextJ;
            const p4 = i * pipeSegments + nextJ;
            faces.push([p1, p2, p3, p4]);
          }
        }
      }

      // Rotate 3D vertices
      const transformedVertices = vertices.map(([x, y, z]) => {
        // Rotate around Y
        let x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
        let z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);
        let y1 = y;

        // Rotate around X
        let y2 = y1 * Math.cos(rotX) - z1 * Math.sin(rotX);
        let z2 = y1 * Math.sin(rotX) + z1 * Math.cos(rotX);
        let x2 = x1;

        // Perspective projection
        const distance = 3.5;
        const fov = 380;
        const zProj = z2 + distance;
        const px = width / 2 + (x2 * fov) / zProj;
        const py = height / 2 + (y2 * fov) / zProj;

        return { x: px, y: py, z: z2, xRaw: x2, yRaw: y2 };
      });

      // Sort faces by average depth (Z-buffer back-to-front rendering)
      const sortedFaces = faces
        .map((faceIndices) => {
          const avgZ = faceIndices.reduce((sum, idx) => sum + (transformedVertices[idx]?.z || 0), 0) / faceIndices.length;
          return { faceIndices, avgZ };
        })
        .sort((a, b) => a.avgZ - b.avgZ);

      // Render 3D Faces
      sortedFaces.forEach(({ faceIndices, avgZ }) => {
        if (faceIndices.length < 3) return;

        ctx.beginPath();
        const first = transformedVertices[faceIndices[0]];
        if (!first) return;
        ctx.moveTo(first.x, first.y);

        for (let i = 1; i < faceIndices.length; i++) {
          const v = transformedVertices[faceIndices[i]];
          if (v) ctx.lineTo(v.x, v.y);
        }
        ctx.closePath();

        // Shading intensity based on depth & normal angle simulation
        const lightFactor = Math.max(0.2, Math.min(1, (avgZ + 1.8) / 3));

        if (renderMode === 'solid' || renderMode === 'glow') {
          if (textureImage && textureImage.complete && textureImage.naturalWidth > 0) {
            // Draw pattern texture if loaded
            ctx.save();
            ctx.clip();
            try {
              ctx.drawImage(textureImage, first.x - 60, first.y - 60, 160, 160);
            } catch {}
            ctx.restore();
            ctx.fillStyle = `rgba(0, 0, 0, ${0.4 - lightFactor * 0.3})`;
            ctx.fill();
          } else {
            // Gradient / HSL Shading
            const hue = (avgZ * 60 + 40) % 360;
            ctx.fillStyle = renderMode === 'glow' 
              ? `hsla(${hue}, 90%, 60%, ${0.5 + lightFactor * 0.4})`
              : `${objectColor}${Math.floor((0.35 + lightFactor * 0.55) * 255).toString(16).padStart(2, '0')}`;
            ctx.fill();
          }

          ctx.strokeStyle = renderMode === 'glow' ? '#fbbf24' : 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = renderMode === 'glow' ? 2 : 1;
          ctx.stroke();
        } else if (renderMode === 'wireframe') {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (renderMode === 'points') {
          ctx.fillStyle = '#60a5fa';
          faceIndices.forEach((idx) => {
            const p = transformedVertices[idx];
            if (p) {
              ctx.beginPath();
              ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
              ctx.fill();
            }
          });
        }
      });

      // Draw Center Title Overlay in 3D Viewport
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Obiekt 3D: ${selected3dShape.toUpperCase()} • Tryb: ${renderMode.toUpperCase()}`, 16, 28);
      ctx.fillStyle = '#f59e0b';
      ctx.font = '11px sans-serif';
      ctx.fillText('Przeciągnij myszą, aby obracać 360° | Użyj kółka myszy, aby przybliżać', 16, 46);

      animationFrameId = requestAnimationFrame(render3D);
    };

    render3D();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeMediaTab, selected3dShape, renderMode, autoRotate, selectedTextureUrl, objectColor]);

  // 3D Canvas Mouse Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging3d.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging3d.current) return;

    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    rotation3d.current.y += deltaX * 0.008;
    rotation3d.current.x += deltaY * 0.008;

    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasMouseUp = () => {
    isDragging3d.current = false;
  };

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.0015;
    zoom3d.current = Math.min(Math.max(0.4, zoom3d.current + zoomDelta), 2.5);
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'gif') return matchesSearch && item.type === 'gif';
    if (filterType === 'video') return matchesSearch && item.type === 'video';
    if (filterType === 'image') return matchesSearch && (item.type === 'image' || item.type === 'gif');
    return matchesSearch;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const copyClckRuLink = async (item: PlikItem) => {
    try {
      let rawUrl = item.url || '';
      if (rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')) {
        const cleanName = (item.filename || item.name || 'material').replace(/[^a-zA-Z0-9._-]/g, '_');
        rawUrl = `/uploads/${cleanName}`;
      }
      const fullUrl = rawUrl.startsWith('/') 
        ? `${window.location.origin}${rawUrl}`
        : rawUrl;
      let shortUrl = getItemClckRuUrl(item);
      if (!shortUrl || shortUrl === 'https://clck.ru/3Vr8B8') {
        try {
          const apiShort = await shortenUrlViaApi(fullUrl);
          if (apiShort && apiShort.startsWith('https://clck.ru/')) {
            shortUrl = apiShort;
          }
        } catch {}
      }
      if (shortUrl) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, shortUrl } : i));
      }
      await navigator.clipboard.writeText(shortUrl);
      setCopiedUrl(shortUrl);
      alert(`Skopiowano skrócony link clck.ru do schowka:\n${shortUrl}`);
      setTimeout(() => setCopiedUrl(null), 2500);
    } catch (err: any) {
      alert(err.message || 'Błąd generowania linku');
    }
  };

  const createQrCodeForFile = async (item: PlikItem) => {
    try {
      let rawUrl = item.url || '';
      if (rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')) {
        const cleanName = (item.filename || item.name || 'material').replace(/[^a-zA-Z0-9._-]/g, '_');
        rawUrl = `/uploads/${cleanName}`;
        item.url = rawUrl;
      }

      const fullUrl = rawUrl.startsWith('/') 
        ? `${window.location.origin}${rawUrl}`
        : rawUrl;

      let shortUrl = getItemClckRuUrl(item);
      if (!shortUrl || shortUrl === 'https://clck.ru/3Vr8B8') {
        try {
          const apiShort = await shortenUrlViaApi(fullUrl);
          if (apiShort && apiShort.startsWith('https://clck.ru/')) {
            shortUrl = apiShort;
          }
        } catch {}
      }

      if (shortUrl) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, shortUrl } : i));
      }

      const fileSlug = item.filename || item.id;
      const newItem = {
        id: `qr_file_${fileSlug.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
        title: item.name,
        displayLabel: `Zeskanuj, aby zobaczyć plik ${item.name}`,
        shortUrl,
        fullUrl,
        category: 'Materiały src/pliki',
        createdAt: new Date().toISOString()
      };
      upsertQrCode(newItem);
      alert(`Pomyślnie dodano kod QR dla pliku "${item.name}" z unikalnym skróconym linkiem clck.ru:\n${shortUrl}`);
    } catch (err: any) {
      alert(err.message || 'Błąd tworzenia kodu QR');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Controls */}
      <div className="bg-white dark:bg-[#151c28] p-5 rounded-3xl border border-[#e2d5c7] dark:border-[#2b394e] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-heading-cinzel font-bold text-lg sm:text-xl text-[#2e2318] dark:text-[#f8fafc] flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>Materiały Graficzne, Wideo, HTML & Obiekty 2D/3D</span>
            </h2>
            <p className="text-xs text-[#786756] dark:text-[#94a3b8] mt-1">
              Przeglądarka zasobów z folderu <code className="bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded text-amber-800 dark:text-amber-300 font-mono">src/pliki</code> ({items.length} plików), interaktywny edytor HTML oraz podgląd 3D.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!readOnly && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer transition-all hover:scale-[1.02]"
              >
                <Upload className="w-4 h-4" />
                <span>Dodaj Nowy Materiał</span>
              </button>
            )}
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Kolekcja: {items.length} Plików
            </span>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#f0e6da] dark:border-[#222d3e]">
          <button
            onClick={() => setActiveMediaTab('grid')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMediaTab === 'grid'
                ? 'bg-[#8c572b] dark:bg-amber-600 text-white shadow-sm'
                : 'bg-[#f4ebe1] dark:bg-[#1a2333] text-[#6b5847] dark:text-[#cbd5e1] hover:bg-[#e8decb]'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Wszystkie Zasoby src/pliki ({items.length})</span>
          </button>

          <button
            onClick={() => setActiveMediaTab('images')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMediaTab === 'images'
                ? 'bg-[#8c572b] dark:bg-amber-600 text-white shadow-sm'
                : 'bg-[#f4ebe1] dark:bg-[#1a2333] text-[#6b5847] dark:text-[#cbd5e1] hover:bg-[#e8decb]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Podgląd Grafiki & GIF ({items.filter(i => i.type === 'image' || i.type === 'gif').length})</span>
          </button>

          <button
            onClick={() => setActiveMediaTab('video')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMediaTab === 'video'
                ? 'bg-[#8c572b] dark:bg-amber-600 text-white shadow-sm'
                : 'bg-[#f4ebe1] dark:bg-[#1a2333] text-[#6b5847] dark:text-[#cbd5e1] hover:bg-[#e8decb]'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Odtwarzacz Filmów Wideo ({items.filter(i => i.type === 'video').length})</span>
          </button>

          {!readOnly && (
            <button
              onClick={() => setActiveMediaTab('html')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeMediaTab === 'html'
                  ? 'bg-[#8c572b] dark:bg-amber-600 text-white shadow-sm'
                  : 'bg-[#f4ebe1] dark:bg-[#1a2333] text-[#6b5847] dark:text-[#cbd5e1] hover:bg-[#e8decb]'
              }`}
            >
              <CodeIcon className="w-4 h-4" />
              <span>Podgląd Kodu HTML (Sandbox Live)</span>
            </button>
          )}

          <button
            onClick={() => setActiveMediaTab('3d')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMediaTab === '3d'
                ? 'bg-[#8c572b] dark:bg-amber-600 text-white shadow-sm'
                : 'bg-[#f4ebe1] dark:bg-[#1a2333] text-[#6b5847] dark:text-[#cbd5e1] hover:bg-[#e8decb]'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>Obiekty 2D & 3D WebGL</span>
          </button>

          {!readOnly && (
            <button
              onClick={() => setActiveMediaTab('aistudio')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeMediaTab === 'aistudio'
                  ? 'bg-[#8c572b] dark:bg-amber-600 text-white shadow-sm ring-2 ring-amber-400/40'
                  : 'bg-amber-500/10 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
              }`}
            >
              <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Paczki Google AI Studio (Paczki z Bibliotekami)</span>
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* GOOGLE AI STUDIO MULTI-FILE PACKAGES & LIBRARIES SANDBOX     */}
      {/* ------------------------------------------------------------- */}
      {activeMediaTab === 'aistudio' && (
        <AiStudioPackageBuilder readOnly={readOnly} />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MEDIA TAB 1 & 2: GRID & GALLERY VIEWER FOR src/pliki           */}
      {/* ------------------------------------------------------------- */}
      {(activeMediaTab === 'grid' || activeMediaTab === 'images') && (
        <div className="space-y-4">
          {/* Search & Type Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#151c28] p-4 rounded-2xl border border-[#e2d5c7] dark:border-[#2b394e]">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Szukaj pliku w src/pliki (np. Bóg, Boże, RHZ, symbol)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#f8f5f0] dark:bg-[#1a2333] border border-[#d6c7b5] dark:border-[#2b394e] text-xs text-[#2e2318] dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Typ:</span>
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${filterType === 'all' ? 'bg-amber-600 text-white' : 'bg-gray-100 dark:bg-[#1f293d] text-gray-600 dark:text-gray-300'}`}
              >
                Wszystkie
              </button>
              <button
                onClick={() => setFilterType('image')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${filterType === 'image' ? 'bg-amber-600 text-white' : 'bg-gray-100 dark:bg-[#1f293d] text-gray-600 dark:text-gray-300'}`}
              >
                Obrazy (JPG/PNG)
              </button>
              <button
                onClick={() => setFilterType('gif')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${filterType === 'gif' ? 'bg-amber-600 text-white' : 'bg-gray-100 dark:bg-[#1f293d] text-gray-600 dark:text-gray-300'}`}
              >
                Animacje GIF
              </button>
              <button
                onClick={() => setFilterType('video')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${filterType === 'video' ? 'bg-amber-600 text-white' : 'bg-gray-100 dark:bg-[#1f293d] text-gray-600 dark:text-gray-300'}`}
              >
                Wideo (MP4)
              </button>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-[#151c28] rounded-2xl border border-[#e2d5c7] dark:border-[#2b394e] overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col"
              >
                {/* Media Preview Window */}
                <div className="relative aspect-4/3 bg-[#111827] flex items-center justify-center overflow-hidden">
                  {item.type === 'video' ? (
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                      muted
                      onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                      onMouseOut={(e) => (e.target as HTMLVideoElement).pause()}
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.name}
                      loading="lazy"
                      onError={(e) => handleImgError(e, item.filename || item.name)}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  {/* Badge Overlay */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-black/70 text-white backdrop-blur-xs">
                    {item.ext.toUpperCase()}
                  </span>

                  {/* Action Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 backdrop-blur-xs">
                    {item.type === 'video' ? (
                      <button
                        onClick={() => {
                          setSelectedVideo(item);
                          setActiveMediaTab('video');
                        }}
                        className="p-2.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white shadow-lg transition-transform hover:scale-110 cursor-pointer"
                        title="Odtwórz wideo"
                      >
                        <Play className="w-5 h-5 fill-current" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedImage(item)}
                        className="p-2.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white shadow-lg transition-transform hover:scale-110 cursor-pointer"
                        title="Otwórz podgląd na pełnym ekranie"
                      >
                        <Maximize2 className="w-5 h-5" />
                      </button>
                    )}

                    <button
                      onClick={() => copyClckRuLink(item)}
                      className="p-2.5 rounded-full bg-amber-700 hover:bg-amber-600 text-white shadow-lg transition-transform hover:scale-110 cursor-pointer"
                      title="Skróć i kopiuj link clck.ru"
                    >
                      <Link2 className="w-5 h-5 text-amber-300" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(item.url)}
                      className="p-2.5 rounded-full bg-gray-800 hover:bg-gray-700 text-white shadow-lg transition-transform hover:scale-110 cursor-pointer"
                      title="Kopiuj bezposredni link"
                    >
                      {copiedUrl === item.url ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* File Details Footer */}
                <div className="p-3 bg-white dark:bg-[#151c28] flex-1 flex flex-col justify-between border-t border-[#f0e6da] dark:border-[#222d3e]">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        {SECTIONS.find(s => s.id === item.sectionId)?.shortTitle || item.sectionId || 'Zasoby'}
                      </span>
                      {item.dateKey && (
                        <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-semibold">
                          {item.dateKey}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-xs text-[#2e2318] dark:text-white truncate" title={item.name}>
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-[#786756] dark:text-[#94a3b8] mt-0.5 font-mono truncate">
                      {item.filename || item.name}
                    </p>
                    {!readOnly && (
                      <div 
                        onClick={() => copyClckRuLink(item)}
                        className="mt-1.5 flex items-center justify-between gap-1 px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/80 transition-colors"
                        title="Kliknij, aby skopiować skrócony link clck.ru"
                      >
                        <span className="font-mono text-[11px] font-bold text-amber-800 dark:text-amber-300 truncate">
                          {getItemClckRuUrl(item)}
                        </span>
                        <Copy className="w-3 h-3 text-amber-700 dark:text-amber-400 shrink-0" />
                      </div>
                    )}
                    {item.description && (
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 italic">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {!readOnly && (
                    <div className="mt-3 flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-[#1e293b]">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => copyClckRuLink(item)}
                          className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                          title="Skróć ten plik przez clck.ru i skopiuj"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          <span>Kopiuj clck.ru</span>
                        </button>

                        <button
                          onClick={() => createQrCodeForFile(item)}
                          className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                          title="Dodaj ten plik do Bazy Kodów QR"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Kod QR</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between opacity-80 pt-1 border-t border-dashed border-gray-200 dark:border-gray-800">
                        <button
                          onClick={() => {
                            setSelectedTextureUrl(item.url);
                            setActiveMediaTab('3d');
                          }}
                          className="text-[10px] font-medium text-stone-600 dark:text-stone-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Box className="w-3 h-3" />
                          <span>Użyj w 3D</span>
                        </button>

                        <a
                          href={item.url}
                          download={item.name}
                          className="text-[10px] font-medium text-stone-600 dark:text-stone-400 hover:underline flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Pobierz</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MEDIA TAB 3: VIDEO PLAYER (film-wszystko.mp4)                 */}
      {/* ------------------------------------------------------------- */}
      {activeMediaTab === 'video' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white dark:bg-[#151c28] p-6 rounded-3xl border border-[#e2d5c7] dark:border-[#2b394e] shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading-cinzel font-bold text-lg text-[#2e2318] dark:text-[#f8fafc] flex items-center gap-2">
                  <Film className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span>Odtwarzacz Wideo: {selectedVideo?.name || 'film-wszystko.mp4'}</span>
                </h3>
                <p className="text-xs text-[#786756] dark:text-[#94a3b8]">
                  Pełnoekranowy podgląd multimedialny materiałów filmowych z folderu <code className="font-mono">src/pliki</code>.
                </p>
              </div>

              {/* Select Video Dropdown */}
              <select
                value={selectedVideo?.id || ''}
                onChange={(e) => {
                  const found = items.find(i => i.id === e.target.value);
                  if (found) setSelectedVideo(found);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#f8f5f0] dark:bg-[#1a2333] border border-[#d6c7b5] dark:border-[#2b394e] text-xs font-bold text-[#2e2318] dark:text-white"
              >
                {items.filter(i => i.type === 'video').map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            {/* Video Viewport */}
            {selectedVideo && (
              <div className="relative aspect-16/9 bg-black rounded-2xl overflow-hidden shadow-2xl group border border-amber-900/30">
                <video
                  ref={videoRef}
                  src={selectedVideo.url}
                  controls
                  loop={isLooping}
                  className="w-full h-full object-contain"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              </div>
            )}

            {/* Extra Player Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#faf7f2] dark:bg-[#0f172a] border border-[#e8ded1] dark:border-[#1e293b]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      if (isPlaying) videoRef.current.pause();
                      else videoRef.current.play();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPlaying ? 'Pauza' : 'Odtwórz'}</span>
                </button>

                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isLooping}
                    onChange={(e) => setIsLooping(e.target.checked)}
                    className="w-4 h-4 accent-amber-600"
                  />
                  <span>Zapętlenie (Loop)</span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-500">Prędkość:</span>
                {[0.5, 1, 1.25, 1.5, 2].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => {
                      setPlaybackSpeed(speed);
                      if (videoRef.current) videoRef.current.playbackRate = speed;
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      playbackSpeed === speed ? 'bg-amber-600 text-white' : 'bg-gray-200 dark:bg-[#1e293b] text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeMediaTab === 'html' && readOnly && (
        <div className="p-8 sm:p-12 text-center bg-white dark:bg-[#151c28] rounded-3xl border border-amber-500/30 space-y-4 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="font-heading-cinzel font-bold text-xl text-[#2e2318] dark:text-[#f8fafc]">
            Dostęp Zastrzeżony dla Administratora
          </h3>
          <p className="text-sm text-[#786756] dark:text-[#94a3b8] max-w-md mx-auto leading-relaxed">
            Edycja i podgląd kodu HTML/CSS są dostępne wyłącznie dla zalogowanego administratora serwisu. Zaloguj się w Panelu Administratora, aby uzyskać dostęp.
          </p>
        </div>
      )}

      {activeMediaTab === 'html' && !readOnly && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#151c28] p-4 rounded-2xl border border-[#e2d5c7] dark:border-[#2b394e] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-heading-cinzel font-bold text-base text-[#2e2318] dark:text-[#f8fafc] flex items-center gap-2">
                <CodeIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span>Interaktywny Podgląd Wyniku Kodu HTML & CSS</span>
              </h3>
              <p className="text-xs text-[#786756] dark:text-[#94a3b8]">
                Wpisuj lub edytuj kod HTML/CSS z natychmiastowym renderowaniem w izolowanym oknie podglądu iframe.
              </p>
            </div>

            {/* Quick Templates & Mode Switcher */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveHtmlTab('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${activeHtmlTab === 'split' ? 'bg-amber-600 text-white' : 'bg-gray-100 dark:bg-[#1f293d] text-gray-700 dark:text-gray-300'}`}
              >
                Podział Ekranu
              </button>
              <button
                onClick={() => setActiveHtmlTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${activeHtmlTab === 'preview' ? 'bg-amber-600 text-white' : 'bg-gray-100 dark:bg-[#1f293d] text-gray-700 dark:text-gray-300'}`}
              >
                Tylko Podgląd
              </button>
              <button
                onClick={() => setActiveHtmlTab('code')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${activeHtmlTab === 'code' ? 'bg-amber-600 text-white' : 'bg-gray-100 dark:bg-[#1f293d] text-gray-700 dark:text-gray-300'}`}
              >
                Tylko Kod
              </button>
            </div>
          </div>

          {/* Main Editor / Sandbox Area */}
          <div className={`grid gap-4 ${activeHtmlTab === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {/* HTML Editor Input */}
            {(activeHtmlTab === 'split' || activeHtmlTab === 'code') && (
              <div className="bg-white dark:bg-[#151c28] rounded-2xl border border-[#e2d5c7] dark:border-[#2b394e] overflow-hidden flex flex-col h-[550px]">
                <div className="bg-[#1e293b] px-4 py-2.5 text-xs font-mono font-bold text-amber-400 flex items-center justify-between border-b border-gray-800">
                  <span className="flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    <span>Kod źródłowy HTML (Edytor Live)</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(htmlCode)}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Kopiuj Kod</span>
                  </button>
                </div>
                <textarea
                  value={htmlCode}
                  onChange={(e) => setHtmlCode(e.target.value)}
                  className="w-full flex-1 p-4 bg-[#0f172a] text-[#f8fafc] font-mono text-xs leading-relaxed focus:outline-hidden resize-none"
                  spellCheck={false}
                />
              </div>
            )}

            {/* Live Rendered Iframe Window */}
            {(activeHtmlTab === 'split' || activeHtmlTab === 'preview') && (
              <div className="bg-white dark:bg-[#151c28] rounded-2xl border border-[#e2d5c7] dark:border-[#2b394e] overflow-hidden flex flex-col h-[550px]">
                <div className="bg-[#f8f5f0] dark:bg-[#1a2333] px-4 py-2.5 text-xs font-bold text-[#2e2318] dark:text-white flex items-center justify-between border-b border-[#e2d5c7] dark:border-[#2b394e]">
                  <span className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-amber-600" />
                    <span>Wynik Renderowania HTML (Live Render Window)</span>
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono">Sandbox Iframe</span>
                </div>
                <iframe
                  ref={iframeRef}
                  title="Live HTML Sandbox Render"
                  className="w-full flex-1 bg-white border-0"
                  sandbox="allow-scripts allow-modals allow-popups"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MEDIA TAB 5: 2D & 3D INTERACTIVE WEBGL ENGINE                 */}
      {/* ------------------------------------------------------------- */}
      {activeMediaTab === '3d' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#151c28] p-5 rounded-3xl border border-[#e2d5c7] dark:border-[#2b394e] shadow-md space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-heading-cinzel font-bold text-lg text-[#2e2318] dark:text-[#f8fafc] flex items-center gap-2">
                  <Box className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span>Interaktywny Podgląd Obiektów 2D & 3D WebGL</span>
                </h3>
                <p className="text-xs text-[#786756] dark:text-[#94a3b8]">
                  Silnik 3D Canvas z rotacją 360°, teksturami z folderu <code className="font-mono">src/pliki</code> oraz renderowaniem siatki 3D.
                </p>
              </div>

              {/* Shape Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Kształt 3D:</span>
                {(['cube', 'diamond', 'sphere', 'torus', 'pyramid'] as const).map((shape) => (
                  <button
                    key={shape}
                    onClick={() => setSelected3dShape(shape)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                      selected3dShape === shape
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-[#1a2333] text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {shape}
                  </button>
                ))}
              </div>
            </div>

            {/* Main 3D Canvas Viewport */}
            <div className="relative w-full h-[450px] bg-black rounded-2xl overflow-hidden border border-amber-900/40 shadow-inner group">
              <canvas
                ref={canvas3dRef}
                width={800}
                height={500}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onWheel={handleCanvasWheel}
                className="w-full h-full cursor-grab active:cursor-grabbing block"
              />

              {/* Floating 3D Control Bar Overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-white">
                {/* Render Mode Toggle */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-amber-400">Tryb Renderu:</span>
                  {(['solid', 'wireframe', 'glow', 'points'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setRenderMode(m)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase cursor-pointer ${
                        renderMode === m ? 'bg-amber-600 text-white' : 'bg-white/10 hover:bg-white/20 text-gray-300'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* Auto Rotate Toggle */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRotate}
                      onChange={(e) => setAutoRotate(e.target.checked)}
                      className="w-4 h-4 accent-amber-500"
                    />
                    <span>Auto-Obrót 360°</span>
                  </label>

                  {/* Color Picker */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">Kolor:</span>
                    <input
                      type="color"
                      value={objectColor}
                      onChange={(e) => setObjectColor(e.target.value)}
                      className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Texture Selector from src/pliki */}
            <div className="p-4 rounded-2xl bg-[#faf7f2] dark:bg-[#0f172a] border border-[#e8ded1] dark:border-[#1e293b] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#2e2318] dark:text-white">
                <span className="flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-amber-600" />
                  <span>Nałóż Teksturę z folderu src/pliki na ścianki obiektu 3D</span>
                </span>
                {selectedTextureUrl && (
                  <button
                    onClick={() => setSelectedTextureUrl(null)}
                    className="text-amber-700 dark:text-amber-400 hover:underline text-[11px] cursor-pointer"
                  >
                    Usuń teksturę
                  </button>
                )}
              </div>

              {/* Horizontal Scroll Thumbnails */}
              <div className="flex items-center gap-3 overflow-x-auto pt-2 pb-1">
                {items.filter(i => i.type === 'image').map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedTextureUrl(img.url)}
                    className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all p-1 bg-black/40 cursor-pointer ${
                      selectedTextureUrl === img.url ? 'border-amber-500 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    title={`Tekstura: ${img.name}`}
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      onError={(e) => handleImgError(e, img.filename || img.name)}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* LIGHTBOX MODAL FOR IMAGES                                     */}
      {/* ------------------------------------------------------------- */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-5xl h-[85vh] flex flex-col justify-between">
            {/* Top Modal Controls */}
            <div className="flex items-center justify-between text-white bg-black/50 p-4 rounded-2xl border border-white/10">
              <div>
                <h3 className="font-bold text-sm text-amber-400">{selectedImage.name}</h3>
                <p className="text-xs text-gray-400 font-mono">src/pliki/{selectedImage.name}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title="Przybliż"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title="Oddal"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title="Obróć o 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => copyClckRuLink(selectedImage)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Kopiuj skrócony link clck.ru"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Kopiuj clck.ru</span>
                </button>
                <button
                  onClick={() => copyToClipboard(selectedImage.url)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  title="Kopiuj bezpośredni URL"
                >
                  {copiedUrl === selectedImage.url ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white ml-4 cursor-pointer"
                  title="Zamknij"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Center Image Viewport */}
            <div className="flex-1 my-4 flex items-center justify-center overflow-hidden relative">
              <img
                src={selectedImage.url}
                alt={selectedImage.name}
                onError={(e) => handleImgError(e, selectedImage.filename || selectedImage.name)}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
                }}
              />
            </div>

            {/* Bottom Footer Info */}
            <div className="bg-black/50 p-3 rounded-2xl border border-white/10 text-center text-xs text-gray-400 flex items-center justify-between">
              <span>Powiększenie: {Math.round(zoomLevel * 100)}% • Obrót: {rotation}°</span>
              <a
                href={selectedImage.url}
                download={selectedImage.name}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Pobierz Pełny Plik</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* UPLOAD NEW MATERIAL MODAL                                    */}
      {/* ------------------------------------------------------------- */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#151c28] border border-[#e2d5c7] dark:border-[#2b394e] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#f0e6da] dark:border-[#222d3e] flex items-center justify-between bg-[#faf6f0] dark:bg-[#101725]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading-cinzel font-bold text-base text-[#2e2318] dark:text-white">
                    Dodaj Nowy Materiał (Zasoby / 2D/3D / HTML)
                  </h3>
                  <p className="text-xs text-[#786756] dark:text-[#94a3b8]">
                    Wgraj plik i nadaj parametry zgodne ze schematem elementów serwisu
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveNewMaterial} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* File Selector */}
              <div>
                <label className="block text-xs font-bold text-[#2e2318] dark:text-gray-200 mb-1.5">
                  Wybierz Plik z Dysku
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (f) {
                      setUploadForm(prev => ({
                        ...prev,
                        file: f,
                        name: prev.name || f.name
                      }));
                    }
                  }}
                  className="w-full text-xs text-[#2e2318] dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-600 file:text-white hover:file:bg-amber-500 cursor-pointer bg-[#f8f5f0] dark:bg-[#1a2333] p-2 rounded-2xl border border-[#d6c7b5] dark:border-[#2b394e]"
                />
              </div>

              {/* Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2e2318] dark:text-gray-200 mb-1.5">
                    Nazwa / Tytuł Materiału *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="np. Ikona Chrystusa Króla"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8f5f0] dark:bg-[#1a2333] border border-[#d6c7b5] dark:border-[#2b394e] text-xs text-[#2e2318] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2e2318] dark:text-gray-200 mb-1.5">
                    Kategoria Zasobu
                  </label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8f5f0] dark:bg-[#1a2333] border border-[#d6c7b5] dark:border-[#2b394e] text-xs text-[#2e2318] dark:text-white"
                  >
                    <option value="Grafika 2D">Grafika 2D (JPG, PNG, WEBP)</option>
                    <option value="Animacja GIF">Animacja GIF</option>
                    <option value="Film Wideo MP4">Film Wideo (MP4, WEBM)</option>
                    <option value="Skrypt HTML">Skrypt / Kod HTML Live</option>
                    <option value="Model 3D / Tekstura">Model 3D / Tekstura (GLB, OBJ)</option>
                    <option value="Dokument PDF">Dokument PDF / Księga</option>
                  </select>
                </div>
              </div>

              {/* Section Assignment & Date Key */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-[#2e2318] dark:text-gray-200 mb-1.5">
                    Przypisanie do Sekcji
                  </label>
                  <select
                    value={uploadForm.sectionId}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, sectionId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8f5f0] dark:bg-[#1a2333] border border-[#d6c7b5] dark:border-[#2b394e] text-xs text-[#2e2318] dark:text-white"
                  >
                    {SECTIONS.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.shortTitle || sec.name}
                      </option>
                    ))}
                    <option value="general">Materiały Ogólne</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2e2318] dark:text-gray-200 mb-1.5">
                    Klucz Dnia (np. 12-25)
                  </label>
                  <input
                    type="text"
                    placeholder="MM-DD np. 12-25"
                    value={uploadForm.dateKey}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, dateKey: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8f5f0] dark:bg-[#1a2333] border border-[#d6c7b5] dark:border-[#2b394e] text-xs text-[#2e2318] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2e2318] dark:text-gray-200 mb-1.5">
                    Numer Dnia (1-365)
                  </label>
                  <input
                    type="number"
                    placeholder="np. 25"
                    value={uploadForm.dayNumber}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, dayNumber: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8f5f0] dark:bg-[#1a2333] border border-[#d6c7b5] dark:border-[#2b394e] text-xs text-[#2e2318] dark:text-white"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#2e2318] dark:text-gray-200 mb-1.5">
                  Opis Materiału / Wykorzystanie
                </label>
                <textarea
                  rows={2}
                  placeholder="Dodatkowy opis, kontekst publikacji lub uwagi dotyczące materiału..."
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8f5f0] dark:bg-[#1a2333] border border-[#d6c7b5] dark:border-[#2b394e] text-xs text-[#2e2318] dark:text-white"
                />
              </div>

              {/* Publication Switches */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Parametry Publikacji (Na Stronie & Na Zewnątrz)</span>
                </h4>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uploadForm.isPublishedPublic}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, isPublishedPublic: e.target.checked }))}
                    className="w-4 h-4 accent-amber-600"
                  />
                  <span className="text-xs text-[#2e2318] dark:text-gray-200 font-medium">
                    Publikacja na stronie (widoczny w galerii zasobów & bibliotece)
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uploadForm.createExternal}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, createExternal: e.target.checked }))}
                    className="w-4 h-4 accent-amber-600"
                  />
                  <span className="text-xs text-[#2e2318] dark:text-gray-200 font-medium">
                    Publikacja na zewnątrz (Generuj skrócony URL <code className="font-mono text-amber-600">clck.ru</code> + Zarejestruj w Bazie Kodów QR)
                  </span>
                </label>
              </div>

              {/* Submit Controls */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f0e6da] dark:border-[#222d3e]">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <span>Publikowanie...</span>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Zapisz i Opublikuj Materiał</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
