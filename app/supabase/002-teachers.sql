-- Миграция 002: учителей создаёт администратор (продажа логинов), логин учителя в профиле.
-- Применить один раз в Supabase → SQL Editor (для проекта, где schema.sql уже выполнен).

-- ---------- новый пользователь: учитель ----------
-- (учеников создаёт create_student и сам добавляет их профиль;
--  учителей создаёт администратор функцией admin_create_teacher — логин попадает в профиль)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.raw_app_meta_data ->> 'kind', '') = 'student' then
    return new;
  end if;
  insert into public.profiles (id, role, full_name, login)
  values (new.id, 'teacher', left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 80),
          nullif(lower(coalesce(new.raw_app_meta_data ->> 'login', '')), ''));
  return new;
end $$;

-- ---------- администратор (владелец сайта) создаёт учителей ----------
-- Вызывается только из Supabase → SQL Editor: ни ученики, ни учителя, ни посетители вызвать её не могут.
create or replace function public.admin_create_teacher(p_login text, p_password text, p_name text default '')
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := gen_random_uuid();
  mail text := lower(p_login) || '@teachers.invalid';
begin
  if lower(p_login) !~ '^[a-z0-9][a-z0-9._-]{2,31}$' then raise exception 'bad login %', p_login; end if;
  if length(p_password) < 8 then raise exception 'short password'; end if;
  if exists (select 1 from public.profiles where login = lower(p_login)) then raise exception 'login taken %', p_login; end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', mail,
          extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
          jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'kind', 'teacher', 'login', lower(p_login)),
          jsonb_build_object('full_name', left(coalesce(p_name, ''), 80)), now(), now(), '', '', '', '');

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text,
          jsonb_build_object('sub', uid::text, 'email', mail, 'email_verified', true),
          'email', now(), now(), now());
  return uid;  -- профиль учителя создаёт триггер on_auth_user_created
end $$;

-- новый пароль учителю (если забыл): select admin_reset_teacher('u-k7qm2x', 'НовыйПароль123');
create or replace function public.admin_reset_teacher(p_login text, p_password text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if length(p_password) < 8 then raise exception 'short password'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now()
  where id = (select id from public.profiles where login = lower(p_login) and role = 'teacher');
  if not found then raise exception 'no teacher %', p_login; end if;
end $$;

revoke all on function public.admin_create_teacher(text, text, text) from public, anon, authenticated;
revoke all on function public.admin_reset_teacher(text, text) from public, anon, authenticated;
