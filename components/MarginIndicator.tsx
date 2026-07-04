// Indicateur visuel de marge (seule touche de couleur de l'app).
// Vert > 50 %, orange 30-50 %, rouge < 30 %.
import React from "react";
import { Text, View } from "react-native";
import { colors } from "../constants/theme";
import type { MarginLevel } from "../utils/calculations";

interface MarginIndicatorProps {
  level: MarginLevel;
  /** Libellé affiché (ex : "64 %"). */
  label: string;
}

const CONFIG: Record<MarginLevel, { color: string; text: string }> = {
  high: { color: colors.success, text: "Excellente marge" },
  medium: { color: colors.warning, text: "Marge correcte" },
  low: { color: colors.danger, text: "Marge faible" },
};

export function MarginIndicator({ level, label }: MarginIndicatorProps) {
  const { color, text } = CONFIG[level];
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
