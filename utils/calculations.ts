// ============================================================
// Calculs de marge (cœur métier de l'application).
// ============================================================

import {
  DEFAULT_PRICE_MULTIPLIER,
  MARGIN_THRESHOLDS,
  SACHET_FEE,
} from "../constants/config";

/** Niveau de qualité d'une marge (pour l'indicateur visuel). */
export type MarginLevel = "high" | "medium" | "low";

/** Marge brute = prix de vente - prix d'achat. */
export function grossMargin(purchase: number, sell: number): number {
  return sell - purchase;
}

/** Marge nette = prix de vente - prix d'achat - frais de sachet (0,40 €). */
export function netMargin(purchase: number, sell: number): number {
  return sell - purchase - SACHET_FEE;
}

/**
 * Pourcentage de marge (marge nette rapportée au prix de vente).
 * Retourne 0 si le prix de vente est nul.
 */
export function marginPercent(purchase: number, sell: number): number {
  if (sell <= 0) return 0;
  return (netMargin(purchase, sell) / sell) * 100;
}

/** Prix de vente conseillé = prix d'achat × multiplicateur (2,2 par défaut). */
export function recommendedPrice(
  purchase: number,
  multiplier: number = DEFAULT_PRICE_MULTIPLIER,
): number {
  return Math.round(purchase * multiplier * 100) / 100;
}

/**
 * Classe une marge selon les seuils métier :
 * - > 50 %  -> "high"   (vert)
 * - 30-50 % -> "medium" (orange)
 * - < 30 %  -> "low"    (rouge)
 */
export function marginLevel(percent: number): MarginLevel {
  if (percent > MARGIN_THRESHOLDS.high) return "high";
  if (percent >= MARGIN_THRESHOLDS.medium) return "medium";
  return "low";
}
