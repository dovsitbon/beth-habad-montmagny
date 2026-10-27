"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import { btn } from "./styles";

/** « Copier le message WhatsApp » et « Partager sur WhatsApp » (lien wa.me avec le texte). */
export function WhatsAppButtons({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Navigateurs anciens : copie via une zone de texte temporaire.
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.append(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button type="button" onClick={copy} className={btn.primary}>
        {copied ? <CheckIcon aria-hidden weight="bold" className="size-5" /> : <CopyIcon aria-hidden weight="bold" className="size-5" />}
        {copied ? "Message copié" : "Copier le message WhatsApp"}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(text)}`}
        target="_blank"
        rel="noopener"
        className={`${btn.secondary} border-[#1f7a46]/40 text-[#1f7a46]`}
      >
        <WhatsappLogoIcon aria-hidden weight="fill" className="size-5" />
        Partager sur WhatsApp
      </a>
      <p role="status" aria-live="polite" className="sr-only">
        {copied ? "Le message est copié : collez-le dans le groupe WhatsApp." : ""}
      </p>
    </div>
  );
}
