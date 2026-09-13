# Integracja Cloudflare Pages - embik365

Aplikacja **embik365** (`deejaykey32-star/embik365`) została w pełni zintegrowana z platformą **Cloudflare Pages**.

## 🚀 Przegląd Integracji

Aplikacja wspiera dwutorowe wdrażanie:
1. **Cloudflare Pages (Static + Edge Functions)**: Szybkie serwowanie plików statycznych via Cloudflare global CDN oraz wykonywanie tras API (`/api/*`) za pomocą Cloudflare Pages Functions.
2. **Standardowy serwer Node.js / Express**: Uruchamianie lokalne (`npm run dev`) oraz tradycyjne serwery z obsługa `server.ts`.

---

## 📄 Utworzone Pliki Integracyjne

- **`wrangler.toml`**: Konfiguracja projektu Cloudflare Pages (`name = "embik365"`, `pages_build_output_dir = "dist"`).
- **`public/_redirects`**: Reguły przekierowań SPA (`/* /index.html 200`).
- **`public/_routes.json`**: Definicje obsługi tras przez funkcje i wykluczeń dla zasobów statycznych (`/assets/*`, `/uploads/*`, `/data/*`).
- **`public/_headers`**: Nagłówki buforowania (Cache-Control) i bezpieczeństwa (CORS, Referrer-Policy).
- **`functions/api/[[path]].ts`**: Bezserwerowa obsuługa punktów API (`/api/health`, `/api/github/config`, `/api/translate`, `/api/data`) na platformie Cloudflare Pages Edge.
- **`.github/workflows/deploy.yml`**: Automatyczne wdrażanie projektu na Cloudflare Pages po każdym `git push` do gałęzi `main`.

---

## ⚙️ Wdrażanie i Konfiguracja w Cloudflare Dashboard

### 1. Ręczne wdrażanie przez CLI (Wrangler)
```bash
# Zbudowanie zasobów
npm run pages:build

# Publikacja na Cloudflare Pages
npx wrangler pages deploy dist --project-name=embik365
```

### 2. Automatyczne wdrażanie przez GitHub / CI/CD
Po połączeniu repozytorium `deejaykey32-star/embik365` w panelu Cloudflare Pages:
- **Build command**: `npm run build` (lub `npm run pages:build`)
- **Build output directory**: `dist`
- **Root directory**: `/`

### 3. Zmienne Środowiskowe (Environment Variables)
W panelu Cloudflare Pages (`Settings -> Environment variables`) dodaj:
- `GEMINI_API_KEY`: Klucz API Google Gemini (wymagany do automatycznych tłumaczeń).
- `GITHUB_TOKEN`: Personal Access Token z uprawnieniami do repozytorium `deejaykey32-star/embik365`.
- `GITHUB_OWNER`: `deejaykey32-star`
- `GITHUB_REPO`: `embik365`
- `GITHUB_BRANCH`: `main`
