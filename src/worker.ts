const FONT_KEYS = new Map([
  ["/fonts/soehne-leicht.woff2", "fonts/soehne-leicht.woff2"],
  ["/fonts/soehne-buch.woff2", "fonts/soehne-buch.woff2"],
  ["/fonts/soehne-kraftig.woff2", "fonts/soehne-kraftig.woff2"],
  ["/fonts/soehne-dreiviertelfett.woff2", "fonts/soehne-dreiviertelfett.woff2"],
  ["/fonts/soehne-mono-buch.woff2", "fonts/soehne-mono-buch.woff2"],
  ["/fonts/soehne-mono-halbfett.woff2", "fonts/soehne-mono-halbfett.woff2"],
  ["/fonts/soehne-mono-dreiviertelfett.woff2", "fonts/soehne-mono-dreiviertelfett.woff2"],
]);

const PRODUCTION_HOSTS = new Set(["omniwerx.io", "www.omniwerx.io"]);

function notFound(): Response {
  return new Response(null, { status: 404 });
}

function isSameOriginFontRequest(request: Request, url: URL): boolean {
  if (!PRODUCTION_HOSTS.has(url.hostname)) return false;

  if (request.headers.get("Sec-Fetch-Site") !== "same-origin") return false;
  if (request.headers.get("Sec-Fetch-Dest") !== "font") return false;

  const origin = request.headers.get("Origin");
  if (origin && origin !== url.origin) return false;

  const referer = request.headers.get("Referer");
  if (referer) {
    try {
      if (new URL(referer).origin !== url.origin) return false;
    } catch {
      return false;
    }
  }

  return true;
}

function responseHeaders(object: R2Object): Headers {
  const headers = new Headers();

  object.writeHttpMetadata(headers);
  headers.set("Content-Type", "font/woff2");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("ETag", object.httpEtag);

  return headers;
}

interface WorkerEnv extends Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith("/fonts/")) {
      return env.ASSETS.fetch(request);
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    const key = FONT_KEYS.get(url.pathname);

    if (
      !key ||
      env.ENVIRONMENT !== "production" ||
      !env.FONT_BUCKET ||
      !isSameOriginFontRequest(request, url)
    ) {
      return notFound();
    }

    if (request.method === "HEAD") {
      const object = await env.FONT_BUCKET.head(key);

      if (!object) return notFound();

      return new Response(null, {
        status: 200,
        headers: responseHeaders(object),
      });
    }

    const object = await env.FONT_BUCKET.get(key);

    if (!object) return notFound();

    return new Response(object.body, {
      status: 200,
      headers: responseHeaders(object),
    });
  },
} satisfies ExportedHandler<WorkerEnv>;
