// Hôte des boîtes de dialogue in-app (alerte / confirmation / saisie).
// Monté une seule fois à la racine (voir app/_layout.tsx). Remplace les
// dialogues natifs du navigateur, peu fiables en PWA iOS (voir utils/alert.ts).
import React, { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { subscribeDialog, type DialogState } from "../utils/alert";
import { Button } from "./Button";
import { Input } from "./Input";

export function DialogHost() {
  const [state, setState] = useState<DialogState>({ type: "none" });
  const [inputValue, setInputValue] = useState("");

  useEffect(
    () =>
      subscribeDialog((next) => {
        setState(next);
        if (next.type === "prompt") setInputValue(next.defaultValue);
      }),
    [],
  );

  if (state.type === "none") return null;

  // Fermeture par défaut (tap en dehors de la carte, ou touche retour) = annulation.
  const dismiss = () => {
    if (state.type === "alert") state.resolve();
    else if (state.type === "confirm") state.resolve(false);
    else if (state.type === "prompt") state.resolve(null);
  };

  const confirmLabel = state.type === "confirm" ? state.confirmLabel : "OK";

  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismiss}>
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
        <Pressable
          onPress={dismiss}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View className="w-full max-w-sm rounded-2xl bg-white p-5">
          <Text className="text-lg font-bold text-ink">{state.title}</Text>
          {state.type !== "alert" ? (
            <Text className="mt-2 text-base text-muted">{state.message}</Text>
          ) : state.message ? (
            <Text className="mt-2 text-base text-muted">{state.message}</Text>
          ) : null}

          {state.type === "prompt" ? (
            <Input
              className="mt-4"
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="decimal-pad"
              suffix="€"
              autoFocus
            />
          ) : null}

          <View className="mt-5 flex-row">
            {state.type !== "alert" ? (
              <Button title="Annuler" variant="secondary" className="mr-2 flex-1" onPress={dismiss} />
            ) : null}
            <Button
              title={confirmLabel}
              className="flex-1"
              onPress={() => {
                if (state.type === "alert") state.resolve();
                else if (state.type === "confirm") state.resolve(true);
                else if (state.type === "prompt") state.resolve(inputValue);
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
