// ÉCRAN 2 — STOCK : liste filtrable des articles, actions par swipe.
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, FlatList, View } from "react-native";

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

// Options du filtre : "all" + les trois statuts.
type FilterValue = "all" | ArticleStatus;

const FILTERS: SegmentOption<FilterValue>[] = [
  { label: "Tous", value: "all" },
  { label: "En vente", value: "en_vente" },
  { label: "En attente", value: "en_attente" },
  { label: "Vendu", value: "vendu" },
];

export default function StockScreen() {
  const router = useRouter();
  const { articles, markAsSold, deleteArticle } = useStore();
  const [filter, setFilter] = useState<FilterValue>("all");

  // Application du filtre de statut.
  const filtered = useMemo(
    () =>
      filter === "all"
        ? articles
        : articles.filter((a) => a.status === filter),
    [articles, filter],
  );

  // Confirmation avant suppression (action destructive).
  const confirmDelete = (article: Article) => {
    Alert.alert(
      "Supprimer l'article",
      `Supprimer « ${article.name || article.brand} » ? Cette action est définitive.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => deleteArticle(article.id),
        },
      ],
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
            onPress={() => router.push(`/article/${item.id}`)}
            onMarkSold={() => markAsSold(item.id)}
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
