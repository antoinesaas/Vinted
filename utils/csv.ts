// ============================================================
// Export CSV de l'historique des ventes (pour suivi Excel).
// ============================================================

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import { CONDITION_LABELS, STATUS_LABELS, TYPE_LABELS } from "../constants/labels";
import type { Article } from "../types";
import { netMargin } from "./calculations";
import { formatDate } from "./format";

/** Échappe une valeur pour l'insérer dans une cellule CSV. */
function escapeCell(value: string | number): string {
  const str = String(value);
  // On protège les cellules contenant le séparateur, un guillemet ou un retour.
  if (/[";\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Construit le contenu CSV des ventes.
 * Séparateur `;` + BOM UTF-8 pour une ouverture propre dans Excel FR.
 */
export function buildSalesCsv(sales: Article[]): string {
  const header = [
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
  ];

  const rows = sales.map((a) => [
    a.name,
    a.brand,
    TYPE_LABELS[a.type],
    a.size,
    CONDITION_LABELS[a.condition],
    STATUS_LABELS[a.status],
    a.purchasePrice.toFixed(2),
    (a.soldPrice ?? 0).toFixed(2),
    netMargin(a.purchasePrice, a.soldPrice ?? 0).toFixed(2),
    a.soldAt ? formatDate(a.soldAt) : "",
  ]);

  const lines = [header, ...rows]
    .map((cols) => cols.map(escapeCell).join(";"))
    .join("\n");

  return `﻿${lines}`; // BOM en tête pour Excel
}

/**
 * Écrit le CSV dans un fichier temporaire puis ouvre la feuille de partage iOS.
 * Retourne false si le partage n'est pas disponible.
 */
export async function exportSalesCsv(sales: Article[]): Promise<boolean> {
  const csv = buildSalesCsv(sales);
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
