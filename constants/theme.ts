// ============================================================
// Palette de couleurs (pour les contextes hors `className`,
// ex : barres de navigation, icônes, graphiques).
// Thème noir & blanc strict.
// ============================================================

export const colors = {
  background: "#FFFFFF", // fond blanc pur
  surface: "#F2F2F7", // fonds légers
  text: "#1C1C1E", // texte principal noir
  textMuted: "#8E8E93", // texte secondaire gris
  border: "#E5E5EA", // séparateurs
  black: "#000000", // CTA / accent
  white: "#FFFFFF",
  // Indicateur de marge (calculateur uniquement)
  success: "#34C759",
  warning: "#FF9500",
  danger: "#FF3B30",
} as const;

/** Ombre iOS légère réutilisable pour les cartes. */
export const cardShadow = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2, // Android (fallback)
} as const;
