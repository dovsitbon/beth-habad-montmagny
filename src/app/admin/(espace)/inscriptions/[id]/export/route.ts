import { getMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { formatDateTimeLong, isoDateInParis } from "@/lib/format";

/** Export CSV des inscriptions (séparateur « ; » et BOM UTF-8 : s'ouvre directement dans Excel en français). */
export async function GET(_req: Request, ctx: RouteContext<"/admin/inscriptions/[id]/export">) {
  if (!(await getMember())) return new Response("Accès refusé", { status: 401 });
  const { id } = await ctx.params;
  const supabase = await createSessionClient();
  const [{ data: event }, { data: regs }] = await Promise.all([
    supabase.from("events").select("title, slug, starts_at").eq("id", id).maybeSingle(),
    supabase.from("registrations").select("*").eq("event_id", id).order("created_at"),
  ]);
  if (!event) return new Response("Introuvable", { status: 404 });

  const cell = (v: string | number | null) => {
    const s = String(v ?? "");
    // Neutralise les formules (=, +, -, @) qu'un tableur exécuterait.
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const rows = [
    ["Nom", "Nombre de personnes", "Téléphone", "E-mail", "Date d'inscription"],
    ...(regs ?? []).map((r) => [r.name, r.party_size, r.phone, r.email, formatDateTimeLong(r.created_at)]),
  ];
  const csv = "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inscriptions-${event.slug}-${isoDateInParis(event.starts_at)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
