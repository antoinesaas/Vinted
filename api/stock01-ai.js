// ============================================================
// Fonction serverless Vercel : proxy sécurisé vers OpenAI.
// La clé OPENAI_API_KEY reste dans les variables d'environnement
// Vercel (côté serveur), jamais dans l'app mobile.
//
// Endpoint : POST /api/stock01-ai
//   { action: "generate_description", article: {...} }  -> { description }
//   { action: "parse_screenshot", imageBase64, mimeType }
//       -> { title, brand, size, condition, type, price, currency }
//
// Aucune dépendance : utilise fetch natif de Node 18+.
// ============================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
// Secret partagé optionnel : si défini, l'app doit envoyer l'en-tête x-app-key.
const APP_SHARED_SECRET = process.env.APP_SHARED_SECRET || "";

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

// ---- Action 1 : génération de description Vinted ----------------
async function generateDescription(article) {
  const system =
    "Tu es un vendeur expert de vêtements d'occasion sur Vinted. " +
    "Tu écris des descriptions courtes, authentiques et vendeuses en français. " +
    "Tu réponds STRICTEMENT en JSON.";

  const user =
    "Génère une description Vinted pour ce produit :\n" +
    JSON.stringify(article) +
    "\n\nRéponds en JSON avec une seule clé \"description\" (chaîne unique) " +
    "structurée EXACTEMENT ainsi :\n" +
    "- Ligne 1 : \"[Marque] [type] taille [taille] — état [état]\"\n" +
    "- une ligne vide\n" +
    "- 1 à 2 phrases vendeuses, naturelles et VARIÉES, adaptées à la marque, " +
    "au type et à l'état\n" +
    "- une ligne vide\n" +
    "- exactement : \"Vendu sans retour. Questions bienvenues 👍\"\n" +
    "- une ligne vide\n" +
    "- 8 à 12 hashtags PERTINENTS déduits du produit (marque, type, style " +
    "vintage/streetwear/y2k selon le cas, taille), en minuscule, sans accent, " +
    "séparés par des espaces, chacun commençant par #.";

  const result = await callOpenAI(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    0.85,
  );
  return {
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
    res.status(400).json({ error: "Action inconnue." });
  } catch (err) {
    res.status(500).json({ error: (err && err.message) || String(err) });
  }
};
