// ÉCRAN 1 — DASHBOARD : indicateurs clés du mois + graphique hebdomadaire.
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { BarChart } from "../../components/BarChart";
import { Card } from "../../components/Card";
import { Fab } from "../../components/Fab";
import { Header } from "../../components/Header";
import { Screen } from "../../components/Screen";
import { StatCard } from "../../components/StatCard";
import { colors } from "../../constants/theme";
import { useStore } from "../../context/StoreContext";
import { formatEUR, formatPercent } from "../../utils/format";
import {
  articlesToRelist,
  computeMonthlyStats,
  weeklyProfit,
} from "../../utils/stats";
import { useNow } from "../../utils/useNow";

// Nom du mois de `date` (ex : "Juillet 2026").
function monthLabel(date: Date): string {
  const label = date.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function DashboardScreen() {
  const router = useRouter();
  const { articles } = useStore();
  // Date "vivante", rafraîchie au focus/retour au premier plan/périodiquement
  // pour que le mois affiché et les stats ne restent jamais figés sur un
  // mois passé si l'app reste ouverte sans qu'aucun article ne change.
  const now = useNow();

  // Recalcul mémoïsé à chaque changement d'articles OU de date de référence.
  const stats = useMemo(() => computeMonthlyStats(articles, now), [articles, now]);
  const weekly = useMemo(() => weeklyProfit(articles, 6, now), [articles, now]);
  const toRelist = useMemo(
    () => articlesToRelist(articles, now),
    [articles, now],
  );

  return (
    <Screen>
      <Header title="Stock.01" subtitle={monthLabel(now)} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Alerte : pièces en ligne depuis plus de 3 semaines à republier. */}
        {toRelist.length > 0 ? (
          <Pressable
            onPress={() => router.push("/stock?filter=a_republier")}
            className="mb-3 flex-row items-center rounded-2xl border border-ink bg-white p-4 active:opacity-70"
          >
            <Ionicons name="alert-circle-outline" size={22} color={colors.text} />
            <View className="ml-3 flex-1">
              <Text className="text-base font-semibold text-ink">
                {toRelist.length} pièce{toRelist.length > 1 ? "s" : ""} à republier
              </Text>
              <Text className="mt-0.5 text-sm text-muted">
                En ligne depuis plus de 3 semaines sans acheteur
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}

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
