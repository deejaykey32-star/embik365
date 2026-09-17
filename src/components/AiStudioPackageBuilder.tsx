import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import { 
  Sparkles, 
  Code2, 
  Layers, 
  Play, 
  Copy, 
  Download, 
  Check, 
  Plus, 
  Trash2, 
  Edit3, 
  FileCode, 
  Box, 
  QrCode, 
  FileText, 
  RefreshCw, 
  Maximize2, 
  ExternalLink,
  Package,
  Wand2,
  X,
  Save,
  CheckSquare,
  Square,
  Archive,
  UploadCloud,
  FolderArchive,
  Lock
} from 'lucide-react';
import { shortenUrlViaApi, upsertQrCode } from '../utils/qrCodeService';
import { QrImageDisplay } from './QrImageDisplay';

export interface AiStudioPackage {
  id: string;
  name: string;
  description: string;
  category: string;
  htmlContent: string;
  cssContent: string;
  jsContent: string;
  libraries: string[];
  customCdnUrls: string[];
  shortUrl?: string;
  fullUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export const PRESET_LIBRARIES = [
  { id: 'tailwindcss', name: 'TailwindCSS 3.x', category: 'Styling', cssUrl: '', jsUrl: 'https://cdn.tailwindcss.com' },
  { id: 'threejs', name: 'Three.js (3D Graphics)', category: '3D & WebGL', cssUrl: '', jsUrl: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js' },
  { id: 'react', name: 'React 18 + ReactDOM + Babel', category: 'Framework', cssUrl: '', jsUrl: 'https://unpkg.com/react@18/umd/react.production.min.js\nhttps://unpkg.com/react-dom@18/umd/react-dom.production.min.js\nhttps://unpkg.com/@babel/standalone/babel.min.js' },
  { id: 'chartjs', name: 'Chart.js (Wykresy & Data)', category: 'Wykresy', cssUrl: '', jsUrl: 'https://cdn.jsdelivr.net/npm/chart.js' },
  { id: 'lucide', name: 'Lucide Icons', category: 'Ikony', cssUrl: '', jsUrl: 'https://unpkg.com/lucide@latest' },
  { id: 'katex', name: 'KaTeX (Formuły Matematyczne)', category: 'Nauka', cssUrl: 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css', jsUrl: 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js' },
  { id: 'alpinejs', name: 'Alpine.js', category: 'Reaktywność', cssUrl: '', jsUrl: 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js' },
  { id: 'gsap', name: 'GSAP (Animacje)', category: 'Animacje', cssUrl: '', jsUrl: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js' },
  { id: 'confetti', name: 'Canvas Confetti', category: 'Efekty', cssUrl: '', jsUrl: 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js' },
];

export const SAMPLE_AI_STUDIO_PACKAGES: AiStudioPackage[] = [
  {
    id: 'pkg_gemini_solar_system',
    name: 'Interaktywny Układ Słoneczny 3D',
    description: 'Paczka 3D WebGL z symulacją Układu Słonecznego w Three.js zawierająca skrypty, modele i animacje orbitalne.',
    category: 'Symulacje 3D',
    htmlContent: `<div id="app-container">
  <div className="ui-overlay">
    <h2>🌌 Układ Słoneczny 3D</h2>
    <p>Przeciągaj myszą, aby obracać widok 360°. Kółko myszy przybliża planety.</p>
  </div>
  <canvas id="solar-canvas"></canvas>
</div>`,
    cssContent: `body { margin: 0; overflow: hidden; background: #030712; font-family: system-ui, sans-serif; }
#app-container { width: 100vw; height: 100vh; position: relative; }
.ui-overlay { position: absolute; top: 20px; left: 20px; z-index: 10; color: #fff; background: rgba(15, 23, 42, 0.75); padding: 16px 24px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(12px); max-width: 360px; }
.ui-overlay h2 { margin: 0 0 6px 0; font-size: 18px; color: #fbbf24; }
.ui-overlay p { margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5; }
#solar-canvas { width: 100%; height: 100%; display: block; }`,
    jsContent: `// Three.js 3D Engine Initialization
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('solar-canvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Sun
const sunGeo = new THREE.SphereGeometry(2, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

// Sun Glow Light
const light = new THREE.PointLight(0xffffff, 2, 100);
scene.add(light);

// Orbiting Planets
const planets = [
  { name: 'Merkury', color: 0x94a3b8, dist: 4, speed: 0.04, size: 0.4 },
  { name: 'Wenus', color: 0xf59e0b, dist: 6, speed: 0.025, size: 0.6 },
  { name: 'Ziemia', color: 0x3b82f6, dist: 9, speed: 0.015, size: 0.7 },
  { name: 'Mars', color: 0xef4444, dist: 12, speed: 0.01, size: 0.5 },
  { name: 'Jowisz', color: 0xd97706, dist: 16, speed: 0.006, size: 1.2 }
];

const planetMeshes = planets.map(p => {
  const geo = new THREE.SphereGeometry(p.size, 24, 24);
  const mat = new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.6 });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  // Orbit ring line
  const orbitGeo = new THREE.BufferGeometry();
  const points = [];
  for (let i = 0; i <= 64; i++) {
    const theta = (i / 64) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(theta) * p.dist, 0, Math.sin(theta) * p.dist));
  }
  orbitGeo.setFromPoints(points);
  const orbitMat = new THREE.LineBasicMaterial({ color: 0x334155 });
  const orbitLine = new THREE.Line(orbitGeo, orbitMat);
  scene.add(orbitLine);

  return { mesh, ...p, angle: Math.random() * Math.PI * 2 };
});

camera.position.set(0, 14, 22);
camera.lookAt(0, 0, 0);

// Mouse Drag Rotation
let isDragging = false;
let previousMouse = { x: 0, y: 0 };
window.addEventListener('mousedown', e => { isDragging = true; previousMouse = { x: e.clientX, y: e.clientY }; });
window.addEventListener('mouseup', () => isDragging = false);
window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  const deltaX = e.clientX - previousMouse.x;
  const deltaY = e.clientY - previousMouse.y;
  scene.rotation.y += deltaX * 0.005;
  scene.rotation.x += deltaY * 0.005;
  previousMouse = { x: e.clientX, y: e.clientY };
});

// Render Loop
function animate() {
  requestAnimationFrame(animate);
  sun.rotation.y += 0.005;

  planetMeshes.forEach(p => {
    p.angle += p.speed;
    p.mesh.position.x = Math.cos(p.angle) * p.dist;
    p.mesh.position.z = Math.sin(p.angle) * p.dist;
    p.mesh.rotation.y += 0.02;
  });

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});`,
    libraries: ['threejs'],
    customCdnUrls: [],
    createdAt: '2026-09-16T20:00:00.000Z'
  }
];

export const stripTypeScriptTypes = (code: string): string => {
  if (!code) return '';

  const lines = code.split('\n');
  const cleanLines: string[] = [];
  let inImportBlock = false;
  let inInterfaceBlock = false;
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Handle multiline import block continuation
    if (inImportBlock) {
      if (trimmed.includes("from") || trimmed.includes(";") || trimmed.includes("'") || trimmed.includes('"')) {
        inImportBlock = false;
      }
      continue;
    }

    // Handle multiline interface block continuation
    if (inInterfaceBlock) {
      const opens = (line.match(/\{/g) || []).length;
      const closes = (line.match(/\}/g) || []).length;
      braceCount += opens - closes;
      if (braceCount <= 0) {
        inInterfaceBlock = false;
        braceCount = 0;
      }
      continue;
    }

    // Check if line starts an import statement
    const normalized = trimmed.replace(/\s+/g, ' ');
    if (/^import\b|^importtype\b|^import\s*\{|^import\s*\*/.test(normalized)) {
      if (trimmed.includes("from") || trimmed.includes(";") || trimmed.includes("'") || trimmed.includes('"')) {
        continue; // skip single line import
      } else {
        inImportBlock = true; // start multiline import block
        continue;
      }
    }

    // Check if line starts an interface definition
    if (/^(export\s+)?interface\s+[A-Za-z0-9_]+/.test(trimmed)) {
      if (trimmed.includes('{') && trimmed.includes('}')) {
        continue; // single line interface
      }
      inInterfaceBlock = true;
      const opens = (line.match(/\{/g) || []).length;
      const closes = (line.match(/\}/g) || []).length;
      braceCount = opens - closes;
      continue;
    }

    // Check if line starts a type definition
    if (/^(export\s+)?type\s+[A-Za-z0-9_]+/.test(trimmed) && !trimmed.startsWith('typeof')) {
      if (trimmed.endsWith(';') || trimmed.includes('=')) {
        if (trimmed.endsWith(';')) continue;
      }
      if (trimmed.includes('=')) {
        let j = i;
        let typeEnds = false;
        while (j < lines.length) {
          if (lines[j].trim().endsWith(';')) {
            i = j;
            typeEnds = true;
            break;
          }
          j++;
        }
        if (typeEnds) continue;
      }
      continue;
    }

    // Process export keywords on declarations
    let processed = line;

    if (/^\s*export\s+\{[\s\S]*?\};?/.test(processed) || /^\s*export\s+\*\s+from/.test(processed)) {
      continue;
    }

    processed = processed
      .replace(/^\s*export\s+default\s+function\b/g, 'function')
      .replace(/^\s*export\s+default\s+class\b/g, 'class')
      .replace(/^\s*export\s+default\s+/g, 'window.App = ')
      .replace(/^\s*export\s+const\s+/g, 'const ')
      .replace(/^\s*export\s+let\s+/g, 'let ')
      .replace(/^\s*export\s+var\s+/g, 'var ')
      .replace(/^\s*export\s+function\b/g, 'function')
      .replace(/^\s*export\s+class\b/g, 'class');

    cleanLines.push(processed);
  }

  cleanLines.push('\nif (typeof App !== "undefined") window.App = App;');

  let result = cleanLines.join('\n');

  // Safety net: final global pass removing any lingering ESM import statements
  result = result
    .replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];?/gm, '')
    .replace(/^import\s+['"][^'"]+['"];?/gm, '')
    .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
    .replace(/import\s+['"][^'"]+['"];?/g, '');

  // Strip type assertions like `as HTMLCanvasElement` or `as any`
  result = result.replace(/\s+as\s+[A-Za-z0-9_.]+(<[^>]+>)?/g, '');

  return result;
};

export interface AiStudioPackageBuilderProps {
  readOnly?: boolean;
  initialPackageId?: string;
}

export const getPackageFullUrl = (pkg: { id: string; fullUrl?: string }): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://widokinaraj.pl';
  return `${origin}/#paczka/${pkg.id}`;
};

export const AiStudioPackageBuilder: React.FC<AiStudioPackageBuilderProps> = ({ readOnly = false, initialPackageId }) => {
  const [packages, setPackages] = useState<AiStudioPackage[]>(() => {
    try {
      const saved = localStorage.getItem('drogowskazy_ai_studio_packages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((pkg: AiStudioPackage) => ({
            ...pkg,
            jsContent: stripTypeScriptTypes(pkg.jsContent || '')
          }));
        }
      }
    } catch {}
    return SAMPLE_AI_STUDIO_PACKAGES.map(pkg => ({
      ...pkg,
      jsContent: stripTypeScriptTypes(pkg.jsContent || '')
    }));
  });

  const [activePkgId, setActivePkgId] = useState<string>(() => {
    if (initialPackageId && packages.some(p => p.id === initialPackageId)) {
      return initialPackageId;
    }
    // Check window location hash or query param for package ID
    try {
      const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
      if (rawHash.startsWith('paczka/') || rawHash.startsWith('paczka-') || rawHash.startsWith('paczka=')) {
        const idFromHash = rawHash.replace(/^(?:paczka|aistudio|paczki)[/\-=]/i, '').trim();
        if (idFromHash && packages.some(p => p.id === idFromHash)) return idFromHash;
      } else if (rawHash.startsWith('pkg_') && packages.some(p => p.id === rawHash)) {
        return rawHash;
      }
    } catch {}
    return packages[0]?.id || '';
  });

  const [activeTab, setActiveTab] = useState<'run' | 'html' | 'css' | 'js' | 'libraries' | 'import'>('run');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rawImportText, setRawImportText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [isUnzipping, setIsUnzipping] = useState(false);

  const activePkg = packages.find(p => p.id === activePkgId) || packages[0];

  useEffect(() => {
    try {
      localStorage.setItem('drogowskazy_ai_studio_packages', JSON.stringify(packages));
    } catch {}
  }, [packages]);

  useEffect(() => {
    if (activePkgId && typeof window !== 'undefined') {
      const targetHash = `#paczka/${activePkgId}`;
      if (window.location.hash !== targetHash) {
        history.replaceState(null, '', targetHash);
      }
    }
  }, [activePkgId]);

  const updateActivePkg = (fields: Partial<AiStudioPackage>) => {
    if (!activePkg) return;
    setPackages(prev => prev.map(p => p.id === activePkg.id ? { ...p, ...fields, updatedAt: new Date().toISOString() } : p));
  };

  const handleFixTypeScriptInActivePkg = () => {
    if (!activePkg) return;
    const cleaned = stripTypeScriptTypes(activePkg.jsContent || '');
    updateActivePkg({ jsContent: cleaned });
    alert(`Pomyślnie wyczyszczono i naprawiono deklaracje typów TypeScript w paczce "${activePkg.name}"!`);
  };

  // ZIP Archive Importer & Unzipper handler
  const handleZipFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUnzipping(true);
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);

      let html = '';
      let css = '';
      let js = '';
      const libs: string[] = [];
      const customCdns: string[] = [];
      const assetMap: Record<string, string> = {};

      const fileEntries = Object.entries(contents.files);

      // 1. First pass: extract image/asset files into Data URLs
      for (const [path, zipEntry] of fileEntries) {
        if (zipEntry.dir) continue;
        const lower = path.toLowerCase();
        const filename = path.split('/').pop() || path;

        if (/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(lower)) {
          const base64 = await zipEntry.async('base64');
          let mime = 'image/png';
          if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) mime = 'image/jpeg';
          else if (lower.endsWith('.gif')) mime = 'image/gif';
          else if (lower.endsWith('.webp')) mime = 'image/webp';
          else if (lower.endsWith('.svg')) mime = 'image/svg+xml';

          const dataUrl = `data:${mime};base64,${base64}`;
          assetMap[filename] = dataUrl;
          assetMap[path] = dataUrl;
        }
      }

      // 2. Second pass: extract code files with component vs entry point ordering
      const componentJsBlocks: string[] = [];
      const entryJsBlocks: string[] = [];

      for (const [path, zipEntry] of fileEntries) {
        if (zipEntry.dir) continue;
        const lower = path.toLowerCase();
        const text = await zipEntry.async('text');

        if (lower.endsWith('.html') || lower.endsWith('.htm')) {
          if (!html || lower.includes('index.html')) {
            html = text;
          } else {
            html += `\n\n<!-- Plik: ${path} -->\n${text}`;
          }
        } else if (lower.endsWith('.css')) {
          css += `\n/* Plik: ${path} */\n${text}`;
        } else if (lower.endsWith('.js') || lower.endsWith('.mjs') || lower.endsWith('.ts') || lower.endsWith('.jsx') || lower.endsWith('.tsx')) {
          if (lower.endsWith('.d.ts')) {
            continue;
          }
          const block = `\n// Plik: ${path}\n${text}`;
          if (lower.endsWith('main.jsx') || lower.endsWith('main.tsx') || lower.endsWith('main.js') || lower.endsWith('index.jsx') || lower.endsWith('index.tsx') || lower.endsWith('index.js')) {
            entryJsBlocks.push(block);
          } else {
            componentJsBlocks.push(block);
          }
        }
      }

      js = componentJsBlocks.join('\n') + '\n' + entryJsBlocks.join('\n');

      // Clean TypeScript type annotations & ESM imports from runtime JS
      js = stripTypeScriptTypes(js);

      // 3. Replace relative asset references in HTML, CSS, JS with base64 Data URLs
      Object.entries(assetMap).forEach(([fileName, dataUrl]) => {
        const regex = new RegExp(fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        html = html.replace(regex, dataUrl);
        css = css.replace(regex, dataUrl);
        js = js.replace(regex, dataUrl);
      });

      // 4. Detect CDN libraries in HTML / JS
      const combinedCode = `${html}\n${js}`;
      if (combinedCode.includes('tailwindcss')) libs.push('tailwindcss');
      if (combinedCode.includes('three')) libs.push('threejs');
      if (combinedCode.includes('react') || combinedCode.includes('jsx') || /<[A-Za-z][\s\S]*?>/.test(js)) libs.push('react');
      if (combinedCode.includes('chart')) libs.push('chartjs');
      if (combinedCode.includes('lucide')) libs.push('lucide');
      if (combinedCode.includes('katex')) libs.push('katex');

      // 5. Extract inline <style> and <script> out of HTML if needed
      const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
      if (styleMatches) {
        css += '\n\n' + styleMatches.map(m => m.replace(/<style[^>]*>|<\/style>/gi, '').trim()).join('\n\n');
        html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      }

      const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
      if (scriptMatches) {
        scriptMatches.forEach(m => {
          const srcMatch = m.match(/src=["'](.*?)["']/i);
          if (srcMatch && srcMatch[1]) {
            const src = srcMatch[1];
            if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
              customCdns.push(src);
            }
          } else {
            const scriptCode = m.replace(/<script[^>]*>|<\/script>/gi, '').trim();
            if (scriptCode) js += '\n\n' + scriptCode;
          }
        });
        html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      }

      // 6. Clean html wrapper tags if present
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch && bodyMatch[1]) {
        html = bodyMatch[1].trim();
      } else {
        html = html
          .replace(/<!DOCTYPE[^>]*>/gi, '')
          .replace(/<html>|<\/html>|<head>[\s\S]*?<\/head>/gi, '')
          .trim();
      }

      const cleanPkgName = file.name.replace(/\.zip$/i, '').replace(/[^a-zA-Z0-9_-]/g, ' ');

      const newPkg: AiStudioPackage = {
        id: `pkg_zip_${Date.now()}`,
        name: cleanPkgName || 'Paczka z Archiwum ZIP',
        description: `Paczka rozpakowana z archiwum ZIP "${file.name}" (${fileEntries.length} plików).`,
        category: 'Import z ZIP',
        htmlContent: html || '<div>Brak treści HTML w archiwum ZIP</div>',
        cssContent: css.trim(),
        jsContent: js.trim(),
        libraries: Array.from(new Set(libs)),
        customCdnUrls: Array.from(new Set(customCdns)),
        createdAt: new Date().toISOString()
      };

      setPackages(prev => [newPkg, ...prev]);
      setActivePkgId(newPkg.id);
      setActiveTab('run');
      alert(`Pomyślnie rozpakowano i zaimportowano archiwum ZIP "${file.name}"!\nWczytano ${fileEntries.length} plików (HTML, CSS, JS, ilustracje i zasoby).`);
    } catch (err: any) {
      alert(`Błąd rozpakowywania archiwum ZIP: ${err.message || err}`);
    } finally {
      setIsUnzipping(false);
      e.target.value = '';
    }
  };

  const handleCreateNewPackage = () => {
    const newPkg: AiStudioPackage = {
      id: `pkg_ai_${Date.now()}`,
      name: 'Nowa Paczka Projektowa',
      description: 'Stworzona w edytorze paczek dla aplikacji Droga365',
      category: 'Aplikacje Interaktywne',
      htmlContent: `<div className="container">\n  <h1>Witaj w nowej paczce projektowej!</h1>\n  <p>Dodaj kod HTML, CSS, JavaScript oraz zaznacz potrzebne biblioteki w zakładkach powyżej.</p>\n</div>`,
      cssContent: `body { font-family: system-ui, sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; }\n.container { max-width: 600px; margin: 0 auto; background: rgba(255,255,255,0.05); padding: 32px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); }`,
      jsContent: `console.log('Paczka projektowa zainicjalizowana pomyślnie!');`,
      libraries: ['tailwindcss'],
      customCdnUrls: [],
      createdAt: new Date().toISOString()
    };
    setPackages(prev => [newPkg, ...prev]);
    setActivePkgId(newPkg.id);
    setActiveTab('run');
  };

  const handleDeletePackage = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć tę paczkę?')) {
      const filtered = packages.filter(p => p.id !== id);
      setPackages(filtered);
      if (filtered.length > 0) setActivePkgId(filtered[0].id);
    }
  };

  // Smart Parser for pasting raw code outputs
  const handleImportRawAiStudioOutput = () => {
    if (!rawImportText.trim()) {
      alert('Wklej kod do zaimportowania!');
      return;
    }

    let html = '';
    let css = '';
    let js = '';
    const libs: string[] = [...(activePkg?.libraries || [])];
    const customCdns: string[] = [];

    const text = rawImportText;

    // 1. Extract <style> blocks
    const styleMatches = text.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (styleMatches) {
      css = styleMatches.map(m => m.replace(/<style[^>]*>|<\/style>/gi, '').trim()).join('\n\n');
    }

    // 2. Extract <script> blocks
    const scriptMatches = text.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    if (scriptMatches) {
      scriptMatches.forEach(m => {
        const srcMatch = m.match(/src=["'](.*?)["']/i);
        if (srcMatch && srcMatch[1]) {
          const src = srcMatch[1];
          if (src.includes('tailwindcss')) libs.push('tailwindcss');
          else if (src.includes('three')) libs.push('threejs');
          else if (src.includes('react')) libs.push('react');
          else if (src.includes('chart')) libs.push('chartjs');
          else if (src.includes('lucide')) libs.push('lucide');
          else if (src.includes('katex')) libs.push('katex');
          else customCdns.push(src);
        } else {
          const code = m.replace(/<script[^>]*>|<\/script>/gi, '').trim();
          if (code) js += (js ? '\n\n' : '') + code;
        }
      });
    }

    // 3. Extract body/HTML content
    let cleanHtml = text
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<html>|<\/html>|<head>[\s\S]*?<\/head>|<body>|<\/body>/gi, '')
      .trim();

    if (!cleanHtml && !css && !js) {
      cleanHtml = text;
    }

    updateActivePkg({
      htmlContent: cleanHtml || activePkg.htmlContent,
      cssContent: css || activePkg.cssContent,
      jsContent: js || activePkg.jsContent,
      libraries: Array.from(new Set(libs)),
      customCdnUrls: Array.from(new Set(customCdns))
    });

    setRawImportText('');
    setActiveTab('run');
    alert('Pomyślnie zaimportowano i sparsowano kod wygenerowany przez Google AI Studio!');
  };

  // Build combined standalone HTML document for live iframe sandbox execution
  const buildFullDocumentHtml = (pkg: AiStudioPackage): string => {
    // 1. Filter custom CDN URLs to ONLY include valid external http/https/data URLs
    const validCustomCdns = (pkg.customCdnUrls || []).filter(url =>
      url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//') || url.startsWith('data:')
    );

    const customCdnTags = validCustomCdns.map(url => {
      if (url.endsWith('.css')) return `<link rel="stylesheet" href="${url}">`;
      return `<script src="${url}" crossorigin="anonymous"></script>`;
    }).join('\n');

    // 2. Check if React, Babel, or JSX is needed
    const rawJs = pkg.jsContent || '';
    const hasJsx = /<[A-Za-z][\s\S]*?>/g.test(rawJs) || rawJs.includes('import React') || rawJs.includes('React.') || rawJs.includes('ReactDOM');
    const hasReactLib = (pkg.libraries || []).includes('react');
    const needsBabel = hasJsx || hasReactLib;

    let librariesToLoad = [...(pkg.libraries || [])];
    if (needsBabel && !librariesToLoad.includes('react')) {
      librariesToLoad.push('react');
    }

    const cssCdnTags = librariesToLoad.map(libId => {
      const lib = PRESET_LIBRARIES.find(l => l.id === libId);
      return lib?.cssUrl ? `<link rel="stylesheet" href="${lib.cssUrl}">` : '';
    }).filter(Boolean).join('\n');

    const jsCdnTags = librariesToLoad.map(libId => {
      const lib = PRESET_LIBRARIES.find(l => l.id === libId);
      if (!lib?.jsUrl) return '';
      return lib.jsUrl.split('\n').map(url => `<script src="${url.trim()}" crossorigin="anonymous"></script>`).join('\n');
    }).filter(Boolean).join('\n');

    // 3. Ensure HTML has root container if missing
    let bodyContent = pkg.htmlContent || '';

    // Extract inline <script> tags from bodyContent to prevent un-stripped browser script execution errors
    let inlineScriptsFromHtml = '';
    bodyContent = bodyContent.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (match, scriptCode) => {
      const srcMatch = match.match(/src=["'](.*?)["']/i);
      if (srcMatch && srcMatch[1]) {
        const src = srcMatch[1];
        if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
          validCustomCdns.push(src);
        }
      } else if (scriptCode && scriptCode.trim()) {
        inlineScriptsFromHtml += '\n\n' + scriptCode.trim();
      }
      return '';
    });

    if (!bodyContent.includes('id="root"') && !bodyContent.includes('id="app"') && !bodyContent.includes('id="container"')) {
      bodyContent = `<div id="root"></div>\n<div id="app"></div>\n${bodyContent}`;
    }

    // 4. Clean JS imports, exports & TypeScript type declarations for browser compatibility
    const combinedJs = rawJs + '\n' + inlineScriptsFromHtml;
    let cleanedJs = stripTypeScriptTypes(combinedJs);

    const jsonEscapedJs = JSON.stringify(cleanedJs);

    return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pkg.name || 'Google AI Studio App'}</title>
  
  <script>
    window.global = window;
    window.process = { env: { NODE_ENV: 'production' } };
    window.require = function(mod) {
      console.warn('Mock require called for module:', mod);
      if (mod === 'react') return window.React;
      if (mod === 'react-dom') return window.ReactDOM;
      return window[mod] || window.React || {};
    };
  </script>

  ${cssCdnTags}
  ${customCdnTags}
  
  <style>
    ${pkg.cssContent || ''}
  </style>

  ${jsCdnTags}

  <script>
    window.addEventListener('error', function(e) {
      var msg = e.message || (e.error ? e.error.message : '');
      if (!msg || msg === 'Script error.' || msg === 'Script error') return;
      
      var errDiv = document.getElementById('sandbox-error-overlay');
      if (!errDiv) {
        errDiv = document.createElement('div');
        errDiv.id = 'sandbox-error-overlay';
        errDiv.style.cssText = 'position:fixed;bottom:12px;left:12px;right:12px;background:#991b1b;color:#ffffff;padding:14px 18px;border-radius:14px;font-family:monospace;font-size:12px;z-index:999999;box-shadow:0 10px 30px rgba(0,0,0,0.6);border:1px solid #f87171;line-height:1.5;max-height:40vh;overflow:auto;';
        document.body.appendChild(errDiv);
      }
      errDiv.innerHTML = '<strong>⚠️ Błąd w kodzie paczki Google AI Studio:</strong><br/>' + msg;
    });
  </script>
</head>
<body>
  ${bodyContent}

  <script>
    if (typeof window.React !== 'undefined') {
      window.react = window.React;
      window.useState = window.React.useState;
      window.useEffect = window.React.useEffect;
      window.useRef = window.React.useRef;
      window.useCallback = window.React.useCallback;
      window.useMemo = window.React.useMemo;
      window.useContext = window.React.useContext;
      window.useReducer = window.React.useReducer;
      window.createContext = window.React.createContext;
      window.Fragment = window.React.Fragment;

      if (typeof window.ReactDOM !== 'undefined' && !window.ReactDOM.createRoot) {
        window.ReactDOM.createRoot = function(container) {
          return {
            render: function(element) {
              window.ReactDOM.render(element, container);
            }
          };
        };
      }

      var iconNames = ['Play', 'Pause', 'RotateCcw', 'RotateCw', 'Volume2', 'VolumeX', 'Settings', 'Sparkles', 'Check', 'Plus', 'Trash2', 'Edit3', 'Box', 'Archive', 'UploadCloud', 'Wand2', 'X', 'Save', 'Download', 'Copy', 'Maximize2', 'ExternalLink', 'FolderArchive', 'CheckSquare', 'Square', 'Sun', 'Moon', 'Info', 'AlertTriangle', 'HelpCircle', 'Search', 'Filter', 'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight', 'ArrowLeft', 'ArrowRight', 'Eye', 'EyeOff', 'Lock', 'Unlock', 'Sliders', 'Activity', 'Zap', 'Flame', 'Layers', 'Grid'];
      iconNames.forEach(function(name) {
        if (typeof window[name] === 'undefined') {
          window[name] = function(props) {
            var p = props || {};
            return React.createElement('span', {
              className: 'lucide-icon-shim ' + (p.className || ''),
              style: Object.assign({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }, p.style || {}),
              title: name
            }, '✨');
          };
        }
      });
    }

    (function() {
      var rawCode = ${jsonEscapedJs};
      var needsBabel = ${needsBabel};

      function executeCode() {
        try {
          if (needsBabel && typeof window.Babel !== 'undefined') {
            var compiled = window.Babel.transform(rawCode, {
              presets: ['react', 'typescript'],
              filename: 'app.tsx'
            }).code;
            eval(compiled);
          } else {
            eval(rawCode);
          }

          // Auto-render fallback if App is defined but ReactDOM.render wasn't called or failed due to ordering
          setTimeout(function() {
            var TargetApp = window.App || (typeof App !== 'undefined' ? App : null);
            var rootEl = document.getElementById('root') || document.getElementById('app');
            if (TargetApp && rootEl && rootEl.children.length === 0 && typeof window.ReactDOM !== 'undefined' && typeof window.React !== 'undefined') {
              try {
                if (window.ReactDOM.createRoot) {
                  window.ReactDOM.createRoot(rootEl).render(window.React.createElement(TargetApp));
                } else {
                  window.ReactDOM.render(window.React.createElement(TargetApp), rootEl);
                }
              } catch (autoErr) {
                console.warn('Auto-render fallback note:', autoErr);
              }
            }
          }, 100);

        } catch (err) {
          console.error('AI Studio execution error:', err);
          var errDiv = document.getElementById('sandbox-error-overlay');
          if (!errDiv) {
            errDiv = document.createElement('div');
            errDiv.id = 'sandbox-error-overlay';
            errDiv.style.cssText = 'position:fixed;bottom:12px;left:12px;right:12px;background:#991b1b;color:#ffffff;padding:14px 18px;border-radius:14px;font-family:monospace;font-size:12px;z-index:999999;box-shadow:0 10px 30px rgba(0,0,0,0.6);border:1px solid #f87171;line-height:1.5;max-height:40vh;overflow:auto;';
            document.body.appendChild(errDiv);
          }
          errDiv.innerHTML = '<strong>⚠️ Wyjątek podczas wykonywania skryptu:</strong><br/>' + (err.message || err);
        }
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', executeCode);
      } else {
        setTimeout(executeCode, 50);
      }
    })();
  </script>
</body>
</html>`;
  };

  const handleGenerateQr = async () => {
    if (!activePkg) return;
    try {
      const fullUrl = getPackageFullUrl(activePkg);
      const shortUrl = await shortenUrlViaApi(fullUrl);

      upsertQrCode({
        id: `qr_paczka_${activePkg.id}`,
        title: activePkg.name,
        displayLabel: `Dedykowana Paczka: ${activePkg.name}`,
        shortUrl,
        fullUrl,
        category: 'Kolekcja Paczek',
        createdAt: new Date().toISOString()
      });

      updateActivePkg({ shortUrl, fullUrl });
      alert(`Pomyślnie utworzono kod QR dla paczki "${activePkg.name}" z adresem docelowym:\n${fullUrl}\nOraz skrótem clck.ru:\n${shortUrl}`);
    } catch (err: any) {
      alert(err.message || 'Błąd generowania kodu QR');
    }
  };

  const handleDownloadPackageHtml = () => {
    if (!activePkg) return;
    const fullHtml = buildFullDocumentHtml(activePkg);
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activePkg.name || 'paczka_projektowa').replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadQrImage = () => {
    if (!activePkg) return;
    const targetUrl = activePkg.shortUrl || getPackageFullUrl(activePkg);
    QRCode.toDataURL(targetUrl, { width: 600, margin: 2 }).then(dataUrl => {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `kod_qr_${(activePkg.name || 'paczka').replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }).catch(() => {
      alert('Błąd podczas generowania pliku PNG z kodem QR.');
    });
  };

  const getPackageShortUrl = (pkg: AiStudioPackage) => {
    return pkg.shortUrl || getPackageFullUrl(pkg);
  };

  if (!activePkg) return null;

  return (
    <div className="bg-white dark:bg-[#0c121e] rounded-3xl border border-amber-500/30 shadow-xl overflow-hidden animate-fade-in text-stone-900 dark:text-stone-100">
      
      {/* HEADER TOOLBAR */}
      <div className="p-5 bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-violet-500/10 dark:from-[#141d2e] dark:via-[#19152b] dark:to-[#111827] border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Kolekcja Paczek</span>
          </div>
          <h3 className="text-xl font-heading-cinzel font-bold text-amber-950 dark:text-amber-300 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            <span>{activePkg.name}</span>
          </h3>
          {activePkg.description && (
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 max-w-xl">
              {activePkg.description}
            </p>
          )}
        </div>

        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setIsEditingMeta(prev => !prev)}
              className="px-3 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-900 dark:text-amber-200 border border-amber-500/30 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingMeta ? 'Zamknij Edycję Tytułu' : 'Edytuj Tytuł Paczki'}</span>
            </button>

            <button
              onClick={handleGenerateQr}
              className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Generuj Skrót clck.ru</span>
            </button>

            <button
              onClick={handleDownloadPackageHtml}
              className="px-3 py-2 rounded-xl bg-stone-800 dark:bg-stone-700 hover:bg-stone-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Pobierz Plik Paczki (.HTML)</span>
            </button>

            <button
              onClick={handleFixTypeScriptInActivePkg}
              className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Usuń niekompatybilne typy TypeScript z wybranej paczki"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Napraw Kod Paczki (Usuń Typy TS)</span>
            </button>

            <button
              onClick={handleCreateNewPackage}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nowa Paczka</span>
            </button>
          </div>
        )}
      </div>

      {/* PACKAGE METADATA EDITABLE FORM */}
      {!readOnly && isEditingMeta && (
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/30 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-amber-950 dark:text-amber-200 mb-1">Nazwa Paczki Aplikacji</label>
              <input
                type="text"
                value={activePkg.name}
                onChange={e => updateActivePkg({ name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#131c2e] border border-amber-500/30 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-amber-950 dark:text-amber-200 mb-1">Kategoria</label>
              <input
                type="text"
                value={activePkg.category}
                onChange={e => updateActivePkg({ category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#131c2e] border border-amber-500/30 font-semibold"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-amber-950 dark:text-amber-200 mb-1">Opis Paczki</label>
            <input
              type="text"
              value={activePkg.description}
              onChange={e => updateActivePkg({ description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#131c2e] border border-amber-500/30"
            />
          </div>
        </div>
      )}

      {/* DEDICATED LINK, SHORTCUT & QR CODE BOX FOR EACH PACKAGE */}
      <div className="p-4 bg-amber-500/10 dark:bg-[#121927] border-b border-amber-500/20 text-xs">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex-1 space-y-2.5 w-full">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold">
              <QrCode className="w-4 h-4 text-amber-600" />
              <span>Dedykowane Łącze, Skrót i Kod QR Paczki:</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-mono">{activePkg.category}</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-stone-500 dark:text-stone-400 mb-1 uppercase">Dedykowany Link Bezpośredni:</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={getPackageFullUrl(activePkg)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#192233] border border-stone-300 dark:border-stone-700 font-mono text-[11px] select-all text-amber-900 dark:text-amber-200"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getPackageFullUrl(activePkg));
                      alert('Skopiowano dedykowany link do schowka!');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] cursor-pointer shrink-0"
                  >
                    Kopiuj Link
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-500 dark:text-stone-400 mb-1 uppercase">Dedykowany Skrót URL:</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={getPackageShortUrl(activePkg)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#192233] border border-stone-300 dark:border-stone-700 font-mono text-[11px] select-all text-amber-900 dark:text-amber-200"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getPackageShortUrl(activePkg));
                      alert('Skopiowano dedykowany skrót URL do schowka!');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] cursor-pointer shrink-0"
                  >
                    Kopiuj Skrót
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-[#151d2c] p-2.5 rounded-2xl border border-amber-500/30 shrink-0">
            <div className="w-24 h-24 bg-white rounded-xl p-1 flex items-center justify-center overflow-hidden shadow-xs">
              <QrImageDisplay 
                key={`qr-${activePkg.id}`}
                text={activePkg.shortUrl || getPackageFullUrl(activePkg)} 
                size={90} 
                title={activePkg.name} 
              />
            </div>
            <div className="text-left space-y-1.5">
              <div className="font-bold text-[11px] text-amber-950 dark:text-amber-300 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-amber-500" />
                <span>Kod QR Paczki</span>
              </div>
              <div className="text-[10px] text-stone-500 max-w-[140px] leading-tight">Zeskanuj, aby otworzyć tę paczkę na telefonie.</div>
              <button
                onClick={handleDownloadQrImage}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-600/15 hover:bg-amber-600/25 text-amber-900 dark:text-amber-300 font-bold text-[10px] transition-colors cursor-pointer border border-amber-500/30"
              >
                <Download className="w-3 h-3 text-amber-600" />
                <span>Pobierz PNG</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SELECTOR FOR ACTIVE PACKAGE */}
      <div className="p-3 bg-stone-100 dark:bg-[#111827] border-b border-stone-200 dark:border-stone-800 flex items-center gap-2 overflow-x-auto text-xs scrollbar-thin">
        <span className="font-bold text-stone-500 shrink-0">Wybierz Paczkę:</span>
        {packages.map(p => (
          <div key={p.id} className="flex items-center shrink-0">
            <button
              onClick={() => {
                setActivePkgId(p.id);
                if (readOnly) setActiveTab('run');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                p.id === activePkgId
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#182234] text-stone-700 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>{p.name}</span>
            </button>
            {!readOnly && packages.length > 1 && p.id === activePkgId && (
              <button
                onClick={() => handleDeletePackage(p.id)}
                className="ml-1 p-1 text-stone-400 hover:text-red-500 cursor-pointer"
                title="Usuń tę paczkę"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* NAVIGATION TABS: RUN LIVE, HTML, CSS, JS, LIBRARIES, IMPORT (Only for Admin) */}
      {!readOnly && (
        <div className="flex items-center gap-1 p-2 bg-stone-50 dark:bg-[#090d16] border-b border-stone-200 dark:border-stone-800 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('run')}
            className={`px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'run'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-[#151e2e]'
            }`}
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Uruchom Paczkę Aplikacji (Live Sandbox)</span>
          </button>

          <button
            onClick={() => setActiveTab('html')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'html'
                ? 'bg-amber-600 text-white'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-[#151e2e]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-amber-500" />
            <span>index.html ({activePkg.htmlContent.length} zn)</span>
          </button>

          <button
            onClick={() => setActiveTab('css')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'css'
                ? 'bg-amber-600 text-white'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-[#151e2e]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-sky-400" />
            <span>styles.css ({activePkg.cssContent.length} zn)</span>
          </button>

          <button
            onClick={() => setActiveTab('js')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'js'
                ? 'bg-amber-600 text-white'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-[#151e2e]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-yellow-400" />
            <span>app.js ({activePkg.jsContent.length} zn)</span>
          </button>

          <button
            onClick={() => setActiveTab('libraries')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'libraries'
                ? 'bg-amber-600 text-white'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-[#151e2e]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Biblioteki CDN ({activePkg.libraries?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'import'
                ? 'bg-amber-600 text-white'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-[#151e2e]'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Importuj Kod / Archiwum ZIP</span>
          </button>
        </div>
      )}

      {/* TAB CONTENT AREAS */}

      {/* TAB 1: RUN APPLICATION IN SANDBOX */}
      {activeTab === 'run' && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-stone-500">
              Podejrzyj i uruchom paczkę w izolowanym środowisku sandbox iframe
            </span>
            <button
              onClick={() => setIsFullscreen(prev => !prev)}
              className="px-3 py-1.5 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-800 dark:text-stone-200 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{isFullscreen ? 'Zamknij Pełny Ekran' : 'Pełny Ekran'}</span>
            </button>
          </div>

          <div className={`w-full bg-[#030712] rounded-2xl overflow-hidden border border-amber-500/30 transition-all ${isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'h-[600px]'}`}>
            {isFullscreen && (
              <button
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 z-50 p-2.5 rounded-2xl bg-black/70 text-white hover:bg-red-600 cursor-pointer shadow-2xl"
                title="Zamknij pełny ekran"
              >
                <X className="w-6 h-6" />
              </button>
            )}
            <iframe
              srcDoc={buildFullDocumentHtml(activePkg)}
              className="w-full h-full border-none"
              title={activePkg.name}
              sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
            />
          </div>
        </div>
      )}

      {/* TAB 2: INDEX.HTML EDITOR */}
      {activeTab === 'html' && (
        readOnly ? (
          <div className="p-8 text-center bg-[#090d16] rounded-2xl border border-amber-500/30 space-y-3 m-4">
            <Lock className="w-8 h-8 text-amber-500 mx-auto" />
            <h4 className="font-bold text-base text-white">Dostęp Zastrzeżony dla Administratora</h4>
            <p className="text-xs text-stone-400 max-w-md mx-auto">Edycja i podgląd źródłowego kodu HTML są dostępne wyłącznie dla administratora.</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
              Kod HTML (index.html):
            </label>
            <textarea
              rows={18}
              value={activePkg.htmlContent}
              onChange={e => updateActivePkg({ htmlContent: e.target.value })}
              className="w-full p-4 rounded-2xl bg-[#090d16] border border-amber-500/30 font-mono text-xs text-emerald-300 focus:outline-hidden focus:border-amber-500 leading-relaxed"
              placeholder="Wklej lub edytuj tagi HTML..."
            />
          </div>
        )
      )}

      {/* TAB 3: STYLES.CSS EDITOR */}
      {activeTab === 'css' && (
        readOnly ? (
          <div className="p-8 text-center bg-[#090d16] rounded-2xl border border-amber-500/30 space-y-3 m-4">
            <Lock className="w-8 h-8 text-amber-500 mx-auto" />
            <h4 className="font-bold text-base text-white">Dostęp Zastrzeżony dla Administratora</h4>
            <p className="text-xs text-stone-400 max-w-md mx-auto">Edycja i podgląd kodu stylów CSS są dostępne wyłącznie dla administratora.</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
              Kaskadowe Arkusze Stylów (styles.css):
            </label>
            <textarea
              rows={18}
              value={activePkg.cssContent}
              onChange={e => updateActivePkg({ cssContent: e.target.value })}
              className="w-full p-4 rounded-2xl bg-[#090d16] border border-amber-500/30 font-mono text-xs text-sky-300 focus:outline-hidden focus:border-amber-500 leading-relaxed"
              placeholder="Wklej lub edytuj reguły CSS..."
            />
          </div>
        )
      )}

      {/* TAB 4: APP.JS EDITOR */}
      {activeTab === 'js' && (
        readOnly ? (
          <div className="p-8 text-center bg-[#090d16] rounded-2xl border border-amber-500/30 space-y-3 m-4">
            <Lock className="w-8 h-8 text-amber-500 mx-auto" />
            <h4 className="font-bold text-base text-white">Dostęp Zastrzeżony dla Administratora</h4>
            <p className="text-xs text-stone-400 max-w-md mx-auto">Edycja i podgląd kodu JavaScript są dostępne wyłącznie dla administratora.</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
              Skrypt Logiki JavaScript (app.js):
            </label>
            <textarea
              rows={18}
              value={activePkg.jsContent}
              onChange={e => updateActivePkg({ jsContent: e.target.value })}
              className="w-full p-4 rounded-2xl bg-[#090d16] border border-amber-500/30 font-mono text-xs text-yellow-300 focus:outline-hidden focus:border-amber-500 leading-relaxed"
              placeholder="Wklej lub edytuj kod JavaScript..."
            />
          </div>
        )
      )}

      {/* TAB 5: LIBRARIES SELECTOR */}
      {activeTab === 'libraries' && (
        <div className="p-6 space-y-4">
          <div>
            <h4 className="font-bold text-sm text-amber-900 dark:text-amber-300 mb-1">
              Wybierz Biblioteki CDN Dołączane Do Paczki
            </h4>
            <p className="text-xs text-stone-500">
              Zaznacz biblioteki wymagane przez aplikację. Zostaną one automatycznie dołączone przed wykonaniem kodu.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {PRESET_LIBRARIES.map(lib => {
              const isSelected = (activePkg.libraries || []).includes(lib.id);
              return (
                <div
                  key={lib.id}
                  onClick={() => {
                    const currentLibs = activePkg.libraries || [];
                    const updated = isSelected
                      ? currentLibs.filter(id => id !== lib.id)
                      : [...currentLibs, lib.id];
                    updateActivePkg({ libraries: updated });
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-950 dark:text-amber-200'
                      : 'bg-stone-50 dark:bg-[#131c2e] border-stone-200 dark:border-stone-800 hover:border-amber-500/30'
                  }`}
                >
                  <div className="mt-0.5 text-amber-600">
                    {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-xs">{lib.name}</div>
                    <div className="text-[10px] text-stone-500 mt-0.5">{lib.category}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: IMPORT CODE OR ZIP ARCHIVE */}
      {activeTab === 'import' && (
        <div className="p-6 space-y-6">
          
          {/* METHOD 1: IMPORT ZIP ARCHIVE FILE */}
          <div className="p-5 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-emerald-500/10 dark:from-[#131c2e] dark:to-[#0f172a] rounded-2xl border border-amber-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Archive className="w-5 h-5 text-amber-500" />
              <h4 className="font-bold text-sm text-amber-950 dark:text-amber-300">
                Opcja 1: Wgraj Archiwum ZIP z Plikami (.zip)
              </h4>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 mb-4 leading-relaxed">
              Wybierz spakowane archiwum ZIP z projektem webowym. System automatycznie rozpakuje całą strukturę plików (<code className="font-mono text-amber-500">index.html</code>, <code className="font-mono text-sky-400">styles.css</code>, <code className="font-mono text-yellow-400">app.js</code> oraz grafiki/ikony) i przekonwertuje je na uruchamialną aplikację.
            </p>

            <label className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs cursor-pointer shadow-md transition-all hover:scale-[1.02]">
              <UploadCloud className="w-4 h-4" />
              <span>{isUnzipping ? 'Rozpakowywanie archiwum ZIP...' : 'Wybierz Plik Archiwum ZIP ze Swojego Komputera'}</span>
              <input
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={handleZipFileUpload}
                disabled={isUnzipping}
                className="hidden"
              />
            </label>
          </div>

          <div className="border-t border-stone-200 dark:border-stone-800 pt-4">
            <h4 className="font-bold text-sm text-amber-900 dark:text-amber-300 mb-1 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-emerald-500" />
              <span>Opcja 2: Szybki Parser & Wklejanie Wyeksportowanego Kodu</span>
            </h4>
            <p className="text-xs text-stone-500 mb-3">
              Skopiuj kod projektu (wraz z tagami &lt;script&gt;, &lt;style&gt; i bibliotekami) i wklej poniżej. System automatycznie wyodrębni HTML, CSS, JavaScript i zidentyfikuje biblioteki!
            </p>

            <textarea
              rows={10}
              value={rawImportText}
              onChange={e => setRawImportText(e.target.value)}
              className="w-full p-4 rounded-2xl bg-[#090d16] border border-amber-500/30 font-mono text-xs text-emerald-300 focus:outline-hidden focus:border-amber-500 mb-3"
              placeholder="Wklej surowy kod HTML/CSS/JS do zaimportowania..."
            />

            <button
              onClick={handleImportRawAiStudioOutput}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Wand2 className="w-4 h-4" />
              <span>Parsuj i Zaimportuj Wklejony Kod</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
