// Conteneur d'écran : fond blanc + gestion de la zone sûre (encoche iOS).
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenProps {
  children: React.ReactNode;
  /** Classes NativeWind supplémentaires appliquées au conteneur. */
  className?: string;
}

export function Screen({ children, className = "" }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      // On applique la marge haute de la zone sûre via le style natif,
      // le reste de la mise en page via className (NativeWind).
      style={{ paddingTop: insets.top }}
      className={`flex-1 bg-white ${className}`}
    >
      {children}
    </View>
  );
}
