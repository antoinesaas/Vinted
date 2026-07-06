// Indicateur visuel de deal (seule touche de couleur de l'app).
// Vert = bon deal, orange = minimum acceptable, rouge = insuffisant.
import React from "react";
import { Text, View } from "react-native";
import { colors } from "../constants/theme";
import type { MarginLevel } from "../utils/calculations";

interface MarginIndicatorProps {
  level: MarginLevel;
  /** Libellé affiché (ex : "64 %" ou "x2,3"). */
  label: string;
  /** Titre qualitatif (par défaut selon le niveau, personnalisable). */
  title?: string;
}

const DEFAULT_TITLES: Record<MarginLevel, string> = {
  high: "Excellent",
  medium: "Acceptable",
  low: "Insuffisant",
};

const COLORS: Record<MarginLevel, string> = {
  high: colors.success,
  medium: colors.warning,
  low: colors.danger,
};

export function MarginIndicator({ level, label, title }: MarginIndicatorProps) {
  const color = COLORS[level];
  const text = title ?? DEFAULT_TITLES[level];
  return (
    <View
      className="flex-row items-center justify-between rounded-2xl px-4 py-3"
      style={{ backgroundColor: `${color}1A` }} // couleur à ~10% d'opacité
    >
      <View className="flex-row items-center">
        <View
          className="mr-3 h-3 w-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <Text className="text-base font-semibold" style={{ color }}>
          {text}
        </Text>
      </View>
      <Text className="text-lg font-bold" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}
