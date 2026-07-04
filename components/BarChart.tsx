// Graphique en barres simple (sans dépendance) : bénéfice par semaine.
import React from "react";
import { Text, View } from "react-native";
import type { WeeklyPoint } from "../types";
import { formatEUR } from "../utils/format";

interface BarChartProps {
  data: WeeklyPoint[];
  /** Hauteur max d'une barre en pixels. */
  height?: number;
}

export function BarChart({ data, height = 130 }: BarChartProps) {
  // Valeur maximale (au moins 1 pour éviter la division par zéro).
  const max = Math.max(1, ...data.map((d) => Math.max(0, d.value)));

  return (
    <View>
      <View
        className="flex-row items-end justify-between"
        style={{ height }}
      >
        {data.map((point, index) => {
          // Les pertes/valeurs négatives sont représentées par une barre nulle.
          const ratio = Math.max(0, point.value) / max;
          const barHeight = Math.max(4, ratio * height);
          const hasValue = point.value > 0;

          return (
            <View key={index} className="flex-1 items-center justify-end">
              {hasValue ? (
                <Text className="mb-1 text-[10px] font-semibold text-ink">
                  {Math.round(point.value)}
                </Text>
              ) : null}
              <View
                className={`w-6 rounded-t-md ${hasValue ? "bg-black" : "bg-line"}`}
                style={{ height: barHeight }}
              />
            </View>
          );
        })}
      </View>

      {/* Libellés de l'axe X (dates de début de semaine). */}
      <View className="mt-2 flex-row justify-between">
        {data.map((point, index) => (
          <Text
            key={index}
            className="flex-1 text-center text-[10px] text-muted"
          >
            {point.label}
          </Text>
        ))}
      </View>

      {/* Total de la période. */}
      <Text className="mt-3 text-center text-xs text-muted">
        Total période :{" "}
        <Text className="font-semibold text-ink">
          {formatEUR(data.reduce((s, d) => s + d.value, 0))}
        </Text>
      </Text>
    </View>
  );
}
