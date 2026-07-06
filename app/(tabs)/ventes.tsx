// ÉCRAN 5 — HISTORIQUE DES VENTES : liste chronologique + total + export CSV.
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { Header } from "../../components/Header";
import { Screen } from "../../components/Screen";
import { resolveTypeLabel } from "../../constants/labels";
import { colors } from "../../constants/theme";
import { useStore } from "../../context/StoreContext";
import { notify } from "../../utils/alert";
import { netMargin } from "../../utils/calculations";
import { exportSalesCsv } from "../../utils/csv";
import { formatEUR, formatShortDate } from "../../utils/format";
import {
  monthlyBreakdown,
  soldArticles,
  totalLifetimeProfit,
  totalLifetimeRevenue,
} from "../../utils/stats";

export default function VentesScreen() {
  const { articles } = useStore();
  const [exporting, setExporting] = useState(false);

  // Ventes triées de la plus récente à la plus ancienne.
  const sales = useMemo(
    () =>
      soldArticles(articles).sort(
        (a, b) =>
          new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime(),
      ),
    [articles],
  );

  const lifetimeProfit = useMemo(
    () => totalLifetimeProfit(articles),
    [articles],
  );
  const lifetimeRevenue = useMemo(
    () => totalLifetimeRevenue(articles),
    [articles],
  );

  // Tableau mensuel : CA + bénéfice par mois.
  const months = useMemo(() => monthlyBreakdown(articles), [articles]);

  // Export CSV (téléchargement navigateur).
  const handleExport = async () => {
    if (sales.length === 0) return;
    try {
      setExporting(true);
      const ok = await exportSalesCsv(sales);
      if (!ok) {
        notify("Export indisponible", "Le partage n'est pas disponible sur cet appareil.");
      }
    } catch (e) {
      notify("L'export CSV a échoué", (e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen>
      <Header
        title="Ventes"
        subtitle={`${sales.length} vente${sales.length > 1 ? "s" : ""} au total`}
      />

      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="mb-3">
            {/* Totaux cumulés depuis le début de l'activité. */}
            <Card className="mb-3">
              <Text className="text-sm font-medium uppercase tracking-wide text-muted">
                Bénéfice cumulé (depuis le début)
              </Text>
              <Text className="mt-1 text-4xl font-bold text-ink">
                {formatEUR(lifetimeProfit)}
              </Text>
              <Text className="mt-1 text-sm text-muted">
                Sur {formatEUR(lifetimeRevenue)} de chiffre d'affaires
              </Text>
            </Card>

            {/* Tableau mensuel : CA + bénéfice. */}
            {months.length > 0 ? (
              <Card className="mb-3">
                <Text className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">
                  CA & bénéfice par mois
                </Text>

                {/* En-tête du tableau */}
                <View className="flex-row border-b border-line pb-2">
                  <Text className="flex-1 text-xs font-semibold uppercase text-muted">
                    Mois
                  </Text>
                  <Text className="w-12 text-right text-xs font-semibold uppercase text-muted">
                    Ventes
                  </Text>
                  <Text className="w-20 text-right text-xs font-semibold uppercase text-muted">
                    CA
                  </Text>
                  <Text className="w-20 text-right text-xs font-semibold uppercase text-muted">
                    Bénéfice
                  </Text>
                </View>

                {/* Lignes par mois */}
                {months.map((m) => (
                  <View
                    key={m.key}
                    className="flex-row items-center border-b border-line py-2"
                  >
                    <Text className="flex-1 text-sm text-ink" numberOfLines={1}>
                      {m.label}
                    </Text>
                    <Text className="w-12 text-right text-sm text-muted">
                      {m.count}
                    </Text>
                    <Text className="w-20 text-right text-sm text-ink">
                      {formatEUR(m.revenue)}
                    </Text>
                    <Text className="w-20 text-right text-sm font-semibold text-ink">
                      {formatEUR(m.profit)}
                    </Text>
                  </View>
                ))}

                {/* Ligne total */}
                <View className="flex-row items-center pt-2">
                  <Text className="flex-1 text-sm font-bold text-ink">Total</Text>
                  <Text className="w-12 text-right text-sm font-semibold text-muted">
                    {sales.length}
                  </Text>
                  <Text className="w-20 text-right text-sm font-bold text-ink">
                    {formatEUR(lifetimeRevenue)}
                  </Text>
                  <Text className="w-20 text-right text-sm font-bold text-ink">
                    {formatEUR(lifetimeProfit)}
                  </Text>
                </View>
              </Card>
            ) : null}

            {sales.length > 0 ? (
              <Button
                title={exporting ? "Export…" : "Exporter en CSV"}
                icon="download-outline"
                variant="secondary"
                loading={exporting}
                onPress={handleExport}
              />
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const margin = netMargin(item.purchasePrice, item.soldPrice ?? 0);
          return (
            <View className="flex-row items-center border-b border-line py-3">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-surface">
                <Ionicons name="cash-outline" size={20} color={colors.text} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-ink" numberOfLines={1}>
                  {item.name || `${item.brand} ${resolveTypeLabel(item)}`}
                </Text>
                <Text className="text-sm text-muted">
                  {item.soldAt ? formatShortDate(item.soldAt) : ""} ·{" "}
                  {formatEUR(item.soldPrice ?? 0)}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-base font-bold text-ink">
                  {formatEUR(margin)}
                </Text>
                <Text className="text-xs text-muted">marge nette</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="cash-outline"
            title="Aucune vente"
            subtitle="Marque un article comme vendu depuis le stock."
          />
        }
      />
    </Screen>
  );
}
