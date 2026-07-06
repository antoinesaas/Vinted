// ÉCRAN 4 — DÉTAIL ARTICLE + GÉNÉRATEUR DE DESCRIPTION VINTED.
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Screen } from "../../components/Screen";
import {
  SegmentedControl,
  type SegmentOption,
} from "../../components/SegmentedControl";
import { StatusBadge } from "../../components/StatusBadge";
import { CONDITION_LABELS, resolveTypeLabel } from "../../constants/labels";
import { colors } from "../../constants/theme";
import { useStore } from "../../context/StoreContext";
import type { ArticleStatus } from "../../types";
import { generateAiListing, isAiConfigured, type Listing } from "../../utils/ai";
import { confirmAction, notify, promptAmount } from "../../utils/alert";
import { marginPercent, netMargin } from "../../utils/calculations";
import { generateListing } from "../../utils/descriptionGenerator";
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

  // Champ copié à l'instant ("title" | "description" | null).
  const [copied, setCopied] = useState<"title" | "description" | null>(null);
  // Annonce produite par l'IA (null tant qu'on utilise le modèle local).
  const [aiListing, setAiListing] = useState<Listing | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Annonce locale (hors-ligne, format fixe).
  const localListing = useMemo(
    () => (article ? generateListing(article) : { title: "", description: "" }),
    [article],
  );

  // Annonce affichée : IA si disponible, sinon modèle local.
  const listing = aiListing ?? localListing;

  // Réinitialise l'état "Copié !" après 2 secondes.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 2000);
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

  // Copie le titre ou la description dans le presse-papier.
  const handleCopy = async (field: "title" | "description") => {
    await Clipboard.setStringAsync(
      field === "title" ? listing.title : listing.description,
    );
    setCopied(field);
  };

  // Passage en "vendu" : on demande le PRIX DE VENTE FINAL pour que les
  // statistiques (CA, bénéfice, marge) reflètent la réalité.
  const handleMarkSold = async () => {
    const price = await promptAmount(
      "Prix de vente final",
      `À combien as-tu réellement vendu « ${article.name || article.brand} » ?`,
      article.targetPrice,
    );
    if (price !== null) {
      markAsSold(article.id, price);
    }
  };

  // Génère l'annonce via l'IA (repli automatique sur le modèle local en cas d'échec).
  const handleAi = async () => {
    if (!isAiConfigured()) {
      notify(
        "IA non configurée",
        "Renseigne constants/aiConfig.ts pour la génération IA. Voir le README.",
      );
      return;
    }
    try {
      setAiLoading(true);
      const result = await generateAiListing(article);
      setAiListing(result);
    } catch (e) {
      notify("Génération IA impossible", (e as Error).message);
    } finally {
      setAiLoading(false);
    }
  };

  const confirmDelete = () => {
    confirmAction(
      "Supprimer l'article",
      "Cette action est définitive.",
      "Supprimer",
      () => {
        deleteArticle(article.id);
        router.back();
      },
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
              {article.name || `${article.brand} ${resolveTypeLabel(article)}`}
            </Text>
            <Text className="mt-1 text-base text-muted">
              {[
                article.brand,
                resolveTypeLabel(article),
                article.color,
                article.material,
                article.size,
                CONDITION_LABELS[article.condition],
              ]
                .filter(Boolean)
                .join(" · ")}
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
              onPress={handleMarkSold}
            />
          </>
        )}

        {/* Générateur d'annonce Vinted : titre + description */}
        <View className="mb-2 mt-8 flex-row items-center justify-between">
          <Text className="text-sm font-medium uppercase tracking-wide text-muted">
            Annonce Vinted
          </Text>
          <Text className="text-xs text-muted">
            {aiListing ? "✨ Générée par IA" : "Modèle local"}
          </Text>
        </View>

        {/* Titre */}
        <Card>
          <View className="flex-row items-center justify-between">
            <Text className="mr-3 flex-1 text-base font-semibold text-ink" selectable>
              {listing.title}
            </Text>
            <Button
              title={copied === "title" ? "Copié !" : "Copier"}
              icon={copied === "title" ? "checkmark" : "copy-outline"}
              variant="ghost"
              onPress={() => handleCopy("title")}
            />
          </View>
        </Card>

        {/* Description */}
        <Card className="mt-2">
          <Text className="text-base leading-6 text-ink" selectable>
            {listing.description}
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
          {aiListing ? (
            <Button
              title="Modèle local"
              icon="refresh"
              variant="secondary"
              className="mr-2 flex-1"
              onPress={() => setAiListing(null)}
            />
          ) : null}
          <Button
            title={copied === "description" ? "Copié !" : "Copier description"}
            icon={copied === "description" ? "checkmark" : "copy-outline"}
            className="flex-1"
            onPress={() => handleCopy("description")}
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
