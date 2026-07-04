// Bouton réutilisable. Variantes : primary (noir), secondary (contour), ghost.
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  /** Nom d'icône Ionicons affichée à gauche du texte. */
  icon?: keyof typeof Ionicons.glyphMap;
  className?: string;
}

// Styles de conteneur par variante.
const CONTAINER: Record<Variant, string> = {
  primary: "bg-black border border-black",
  secondary: "bg-white border border-black",
  ghost: "bg-transparent border border-transparent",
};

// Couleur de texte / icône par variante.
const TEXT_COLOR: Record<Variant, string> = {
  primary: "text-white",
  secondary: "text-black",
  ghost: "text-black",
};

const ICON_HEX: Record<Variant, string> = {
  primary: "#FFFFFF",
  secondary: "#000000",
  ghost: "#000000",
};

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  icon,
  className = "",
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`h-14 flex-row items-center justify-center rounded-2xl px-5 ${CONTAINER[variant]} ${isDisabled ? "opacity-40" : "active:opacity-70"} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={ICON_HEX[variant]} />
      ) : (
        <View className="flex-row items-center">
          {icon ? (
            <Ionicons
              name={icon}
              size={20}
              color={ICON_HEX[variant]}
              style={{ marginRight: 8 }}
            />
          ) : null}
          <Text className={`text-base font-semibold ${TEXT_COLOR[variant]}`}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
