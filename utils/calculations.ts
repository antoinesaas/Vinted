// ============================================================
// Calculs de marge (cœur métier de l'application).
// ============================================================

import {
  BUYER_FEES_TOTAL,
  DEFAULT_PRICE_MULTIPLIER,
  RESALE_MULTIPLIER_THRESHOLDS,
  SACHET_FEE,
} from "../constants/config";

export { BUYER_FEES_TOTAL };

/**
 * Coût d'achat réel total = prix affiché de l'annonce + frais acheteur
 * forfaitaires (5 €). C'est ce montant qu'il faut utiliser comme base de
 * calcul de marge, pas le simple prix affiché.
 */
export function totalPurchaseCost(displayedPrice: number): number {
  if (displayedPrice <= 0) return 0;
  return Math.round((displayedPrice + BUYER_FEES_TOTAL) * 100) / 100;
}

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

/** Fourchette de prix d'achat conseillée. */
export interface PurchaseRange {
  /** Prix d'achat max pour un deal excellent (x2,5). */
  low: number;
  /** Prix d'achat max pour un deal cible (x2). */
  high: number;
  /** Prix d'achat max pour rester au minimum acceptable (x1,5). */
  max: number;
}

/**
 * À partir du prix de vente, calcule la fourchette de prix d'achat à ne pas
 * dépasser pour obtenir une marge convenable (cible x2-x2,5, plafond x1,5).
 */
export function recommendedPurchaseRange(sell: number): PurchaseRange {
  if (sell <= 0) return { low: 0, high: 0, max: 0 };
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    low: round(sell / RESALE_MULTIPLIER_THRESHOLDS.excellent),
    high: round(sell / RESALE_MULTIPLIER_THRESHOLDS.target),
    max: round(sell / RESALE_MULTIPLIER_THRESHOLDS.min),
  };
}
