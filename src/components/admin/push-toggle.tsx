"use client";

import { useEffect, useState } from "react";
import { BellRingingIcon, BellSimpleSlashIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { deletePushSubscription, savePushSubscription, sendTestNotification } from "@/app/admin/(espace)/notifications/actions";
import { btn } from "./styles";

type Status = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/** Clé publique VAPID (base64 URL) → octets attendus par pushManager.subscribe. */
function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function deviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  return "Autre appareil";
}

async function registration() {
  return navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" });
}

/**
 * « Recevoir les notifications sur ce téléphone » : nouveau message ou nouvelle inscription.
 * Sur iPhone, les notifications ne marchent que dans l'admin ajoutée à l'écran d'accueil.
 */
export function PushToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");

  useEffect(() => {
    (async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) {
        const ios = /iPhone|iPad/.test(navigator.userAgent);
        const standalone = window.matchMedia("(display-mode: standalone)").matches;
        setStatus(ios && !standalone ? "ios-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") return setStatus("denied");
      const reg = await registration();
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub && Notification.permission === "granted" ? "on" : "off");
    })().catch(() => setStatus("unsupported"));
  }, []);

  if (!PUBLIC_KEY || status === "loading") return null;

  async function enable() {
    setBusy(true);
    setInfo("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await registration();
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUBLIC_KEY!) }));
      const json = sub.toJSON();
      const { ok } = await savePushSubscription({ endpoint: json.endpoint, keys: json.keys, device: deviceName() });
      if (!ok) {
        setInfo("L'activation n'a pas abouti. Merci de réessayer.");
        return;
      }
      setStatus("on");
      await sendTestNotification();
      setInfo("C'est activé : une notification d'essai vient d'être envoyée.");
    } catch {
      setInfo("L'activation n'a pas abouti. Merci de réessayer.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setInfo("");
    try {
      const reg = await registration();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    const { sent } = await sendTestNotification().finally(() => setBusy(false));
    setInfo(sent ? "Notification d'essai envoyée." : "Aucune notification n'a pu être envoyée : désactivez puis réactivez.");
  }

  const on = status === "on";
  return (
    <section aria-labelledby="notifications" className={`rounded-xl border p-4 ${on ? "border-line bg-surface" : "border-gold bg-gold-tint"}`}>
      <h2 id="notifications" className="flex items-center gap-2 text-xl text-night">
        <BellRingingIcon aria-hidden weight="duotone" className="size-6 text-gold-ink" />
        Notifications sur ce téléphone
      </h2>

      {status === "off" && (
        <>
          <p className="mt-2">Soyez prévenu dès qu&apos;un message ou une inscription arrive par le site.</p>
          <button type="button" onClick={enable} disabled={busy} className={`${btn.primary} mt-3 w-full sm:w-auto`}>
            <BellRingingIcon aria-hidden weight="bold" className="size-5" />
            {busy ? "Activation…" : "Activer les notifications"}
          </button>
        </>
      )}

      {on && (
        <>
          <p className="mt-2 text-ink-muted">Activées : vous êtes prévenu à chaque nouveau message ou inscription.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={test} disabled={busy} className={btn.small}>
              <PaperPlaneTiltIcon aria-hidden weight="bold" className="size-4" />
              Envoyer un essai
            </button>
            <button type="button" onClick={disable} disabled={busy} className={btn.small}>
              <BellSimpleSlashIcon aria-hidden weight="bold" className="size-4" />
              Désactiver
            </button>
          </div>
        </>
      )}

      {status === "ios-install" && (
        <p className="mt-2">
          Sur iPhone, ajoutez d&apos;abord l&apos;admin à l&apos;écran d&apos;accueil : bouton <strong>Partager</strong>, puis{" "}
          <strong>Sur l&apos;écran d&apos;accueil</strong>. Ouvrez ensuite l&apos;admin depuis cette icône pour activer les notifications.
        </p>
      )}

      {status === "denied" && (
        <p className="mt-2">
          Les notifications sont bloquées pour ce site. Autorisez-les dans les réglages du téléphone (Notifications), puis rechargez la page.
        </p>
      )}

      {status === "unsupported" && <p className="mt-2 text-ink-muted">Ce navigateur ne permet pas de recevoir les notifications.</p>}

      <p role="status" aria-live="polite" className="mt-2 text-sm font-semibold text-night empty:hidden">
        {info}
      </p>
    </section>
  );
}
