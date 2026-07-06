# Stock.01 📦

Application web (React Native + Expo, exportée pour le web) pour gérer une
activité de revente de vêtements sur Vinted. **Servie entièrement par Vercel**
— aucune installation, aucune app mobile à lancer : il suffit d'ouvrir l'URL.

👉 **https://stock01-proxy.vercel.app**

Données stockées localement dans le navigateur (`localStorage`, via
AsyncStorage). Thème **noir & blanc strict**, minimaliste, rapide.

---

## Fonctionnalités

| Onglet          | Écran                                                                 |
| --------------- | --------------------------------------------------------------------- |
| **Dashboard**   | CA du mois, bénéfice net, pièces vendues / en stock, marge moyenne, graphique de bénéfice hebdomadaire, bouton flottant « + ». |
| **Stock**       | Liste des articles, filtre par statut, boutons **Vendu** / **Supprimer**. |
| **Ventes**      | Historique chronologique, bénéfice cumulé, **export CSV** (téléchargement navigateur). |
| **Calculateur** | Marge brute / nette / %, indicateur couleur (🟢 > 50 %, 🟠 30-50 %, 🔴 < 30 %). |

Écrans secondaires :

- **Ajouter un article** (modal) : photo (fichier local), marque, type,
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

## Utilisation

Aucune installation nécessaire : ouvrez simplement
**https://stock01-proxy.vercel.app** dans un navigateur (ordinateur ou
téléphone). Sur iPhone, *Partager → Sur l'écran d'accueil* permet de l'ajouter
comme une app.

## Développement local

```bash
npm install
npm run web     # ouvre http://localhost:8081
```

## Déploiement (Vercel)

```bash
npx vercel deploy --prod --yes
```

`vercel.json` construit l'export web Expo (`npx expo export --platform web`)
et sert `dist/` en statique, avec une réécriture SPA (`/* -> /index.html`,
sauf `/api/*`) pour que la navigation interne fonctionne au rechargement.

---

## Architecture

```
app/                 Navigation (Expo Router, file-based, export web)
  (tabs)/            Les 4 onglets
  article/           add.tsx (modal) + [id].tsx (détail + description)
api/                 Fonction serverless Vercel (proxy IA OpenAI)
components/          Composants réutilisables (Card, Button, ArticleCard…)
context/             StoreContext : état global + persistance AsyncStorage
types/               Types TypeScript stricts
constants/           Thème, config métier, libellés, config IA
utils/               Calculs, stats, générateur de description, CSV, alertes
```

## Stack

React Native + **react-native-web** · Expo SDK 51 (export web) · TypeScript
(strict) · Expo Router · NativeWind (Tailwind) · AsyncStorage (→ localStorage
sur le web) · Vercel (hébergement + fonction serverless)

---

## Fonctions IA — proxy Vercel

Deux fonctionnalités passent par la **fonction serverless** `api/stock01-ai.js`
pour garder la clé OpenAI **côté serveur** :

- **Calculateur** : *Analyser une capture d'écran* Vinted. La vision OpenAI en
  extrait la marque / taille / type / état / prix et pré-remplit le prix
  d'achat. Si vous avez acheté la pièce, un bouton *Ajouter au stock* ouvre le
  formulaire pré-rempli où vous **confirmez le coût d'achat final** (pour des
  statistiques justes).
- **Détail article** : bouton *Générer avec l'IA* pour une description +
  hashtags rédigés à partir du produit (repli automatique sur les templates
  locaux si l'IA est indisponible).

La clé OpenAI est définie dans les variables d'environnement Vercel du projet
(jamais dans le code, jamais envoyée au navigateur).

**Pour renouveler la clé OpenAI :**

```bash
# saisit la clé sans qu'elle transite par un chat
echo "sk-votre-NOUVELLE-cle" | npx vercel env add OPENAI_API_KEY production
npx vercel deploy --prod --yes
```

## Notes

- Données stockées dans le `localStorage` du navigateur utilisé : vider les
  données de navigation du site efface le stock/l'historique.
- Les seules couleurs non monochromes sont réservées à l'indicateur de marge.
