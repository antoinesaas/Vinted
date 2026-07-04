// Carte de statistique pour le dashboard : libellé + valeur + info secondaire.
import React from "react";
import { Text } from "react-native";
import { Card } from "./Card";

interface StatCardProps {
  label: string;
  value: string;
  /** Ligne secondaire optionnelle (ex : "3 pièces"). */
  hint?: string;
  /** Met la valeur en très grand (carte "héros" du dashboard). */
  large?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  hint,
  large = false,
  className = "",
}: StatCardProps) {
  return (
    <Card className={className}>
      <Text className="text-sm font-medium uppercase tracking-wide text-muted">
        {label}
      </Text>
      <Text
        className={`mt-1 font-bold text-ink ${large ? "text-4xl" : "text-2xl"}`}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      {hint ? (
        <Text className="mt-1 text-sm text-muted">{hint}</Text>
      ) : null}
    </Card>
  );
}
