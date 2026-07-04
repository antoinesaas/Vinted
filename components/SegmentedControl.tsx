// Sélecteur segmenté (pastilles) scrollable. Générique sur la valeur choisie.
import React from "react";
import { Pressable, ScrollView, Text } from "react-native";

export interface SegmentOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={className}
      contentContainerStyle={{ paddingRight: 8 }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={`mr-2 h-10 items-center justify-center rounded-full border px-4 ${
              active ? "border-black bg-black" : "border-line bg-white"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                active ? "text-white" : "text-ink"
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
