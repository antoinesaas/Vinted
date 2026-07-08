// ============================================================
// Constantes métier (règles de calcul).
// ============================================================

/** Frais fixes d'un sachet d'expédition (€), déduits de chaque marge nette. */
export const SACHET_FEE = 0.4;

/**
 * Frais payés par l'ACHETEUR en plus du prix affiché d'une annonce Vinted :
 * protection acheteur (~2 €) + livraison (~3,5 €, fourchette 3-4 €).
 * À ajouter au prix affiché pour obtenir le coût d'achat réel total
 * (utile quand on achète soi-même une pièce sur Vinted pour la revendre).
 */
export const BUYER_PROTECTION_FEE = 2;
export const BUYER_SHIPPING_FEE = 3.5;

/**
 * Nombre de jours après lesquels une pièce toujours "en vente" est
 * considérée comme à republier (remonter l'annonce augmente sa visibilité).
 */
export const RELIST_THRESHOLD_DAYS = 21; // 3 semaines

/** Multiplicateur par défaut : prix de vente conseillé = prix d'achat × 2,2. */
export const DEFAULT_PRICE_MULTIPLIER = 2.2;

/**
 * Seuils du multiplicateur (prix de vente ÷ prix d'achat) pour l'indicateur
 * visuel du calculateur : cible x2 à x2,5, minimum acceptable x1,5.
 */
export const RESALE_MULTIPLIER_THRESHOLDS = {
  /** En dessous : deal insuffisant (rouge). */
  min: 1.5,
  /** Au-dessus (ou égal) : bon deal (vert). Entre min et target : orange. */
  target: 2,
  /** Au-dessus (ou égal) : deal excellent (libellé uniquement, même couleur). */
  excellent: 2.5,
} as const;
