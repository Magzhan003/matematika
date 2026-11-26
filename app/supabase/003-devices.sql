-- Миграция 003: активные устройства аккаунта (проверка «один логин — много людей»).
-- Каждый браузер раз в минуту отмечается: user_id + device_id + название («Chrome · Windows») + время.
-- Активным считается устройство, отметившееся за последние 5 минут. IP-адреса не хранятся.
-- Применить один раз в Supabase → SQL Editor.

create table if not exists public.devices (
  user_id uuid not null references public.profiles (id) on delete cascade,
  device_id text not null check (device_id ~ '^[a-z0-9-]{8,64}$'),
  label text not null default '' check (length(label) <= 60),
  last_seen timestamptz not null default now(),
  primary key (user_id, device_id)
);
create index if not exists devices_seen on public.devices (last_seen);

alter table public.devices enable row level security;
revoke all on public.devices from anon;
grant select, insert, update, delete on public.devices to authenticated;

drop policy if exists devices_own on public.devices;
create policy devices_own on public.devices for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Для администратора (только SQL Editor): аккаунты, у которых сейчас больше 5 активных устройств.
--   select * from public.device_overuse;
create or replace view public.device_overuse with (security_invoker = true) as
  select p.login, p.role, p.full_name, count(*) as active_devices, max(d.last_seen) as last_seen
  from public.devices d join public.profiles p on p.id = d.user_id
  where d.last_seen > now() - interval '5 minutes'
  group by p.login, p.role, p.full_name
  having count(*) > 5
  order by count(*) desc;
revoke all on public.device_overuse from public, anon, authenticated;
