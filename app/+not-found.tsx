// Écran affiché pour une route inconnue.
import { Link, Stack } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: "Introuvable" }} />
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Text className="text-xl font-bold text-ink">Page introuvable</Text>
        <Link href="/" className="mt-4 text-base font-semibold text-black underline">
          Retour à l'accueil
        </Link>
      </View>
    </>
  );
}
