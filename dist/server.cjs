var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_url = require("url");
var import_multer = __toESM(require("multer"), 1);
var import_vite = require("vite");
var import_child_process = require("child_process");
var import_util = __toESM(require("util"), 1);
var import_genai = require("@google/genai");
var import_meta = {};
var execPromise = import_util.default.promisify(import_child_process.exec);
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
var PORT = 3e3;
var app = (0, import_express.default)();
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
var uploadsDir = import_path.default.join(process.cwd(), "uploads");
var publicUploadsDir = import_path.default.join(process.cwd(), "public", "uploads");
var dataDir = import_path.default.join(process.cwd(), "data");
var publicDataDir = import_path.default.join(process.cwd(), "public", "data");
[uploadsDir, publicUploadsDir, dataDir, publicDataDir].forEach((dir) => {
  if (!import_fs.default.existsSync(dir)) {
    import_fs.default.mkdirSync(dir, { recursive: true });
  }
});
var aiClient = null;
function getAI() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new import_genai.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}
var serveFileHeaders = (res, filePath) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (filePath.endsWith(".pdf")) {
    res.setHeader("Content-Type", "application/pdf");
  } else if (filePath.endsWith(".epub")) {
    res.setHeader("Content-Type", "application/epub+zip");
  } else if (filePath.endsWith(".docx")) {
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  }
};
app.use("/uploads", import_express.default.static(publicUploadsDir, { setHeaders: serveFileHeaders }));
app.use("/uploads", import_express.default.static(uploadsDir, { setHeaders: serveFileHeaders }));
app.use("/data", import_express.default.static(publicDataDir));
var storage = import_multer.default.diskStorage({
  destination: (req, file, cb) => {
    cb(null, publicUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${uniqueSuffix}-${safeName}`);
  }
});
var upload = (0, import_multer.default)({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  // 100MB limit
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.toLowerCase();
    const isAllowed = file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/") || file.mimetype.startsWith("text/html") || file.mimetype === "application/pdf" || file.mimetype === "application/epub+zip" || file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || /\.(pdf|epub|docx|doc|png|jpg|jpeg|gif|webp|svg|bmp|mp4|webm|mov|ogg|html|htm|glb|gltf|obj)$/i.test(ext);
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error("Akceptowane s\u0105 pliki graficzne, wideo, HTML, obiekty 3D oraz dokumenty PDF/ePUB/DOCX."));
    }
  }
});
var entriesFilePath = import_path.default.join(dataDir, "entries.json");
var publicEntriesFilePath = import_path.default.join(publicDataDir, "entries.json");
function getStoredData() {
  try {
    if (import_fs.default.existsSync(publicEntriesFilePath)) {
      const content = import_fs.default.readFileSync(publicEntriesFilePath, "utf-8");
      return JSON.parse(content);
    }
    if (import_fs.default.existsSync(entriesFilePath)) {
      const content = import_fs.default.readFileSync(entriesFilePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading entries file:", err);
  }
  return { entries: {}, uploads: [] };
}
function saveStoredData(data) {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    import_fs.default.writeFileSync(entriesFilePath, jsonStr, "utf-8");
    import_fs.default.writeFileSync(publicEntriesFilePath, jsonStr, "utf-8");
  } catch (err) {
    console.error("Error saving entries file:", err);
  }
}
async function syncFileToGitHub(filePath, contentBase64, commitMsg, owner, repo, branch, token) {
  try {
    let sha;
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${token}`
      }
    });
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }
    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: commitMsg,
        content: contentBase64,
        branch,
        ...sha ? { sha } : {}
      })
    });
    return await putRes.json();
  } catch (e) {
    console.error("Failed to sync file to GitHub:", e);
    return null;
  }
}
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/r/:slug?", (req, res) => {
  const slug = (req.params.slug || req.query.to || "").toString().trim().toLowerCase();
  const redirectsMap = {
    "info": "https://widokinaraj.pl/#info365",
    "info365": "https://widokinaraj.pl/#info365",
    "wnr": "https://widokinaraj.pl/#wnr365",
    "wnr365": "https://widokinaraj.pl/#wnr365",
    "rhz": "https://widokinaraj.pl/#rhz365",
    "rhz365": "https://widokinaraj.pl/#rhz365",
    "biblia": "https://widokinaraj.pl/#biblia365",
    "biblia365": "https://widokinaraj.pl/#biblia365",
    "ebook-wnr": "https://widokinaraj.pl/#ebook_wnr",
    "ebook_wnr": "https://widokinaraj.pl/#ebook_wnr",
    "ebook-rhz": "https://widokinaraj.pl/#ebook_rhz",
    "ebook_rhz": "https://widokinaraj.pl/#ebook_rhz",
    "ebook-biblia": "https://widokinaraj.pl/#ebook_biblia",
    "ebook_biblia": "https://widokinaraj.pl/#ebook_biblia",
    "bio": "https://widokinaraj.pl/#bio365",
    "bio365": "https://widokinaraj.pl/#bio365"
  };
  const target = redirectsMap[slug] || (req.query.to ? req.query.to.toString() : "https://widokinaraj.pl/#wnr365");
  return res.redirect(301, target);
});
app.all("/api/shorten", async (req, res) => {
  try {
    const targetUrl = (req.query.url || req.body?.url || "").toString().trim();
    if (!targetUrl) {
      return res.status(400).json({ error: "Brak parametru url" });
    }
    try {
      const clckRes = await fetch(`https://clck.ru/--?url=${encodeURIComponent(targetUrl)}`);
      if (clckRes.ok) {
        const shortUrl = await clckRes.text();
        if (shortUrl && shortUrl.startsWith("http")) {
          return res.json({ success: true, shortUrl: shortUrl.trim(), provider: "clck.ru" });
        }
      }
    } catch (e) {
      console.warn("clck.ru server fetch failed:", e);
    }
    try {
      const isGdRes = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(targetUrl.replace(/#.*$/, ""))}`);
      if (isGdRes.ok) {
        const data = await isGdRes.json();
        if (data.shorturl) {
          return res.json({ success: true, shortUrl: data.shorturl, provider: "is.gd" });
        }
      }
    } catch (e) {
      console.warn("is.gd server fetch failed:", e);
    }
    const slug = targetUrl.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9]/g, "_").substring(0, 15);
    const fallbackShort = `https://widokinaraj.pl/r/${slug}`;
    return res.json({ success: true, shortUrl: fallbackShort, provider: "internal-fallback" });
  } catch (err) {
    res.status(500).json({ error: err.message || "B\u0142\u0105d skracania adres\xF3w URL." });
  }
});
app.get("/api/github/config", (req, res) => {
  res.json({
    hasToken: Boolean(process.env.GITHUB_TOKEN),
    owner: process.env.GITHUB_OWNER || "deejaykey32-star",
    repo: process.env.GITHUB_REPO || "embik365",
    branch: process.env.GITHUB_BRANCH || "main"
  });
});
app.post("/api/github/push-local", async (req, res) => {
  const { owner, repo, branch, token } = req.body;
  const targetOwner = owner || process.env.GITHUB_OWNER || "deejaykey32-star";
  const targetRepo = repo || process.env.GITHUB_REPO || "embik365";
  const targetBranch = branch || process.env.GITHUB_BRANCH || "main";
  const targetToken = token || process.env.GITHUB_TOKEN;
  if (!targetToken) {
    return res.status(400).json({ error: "Brak tokenu GitHub. Wprowad\u017A Personal Access Token (PAT)." });
  }
  try {
    const remoteUrl = `https://${targetToken}@github.com/${targetOwner}/${targetRepo}.git`;
    await execPromise('git config user.name "Dominik Kuta"').catch(() => {
    });
    await execPromise('git config user.email "kuta.dominik@gmail.com"').catch(() => {
    });
    await execPromise("git branch -M " + targetBranch).catch(() => {
    });
    await execPromise("git add -A").catch(() => {
    });
    await execPromise('git commit -m "chore: aktualizacja plik\xF3w Droga365 z Google Antigravity"').catch(() => {
    });
    try {
      await execPromise(`git remote set-url origin "${remoteUrl}"`);
    } catch {
      await execPromise(`git remote add origin "${remoteUrl}"`).catch(() => {
      });
    }
    const { stdout, stderr } = await execPromise(`git push -u origin ${targetBranch} --force`);
    res.json({ success: true, message: "Pomy\u015Blnie wypchni\u0119to pliki do repozytorium GitHub!", output: stdout || stderr });
  } catch (err) {
    console.error("Git push error:", err);
    res.status(500).json({ error: `B\u0142\u0105d podczas push do GitHub: ${err.message}` });
  }
});
app.get("/api/data", (req, res) => {
  const data = getStoredData();
  res.json(data);
});
app.post("/api/entries", async (req, res) => {
  const { key, entry, githubConfig } = req.body;
  if (!key || !entry) {
    return res.status(400).json({ error: "Brak klucza lub tre\u015Bci wpisu." });
  }
  const data = getStoredData();
  data.entries[key] = {
    ...entry,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  saveStoredData(data);
  const token = githubConfig?.token || process.env.GITHUB_TOKEN;
  const owner = githubConfig?.owner || process.env.GITHUB_OWNER || "deejaykey32-star";
  const repo = githubConfig?.repo || process.env.GITHUB_REPO || "embik365";
  const branch = githubConfig?.branch || process.env.GITHUB_BRANCH || "main";
  if (token && githubConfig?.autoSync !== false) {
    try {
      const jsonBuffer = Buffer.from(JSON.stringify(data, null, 2));
      syncFileToGitHub(
        "public/data/entries.json",
        jsonBuffer.toString("base64"),
        `chore(entry): aktualizacja wpisu ${key} przez administratora`,
        owner,
        repo,
        branch,
        token
      ).catch((e) => console.error("Background GitHub sync failed:", e));
    } catch (e) {
      console.warn("Could not sync to GitHub:", e);
    }
  }
  res.json({ success: true, entry: data.entries[key] });
});
var handleFileUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nie przes\u0142ano pliku (wymagany PDF, ePUB lub DOCX)." });
    }
    const { sectionId, dayNumber, dateKey, title, description, githubToken, githubOwner, githubRepo, githubBranch } = req.body;
    try {
      const rootCopyPath = import_path.default.join(uploadsDir, req.file.filename);
      import_fs.default.copyFileSync(req.file.path, rootCopyPath);
    } catch (e) {
      console.warn("Could not copy to root uploads:", e);
    }
    const ext = import_path.default.extname(req.file.originalname).toLowerCase();
    let format = "pdf";
    if (ext === ".epub") format = "epub";
    else if (ext === ".docx" || ext === ".doc") format = "docx";
    const fileRecord = {
      id: `${format}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      filename: req.file.filename,
      originalName: req.file.originalname,
      format,
      url: `/uploads/${req.file.filename}`,
      size: req.file.size,
      sectionId: sectionId || "general",
      dayNumber: dayNumber ? parseInt(dayNumber, 10) : void 0,
      dateKey: dateKey || "",
      title: title || req.file.originalname.replace(/\.[a-zA-Z0-9]+$/i, ""),
      description: description || "",
      uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const data = getStoredData();
    data.uploads.unshift(fileRecord);
    if (sectionId && dateKey) {
      const entryKey = `${sectionId}-${dateKey}`;
      if (!data.entries[entryKey]) {
        data.entries[entryKey] = {
          sectionId,
          dateKey,
          dayNumber: dayNumber ? parseInt(dayNumber, 10) : void 0,
          title: title || fileRecord.title,
          pdfs: []
        };
      }
      if (!Array.isArray(data.entries[entryKey].pdfs)) {
        data.entries[entryKey].pdfs = [];
      }
      data.entries[entryKey].pdfs.unshift(fileRecord);
      data.entries[entryKey].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    saveStoredData(data);
    const token = githubToken || process.env.GITHUB_TOKEN;
    const owner = githubOwner || process.env.GITHUB_OWNER || "deejaykey32-star";
    const repo = githubRepo || process.env.GITHUB_REPO || "embik365";
    const branch = githubBranch || process.env.GITHUB_BRANCH || "main";
    let githubSyncResult = null;
    if (token) {
      try {
        const fileContent = import_fs.default.readFileSync(req.file.path);
        const base64Content = fileContent.toString("base64");
        await syncFileToGitHub(
          `public/uploads/${req.file.filename}`,
          base64Content,
          `feat(${format}): dodano plik ${req.file.originalname} (${format.toUpperCase()}) dla sekcji ${sectionId}`,
          owner,
          repo,
          branch,
          token
        );
        const jsonBuffer = Buffer.from(JSON.stringify(data, null, 2));
        await syncFileToGitHub(
          "public/data/entries.json",
          jsonBuffer.toString("base64"),
          `chore(db): aktualizacja wpis\xF3w po wgraniu ${req.file.filename}`,
          owner,
          repo,
          branch,
          token
        );
        fileRecord.url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/public/uploads/${req.file.filename}`;
        githubSyncResult = { synced: true, rawUrl: fileRecord.url };
      } catch (ghErr) {
        console.error("GitHub direct sync failed:", ghErr);
      }
    }
    res.json({ success: true, file: fileRecord, github: githubSyncResult });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message || "B\u0142\u0105d podczas wgrywania pliku." });
  }
};
app.post("/api/upload-pdf", upload.single("pdfFile"), handleFileUpload);
app.post("/api/upload-file", upload.single("pdfFile"), handleFileUpload);
app.post("/api/translate", async (req, res) => {
  const { text, targetLang, targetLangName, title, prayer, mystery, intention } = req.body;
  if (!text && !title) {
    return res.status(400).json({ error: "Brak tekstu do przet\u0142umaczenia." });
  }
  const ai = getAI();
  if (!ai) {
    return res.status(503).json({
      error: "Brak klucza GEMINI_API_KEY na serwerze.",
      useFallback: true
    });
  }
  try {
    const prompt = `Jeste\u015B wybitnym t\u0142umaczem literatury duchowej, biblijnej i teologicznej Ko\u015Bcio\u0142a Katolickiego.
Przet\u0142umacz poni\u017Csze elementy z j\u0119zyka polskiego na j\u0119zyk: ${targetLangName || targetLang} (kod ISO: ${targetLang}).
Zachowaj pe\u0142en szacunku, kontemplacyjny, podnios\u0142y i czytelny styl odpowiedni do publikacji ksi\u0105\u017Ckowych (Print-on-Demand) oraz e-book\xF3w.

Oryginalne dane:
Tytu\u0142: ${title || ""}
Tajemnica/Intencja: ${[mystery, intention].filter(Boolean).join(" | ")}
Tre\u015B\u0107 / Rozwa\u017Canie:
${text || ""}
Modlitwa serca:
${prayer || ""}

Zwr\xF3\u0107 WY\u0141\u0104CZNIE poprawny JSON (bez znacznik\xF3w markdown, czysty ci\u0105g JSON) o nast\u0119puj\u0105cej strukturze:
{
  "title": "przet\u0142umaczony tytu\u0142",
  "mystery": "przet\u0142umaczona tajemnica lub puste",
  "intention": "przet\u0142umaczona intencja lub puste",
  "content": "przet\u0142umaczona tre\u015B\u0107 z zachowaniem podzia\u0142u na akapity",
  "prayer": "przet\u0142umaczona modlitwa serca lub puste"
}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const responseText = response.text || "{}";
    const parsed = JSON.parse(responseText);
    res.json({ success: true, translation: parsed, targetLang });
  } catch (err) {
    console.error("Translation error:", err);
    res.status(500).json({ error: err.message || "B\u0142\u0105d podczas t\u0142umaczenia." });
  }
});
app.delete("/api/uploads/:id", (req, res) => {
  const { id } = req.params;
  const data = getStoredData();
  const fileIndex = data.uploads.findIndex((u) => u.id === id);
  if (fileIndex !== -1) {
    const file = data.uploads[fileIndex];
    [uploadsDir, publicUploadsDir].forEach((dir) => {
      const fullPath = import_path.default.join(dir, file.filename);
      try {
        if (import_fs.default.existsSync(fullPath)) {
          import_fs.default.unlinkSync(fullPath);
        }
      } catch (e) {
        console.error("Failed to unlink file:", e);
      }
    });
    data.uploads.splice(fileIndex, 1);
    for (const key of Object.keys(data.entries)) {
      if (Array.isArray(data.entries[key].pdfs)) {
        data.entries[key].pdfs = data.entries[key].pdfs.filter((p) => p.id !== id);
      }
    }
    saveStoredData(data);
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Plik nie zosta\u0142 znaleziony." });
});
app.post("/api/tts", async (req, res) => {
  const { text, lang, voiceId, rate } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Brak tekstu do syntezy mowy." });
  }
  const targetLang = lang || "pl";
  const cleanText = text.substring(0, 500).replace(/<[^>]*>/g, "").trim();
  try {
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${encodeURIComponent(targetLang)}&client=tw-ob`;
    const ttsRes = await fetch(ttsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    if (ttsRes.ok) {
      const arrayBuffer = await ttsRes.arrayBuffer();
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(Buffer.from(arrayBuffer));
    }
  } catch (e) {
    console.warn("Google Translate TTS fetch failed:", e);
  }
  res.status(500).json({ error: "Nie uda\u0142o si\u0119 wygenerowa\u0107 mowy online." });
});
app.post("/api/auth/verify", (req, res) => {
  const { email } = req.body;
  const adminEmail = "kuta.dominik@gmail.com";
  if (email && email.toLowerCase() === adminEmail.toLowerCase()) {
    return res.json({
      success: true,
      user: {
        email: adminEmail,
        name: "Dominik Kuta",
        role: "ADMIN",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
      }
    });
  }
  res.status(401).json({ error: "Brak uprawnie\u0144 administratora dla tego konta." });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "custom"
    });
    app.use(vite.middlewares);
    app.get("*", async (req, res, next) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/r/") || req.path === "/r") {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = import_fs.default.readFileSync(import_path.default.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/r/") || req.path === "/r") {
        return next();
      }
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Droga365 Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
