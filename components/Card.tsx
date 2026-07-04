// Carte blanche avec ombre iOS légère.
import React from "react";
import { View } from "react-native";
import { cardShadow } from "../constants/theme";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Désactive l'ombre (ex : carte à l'intérieur d'une autre). */
  flat?: boolean;
}

export function Card({ children, className = "", flat = false }: CardProps) {
  return (
    <View
      style={flat ? undefined : cardShadow}
      className={`rounded-2xl border border-line bg-white p-4 ${className}`}
    >
      {children}
    </View>
  );
}
