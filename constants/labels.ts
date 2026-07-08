// ============================================================
// Libellés lisibles pour les valeurs typées (affichage FR).
// ============================================================

import type {
  ArticleCondition,
  ArticleStatus,
  ArticleType,
} from "../types";

export const STATUS_LABELS: Record<ArticleStatus, string> = {
  en_vente: "En vente",
  vendu: "Vendu",
  en_attente: "En attente",
};

export const TYPE_LABELS: Record<ArticleType, string> = {
  tshirt: "T-shirt",
  short: "Short",
  veste: "Veste",
  autre: "Autre",
};

export const CONDITION_LABELS: Record<ArticleCondition, string> = {
  bon: "Bon",
  tres_bon: "Très bon",
  parfait: "Parfait",
};

/** Mot employé dans les phrases de description Vinted (au singulier). */
export const TYPE_WORDS: Record<ArticleType, string> = {
  tshirt: "t-shirt",
  short: "short",
  veste: "veste",
  autre: "pièce",
};

/** Article minimal nécessaire pour résoudre le libellé du type. */
type TypeSource = { type: ArticleType; customType?: string };

/**
 * Libellé affiché du type de pièce : le texte libre saisi si `type` vaut
 * "autre" (ex : "Salopette"), sinon le libellé standard ("T-shirt"...).
 */
export function resolveTypeLabel(source: TypeSource): string {
  if (source.type === "autre" && source.customType?.trim()) {
    return source.customType.trim();
  }
  return TYPE_LABELS[source.type];
}

/**
 * Mot utilisé dans les phrases/hashtags générés : le texte libre (en
 * minuscule) si `type` vaut "autre", sinon le mot standard ("t-shirt"...).
 */
export function resolveTypeWord(source: TypeSource): string {
  if (source.type === "autre" && source.customType?.trim()) {
    return source.customType.trim().toLowerCase();
  }
  return TYPE_WORDS[source.type];
}
