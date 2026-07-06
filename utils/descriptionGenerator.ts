// ============================================================
// Générateur local d'annonce Vinted (hors-ligne) : titre + description.
// Description volontairement SIMPLE (factuelle, sans superlatifs)
// + un maximum de hashtags pertinents.
// ============================================================

import { CONDITION_LABELS, resolveTypeWord } from "../constants/labels";
import type { Article } from "../types";

/** Annonce générée : titre + description (même forme que l'IA). */
export interface GeneratedListing {
  title: string;
  description: string;
}

/**
 * 5 phrases d'accroche TRÈS simples qui alternent (selon le seed)
 * pour ne pas publier toujours exactement la même annonce.
 */
const SIMPLE_PHRASES: Array<
  (c: { brand: string; typeWord: string; size: string; condition: string }) => string
> = [
  (c) =>
    `${cap(c.typeWord)} ${c.brand} taille ${c.size}, état ${c.condition}.`,
  (c) =>
    `${c.brand} — ${c.typeWord} en taille ${c.size}. État ${c.condition}.`,
  (c) =>
    `${cap(c.typeWord)} ${c.brand}, taille ${c.size}. Très propre, état ${c.condition}.`,
  (c) =>
    `${cap(c.typeWord)} de la marque ${c.brand}, taille ${c.size}, état ${c.condition}. Envoi rapide.`,
  (c) =>
    `${c.brand} ${c.typeWord}, taille ${c.size}, état ${c.condition}. N'hésite pas à faire une offre.`,
];

/** Majuscule sur la première lettre. */
function cap(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Nettoie une valeur pour en faire un hashtag (minuscule, sans espace/accent). */
function toHashtag(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // ne garde que lettres/chiffres
}

/** Hashtags liés à l'état de la pièce. */
const CONDITION_TAGS: Record<Article["condition"], string[]> = {
  bon: ["bonetat"],
  tres_bon: ["tresbonetat", "commeneuf"],
  parfait: ["neuf", "etatparfait"],
};

/** Hashtags de style selon le type de pièce. */
const STYLE_TAGS: Record<Article["type"], string[]> = {
  tshirt: ["streetwear", "y2k", "casual", "haut"],
  short: ["ete", "sport", "casual", "summer"],
  veste: ["streetwear", "vintage", "outerwear", "jacket"],
  autre: ["streetwear", "vintage", "casual"],
};

/** Base générique toujours présente (visibilité maximale). */
const BASE_TAGS = [
  "vinted",
  "mode",
  "secondemain",
  "occasion",
  "friperie",
  "vintage",
  "fashion",
  "style",
  "look",
  "ootd",
  "tendance",
  "petitprix",
  "bonplan",
  "depotvente",
];

/** Construit la liste complète des hashtags (dédupliqués, ~20). */
function buildHashtags(article: Article): string {
  const typeWord = resolveTypeWord(article);
  const tags = [
    toHashtag(article.brand),
    toHashtag(typeWord),
    toHashtag(article.size) ? `taille${toHashtag(article.size)}` : "",
    toHashtag(article.size),
    ...CONDITION_TAGS[article.condition],
    ...STYLE_TAGS[article.type],
    ...BASE_TAGS,
  ].filter(Boolean);

  // Déduplication en conservant l'ordre.
  const unique = [...new Set(tags)];
  return unique.map((t) => `#${t}`).join(" ");
}

/**
 * Génère une annonce Vinted complète (titre + description simple).
 *
 * @param article  L'article concerné.
 * @param seed     Indice optionnel pour faire varier la phrase d'accroche.
 */
export function generateListing(
  article: Article,
  seed?: number,
): GeneratedListing {
  const typeWord = resolveTypeWord(article);
  const condition = CONDITION_LABELS[article.condition].toLowerCase();
  const brand = article.brand || "Sans marque";
  const size = article.size || "unique";

  // Titre court et efficace.
  const title = `${brand} ${typeWord} ${size} — état ${condition}`;

  // Phrase d'accroche simple (choisie par le seed ou au hasard).
  const index =
    seed !== undefined
      ? ((seed % SIMPLE_PHRASES.length) + SIMPLE_PHRASES.length) %
        SIMPLE_PHRASES.length
      : Math.floor(Math.random() * SIMPLE_PHRASES.length);
  const phrase = SIMPLE_PHRASES[index]!({
    brand,
    typeWord,
    size,
    condition,
  });

  const description = [
    phrase,
    "",
    "Vendu sans retour. Questions bienvenues 👍",
    "",
    buildHashtags(article),
  ].join("\n");

  return { title, description };
}
