// ============================================================
// Compression d'image partagée (ajout d'article, analyse IA).
//
// Toutes les photos sont stockées en base64 (data: URI) directement
// dans le stockage local, dans UN SEUL bloc JSON regroupant tous les
// articles. Sur iOS Safari, le quota de localStorage est limité
// (~5 Mo pour tout le site) : quelques photos non compressées suffisent
// à le dépasser, ce qui fait échouer la sauvegarde en silence — les
// articles ajoutés semblent fonctionner puis disparaissent au rechargement.
// D'où l'importance de toujours réduire les photos avant stockage.
// ============================================================

import * as ImageManipulator from "expo-image-manipulator";

export interface CompressedImage {
  /** URI de l'image compressée (persistante, en `data:` sur le web). */
  uri: string;
  /** Contenu base64 (sans préfixe data:), fourni seulement si demandé. */
  base64?: string;
}

/** Redimensionne et compresse une image (JPEG) avant stockage/envoi. */
export async function compressImage(
  uri: string,
  options: { maxWidth?: number; quality?: number; base64?: boolean } = {},
): Promise<CompressedImage> {
  const { maxWidth = 800, quality = 0.5, base64 = false } = options;
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxWidth } }],
    { compress: quality, format: ImageManipulator.SaveFormat.JPEG, base64 },
  );
  return { uri: result.uri, base64: result.base64 };
}
