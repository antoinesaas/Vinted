// ÉCRAN 4 — DÉTAIL ARTICLE + GÉNÉRATEUR DE DESCRIPTION VINTED.
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Screen } from "../../components/Screen";
import {
  SegmentedControl,
  type SegmentOption,
} from "../../components/SegmentedControl";
import { StatusBadge } from "../../components/StatusBadge";
import { CONDITION_LABELS, TYPE_LABELS } from "../../constants/labels";
import { colors } from "../../constants/theme";
import { useStore } from "../../context/StoreContext";
import type { ArticleStatus } from "../../types";
import { generateAiDescription, isAiConfigured } from "../../utils/ai";
import { marginPercent, netMargin } from "../../utils/calculations";
import { generateDescription } from "../../utils/descriptionGenerator";
import { formatDate, formatEUR, formatPercent } from "../../utils/format";

// Statuts sélectionnables tant que l'article n'est pas vendu.
const STATUS_OPTIONS: SegmentOption<Exclude<ArticleStatus, "vendu">>[] = [
  { label: "En vente", value: "en_vente" },
  { label: "En attente", value: "en_attente" },
];

export default function ArticleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getArticle, updateArticle, markAsSold, deleteArticle } = useStore();

  const article = getArticle(id);

  // Compteur de régénération : incrémenté pour varier la phrase locale.
  const [seed, setSeed] = useState(0);
  const [copied, setCopied] = useState(false);
  // Description produite par l'IA (null tant qu'on utilise le modèle local).
  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Description locale (templates hors-ligne), recalculée selon le seed.
  const localDescription = useMemo(
    () => (article ? generateDescription(article, seed) : ""),
    [article, seed],
  );

  // Description affichée : IA si disponible, sinon modèle local.
  const description = aiDescription ?? localDescription;

  // Réinitialise l'état "Copié !" après 2 secondes.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  // Article introuvable (supprimé, mauvais id…).
  if (!article) {
    return (
      <Screen className="items-center justify-center px-8">
        <Text className="text-lg font-semibold text-ink">
          Article introuvable
        </Text>
        <Button
          title="Retour"
          variant="secondary"
          onPress={() => router.back()}
          className="mt-4 px-6"
        />
      </Screen>
    );
  }

  const sellPrice = article.soldPrice ?? article.targetPrice;
  const margin = netMargin(article.purchasePrice, sellPrice);
  const percent = marginPercent(article.purchasePrice, sellPrice);
  const isSold = article.status === "vendu";

  // Copie la description dans le presse-papier.
  const handleCopy = async () => {
    await Clipboard.setStringAsync(description);
    setCopied(true);
  };

  // Génère la description via l'IA (repli automatique sur le modèle local en cas d'échec).
  const handleAi = async () => {
    if (!isAiConfigured()) {
      Alert.alert(
        "IA non configurée",
        "Configure Supabase (constants/supabase.ts) pour la génération IA. Voir le README.",
      );
      return;
    }
    try {
      setAiLoading(true);
      const text = await generateAiDescription(article);
      setAiDescription(text);
    } catch (e) {
      Alert.alert("Génération IA impossible", (e as Error).message);
    } finally {
      setAiLoading(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Supprimer l'article",
      "Cette action est définitive.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            deleteArticle(article.id);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <Screen>
      {/* Barre de navigation */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <Button
          title="Retour"
          icon="chevron-back"
          variant="ghost"
          onPress={() => router.back()}
        />
        <Button
          title="Supprimer"
          icon="trash-outline"
          variant="ghost"
          onPress={confirmDelete}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo */}
        <View className="items-center py-2">
          {article.photoUri ? (
            <Image
              source={{ uri: article.photoUri }}
              className="h-52 w-52 rounded-2xl bg-surface"
            />
          ) : (
            <View className="h-52 w-52 items-center justify-center rounded-2xl bg-surface">
              <Ionicons name="image-outline" size={48} color={colors.textMuted} />
            </View>
          )}
        </View>

        {/* Titre + statut */}
        <View className="mt-2 flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-bold text-ink">
              {article.name || `${article.brand} ${TYPE_LABELS[article.type]}`}
            </Text>
            <Text className="mt-1 text-base text-muted">
              {article.brand} · {TYPE_LABELS[article.type]} · {article.size} ·{" "}
              {CONDITION_LABELS[article.condition]}
            </Text>
          </View>
          <StatusBadge status={article.status} />
        </View>

        {/* Chiffres clés */}
        <Card className="mt-4">
          <DetailRow label="Prix d'achat" value={formatEUR(article.purchasePrice)} />
          <View className="my-2 h-px bg-line" />
          <DetailRow
            label={isSold ? "Prix vendu" : "Prix de vente visé"}
            value={formatEUR(sellPrice)}
          />
          <View className="my-2 h-px bg-line" />
          <DetailRow
            label="Marge nette"
            value={`${formatEUR(margin)}  ·  ${formatPercent(percent)}`}
            strong
          />
          {isSold && article.soldAt ? (
            <>
              <View className="my-2 h-px bg-line" />
              <DetailRow label="Date de vente" value={formatDate(article.soldAt)} />
            </>
          ) : null}
        </Card>

        {/* Gestion du statut */}
        {isSold ? (
          <Button
            title="Remettre en vente"
            icon="refresh-outline"
            variant="secondary"
            className="mt-4"
            onPress={() =>
              updateArticle(article.id, {
                status: "en_vente",
                soldAt: null,
                soldPrice: null,
              })
            }
          />
        ) : (
          <>
            <Text className="mb-2 mt-5 text-sm font-medium text-muted">
              Statut
            </Text>
            <SegmentedControl
              options={STATUS_OPTIONS}
              value={article.status as Exclude<ArticleStatus, "vendu">}
              onChange={(value) => updateArticle(article.id, { status: value })}
            />
            <Button
              title="Marquer comme vendu"
              icon="checkmark-circle-outline"
              className="mt-4"
              onPress={() => markAsSold(article.id)}
            />
          </>
        )}

        {/* Générateur de description Vinted */}
        <View className="mb-2 mt-8 flex-row items-center justify-between">
          <Text className="text-sm font-medium uppercase tracking-wide text-muted">
            Description Vinted
          </Text>
          <Text className="text-xs text-muted">
            {aiDescription ? "✨ Générée par IA" : "Modèle local"}
          </Text>
        </View>
        <Card>
          <Text className="text-base leading-6 text-ink" selectable>
            {description}
          </Text>
        </Card>

        {/* Génération IA (repli sur le modèle local si non configurée). */}
        <Button
          title={aiLoading ? "Génération IA…" : "Générer avec l'IA"}
          icon="sparkles"
          variant="secondary"
          loading={aiLoading}
          className="mt-3"
          onPress={handleAi}
        />

        <View className="mt-2 flex-row">
          <Button
            title="Modèle local"
            icon="refresh"
            variant="secondary"
            className="mr-2 flex-1"
            onPress={() => {
              setAiDescription(null);
              setSeed((s) => s + 1);
            }}
          />
          <Button
            title={copied ? "Copié !" : "Copier"}
            icon={copied ? "checkmark" : "copy-outline"}
            className="flex-1"
            onPress={handleCopy}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

// Ligne "libellé — valeur" du bloc chiffres clés.
function DetailRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-base text-muted">{label}</Text>
      <Text
        className={`${strong ? "text-lg font-bold" : "text-base font-semibold"} text-ink`}
      >
        {value}
      </Text>
    </View>
  );
}
