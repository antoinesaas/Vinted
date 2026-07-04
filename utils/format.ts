// ============================================================
// Fonctions de formatage (affichage FR : euros, %, dates).
// ============================================================

/** Formate un montant en euros à la française : 12,40 €. */
export function formatEUR(amount: number): string {
  return `${amount.toFixed(2).replace(".", ",")} €`;
}

/** Formate un pourcentage arrondi : 64 %. */
export function formatPercent(value: number): string {
  return `${Math.round(value)} %`;
}

/** Formate une date ISO en JJ/MM/AAAA. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Formate une date ISO courte : JJ/MM. */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
}

/**
 * Convertit une saisie texte (avec virgule ou point) en nombre.
 * Retourne 0 si la saisie est vide ou invalide.
 */
export function parseAmount(input: string): number {
  const normalized = input.replace(",", ".").trim();
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}
