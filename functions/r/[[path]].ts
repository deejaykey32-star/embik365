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
    'info': 'https://wnr365.pages.dev/#info365',
    'info365': 'https://wnr365.pages.dev/#info365',
    'wnr': 'https://wnr365.pages.dev/#wnr365',
    'wnr365': 'https://wnr365.pages.dev/#wnr365',
    'rhz': 'https://wnr365.pages.dev/#rhz365',
    'rhz365': 'https://wnr365.pages.dev/#rhz365',
    'biblia': 'https://wnr365.pages.dev/#biblia365',
    'biblia365': 'https://wnr365.pages.dev/#biblia365',
    'ebook-wnr': 'https://wnr365.pages.dev/#ebook_wnr',
    'ebook_wnr': 'https://wnr365.pages.dev/#ebook_wnr',
    'ebook-rhz': 'https://wnr365.pages.dev/#ebook_rhz',
    'ebook_rhz': 'https://wnr365.pages.dev/#ebook_rhz',
    'ebook-nowyrhz': 'https://wnr365.pages.dev/#ebook_nowyrhz',
    'ebook_nowyrhz': 'https://wnr365.pages.dev/#ebook_nowyrhz',
    'ebook-nowy-rhz': 'https://wnr365.pages.dev/#ebook_nowyrhz',
    'ebook-biblia': 'https://wnr365.pages.dev/#ebook_biblia',
    'ebook_biblia': 'https://wnr365.pages.dev/#ebook_biblia',
    'bio': 'https://wnr365.pages.dev/#bio365',
    'bio365': 'https://wnr365.pages.dev/#bio365',
    'grafika': 'https://wnr365.pages.dev/#grafika',
    'media': 'https://wnr365.pages.dev/#grafika',
    'zasoby': 'https://wnr365.pages.dev/#grafika',
    'uploads': 'https://wnr365.pages.dev/#grafika',
    'galeria': 'https://wnr365.pages.dev/#grafika',
    'materialy': 'https://wnr365.pages.dev/#grafika',
    'farby': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/main/src/pliki/farby%2B%C5%9Bwiat%C5%82o.png',
    'farby-swiatlo': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/main/src/pliki/farby%2B%C5%9Bwiat%C5%82o.png',
    'aistudio': 'https://wnr365.pages.dev/grafika/aistudio',
    'ai-studio': 'https://wnr365.pages.dev/grafika/aistudio',
    'pkg_gemini_solar_system': 'https://wnr365.pages.dev/grafika/aistudio#paczka/pkg_gemini_solar_system',
    'pkg_ai_1789593893001': 'https://wnr365.pages.dev/grafika/aistudio#paczka/pkg_ai_1789593893001',
    'pkg_ai_1789597375413': 'https://wnr365.pages.dev/grafika/aistudio#paczka/pkg_ai_1789597375413',
    'klepsydra': '/klepsydra',
    'symulacja': '/klepsydra',
    'klepsydra3d': '/klepsydra3D',
    'klepsydra3D': '/klepsydra3D',
    'piramidy3d': '/piramidy3D',
    'piramidy3D': '/piramidy3D',
    'piramidy': '/piramidy3D',
    'model-8': '/model-8',
    'model8': '/model-8',
    'model-3d-8': '/model-8',
    'siec': '/siec',
    'radio': '/radio',
    'radio-nowyrhz': '/radio?stacja=nowyrhz',
    'radio-wnr365': '/radio?stacja=wnr365',
    'radio-biblia365': '/radio?stacja=biblia365',
    'radio-rhz365': '/radio?stacja=rhz365',
    'nowyrhz': '/nowyrhz/',
    'nowy-rhz': '/nowyrhz/'
  };

  let target = staticMap[slug] || url.searchParams.get('to');

  if (!target && slug) {
    if (slug === 'wstep' || slug === 'intro') {
      target = 'https://wnr365.pages.dev/#rhz365/wstep';
    } else if (slug === 'koronka') {
      target = 'https://wnr365.pages.dev/#rhz365/koronka';
    } else {
      const dayNum = parseInt(slug, 10);
      if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 366) {
        target = `https://wnr365.pages.dev/#rhz365/dzien-${dayNum}`;
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
