-- =============================================================================
-- Beth Habad : schéma de la base de données
-- -----------------------------------------------------------------------------
-- Principes :
--  * RLS activée sur TOUTES les tables. Par défaut, personne n'a accès à rien.
--  * Le public (anon) ne fait que LIRE les contenus publiés et non supprimés.
--  * Les formulaires publics (inscriptions, contact) passent par le serveur
--    Next.js (clé service_role) après validation Zod + anti-spam : aucune
--    écriture directe possible depuis le navigateur d'un visiteur.
--  * Les éditeurs (rabbin & co) gèrent les contenus ; l'admin gère en plus
--    les rôles et les paramètres techniques (logo, couleurs, coordonnées GPS).
--  * Corbeille : colonne deleted_at ; purge définitive après 30 jours
--    (fonction purge_expired(), appelée chaque jour par une tâche planifiée).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Types
-- -----------------------------------------------------------------------------
create type public.app_role as enum ('admin', 'editor');
create type public.content_status as enum ('draft', 'published');
create type public.event_category as enum ('general', 'cteen');
create type public.course_audience as enum ('tous', 'hommes', 'femmes', 'enfants', 'jeunes');
create type public.service_office as enum ('chaharit', 'minha', 'arvit');
create type public.service_day as enum ('semaine', 'dimanche', 'vendredi', 'chabbat', 'fete');
create type public.shabbat_time_kind as enum ('allumage', 'havdala');
create type public.announcement_level as enum ('info', 'important');

-- -----------------------------------------------------------------------------
-- Utilitaires
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Profils et rôles
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.app_role not null default 'editor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Les inscriptions publiques sont désactivées dans Supabase Auth :
-- un compte n'est créé que par invitation. Chaque nouveau compte devient « éditeur ».
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Fonctions de contrôle d'accès, utilisées par toutes les politiques RLS.
-- security definer : elles lisent profiles sans dépendre des politiques de profiles.
create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin', 'editor')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Personne ne peut changer son propre rôle (ni un éditeur celui d'un autre).
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and not public.is_admin()
     and current_user not in ('service_role', 'postgres') then
    raise exception 'Seul l''administrateur peut modifier les rôles.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_profile_role();

-- -----------------------------------------------------------------------------
-- Paramètres du site (une seule ligne)
-- -----------------------------------------------------------------------------
create table public.settings (
  id smallint primary key default 1 check (id = 1),
  name text not null,
  short_name text not null,
  tagline text,
  address_street text,
  address_postal_code text,
  address_city text,
  latitude numeric(9, 6) not null,
  longitude numeric(9, 6) not null,
  phone text,
  email text,
  whatsapp text,
  donation_url text,
  social jsonb not null default '{}'::jsonb,
  -- Minutes avant le coucher du soleil pour l'allumage des bougies.
  candle_minutes integer not null default 18 check (candle_minutes between 0 and 60),
  -- null = Havdala à la tombée de la nuit (8,5° sous l'horizon) ; sinon N minutes après le coucher.
  havdalah_minutes integer check (havdalah_minutes between 20 and 90),
  -- Note affichée sur la page des offices (ex. « Horaires d'été »).
  services_note text,
  logo_path text,
  color_primary text not null default '#0F2444' check (color_primary ~ '^#[0-9A-Fa-f]{6}$'),
  color_accent text not null default '#C9A227' check (color_accent ~ '^#[0-9A-Fa-f]{6}$'),
  updated_at timestamptz not null default now()
);

create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

-- Les paramètres « techniques » sont réservés à l'administrateur.
create or replace function public.guard_settings_admin_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_admin() or current_user in ('service_role', 'postgres') then
    return new;
  end if;
  if new.logo_path is distinct from old.logo_path
     or new.color_primary is distinct from old.color_primary
     or new.color_accent is distinct from old.color_accent
     or new.latitude is distinct from old.latitude
     or new.longitude is distinct from old.longitude then
    raise exception 'Le logo, les couleurs et la position GPS ne peuvent être modifiés que par l''administrateur.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger settings_guard_admin_fields before update on public.settings
  for each row execute function public.guard_settings_admin_fields();

-- Paramètres non publics (jamais lisibles par les visiteurs).
create table public.settings_private (
  id smallint primary key default 1 check (id = 1),
  -- Adresse qui reçoit les notifications (messages de contact, inscriptions).
  notification_email text not null,
  updated_at timestamptz not null default now()
);

create trigger settings_private_updated_at before update on public.settings_private
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Textes des pages (présentation, le rabbin, mentions légales…)
-- -----------------------------------------------------------------------------
create table public.pages (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  -- HTML nettoyé côté serveur avant l'enregistrement.
  body text not null default '',
  image_path text,
  updated_at timestamptz not null default now()
);

create trigger pages_updated_at before update on public.pages
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Événements (dont CTeen) et inscriptions
-- -----------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  category public.event_category not null default 'general',
  title text not null check (char_length(title) between 1 and 200),
  summary text check (char_length(summary) <= 300),
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  image_path text,
  price_text text,
  registration_enabled boolean not null default false,
  capacity integer check (capacity > 0),
  registration_deadline timestamptz,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (ends_at is null or ends_at >= starts_at)
);

create index events_starts_at_idx on public.events (starts_at) where deleted_at is null;
create index events_category_idx on public.events (category, starts_at) where deleted_at is null;

create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  phone text check (char_length(phone) <= 30),
  email text check (char_length(email) <= 200),
  party_size integer not null default 1 check (party_size between 1 and 20),
  created_at timestamptz not null default now(),
  check (phone is not null or email is not null)
);

create index registrations_event_idx on public.registrations (event_id, created_at);

-- Places déjà réservées pour un événement (lisible par le public, sans données personnelles).
create or replace function public.event_seats_taken(p_event_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(party_size), 0)::integer
  from public.registrations
  where event_id = p_event_id;
$$;

-- Inscription avec contrôle des places, sans risque de dépassement si deux
-- personnes s'inscrivent en même temps (verrou sur la ligne de l'événement).
-- Appelée uniquement par le serveur (service_role), après l'anti-spam.
create or replace function public.register_for_event(
  p_event_id uuid,
  p_name text,
  p_phone text,
  p_email text,
  p_party_size integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events%rowtype;
  v_taken integer;
  v_id uuid;
begin
  select * into v_event from public.events
  where id = p_event_id
  for update;

  if not found or v_event.deleted_at is not null or v_event.status <> 'published' then
    raise exception 'EVENT_NOT_FOUND';
  end if;
  if not v_event.registration_enabled then
    raise exception 'REGISTRATION_CLOSED';
  end if;
  if v_event.registration_deadline is not null and now() > v_event.registration_deadline then
    raise exception 'REGISTRATION_CLOSED';
  end if;
  if now() > coalesce(v_event.ends_at, v_event.starts_at) then
    raise exception 'REGISTRATION_CLOSED';
  end if;

  if v_event.capacity is not null then
    select coalesce(sum(party_size), 0) into v_taken
    from public.registrations where event_id = p_event_id;
    if v_taken + p_party_size > v_event.capacity then
      raise exception 'EVENT_FULL';
    end if;
  end if;

  insert into public.registrations (event_id, name, phone, email, party_size)
  values (p_event_id, p_name, p_phone, p_email, p_party_size)
  returning id into v_id;

  return v_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Cours et activités
-- -----------------------------------------------------------------------------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  audience public.course_audience not null default 'tous',
  -- 0 = dimanche … 6 = samedi ; null si la fréquence est décrite dans schedule_text.
  day_of_week smallint check (day_of_week between 0 and 6),
  start_time time,
  end_time time,
  -- Précision libre : « Un jeudi sur deux », « Pendant les vacances scolaires »…
  schedule_text text,
  speaker text,
  location text,
  description text not null default '',
  image_path text,
  sort_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger courses_updated_at before update on public.courses
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Annonces (bandeau)
-- -----------------------------------------------------------------------------
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(message) between 1 and 280),
  link_url text,
  link_label text,
  level public.announcement_level not null default 'info',
  is_active boolean not null default true,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (expires_at is null or expires_at > starts_at)
);

create trigger announcements_updated_at before update on public.announcements
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Horaires des offices et corrections manuelles des horaires de Chabbat
-- -----------------------------------------------------------------------------
create table public.service_times (
  id uuid primary key default gen_random_uuid(),
  office public.service_office not null,
  day_type public.service_day not null,
  -- Heure fixe, ou null si l'horaire est relatif (voir note : « 15 min avant l'allumage »).
  time time,
  note text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (time is not null or note is not null)
);

create trigger service_times_updated_at before update on public.service_times
  for each row execute function public.set_updated_at();

create table public.shabbat_overrides (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  kind public.shabbat_time_kind not null,
  time time not null,
  note text,
  created_at timestamptz not null default now(),
  unique (date, kind)
);

-- -----------------------------------------------------------------------------
-- Galerie photos
-- -----------------------------------------------------------------------------
create table public.albums (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null check (char_length(title) between 1 and 200),
  description text,
  event_id uuid references public.events (id) on delete set null,
  album_date date,
  cover_photo_id uuid,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger albums_updated_at before update on public.albums
  for each row execute function public.set_updated_at();

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums (id) on delete cascade,
  storage_path text not null unique,
  width integer check (width > 0),
  height integer check (height > 0),
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index photos_album_idx on public.photos (album_id, sort_order);

alter table public.albums
  add constraint albums_cover_photo_fk foreign key (cover_photo_id)
  references public.photos (id) on delete set null;

-- -----------------------------------------------------------------------------
-- Messages du formulaire de contact
-- -----------------------------------------------------------------------------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text check (char_length(email) <= 200),
  phone text check (char_length(phone) <= 30),
  message text not null check (char_length(message) between 1 and 5000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  deleted_at timestamptz,
  check (email is not null or phone is not null)
);

create index contact_messages_created_idx on public.contact_messages (created_at desc);

-- -----------------------------------------------------------------------------
-- Limitation de débit (anti-spam des formulaires publics)
-- -----------------------------------------------------------------------------
create table public.rate_limits (
  id bigint generated always as identity primary key,
  -- ex. « contact:<hash de l'IP> » : l'IP n'est jamais stockée en clair.
  key text not null,
  created_at timestamptz not null default now()
);

create index rate_limits_key_idx on public.rate_limits (key, created_at);

-- Renvoie true si l'action est autorisée (et l'enregistre), false si la limite est atteinte.
create or replace function public.check_rate_limit(p_key text, p_max integer, p_window interval)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  perform pg_advisory_xact_lock(hashtext(p_key));
  select count(*) into v_count from public.rate_limits
  where key = p_key and created_at > now() - p_window;
  if v_count >= p_max then
    return false;
  end if;
  insert into public.rate_limits (key) values (p_key);
  return true;
end;
$$;

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.settings_private enable row level security;
alter table public.pages enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.courses enable row level security;
alter table public.announcements enable row level security;
alter table public.service_times enable row level security;
alter table public.shabbat_overrides enable row level security;
alter table public.albums enable row level security;
alter table public.photos enable row level security;
alter table public.contact_messages enable row level security;
alter table public.rate_limits enable row level security;

-- Profils : l'équipe se voit ; seul l'admin modifie (rôles) ; chacun peut
-- corriger son propre nom (le rôle reste protégé par le trigger).
create policy "Équipe : lecture des profils" on public.profiles
  for select to authenticated using (public.is_editor());
create policy "Chacun modifie son profil, l'admin tous" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());
create policy "Admin : suppression des profils" on public.profiles
  for delete to authenticated using (public.is_admin());

-- Paramètres publics
create policy "Public : lecture des paramètres" on public.settings
  for select to anon, authenticated using (true);
create policy "Équipe : modification des paramètres" on public.settings
  for update to authenticated using (public.is_editor()) with check (public.is_editor());

create policy "Équipe : lecture des paramètres privés" on public.settings_private
  for select to authenticated using (public.is_editor());
create policy "Équipe : modification des paramètres privés" on public.settings_private
  for update to authenticated using (public.is_editor()) with check (public.is_editor());

-- Pages
create policy "Public : lecture des pages" on public.pages
  for select to anon, authenticated using (true);
create policy "Équipe : modification des pages" on public.pages
  for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "Admin : création des pages" on public.pages
  for insert to authenticated with check (public.is_admin());

-- Contenus avec brouillon + corbeille : le public ne voit que le publié non supprimé,
-- l'équipe voit tout (y compris brouillons et corbeille) et peut tout modifier.
-- La suppression « définitive » est réservée à la purge automatique (service_role).
create policy "Public : événements publiés" on public.events
  for select to anon, authenticated
  using ((status = 'published' and deleted_at is null) or public.is_editor());
create policy "Équipe : création d'événements" on public.events
  for insert to authenticated with check (public.is_editor());
create policy "Équipe : modification d'événements" on public.events
  for update to authenticated using (public.is_editor()) with check (public.is_editor());

create policy "Public : cours publiés" on public.courses
  for select to anon, authenticated
  using ((status = 'published' and deleted_at is null) or public.is_editor());
create policy "Équipe : création de cours" on public.courses
  for insert to authenticated with check (public.is_editor());
create policy "Équipe : modification de cours" on public.courses
  for update to authenticated using (public.is_editor()) with check (public.is_editor());

create policy "Public : albums publiés" on public.albums
  for select to anon, authenticated
  using ((status = 'published' and deleted_at is null) or public.is_editor());
create policy "Équipe : création d'albums" on public.albums
  for insert to authenticated with check (public.is_editor());
create policy "Équipe : modification d'albums" on public.albums
  for update to authenticated using (public.is_editor()) with check (public.is_editor());

-- Photos : visibles si leur album l'est.
create policy "Public : photos des albums publiés" on public.photos
  for select to anon, authenticated
  using (
    public.is_editor() or exists (
      select 1 from public.albums a
      where a.id = album_id and a.status = 'published' and a.deleted_at is null
    )
  );
create policy "Équipe : ajout de photos" on public.photos
  for insert to authenticated with check (public.is_editor());
create policy "Équipe : modification de photos" on public.photos
  for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "Équipe : suppression de photos" on public.photos
  for delete to authenticated using (public.is_editor());

-- Annonces : le public ne voit que les annonces actives et dans leur période.
create policy "Public : annonces en cours" on public.announcements
  for select to anon, authenticated
  using (
    public.is_editor() or (
      is_active and deleted_at is null and starts_at <= now()
      and (expires_at is null or expires_at > now())
    )
  );
create policy "Équipe : création d'annonces" on public.announcements
  for insert to authenticated with check (public.is_editor());
create policy "Équipe : modification d'annonces" on public.announcements
  for update to authenticated using (public.is_editor()) with check (public.is_editor());

-- Offices
create policy "Public : horaires des offices" on public.service_times
  for select to anon, authenticated using (deleted_at is null or public.is_editor());
create policy "Équipe : création d'horaires" on public.service_times
  for insert to authenticated with check (public.is_editor());
create policy "Équipe : modification d'horaires" on public.service_times
  for update to authenticated using (public.is_editor()) with check (public.is_editor());

-- Corrections manuelles des horaires de Chabbat
create policy "Public : corrections des horaires" on public.shabbat_overrides
  for select to anon, authenticated using (true);
create policy "Équipe : ajout de corrections" on public.shabbat_overrides
  for insert to authenticated with check (public.is_editor());
create policy "Équipe : modification de corrections" on public.shabbat_overrides
  for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "Équipe : suppression de corrections" on public.shabbat_overrides
  for delete to authenticated using (public.is_editor());

-- Inscriptions et messages : données personnelles, jamais lisibles par le public.
-- L'écriture publique passe par le serveur (service_role), qui contourne la RLS.
create policy "Équipe : lecture des inscriptions" on public.registrations
  for select to authenticated using (public.is_editor());
create policy "Équipe : suppression d'inscriptions" on public.registrations
  for delete to authenticated using (public.is_editor());

create policy "Équipe : lecture des messages" on public.contact_messages
  for select to authenticated using (public.is_editor());
create policy "Équipe : modification des messages" on public.contact_messages
  for update to authenticated using (public.is_editor()) with check (public.is_editor());

-- rate_limits : aucune politique = aucun accès hors service_role.

-- Droits SQL explicites (la RLS ci-dessus filtre ensuite ligne par ligne).
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;

-- Défense en profondeur : retirer les droits SQL inutiles aux visiteurs anonymes.
revoke all on public.registrations, public.contact_messages, public.rate_limits,
  public.settings_private, public.profiles from anon;
revoke insert, update, delete on all tables in schema public from anon;

-- Fonctions réservées au serveur.
revoke execute on function public.register_for_event(uuid, text, text, text, integer) from public, anon, authenticated;
revoke execute on function public.check_rate_limit(text, integer, interval) from public, anon, authenticated;
grant execute on function public.register_for_event(uuid, text, text, text, integer) to service_role;
grant execute on function public.check_rate_limit(text, integer, interval) to service_role;

-- =============================================================================
-- Stockage des images (bucket public en lecture, écriture réservée à l'équipe)
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']
)
on conflict (id) do nothing;

create policy "Équipe : envoi d'images" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_editor());
create policy "Équipe : modification d'images" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_editor());
create policy "Équipe : suppression d'images" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_editor());
