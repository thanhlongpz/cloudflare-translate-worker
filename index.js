const TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "Content-Type, X-API-Key",
    },
  });
}

function isAuthorized(request, env) {
  if (!env.API_KEY) return true;
  return request.headers.get("X-API-Key") === env.API_KEY;
}

async function translateText(text, source, target) {
  const params = new URLSearchParams({
    client: "gtx",
    sl: source || "auto",
    tl: target || "vi",
    dt: "t",
    q: text,
  });

  const response = await fetch(`${TRANSLATE_URL}?${params}`, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "application/json,text/plain,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Google returned HTTP ${response.status}`);
  }

  const data = await response.json();
  const translated = (data?.[0] || [])
    .filter((item) => Array.isArray(item) && item[0])
    .map((item) => item[0])
    .join("")
    .trim();

  if (!translated) throw new Error("Google returned an empty translation");

  return {
    original: text,
    translated,
    source: data?.[2] || source || "auto",
    target: target || "vi",
  };
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return json({}, 204);

    const url = new URL(request.url);

    if (!isAuthorized(request, env)) {
      return json({ detail: "Unauthorized" }, 401);
    }

    if (url.pathname === "/" || url.pathname === "/health") {
      return json({ status: "ok", service: "cloudflare-translate-worker" });
    }

    if (url.pathname !== "/translate") {
      return json({ detail: "Not found" }, 404);
    }

    try {
      let text;
      let source;
      let target;

      if (request.method === "GET") {
        text = url.searchParams.get("text");
        source = url.searchParams.get("src") || "auto";
        target = url.searchParams.get("dest") || "vi";
      } else if (request.method === "POST") {
        const body = await request.json();
        text = body.text;
        source = body.src || body.source || "auto";
        target = body.dest || body.target || "vi";
      } else {
        return json({ detail: "Method not allowed" }, 405);
      }

      if (typeof text !== "string" || text.trim().length === 0) {
        return json({ detail: "text is required" }, 400);
      }

      if (text.length > 15000) {
        return json({ detail: "text must be 15000 characters or less" }, 400);
      }

      return json(await translateText(text, source, target));
    } catch (error) {
      return json({ detail: `Translation failed: ${error.message}` }, 502);
    }
  },
};
