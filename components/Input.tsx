// Champ de saisie étiqueté, avec suffixe optionnel (ex : "€").
import React from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";
import { colors } from "../constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  /** Texte affiché à droite dans le champ (unité). */
  suffix?: string;
  className?: string;
}

export function Input({
  label,
  suffix,
  className = "",
  ...rest
}: InputProps) {
  return (
    <View className={className}>
      {label ? (
        <Text className="mb-2 text-sm font-medium text-muted">{label}</Text>
      ) : null}
      <View className="h-14 flex-row items-center rounded-2xl border border-line bg-surface px-4">
        <TextInput
          placeholderTextColor={colors.textMuted}
          className="flex-1 text-base text-ink"
          {...rest}
        />
        {suffix ? (
          <Text className="ml-2 text-base font-medium text-muted">{suffix}</Text>
        ) : null}
      </View>
    </View>
  );
}
