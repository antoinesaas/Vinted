// ============================================================
// Constantes métier (règles de calcul).
// ============================================================

/** Frais fixes d'un sachet d'expédition (€), déduits de chaque marge nette. */
export const SACHET_FEE = 0.4;

/** Multiplicateur par défaut : prix de vente conseillé = prix d'achat × 2,2. */
export const DEFAULT_PRICE_MULTIPLIER = 2.2;

/** Seuils de marge (%) pour l'indicateur visuel du calculateur. */
export const MARGIN_THRESHOLDS = {
  /** Au-dessus : marge "excellente" (vert). */
  high: 50,
  /** Au-dessus : marge "correcte" (orange). En dessous : faible (rouge). */
  medium: 30,
} as const;
