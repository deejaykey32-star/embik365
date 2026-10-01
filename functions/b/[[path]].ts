interface Env {
  GITHUB_OWNER?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
}

type PagesFunctionContext<E = any> = { request: Request; env: E };

export const onRequest: any = async (context: PagesFunctionContext<Env>) => {
  const { request } = context;
  const url = new URL(request.url);
  
  // Path format e.g. /b/1 or /b/1460
  const rawPath = url.pathname.replace(/^\/+/, ''); // e.g. "b/1"
  const slug = rawPath.replace(/^b\/?/i, '').trim();

  const domain = 'https://widokinaraj.pl';

  if (slug) {
    const dayNum = parseInt(slug, 10);
    if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 1460) {
      return Response.redirect(`${domain}/#biblia365/dzien-${dayNum}`, 302);
    }
  }

  return Response.redirect(`${domain}/#biblia365`, 302);
};
