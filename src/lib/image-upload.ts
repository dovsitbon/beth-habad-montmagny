"use client";

import imageCompression from "browser-image-compression";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { siteId } from "@/lib/supabase/env";

/**
 * Compresse une photo dans le navigateur (format WebP, 2000 px max) puis l'envoie
 * dans le stockage Supabase. Une photo de téléphone de 5 Mo devient ~300 Ko.
 * Renvoie le chemin dans le bucket « media » et les dimensions finales.
 */
export async function compressAndUpload(
  file: File,
  folder: string,
  maxSide = 2000,
): Promise<{ path: string; width: number; height: number }> {
  if (!file.type.startsWith("image/")) throw new Error("Ce fichier n'est pas une image.");

  const compressed = await imageCompression(file, {
    maxWidthOrHeight: maxSide,
    maxSizeMB: 0.8,
    fileType: "image/webp",
    initialQuality: 0.82,
    useWebWorker: true,
  });

  const { width, height } = await imageSize(compressed);
  // Arborescence multi-tenant : {site_id}/{catégorie}/{fichier} (la base refuse tout autre dossier).
  const path = `${siteId()}/${folder}/${crypto.randomUUID()}.webp`;
  const { error } = await createBrowserSupabase()
    .storage.from("media")
    .upload(path, compressed, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) throw new Error("L'envoi de la photo a échoué. Vérifiez votre connexion internet.");
  return { path, width, height };
}

function imageSize(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = url;
  });
}
