// ÉCRAN 6 — CALCULATEUR DE MARGE : outil rapide, sans sauvegarde.
// Bonus : analysez une CAPTURE D'ÉCRAN Vinted pour pré-remplir le prix
// d'achat + les infos produit (vision OpenAI, côté serveur). Si vous avez
// acheté la pièce, un bouton propose de l'ajouter au stock (avec
// confirmation du coût d'achat final, pour des stats justes).
import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
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
import { SACHET_FEE } from "../../constants/config";
import { CONDITION_LABELS, TYPE_LABELS } from "../../constants/labels";
import { colors } from "../../constants/theme";
import {
  grossMargin,
  marginLevel,
  marginPercent,
  netMargin,
} from "../../utils/calculations";
import { formatEUR, formatPercent, parseAmount } from "../../utils/format";
import {
  isAiConfigured,
  parseScreenshot,
  type ProductParseResult,
} from "../../utils/ai";

export default function CalculateurScreen() {
  const router = useRouter();
  const [purchaseStr, setPurchaseStr] = useState("");
  const [sellStr, setSellStr] = useState("");

  // Analyse de capture d'écran.
  const [analyzing, setAnalyzing] = useState(false);
  const [detected, setDetected] = useState<ProductParseResult | null>(null);
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);

  const purchase = parseAmount(purchaseStr);
  const sell = parseAmount(sellStr);

  // Calculs en temps réel.
  const result = useMemo(() => {
    const gross = grossMargin(purchase, sell);
    const net = netMargin(purchase, sell);
    const percent = marginPercent(purchase, sell);
    return { gross, net, percent, level: marginLevel(percent) };
  }, [purchase, sell]);

  const hasInput = purchase > 0 || sell > 0;

  // Sélectionne une image (galerie ou appareil), la compresse, l'analyse.
  const pickAndAnalyze = async (source: "library" | "camera") => {
    if (!isAiConfigured()) {
      Alert.alert(
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
      Alert.alert("Permission refusée", "Autorise l'accès pour analyser une capture.");
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
      if (r.price != null) {
        setPurchaseStr(String(r.price).replace(".", ","));
      }
    } catch (e) {
      Alert.alert("Analyse impossible", (e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };

  // Propose d'ajouter la pièce détectée au stock (écran d'ajout pré-rempli).
  const addToStock = () => {
    if (!detected) return;
    router.push({
      pathname: "/article/add",
      params: {
        name: detected.title,
        brand: detected.brand,
        type: detected.type,
        size: detected.size,
        condition: detected.condition,
        // Le prix détecté est PROPOSÉ : l'écran d'ajout demande de confirmer
        // le coût d'achat réellement payé.
        purchasePrice: detected.price != null ? String(detected.price) : "",
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
                Analyser une capture d'écran Vinted
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

              {detected ? (
                <View className="mt-3">
                  <View className="flex-row items-center rounded-xl bg-surface p-3">
                    {screenshotUri ? (
                      <Image
                        source={{ uri: screenshotUri }}
                        className="mr-3 h-12 w-12 rounded-lg bg-line"
                      />
                    ) : (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.text}
                        style={{ marginRight: 8 }}
                      />
                    )}
                    <Text className="flex-1 text-sm text-ink" numberOfLines={2}>
                      {[
                        detected.brand,
                        detected.size,
                        TYPE_LABELS[detected.type],
                        CONDITION_LABELS[detected.condition],
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Aucune info détectée"}
                    </Text>
                  </View>
                  {/* Proposition d'ajout au stock (si la pièce a été achetée). */}
                  <Button
                    title="Ajouter au stock"
                    icon="add-circle-outline"
                    onPress={addToStock}
                    className="mt-3"
                  />
                </View>
              ) : null}
            </Card>

            {/* Saisie */}
            <Card className="mt-3">
              <Input
                label="Prix d'achat"
                placeholder="0,00"
                keyboardType="decimal-pad"
                value={purchaseStr}
                onChangeText={setPurchaseStr}
                suffix="€"
              />
              <Input
                className="mt-4"
                label="Prix de vente"
                placeholder="0,00"
                keyboardType="decimal-pad"
                value={sellStr}
                onChangeText={setSellStr}
                suffix="€"
              />
            </Card>

            {/* Résultats */}
            <Card className="mt-3">
              <ResultRow label="Marge brute" value={formatEUR(result.gross)} />
              <View className="my-2 h-px bg-line" />
              <ResultRow
                label={`Marge nette (− ${formatEUR(SACHET_FEE)} sachet)`}
                value={formatEUR(result.net)}
                strong
              />
              <View className="my-2 h-px bg-line" />
              <ResultRow
                label="Pourcentage de marge"
                value={formatPercent(result.percent)}
              />
            </Card>

            {/* Indicateur visuel (seule couleur de l'app) */}
            {hasInput ? (
              <View className="mt-3">
                <MarginIndicator
                  level={result.level}
                  label={formatPercent(result.percent)}
                />
              </View>
            ) : (
              <Text className="mt-6 text-center text-sm text-muted">
                Saisis les prix, ou analyse une capture d'écran Vinted pour
                évaluer la marge.
              </Text>
            )}
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
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between">
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
