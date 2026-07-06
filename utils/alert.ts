// ============================================================
// Alertes cross-plateforme.
// `Alert.alert` de react-native est un NO-OP sur le web (via
// react-native-web) : on route donc vers window.alert/confirm sur le web,
// et vers l'Alert natif ailleurs (iOS/Android).
// ============================================================

import { Alert, Platform } from "react-native";

import { parseAmount } from "./format";

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

/**
 * Demande un montant (€) à l'utilisateur (ex : prix de vente final).
 * Retourne le montant saisi, ou null si l'utilisateur annule ou saisit
 * une valeur invalide (un message l'en informe alors).
 *
 * Sur le web : window.prompt. Sur natif : iOS dispose d'Alert.prompt ;
 * à défaut, on retourne la valeur par défaut.
 */
export function promptAmount(
  title: string,
  message: string,
  defaultValue: number,
): Promise<number | null> {
  const defaultStr = defaultValue.toFixed(2).replace(".", ",");

  if (Platform.OS === "web") {
    const raw = window.prompt(`${title}\n\n${message}`, defaultStr);
    if (raw === null) return Promise.resolve(null); // annulé
    const value = parseAmount(raw);
    if (value <= 0) {
      window.alert("Montant invalide : la vente n'a pas été enregistrée.");
      return Promise.resolve(null);
    }
    return Promise.resolve(value);
  }

  // iOS : Alert.prompt existe ; sinon repli sur la valeur par défaut.
  if (Platform.OS === "ios" && typeof Alert.prompt === "function") {
    return new Promise((resolve) => {
      Alert.prompt(
        title,
        message,
        [
          { text: "Annuler", style: "cancel", onPress: () => resolve(null) },
          {
            text: "Valider",
            onPress: (raw) => {
              const value = parseAmount(raw ?? "");
              resolve(value > 0 ? value : null);
            },
          },
        ],
        "plain-text",
        defaultStr,
        "decimal-pad",
      );
    });
  }

  return Promise.resolve(defaultValue);
}
