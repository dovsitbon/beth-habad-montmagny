"use client";

import { useId, useRef, useState } from "react";
import { CameraIcon, TrashIcon } from "@phosphor-icons/react";
import { compressAndUpload } from "@/lib/image-upload";
import { btn } from "./styles";

/**
 * Champ « photo » : prise de vue directe ou choix dans la galerie du téléphone.
 * La photo est compressée puis envoyée tout de suite ; seul son chemin est transmis au formulaire.
 */
export function ImageField({
  name,
  label,
  folder,
  defaultPath,
  publicBaseUrl,
  hint,
}: {
  name: string;
  label: string;
  folder: string;
  defaultPath?: string | null;
  publicBaseUrl: string;
  hint?: string;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState(defaultPath ?? "");
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    setStatus("uploading");
    setError("");
    try {
      const { path: newPath } = await compressAndUpload(file, folder);
      setPath(newPath);
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "L'envoi de la photo a échoué.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <p className="font-semibold text-ink">
        {label} <span className="font-normal text-ink-muted">(facultatif)</span>
      </p>
      {hint && <p className="mt-0.5 text-sm text-ink-muted">{hint}</p>}

      {path && (
        // eslint-disable-next-line @next/next/no-img-element -- aperçu immédiat d'une image tout juste envoyée
        <img src={`${publicBaseUrl}/${path}`} alt="Aperçu de la photo" className="mt-2 max-h-56 rounded-lg border border-line object-cover" />
      )}

      <div className="mt-2 flex flex-wrap gap-2">
        <label htmlFor={id} className={`${btn.secondary} cursor-pointer`}>
          <CameraIcon aria-hidden weight="bold" className="size-5" />
          {status === "uploading" ? "Envoi en cours…" : path ? "Changer la photo" : "Prendre ou choisir une photo"}
        </label>
        {path && status !== "uploading" && (
          <button type="button" onClick={() => setPath("")} className={btn.danger}>
            <TrashIcon aria-hidden weight="bold" className="size-5" />
            Retirer
          </button>
        )}
      </div>
      {/* Pas d'attribut « capture » : le téléphone propose alors « Appareil photo » ou « Photothèque ». */}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={status === "uploading"}
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      {status === "error" && (
        <p role="alert" className="mt-2 text-sm font-semibold text-red-800">
          {error}
        </p>
      )}
      <input type="hidden" name={name} value={path} />
    </div>
  );
}
