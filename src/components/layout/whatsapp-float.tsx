import { WhatsappLogoIcon } from "@phosphor-icons/react/ssr";
import { getSettings } from "@/lib/data/settings";
import { whatsappHref } from "@/lib/format";
import { WhatsAppFloatButton } from "./whatsapp-float-button";

/** Bouton rond WhatsApp fixé en bas à droite de toutes les pages publiques. */
export async function WhatsAppFloat() {
  const { whatsapp } = await getSettings();
  if (!whatsapp) return null;
  return (
    <WhatsAppFloatButton>
      <a
        href={whatsappHref(whatsapp)}
        target="_blank"
        rel="noopener"
        className="inline-flex size-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-[var(--shadow-lift)] ring-4 ring-white/70 transition-transform hover:scale-105"
      >
        <WhatsappLogoIcon aria-hidden weight="fill" className="size-8" />
        <span className="sr-only">Écrire au Beth Habad sur WhatsApp (nouvel onglet)</span>
      </a>
    </WhatsAppFloatButton>
  );
}
