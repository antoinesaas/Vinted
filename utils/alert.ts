// ============================================================
// Alertes cross-plateforme.
// `Alert.alert` de react-native est un NO-OP sur le web (via
// react-native-web) : on route donc vers window.alert/confirm sur le web,
// et vers l'Alert natif ailleurs (iOS/Android).
// ============================================================

import { Alert, Platform } from "react-native";

/** Affiche un simple message d'information/erreur. */
export function notify(title: string, message?: string): void {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

/**
 * Demande une confirmation avant une action (ex : suppression).
 * `onConfirm` n'est appelé que si l'utilisateur confirme.
 */
export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void,
): void {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: "Annuler", style: "cancel" },
    { text: confirmLabel, style: "destructive", onPress: onConfirm },
  ]);
}
