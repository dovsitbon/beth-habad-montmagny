-- =============================================================================
-- Purge automatique (appelée une fois par jour par la tâche planifiée Vercel
-- /api/cron/purge, avec la clé service_role).
--
--  * Corbeille : suppression définitive des éléments supprimés il y a plus de 30 jours.
--  * RGPD : suppression des inscriptions 6 mois après l'événement,
--    et des messages de contact au bout de 2 ans.
--  * Anti-spam : nettoyage des traces de limitation de débit (> 1 jour).
--
-- Renvoie les chemins des images devenues orphelines : le serveur les retire
-- ensuite du stockage (Supabase interdit de supprimer des fichiers en SQL).
-- =============================================================================

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

  delete from public.shabbat_overrides where date < current_date - 30;
  delete from public.rate_limits where created_at < now() - interval '1 day';
end;
$$;

revoke execute on function public.purge_expired() from public, anon, authenticated;
grant execute on function public.purge_expired() to service_role;
