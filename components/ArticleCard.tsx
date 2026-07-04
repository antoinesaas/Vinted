// Ligne d'article dans le stock, avec actions par balayage (swipe).
// - Swipe vers la GAUCHE  -> "Vendu"      (actions à droite)
// - Swipe vers la DROITE  -> "Supprimer"  (actions à gauche)
import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import { CONDITION_LABELS, TYPE_LABELS } from "../constants/labels";
import { colors } from "../constants/theme";
import type { Article } from "../types";
import { marginPercent, netMargin } from "../utils/calculations";
import { formatEUR, formatPercent } from "../utils/format";
import { StatusBadge } from "./StatusBadge";

interface ArticleCardProps {
  article: Article;
  /** Ouvre le détail de l'article. */
  onPress: () => void;
  /** Marque comme vendu (swipe gauche). */
  onMarkSold: () => void;
  /** Supprime l'article (swipe droite). */
  onDelete: () => void;
}

export function ArticleCard({
  article,
  onPress,
  onMarkSold,
  onDelete,
}: ArticleCardProps) {
  const swipeRef = useRef<Swipeable>(null);
  const isSold = article.status === "vendu";

  // Prix de référence : prix vendu si vendu, sinon prix visé.
  const sellPrice = article.soldPrice ?? article.targetPrice;
  const margin = netMargin(article.purchasePrice, sellPrice);
  const percent = marginPercent(article.purchasePrice, sellPrice);

  // Action révélée par un swipe vers la gauche : marquer comme vendu.
  const renderRightActions = () => {
    if (isSold) return null;
    return (
      <Pressable
        onPress={() => {
          swipeRef.current?.close();
          onMarkSold();
        }}
        className="my-1 w-28 items-center justify-center rounded-2xl bg-black"
      >
        <Ionicons name="checkmark-circle" size={26} color="#FFFFFF" />
        <Text className="mt-1 text-sm font-semibold text-white">Vendu</Text>
      </Pressable>
    );
  };

  // Action révélée par un swipe vers la droite : supprimer.
  const renderLeftActions = () => (
    <Pressable
      onPress={() => {
        swipeRef.current?.close();
        onDelete();
      }}
      className="my-1 w-28 items-center justify-center rounded-2xl"
      style={{ backgroundColor: colors.danger }}
    >
      <Ionicons name="trash" size={24} color="#FFFFFF" />
      <Text className="mt-1 text-sm font-semibold text-white">Supprimer</Text>
    </Pressable>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      overshootRight={false}
      overshootLeft={false}
    >
      <Pressable
        onPress={onPress}
        className="my-1 flex-row items-center rounded-2xl border border-line bg-white p-3 active:opacity-70"
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
            {article.name || TYPE_LABELS[article.type]}
          </Text>
          <Text className="text-sm text-muted" numberOfLines={1}>
            {article.brand} · {article.size} · {CONDITION_LABELS[article.condition]}
          </Text>
          <View className="mt-1 flex-row items-center">
            <Text className="text-sm text-muted">
              {formatEUR(article.purchasePrice)} → {formatEUR(sellPrice)}
            </Text>
          </View>
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
    </Swipeable>
  );
}
