-- =============================================================================
-- Notifications sur le téléphone (Web Push) : chaque membre de l'équipe peut les activer
-- sur son téléphone depuis l'admin de son site. Une ligne par appareil et par site.
-- L'envoi (nouveau message, nouvelle inscription) se fait côté serveur avec la clé secrète.
-- =============================================================================

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null default public.request_site_id() references public.sites (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- Adresse fournie par le navigateur (Apple, Google, Mozilla…) : unique par appareil.
  endpoint text not null unique check (endpoint ~ '^https://'),
  p256dh text not null,
  auth text not null,
  -- « iPhone », « Android »… pour s'y retrouver.
  device text,
  created_at timestamptz not null default now()
);

create index push_subscriptions_site_idx on public.push_subscriptions (site_id, user_id);

create trigger push_subscriptions_guard_site_id before update of site_id on public.push_subscriptions
  for each row execute function public.guard_site_id();

alter table public.push_subscriptions enable row level security;

-- Chacun ne voit et ne gère que ses propres appareils, pour le site demandé dont il est membre.
create policy "Équipe : lecture de ses abonnements" on public.push_subscriptions
  for select to authenticated using (user_id = (select auth.uid()) and public.can_edit(site_id));
create policy "Équipe : ajout de ses abonnements" on public.push_subscriptions
  for insert to authenticated with check (user_id = (select auth.uid()) and public.can_edit(site_id));
create policy "Équipe : mise à jour de ses abonnements" on public.push_subscriptions
  for update to authenticated using (user_id = (select auth.uid()) and public.can_edit(site_id))
  with check (user_id = (select auth.uid()) and public.can_edit(site_id));
create policy "Équipe : suppression de ses abonnements" on public.push_subscriptions
  for delete to authenticated using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.push_subscriptions to authenticated;
revoke all on public.push_subscriptions from anon;
