interface Env {
  GEMINI_API_KEY?: string;
  GITHUB_TOKEN?: string;
  GITHUB_OWNER?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
  ASSETS?: { fetch: (req: Request) => Promise<Response> };
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

      if (!env.GEMINI_API_KEY) {
        return new Response(
          JSON.stringify({
            error: 'Brak klucza GEMINI_API_KEY w zmiennych środowiskowych Cloudflare Pages.',
            useFallback: true
          }),
          { status: 503, headers: corsHeaders }
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
        const errText = await geminiRes.text();
        return new Response(
          JSON.stringify({ error: `Błąd API Gemini: ${errText}` }),
          { status: 500, headers: corsHeaders }
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

  // URL Shortening API endpoint (TinyURL / clck.ru - Free, instant 301 redirect, no ads)
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

      // Try TinyURL API
      try {
        const tinyRes = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(targetUrl)}`);
        if (tinyRes.ok) {
          const shortUrl = await tinyRes.text();
          if (shortUrl && shortUrl.startsWith('http')) {
            return new Response(
              JSON.stringify({ success: true, shortUrl: shortUrl.trim(), provider: 'TinyURL' }),
              { headers: corsHeaders }
            );
          }
        }
      } catch (err) {
        console.warn('TinyURL API failed in worker, trying clck.ru:', err);
      }

      // Fallback: clck.ru API
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

      return new Response(
        JSON.stringify({ error: 'Nie udało się wygenerować skróconego linku przez żadną z usług API.' }),
        { status: 500, headers: corsHeaders }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message || 'Błąd serwera skracania URL' }),
        { status: 500, headers: corsHeaders }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: 'Endpoint nie został znaleziony w Cloudflare Pages Functions.' }),
    { status: 404, headers: corsHeaders }
  );
};
