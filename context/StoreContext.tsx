// ============================================================
// Contexte global : source unique de vérité pour les articles.
// Charge au démarrage depuis AsyncStorage, persiste à chaque changement.
// ============================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Article, ArticleInput } from "../types";
import {
  generateId,
  loadArticles,
  saveArticles,
} from "../utils/storage";

/** API exposée par le store aux écrans. */
interface StoreContextValue {
  /** Tous les articles (triés du plus récent au plus ancien). */
  articles: Article[];
  /** Vrai tant que le chargement initial n'est pas terminé. */
  loading: boolean;
  /** Ajoute un nouvel article et le renvoie. */
  addArticle: (input: ArticleInput) => Article;
  /** Met à jour partiellement un article existant. */
  updateArticle: (id: string, patch: Partial<Article>) => void;
  /** Supprime un article. */
  deleteArticle: (id: string) => void;
  /** Marque un article comme vendu (prix vendu = prix visé par défaut). */
  markAsSold: (id: string, soldPrice?: number) => void;
  /** Récupère un article par son identifiant. */
  getArticle: (id: string) => Article | undefined;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

/** Fournisseur du store, à placer à la racine de l'application. */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Chargement initial depuis le stockage local.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await loadArticles();
      if (mounted) {
        setArticles(stored);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Persistance automatique dès que la liste change (après le 1er chargement).
  useEffect(() => {
    if (!loading) {
      void saveArticles(articles);
    }
  }, [articles, loading]);

  const addArticle = useCallback((input: ArticleInput): Article => {
    const article: Article = {
      ...input,
      id: generateId(),
      status: "en_vente",
      createdAt: new Date().toISOString(),
      soldAt: null,
      soldPrice: null,
    };
    // Ajout en tête (le plus récent d'abord).
    setArticles((prev) => [article, ...prev]);
    return article;
  }, []);

  const updateArticle = useCallback(
    (id: string, patch: Partial<Article>) => {
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      );
    },
    [],
  );

  const deleteArticle = useCallback((id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const markAsSold = useCallback((id: string, soldPrice?: number) => {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "vendu",
              soldAt: new Date().toISOString(),
              // Par défaut on retient le prix de vente visé.
              soldPrice: soldPrice ?? a.targetPrice,
            }
          : a,
      ),
    );
  }, []);

  const getArticle = useCallback(
    (id: string) => articles.find((a) => a.id === id),
    [articles],
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      articles,
      loading,
      addArticle,
      updateArticle,
      deleteArticle,
      markAsSold,
      getArticle,
    }),
    [
      articles,
      loading,
      addArticle,
      updateArticle,
      deleteArticle,
      markAsSold,
      getArticle,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

/** Hook d'accès au store. Lève une erreur si utilisé hors du provider. */
export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore doit être utilisé dans un <StoreProvider>.");
  }
  return ctx;
}
