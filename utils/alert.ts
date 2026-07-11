// ============================================================
// Boîtes de dialogue in-app (alerte / confirmation / saisie), rendues
// par <DialogHost/> (monté une seule fois dans app/_layout.tsx).
//
// Remplace window.alert/confirm/prompt : `window.prompt()` en particulier
// ne fonctionne PAS de façon fiable sur iOS quand l'app est lancée en
// plein écran depuis l'écran d'accueil (limitation connue de WebKit en
// mode PWA "standalone") — ce qui rendait "Marquer comme vendu" inopérant
// sur iPhone. Une modale React maison fonctionne partout, y compris là.
// ============================================================

import { parseAmount } from "./format";

/** État courant de la boîte de dialogue affichée (ou "none"). */
export type DialogState =
  | { type: "none" }
  | { type: "alert"; title: string; message?: string; resolve: () => void }
  | {
      type: "confirm";
      title: string;
      message: string;
      confirmLabel: string;
      resolve: (confirmed: boolean) => void;
    }
  | {
      type: "prompt";
      title: string;
      message: string;
      defaultValue: string;
      resolve: (value: string | null) => void;
    };

type Listener = (state: DialogState) => void;

let currentState: DialogState = { type: "none" };
let listeners: Listener[] = [];

function setState(state: DialogState): void {
  currentState = state;
  listeners.forEach((listener) => listener(state));
}

/** Abonnement utilisé par <DialogHost/> pour refléter l'état courant. */
export function subscribeDialog(listener: Listener): () => void {
  listeners.push(listener);
  listener(currentState);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

/** Affiche un simple message d'information/erreur. */
export function notify(title: string, message?: string): Promise<void> {
  return new Promise((resolve) => {
    setState({
      type: "alert",
      title,
      message,
      resolve: () => {
        setState({ type: "none" });
        resolve();
      },
    });
  });
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
  setState({
    type: "confirm",
    title,
    message,
    confirmLabel,
    resolve: (confirmed) => {
      setState({ type: "none" });
      if (confirmed) onConfirm();
    },
  });
}

/**
 * Demande un montant (€) à l'utilisateur (ex : prix de vente final).
 * Retourne le montant saisi, ou null si l'utilisateur annule ou saisit
 * une valeur invalide (un message l'en informe alors).
 */
export function promptAmount(
  title: string,
  message: string,
  defaultValue: number,
): Promise<number | null> {
  const defaultStr = defaultValue.toFixed(2).replace(".", ",");
  return new Promise((resolve) => {
    setState({
      type: "prompt",
      title,
      message,
      defaultValue: defaultStr,
      resolve: (raw) => {
        setState({ type: "none" });
        if (raw === null) {
          resolve(null);
          return;
        }
        const value = parseAmount(raw);
        if (value <= 0) {
          void notify("Montant invalide", "La vente n'a pas été enregistrée.");
          resolve(null);
          return;
        }
        resolve(value);
      },
    });
  });
}
