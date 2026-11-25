-- =====================================================================
-- «Математика»: база данных для Supabase.
-- Как применить: Supabase → SQL Editor → New query → вставить ВЕСЬ файл → Run.
-- Повторный запуск безопасен только на пустом проекте (таблицы создаются заново).
--
-- Кто что видит (Row Level Security):
--   • учитель — свои классы, своих учеников, их прогресс, свои работы и ответы на них;
--   • ученик — только свой профиль и прогресс, работы своего класса и свои ответы.
-- Аккаунты учеников создаёт учитель (функция create_student): почта не нужна,
-- вход по логину и паролю. Учитель регистрируется сам по своей почте.
-- Данных о детях — минимум: имя, логин, класс. Ни почты, ни телефона, ни даты рождения.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- таблицы ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('teacher', 'student')),
  full_name text not null default '' check (length(full_name) <= 80),
  login text unique check (login is null or login ~ '^[a-z0-9][a-z0-9._-]{2,31}$'),
  class_id uuid,
  created_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (length(name) between 1 and 40),
  grade int check (grade between 1 and 11),
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_class_fk foreign key (class_id) references public.classes (id) on delete set null;

-- прогресс ученика (XP, уроки, ответы, план ЕНТ…) одним JSON — так же, как он хранится в браузере
create table public.progress (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- работа, выданная классу: code = номер работы + типы заданий (те же задания, что на распечатке)
create table public.works (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  title text not null default '' check (length(title) <= 120),
  code text not null check (length(code) between 8 and 200),
  variants int not null default 2 check (variants between 1 and 4),
  open boolean not null default true,
  created_at timestamptz not null default now()
);

-- ответ ученика: какие задания решены верно (по порядку), вариант, минуты
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  variant int not null check (variant between 0 and 3),
  ok boolean[] not null check (cardinality(ok) between 1 and 40),
  minutes int not null default 0 check (minutes between 0 and 600),
  created_at timestamptz not null default now(),
  unique (work_id, student_id)
);

create index on public.profiles (class_id);
create index on public.classes (teacher_id);
create index on public.works (class_id);
create index on public.submissions (work_id);

-- ---------- вспомогательные функции (без рекурсии в правилах доступа) ----------
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.my_class() returns uuid
language sql stable security definer set search_path = public as $$
  select class_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_teacher_of_class(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.classes where id = c and teacher_id = auth.uid())
$$;

create or replace function public.is_my_student(s uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p join public.classes c on c.id = p.class_id
    where p.id = s and p.role = 'student' and c.teacher_id = auth.uid()
  )
$$;

create or replace function public.is_my_work(w uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.works where id = w and teacher_id = auth.uid())
$$;

create or replace function public.can_answer(w uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.works wk
    where wk.id = w and wk.open and wk.class_id = public.my_class()
  )
$$;

-- ---------- новый пользователь: учитель, зарегистрировавшийся по почте ----------
-- (учеников создаёт create_student и сам добавляет их профиль)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.raw_app_meta_data ->> 'kind', '') = 'student' then
    return new;
  end if;
  insert into public.profiles (id, role, full_name)
  values (new.id, 'teacher', left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 80));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- учитель управляет учениками ----------
create or replace function public.create_student(p_class uuid, p_name text, p_login text, p_password text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := gen_random_uuid();
  mail text := lower(p_login) || '@students.invalid';
begin
  if public.my_role() is distinct from 'teacher' or not public.is_teacher_of_class(p_class) then
    raise exception 'not allowed';
  end if;
  if lower(p_login) !~ '^[a-z0-9][a-z0-9._-]{2,31}$' then raise exception 'bad login'; end if;
  if length(p_password) < 6 then raise exception 'short password'; end if;
  if exists (select 1 from public.profiles where login = lower(p_login)) then raise exception 'login taken'; end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', mail,
          extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
          '{"provider": "email", "providers": ["email"], "kind": "student"}'::jsonb,
          jsonb_build_object('full_name', left(p_name, 80)), now(), now(), '', '', '', '');

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text,
          jsonb_build_object('sub', uid::text, 'email', mail, 'email_verified', true),
          'email', now(), now(), now());

  insert into public.profiles (id, role, full_name, login, class_id)
  values (uid, 'student', left(p_name, 80), lower(p_login), p_class);
  return uid;
end $$;

create or replace function public.reset_student_password(p_student uuid, p_password text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_my_student(p_student) then raise exception 'not allowed'; end if;
  if length(p_password) < 6 then raise exception 'short password'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now()
  where id = p_student;
end $$;

create or replace function public.delete_student(p_student uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_my_student(p_student) then raise exception 'not allowed'; end if;
  delete from auth.users where id = p_student;  -- профиль, прогресс и ответы удаляются вместе с ним
end $$;

revoke all on function public.create_student(uuid, text, text, text) from public, anon;
revoke all on function public.reset_student_password(uuid, text) from public, anon;
revoke all on function public.delete_student(uuid) from public, anon;
grant execute on function public.create_student(uuid, text, text, text) to authenticated;
grant execute on function public.reset_student_password(uuid, text) to authenticated;
grant execute on function public.delete_student(uuid) to authenticated;

-- ---------- права и правила доступа ----------
revoke all on public.profiles, public.classes, public.progress, public.works, public.submissions from anon;
grant select, insert, update, delete on public.classes, public.progress, public.works, public.submissions to authenticated;
grant select on public.profiles to authenticated;
-- в профиле можно менять только имя (роль, класс и логин — нельзя)
grant update (full_name) on public.profiles to authenticated;

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.progress enable row level security;
alter table public.works enable row level security;
alter table public.submissions enable row level security;

create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_my_student(id));
create policy profiles_name on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_my_student(id))
  with check (id = auth.uid() or public.is_my_student(id));

create policy classes_teacher on public.classes for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid() and public.my_role() = 'teacher');
create policy classes_student on public.classes for select to authenticated
  using (id = public.my_class());

create policy progress_own on public.progress for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy progress_teacher on public.progress for select to authenticated
  using (public.is_my_student(user_id));

create policy works_teacher on public.works for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid() and public.is_teacher_of_class(class_id));
create policy works_student on public.works for select to authenticated
  using (class_id = public.my_class());

create policy submissions_student_read on public.submissions for select to authenticated
  using (student_id = auth.uid());
create policy submissions_student_add on public.submissions for insert to authenticated
  with check (student_id = auth.uid() and public.can_answer(work_id));
create policy submissions_teacher_read on public.submissions for select to authenticated
  using (public.is_my_work(work_id));
create policy submissions_teacher_delete on public.submissions for delete to authenticated
  using (public.is_my_work(work_id));
