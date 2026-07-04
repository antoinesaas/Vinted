// ============================================================
// Configuration du proxy IA (fonction serverless hébergée sur Vercel).
//
// Seule l'URL publique du proxy est ici. La clé OpenAI, elle, n'est
// JAMAIS dans l'app : elle vit dans les variables d'environnement Vercel.
// ============================================================

/** URL complète de la fonction serverless (déployée sur Vercel). */
export const AI_API_URL = "https://stock01-proxy.vercel.app/api/stock01-ai";

/**
 * Secret partagé optionnel. À remplir UNIQUEMENT si vous avez défini la
 * variable d'environnement APP_SHARED_SECRET côté Vercel. Sinon, laisser vide.
 */
export const AI_APP_KEY = "";

/** Vrai si l'URL du proxy a bien été renseignée (sinon l'app reste offline). */
export function isAiConfigured(): boolean {
  return AI_API_URL.startsWith("http") && !AI_API_URL.includes("VOTRE-PROJET");
}
