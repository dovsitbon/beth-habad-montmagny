-- =============================================================================
-- Chaharit du Beth Habad Montmagny · Groslay, en vigueur dès maintenant :
--   * du lundi au vendredi (type « semaine », vendredi compris) : 8h15 ;
--   * le dimanche : 9h.
-- (Le Chabbat est calculé à part : Tania 8h30, Chaharit 9h15, dans settings.)
-- Les lignes existantes sont mises à jour ; si elles n'existent pas, elles sont créées.
-- =============================================================================

update public.service_times
  set time = '08:15', note = null
  where office = 'chaharit' and day_type = 'semaine' and deleted_at is null;

insert into public.service_times (office, day_type, time, sort_order)
select 'chaharit', 'semaine', '08:15', 1
where not exists (
  select 1 from public.service_times where office = 'chaharit' and day_type = 'semaine' and deleted_at is null
);

update public.service_times
  set time = '09:00', note = null
  where office = 'chaharit' and day_type = 'dimanche' and deleted_at is null;

insert into public.service_times (office, day_type, time, sort_order)
select 'chaharit', 'dimanche', '09:00', 2
where not exists (
  select 1 from public.service_times where office = 'chaharit' and day_type = 'dimanche' and deleted_at is null
);
