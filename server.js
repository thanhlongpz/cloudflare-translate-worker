import express from "express";

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

const TRANSLATE_URL =
  "https://translate.googleapis.com/translate_a/single";

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "cloud-run-translate-backend",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
  });
});

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
      Accept: "application/json,text/plain,*/*",
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

  if (!translated) {
    throw new Error("Google returned an empty translation");
  }

  return {
    original: text,
    translated,
    source: data?.[2] || source || "auto",
    target: target || "vi",
  };
}

app.get("/translate", async (req, res) => {
  const text = req.query.text;
  const source = req.query.src || "auto";
  const target = req.query.dest || "vi";

  if (!text || typeof text !== "string") {
    return res.status(400).json({
      detail: "Query parameter text is required",
    });
  }

  if (text.length > 15000) {
    return res.status(400).json({
      detail: "text must be 15000 characters or less",
    });
  }

  try {
    const result = await translateText(text, source, target);
    return res.json(result);
  } catch (error) {
    return res.status(502).json({
      detail: `Translation failed: ${error.message}`,
    });
  }
});

app.post("/translate", async (req, res) => {
  const text = req.body?.text;
  const source = req.body?.src || req.body?.source || "auto";
  const target = req.body?.dest || req.body?.target || "vi";

  if (!text || typeof text !== "string") {
    return res.status(400).json({
      detail: "JSON field text is required",
    });
  }

  try {
    const result = await translateText(text, source, target);
    return res.json(result);
  } catch (error) {
    return res.status(502).json({
      detail: `Translation failed: ${error.message}`,
    });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
