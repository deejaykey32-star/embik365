interface Env {
  GEMINI_API_KEY?: string;
  GITHUB_TOKEN?: string;
  GITHUB_OWNER?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
  ASSETS?: { fetch: (req: Request) => Promise<Response> };
}

declare type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Promise<Response> | Response;

async function serverTranslateText(text: string, targetLang: string): Promise<string> {
  if (!text || !text.trim() || targetLang === 'pl') return text;

  const cleanText = text.replace(/<[^>]*>/g, ' ').substring(0, 1500).trim();
  if (!cleanText) return text;

  // 1. Try MyMemory Free API
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=pl|${targetLang}`);
    if (res.ok) {
      const data = await res.json() as any;
      if (data?.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch (e) {
    console.warn('MyMemory server translate failed:', e);
  }

  // 2. Fallback Google GTX API
  try {
    const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pl&tl=${targetLang}&dt=t&q=${encodeURIComponent(cleanText)}`;
    const res = await fetch(gtxUrl);
    if (res.ok) {
      const json = await res.json() as any;
      if (Array.isArray(json) && Array.isArray(json[0])) {
        return json[0].map((item: any) => item[0] || '').join('');
      }
    }
  } catch (e) {
    console.warn('Google GTX server translate failed:', e);
  }

  return text;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health endpoint
  if (pathname === '/api/health') {
    return new Response(
      JSON.stringify({
        status: 'ok',
        provider: 'Cloudflare Pages Functions',
        repository: `${env.GITHUB_OWNER || 'deejaykey32-star'}/${env.GITHUB_REPO || 'embik365'}`,
        timestamp: new Date().toISOString()
      }),
      { headers: corsHeaders }
    );
  }

  // GitHub environment config endpoint
  if (pathname === '/api/github/config') {
    return new Response(
      JSON.stringify({
        hasToken: Boolean(env.GITHUB_TOKEN),
        owner: env.GITHUB_OWNER || 'deejaykey32-star',
        repo: env.GITHUB_REPO || 'embik365',
        branch: env.GITHUB_BRANCH || 'main'
      }),
      { headers: corsHeaders }
    );
  }

  // Auth verify endpoint
  if (pathname === '/api/auth/verify' && request.method === 'POST') {
    try {
      const body = await request.json() as { email?: string };
      const adminEmail = 'kuta.dominik@gmail.com';
      if (body.email && body.email.toLowerCase() === adminEmail.toLowerCase()) {
        return new Response(
          JSON.stringify({
            success: true,
            user: {
              email: adminEmail,
              name: 'Dominik Kuta',
              role: 'ADMIN',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            }
          }),
          { headers: corsHeaders }
        );
      }
      return new Response(
        JSON.stringify({ error: 'Brak uprawnień administratora dla tego konta.' }),
        { status: 401, headers: corsHeaders }
      );
    } catch {
      return new Response(
        JSON.stringify({ error: 'Nieprawidłowe zapytanie auth.' }),
        { status: 400, headers: corsHeaders }
      );
    }
  }

  // Gemini AI Translation endpoint
  if (pathname === '/api/translate' && request.method === 'POST') {
    try {
      const body = await request.json() as {
        text?: string;
        targetLang?: string;
        targetLangName?: string;
        title?: string;
        prayer?: string;
        mystery?: string;
        intention?: string;
      };

      const targetLang = (body.targetLang || 'en').toLowerCase();

      if (!env.GEMINI_API_KEY) {
        const [transTitle, transContent, transPrayer, transMystery, transIntention] = await Promise.all([
          serverTranslateText(body.title || '', targetLang),
          serverTranslateText(body.text || '', targetLang),
          body.prayer ? serverTranslateText(body.prayer, targetLang) : Promise.resolve(undefined),
          body.mystery ? serverTranslateText(body.mystery, targetLang) : Promise.resolve(undefined),
          body.intention ? serverTranslateText(body.intention, targetLang) : Promise.resolve(undefined)
        ]);

        return new Response(
          JSON.stringify({
            success: true,
            translation: {
              title: transTitle || body.title,
              content: transContent || body.text,
              prayer: transPrayer || body.prayer,
              mystery: transMystery || body.mystery,
              intention: transIntention || body.intention
            },
            targetLang
          }),
          { headers: corsHeaders }
        );
      }

      const prompt = `Jesteś wybitnym tłumaczem literatury duchowej, biblijnej i teologicznej Kościoła Katolickiego.
Przetłumacz poniższe elementy z języka polskiego na język: ${body.targetLangName || body.targetLang} (kod ISO: ${body.targetLang}).
Zachowaj pełen szacunku, kontemplacyjny, podniosły i czytelny styl odpowiedni do publikacji książkowych (Print-on-Demand) oraz e-booków.

Oryginalne dane:
Tytuł: ${body.title || ''}
Tajemnica/Intencja: ${[body.mystery, body.intention].filter(Boolean).join(' | ')}
Treść / Rozważanie:
${body.text || ''}
Modlitwa serca:
${body.prayer || ''}

Zwróć WYŁĄCZNIE poprawny JSON (bez znaczników markdown, czysty ciąg JSON) o następującej strukturze:
{
  "title": "przetłumaczony tytuł",
  "mystery": "przetłumaczona tajemnica lub puste",
  "intention": "przetłumaczona intencja lub puste",
  "content": "przetłumaczona treść z zachowaniem podziału na akapity",
  "prayer": "przetłumaczona modlitwa serca lub puste"
}`;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        }
      );

      if (!geminiRes.ok) {
        const [transTitle, transContent, transPrayer] = await Promise.all([
          serverTranslateText(body.title || '', targetLang),
          serverTranslateText(body.text || '', targetLang),
          body.prayer ? serverTranslateText(body.prayer, targetLang) : Promise.resolve(undefined)
        ]);

        return new Response(
          JSON.stringify({
            success: true,
            translation: {
              title: transTitle || body.title,
              content: transContent || body.text,
              prayer: transPrayer || body.prayer
            },
            targetLang
          }),
          { headers: corsHeaders }
        );
      }

      const geminiData = await geminiRes.json() as any;
      const textOut = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const parsed = JSON.parse(textOut);

      return new Response(
        JSON.stringify({ success: true, translation: parsed, targetLang: body.targetLang }),
        { headers: corsHeaders }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message || 'Błąd tłumaczenia w Cloudflare Functions.' }),
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // Data fetching endpoint
  if (pathname === '/api/data' && request.method === 'GET') {
    const owner = env.GITHUB_OWNER || 'deejaykey32-star';
    const repo = env.GITHUB_REPO || 'embik365';
    const branch = env.GITHUB_BRANCH || 'main';
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/public/data/entries.json`;

    try {
      const githubRes = await fetch(`${rawUrl}?t=${Date.now()}`);
      if (githubRes.ok) {
        const data = await githubRes.json();
        return new Response(JSON.stringify(data), { headers: corsHeaders });
      }
    } catch {
      // Fallback
    }

    return new Response(JSON.stringify({ entries: {}, uploads: [] }), { headers: corsHeaders });
  }

  // Save entry / homeConfig endpoint with GitHub auto-sync
  if (pathname === '/api/entries' && request.method === 'POST') {
    try {
      const body = await request.json() as {
        key?: string;
        entry?: any;
        githubConfig?: { token?: string; owner?: string; repo?: string; branch?: string };
      };

      if (!body.key || !body.entry) {
        return new Response(
          JSON.stringify({ error: 'Brak klucza lub treści wpisu.' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const owner = body.githubConfig?.owner || env.GITHUB_OWNER || 'deejaykey32-star';
      const repo = body.githubConfig?.repo || env.GITHUB_REPO || 'embik365';
      const branch = body.githubConfig?.branch || env.GITHUB_BRANCH || 'main';
      const token = body.githubConfig?.token || env.GITHUB_TOKEN;

      if (!token) {
        return new Response(
          JSON.stringify({ success: true, message: 'Wpis zapisany lokalnie, brak tokena GitHub do publikacji na żywo.' }),
          { headers: corsHeaders }
        );
      }

      // Fetch current entries.json from GitHub
      let currentData: { entries: Record<string, any>; uploads: any[] } = { entries: {}, uploads: [] };
      let sha: string | undefined;

      const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/public/data/entries.json?ref=${branch}`, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${token}`
        }
      });

      if (getRes.ok) {
        const fileInfo = await getRes.json() as any;
        sha = fileInfo.sha;
        const decodedContent = atob(fileInfo.content.replace(/\n/g, ''));
        currentData = JSON.parse(decodedContent);
      }

      if (!currentData.entries) currentData.entries = {};
      currentData.entries[body.key] = {
        ...body.entry,
        updatedAt: new Date().toISOString()
      };

      // Base64 encode updated entries.json
      const utf8Bytes = new TextEncoder().encode(JSON.stringify(currentData, null, 2));
      let binary = '';
      utf8Bytes.forEach(byte => binary += String.fromCharCode(byte));
      const contentBase64 = btoa(binary);

      // Commit to GitHub
      const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/public/data/entries.json`, {
        method: 'PUT',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `chore(sync): aktualizacja wpisu ${body.key} z widokinaraj.pl`,
          content: contentBase64,
          branch,
          ...(sha ? { sha } : {})
        })
      });

      if (putRes.ok) {
        return new Response(
          JSON.stringify({ success: true, syncedToGitHub: true, entry: currentData.entries[body.key] }),
          { headers: corsHeaders }
        );
      } else {
        const errJson = await putRes.json().catch(() => ({}));
        return new Response(
          JSON.stringify({ success: false, error: errJson.message || 'Błąd zapisu w GitHub API' }),
          { status: 500, headers: corsHeaders }
        );
      }
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message || 'Błąd serwera podczas zapisywania wpisu.' }),
        { status: 500, headers: corsHeaders }
      );
    }
  }


  // Short URL Direct Redirect Endpoint /r/* (Instant 301 Redirect without ads)
  if (pathname.startsWith('/r/') || pathname === '/r') {
    const slug = pathname.replace(/^\/r\/?/i, '').trim().toLowerCase();
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

    const target = redirectsMap[slug] || url.searchParams.get('to') || 'https://widokinaraj.pl/#wnr365';
    return Response.redirect(target, 301);
  }

  // URL Shortening API endpoint (clck.ru - Free, instant direct redirect, 100% ad-free)
  if (pathname === '/api/shorten' && (request.method === 'GET' || request.method === 'POST')) {
    try {
      let targetUrl = '';
      if (request.method === 'GET') {
        targetUrl = url.searchParams.get('url') || '';
      } else {
        const body = await request.json() as { url?: string };
        targetUrl = body.url || '';
      }

      if (!targetUrl) {
        return new Response(
          JSON.stringify({ error: 'Brak parametru url' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Try clck.ru API (Direct 302 redirect, 0 ads, 0 preview pages)
      try {
        const clckRes = await fetch(`https://clck.ru/--?url=${encodeURIComponent(targetUrl)}`);
        if (clckRes.ok) {
          const shortUrl = await clckRes.text();
          if (shortUrl && shortUrl.startsWith('http')) {
            return new Response(
              JSON.stringify({ success: true, shortUrl: shortUrl.trim(), provider: 'clck.ru' }),
              { headers: corsHeaders }
            );
          }
        }
      } catch (err) {
        console.warn('clck.ru API failed in worker, trying is.gd:', err);
      }

      // Fallback: is.gd API
      try {
        const isGdRes = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(targetUrl.replace(/#.*$/, ''))}`);
        if (isGdRes.ok) {
          const data = await isGdRes.json() as { shorturl?: string };
          if (data.shorturl) {
            return new Response(
              JSON.stringify({ success: true, shortUrl: data.shorturl, provider: 'is.gd' }),
              { headers: corsHeaders }
            );
          }
        }
      } catch {}

      return new Response(
        JSON.stringify({ error: 'Nie udało się wygenerować skróconego linku przez żaden z serwisów bez reklam.' }),
        { status: 500, headers: corsHeaders }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message || 'Błąd serwera skracania URL' }),
        { status: 500, headers: corsHeaders }
      );
    }
  }

  // Text-To-Speech (TTS) Online AI Endpoint
  if (pathname === '/api/tts' && request.method === 'POST') {
    try {
      const body = await request.json() as {
        text?: string;
        voiceId?: string;
        lang?: string;
        rate?: number;
        pitch?: number;
      };

      const rawText = (body.text || '').trim();
      if (!rawText) {
        return new Response(
          JSON.stringify({ error: 'Brak tekstu do odczytania.' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const cleanText = rawText.substring(0, 1000);
      const targetLang = (body.lang || 'pl').toLowerCase();

      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${targetLang}&client=tw-ob`;
      const ttsRes = await fetch(ttsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (ttsRes.ok) {
        const audioBuffer = await ttsRes.arrayBuffer();
        return new Response(audioBuffer, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=86400'
          }
        });
      }

      return new Response(
        JSON.stringify({ error: 'Błąd generowania głosu TTS przez serwer.' }),
        { status: 500, headers: corsHeaders }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message || 'Błąd serwera TTS' }),
        { status: 500, headers: corsHeaders }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: 'Endpoint nie został znaleziony w Cloudflare Pages Functions.' }),
    { status: 404, headers: corsHeaders }
  );
};
