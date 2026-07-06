// ============================================================
// Générateur local d'annonce Vinted (hors-ligne) : titre + description.
// Format aligné sur les annonces Vinted réelles : titre riche en
// mots-clés (catégorie, matière, couleur, marque, taille), description
// à puces factuelle (authentique / taille / état / envoi), puis une
// ligne de hashtags qui catégorisent précisément le produit (pas de
// mots génériques type "mode"/"shopping"/"tendance").
// ============================================================

import { CONDITION_LABELS, resolveTypeWord } from "../constants/labels";
import type { Article } from "../types";

/** Annonce générée : titre + description (même forme que l'IA). */
export interface GeneratedListing {
  title: string;
  description: string;
}

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

/** Phrase d'état pour la puce "aucun défaut / [état]" de la description. */
const CONDITION_PHRASES: Record<Article["condition"], string> = {
  bon: "petites traces d'usure / bon état",
  tres_bon: "aucun défaut / très bon état",
  parfait: "jamais porté / état parfait",
};

/**
 * Construit un titre riche en mots-clés (référencement Vinted) :
 * type, matière, couleur, marque, taille — dans cet ordre, en ne gardant
 * que ce qui est renseigné.
 */
function buildTitle(article: Article): string {
  const typeWord = resolveTypeWord(article);
  const parts = [
    cap(typeWord),
    article.material?.trim(),
    article.brand?.trim(),
    article.color?.trim(),
  ].filter(Boolean);
  const title = parts.join(" ");
  return article.size ? `${title} - ${article.size}` : title;
}

/**
 * Hashtags strictement descriptifs du produit (marque, type, matière,
 * couleur, taille) : ils servent à catégoriser l'article sur Vinted,
 * pas à faire de la publicité générique.
 */
function buildHashtags(article: Article): string {
  const typeWord = resolveTypeWord(article);
  const tags = [
    toHashtag(article.brand),
    toHashtag(typeWord),
    toHashtag(article.material ?? ""),
    toHashtag(article.color ?? ""),
    toHashtag(article.size),
  ].filter(Boolean);

  // Déduplication en conservant l'ordre.
  const unique = [...new Set(tags)];
  return unique.map((t) => `#${t}`).join(" ");
}

/**
 * Génère une annonce Vinted complète (titre riche + description à puces).
 * @param article L'article concerné.
 */
export function generateListing(article: Article): GeneratedListing {
  const title = buildTitle(article);
  const condition = CONDITION_PHRASES[article.condition];
  const hasBrand = !!article.brand?.trim();

  const bullets = [
    hasBrand ? "- authentique" : null,
    article.size ? `- taille ${article.size}` : null,
    `- ${condition}`,
    "- Envoie en 24h ✅",
  ].filter((line): line is string => line !== null);

  const description = [
    title,
    ...bullets,
    "------------------",
    buildHashtags(article),
  ].join("\n");

  return { title, description };
}
