import { DonateButton } from "./donate-button";

/** Barre fixe en bas de l'écran sur mobile : le bouton Don reste toujours à portée de pouce. */
export function MobileDonateBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-canvas/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
      <DonateButton className="w-full" />
    </div>
  );
}
