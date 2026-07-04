// Placeholder affiché quand une liste est vide.
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { colors } from "../constants/theme";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-10 py-20">
      <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-surface">
        <Ionicons name={icon} size={36} color={colors.textMuted} />
      </View>
      <Text className="text-center text-lg font-semibold text-ink">
        {title}
      </Text>
      {subtitle ? (
        <Text className="mt-2 text-center text-base text-muted">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
