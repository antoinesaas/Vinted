// ============================================================
// Types TypeScript stricts partagés dans toute l'application.
// ============================================================

/** Statut de vente d'un article. */
export type ArticleStatus = "en_vente" | "vendu" | "en_attente";

/** Type de pièce. */
export type ArticleType = "tshirt" | "short" | "veste" | "autre";

/** État / condition de la pièce. */
export type ArticleCondition = "bon" | "tres_bon" | "parfait";

/** Un article du stock. */
export interface Article {
  /** Identifiant unique (généré à la création). */
  id: string;
  /** Nom / titre libre de l'article (ex : "Sweat oversize"). */
  name: string;
  /** Marque (ex : "Nike"). */
  brand: string;
  /** Type de pièce. */
  type: ArticleType;
  /** Texte libre saisi quand `type` vaut "autre" (ex : "Salopette"). */
  customType: string;
  /** Couleur (ex : "Bleu marine"), optionnelle. */
  color: string;
  /** Matière (ex : "Coton", "Imperméable"), optionnelle. */
  material: string;
  /** Taille (ex : "M", "42", "L"). */
  size: string;
  /** État de la pièce. */
  condition: ArticleCondition;
  /** Prix d'achat payé (€). */
  purchasePrice: number;
  /** Prix de vente visé (€). */
  targetPrice: number;
  /** Statut courant. */
  status: ArticleStatus;
  /** URI locale de la photo (galerie / appareil photo), ou null. */
  photoUri: string | null;
  /** Date de création (ISO 8601). */
  createdAt: string;
  /** Date de vente (ISO 8601) ou null si non vendu. */
  soldAt: string | null;
  /** Prix réellement vendu (€) ou null. */
  soldPrice: number | null;
}

/**
 * Données saisies dans le formulaire d'ajout d'article.
 * (tout sauf les champs gérés automatiquement : id, statut, dates…)
 */
export type ArticleInput = Pick<
  Article,
  | "name"
  | "brand"
  | "type"
  | "customType"
  | "color"
  | "material"
  | "size"
  | "condition"
  | "purchasePrice"
  | "targetPrice"
  | "photoUri"
>;

/** Un point du graphique de bénéfice hebdomadaire. */
export interface WeeklyPoint {
  /** Libellé court affiché sous la barre (ex : "30/06"). */
  label: string;
  /** Bénéfice net de la semaine (€). */
  value: number;
}

/** Statistiques agrégées du mois affichées sur le dashboard. */
export interface MonthlyStats {
  /** Chiffre d'affaires du mois (€). */
  revenue: number;
  /** Bénéfice net du mois (€). */
  profit: number;
  /** Nombre de pièces vendues ce mois. */
  soldCount: number;
  /** Nombre de pièces en stock actif (en vente + en attente). */
  activeStockCount: number;
  /** Marge moyenne du mois (%). */
  averageMargin: number;
}
