// ============================================================
// Hook "horloge" : renvoie la date/heure courante, rafraîchie
// automatiquement pour que les calculs basés sur "aujourd'hui" (mois en
// cours, nombre de jours écoulés...) ne restent jamais figés si l'app
// reste ouverte sans qu'aucun article ne change.
// ============================================================

import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

/**
 * Renvoie la date courante, recalculée :
 * - quand l'écran reprend le focus (changement d'onglet, retour en arrière),
 * - quand l'app revient au premier plan (après mise en arrière-plan),
 * - périodiquement (par défaut toutes les 5 minutes), au cas où l'app
 *   resterait ouverte et au premier plan pendant un changement de jour/mois.
 */
export function useNow(refreshIntervalMs = 5 * 60 * 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useFocusEffect(
    useCallback(() => {
      setNow(new Date());
    }, []),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") setNow(new Date());
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), refreshIntervalMs);
    return () => clearInterval(id);
  }, [refreshIntervalMs]);

  return now;
}
