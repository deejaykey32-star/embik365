import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Directories for uploads and data storage (both root and public for Cloudflare Pages static builds)
const uploadsDir = path.join(process.cwd(), 'uploads');
const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
const dataDir = path.join(process.cwd(), 'data');
const publicDataDir = path.join(process.cwd(), 'public', 'data');

[uploadsDir, publicUploadsDir, dataDir, publicDataDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

import { GoogleGenAI } from '@google/genai';

// Initialize Gemini client lazily
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Serve uploaded files statically
const serveFileHeaders = (res: express.Response, filePath: string) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (filePath.endsWith('.pdf')) {
    res.setHeader('Content-Type', 'application/pdf');
  } else if (filePath.endsWith('.epub')) {
    res.setHeader('Content-Type', 'application/epub+zip');
  } else if (filePath.endsWith('.docx')) {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  }
};

app.use('/uploads', express.static(publicUploadsDir, { setHeaders: serveFileHeaders }));
app.use('/uploads', express.static(uploadsDir, { setHeaders: serveFileHeaders }));
app.use('/data', express.static(publicDataDir));

// Multer configuration for PDF, ePUB and DOCX uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, publicUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.toLowerCase();
    if (
      file.mimetype === 'application/pdf' || ext.endsWith('.pdf') ||
      file.mimetype === 'application/epub+zip' || ext.endsWith('.epub') ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/msword' || ext.endsWith('.docx') || ext.endsWith('.doc')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Akceptowane są pliki PDF, ePUB oraz DOCX.'));
    }
  }
});

const entriesFilePath = path.join(dataDir, 'entries.json');
const publicEntriesFilePath = path.join(publicDataDir, 'entries.json');

// Helper to read entries
function getStoredData(): { entries: Record<string, any>; uploads: any[] } {
  try {
    if (fs.existsSync(publicEntriesFilePath)) {
      const content = fs.readFileSync(publicEntriesFilePath, 'utf-8');
      return JSON.parse(content);
    }
    if (fs.existsSync(entriesFilePath)) {
      const content = fs.readFileSync(entriesFilePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading entries file:', err);
  }
  return { entries: {}, uploads: [] };
}

// Helper to save entries (syncs to both root and public/data for static packaging)
function saveStoredData(data: { entries: Record<string, any>; uploads: any[] }) {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    fs.writeFileSync(entriesFilePath, jsonStr, 'utf-8');
    fs.writeFileSync(publicEntriesFilePath, jsonStr, 'utf-8');
  } catch (err) {
    console.error('Error saving entries file:', err);
  }
}

// Helper to commit a file to GitHub repository via REST API
async function syncFileToGitHub(
  filePath: string,
  contentBase64: string,
  commitMsg: string,
  owner: string,
  repo: string,
  branch: string,
  token: string
) {
  try {
    // Check if file exists to get SHA
    let sha: string | undefined;
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${token}`
      }
    });
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: commitMsg,
        content: contentBase64,
        branch,
        ...(sha ? { sha } : {})
      })
    });

    return await putRes.json();
  } catch (e) {
    console.error('Failed to sync file to GitHub:', e);
    return null;
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Short URL Direct Redirect Endpoint /r/* (Instant 301 Redirect without ads)
app.get('/r/:slug?', (req, res) => {
  const slug = (req.params.slug || req.query.to || '').toString().trim().toLowerCase();
  const redirectsMap: Record<string, string> = {
    'info': 'https://widokinaraj.pl/#info365',
    'info365': 'https://widokinaraj.pl/#info365',
    'wnr': 'https://widokinaraj.pl/#wnr365',
    'wnr365': 'https://widokinaraj.pl/#wnr365',
    'rhz': 'https://widokinaraj.pl/#rhz365',
    'rhz365': 'https://widokinaraj.pl/#rhz365',
    'biblia': 'https://widokinaraj.pl/#biblia365',
    'biblia365': 'https://widokinaraj.pl/#biblia365',
    'ebook-wnr': 'https://widokinaraj.pl/#ebook_wnr',
    'ebook_wnr': 'https://widokinaraj.pl/#ebook_wnr',
    'ebook-rhz': 'https://widokinaraj.pl/#ebook_rhz',
    'ebook_rhz': 'https://widokinaraj.pl/#ebook_rhz',
    'ebook-biblia': 'https://widokinaraj.pl/#ebook_biblia',
    'ebook_biblia': 'https://widokinaraj.pl/#ebook_biblia',
    'bio': 'https://widokinaraj.pl/#bio365',
    'bio365': 'https://widokinaraj.pl/#bio365'
  };

  const target = redirectsMap[slug] || (req.query.to ? req.query.to.toString() : 'https://widokinaraj.pl/#wnr365');
  return res.redirect(301, target);
});

// URL Shortening API endpoint (clck.ru / is.gd with 0 ads, server-side fetch)
app.all('/api/shorten', async (req, res) => {
  try {
    const targetUrl = (req.query.url || req.body?.url || '').toString().trim();
    if (!targetUrl) {
      return res.status(400).json({ error: 'Brak parametru url' });
    }

    // 1. Try clck.ru API server-side
    try {
      const clckRes = await fetch(`https://clck.ru/--?url=${encodeURIComponent(targetUrl)}`);
      if (clckRes.ok) {
        const shortUrl = await clckRes.text();
        if (shortUrl && shortUrl.startsWith('http')) {
          return res.json({ success: true, shortUrl: shortUrl.trim(), provider: 'clck.ru' });
        }
      }
    } catch (e) {
      console.warn('clck.ru server fetch failed:', e);
    }

    // 2. Try is.gd API server-side
    try {
      const isGdRes = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(targetUrl.replace(/#.*$/, ''))}`);
      if (isGdRes.ok) {
        const data = await isGdRes.json() as { shorturl?: string };
        if (data.shorturl) {
          return res.json({ success: true, shortUrl: data.shorturl, provider: 'is.gd' });
        }
      }
    } catch (e) {
      console.warn('is.gd server fetch failed:', e);
    }

    // Fallback: internal clean short redirect
    const slug = targetUrl.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15);
    const fallbackShort = `https://widokinaraj.pl/r/${slug}`;
    return res.json({ success: true, shortUrl: fallbackShort, provider: 'internal-fallback' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Błąd skracania adresów URL.' });
  }
});

// Get server GitHub environment configuration
app.get('/api/github/config', (req, res) => {
  res.json({
    hasToken: Boolean(process.env.GITHUB_TOKEN),
    owner: process.env.GITHUB_OWNER || 'deejaykey32-star',
    repo: process.env.GITHUB_REPO || 'embik365',
    branch: process.env.GITHUB_BRANCH || 'main'
  });
});

// Push local git repo to remote origin
app.post('/api/github/push-local', async (req, res) => {
  const { owner, repo, branch, token } = req.body;
  const targetOwner = owner || process.env.GITHUB_OWNER || 'deejaykey32-star';
  const targetRepo = repo || process.env.GITHUB_REPO || 'embik365';
  const targetBranch = branch || process.env.GITHUB_BRANCH || 'main';
  const targetToken = token || process.env.GITHUB_TOKEN;

  if (!targetToken) {
    return res.status(400).json({ error: 'Brak tokenu GitHub. Wprowadź Personal Access Token (PAT).' });
  }

  try {
    // Configure remote with token authentication
    const remoteUrl = `https://${targetToken}@github.com/${targetOwner}/${targetRepo}.git`;
    
    await execPromise('git config user.name "Dominik Kuta"').catch(() => {});
    await execPromise('git config user.email "kuta.dominik@gmail.com"').catch(() => {});
    await execPromise('git branch -M ' + targetBranch).catch(() => {});
    await execPromise('git add -A').catch(() => {});
    await execPromise('git commit -m "chore: aktualizacja plików Droga365 z Google Antigravity"').catch(() => {});

    // Try set-url or add remote
    try {
      await execPromise(`git remote set-url origin "${remoteUrl}"`);
    } catch {
      await execPromise(`git remote add origin "${remoteUrl}"`).catch(() => {});
    }

    const { stdout, stderr } = await execPromise(`git push -u origin ${targetBranch} --force`);
    res.json({ success: true, message: 'Pomyślnie wypchnięto pliki do repozytorium GitHub!', output: stdout || stderr });
  } catch (err: any) {
    console.error('Git push error:', err);
    res.status(500).json({ error: `Błąd podczas push do GitHub: ${err.message}` });
  }
});

// Get all entries & uploads
app.get('/api/data', (req, res) => {
  const data = getStoredData();
  res.json(data);
});

// Save or update an entry
app.post('/api/entries', async (req, res) => {
  const { key, entry, githubConfig } = req.body;
  if (!key || !entry) {
    return res.status(400).json({ error: 'Brak klucza lub treści wpisu.' });
  }
  const data = getStoredData();
  data.entries[key] = {
    ...entry,
    updatedAt: new Date().toISOString()
  };
  saveStoredData(data);

  // If GitHub token is present, commit data/entries.json
  const token = githubConfig?.token || process.env.GITHUB_TOKEN;
  const owner = githubConfig?.owner || process.env.GITHUB_OWNER || 'deejaykey32-star';
  const repo = githubConfig?.repo || process.env.GITHUB_REPO || 'embik365';
  const branch = githubConfig?.branch || process.env.GITHUB_BRANCH || 'main';

  if (token && githubConfig?.autoSync !== false) {
    try {
      const jsonBuffer = Buffer.from(JSON.stringify(data, null, 2));
      syncFileToGitHub(
        'public/data/entries.json',
        jsonBuffer.toString('base64'),
        `chore(entry): aktualizacja wpisu ${key} przez administratora`,
        owner,
        repo,
        branch,
        token
      ).catch(e => console.error('Background GitHub sync failed:', e));
    } catch (e) {
      console.warn('Could not sync to GitHub:', e);
    }
  }

  res.json({ success: true, entry: data.entries[key] });
});

// Upload file endpoint (supports PDF, ePUB, DOCX)
const handleFileUpload = async (req: express.Request, res: express.Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nie przesłano pliku (wymagany PDF, ePUB lub DOCX).' });
    }

    const { sectionId, dayNumber, dateKey, title, description, githubToken, githubOwner, githubRepo, githubBranch } = req.body;
    
    // Copy to root uploads as well
    try {
      const rootCopyPath = path.join(uploadsDir, req.file.filename);
      fs.copyFileSync(req.file.path, rootCopyPath);
    } catch (e) {
      console.warn('Could not copy to root uploads:', e);
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    let format: 'pdf' | 'epub' | 'docx' = 'pdf';
    if (ext === '.epub') format = 'epub';
    else if (ext === '.docx' || ext === '.doc') format = 'docx';

    const fileRecord = {
      id: `${format}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      filename: req.file.filename,
      originalName: req.file.originalname,
      format,
      url: `/uploads/${req.file.filename}`,
      size: req.file.size,
      sectionId: sectionId || 'general',
      dayNumber: dayNumber ? parseInt(dayNumber, 10) : undefined,
      dateKey: dateKey || '',
      title: title || req.file.originalname.replace(/\.[a-zA-Z0-9]+$/i, ''),
      description: description || '',
      uploadedAt: new Date().toISOString()
    };

    const data = getStoredData();
    data.uploads.unshift(fileRecord);

    // If attached to a specific section and day, also link to the entry
    if (sectionId && dateKey) {
      const entryKey = `${sectionId}-${dateKey}`;
      if (!data.entries[entryKey]) {
        data.entries[entryKey] = {
          sectionId,
          dateKey,
          dayNumber: dayNumber ? parseInt(dayNumber, 10) : undefined,
          title: title || fileRecord.title,
          pdfs: []
        };
      }
      if (!Array.isArray(data.entries[entryKey].pdfs)) {
        data.entries[entryKey].pdfs = [];
      }
      data.entries[entryKey].pdfs.unshift(fileRecord);
      data.entries[entryKey].updatedAt = new Date().toISOString();
    }

    saveStoredData(data);

    // Check if we should sync to GitHub
    const token = githubToken || process.env.GITHUB_TOKEN;
    const owner = githubOwner || process.env.GITHUB_OWNER || 'deejaykey32-star';
    const repo = githubRepo || process.env.GITHUB_REPO || 'embik365';
    const branch = githubBranch || process.env.GITHUB_BRANCH || 'main';

    let githubSyncResult = null;
    if (token) {
      try {
        const fileContent = fs.readFileSync(req.file.path);
        const base64Content = fileContent.toString('base64');

        // 1. Commit file to GitHub repo at public/uploads/{filename}
        await syncFileToGitHub(
          `public/uploads/${req.file.filename}`,
          base64Content,
          `feat(${format}): dodano plik ${req.file.originalname} (${format.toUpperCase()}) dla sekcji ${sectionId}`,
          owner,
          repo,
          branch,
          token
        );

        // 2. Commit updated entries.json to GitHub
        const jsonBuffer = Buffer.from(JSON.stringify(data, null, 2));
        await syncFileToGitHub(
          'public/data/entries.json',
          jsonBuffer.toString('base64'),
          `chore(db): aktualizacja wpisów po wgraniu ${req.file.filename}`,
          owner,
          repo,
          branch,
          token
        );

        // Point URL to raw GitHub for public accessibility
        fileRecord.url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/public/uploads/${req.file.filename}`;
        githubSyncResult = { synced: true, rawUrl: fileRecord.url };
      } catch (ghErr) {
        console.error('GitHub direct sync failed:', ghErr);
      }
    }

    res.json({ success: true, file: fileRecord, github: githubSyncResult });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Błąd podczas wgrywania pliku.' });
  }
};

app.post('/api/upload-pdf', upload.single('pdfFile'), handleFileUpload);
app.post('/api/upload-file', upload.single('pdfFile'), handleFileUpload);

// Translation endpoint using Gemini API
app.post('/api/translate', async (req, res) => {
  const { text, targetLang, targetLangName, title, prayer, mystery, intention } = req.body;
  if (!text && !title) {
    return res.status(400).json({ error: 'Brak tekstu do przetłumaczenia.' });
  }

  const ai = getAI();
  if (!ai) {
    return res.status(503).json({
      error: 'Brak klucza GEMINI_API_KEY na serwerze.',
      useFallback: true
    });
  }

  try {
    const prompt = `Jesteś wybitnym tłumaczem literatury duchowej, biblijnej i teologicznej Kościoła Katolickiego.
Przetłumacz poniższe elementy z języka polskiego na język: ${targetLangName || targetLang} (kod ISO: ${targetLang}).
Zachowaj pełen szacunku, kontemplacyjny, podniosły i czytelny styl odpowiedni do publikacji książkowych (Print-on-Demand) oraz e-booków.

Oryginalne dane:
Tytuł: ${title || ''}
Tajemnica/Intencja: ${[mystery, intention].filter(Boolean).join(' | ')}
Treść / Rozważanie:
${text || ''}
Modlitwa serca:
${prayer || ''}

Zwróć WYŁĄCZNIE poprawny JSON (bez znaczników markdown, czysty ciąg JSON) o następującej strukturze:
{
  "title": "przetłumaczony tytuł",
  "mystery": "przetłumaczona tajemnica lub puste",
  "intention": "przetłumaczona intencja lub puste",
  "content": "przetłumaczona treść z zachowaniem podziału na akapity",
  "prayer": "przetłumaczona modlitwa serca lub puste"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text || '{}';
    const parsed = JSON.parse(responseText);
    res.json({ success: true, translation: parsed, targetLang });
  } catch (err: any) {
    console.error('Translation error:', err);
    res.status(500).json({ error: err.message || 'Błąd podczas tłumaczenia.' });
  }
});

// Delete uploaded PDF
app.delete('/api/uploads/:id', (req, res) => {
  const { id } = req.params;
  const data = getStoredData();
  const fileIndex = data.uploads.findIndex(u => u.id === id);

  if (fileIndex !== -1) {
    const file = data.uploads[fileIndex];
    [uploadsDir, publicUploadsDir].forEach(dir => {
      const fullPath = path.join(dir, file.filename);
      try {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (e) {
        console.error('Failed to unlink file:', e);
      }
    });

    data.uploads.splice(fileIndex, 1);

    // Also remove from any entries
    for (const key of Object.keys(data.entries)) {
      if (Array.isArray(data.entries[key].pdfs)) {
        data.entries[key].pdfs = data.entries[key].pdfs.filter((p: any) => p.id !== id);
      }
    }

    saveStoredData(data);
    return res.json({ success: true });
  }

  res.status(404).json({ error: 'Plik nie został znaleziony.' });
});

// Admin verify / simulated session endpoint
app.post('/api/auth/verify', (req, res) => {
  const { email } = req.body;
  const adminEmail = 'kuta.dominik@gmail.com';
  
  if (email && email.toLowerCase() === adminEmail.toLowerCase()) {
    return res.json({
      success: true,
      user: {
        email: adminEmail,
        name: 'Dominik Kuta',
        role: 'ADMIN',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      }
    });
  }

  res.status(401).json({ error: 'Brak uprawnień administratora dla tego konta.' });
});

// Start server with Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    // SPA index.html fallback for non-API/non-redirect routes in dev mode
    app.get('*', async (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/r/') || req.path === '/r') {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/r/') || req.path === '/r') {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Droga365 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
