// ============================================================
// Export CSV de l'historique des ventes (pour suivi Excel).
// Contient la liste des ventes + le tableau mensuel CA / bénéfice.
// Web : téléchargement direct dans le navigateur.
// Natif : fichier temporaire + feuille de partage.
// ============================================================

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { CONDITION_LABELS, resolveTypeLabel, STATUS_LABELS } from "../constants/labels";
import type { Article } from "../types";
import { netMargin } from "./calculations";
import { formatDate } from "./format";
import { monthlyBreakdown } from "./stats";

/** Échappe une valeur pour l'insérer dans une cellule CSV. */
function escapeCell(value: string | number): string {
  const str = String(value);
  // On protège les cellules contenant le séparateur, un guillemet ou un retour.
  if (/[";\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Transforme des lignes de cellules en texte CSV (séparateur `;`). */
function toCsvLines(rows: Array<Array<string | number>>): string {
  return rows.map((cols) => cols.map(escapeCell).join(";")).join("\n");
}

/**
 * Construit le contenu CSV : ventes détaillées + tableau mensuel CA/bénéfice.
 * Séparateur `;` + BOM UTF-8 pour une ouverture propre dans Excel FR.
 */
export function buildSalesCsv(sales: Article[]): string {
  // --- Section 1 : détail des ventes ---
  const salesRows: Array<Array<string | number>> = [
    [
      "Nom",
      "Marque",
      "Type",
      "Taille",
      "Etat",
      "Statut",
      "Prix achat (EUR)",
      "Prix vendu (EUR)",
      "Marge nette (EUR)",
      "Date de vente",
    ],
    ...sales.map((a): Array<string | number> => [
      a.name,
      a.brand,
      resolveTypeLabel(a),
      a.size,
      CONDITION_LABELS[a.condition],
      STATUS_LABELS[a.status],
      a.purchasePrice.toFixed(2),
      (a.soldPrice ?? 0).toFixed(2),
      netMargin(a.purchasePrice, a.soldPrice ?? 0).toFixed(2),
      a.soldAt ? formatDate(a.soldAt) : "",
    ]),
  ];

  // --- Section 2 : tableau mensuel CA / bénéfice ---
  const months = monthlyBreakdown(sales);
  const totalRevenue = months.reduce((s, m) => s + m.revenue, 0);
  const totalProfit = months.reduce((s, m) => s + m.profit, 0);
  const totalCount = months.reduce((s, m) => s + m.count, 0);

  const monthlyRows: Array<Array<string | number>> = [
    ["Mois", "Ventes", "CA (EUR)", "Benefice (EUR)"],
    ...months.map((m): Array<string | number> => [
      m.label,
      m.count,
      m.revenue.toFixed(2),
      m.profit.toFixed(2),
    ]),
    ["TOTAL", totalCount, totalRevenue.toFixed(2), totalProfit.toFixed(2)],
  ];

  const body = [toCsvLines(salesRows), "", toCsvLines(monthlyRows)].join("\n");

  return `﻿${body}`; // BOM en tête pour Excel
}

/** Déclenche un téléchargement de fichier dans le navigateur. */
function downloadInBrowser(csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "ventes-stock01.csv");
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  // Laisse le temps au navigateur de démarrer le téléchargement
  // avant de révoquer l'URL (certains navigateurs annulent sinon).
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
}

/** Navigator étendu avec l'API Web Share (partage de fichiers, niveau 2). */
interface ShareNavigator {
  canShare?: (data: { files: File[] }) => boolean;
  share?: (data: { files: File[]; title?: string }) => Promise<void>;
}

/**
 * Ouvre la feuille de partage native (mobile) pour choisir l'app cible
 * (Google Sheets, Drive, Mail…). Sur desktop / navigateurs sans support,
 * on retombe sur un téléchargement direct du fichier.
 */
async function shareOrDownload(csv: string): Promise<void> {
  const file = new File([csv], "ventes-stock01.csv", { type: "text/csv" });
  const nav = navigator as unknown as ShareNavigator;

  if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "Ventes Stock.01" });
      return;
    } catch (e) {
      // L'utilisateur a annulé le partage : ne pas déclencher de téléchargement.
      if (e instanceof Error && e.name === "AbortError") return;
      // Autre échec (app cible indisponible…) : repli sur le téléchargement.
    }
  }

  downloadInBrowser(csv);
}

/**
 * Exporte le CSV des ventes.
 * - Sur le web (mobile) : ouvre la feuille de partage native pour choisir
 *   l'app cible (Google Sheets, Drive…), avec repli sur un téléchargement
 *   direct si le partage de fichiers n'est pas supporté (desktop).
 * - Sur iOS/Android natif : écrit un fichier temporaire puis ouvre le
 *   partage natif.
 * Lève une erreur détaillée en cas d'échec (affichée par l'appelant).
 */
export async function exportSalesCsv(sales: Article[]): Promise<boolean> {
  const csv = buildSalesCsv(sales);

  if (Platform.OS === "web") {
    await shareOrDownload(csv);
    return true;
  }

  const uri = `${FileSystem.cacheDirectory}ventes-stock01.csv`;
  await FileSystem.writeAsStringAsync(uri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (!(await Sharing.isAvailableAsync())) {
    return false;
  }

  await Sharing.shareAsync(uri, {
    mimeType: "text/csv",
    dialogTitle: "Exporter les ventes",
    UTI: "public.comma-separated-values-text",
  });

  return true;
}
