// ============================================================
// Générateur de description Vinted.
// 5 templates de phrases qui alternent pour varier les annonces.
// ============================================================

import { CONDITION_LABELS, TYPE_WORDS } from "../constants/labels";
import type { Article } from "../types";

/** Mots d'ambiance choisis selon le type de pièce (pour varier le style). */
const STYLE_WORDS: Record<Article["type"], string[]> = {
  tshirt: ["streetwear", "vintage", "décontracté", "y2k"],
  short: ["estival", "sportif", "décontracté", "streetwear"],
  veste: ["vintage", "streetwear", "intemporel", "casual"],
  autre: ["tendance", "unique", "vintage", "streetwear"],
};

/**
 * Les 5 templates de phrase. Chacun reçoit le contexte de l'article
 * (marque, mot du type, taille, état, mot de style) et renvoie une phrase.
 */
type PhraseContext = {
  brand: string;
  typeWord: string;
  size: string;
  condition: string;
  style: string;
};

const PHRASE_TEMPLATES: Array<(c: PhraseContext) => string> = [
  (c) =>
    `Superbe ${c.typeWord} ${c.brand}, un indispensable pour un look ${c.style}. En état ${c.condition}, prêt à être porté.`,
  (c) =>
    `${c.brand} au style intemporel : ce ${c.typeWord} taille ${c.size} s'accorde avec tout et reste en état ${c.condition}.`,
  (c) =>
    `Pièce ${c.style} signée ${c.brand}. ${c.typeWord.charAt(0).toUpperCase() + c.typeWord.slice(1)} très agréable à porter, condition ${c.condition}, idéal pour compléter ta garde-robe.`,
  (c) =>
    `Coup de cœur : ${c.typeWord} ${c.brand} en taille ${c.size}. Qualité au rendez-vous, état ${c.condition}, parfait pour un style qui sort du lot.`,
  (c) =>
    `Ne passe pas à côté de ce ${c.typeWord} ${c.brand} ! Look ${c.style} garanti, pièce en état ${c.condition}, taille ${c.size}.`,
];

/** Nettoie une marque pour en faire un hashtag (minuscule, sans espace/accent). */
function toHashtag(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // ne garde que lettres/chiffres
}

/**
 * Génère une description Vinted complète pour un article.
 *
 * @param article  L'article concerné.
 * @param seed     Indice de template optionnel (0-4). Si absent, choix aléatoire.
 *                 Permet de "régénérer" en faisant varier la phrase.
 */
export function generateDescription(article: Article, seed?: number): string {
  const typeWord = TYPE_WORDS[article.type];
  const condition = CONDITION_LABELS[article.condition].toLowerCase();
  const styles = STYLE_WORDS[article.type];

  // Sélection du template et du mot de style (aléatoire ou piloté par `seed`).
  const templateIndex =
    seed !== undefined
      ? ((seed % PHRASE_TEMPLATES.length) + PHRASE_TEMPLATES.length) %
        PHRASE_TEMPLATES.length
      : Math.floor(Math.random() * PHRASE_TEMPLATES.length);
  const style =
    styles[
      seed !== undefined
        ? seed % styles.length
        : Math.floor(Math.random() * styles.length)
    ] ?? "tendance";

  const phrase = PHRASE_TEMPLATES[templateIndex]!({
    brand: article.brand || "Sans marque",
    typeWord,
    size: article.size || "unique",
    condition,
    style,
  });

  // Titre : [Marque] [type] [taille] — état [état]
  const title = `${article.brand || "Article"} ${typeWord} ${article.size} — état ${condition}`;

  // Hashtags dynamiques.
  const hashtags = [
    "#vintage",
    `#${toHashtag(article.brand) || "mode"}`,
    "#streetwear",
    `#${toHashtag(typeWord)}`,
    `#${toHashtag(article.size) || "taille"}`,
    "#vinted",
    "#secondemain",
    "#mode",
    "#y2k",
    "#tendance",
  ].join(" ");

  return [
    title,
    "",
    phrase,
    "",
    "Vendu sans retour. Questions bienvenues 👍",
    "",
    hashtags,
  ].join("\n");
}
