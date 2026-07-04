// Badge de statut d'un article (noir & blanc).
import React from "react";
import { Text, View } from "react-native";
import { STATUS_LABELS } from "../constants/labels";
import type { ArticleStatus } from "../types";

interface StatusBadgeProps {
  status: ArticleStatus;
}

// Styles par statut (conteneur + texte).
const STYLES: Record<ArticleStatus, { box: string; text: string }> = {
  en_vente: { box: "bg-white border border-black", text: "text-black" },
  vendu: { box: "bg-black border border-black", text: "text-white" },
  en_attente: { box: "bg-surface border border-line", text: "text-muted" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STYLES[status];
  return (
    <View className={`self-start rounded-full px-3 py-1 ${style.box}`}>
      <Text className={`text-xs font-semibold ${style.text}`}>
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
}
