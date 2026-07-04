// En-tête d'écran : grand titre + sous-titre + action optionnelle à droite.
import React from "react";
import { Text, View } from "react-native";

interface HeaderProps {
  title: string;
  subtitle?: string;
  /** Élément affiché à droite (bouton, action…). */
  right?: React.ReactNode;
  className?: string;
}

export function Header({ title, subtitle, right, className = "" }: HeaderProps) {
  return (
    <View className={`flex-row items-end justify-between px-5 pb-4 pt-2 ${className}`}>
      <View className="flex-1 pr-3">
        <Text className="text-3xl font-bold text-ink" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-1 text-base text-muted">{subtitle}</Text>
        ) : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}
