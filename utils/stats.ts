// ============================================================
// Agrégation des statistiques (dashboard, historique).
// ============================================================

import { RELIST_THRESHOLD_DAYS } from "../constants/config";
import type { Article, MonthlyStats, WeeklyPoint } from "../types";
import { netMargin } from "./calculations";
import { formatShortDate } from "./format";

/** Article vendu : `soldAt` et `soldPrice` sont garantis non nuls. */
export type SoldArticle = Article & { soldAt: string; soldPrice: number };

/** Retourne uniquement les articles vendus (avec date et prix de vente). */
export function soldArticles(articles: Article[]): SoldArticle[] {
  return articles.filter(
    (a): a is SoldArticle =>
      a.status === "vendu" && a.soldAt !== null && a.soldPrice !== null,
  );
}

/** Vrai si deux dates tombent dans le même mois calendaire. */
function isSameMonth(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
  );
}

/**
 * Calcule les statistiques du mois de référence (par défaut : mois courant).
 */
export function computeMonthlyStats(
  articles: Article[],
  reference: Date = new Date(),
): MonthlyStats {
  const sold = soldArticles(articles);

  // Ventes du mois de référence.
  const soldThisMonth = sold.filter((a) =>
    isSameMonth(new Date(a.soldAt), reference),
  );

  const revenue = soldThisMonth.reduce((sum, a) => sum + a.soldPrice, 0);
  const profit = soldThisMonth.reduce(
    (sum, a) => sum + netMargin(a.purchasePrice, a.soldPrice),
    0,
  );

  // Stock actif = tout ce qui n'est pas encore vendu.
  const activeStockCount = articles.filter(
    (a) => a.status !== "vendu",
  ).length;

  // Marge moyenne = bénéfice / CA (0 si aucune vente).
  const averageMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return {
    revenue,
    profit,
    soldCount: soldThisMonth.length,
    activeStockCount,
    averageMargin,
  };
}

/**
 * Bénéfice net par semaine sur les `weeks` dernières semaines
 * (la plus ancienne en premier, pour le graphique en barres).
 */
export function weeklyProfit(
  articles: Article[],
  weeks = 6,
  reference: Date = new Date(),
): WeeklyPoint[] {
  const sold = soldArticles(articles);
  const points: WeeklyPoint[] = [];

  const DAY = 24 * 60 * 60 * 1000;
  const WEEK = 7 * DAY;

  // Début de la semaine courante (lundi 00:00).
  const startOfWeek = new Date(reference);
  const dayOfWeek = (startOfWeek.getDay() + 6) % 7; // lundi = 0
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(startOfWeek.getTime() - i * WEEK);
    const weekEnd = new Date(weekStart.getTime() + WEEK);

    const value = sold
      .filter((a) => {
        const d = new Date(a.soldAt);
        return d >= weekStart && d < weekEnd;
      })
      .reduce((sum, a) => sum + netMargin(a.purchasePrice, a.soldPrice), 0);

    points.push({
      label: formatShortDate(weekStart.toISOString()),
      value: Math.round(value * 100) / 100,
    });
  }

  return points;
}

/** Ligne du tableau mensuel : CA et bénéfice d'un mois donné. */
export interface MonthlyRow {
  /** Clé de tri (ex : "2026-07"). */
  key: string;
  /** Libellé affiché (ex : "Juillet 2026"). */
  label: string;
  /** Nombre de ventes du mois. */
  count: number;
  /** Chiffre d'affaires du mois (€). */
  revenue: number;
  /** Bénéfice net du mois (€). */
  profit: number;
}

/**
 * Tableau récapitulatif par mois (CA + bénéfice), du plus récent au
 * plus ancien. Ne contient que les mois ayant au moins une vente.
 */
export function monthlyBreakdown(articles: Article[]): MonthlyRow[] {
  const rows = new Map<string, MonthlyRow>();

  for (const a of soldArticles(articles)) {
    const d = new Date(a.soldAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    let row = rows.get(key);
    if (!row) {
      const label = d.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });
      row = {
        key,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        count: 0,
        revenue: 0,
        profit: 0,
      };
      rows.set(key, row);
    }

    row.count += 1;
    row.revenue += a.soldPrice;
    row.profit += netMargin(a.purchasePrice, a.soldPrice);
  }

  return [...rows.values()].sort((x, y) => y.key.localeCompare(x.key));
}

/** Total cumulé du bénéfice net depuis le début de l'activité. */
export function totalLifetimeProfit(articles: Article[]): number {
  return soldArticles(articles).reduce(
    (sum, a) => sum + netMargin(a.purchasePrice, a.soldPrice),
    0,
  );
}

/** Total cumulé du chiffre d'affaires depuis le début. */
export function totalLifetimeRevenue(articles: Article[]): number {
  return soldArticles(articles).reduce((sum, a) => sum + a.soldPrice, 0);
}

/** Nombre de jours écoulés depuis une date ISO (arrondi à l'inférieur). */
export function daysSince(iso: string, reference: Date = new Date()): number {
  const DAY = 24 * 60 * 60 * 1000;
  return Math.floor((reference.getTime() - new Date(iso).getTime()) / DAY);
}

/**
 * Vrai si l'article est en vente depuis plus de `RELIST_THRESHOLD_DAYS`
 * jours (3 semaines) sans avoir trouvé preneur : à republier pour regagner
 * en visibilité sur Vinted.
 */
export function needsRelist(article: Article, reference: Date = new Date()): boolean {
  return (
    article.status === "en_vente" &&
    daysSince(article.createdAt, reference) >= RELIST_THRESHOLD_DAYS
  );
}

/** Articles à republier (en vente depuis plus de 3 semaines). */
export function articlesToRelist(articles: Article[]): Article[] {
  return articles.filter((a) => needsRelist(a));
}
