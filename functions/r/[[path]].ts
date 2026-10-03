interface Env {
  GITHUB_OWNER?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
}

type PagesFunctionContext<E = any> = { request: Request; env: E };
type LocalPagesFunction<E = any> = (context: PagesFunctionContext<E>) => Promise<Response> | Response;

export const onRequest: LocalPagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // Extract slug from path e.g. /r/1, /r/wstep, /r/koronka, /r/pkg_ai_1789597375413
  const rawPath = url.pathname.replace(/^\/+/, ''); // e.g. "r/1"
  const slug = decodeURIComponent(rawPath.replace(/^r\/?/i, '').trim()).toLowerCase();

  const staticMap: Record<string, string> = {
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
    'bio365': 'https://widokinaraj.pl/#bio365',
    'grafika': 'https://widokinaraj.pl/#grafika',
    'media': 'https://widokinaraj.pl/#grafika',
    'zasoby': 'https://widokinaraj.pl/#grafika',
    'uploads': 'https://widokinaraj.pl/#grafika',
    'galeria': 'https://widokinaraj.pl/#grafika',
    'materialy': 'https://widokinaraj.pl/#grafika',
    'farby': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/main/src/pliki/farby%2B%C5%9Bwiat%C5%82o.png',
    'farby-swiatlo': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/main/src/pliki/farby%2B%C5%9Bwiat%C5%82o.png',
    'aistudio': 'https://widokinaraj.pl/grafika/aistudio',
    'ai-studio': 'https://widokinaraj.pl/grafika/aistudio',
    'pkg_gemini_solar_system': 'https://widokinaraj.pl/grafika/aistudio#paczka/pkg_gemini_solar_system',
    'pkg_ai_1789593893001': 'https://widokinaraj.pl/grafika/aistudio#paczka/pkg_ai_1789593893001',
    'pkg_ai_1789597375413': 'https://widokinaraj.pl/grafika/aistudio#paczka/pkg_ai_1789597375413',
    'klepsydra': 'https://widokinaraj.pl/klepsydra',
    'symulacja': 'https://widokinaraj.pl/klepsydra',
    'klepsydra3d': 'https://wnr365.pages.dev/klepsydra3D',
    'klepsydra3D': 'https://wnr365.pages.dev/klepsydra3D',
    'piramidy3d': 'https://wnr365.pages.dev/piramidy3D',
    'piramidy3D': 'https://wnr365.pages.dev/piramidy3D',
    'piramidy': 'https://wnr365.pages.dev/piramidy3D'
  };

  let target = staticMap[slug] || url.searchParams.get('to');

  if (!target && slug) {
    if (slug === 'wstep' || slug === 'intro') {
      target = 'https://widokinaraj.pl/#rhz365/wstep';
    } else if (slug === 'koronka') {
      target = 'https://widokinaraj.pl/#rhz365/koronka';
    } else {
      const dayNum = parseInt(slug, 10);
      if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 366) {
        target = `https://widokinaraj.pl/#rhz365/dzien-${dayNum}`;
      }
    }
  }

  if (!target && slug) {
    try {
      const owner = env.GITHUB_OWNER || 'deejaykey32-star';
      const repo = env.GITHUB_REPO || 'embik365';
      const branch = env.GITHUB_BRANCH || 'main';
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/public/data/entries.json`;
      const dataRes = await fetch(`${rawUrl}?t=${Date.now()}`);
      if (dataRes.ok) {
        const dbData = await dataRes.json() as any;
        if (Array.isArray(dbData.qrCodes)) {
          const match = dbData.qrCodes.find((q: any) =>
            (q.id && q.id.toLowerCase() === slug) ||
            (q.id && q.id.toLowerCase() === `qr_${slug}`) ||
            (q.id && q.id.toLowerCase().includes(slug)) ||
            (q.sectionId && q.sectionId.toLowerCase() === slug)
          );
          if (match && match.fullUrl && !match.fullUrl.includes('/r/pkg_ai_')) {
            target = match.fullUrl;
          }
        }
      }
    } catch {}
  }

  if (!target || target.includes('/r/pkg_ai_')) {
    target = 'https://widokinaraj.pl/grafika/aistudio';
  }

  return Response.redirect(target, 302);
};
