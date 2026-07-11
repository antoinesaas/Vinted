// Layout racine : styles globaux, gestion des gestes, store, navigation Stack.
import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { DialogHost } from "../components/DialogHost";
import { StoreProvider } from "../context/StoreContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StoreProvider>
        {/* Barre d'état sombre (icônes noires) sur fond blanc. */}
        <StatusBar style="dark" />
        {/* Boîtes de dialogue in-app (alerte/confirmation/saisie). */}
        <DialogHost />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#FFFFFF" },
          }}
        >
          {/* Les 4 onglets. */}
          <Stack.Screen name="(tabs)" />
          {/* Ajout d'article en modal (glisse depuis le bas). */}
          <Stack.Screen
            name="article/add"
            options={{ presentation: "modal" }}
          />
          {/* Détail d'article + générateur de description. */}
          <Stack.Screen name="article/[id]" />
        </Stack>
      </StoreProvider>
    </GestureHandlerRootView>
  );
}
