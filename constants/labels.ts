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
