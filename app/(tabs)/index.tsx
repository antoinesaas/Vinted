// ÉCRAN 1 — DASHBOARD : indicateurs clés du mois + graphique hebdomadaire.
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";

import { BarChart } from "../../components/BarChart";
import { Card } from "../../components/Card";
import { Fab } from "../../components/Fab";
import { Header } from "../../components/Header";
import { Screen } from "../../components/Screen";
import { StatCard } from "../../components/StatCard";
import { useStore } from "../../context/StoreContext";
import { formatEUR, formatPercent } from "../../utils/format";
import { computeMonthlyStats, weeklyProfit } from "../../utils/stats";

// Nom du mois courant (ex : "Juillet 2026").
function currentMonthLabel(): string {
  const label = new Date().toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function DashboardScreen() {
  const router = useRouter();
  const { articles } = useStore();

  // Recalcul mémoïsé à chaque changement d'articles.
  const stats = useMemo(() => computeMonthlyStats(articles), [articles]);
  const weekly = useMemo(() => weeklyProfit(articles, 6), [articles]);

  return (
    <Screen>
      <Header title="Stock.01" subtitle={currentMonthLabel()} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Bénéfice net = carte héros. */}
        <StatCard
          label="Bénéfice net du mois"
          value={formatEUR(stats.profit)}
          hint={`Sur ${formatEUR(stats.revenue)} de chiffre d'affaires`}
          large
        />

        {/* Grille 2×2 des autres indicateurs. */}
        <View className="mt-3 flex-row">
          <StatCard
            className="mr-1.5 flex-1"
            label="CA du mois"
            value={formatEUR(stats.revenue)}
          />
          <StatCard
            className="ml-1.5 flex-1"
            label="Marge moyenne"
            value={formatPercent(stats.averageMargin)}
          />
        </View>

        <View className="mt-3 flex-row">
          <StatCard
            className="mr-1.5 flex-1"
            label="Vendues ce mois"
            value={String(stats.soldCount)}
            hint="pièces"
          />
          <StatCard
            className="ml-1.5 flex-1"
            label="Stock actif"
            value={String(stats.activeStockCount)}
            hint="pièces"
          />
        </View>

        {/* Graphique : bénéfice par semaine. */}
        <Card className="mt-3">
          <Text className="mb-4 text-sm font-medium uppercase tracking-wide text-muted">
            Bénéfice par semaine
          </Text>
          <BarChart data={weekly} />
        </Card>
      </ScrollView>

      {/* Bouton flottant d'ajout. */}
      <Fab onPress={() => router.push("/article/add")} />
    </Screen>
  );
}
