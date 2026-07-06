// ÉCRAN 3 — AJOUTER UN ARTICLE : photo + formulaire + calculs automatiques.
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { Screen } from "../../components/Screen";
import {
  SegmentedControl,
  type SegmentOption,
} from "../../components/SegmentedControl";
import { CONDITION_LABELS, TYPE_LABELS } from "../../constants/labels";
import { colors } from "../../constants/theme";
import { useStore } from "../../context/StoreContext";
import type { ArticleCondition, ArticleType } from "../../types";
import { notify } from "../../utils/alert";
import { netMargin, recommendedPrice } from "../../utils/calculations";
import { formatEUR, parseAmount } from "../../utils/format";

// Options des sélecteurs (dérivées des libellés).
const TYPE_OPTIONS: SegmentOption<ArticleType>[] = (
  Object.keys(TYPE_LABELS) as ArticleType[]
).map((value) => ({ value, label: TYPE_LABELS[value] }));

const CONDITION_OPTIONS: SegmentOption<ArticleCondition>[] = (
  Object.keys(CONDITION_LABELS) as ArticleCondition[]
).map((value) => ({ value, label: CONDITION_LABELS[value] }));

export default function AddArticleScreen() {
  const router = useRouter();
  const { addArticle } = useStore();

  // Paramètres éventuels (pré-remplissage depuis l'analyse d'une capture).
  const params = useLocalSearchParams<{
    name?: string;
    brand?: string;
    type?: string;
    size?: string;
    condition?: string;
    purchasePrice?: string;
    photoUri?: string;
  }>();

  // Valide une valeur de paramètre par rapport aux valeurs autorisées.
  const initialType: ArticleType =
    params.type && params.type in TYPE_LABELS
      ? (params.type as ArticleType)
      : "tshirt";
  const initialCondition: ArticleCondition =
    params.condition && params.condition in CONDITION_LABELS
      ? (params.condition as ArticleCondition)
      : "tres_bon";
  const initialPurchase = params.purchasePrice ?? "";

  // Vrai si l'écran est ouvert depuis l'analyse d'une capture d'écran.
  const fromScreenshot = !!(params.purchasePrice || params.photoUri);

  // Champs du formulaire (pré-remplis si des paramètres sont fournis).
  const [photoUri, setPhotoUri] = useState<string | null>(
    params.photoUri || null,
  );
  const [name, setName] = useState(params.name ?? "");
  const [brand, setBrand] = useState(params.brand ?? "");
  const [type, setType] = useState<ArticleType>(initialType);
  const [size, setSize] = useState(params.size ?? "");
  const [condition, setCondition] = useState<ArticleCondition>(initialCondition);
  const [purchaseStr, setPurchaseStr] = useState(initialPurchase);
  // Prix de vente conseillé pré-calculé si un prix d'achat est fourni.
  const [targetStr, setTargetStr] = useState(() => {
    const p = parseAmount(initialPurchase);
    return p > 0 ? recommendedPrice(p).toFixed(2).replace(".", ",") : "";
  });
  // Vrai dès que l'utilisateur modifie manuellement le prix de vente
  // (on cesse alors de le remplir automatiquement).
  const [targetTouched, setTargetTouched] = useState(false);

  const purchase = parseAmount(purchaseStr);
  const target = parseAmount(targetStr);
  const margin = netMargin(purchase, target);

  // À chaque changement du prix d'achat, on propose un prix de vente
  // conseillé (× 2,2) tant que l'utilisateur n'a rien saisi manuellement.
  const handlePurchaseChange = (value: string) => {
    setPurchaseStr(value);
    if (!targetTouched) {
      const p = parseAmount(value);
      setTargetStr(p > 0 ? recommendedPrice(p).toFixed(2).replace(".", ",") : "");
    }
  };

  // Applique le prix conseillé sur simple tap.
  const applyRecommended = () => {
    if (purchase > 0) {
      setTargetStr(recommendedPrice(purchase).toFixed(2).replace(".", ","));
      setTargetTouched(true);
    }
  };

  // Sélection d'une photo depuis la galerie.
  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      notify("Permission refusée", "Autorise l'accès aux photos pour ajouter une image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  // Prise de photo avec l'appareil.
  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      notify("Permission refusée", "Autorise l'accès à l'appareil photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  // Validation puis enregistrement.
  const handleSave = () => {
    if (!brand.trim()) {
      notify("Champ requis", "Renseigne au moins la marque.");
      return;
    }
    if (purchase <= 0 || target <= 0) {
      notify("Prix invalides", "Saisis un prix d'achat et un prix de vente valides.");
      return;
    }

    addArticle({
      name: name.trim(),
      brand: brand.trim(),
      type,
      size: size.trim(),
      condition,
      purchasePrice: purchase,
      targetPrice: target,
      photoUri,
    });

    router.back();
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Barre supérieure : titre + fermeture. */}
        <View className="flex-row items-center justify-between px-5 pb-2 pt-2">
          <Text className="text-2xl font-bold text-ink">Nouvel article</Text>
          <Pressable
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center rounded-full bg-surface"
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Photo */}
          <View className="items-center py-2">
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                className="h-40 w-40 rounded-2xl bg-surface"
              />
            ) : (
              <View className="h-40 w-40 items-center justify-center rounded-2xl border border-dashed border-line bg-surface">
                <Ionicons name="image-outline" size={40} color={colors.textMuted} />
              </View>
            )}
            <View className="mt-3 flex-row">
              <Button
                title="Galerie"
                icon="images-outline"
                variant="secondary"
                onPress={pickFromLibrary}
                className="mr-2 px-4"
              />
              <Button
                title="Photo"
                icon="camera-outline"
                variant="secondary"
                onPress={takePhoto}
                className="px-4"
              />
            </View>
          </View>

          {/* Informations texte */}
          <Card className="mt-2">
            <Input
              label="Nom de l'article (optionnel)"
              placeholder="Ex : Sweat oversize"
              value={name}
              onChangeText={setName}
            />
            <Input
              className="mt-4"
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
          </Card>

          {/* Type de pièce */}
          <Text className="mb-2 mt-5 text-sm font-medium text-muted">
            Type de pièce
          </Text>
          <SegmentedControl
            options={TYPE_OPTIONS}
            value={type}
            onChange={setType}
          />

          {/* État */}
          <Text className="mb-2 mt-5 text-sm font-medium text-muted">État</Text>
          <SegmentedControl
            options={CONDITION_OPTIONS}
            value={condition}
            onChange={setCondition}
          />

          {/* Prix */}
          <Card className="mt-5">
            <Input
              label="Prix d'achat"
              placeholder="0,00"
              keyboardType="decimal-pad"
              value={purchaseStr}
              onChangeText={handlePurchaseChange}
              suffix="€"
            />
            {fromScreenshot ? (
              <Text className="mt-2 text-xs text-muted">
                ✓ Prix détecté sur la capture. Confirme le coût d'achat réellement
                payé pour des statistiques justes.
              </Text>
            ) : null}
            <Input
              className="mt-4"
              label="Prix de vente visé"
              placeholder="0,00"
              keyboardType="decimal-pad"
              value={targetStr}
              onChangeText={(v) => {
                setTargetTouched(true);
                setTargetStr(v);
              }}
              suffix="€"
            />

            {/* Suggestion de prix conseillé (× 2,2). */}
            {purchase > 0 ? (
              <Pressable
                onPress={applyRecommended}
                className="mt-3 flex-row items-center justify-center rounded-xl bg-surface py-2 active:opacity-70"
              >
                <Ionicons name="sparkles-outline" size={16} color={colors.text} />
                <Text className="ml-2 text-sm font-medium text-ink">
                  Prix conseillé : {formatEUR(recommendedPrice(purchase))} (× 2,2)
                </Text>
              </Pressable>
            ) : null}

            {/* Marge nette calculée en direct. */}
            {purchase > 0 && target > 0 ? (
              <View className="mt-4 flex-row items-center justify-between border-t border-line pt-3">
                <Text className="text-base text-muted">Marge nette estimée</Text>
                <Text className="text-xl font-bold text-ink">
                  {formatEUR(margin)}
                </Text>
              </View>
            ) : null}
          </Card>

          {/* Enregistrer */}
          <Button
            title="Ajouter au stock"
            icon="add-circle-outline"
            onPress={handleSave}
            className="mt-6"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
