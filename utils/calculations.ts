// ============================================================
// Calculs de marge (cœur métier de l'application).
// ============================================================

import {
  DEFAULT_PRICE_MULTIPLIER,
  RESALE_MULTIPLIER_THRESHOLDS,
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
 * Multiplicateur du prix d'achat : prix de vente ÷ prix d'achat.
 * Retourne 0 si le prix d'achat est nul (évite une division par zéro).
 */
export function resaleMultiplier(purchase: number, sell: number): number {
  if (purchase <= 0) return 0;
  return sell / purchase;
}

/**
 * Classe un deal selon le multiplicateur du prix d'achat :
 * - >= x2   -> "high"   (vert)   — cible x2 à x2,5
 * - x1,5-x2 -> "medium" (orange) — minimum acceptable
 * - < x1,5  -> "low"    (rouge)  — deal insuffisant
 */
export function multiplierLevel(multiplier: number): MarginLevel {
  if (multiplier >= RESALE_MULTIPLIER_THRESHOLDS.target) return "high";
  if (multiplier >= RESALE_MULTIPLIER_THRESHOLDS.min) return "medium";
  return "low";
}

/** Libellé qualitatif du deal selon le multiplicateur du prix d'achat. */
export function multiplierLabel(multiplier: number): string {
  if (multiplier >= RESALE_MULTIPLIER_THRESHOLDS.excellent) return "Excellent deal";
  if (multiplier >= RESALE_MULTIPLIER_THRESHOLDS.target) return "Bon deal";
  if (multiplier >= RESALE_MULTIPLIER_THRESHOLDS.min) return "Minimum acceptable";
  return "Deal insuffisant";
}
