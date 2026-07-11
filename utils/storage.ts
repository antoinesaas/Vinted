// ============================================================
// Persistance locale via AsyncStorage (100% offline).
// ============================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Article } from "../types";
import { notify } from "./alert";
import { idbGet, idbSet } from "./idbStore";

/** Clé de stockage des articles. */
const ARTICLES_KEY = "@stock01:articles";
/** Marque la migration ponctuelle depuis l'ancien stockage (localStorage). */
const MIGRATION_FLAG_KEY = "@stock01:migratedToIndexedDB";

// Bascule vers AsyncStorage/localStorage si IndexedDB s'avère indisponible
// (ex : certains modes de navigation privée). Désactivé au premier échec.
let useIndexedDb = true;

/**
 * Migration ponctuelle : les articles vivaient dans localStorage (quota de
 * quelques Mo par origine, insuffisant dès qu'on accumule des photos), ce
 * qui faisait échouer TOUTE sauvegarde une fois le quota dépassé — même un
 * simple changement de prix, puisqu'il faut réécrire le tableau entier à
 * chaque fois. IndexedDB n'a pas cette limite pratique.
 */
async function migrateFromLegacyStorage(): Promise<void> {
  const migrated = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
  if (migrated) return;
  const legacyRaw = await AsyncStorage.getItem(ARTICLES_KEY);
  if (legacyRaw) {
    await idbSet(ARTICLES_KEY, legacyRaw);
    await AsyncStorage.removeItem(ARTICLES_KEY);
  }
  await AsyncStorage.setItem(MIGRATION_FLAG_KEY, "1");
}

/** Charge la liste des articles depuis le stockage local. */
export async function loadArticles(): Promise<Article[]> {
  if (useIndexedDb) {
    try {
      await migrateFromLegacyStorage();
      const raw = await idbGet(ARTICLES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as Article[]) : [];
    } catch (error) {
      console.warn(
        "[storage] IndexedDB indisponible, repli sur AsyncStorage :",
        error,
      );
      useIndexedDb = false;
    }
  }
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
  const json = JSON.stringify(articles);

  if (useIndexedDb) {
    try {
      await idbSet(ARTICLES_KEY, json);
      return;
    } catch (error) {
      console.warn(
        "[storage] IndexedDB indisponible, repli sur AsyncStorage :",
        error,
      );
      useIndexedDb = false;
    }
  }

  try {
    await AsyncStorage.setItem(ARTICLES_KEY, json);
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
