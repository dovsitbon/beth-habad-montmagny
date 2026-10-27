import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site.config";
import { getSettings } from "@/lib/data/settings";
import { mediaUrl } from "@/lib/format";

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
        {s.logoPath ? (
          // Emblème du Beth Habad sur une pastille claire (il est bleu et or).
          <div style={{ display: "flex", padding: 18, borderRadius: 24, background: "#ffffff", marginBottom: 36, alignSelf: "flex-start" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse n'accepte que <img> */}
            <img src={mediaUrl(s.logoPath)} alt="" height={120} style={{ height: 120 }} />
          </div>
        ) : (
          <div style={{ display: "flex", width: 120, height: 8, background: s.colors.accent, marginBottom: 40 }} />
        )}
        <div style={{ display: "flex", fontSize: 34, color: s.colors.accent, letterSpacing: 4, textTransform: "uppercase" }}>
          Centre communautaire
        </div>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 700, lineHeight: 1.05, marginTop: 12 }}>{s.shortName}</div>
        <div style={{ display: "flex", fontSize: 38, marginTop: 30, color: s.colors.accent }}>
          Chabbat · Offices · Événements · Cours
        </div>
        <div style={{ display: "flex", fontSize: 30, marginTop: 16, opacity: 0.8 }}>
          {siteConfig.address.region}
        </div>
      </div>
    ),
    size,
  );
}
