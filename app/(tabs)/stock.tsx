// ÉCRAN 2 — STOCK : liste filtrable des articles, actions explicites.
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, View } from "react-native";

import { ArticleCard } from "../../components/ArticleCard";
import { EmptyState } from "../../components/EmptyState";
import { Fab } from "../../components/Fab";
import { Header } from "../../components/Header";
import { Screen } from "../../components/Screen";
import {
  SegmentedControl,
  type SegmentOption,
} from "../../components/SegmentedControl";
import { useStore } from "../../context/StoreContext";
import type { Article, ArticleStatus } from "../../types";
import { confirmAction, promptAmount } from "../../utils/alert";
import { needsRelist } from "../../utils/stats";
import { useNow } from "../../utils/useNow";

// Options du filtre : "all" + les trois statuts + "à republier".
type FilterValue = "all" | ArticleStatus | "a_republier";

const FILTERS: SegmentOption<FilterValue>[] = [
  { label: "Tous", value: "all" },
  { label: "En vente", value: "en_vente" },
  { label: "En attente", value: "en_attente" },
  { label: "Vendu", value: "vendu" },
  { label: "À republier", value: "a_republier" },
];

export default function StockScreen() {
  const router = useRouter();
  const { articles, markAsSold, deleteArticle } = useStore();
  // Filtre initial optionnel via l'URL (ex : lien "à republier" du dashboard).
  const params = useLocalSearchParams<{ filter?: string }>();
  const [filter, setFilter] = useState<FilterValue>(
    params.filter === "a_republier" ? "a_republier" : "all",
  );
  // Date "vivante" (voir dashboard) pour que le filtre/badge "à republier"
  // ne reste jamais figé si l'app reste ouverte plusieurs jours.
  const now = useNow();

  // Application du filtre de statut (ou du filtre spécial "à republier").
  const filtered = useMemo(() => {
    if (filter === "all") return articles;
    if (filter === "a_republier") {
      return articles.filter((a) => needsRelist(a, now));
    }
    return articles.filter((a) => a.status === filter);
  }, [articles, filter, now]);

  // Passage en "vendu" : on demande le PRIX DE VENTE FINAL pour que les
  // statistiques (CA, bénéfice, marge) reflètent la réalité.
  const handleMarkSold = async (article: Article) => {
    const price = await promptAmount(
      "Prix de vente final",
      `À combien as-tu réellement vendu « ${article.name || article.brand} » ?`,
      article.targetPrice,
    );
    if (price !== null) {
      markAsSold(article.id, price);
    }
  };

  // Confirmation avant suppression (action destructive).
  const confirmDelete = (article: Article) => {
    confirmAction(
      "Supprimer l'article",
      `Supprimer « ${article.name || article.brand} » ? Cette action est définitive.`,
      "Supprimer",
      () => deleteArticle(article.id),
    );
  };

  return (
    <Screen>
      <Header
        title="Stock"
        subtitle={`${filtered.length} pièce${filtered.length > 1 ? "s" : ""}`}
      />

      {/* Filtre par statut. */}
      <View className="pl-5">
        <SegmentedControl
          options={FILTERS}
          value={filter}
          onChange={setFilter}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 120,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ArticleCard
            article={item}
            now={now}
            onPress={() => router.push(`/article/${item.id}`)}
            onMarkSold={() => handleMarkSold(item)}
            onDelete={() => confirmDelete(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="pricetags-outline"
            title="Aucun article"
            subtitle={
              filter === "all"
                ? "Ajoute ta première pièce avec le bouton +."
                : "Aucune pièce pour ce filtre."
            }
          />
        }
      />

      <Fab onPress={() => router.push("/article/add")} />
    </Screen>
  );
}
