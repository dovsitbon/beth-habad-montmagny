import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Database } from "@/lib/supabase/database.types";
import type { WeekAdjustments } from "@/lib/horaires/calcul";
import { addDays, todayISO } from "@/lib/format";

type Tables = Database["public"]["Tables"];
export type Announcement = Tables["announcements"]["Row"];
export type ServiceTime = Tables["service_times"]["Row"];
export type EventRow = Tables["events"]["Row"];
export type Page = Tables["pages"]["Row"];

/**
 * Lectures publiques mises en cache. Chaque fonction porte un tag ; l'admin
 * invalide ce tag (updateTag) à chaque publication pour une mise à jour immédiate.
 */

export async function getActiveAnnouncements(): Promise<Announcement[]> {
  "use cache";
  cacheTag("announcements");
  // Court : une annonce doit disparaître peu après sa date d'expiration.
  cacheLife("minutes");

  const { data, error } = await createPublicClient()
    .from("announcements")
    .select("*")
    .order("level", { ascending: false })
    .order("starts_at", { ascending: false })
    .limit(3);
  if (error) console.error("Lecture des annonces impossible.", error);
  return data ?? [];
}

export async function getServiceTimes(): Promise<ServiceTime[]> {
  "use cache";
  cacheTag("service_times");
  cacheLife("days");

  const { data, error } = await createPublicClient()
    .from("service_times")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order")
    .order("time", { nullsFirst: false });
  if (error) console.error("Lecture des horaires des offices impossible.", error);
  return data ?? [];
}

export async function getPage(slug: string): Promise<Page | null> {
  "use cache";
  cacheTag("pages", `page:${slug}`);
  cacheLife("days");

  const { data, error } = await createPublicClient().from("pages").select("*").eq("slug", slug).maybeSingle();
  if (error) console.error(`Lecture de la page « ${slug} » impossible.`, error);
  return data;
}

/** Ajustements des semaines récentes et à venir (page « Ce Chabbat » de l'admin). */
export async function getScheduleWeeks(): Promise<WeekAdjustments[]> {
  "use cache";
  cacheTag("schedule_weeks");
  cacheLife("days");

  const { data, error } = await createPublicClient()
    .from("schedule_weeks")
    .select("*")
    .gte("date", addDays(todayISO(), -10));
  // Avant la migration, la table n'existe pas encore : les horaires restent calculés.
  if (error) console.error("Lecture des horaires de la semaine impossible.", error);
  return (data ?? []).map(toWeekAdjustments);
}

/** Ligne de schedule_weeks → ajustements utilisés par le calcul (JSON vérifié). */
export function toWeekAdjustments(row: Tables["schedule_weeks"]["Row"]): WeekAdjustments {
  const times = row.times && typeof row.times === "object" && !Array.isArray(row.times) ? row.times : {};
  const extras = Array.isArray(row.extra_lines) ? row.extra_lines : [];
  return {
    date: row.date,
    title: row.title,
    kidouch: row.kidouch,
    note: row.note,
    closing: row.closing,
    times: Object.fromEntries(
      Object.entries(times).filter((e): e is [string, string] => typeof e[1] === "string" && /^\d{2}:\d{2}$/.test(e[1])),
    ),
    hidden: row.hidden ?? [],
    extra_lines: extras.flatMap((x) => {
      if (!x || typeof x !== "object" || Array.isArray(x)) return [];
      const { section, label, time } = x as Record<string, unknown>;
      if (typeof section !== "string" || typeof label !== "string" || !label.trim()) return [];
      return [{ section, label: label.trim(), time: typeof time === "string" && /^\d{2}:\d{2}$/.test(time) ? time : null }];
    }),
  };
}

/** Prochains événements publiés (toutes catégories ou une seule). */
export async function getUpcomingEvents(limit: number, category?: EventRow["category"]): Promise<EventRow[]> {
  "use cache";
  cacheTag("events");
  cacheLife("hours");

  let query = createPublicClient()
    .from("events")
    .select("*")
    .gte("starts_at", new Date(Date.now() - 6 * 3600 * 1000).toISOString())
    .order("starts_at")
    .limit(limit);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) console.error("Lecture des événements impossible.", error);
  return data ?? [];
}

/** Événements passés, du plus récent au plus ancien. */
export async function getPastEvents(limit: number, category?: EventRow["category"]): Promise<EventRow[]> {
  "use cache";
  cacheTag("events");
  cacheLife("hours");

  let query = createPublicClient()
    .from("events")
    .select("*")
    .lt("starts_at", new Date(Date.now() - 6 * 3600 * 1000).toISOString())
    .order("starts_at", { ascending: false })
    .limit(limit);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) console.error("Lecture des événements passés impossible.", error);
  return data ?? [];
}

export async function getEventBySlug(slug: string): Promise<EventRow | null> {
  "use cache";
  cacheTag("events", `event:${slug}`);
  cacheLife("hours");

  const { data, error } = await createPublicClient().from("events").select("*").eq("slug", slug).maybeSingle();
  if (error) console.error(`Lecture de l'événement « ${slug} » impossible.`, error);
  return data;
}

/** Slugs des événements publiés (pré-génération des pages détail). */
export async function getEventSlugs(): Promise<string[]> {
  "use cache";
  cacheTag("events");
  cacheLife("hours");

  const { data } = await createPublicClient().from("events").select("slug").limit(500);
  return (data ?? []).map((e) => e.slug);
}

/** Places déjà réservées (sans données personnelles). Invalidé à chaque inscription. */
export async function getSeatsTaken(eventId: string): Promise<number> {
  "use cache";
  cacheTag(`seats:${eventId}`);
  cacheLife("minutes");

  const { data, error } = await createPublicClient().rpc("event_seats_taken", { p_event_id: eventId });
  if (error) console.error("Lecture du nombre de places impossible.", error);
  return data ?? 0;
}

export type Course = Tables["courses"]["Row"];

export async function getCourses(): Promise<Course[]> {
  "use cache";
  cacheTag("courses");
  cacheLife("days");

  const { data, error } = await createPublicClient()
    .from("courses")
    .select("*")
    .order("sort_order")
    .order("day_of_week", { nullsFirst: false })
    .order("start_time", { nullsFirst: false });
  if (error) console.error("Lecture des cours impossible.", error);
  return data ?? [];
}

export type Album = Tables["albums"]["Row"] & { cover: Pick<Photo, "storage_path" | "width" | "height"> | null; photoCount: number };
export type Photo = Tables["photos"]["Row"];

/** Albums publiés, du plus récent au plus ancien, avec leur photo de couverture. */
export async function getAlbums(): Promise<Album[]> {
  "use cache";
  cacheTag("albums");
  cacheLife("days");

  const { data, error } = await createPublicClient()
    .from("albums")
    .select("*, photos!photos_album_id_fkey(storage_path, width, height, sort_order, id)")
    .order("album_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) console.error("Lecture des albums impossible.", error);

  return (data ?? []).map(({ photos, ...album }) => {
    const sorted = [...(photos ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    const cover = sorted.find((p) => p.id === album.cover_photo_id) ?? sorted[0] ?? null;
    return {
      ...album,
      cover: cover ? { storage_path: cover.storage_path, width: cover.width, height: cover.height } : null,
      photoCount: sorted.length,
    };
  });
}

export async function getAlbumBySlug(slug: string): Promise<{ album: Tables["albums"]["Row"]; photos: Photo[] } | null> {
  "use cache";
  cacheTag("albums", `album:${slug}`);
  cacheLife("days");

  const supabase = createPublicClient();
  const { data: album } = await supabase.from("albums").select("*").eq("slug", slug).maybeSingle();
  if (!album) return null;
  const { data: photos, error } = await supabase
    .from("photos")
    .select("*")
    .eq("album_id", album.id)
    .order("sort_order")
    .order("created_at");
  if (error) console.error("Lecture des photos impossible.", error);
  return { album, photos: photos ?? [] };
}

export async function getAlbumSlugs(): Promise<string[]> {
  "use cache";
  cacheTag("albums");
  cacheLife("days");

  const { data } = await createPublicClient().from("albums").select("slug").limit(500);
  return (data ?? []).map((a) => a.slug);
}
