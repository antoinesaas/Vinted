// Bouton d'action flottant "+" (ajout rapide d'article).
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable } from "react-native";
import { cardShadow } from "../constants/theme";

interface FabProps {
  onPress: () => void;
}

export function Fab({ onPress }: FabProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="Ajouter un article"
      style={cardShadow}
      className="absolute bottom-6 right-6 h-16 w-16 items-center justify-center rounded-full bg-black active:opacity-80"
    >
      <Ionicons name="add" size={32} color="#FFFFFF" />
    </Pressable>
  );
}
