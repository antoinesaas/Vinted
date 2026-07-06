// ============================================================
// Fonction serverless Vercel : proxy sécurisé vers OpenAI + recherche
// de prix de revente réels sur Vinted.
// La clé OPENAI_API_KEY reste dans les variables d'environnement
// Vercel (côté serveur), jamais dans l'app mobile.
//
// Endpoint : POST /api/stock01-ai
//   { action: "generate_description", article: {...} }  -> { description }
//   { action: "parse_screenshot", imageBase64, mimeType }
//       -> { title, brand, size, condition, type, price, currency }
//   { action: "estimate_resale_price", brand, typeWord, size, condition }
//       -> { averagePrice, medianPrice, lowPrice, highPrice, sampleSize,
//            currency, source: "vinted_search" | "ai_estimate", note }
//
// Aucune dépendance : utilise fetch natif de Node 18+.
// ============================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
// Secret partagé optionnel : si défini, l'app doit envoyer l'en-tête x-app-key.
const APP_SHARED_SECRET = process.env.APP_SHARED_SECRET || "";

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** Appel OpenAI Chat Completions (mode JSON strict). `content` peut être
 *  une chaîne ou un tableau multimodal (texte + image) pour la vision. */
async function callOpenAI(messages, temperature) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      temperature,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content);
}

// ---- Action 1 : génération de titre + description Vinted --------
async function generateDescription(article) {
  const system =
    "Tu es un vendeur expert de vêtements d'occasion sur Vinted. " +
    "Tu écris des annonces SIMPLES et efficaces en français. " +
    "Tu réponds STRICTEMENT en JSON.";

  const user =
    "Génère une annonce Vinted pour ce produit :\n" +
    JSON.stringify(article) +
    '\n\nRéponds en JSON avec DEUX clés :\n' +
    '- "title" : le titre de l\'annonce, court et efficace ' +
    '(format : "Marque type taille — état", ex : "Nike t-shirt M — très bon état")\n' +
    '- "description" : structurée EXACTEMENT ainsi :\n' +
    "  * 1 à 2 phrases TRÈS SIMPLES et factuelles (marque, type, taille, " +
    "état — pas de superlatifs, pas de storytelling, style direct)\n" +
    "  * une ligne vide\n" +
    '  * exactement : "Vendu sans retour. Questions bienvenues 👍"\n' +
    "  * une ligne vide\n" +
    "  * 18 à 25 hashtags pertinents (marque, type, taille, état, style " +
    "vintage/streetwear/y2k/casual selon le cas, mots génériques : vinted, " +
    "mode, secondemain, occasion, friperie, fashion, look, style, ootd, " +
    "tendance), en minuscule, sans accent, séparés par des espaces, " +
    "chacun commençant par #.";

  const result = await callOpenAI(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    0.7,
  );
  return {
    title: typeof result.title === "string" ? result.title : "",
    description:
      typeof result.description === "string" ? result.description : "",
  };
}

// ---- Action 2 : analyse d'une capture d'écran Vinted (vision) ----
async function parseScreenshot(imageBase64, mimeType) {
  if (typeof imageBase64 !== "string" || imageBase64.length < 100) {
    return { _status: 400, error: "Capture d'écran manquante ou invalide." };
  }
  const type = mimeType || "image/jpeg";

  const system =
    "Tu analyses la capture d'écran d'une annonce de vêtement sur Vinted " +
    "et tu en extrais les informations produit. Tu réponds STRICTEMENT en JSON valide.";

  const userText =
    "Analyse cette capture d'écran d'une annonce Vinted et renvoie un JSON " +
    "avec ces clés :\n" +
    '- "title": titre court de l\'article\n' +
    '- "brand": marque ("" si inconnue)\n' +
    '- "size": taille (ex: "M", "42", "" si inconnue)\n' +
    '- "price": prix affiché de l\'article, en nombre (le prix vendeur, PAS le ' +
    'total "protection acheteurs")\n' +
    '- "currency": code devise (ex: "EUR")\n' +
    '- "type": une valeur parmi "tshirt", "short", "veste", "autre"\n' +
    '- "condition": une valeur parmi "bon", "tres_bon", "parfait" ' +
    "(neuf/neuf sans étiquette/très bon état -> \"parfait\" ou \"tres_bon\" ; " +
    'bon état -> "bon" ; satisfaisant -> "bon").';

  const result = await callOpenAI(
    [
      { role: "system", content: system },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          {
            type: "image_url",
            image_url: { url: `data:${type};base64,${imageBase64}` },
          },
        ],
      },
    ],
    0.2,
  );

  const price =
    typeof result.price === "number"
      ? result.price
      : Number.parseFloat(String(result.price ?? "")) || null;

  return {
    title: result.title ?? "",
    brand: result.brand ?? "",
    size: result.size ?? "",
    condition: result.condition ?? "tres_bon",
    type: result.type ?? "autre",
    price,
    currency: result.currency ?? "EUR",
  };
}

// ---- Action 3 : recherche du prix de revente réel sur Vinted ----

// Statuts Vinted (texte affiché) correspondant à chacun de nos états.
const CONDITION_MATCH = {
  bon: ["bon état", "satisfaisant"],
  tres_bon: ["très bon état"],
  parfait: ["neuf avec étiquette", "neuf sans étiquette"],
};

/** fetch avec timeout, pour ne pas dépasser la limite d'exécution serverless. */
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Construit un en-tête Cookie à partir des Set-Cookie d'une réponse. */
function cookieHeaderFromResponse(res) {
  const raw =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [res.headers.get("set-cookie")].filter(Boolean);
  return raw.map((c) => c.split(";")[0]).join("; ");
}

/** Ouvre une session anonyme Vinted (cookies) nécessaire pour interroger l'API. */
async function openVintedSession() {
  const res = await fetchWithTimeout(
    "https://www.vinted.fr/",
    {
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        "Accept-Language": "fr-FR,fr;q=0.9",
      },
    },
    8000,
  );
  if (!res.ok) {
    throw new Error(`Session Vinted indisponible (${res.status}).`);
  }
  return cookieHeaderFromResponse(res);
}

/** Recherche des annonces comparables sur Vinted et renvoie leurs prix (EUR). */
async function searchVintedListings(cookie, query) {
  const url = `https://www.vinted.fr/api/v2/catalog/items?search_text=${encodeURIComponent(query)}&per_page=40&order=relevance`;
  const res = await fetchWithTimeout(
    url,
    {
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "fr-FR,fr;q=0.9",
        Referer: `https://www.vinted.fr/catalog?search_text=${encodeURIComponent(query)}`,
        Origin: "https://www.vinted.fr",
        "X-Requested-With": "XMLHttpRequest",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
        Cookie: cookie,
      },
    },
    8000,
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Recherche Vinted indisponible (${res.status}). ${body.slice(0, 200)}`,
    );
  }
  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/** Estimation de repli par l'IA (utilisée si la recherche Vinted échoue). */
async function aiFallbackEstimate(brand, typeWord, size, condition) {
  const system =
    "Tu es un expert de la revente de vêtements d'occasion sur Vinted France. " +
    "Tu connais les prix RÉELLEMENT PRATIQUÉS sur la plateforme (les articles " +
    "s'y vendent bien moins cher qu'en boutique). Tu estimes des prix de " +
    "revente RÉALISTES et PRUDENTS. Tu réponds STRICTEMENT en JSON.";
  const user =
    `Estime le prix de revente réaliste sur Vinted France pour : ` +
    `${brand} ${typeWord} taille ${size}, état ${condition}.\n\n` +
    "Repères des prix réellement pratiqués sur Vinted (à ajuster selon la pièce) :\n" +
    "- Fast fashion (Shein, Primark, H&M, Zara, Kiabi...) : 3-12 €\n" +
    "- Marques sport/mid (Nike, Adidas, Puma, Levi's, Jack&Jones...) : t-shirt 8-18 €, short 8-20 €, veste 15-40 €\n" +
    "- Marques premium (Ralph Lauren, Tommy Hilfiger, Lacoste, Carhartt...) : t-shirt 15-30 €, veste 30-70 €\n" +
    "- Pièces vintage/rares recherchées : peuvent dépasser ces fourchettes\n" +
    "Ajustements : état \"bon\" -20 à -30 % ; état \"parfait\"/neuf +20 à +30 % ; " +
    "reste PRUDENT : sur Vinted les acheteurs négocient et les prix affichés " +
    "sont souvent au-dessus des prix de vente réels.\n\n" +
    'Réponds en JSON avec 3 clés numériques : "price" (prix de vente réaliste), ' +
    '"low" (bas de fourchette), "high" (haut de fourchette).';

  const result = await callOpenAI(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    0.2,
  );
  const price = typeof result.price === "number" ? result.price : null;
  const low = typeof result.low === "number" ? result.low : price;
  const high = typeof result.high === "number" ? result.high : price;
  return {
    averagePrice: price,
    medianPrice: price,
    lowPrice: low,
    highPrice: high,
    sampleSize: 0,
    currency: "EUR",
    source: "ai_estimate",
    note: "Recherche Vinted indisponible : estimation IA calée sur les prix réellement pratiqués (approximative).",
  };
}

async function estimateResalePrice({ brand, typeWord, size, condition }) {
  const query = [brand, typeWord].filter(Boolean).join(" ").trim();
  if (!query) {
    return { _status: 400, error: "Marque ou type manquant pour la recherche." };
  }

  try {
    const cookie = await openVintedSession();
    const items = await searchVintedListings(cookie, query);

    // Ne garde que des prix numériques valides.
    const priced = items
      .map((it) => ({
        price: Number.parseFloat(it?.price?.amount),
        sizeTitle: String(it?.size_title || "").toLowerCase(),
        status: String(it?.status || "").toLowerCase(),
      }))
      .filter((it) => Number.isFinite(it.price) && it.price > 0);

    if (priced.length === 0) {
      const fallback = await aiFallbackEstimate(brand, typeWord, size, condition);
      return fallback;
    }

    // Filtrage souple par taille puis par état, seulement si l'échantillon
    // filtré reste assez grand pour être représentatif.
    let sample = priced;
    if (size) {
      const sizeLower = size.toLowerCase();
      const bySize = priced.filter((it) =>
        it.sizeTitle
          .split("/")
          .map((s) => s.trim())
          .some((s) => s === sizeLower || s.includes(sizeLower)),
      );
      if (bySize.length >= 3) sample = bySize;
    }
    if (condition && CONDITION_MATCH[condition]) {
      const wanted = CONDITION_MATCH[condition];
      const byCondition = sample.filter((it) =>
        wanted.some((w) => it.status.includes(w)),
      );
      if (byCondition.length >= 3) sample = byCondition;
    }

    const prices = sample.map((it) => it.price);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

    return {
      averagePrice: Math.round(avg * 100) / 100,
      medianPrice: Math.round(median(prices) * 100) / 100,
      lowPrice: Math.round(Math.min(...prices) * 100) / 100,
      highPrice: Math.round(Math.max(...prices) * 100) / 100,
      sampleSize: prices.length,
      currency: "EUR",
      source: "vinted_search",
      note: `Basé sur ${prices.length} annonce(s) comparable(s) actuellement en ligne sur Vinted.`,
    };
  } catch (err) {
    // Vinted a bloqué/échoué (anti-bot, indisponibilité...) : repli IA.
    const fallback = await aiFallbackEstimate(brand, typeWord, size, condition);
    fallback.note = `${(err && err.message) || "Recherche Vinted indisponible"} — ${fallback.note}`;
    return fallback;
  }
}

/** Lit et parse le corps JSON de la requête. */
async function readJson(req) {
  if (req.body !== undefined && req.body !== null) {
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

module.exports = async (req, res) => {
  // CORS.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "content-type, x-app-key, authorization",
  );
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(200).end("ok");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Méthode non autorisée." });
    return;
  }
  if (!OPENAI_API_KEY) {
    res
      .status(500)
      .json({ error: "OPENAI_API_KEY absente (variable d'environnement Vercel)." });
    return;
  }
  if (APP_SHARED_SECRET && req.headers["x-app-key"] !== APP_SHARED_SECRET) {
    res.status(401).json({ error: "Clé d'application invalide." });
    return;
  }

  let payload;
  try {
    payload = await readJson(req);
  } catch {
    res.status(400).json({ error: "Corps JSON invalide." });
    return;
  }

  try {
    if (payload.action === "generate_description") {
      res.status(200).json(await generateDescription(payload.article || {}));
      return;
    }
    if (payload.action === "parse_screenshot") {
      const result = await parseScreenshot(payload.imageBase64, payload.mimeType);
      const status = result._status || 200;
      delete result._status;
      res.status(status).json(result);
      return;
    }
    if (payload.action === "estimate_resale_price") {
      const result = await estimateResalePrice({
        brand: payload.brand || "",
        typeWord: payload.typeWord || "",
        size: payload.size || "",
        condition: payload.condition || "tres_bon",
      });
      const status = result._status || 200;
      delete result._status;
      res.status(status).json(result);
      return;
    }
    res.status(400).json({ error: "Action inconnue." });
  } catch (err) {
    res.status(500).json({ error: (err && err.message) || String(err) });
  }
};
