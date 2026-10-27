-- =============================================================================
-- Horaires de Chabbat et des fêtes au format du rabbin
--
--  * settings : règles de calcul des offices (Minha du vendredi, Tania, Chaharit,
--    Cours, Minha du samedi, Arvit) et marge ajoutée à la « Fin ».
--  * schedule_weeks : les ajustements d'une semaine (ou d'une fête) faits depuis
--    la page « Ce Chabbat » de l'admin — heures remplacées, lignes retirées ou
--    ajoutées, Kidouch, note. Remplace shabbat_overrides (allumage/havdala seulement).
--  * Les offices du vendredi soir et du Chabbat sont désormais calculés chaque
--    semaine : les anciennes lignes de service_times pour ces jours partent à la corbeille.
-- =============================================================================

alter table public.settings
  -- Minutes ajoutées à la tombée de la nuit pour la « Fin » (déjà arrondie à la minute supérieure).
  add column end_margin_minutes integer not null default 0 check (end_margin_minutes between 0 and 15),
  -- Vendredi soir : « Minha suivi d'Arvit » = allumage + décalage, arrondi aux N minutes supérieures.
  add column friday_minha_offset integer not null default 2 check (friday_minha_offset between 0 and 60),
  add column friday_minha_rounding integer not null default 5 check (friday_minha_rounding in (1, 5, 10, 15)),
  -- Chabbat matin : heures fixes.
  add column tania_time time not null default '08:30',
  add column chaharit_time time not null default '09:15',
  -- Chabbat après-midi : heure fixe, ou (si renseigné) N minutes avant la Fin, arrondi aux 5 min inférieures.
  add column cours_time time not null default '17:00',
  add column cours_before_end integer check (cours_before_end between 5 and 240),
  add column minha_time time not null default '18:00',
  add column minha_before_end integer check (minha_before_end between 5 and 240),
  -- Samedi soir (et fin de fête) : Arvit = Fin + N minutes.
  add column arvit_after_end integer not null default 10 check (arvit_after_end between 0 and 60);

create table public.schedule_weeks (
  -- Veille du premier jour : le vendredi pour un Chabbat, la veille de la fête sinon.
  date date primary key,
  -- Titre remplaçant celui calculé (« HORAIRES CHABBAT LEKH LEKHA »).
  title text check (char_length(title) <= 80),
  -- Ligne libre mise en valeur, ex. « Grand Kidouch 🍷 offert par la famille … ».
  kidouch text check (char_length(kidouch) <= 400),
  note text check (char_length(note) <= 600),
  -- Formule finale remplaçant celle calculée (« Chabbat Chalom »).
  closing text check (char_length(closing) <= 80),
  -- Heures remplacées : { "AAAA-MM-JJ:ligne": "HH:MM" }.
  times jsonb not null default '{}'::jsonb check (jsonb_typeof(times) = 'object'),
  -- Lignes calculées retirées cette semaine-là (« AAAA-MM-JJ:ligne »).
  hidden text[] not null default '{}',
  -- Lignes ajoutées : [{ "section": "AAAA-MM-JJ:matin", "label": "Cours spécial", "time": "16:00" }].
  extra_lines jsonb not null default '[]'::jsonb check (jsonb_typeof(extra_lines) = 'array'),
  updated_at timestamptz not null default now()
);

create trigger schedule_weeks_updated_at before update on public.schedule_weeks
  for each row execute function public.set_updated_at();

alter table public.schedule_weeks enable row level security;

create policy "Public : horaires de la semaine" on public.schedule_weeks
  for select to anon, authenticated using (true);
create policy "Équipe : ajout des horaires de la semaine" on public.schedule_weeks
  for insert to authenticated with check (public.is_editor());
create policy "Équipe : modification des horaires de la semaine" on public.schedule_weeks
  for update to authenticated using (public.is_editor()) with check (public.is_editor());
create policy "Équipe : suppression des horaires de la semaine" on public.schedule_weeks
  for delete to authenticated using (public.is_editor());

grant select on public.schedule_weeks to anon, authenticated;
grant insert, update, delete on public.schedule_weeks to authenticated;

-- Reprise des anciennes corrections : allumage du vendredi, havdala (« Fin ») du samedi.
insert into public.schedule_weeks (date, times)
select week, jsonb_object_agg(line, to_char(time, 'HH24:MI'))
from (
  select
    case when kind = 'allumage' then date else date - 1 end as week,
    date::text || ':' || case when kind = 'allumage' then 'allumage' else 'fin' end as line,
    time
  from public.shabbat_overrides
) o
group by week
on conflict (date) do nothing;

drop table public.shabbat_overrides;
drop type public.shabbat_time_kind;

-- Les offices du vendredi soir et du Chabbat sont calculés chaque semaine (page « Ce Chabbat »).
update public.service_times
  set deleted_at = now()
  where day_type in ('vendredi', 'chabbat') and deleted_at is null;

-- Purge : les ajustements de plus de 30 jours remplacent les anciennes corrections.
create or replace function public.purge_expired()
returns table (orphan_path text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit timestamptz := now() - interval '30 days';
begin
  -- Photos des albums purgés (avant la cascade qui les supprimerait).
  return query
    with d as (
      delete from public.photos p
      using public.albums a
      where p.album_id = a.id and a.deleted_at < v_limit
      returning p.storage_path
    )
    select d.storage_path from d;

  delete from public.albums where deleted_at < v_limit;

  return query
    with d as (delete from public.events where deleted_at < v_limit returning image_path)
    select d.image_path from d where d.image_path is not null;

  return query
    with d as (delete from public.courses where deleted_at < v_limit returning image_path)
    select d.image_path from d where d.image_path is not null;

  delete from public.announcements where deleted_at < v_limit;
  delete from public.service_times where deleted_at < v_limit;
  delete from public.contact_messages
    where deleted_at < v_limit or created_at < now() - interval '2 years';

  delete from public.registrations r
    using public.events e
    where r.event_id = e.id
      and coalesce(e.ends_at, e.starts_at) < now() - interval '6 months';

  delete from public.schedule_weeks where date < current_date - 30;
  delete from public.rate_limits where created_at < now() - interval '1 day';
end;
$$;

revoke execute on function public.purge_expired() from public, anon, authenticated;
grant execute on function public.purge_expired() to service_role;
