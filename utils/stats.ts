// ============================================================
// Agrégation des statistiques (dashboard, historique).
// ============================================================

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
