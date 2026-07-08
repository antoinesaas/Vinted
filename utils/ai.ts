// ============================================================
// Client de l'Edge Function "stock01-ai" (proxy OpenAI + parsing Vinted).
// Toutes les fonctions échouent proprement si l'IA n'est pas configurée,
// pour préserver le fonctionnement offline de l'app.
// ============================================================

import { AI_API_URL, AI_APP_KEY, isAiConfigured } from "../constants/aiConfig";
import { resolveTypeWord } from "../constants/labels";
import type { Article, ArticleCondition, ArticleType } from "../types";

export { isAiConfigured };

/** Erreur levée quand le proxy IA n'est pas configuré. */
export class AiNotConfiguredError extends Error {
  constructor() {
    super(
      "IA non configurée. Renseigne AI_API_URL dans constants/aiConfig.ts.",
    );
    this.name = "AiNotConfiguredError";
  }
}

/** Appel bas niveau de la fonction serverless (proxy IA). */
async function callFunction<T>(body: Record<string, unknown>): Promise<T> {
  if (!isAiConfigured()) {
    throw new AiNotConfiguredError();
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  // Secret partagé optionnel (si configuré côté serveur).
  if (AI_APP_KEY) {
    headers["x-app-key"] = AI_APP_KEY;
  }

  const res = await fetch(AI_API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      (data.error as string) ?? `Erreur ${res.status} du proxy IA.`,
    );
  }
  return data as T;
}

/** Annonce Vinted générée : titre + description. */
export interface Listing {
  title: string;
  description: string;
}

/** Génère un titre + une description Vinted via l'IA. */
export async function generateAiListing(article: Article): Promise<Listing> {
  return callFunction<Listing>({
    action: "generate_description",
    article: {
      name: article.name,
      brand: article.brand,
      // Mot résolu (gère le type "autre" avec un libellé personnalisé).
      type: resolveTypeWord(article),
      color: article.color,
      material: article.material,
      size: article.size,
      condition: article.condition,
    },
  });
}

/** Résultat de l'analyse d'une capture d'écran d'annonce. */
export interface ProductParseResult {
  title: string;
  brand: string;
  size: string;
  condition: ArticleCondition;
  type: ArticleType;
  /** Couleur détectée sur la photo ("" si indéterminée). */
  color: string;
  /** Matière détectée sur la photo ("" si indéterminée). */
  material: string;
  price: number | null;
  currency: string;
}

/**
 * Analyse une capture d'écran d'annonce Vinted (vision) et renvoie les
 * attributs détectés.
 * @param imageBase64 Image encodée en base64 (sans le préfixe data:).
 * @param mimeType    Type MIME de l'image (ex : "image/jpeg").
 */
export async function parseScreenshot(
  imageBase64: string,
  mimeType: string,
): Promise<ProductParseResult> {
  return callFunction<ProductParseResult>({
    action: "parse_screenshot",
    imageBase64,
    mimeType,
  });
}

/** Résultat de l'estimation du prix de revente réel. */
export interface ResalePriceResult {
  /** Prix de vente moyen réaliste (ce que tu peux espérer RECEVOIR). */
  averagePrice: number | null;
  medianPrice: number | null;
  lowPrice: number | null;
  highPrice: number | null;
  /**
   * Prix à AFFICHER sur l'annonce : moyenne + marge de négociation (~5 €),
   * pour négocier depuis un prix plus haut tout en visant `averagePrice`.
   */
  listingPrice: number | null;
  /** Nombre d'annonces comparables utilisées (0 si estimation IA de repli). */
  sampleSize: number;
  currency: string;
  /** "vinted_search" = moyenne d'annonces réelles ; "ai_estimate" = repli IA. */
  source: "vinted_search" | "ai_estimate";
  note: string;
}

/**
 * Recherche le prix de revente réel d'un produit à partir d'annonces
 * comparables actuellement en ligne sur Vinted (avec repli sur une
 * estimation IA si la recherche échoue).
 *
 * @param typeWord Mot du type déjà résolu (voir `resolveTypeWord`), pour
 *                 que la recherche fonctionne aussi avec un type "autre"
 *                 personnalisé.
 */
export async function estimateResalePrice(
  brand: string,
  typeWord: string,
  size: string,
  condition: ArticleCondition,
): Promise<ResalePriceResult> {
  return callFunction<ResalePriceResult>({
    action: "estimate_resale_price",
    brand,
    typeWord,
    size,
    condition,
  });
}
