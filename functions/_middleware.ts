export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const hostname = url.hostname.toLowerCase();

  // Redirect from custom domain (or old domains) to canonical https://wnr365.pages.dev/
  if (
    hostname === 'widokinaraj.pl' ||
    hostname === 'www.widokinaraj.pl' ||
    hostname === 'viewsofparadise.pl' ||
    hostname === 'www.viewsofparadise.pl'
  ) {
    const targetUrl = new URL(context.request.url);
    targetUrl.hostname = 'wnr365.pages.dev';
    targetUrl.protocol = 'https:';
    targetUrl.port = '';
    return Response.redirect(targetUrl.toString(), 301);
  }

  // Handle CORS preflight requests
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Execute downstream functions / static asset fetch
  const response = await context.next();

  // Create mutable response to inject CORS headers
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};

