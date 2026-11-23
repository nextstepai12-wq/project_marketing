-- NEXTSTEP SUPPORT — شغّل هذا الملف في Supabase > SQL Editor
create table admin_users (user_id uuid primary key references auth.users on delete cascade);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  ref text unique not null,
  project_name text not null,
  owner_name text not null,
  email text not null,
  field text,
  details jsonb not null default '{}',
  files jsonb not null default '[]',
  status text not null default 'new',
  scores jsonb not null default '{}',
  score int not null default 0,
  opportunity text,
  admin_notes text,
  reject_reason text,
  channels text,
  post_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index submissions_dupe on submissions (lower(email), lower(project_name));

create table activity_log (
  id bigserial primary key,
  submission_id uuid references submissions on delete cascade,
  admin_email text,
  action text,
  changes jsonb,
  created_at timestamptz not null default now()
);

create function is_admin() returns boolean language sql security definer stable as
$$ select exists (select 1 from admin_users where user_id = auth.uid()) $$;

alter table admin_users enable row level security;
alter table submissions enable row level security;
alter table activity_log enable row level security;

-- الزائر: إرسال طلب جديد فقط، بلا قراءة ولا تعديل
create policy "visitors can apply" on submissions for insert to anon
  with check (status = 'new' and score = 0 and admin_notes is null and reject_reason is null and post_url is null);
create policy "admins read" on submissions for select to authenticated using (is_admin());
create policy "admins update" on submissions for update to authenticated using (is_admin()) with check (is_admin());
create policy "admins read log" on activity_log for select to authenticated using (is_admin());
create policy "admins write log" on activity_log for insert to authenticated with check (is_admin());

-- التخزين: حاوية خاصة، 5MB، صور وPDF فقط
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('submissions', 'submissions', false, 5242880,
  array['image/png','image/jpeg','image/webp','application/pdf']);
create policy "visitors upload files" on storage.objects for insert to anon
  with check (bucket_id = 'submissions');
create policy "admins read files" on storage.objects for select to authenticated
  using (bucket_id = 'submissions' and public.is_admin());

-- تحقق من جهة الخادم (لا تعتمد على المتصفح وحده)
alter table submissions add constraint chk_email check (email ~* '^\S+@\S+\.\S+$');
alter table submissions add constraint chk_len check (char_length(project_name) <= 150 and char_length(owner_name) <= 120 and pg_column_size(details) < 60000);
alter table submissions add constraint chk_files check (jsonb_array_length(files) <= 5);

-- حد أقصى 5 طلبات في الساعة لكل بريد، وتوحيد البريد بحروف صغيرة
create function limit_submissions() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from submissions where lower(email) = lower(new.email) and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'rate limit';
  end if;
  new.email := lower(new.email);
  return new;
end $$;
create trigger trg_limit before insert on submissions for each row execute function limit_submissions();

-- بعد إنشاء حساب المسؤول من Authentication > Users، أضفه هنا:
-- insert into admin_users (user_id) select id from auth.users where email = 'YOUR_ADMIN_EMAIL';
