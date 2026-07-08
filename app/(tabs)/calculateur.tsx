// ÉCRAN 6 — CALCULATEUR DE MARGE : outil rapide, sans sauvegarde.
// Le calculateur détermine le VRAI prix de revente (moyenne d'annonces
// comparables réelles sur Vinted, recherchées côté serveur) et calcule
// la marge à partir de celui-ci. Cible : deal à x2-x2,5 le prix d'achat,
// minimum acceptable x1,5.
import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
  Keyboard,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Header } from "../../components/Header";
import { Input } from "../../components/Input";
import { MarginIndicator } from "../../components/MarginIndicator";
import { Screen } from "../../components/Screen";
import {
  SegmentedControl,
  type SegmentOption,
} from "../../components/SegmentedControl";
import { BUYER_PROTECTION_FEE, BUYER_SHIPPING_FEE, SACHET_FEE } from "../../constants/config";
import {
  CONDITION_LABELS,
  PURCHASE_SOURCE_LABELS,
  resolveTypeWord,
  TYPE_LABELS,
  type PurchaseSource,
} from "../../constants/labels";
import { colors } from "../../constants/theme";
import type { ArticleCondition, ArticleType } from "../../types";
import {
  estimateResalePrice,
  isAiConfigured,
  parseScreenshot,
  type ProductParseResult,
  type ResalePriceResult,
} from "../../utils/ai";
import { notify } from "../../utils/alert";
import {
  BUYER_FEES_TOTAL,
  grossMargin,
  multiplierLabel,
  multiplierLevel,
  netMargin,
  recommendedPurchaseRange,
  resaleMultiplier,
  totalPurchaseCost,
} from "../../utils/calculations";
import { formatEUR, parseAmount } from "../../utils/format";

const TYPE_OPTIONS: SegmentOption<ArticleType>[] = (
  Object.keys(TYPE_LABELS) as ArticleType[]
).map((value) => ({ value, label: TYPE_LABELS[value] }));

const CONDITION_OPTIONS: SegmentOption<ArticleCondition>[] = (
  Object.keys(CONDITION_LABELS) as ArticleCondition[]
).map((value) => ({ value, label: CONDITION_LABELS[value] }));

const SOURCE_OPTIONS: SegmentOption<PurchaseSource>[] = (
  Object.keys(PURCHASE_SOURCE_LABELS) as PurchaseSource[]
).map((value) => ({ value, label: PURCHASE_SOURCE_LABELS[value] }));

export default function CalculateurScreen() {
  const router = useRouter();
  const [purchaseStr, setPurchaseStr] = useState("");
  const [sellStr, setSellStr] = useState("");
  // "vinted" : le prix saisi est le prix AFFICHÉ, les frais acheteur
  // (protection + livraison) sont ajoutés automatiquement.
  // "manuel" : le prix saisi est le coût réel exact (brocante, don, autre
  // plateforme…), aucun frais n'est ajouté.
  const [source, setSource] = useState<PurchaseSource>("vinted");

  // Attributs du produit (pré-remplis par la capture, éditables manuellement).
  const [brand, setBrand] = useState("");
  const [type, setType] = useState<ArticleType>("tshirt");
  // Texte libre saisi quand le type "Autre" est sélectionné.
  const [customType, setCustomType] = useState("");
  const [color, setColor] = useState("");
  const [material, setMaterial] = useState("");
  const [size, setSize] = useState("");
  const [condition, setCondition] = useState<ArticleCondition>("tres_bon");

  // Change de type : on efface le texte libre si on quitte "Autre".
  const handleTypeChange = (value: ArticleType) => {
    setType(value);
    if (value !== "autre") setCustomType("");
  };

  // Analyse de capture d'écran.
  const [analyzing, setAnalyzing] = useState(false);
  const [detected, setDetected] = useState<ProductParseResult | null>(null);
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);

  // Recherche du prix de revente réel.
  const [searching, setSearching] = useState(false);
  const [resale, setResale] = useState<ResalePriceResult | null>(null);

  // `purchaseStr` est le PRIX AFFICHÉ de l'annonce (mode "vinted") ou le
  // coût réel exact (mode "manuel"). En mode Vinted, le coût réel payé par
  // l'acheteur inclut en plus la protection acheteur (~2 €) et la
  // livraison (~3,5 €) : c'est ce coût total qui sert de base au calcul
  // de marge. En mode manuel, aucun frais n'est ajouté.
  const displayedPrice = parseAmount(purchaseStr);
  const purchase =
    source === "vinted" ? totalPurchaseCost(displayedPrice) : displayedPrice;
  const sell = parseAmount(sellStr);

  // Calculs en temps réel (basés sur le coût d'achat réel total).
  const result = useMemo(() => {
    const gross = grossMargin(purchase, sell);
    const net = netMargin(purchase, sell);
    const multiplier = resaleMultiplier(purchase, sell);
    return { gross, net, multiplier, level: multiplierLevel(multiplier) };
  }, [purchase, sell]);

  // Fourchette de prix d'achat conseillée (à partir du prix de vente),
  // affichée quand le deal actuel n'est pas satisfaisant. En mode Vinted,
  // on retranche les frais acheteur au coût total cible pour obtenir le
  // prix à viser sur l'annonce elle-même ; en mode manuel, le coût total
  // cible EST le prix à viser (aucun frais à retrancher).
  const purchaseRange = useMemo(() => {
    const totalRange = recommendedPurchaseRange(sell);
    const fees = source === "vinted" ? BUYER_FEES_TOTAL : 0;
    const toDisplayed = (n: number) => Math.max(0, Math.round((n - fees) * 100) / 100);
    return {
      low: toDisplayed(totalRange.low),
      high: toDisplayed(totalRange.high),
      max: toDisplayed(totalRange.max),
    };
  }, [sell, source]);

  const hasInput = displayedPrice > 0 && sell > 0;

  // Sélectionne une image (galerie ou appareil), la compresse, l'analyse.
  const pickAndAnalyze = async (source: "library" | "camera") => {
    if (!isAiConfigured()) {
      notify(
        "Analyse indisponible",
        "Configure le proxy IA (constants/aiConfig.ts). Voir le README.",
      );
      return;
    }
    Keyboard.dismiss();

    const perm =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      notify("Permission refusée", "Autorise l'accès pour analyser une capture.");
      return;
    }

    const picked =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (picked.canceled || !picked.assets[0]) return;

    try {
      setAnalyzing(true);
      setDetected(null);
      setResale(null);
      // Redimensionne (max 1000px) + compresse en JPEG pour un envoi léger.
      const manip = await ImageManipulator.manipulateAsync(
        picked.assets[0].uri,
        [{ resize: { width: 1000 } }],
        {
          compress: 0.6,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        },
      );
      setScreenshotUri(manip.uri);
      const r = await parseScreenshot(manip.base64 ?? "", "image/jpeg");
      setDetected(r);
      setBrand(r.brand);
      setType(r.type);
      setSize(r.size);
      setCondition(r.condition);
      setColor(r.color);
      setMaterial(r.material);
      if (r.price != null) {
        setPurchaseStr(String(r.price).replace(".", ","));
      }
    } catch (e) {
      notify("Analyse impossible", (e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };

  // Recherche le vrai prix de revente (annonces comparables réelles sur
  // Vinted) et l'utilise comme prix de vente pour calculer la marge.
  const searchResalePrice = async () => {
    if (!brand.trim()) {
      notify("Marque manquante", "Renseigne au moins la marque pour la recherche.");
      return;
    }
    if (!isAiConfigured()) {
      notify(
        "Recherche indisponible",
        "Configure le proxy IA (constants/aiConfig.ts). Voir le README.",
      );
      return;
    }
    try {
      setSearching(true);
      Keyboard.dismiss();
      const typeWord = resolveTypeWord({ type, customType });
      const r = await estimateResalePrice(brand.trim(), typeWord, size.trim(), condition);
      setResale(r);
      if (r.averagePrice != null) {
        setSellStr(String(r.averagePrice).replace(".", ","));
      }
    } catch (e) {
      notify("Recherche impossible", (e as Error).message);
    } finally {
      setSearching(false);
    }
  };

  // Propose d'ajouter la pièce détectée au stock (écran d'ajout pré-rempli).
  const addToStock = () => {
    router.push({
      pathname: "/article/add",
      params: {
        name: detected?.title ?? "",
        brand,
        type,
        customType,
        color,
        material,
        size,
        condition,
        // Prix AFFICHÉ (pas le coût total) : l'écran d'ajout calcule lui-même
        // les frais acheteur (si mode Vinted), pour éviter de les compter
        // deux fois.
        purchasePrice: purchaseStr,
        purchaseSource: source,
        photoUri: screenshotUri ?? "",
      },
    });
  };

  return (
    <Screen>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="flex-1">
          <Header
            title="Calculateur"
            subtitle="Évalue un deal avant d'acheter"
          />

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Analyse d'une capture d'écran Vinted */}
            <Card>
              <Text className="mb-3 text-sm font-medium text-muted">
                Analyser une capture d'écran Vinted (optionnel)
              </Text>
              <View className="flex-row">
                <Button
                  title="Galerie"
                  icon="images-outline"
                  variant="secondary"
                  loading={analyzing}
                  onPress={() => pickAndAnalyze("library")}
                  className="mr-2 flex-1"
                />
                <Button
                  title="Photo"
                  icon="camera-outline"
                  variant="secondary"
                  loading={analyzing}
                  onPress={() => pickAndAnalyze("camera")}
                  className="flex-1"
                />
              </View>

              {screenshotUri ? (
                <View className="mt-3 flex-row items-center rounded-xl bg-surface p-3">
                  <Image
                    source={{ uri: screenshotUri }}
                    className="mr-3 h-12 w-12 rounded-lg bg-line"
                  />
                  <Text className="flex-1 text-sm text-ink" numberOfLines={2}>
                    Prix affiché détecté : {purchaseStr ? `${purchaseStr} €` : "—"}
                  </Text>
                </View>
              ) : null}
            </Card>

            {/* Produit : marque / type / taille / état */}
            <Card className="mt-3">
              <Input
                label="Marque"
                placeholder="Ex : Nike"
                value={brand}
                onChangeText={setBrand}
              />
              <Input
                className="mt-4"
                label="Taille"
                placeholder="Ex : M, 42, L"
                value={size}
                onChangeText={setSize}
                autoCapitalize="characters"
              />

              <Text className="mb-2 mt-4 text-sm font-medium text-muted">
                Type de pièce
              </Text>
              <SegmentedControl options={TYPE_OPTIONS} value={type} onChange={handleTypeChange} />
              {type === "autre" ? (
                <Input
                  className="mt-3"
                  placeholder="Précise le type (ex : Salopette, Bonnet…)"
                  value={customType}
                  onChangeText={setCustomType}
                />
              ) : null}

              <Text className="mb-2 mt-4 text-sm font-medium text-muted">État</Text>
              <SegmentedControl
                options={CONDITION_OPTIONS}
                value={condition}
                onChange={setCondition}
              />

              <Input
                className="mt-4"
                label="Couleur (optionnel)"
                placeholder="Ex : Bleu marine"
                value={color}
                onChangeText={setColor}
              />
              <Input
                className="mt-4"
                label="Matière (optionnel)"
                placeholder="Ex : Coton, imperméable…"
                value={material}
                onChangeText={setMaterial}
              />
            </Card>

            {/* Prix d'achat + recherche du vrai prix de revente */}
            <Card className="mt-3">
              <Text className="mb-2 text-sm font-medium text-muted">
                Provenance de l'achat
              </Text>
              <SegmentedControl options={SOURCE_OPTIONS} value={source} onChange={setSource} />

              <Input
                className="mt-4"
                label={source === "vinted" ? "Prix affiché de l'annonce" : "Prix d'achat"}
                placeholder="0,00"
                keyboardType="decimal-pad"
                value={purchaseStr}
                onChangeText={setPurchaseStr}
                suffix="€"
              />
              {source === "vinted" && displayedPrice > 0 ? (
                <Text className="mt-2 text-xs text-muted">
                  {formatEUR(displayedPrice)} + protection ({formatEUR(BUYER_PROTECTION_FEE)}) +
                  livraison ({formatEUR(BUYER_SHIPPING_FEE)}) = coût réel{" "}
                  <Text className="font-semibold text-ink">{formatEUR(purchase)}</Text>
                </Text>
              ) : null}
              {source === "manuel" ? (
                <Text className="mt-2 text-xs text-muted">
                  Achat hors Vinted : aucun frais acheteur n'est ajouté, le
                  prix saisi est utilisé tel quel.
                </Text>
              ) : null}

              <Button
                title={searching ? "Recherche…" : "Rechercher le prix de revente réel"}
                icon="search-outline"
                variant="secondary"
                loading={searching}
                onPress={searchResalePrice}
                className="mt-4"
              />

              {resale ? (
                <View className="mt-3 rounded-xl bg-surface p-3">
                  <View className="flex-row items-center">
                    <Ionicons
                      name={resale.source === "vinted_search" ? "checkmark-circle" : "alert-circle"}
                      size={16}
                      color={resale.source === "vinted_search" ? colors.text : colors.textMuted}
                    />
                    <Text className="ml-2 flex-1 text-sm font-semibold text-ink">
                      {resale.source === "vinted_search"
                        ? "Moyenne d'annonces réelles"
                        : "Estimation IA (repli)"}
                    </Text>
                  </View>

                  {/* Deux prix bien distincts, pour éviter toute confusion. */}
                  <View className="mt-2 flex-row items-center justify-between">
                    <Text className="text-sm text-muted">
                      Prix de vente réaliste{"\n"}(ce que tu devrais recevoir)
                    </Text>
                    <Text className="text-lg font-bold text-ink">
                      {formatEUR(resale.averagePrice ?? 0)}
                    </Text>
                  </View>
                  <View className="mt-2 flex-row items-center justify-between border-t border-line pt-2">
                    <Text className="text-sm text-muted">
                      Prix à afficher sur l'annonce{"\n"}(+{formatEUR(5)} marge de négociation)
                    </Text>
                    <Text className="text-lg font-bold text-ink">
                      {formatEUR(resale.listingPrice ?? 0)}
                    </Text>
                  </View>

                  {resale.source === "vinted_search" && resale.lowPrice != null ? (
                    <Text className="mt-2 border-t border-line pt-2 text-xs text-muted">
                      Basé sur {resale.sampleSize} annonce(s) comparable(s) · fourchette{" "}
                      {formatEUR(resale.lowPrice)} – {formatEUR(resale.highPrice ?? 0)}
                      {"  ·  "}médiane {formatEUR(resale.medianPrice ?? 0)}
                    </Text>
                  ) : (
                    <Text className="mt-2 border-t border-line pt-2 text-xs text-muted">
                      {resale.note}
                    </Text>
                  )}
                </View>
              ) : null}

              <Input
                className="mt-4"
                label="Prix de vente (revente réelle)"
                placeholder="0,00"
                keyboardType="decimal-pad"
                value={sellStr}
                onChangeText={setSellStr}
                suffix="€"
              />
            </Card>

            {/* Résultats : détail complet de tous les frais déduits. */}
            <Card className="mt-3">
              <ResultRow label="Prix de vente" value={formatEUR(sell)} className="mb-1.5" />
              <ResultRow
                label={source === "vinted" ? "− Prix affiché (achat)" : "− Prix d'achat"}
                value={formatEUR(displayedPrice)}
                className="mb-1.5"
              />
              {source === "vinted" ? (
                <ResultRow
                  label="− Frais acheteur (protection + livraison)"
                  value={formatEUR(BUYER_FEES_TOTAL)}
                  className="mb-1.5"
                />
              ) : null}
              <ResultRow label="− Frais de sachet (envoi)" value={formatEUR(SACHET_FEE)} />
              <View className="my-2 h-px bg-line" />
              <ResultRow label="Marge nette" value={formatEUR(result.net)} strong />
              <View className="my-2 h-px bg-line" />
              <ResultRow
                label="Multiplicateur du coût réel"
                value={result.multiplier > 0 ? `x${result.multiplier.toFixed(2)}` : "—"}
              />
            </Card>

            {/* Indicateur visuel : cible x2-x2,5, minimum x1,5 (seule couleur de l'app) */}
            {hasInput ? (
              <View className="mt-3">
                <MarginIndicator
                  level={result.level}
                  label={`x${result.multiplier.toFixed(2)}`}
                  title={multiplierLabel(result.multiplier)}
                />
                <Text className="mt-2 text-center text-xs text-muted">
                  Cible : x2 à x2,5 le prix d'achat · minimum acceptable : x1,5
                </Text>
              </View>
            ) : null}

            {/* Marge trop faible : prix d'achat conseillé pour un deal correct. */}
            {hasInput && result.level !== "high" ? (
              <Card className="mt-3">
                <View className="flex-row items-center">
                  <Ionicons name="bulb-outline" size={18} color={colors.text} />
                  <Text className="ml-2 text-sm font-semibold text-ink">
                    {source === "vinted"
                      ? "Prix affiché conseillé pour ce prix de vente"
                      : "Prix d'achat conseillé pour ce prix de vente"}
                  </Text>
                </View>
                <Text className="mt-2 text-2xl font-bold text-ink">
                  {formatEUR(purchaseRange.low)} – {formatEUR(purchaseRange.high)}
                </Text>
                <Text className="mt-1 text-xs text-muted">
                  Pour un deal cible (x2 à x2,5) sur un prix de vente de{" "}
                  {formatEUR(sell)}
                  {source === "vinted" ? ", frais acheteur inclus" : ""}. À ne
                  pas dépasser : {formatEUR(purchaseRange.max)} (minimum
                  acceptable x1,5).
                </Text>
              </Card>
            ) : null}

            {!hasInput ? (
              <Text className="mt-6 text-center text-sm text-muted">
                Renseigne un prix d'achat et un prix de vente (ou lance la
                recherche du prix de revente réel) pour évaluer le deal.
              </Text>
            ) : null}

            {/* Ajout au stock si la pièce a été achetée. */}
            {hasInput ? (
              <Button
                title="Ajouter au stock"
                icon="add-circle-outline"
                variant="secondary"
                onPress={addToStock}
                className="mt-3"
              />
            ) : null}
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </Screen>
  );
}

// Petite ligne "libellé — valeur" réutilisée dans les résultats.
function ResultRow({
  label,
  value,
  strong = false,
  className = "",
}: {
  label: string;
  value: string;
  strong?: boolean;
  className?: string;
}) {
  return (
    <View className={`flex-row items-center justify-between ${className}`}>
      <Text
        className={`text-base ${strong ? "font-semibold text-ink" : "text-muted"}`}
      >
        {label}
      </Text>
      <Text
        className={`${strong ? "text-xl font-bold" : "text-lg font-semibold"} text-ink`}
      >
        {value}
      </Text>
    </View>
  );
}
