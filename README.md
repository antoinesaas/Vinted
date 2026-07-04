# Stock.01 📦

Application mobile iOS (React Native / Expo) pour gérer une activité de
revente de vêtements sur Vinted. **100 % offline** : toutes les données sont
stockées localement via `AsyncStorage`, aucun backend requis.

Thème **noir & blanc strict**, minimaliste, rapide.

---

## Fonctionnalités

| Onglet          | Écran                                                                 |
| --------------- | --------------------------------------------------------------------- |
| **Dashboard**   | CA du mois, bénéfice net, pièces vendues / en stock, marge moyenne, graphique de bénéfice hebdomadaire, bouton flottant « + ». |
| **Stock**       | Liste des articles, filtre par statut, **swipe gauche = vendu**, **swipe droite = supprimer**. |
| **Ventes**      | Historique chronologique, bénéfice cumulé, **export CSV**.            |
| **Calculateur** | Marge brute / nette / %, indicateur couleur (🟢 > 50 %, 🟠 30-50 %, 🔴 < 30 %). |

Écrans secondaires :

- **Ajouter un article** (modal) : photo (galerie / appareil), marque, type,
  taille, état, prix d'achat, prix de vente. Marge nette et **prix conseillé
  (× 2,2)** calculés automatiquement.
- **Détail article + Générateur de description Vinted** : description complète
  avec 5 templates de phrases qui alternent, hashtags dynamiques, bouton
  **Copier** (1 tap) et **Régénérer**.

---

## Règles de calcul

- **Marge nette** = prix de vente − prix d'achat − **0,40 €** (frais de sachet)
- **Prix conseillé** = prix d'achat **× 2,2** (modifiable)
- **% de marge** = marge nette / prix de vente

---

## Prérequis

- [Node.js](https://nodejs.org/) 18+ et npm
- L'application **Expo Go** sur votre iPhone (iOS 15+), ou un simulateur iOS (macOS)

## Installation

```bash
# Depuis le dossier du projet
npm install

# (optionnel mais recommandé) aligner les versions natives sur le SDK Expo
npx expo install --fix
```

## Lancement

```bash
npm start
```

Puis scannez le QR code affiché avec l'appareil photo de votre iPhone
(l'app **Expo Go** s'ouvre). Sur macOS, appuyez sur `i` pour ouvrir le
simulateur iOS.

> 💡 Windows : vous pouvez développer et tester via Expo Go sur un iPhone
> physique. La génération d'un `.ipa` iOS nécessite macOS ou EAS Build (cloud).

---

## Architecture

```
app/                 Navigation (Expo Router, file-based)
  (tabs)/            Les 4 onglets
  article/           add.tsx (modal) + [id].tsx (détail + description)
components/          Composants réutilisables (Card, Button, ArticleCard…)
context/             StoreContext : état global + persistance AsyncStorage
types/               Types TypeScript stricts
constants/           Thème, config métier, libellés
utils/               Calculs, stats, générateur de description, CSV, storage
```

## Stack

React Native · Expo SDK 51 · TypeScript (strict) · Expo Router ·
NativeWind (Tailwind) · AsyncStorage · react-native-gesture-handler

---

## Fonctions IA (optionnelles) — proxy Vercel

Deux fonctionnalités passent par une **fonction serverless Vercel**
(`api/stock01-ai.js`) pour garder la clé OpenAI **côté serveur** :

- **Calculateur** : *Analyser une capture d'écran* Vinted (galerie ou photo).
  La vision OpenAI en extrait la marque / taille / type / état / prix et
  pré-remplit le prix d'achat. Si vous avez acheté la pièce, un bouton
  *Ajouter au stock* ouvre le formulaire pré-rempli où vous **confirmez le coût
  d'achat final** (pour des statistiques justes).
- **Détail article** : bouton *Générer avec l'IA* pour une description +
  hashtags rédigés à partir du produit (repli automatique sur les templates
  locaux si l'IA est indisponible).

Le proxy est déployé sur : **https://stock01-proxy.vercel.app/api/stock01-ai**
(configuré dans [`constants/aiConfig.ts`](constants/aiConfig.ts)), et la clé
OpenAI est déjà définie dans les variables d'environnement Vercel.

**Pour changer / renouveler la clé OpenAI** (recommandé : régénérer la clé
initiale qui a été exposée) :

```bash
# saisit la clé sans qu'elle transite par un chat
echo "sk-votre-NOUVELLE-cle" | npx vercel env add OPENAI_API_KEY production
npx vercel deploy --prod --yes
```

> 🔐 La clé OpenAI ne doit **jamais** être mise dans le code de l'app : le
> bundle mobile est extractible. Elle vit uniquement dans les variables
> d'environnement Vercel. Tant qu'elle n'est pas définie, l'app reste
> **100 % fonctionnelle offline** (description via templates locaux).

## Notes

- Persistance 100 % locale : effacer l'app efface les données.
- Les seules couleurs non monochromes sont réservées à l'indicateur de marge.
