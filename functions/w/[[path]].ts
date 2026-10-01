interface Env {
  GITHUB_OWNER?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
}

type PagesFunctionContext<E = any> = { request: Request; env: E };

export const onRequest: any = async (context: PagesFunctionContext<Env>) => {
  const { request } = context;
  const url = new URL(request.url);
  
  // Path format e.g. /w/1/tekst or /w/1/yt or /w/1
  const rawPath = url.pathname.replace(/^\/+/, ''); // e.g. "w/1/tekst"
  const parts = rawPath.split('/').filter(Boolean); // ["w", "1", "tekst"]

  const domain = 'https://widokinaraj.pl';

  if (parts.length >= 2) {
    const dayNum = parseInt(parts[1], 10);
    const subview = parts[2] ? parts[2].toLowerCase() : 'tekst';

    if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 366) {
      if (subview === 'yt' || subview === 'youtube' || subview === 'audio') {
        return Response.redirect(`${domain}/#wnr365/dzien-${dayNum}/yt`, 302);
      }
      return Response.redirect(`${domain}/#wnr365/dzien-${dayNum}`, 302);
    }
  }

  return Response.redirect(`${domain}/#wnr365`, 302);
};
