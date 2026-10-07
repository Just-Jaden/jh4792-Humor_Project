create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.captions (
  id uuid primary key default gen_random_uuid(),
  image_id uuid not null references public.images(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 280),
  prompt text not null,
  model text not null,
  score integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.caption_votes (
  id uuid primary key default gen_random_uuid(),
  caption_id uuid not null references public.captions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  vote smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (caption_id, user_id)
);

create index if not exists images_created_at_idx
on public.images (created_at desc);

create index if not exists captions_image_id_idx
on public.captions (image_id);

create index if not exists caption_votes_user_id_idx
on public.caption_votes (user_id);

create or replace function public.apply_vote_to_score()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.captions
    set score = score + new.vote
    where id = new.caption_id;
  elsif tg_op = 'UPDATE' then
    update public.captions
    set score = score - old.vote + new.vote
    where id = new.caption_id;
  elsif tg_op = 'DELETE' then
    update public.captions
    set score = score - old.vote
    where id = old.caption_id;
  end if;

  return null;
end;
$$;

drop trigger if exists caption_votes_score on public.caption_votes;
create trigger caption_votes_score
after insert or update or delete on public.caption_votes
for each row execute procedure public.apply_vote_to_score();

alter table public.jokes enable row level security;
alter table public.profiles enable row level security;
alter table public.images enable row level security;
alter table public.captions enable row level security;
alter table public.caption_votes enable row level security;

drop policy if exists "Anyone can read jokes" on public.jokes;
create policy "Anyone can read jokes"
on public.jokes for select
to anon, authenticated
using (true);

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Anyone can view images" on public.images;
create policy "Anyone can view images"
on public.images for select
to anon, authenticated
using (true);

drop policy if exists "Users add their own images" on public.images;
create policy "Users add their own images"
on public.images for insert
to authenticated
with check (
  created_by = auth.uid()
  and storage_path like auth.uid()::text || '/%'
);

drop policy if exists "Users clean up their own images" on public.images;
create policy "Users clean up their own images"
on public.images for delete
to authenticated
using (created_by = auth.uid());

drop policy if exists "Anyone can view captions" on public.captions;
create policy "Anyone can view captions"
on public.captions for select
to anon, authenticated
using (true);

drop policy if exists "Users caption their own images" on public.captions;
create policy "Users caption their own images"
on public.captions for insert
to authenticated
with check (
  created_by = auth.uid()
  and score = 0
  and exists (
    select 1
    from public.images
    where images.id = image_id
      and images.created_by = auth.uid()
  )
);

drop policy if exists "Read own votes" on public.caption_votes;
create policy "Read own votes"
on public.caption_votes for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Cast own votes" on public.caption_votes;
create policy "Cast own votes"
on public.caption_votes for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Change own votes" on public.caption_votes;
create policy "Change own votes"
on public.caption_votes for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Remove own votes" on public.caption_votes;
create policy "Remove own votes"
on public.caption_votes for delete
to authenticated
using (user_id = auth.uid());

revoke all privileges on public.jokes from anon, authenticated;
revoke all privileges on public.profiles from anon, authenticated;
revoke all privileges on public.images from anon, authenticated;
revoke all privileges on public.captions from anon, authenticated;
revoke all privileges on public.caption_votes from anon, authenticated;

grant select on public.jokes to anon, authenticated;

grant select on public.profiles to authenticated;
grant update (first_name, last_name, avatar_url, updated_at)
on public.profiles to authenticated;

grant select on public.images to anon, authenticated;
grant insert (created_by, image_url, storage_path)
on public.images to authenticated;
grant delete on public.images to authenticated;

grant select on public.captions to anon, authenticated;
grant insert (image_id, created_by, content, prompt, model)
on public.captions to authenticated;

grant select on public.caption_votes to authenticated;
grant insert (caption_id, user_id, vote)
on public.caption_votes to authenticated;
grant delete on public.caption_votes to authenticated;
grant update (vote) on public.caption_votes to authenticated;

insert into storage.buckets (id, name, public)
values ('memes', 'memes', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Users upload memes to their own folder" on storage.objects;
create policy "Users upload memes to their own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'memes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users clean up their own meme uploads" on storage.objects;
create policy "Users clean up their own meme uploads"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'memes'
  and (storage.foldername(name))[1] = auth.uid()::text
);
