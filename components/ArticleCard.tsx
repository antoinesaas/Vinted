// Ligne d'article dans le stock, avec actions explicites (boutons).
// (Pas de geste swipe : peu fiable au clavier/souris sur navigateur web.)
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

import { CONDITION_LABELS, resolveTypeLabel } from "../constants/labels";
import { colors } from "../constants/theme";
import type { Article } from "../types";
import { marginPercent, netMargin } from "../utils/calculations";
import { formatEUR, formatPercent } from "../utils/format";
import { daysSince, needsRelist } from "../utils/stats";
import { StatusBadge } from "./StatusBadge";

interface ArticleCardProps {
  article: Article;
  /** Ouvre le détail de l'article. */
  onPress: () => void;
  /** Marque comme vendu. */
  onMarkSold: () => void;
  /** Supprime l'article. */
  onDelete: () => void;
}

export function ArticleCard({
  article,
  onPress,
  onMarkSold,
  onDelete,
}: ArticleCardProps) {
  const isSold = article.status === "vendu";

  // Prix de référence : prix vendu si vendu, sinon prix visé.
  const sellPrice = article.soldPrice ?? article.targetPrice;
  const margin = netMargin(article.purchasePrice, sellPrice);
  const percent = marginPercent(article.purchasePrice, sellPrice);
  const toRelist = needsRelist(article);

  return (
    <View className="my-1 rounded-2xl border border-line bg-white p-3">
      {toRelist ? (
        <View className="mb-2 flex-row items-center self-start rounded-full border border-ink px-2.5 py-1">
          <Ionicons name="alert-circle-outline" size={13} color={colors.text} />
          <Text className="ml-1 text-xs font-semibold text-ink">
            En ligne depuis {daysSince(article.createdAt)} j · à republier
          </Text>
        </View>
      ) : null}
      <Pressable
        onPress={onPress}
        className="flex-row items-center active:opacity-70"
      >
        {/* Photo ou placeholder */}
        {article.photoUri ? (
          <Image
            source={{ uri: article.photoUri }}
            className="h-16 w-16 rounded-xl bg-surface"
          />
        ) : (
          <View className="h-16 w-16 items-center justify-center rounded-xl bg-surface">
            <Ionicons name="image-outline" size={24} color={colors.textMuted} />
          </View>
        )}

        {/* Infos principales */}
        <View className="ml-3 flex-1">
          <Text className="text-base font-semibold text-ink" numberOfLines={1}>
            {article.name || resolveTypeLabel(article)}
          </Text>
          <Text className="text-sm text-muted" numberOfLines={1}>
            {article.brand} · {article.size} · {CONDITION_LABELS[article.condition]}
          </Text>
          <Text className="mt-1 text-sm text-muted">
            {formatEUR(article.purchasePrice)} → {formatEUR(sellPrice)}
          </Text>
        </View>

        {/* Marge + statut */}
        <View className="ml-2 items-end">
          <Text className="text-base font-bold text-ink">
            {formatEUR(margin)}
          </Text>
          <Text className="mb-1 text-xs text-muted">
            {formatPercent(percent)}
          </Text>
          <StatusBadge status={article.status} />
        </View>
      </Pressable>

      {/* Actions explicites : marquer vendu / supprimer. */}
      <View className="mt-2 flex-row justify-end border-t border-line pt-2">
        {!isSold ? (
          <Pressable
            onPress={onMarkSold}
            className="mr-2 flex-row items-center rounded-full bg-black px-3 py-1.5 active:opacity-70"
          >
            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
            <Text className="ml-1 text-xs font-semibold text-white">
              Vendu
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onDelete}
          className="flex-row items-center rounded-full px-3 py-1.5 active:opacity-70"
          style={{ backgroundColor: `${colors.danger}1A` }}
        >
          <Ionicons name="trash" size={16} color={colors.danger} />
          <Text
            className="ml-1 text-xs font-semibold"
            style={{ color: colors.danger }}
          >
            Supprimer
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
