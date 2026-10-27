-- =============================================================================
-- Multi-tenant : un seul projet Supabase pour tous les sites (voir docs/multi-tenant.md)
-- -----------------------------------------------------------------------------
--  * sites : un site client par ligne. Le site Beth Habad Montmagny · Groslay garde
--    toutes les données existantes (identifiant fixe ci-dessous = NEXT_PUBLIC_SITE_ID).
--  * user_sites : qui gère quel site, avec quel rôle (admin / editor). Remplace profiles.role.
--  * Toutes les tables métier ont site_id (non nul, clé étrangère vers sites).
--  * Le site demandé arrive dans l'en-tête HTTP « x-site-id », envoyé par chaque client
--    Supabase de l'application ; public.request_site_id() le lit.
--      - visiteurs (anon) : ne lisent que les contenus publiés du site demandé ;
--      - équipe : ne lit et ne modifie que les lignes du site demandé, ET seulement si elle
--        en est membre (le contexte de l'admin est verrouillé sur son site).
--  * site_id prend par défaut le site demandé : les insertions existantes n'ont rien à préciser.
--  * Stockage : bucket central « media », fichiers rangés sous {site_id}/{catégorie}/{fichier} ;
--    chacun n'écrit que dans le dossier des sites dont il est membre.
--    Les fichiers existants sont déplacés par scripts/migrer-medias.mjs (après cette migration).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Sites et membres
-- -----------------------------------------------------------------------------
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  -- Nom de domaine principal, sans protocole (ex. « beth-habad-montmagny.fr »).
  domain text not null unique check (domain ~ '^[a-z0-9.-]+$'),
  created_at timestamptz not null default now()
);

insert into public.sites (id, name, domain)
select 'dba8f5e4-8708-4700-bbae-11cd22048338',
       coalesce((select name from public.settings limit 1), 'Beth Habad Montmagny'),
       'beth-habad-montmagny.vercel.app';

create table public.user_sites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  site_id uuid not null references public.sites (id) on delete cascade,
  role public.app_role not null default 'editor',
  created_at timestamptz not null default now(),
  primary key (user_id, site_id)
);

create index user_sites_site_idx on public.user_sites (site_id);

-- Les rôles existants deviennent ceux du site Montmagny.
insert into public.user_sites (user_id, site_id, role)
select id, 'dba8f5e4-8708-4700-bbae-11cd22048338', role from public.profiles;

-- -----------------------------------------------------------------------------
-- Fonctions de contrôle d'accès
-- -----------------------------------------------------------------------------

-- Site demandé par l'application (en-tête « x-site-id »), ou null.
create or replace function public.request_site_id()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
begin
  return (nullif(current_setting('request.headers', true), '')::json ->> 'x-site-id')::uuid;
exception when others then
  return null;
end;
$$;

-- La personne connectée a-t-elle l'un de ces rôles sur ce site ?
create or replace function public.has_site_role(p_site_id uuid, p_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_sites
    where user_id = (select auth.uid()) and site_id = p_site_id and role = any (p_roles)
  );
$$;

-- Peut modifier les données de ce site : il faut que ce soit le site demandé ET en être membre.
create or replace function public.can_edit(p_site_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_site_id = public.request_site_id()
     and public.has_site_role(p_site_id, array['admin', 'editor']::public.app_role[]);
$$;

create or replace function public.can_admin(p_site_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_site_id = public.request_site_id()
     and public.has_site_role(p_site_id, array['admin']::public.app_role[]);
$$;

-- Versions « site demandé » (gardées pour les déclencheurs et le code existant).
create or replace function public.is_editor()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(public.can_edit(public.request_site_id()), false);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(public.can_admin(public.request_site_id()), false);
$$;

-- Cette personne fait-elle partie de l'équipe du site demandé ?
create or replace function public.is_member_of_request_site(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_sites
    where user_id = p_user_id and site_id = public.request_site_id()
  );
$$;

-- Le chemin d'un fichier commence-t-il par le dossier d'un site dont on est membre ?
create or replace function public.can_edit_storage_path(p_name text)
returns boolean
language plpgsql
stable
set search_path = ''
as $$
declare
  v_site uuid;
begin
  v_site := split_part(p_name, '/', 1)::uuid;
  return public.has_site_role(v_site, array['admin', 'editor']::public.app_role[]);
exception when others then
  return false;
end;
$$;

-- -----------------------------------------------------------------------------
-- Rôles : profiles.role → user_sites.role
-- -----------------------------------------------------------------------------
do $$
declare
  r record;
begin
  -- Toutes les politiques sont recréées plus bas, limitées au site.
  for r in select schemaname, tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end;
$$;

drop trigger profiles_guard_role on public.profiles;
drop function public.guard_profile_role();
alter table public.profiles drop column role;

-- -----------------------------------------------------------------------------
-- site_id sur toutes les tables métier
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'settings', 'settings_private', 'pages', 'events', 'registrations', 'courses',
    'announcements', 'service_times', 'schedule_weeks', 'albums', 'photos',
    'contact_messages', 'rate_limits'
  ] loop
    execute format('alter table public.%I add column site_id uuid', t);
    execute format('update public.%I set site_id = %L', t, 'dba8f5e4-8708-4700-bbae-11cd22048338');
    execute format('alter table public.%I alter column site_id set not null', t);
    execute format('alter table public.%I alter column site_id set default public.request_site_id()', t);
    execute format(
      'alter table public.%I add constraint %I foreign key (site_id) references public.sites (id) on delete cascade',
      t, t || '_site_id_fkey'
    );
    execute format('create index %I on public.%I (site_id)', t || '_site_idx', t);
  end loop;
end;
$$;

-- Paramètres : une ligne par site (au lieu de « id = 1 »).
alter table public.settings drop constraint settings_pkey;
alter table public.settings drop column id;
alter table public.settings add primary key (site_id);

alter table public.settings_private drop constraint settings_private_pkey;
alter table public.settings_private drop column id;
alter table public.settings_private add primary key (site_id);

-- Textes et horaires de la semaine : uniques par site.
alter table public.pages drop constraint pages_pkey;
alter table public.pages add primary key (site_id, slug);

alter table public.schedule_weeks drop constraint schedule_weeks_pkey;
alter table public.schedule_weeks add primary key (site_id, date);

-- Adresses (slugs) uniques par site : deux sites peuvent avoir « soiree-de-hanouka ».
alter table public.events drop constraint events_slug_key;
alter table public.events add constraint events_site_slug_key unique (site_id, slug);
alter table public.albums drop constraint albums_slug_key;
alter table public.albums add constraint albums_site_slug_key unique (site_id, slug);

drop index public.events_starts_at_idx;
drop index public.events_category_idx;
create index events_starts_at_idx on public.events (site_id, starts_at) where deleted_at is null;
create index events_category_idx on public.events (site_id, category, starts_at) where deleted_at is null;

-- Liens entre tables : toujours à l'intérieur d'un même site.
alter table public.events add constraint events_id_site_key unique (id, site_id);
alter table public.albums add constraint albums_id_site_key unique (id, site_id);
alter table public.photos add constraint photos_id_site_key unique (id, site_id);

alter table public.registrations drop constraint registrations_event_id_fkey;
alter table public.registrations add constraint registrations_event_fkey
  foreign key (event_id, site_id) references public.events (id, site_id) on delete cascade;

alter table public.photos drop constraint photos_album_id_fkey;
alter table public.photos add constraint photos_album_fkey
  foreign key (album_id, site_id) references public.albums (id, site_id) on delete cascade;

alter table public.albums drop constraint albums_event_id_fkey;
alter table public.albums add constraint albums_event_fkey
  foreign key (event_id, site_id) references public.events (id, site_id) on delete set null (event_id);

alter table public.albums drop constraint albums_cover_photo_fk;
alter table public.albums add constraint albums_cover_photo_fkey
  foreign key (cover_photo_id, site_id) references public.photos (id, site_id) on delete set null (cover_photo_id);

drop index public.rate_limits_key_idx;
create index rate_limits_key_idx on public.rate_limits (site_id, key, created_at);

-- -----------------------------------------------------------------------------
-- Fonctions métier : limitées au site
-- -----------------------------------------------------------------------------
create or replace function public.guard_settings_admin_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.has_site_role(new.site_id, array['admin']::public.app_role[])
     or current_user in ('service_role', 'postgres') then
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

-- Personne ne change de site une ligne existante.
create or replace function public.guard_site_id()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.site_id is distinct from old.site_id then
    raise exception 'Une donnée ne peut pas changer de site.' using errcode = '42501';
  end if;
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'settings', 'settings_private', 'pages', 'events', 'registrations', 'courses',
    'announcements', 'service_times', 'schedule_weeks', 'albums', 'photos',
    'contact_messages', 'rate_limits', 'user_sites'
  ] loop
    execute format(
      'create trigger %I before update of site_id on public.%I for each row execute function public.guard_site_id()',
      t || '_guard_site_id', t
    );
  end loop;
end;
$$;

-- Places prises : seulement pour un événement du site demandé.
create or replace function public.event_seats_taken(p_event_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(party_size), 0)::integer
  from public.registrations
  where event_id = p_event_id and site_id = public.request_site_id();
$$;

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

  -- Un événement d'un autre site est traité comme introuvable.
  if not found or v_event.site_id is distinct from public.request_site_id()
     or v_event.deleted_at is not null or v_event.status <> 'published' then
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

  insert into public.registrations (site_id, event_id, name, phone, email, party_size)
  values (v_event.site_id, p_event_id, p_name, p_phone, p_email, p_party_size)
  returning id into v_id;

  return v_id;
end;
$$;

-- Limitation de débit : compteurs séparés par site.
create or replace function public.check_rate_limit(p_key text, p_max integer, p_window interval)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_site uuid := public.request_site_id();
  v_count integer;
begin
  if v_site is null then
    raise exception 'SITE_REQUIRED';
  end if;
  perform pg_advisory_xact_lock(hashtext(v_site::text || ':' || p_key));
  select count(*) into v_count from public.rate_limits
  where site_id = v_site and key = p_key and created_at > now() - p_window;
  if v_count >= p_max then
    return false;
  end if;
  insert into public.rate_limits (site_id, key) values (v_site, p_key);
  return true;
end;
$$;

-- =============================================================================
-- Row Level Security (toutes les tables)
-- =============================================================================
alter table public.sites enable row level security;
alter table public.user_sites enable row level security;

-- Sites : le site demandé (public), et ceux dont on est membre.
create policy "Public : le site demandé" on public.sites
  for select to anon, authenticated
  using (id = (select public.request_site_id())
         or public.has_site_role(id, array['admin', 'editor']::public.app_role[]));

-- Membres : chacun voit ses sites ; l'équipe voit les membres de son site ;
-- seul l'admin du site ajoute, modifie ou retire des membres (jamais lui-même).
create policy "Équipe : lecture des membres" on public.user_sites
  for select to authenticated
  using (user_id = (select auth.uid()) or public.can_edit(site_id));
create policy "Admin : ajout de membres" on public.user_sites
  for insert to authenticated
  with check (public.can_admin(site_id) and user_id <> (select auth.uid()));
create policy "Admin : modification des membres" on public.user_sites
  for update to authenticated
  using (public.can_admin(site_id) and user_id <> (select auth.uid()))
  with check (public.can_admin(site_id) and user_id <> (select auth.uid()));
create policy "Admin : retrait de membres" on public.user_sites
  for delete to authenticated
  using (public.can_admin(site_id) and user_id <> (select auth.uid()));

-- Profils : soi-même, et les membres du site demandé pour son équipe.
create policy "Équipe : lecture des profils" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or ((select public.is_editor()) and public.is_member_of_request_site(id)));
create policy "Chacun modifie son profil, l'admin ceux de son équipe" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or ((select public.is_admin()) and public.is_member_of_request_site(id)))
  with check (id = (select auth.uid()) or ((select public.is_admin()) and public.is_member_of_request_site(id)));

-- Paramètres
create policy "Public : paramètres du site" on public.settings
  for select to anon, authenticated using (site_id = (select public.request_site_id()));
create policy "Équipe : modification des paramètres" on public.settings
  for update to authenticated using (public.can_edit(site_id)) with check (public.can_edit(site_id));

create policy "Équipe : lecture des paramètres privés" on public.settings_private
  for select to authenticated using (public.can_edit(site_id));
create policy "Équipe : modification des paramètres privés" on public.settings_private
  for update to authenticated using (public.can_edit(site_id)) with check (public.can_edit(site_id));

-- Pages
create policy "Public : textes du site" on public.pages
  for select to anon, authenticated using (site_id = (select public.request_site_id()));
create policy "Équipe : modification des textes" on public.pages
  for update to authenticated using (public.can_edit(site_id)) with check (public.can_edit(site_id));
create policy "Admin : création des textes" on public.pages
  for insert to authenticated with check (public.can_admin(site_id));

-- Contenus avec brouillon + corbeille : le public voit le publié non supprimé du site demandé,
-- l'équipe tout son site. La suppression définitive est réservée à la purge (service_role).
create policy "Public : événements publiés" on public.events
  for select to anon, authenticated
  using (site_id = (select public.request_site_id())
         and ((status = 'published' and deleted_at is null) or public.can_edit(site_id)));
create policy "Équipe : création d'événements" on public.events
  for insert to authenticated with check (public.can_edit(site_id));
create policy "Équipe : modification d'événements" on public.events
  for update to authenticated using (public.can_edit(site_id)) with check (public.can_edit(site_id));

create policy "Public : cours publiés" on public.courses
  for select to anon, authenticated
  using (site_id = (select public.request_site_id())
         and ((status = 'published' and deleted_at is null) or public.can_edit(site_id)));
create policy "Équipe : création de cours" on public.courses
  for insert to authenticated with check (public.can_edit(site_id));
create policy "Équipe : modification de cours" on public.courses
  for update to authenticated using (public.can_edit(site_id)) with check (public.can_edit(site_id));

create policy "Public : albums publiés" on public.albums
  for select to anon, authenticated
  using (site_id = (select public.request_site_id())
         and ((status = 'published' and deleted_at is null) or public.can_edit(site_id)));
create policy "Équipe : création d'albums" on public.albums
  for insert to authenticated with check (public.can_edit(site_id));
create policy "Équipe : modification d'albums" on public.albums
  for update to authenticated using (public.can_edit(site_id)) with check (public.can_edit(site_id));

create policy "Public : photos des albums publiés" on public.photos
  for select to anon, authenticated
  using (
    site_id = (select public.request_site_id()) and (
      public.can_edit(site_id) or exists (
        select 1 from public.albums a
        where a.id = album_id and a.status = 'published' and a.deleted_at is null
      )
    )
  );
create policy "Équipe : ajout de photos" on public.photos
  for insert to authenticated with check (public.can_edit(site_id));
create policy "Équipe : modification de photos" on public.photos
  for update to authenticated using (public.can_edit(site_id)) with check (public.can_edit(site_id));
create policy "Équipe : suppression de photos" on public.photos
  for delete to authenticated using (public.can_edit(site_id));

create policy "Public : annonces en cours" on public.announcements
  for select to anon, authenticated
  using (
    site_id = (select public.request_site_id()) and (
      public.can_edit(site_id) or (
        is_active and deleted_at is null and starts_at <= now()
        and (expires_at is null or expires_at > now())
      )
    )
  );
create policy "Équipe : création d'annonces" on public.announcements
  for insert to authenticated with check (public.can_edit(site_id));
create policy "Équipe : modification d'annonces" on public.announcements
  for update to authenticated using (public.can_edit(site_id)) with check (public.can_edit(site_id));

create policy "Public : horaires des offices" on public.service_times
  for select to anon, authenticated
  using (site_id = (select public.request_site_id()) and (deleted_at is null or public.can_edit(site_id)));
create policy "Équipe : création d'horaires" on public.service_times
  for insert to authenticated with check (public.can_edit(site_id));
create policy "Équipe : modification d'horaires" on public.service_times
  for update to authenticated using (public.can_edit(site_id)) with check (public.can_edit(site_id));

create policy "Public : horaires de la semaine" on public.schedule_weeks
  for select to anon, authenticated using (site_id = (select public.request_site_id()));
create policy "Équipe : ajout des horaires de la semaine" on public.schedule_weeks
  for insert to authenticated with check (public.can_edit(site_id));
create policy "Équipe : modification des horaires de la semaine" on public.schedule_weeks
  for update to authenticated using (public.can_edit(site_id)) with check (public.can_edit(site_id));
create policy "Équipe : suppression des horaires de la semaine" on public.schedule_weeks
  for delete to authenticated using (public.can_edit(site_id));

-- Données personnelles : jamais lisibles par le public ; l'écriture publique passe par le serveur.
create policy "Équipe : lecture des inscriptions" on public.registrations
  for select to authenticated using (public.can_edit(site_id));
create policy "Équipe : suppression d'inscriptions" on public.registrations
  for delete to authenticated using (public.can_edit(site_id));

create policy "Équipe : lecture des messages" on public.contact_messages
  for select to authenticated using (public.can_edit(site_id));
create policy "Équipe : modification des messages" on public.contact_messages
  for update to authenticated using (public.can_edit(site_id)) with check (public.can_edit(site_id));

-- rate_limits : aucune politique = aucun accès hors service_role.

-- Droits SQL
grant select on public.sites to anon, authenticated;
grant select, insert, update, delete on public.user_sites to authenticated;
revoke all on public.user_sites from anon;
revoke insert, update, delete on public.sites from anon, authenticated;

revoke execute on function public.check_rate_limit(text, integer, interval) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, interval) to service_role;
revoke execute on function public.register_for_event(uuid, text, text, text, integer) from public, anon, authenticated;
grant execute on function public.register_for_event(uuid, text, text, text, integer) to service_role;

-- =============================================================================
-- Stockage : dossier {site_id}/ par site
-- =============================================================================
drop policy if exists "Équipe : envoi d'images" on storage.objects;
drop policy if exists "Équipe : modification d'images" on storage.objects;
drop policy if exists "Équipe : suppression d'images" on storage.objects;

create policy "Équipe : envoi d'images dans le dossier de son site" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.can_edit_storage_path(name));
create policy "Équipe : modification d'images de son site" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.can_edit_storage_path(name))
  with check (bucket_id = 'media' and public.can_edit_storage_path(name));
create policy "Équipe : suppression d'images de son site" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.can_edit_storage_path(name));
