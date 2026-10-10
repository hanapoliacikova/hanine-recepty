-- Hanine recepty: databáza. Spusti celé naraz v Supabase → SQL Editor → New query → Run.

-- Profily: meno a kto je správkyňa (prvý registrovaný účet).
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profily vidia prihlaseni" on public.profiles;
create policy "profily vidia prihlaseni" on public.profiles for select to authenticated using (true);
drop policy if exists "meno si meni kazdy sam" on public.profiles;
create policy "meno si meni kazdy sam" on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid()));

create or replace function public.novy_pouzivatel() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, is_admin)
  values (new.id,
          coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1)),
          not exists (select 1 from public.profiles));
  return new;
end $$;
drop trigger if exists po_registracii on auth.users;
create trigger po_registracii after insert on auth.users for each row execute function public.novy_pouzivatel();

create or replace function public.je_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- Dokumenty appky: plány, pripomienky, komentáre, fotky a stav.
-- Cesta je napr. plany/<id>, komentare/<id>, fotky/<id>/f/<foto>, stav/pripomienky.
create table if not exists public.docs (
  path text primary key,
  coll text not null,
  owner uuid not null default auth.uid() references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint coll_sedi check (coll = regexp_replace(path, '/[^/]*$', '')),
  constraint nie_prilis_velke check (octet_length(data::text) < 300000)
);
create index if not exists docs_coll on public.docs (coll);
alter table public.docs enable row level security;

create or replace function public.smie_zapisat(p text, o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select o = auth.uid() and (
    (split_part(p, '/', 1) in ('plany', 'pripomienky', 'komentare', 'fotky') and split_part(p, '/', 2) = auth.uid()::text)
    or (split_part(p, '/', 1) = 'stav' and public.je_admin()))
$$;

drop policy if exists "citanie" on public.docs;
create policy "citanie" on public.docs for select to authenticated
  using (split_part(path, '/', 1) <> 'plany' or owner = auth.uid());
drop policy if exists "pridanie" on public.docs;
create policy "pridanie" on public.docs for insert to authenticated with check (public.smie_zapisat(path, owner));
drop policy if exists "uprava" on public.docs;
create policy "uprava" on public.docs for update to authenticated
  using (public.smie_zapisat(path, owner)) with check (public.smie_zapisat(path, owner));
drop policy if exists "mazanie" on public.docs;
create policy "mazanie" on public.docs for delete to authenticated using (public.smie_zapisat(path, owner));

-- Živé obnovovanie (komentáre a pripomienky sa ukážu hneď).
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

-- Denný limit AI nápadov na osobu.
create table if not exists public.napady_pocet (
  user_id uuid not null references auth.users on delete cascade,
  den date not null,
  n int not null default 0,
  primary key (user_id, den)
);
alter table public.napady_pocet enable row level security;

create or replace function public.pouzi_napad(limit_dna int) returns int
language plpgsql security definer set search_path = public as $$
declare v int;
begin
  if auth.uid() is null then return -1; end if;
  insert into public.napady_pocet (user_id, den, n) values (auth.uid(), current_date, 1)
  on conflict (user_id, den) do update set n = public.napady_pocet.n + 1
    where public.napady_pocet.n < limit_dna
  returning n into v;
  return coalesce(v, -1);
end $$;
revoke all on function public.pouzi_napad(int) from public, anon;
grant execute on function public.pouzi_napad(int) to authenticated;
