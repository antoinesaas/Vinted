// ============================================================
// Persistance locale via AsyncStorage (100% offline).
// ============================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Article } from "../types";
import { notify } from "./alert";

/** Clé de stockage des articles. */
const ARTICLES_KEY = "@stock01:articles";

/** Charge la liste des articles depuis le stockage local. */
export async function loadArticles(): Promise<Article[]> {
  try {
    const raw = await AsyncStorage.getItem(ARTICLES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    // Garde-fou : on ne renvoie un tableau que si le format est correct.
    return Array.isArray(parsed) ? (parsed as Article[]) : [];
  } catch (error) {
    console.warn("[storage] Échec du chargement des articles :", error);
    return [];
  }
}

/**
 * Sauvegarde la liste complète des articles dans le stockage local.
 * En cas d'échec (ex : quota de stockage dépassé à cause de photos trop
 * lourdes), prévient l'utilisateur au lieu d'échouer silencieusement —
 * sinon les derniers ajouts semblent fonctionner puis disparaissent
 * mystérieusement au prochain rechargement de la page.
 */
export async function saveArticles(articles: Article[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ARTICLES_KEY, JSON.stringify(articles));
  } catch (error) {
    console.warn("[storage] Échec de la sauvegarde des articles :", error);
    void notify(
      "Échec de l'enregistrement",
      "Le stock n'a pas pu être sauvegardé (espace de stockage insuffisant, probablement à cause d'une photo trop lourde). Essaie avec une photo plus légère, ou libère de l'espace.",
    );
  }
}

/** Génère un identifiant unique simple (sans dépendance externe). */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
