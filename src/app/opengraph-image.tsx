import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site.config";
import { getSettings } from "@/lib/data/settings";

/** Image de partage par défaut (WhatsApp, Facebook…) : nom du Beth Habad sur fond bleu nuit. */
export const alt = "Beth Habad";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const s = await getSettings();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: s.colors.primary,
          color: "#ffffff",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", width: 120, height: 8, background: s.colors.accent, marginBottom: 40 }} />
        <div style={{ display: "flex", fontSize: 88, fontWeight: 700, lineHeight: 1.05 }}>{s.name}</div>
        <div style={{ display: "flex", fontSize: 38, marginTop: 30, color: s.colors.accent }}>
          Chabbat · Offices · Événements · Cours
        </div>
        <div style={{ display: "flex", fontSize: 30, marginTop: 16, opacity: 0.8 }}>
          {[s.address.city, siteConfig.address.region].filter(Boolean).join(" · ")}
        </div>
      </div>
    ),
    size,
  );
}
