interface Env {
  GITHUB_OWNER?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
}

type PagesFunctionContext<E = any> = { request: Request; env: E };

export const onRequest: any = async (context: PagesFunctionContext<Env>) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathKey = url.pathname.toLowerCase().replace(/\/$/, ''); // e.g. "/z/1" or "/z/52"

  // 1. Static redirect map matching public/_redirects
  const redirectMap: Record<string, string> = {
    '/z/1': 'https://youtu.be/kFdLgWrUt10?si=MtS86vPE4ddts2Am',
    '/z/2': 'https://youtu.be/u3HeJFrO1T0?si=O17L_9HqsYDcnMhM',
    '/z/3': 'https://youtu.be/Tfk4P7T8fBI?si=cHR7r5WHtJNZeBxA',
    '/z/4': 'https://youtu.be/VbcLWGoP1I4?si=QwQaHUpxyTGSP-c5',
    '/z/5': 'https://youtu.be/JmKLT59cTIc?si=GQ35JNj00945b_ru',
    '/z/6': 'https://youtu.be/ruqyxb6NLHg?si=qZ58mr4lvRBGSGvU',
    '/z/7': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/jing-jang.jpg',
    '/z/8': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/RGB-model-1.jpg',
    '/z/9': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/wszystko2.png',
    '/z/10': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/wiosna.png',
    '/z/11': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/lato.png',
    '/z/12': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/jesien.png',
    '/z/13': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/zima.png',
    '/z/14': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/wszystko2.png',
    '/z/15': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/diament2.png',
    '/z/16': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/nieskonczonosc.jpg',
    '/z/17': 'https://youtu.be/Nj5IK_nU4hs?si=YOhmdPemmhwC5CUO',
    '/z/18': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/farby-swiatlo.png',
    '/z/19': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/wiosna2.png',
    '/z/20': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/lato2.png',
    '/z/21': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/jesien2.png',
    '/z/22': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/zima2.png',
    '/z/23': 'https://symulacja-rgb-zmiany.deejaykey32.workers.dev',
    '/z/24': 'https://youtu.be/8QKboVU6aCo?si=wSBxGyrEdFvqaRMR',
    '/z/25': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/gwiazda-dawida.jpg',
    '/z/26': 'https://youtu.be/lKVgoT3JsRE?si=D-OmYREfEAVRgxeS',
    '/z/27': 'https://youtu.be/DXmNOQea3Ao?si=nmfqpcGUaHw8wfGj',
    '/z/28': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/wszystko2.png',
    '/z/29': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/gwiazda-dawida.jpg',
    '/z/30': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/gwiazda-dawida-zielony.png',
    '/z/31': 'https://www.youtube.com/watch?v=l-vOVXNR-00&list=PLOrIokJN_wIc',
    '/z/32': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/znak.gif',
    '/z/33': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/gwiazda-dawida-zielony.png',
    '/z/34': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/prezentacja-RGB-CMY.png',
    '/z/35': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/Jezus-i-piotr-z-kluczami.jpg',
    '/z/36': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/ombw.jpg',
    '/z/37': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/stworzenie-pieklo.jpg',
    '/z/38': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/wspolnota_ruch_szensztacki.jpg',
    '/z/39': 'https://youtu.be/BoohNb-BPPw?si=YRlYB6zSEXrYWwHM',
    '/z/40': 'https://youtu.be/a3fSfbKxOgo?si=wX2tLmzfeF2vToZM',
    '/z/41': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/tecza.png',
    '/z/42': 'https://www.youtube.com/watch?v=OwNvCpArm5E&list=PLcPaLNnBwMFQ&index=4',
    '/z/43': 'https://www.youtube.com/watch?v=zEQwkuKxcuQ',
    '/z/44': 'https://youtu.be/UVzD7WHOBUo?si=Xg-MMvb3Am-wVux0',
    '/z/45': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/medalik.jpg',
    '/z/46': 'https://www.youtube.com/watch?v=RbcUefsAnkw&list=PLzN0kNSY0xP60qNQEu56lM-xxelUROq59',
    '/z/47': 'https://youtu.be/pJEk5WbPZww?si=Z1HBc_Mx1SPCq5X2',
    '/z/48': 'https://www.youtube.com/watch?v=ra_A7JFrcQo&list=PLYkw_r77Ylneot8xKPw1ILrjQ19gsCEI_',
    '/z/49': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/Generuj_pynn_animacj_202602091656.gif',
    '/z/50': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/symbol2.gif',
    '/z/51': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/symbol3.gif',
    '/z/52': 'https://youtu.be/-GbWAqXosdo?si=WrUo0Vj8s1kwQvh-',
    '/z/53': 'https://youtu.be/PeQeFT3hjMs?si=GtrUrPoej3IWi6pg',
    '/z/54': 'https://raw.githubusercontent.com/deejaykey32-star/embik365/refs/heads/main/public/pliki/Obraz-milosierdzia-bozego-dla-swiata-calego--e3_zg6t.jpg',
    '/z/55': 'https://youtu.be/CfadZa96V-s?si=2BSqZzlgVqe8k8uQ',
    '/z/56': 'https://youtu.be/4bWamvu4luA?si=XORBGbGzFW1dZO_l',
    '/z/57': 'https://wnr365.pages.dev/klepsydra',
    '/z/klepsydra': '/klepsydra'
  };

  const target = redirectMap[pathKey];
  if (target) {
    return Response.redirect(target, 301);
  }

  // 2. Dynamic fetch from public/_redirects raw GitHub if available
  try {
    const owner = env?.GITHUB_OWNER || 'deejaykey32-star';
    const repo = env?.GITHUB_REPO || 'embik365';
    const branch = env?.GITHUB_BRANCH || 'main';
    const rawRedirectsUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/public/_redirects`;
    
    const res = await fetch(rawRedirectsUrl);
    if (res.ok) {
      const text = await res.text();
      const lines = text.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2 && parts[0].toLowerCase() === pathKey) {
          const fetchedTarget = parts[1];
          const statusCode = parseInt(parts[2] || '301', 10);
          return Response.redirect(fetchedTarget, statusCode as any);
        }
      }
    }
  } catch {}

  return new Response('Nie znaleziono przekierowania dla podanego kodu QR.', { status: 404 });
};
