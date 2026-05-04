-- ═══════════════════════════════════════════════════════════
-- IELTS Self-Study Hub — Full Database Schema (14 tables)
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  target_band decimal(2,1) check (target_band >= 4.0 and target_band <= 9.0),
  current_est_band decimal(2,1),
  exam_date date,
  total_xp integer not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active date,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- 2. LISTENING RECORDS
create table if not exists public.listening_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  source text not null default 'other',
  test_name text not null default '',
  link text,
  total_score integer not null check (total_score >= 0 and total_score <= 40),
  estimated_band decimal(2,1),
  reflection text,
  self_rating integer check (self_rating >= 1 and self_rating <= 5),
  created_at timestamptz not null default now()
);

create index idx_listening_records_user on public.listening_records(user_id);
create index idx_listening_records_date on public.listening_records(date);

alter table public.listening_records enable row level security;
create policy "Users can read own records" on public.listening_records for select using (auth.uid() = user_id);
create policy "Users can insert own records" on public.listening_records for insert with check (auth.uid() = user_id);
create policy "Users can update own records" on public.listening_records for update using (auth.uid() = user_id);
create policy "Users can delete own records" on public.listening_records for delete using (auth.uid() = user_id);

-- 3. LISTENING SECTION DETAILS
create table if not exists public.listening_section_details (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.listening_records(id) on delete cascade,
  section integer not null check (section >= 1 and section <= 4),
  section_score integer not null check (section_score >= 0 and section_score <= 10),
  notes text,
  unique (record_id, section)
);

create index idx_section_details_record on public.listening_section_details(record_id);

alter table public.listening_section_details enable row level security;
create policy "Users can read own section details" on public.listening_section_details
  for select using (exists (
    select 1 from public.listening_records where id = record_id and user_id = auth.uid()
  ));
create policy "Users can insert own section details" on public.listening_section_details
  for insert with check (exists (
    select 1 from public.listening_records where id = record_id and user_id = auth.uid()
  ));
create policy "Users can update own section details" on public.listening_section_details
  for update using (exists (
    select 1 from public.listening_records where id = record_id and user_id = auth.uid()
  ));
create policy "Users can delete own section details" on public.listening_section_details
  for delete using (exists (
    select 1 from public.listening_records where id = record_id and user_id = auth.uid()
  ));

-- 4. LISTENING TYPE RESULTS
create table if not exists public.listening_type_results (
  id uuid primary key default gen_random_uuid(),
  section_detail_id uuid not null references public.listening_section_details(id) on delete cascade,
  question_type text not null,
  correct integer not null default 0,
  total integer not null default 0,
  mistakes_note text
);

create index idx_type_results_section on public.listening_type_results(section_detail_id);
create index idx_type_results_type on public.listening_type_results(question_type);

alter table public.listening_type_results enable row level security;
create policy "Users can read own type results" on public.listening_type_results
  for select using (exists (
    select 1 from public.listening_section_details sd
    join public.listening_records lr on sd.record_id = lr.id
    where sd.id = section_detail_id and lr.user_id = auth.uid()
  ));
create policy "Users can insert own type results" on public.listening_type_results
  for insert with check (exists (
    select 1 from public.listening_section_details sd
    join public.listening_records lr on sd.record_id = lr.id
    where sd.id = section_detail_id and lr.user_id = auth.uid()
  ));
create policy "Users can update own type results" on public.listening_type_results
  for update using (exists (
    select 1 from public.listening_section_details sd
    join public.listening_records lr on sd.record_id = lr.id
    where sd.id = section_detail_id and lr.user_id = auth.uid()
  ));
create policy "Users can delete own type results" on public.listening_type_results
  for delete using (exists (
    select 1 from public.listening_section_details sd
    join public.listening_records lr on sd.record_id = lr.id
    where sd.id = section_detail_id and lr.user_id = auth.uid()
  ));

-- 5. VOCAB CARDS
create table if not exists public.vocab_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  word text not null,
  meaning text not null,
  example text,
  topic text,
  tags text[] default '{}',
  mastery integer not null default 0 check (mastery >= 0 and mastery <= 100),
  next_review date default current_date + interval '1 day',
  review_count integer not null default 0,
  source text,
  created_at timestamptz not null default now()
);

create index idx_vocab_cards_user on public.vocab_cards(user_id);
create index idx_vocab_cards_next_review on public.vocab_cards(next_review);
create index idx_vocab_cards_topic on public.vocab_cards(topic);

alter table public.vocab_cards enable row level security;
create policy "Users can read own vocab" on public.vocab_cards for select using (auth.uid() = user_id);
create policy "Users can insert own vocab" on public.vocab_cards for insert with check (auth.uid() = user_id);
create policy "Users can update own vocab" on public.vocab_cards for update using (auth.uid() = user_id);
create policy "Users can delete own vocab" on public.vocab_cards for delete using (auth.uid() = user_id);

-- 6. DAILY ACTIVITY
create table if not exists public.daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  xp_earned integer not null default 0,
  listening_count integer not null default 0,
  reading_count integer not null default 0,
  speaking_count integer not null default 0,
  writing_count integer not null default 0,
  vocab_reviewed integer not null default 0,
  notes_added integer not null default 0,
  unique (user_id, date)
);

create index idx_daily_activity_user on public.daily_activity(user_id);
create index idx_daily_activity_date on public.daily_activity(date);

alter table public.daily_activity enable row level security;
create policy "Users can read own activity" on public.daily_activity for select using (auth.uid() = user_id);
create policy "Users can insert own activity" on public.daily_activity for insert with check (auth.uid() = user_id);
create policy "Users can update own activity" on public.daily_activity for update using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
-- PHASE 2 TABLES
-- ═══════════════════════════════════════════════════════════

-- 7. READING RECORDS
create table if not exists public.reading_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  source text not null default 'other',
  test_name text not null default '',
  link text,
  total_score integer not null check (total_score >= 0 and total_score <= 40),
  estimated_band decimal(2,1),
  total_time_min integer,
  reflection text,
  self_rating integer check (self_rating >= 1 and self_rating <= 5),
  created_at timestamptz not null default now()
);

create index idx_reading_records_user on public.reading_records(user_id);
alter table public.reading_records enable row level security;
create policy "Users can CRUD own reading records" on public.reading_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 8. READING PASSAGE DETAILS
create table if not exists public.reading_passage_details (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.reading_records(id) on delete cascade,
  passage_num integer not null check (passage_num >= 1 and passage_num <= 3),
  passage_topic text,
  passage_score integer not null default 0,
  time_spent_min integer,
  notes text,
  unique (record_id, passage_num)
);

create index idx_passage_details_record on public.reading_passage_details(record_id);
alter table public.reading_passage_details enable row level security;
create policy "Users can CRUD own passage details" on public.reading_passage_details
  for all using (exists (
    select 1 from public.reading_records where id = record_id and user_id = auth.uid()
  )) with check (exists (
    select 1 from public.reading_records where id = record_id and user_id = auth.uid()
  ));

-- 9. READING TYPE RESULTS
create table if not exists public.reading_type_results (
  id uuid primary key default gen_random_uuid(),
  passage_detail_id uuid not null references public.reading_passage_details(id) on delete cascade,
  question_type text not null,
  correct integer not null default 0,
  total integer not null default 0,
  mistakes_note text
);

create index idx_reading_type_results_passage on public.reading_type_results(passage_detail_id);
alter table public.reading_type_results enable row level security;
create policy "Users can CRUD own reading type results" on public.reading_type_results
  for all using (exists (
    select 1 from public.reading_passage_details pd
    join public.reading_records rr on pd.record_id = rr.id
    where pd.id = passage_detail_id and rr.user_id = auth.uid()
  )) with check (exists (
    select 1 from public.reading_passage_details pd
    join public.reading_records rr on pd.record_id = rr.id
    where pd.id = passage_detail_id and rr.user_id = auth.uid()
  ));

-- 10. SPEAKING ENTRIES
create table if not exists public.speaking_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  type text not null default 'practice',
  estimated_band decimal(2,1),
  fluency_score integer check (fluency_score >= 1 and fluency_score <= 9),
  lexical_score integer check (lexical_score >= 1 and lexical_score <= 9),
  grammar_score integer check (grammar_score >= 1 and grammar_score <= 9),
  pronunciation_score integer check (pronunciation_score >= 1 and pronunciation_score <= 9),
  reflection text,
  created_at timestamptz not null default now()
);

create index idx_speaking_entries_user on public.speaking_entries(user_id);
alter table public.speaking_entries enable row level security;
create policy "Users can CRUD own speaking entries" on public.speaking_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 11. SPEAKING PART DETAILS
create table if not exists public.speaking_part_details (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.speaking_entries(id) on delete cascade,
  part integer not null check (part >= 1 and part <= 3),
  topic text,
  topic_category text,
  notes text,
  recording_url text,
  unique (entry_id, part)
);

create index idx_speaking_parts_entry on public.speaking_part_details(entry_id);
alter table public.speaking_part_details enable row level security;
create policy "Users can CRUD own speaking parts" on public.speaking_part_details
  for all using (exists (
    select 1 from public.speaking_entries where id = entry_id and user_id = auth.uid()
  )) with check (exists (
    select 1 from public.speaking_entries where id = entry_id and user_id = auth.uid()
  ));

-- 12. WRITING ENTRIES
create table if not exists public.writing_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  task_type text not null default 'task1',
  sub_type text not null default '',
  topic text,
  topic_category text,
  question_text text,
  image_url text,
  essay_content text,
  word_count integer,
  time_spent_min integer,
  estimated_band decimal(2,1),
  ta_score integer check (ta_score >= 1 and ta_score <= 9),
  cc_score integer check (cc_score >= 1 and cc_score <= 9),
  lr_score integer check (lr_score >= 1 and lr_score <= 9),
  gra_score integer check (gra_score >= 1 and gra_score <= 9),
  feedback text,
  created_at timestamptz not null default now()
);

create index idx_writing_entries_user on public.writing_entries(user_id);
alter table public.writing_entries enable row level security;
create policy "Users can CRUD own writing entries" on public.writing_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 13. GRAMMAR NOTES
create table if not exists public.grammar_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  rule text not null,
  correct_examples text[] default '{}',
  common_mistakes text[] default '{}',
  source text,
  mastery_level integer not null default 0 check (mastery_level >= 0 and mastery_level <= 100),
  created_at timestamptz not null default now()
);

create index idx_grammar_notes_user on public.grammar_notes(user_id);
create index idx_grammar_notes_category on public.grammar_notes(category);
alter table public.grammar_notes enable row level security;
create policy "Users can CRUD own grammar notes" on public.grammar_notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 14. BADGES
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_type text not null,
  earned_at timestamptz not null default now(),
  metadata jsonb default '{}',
  unique (user_id, badge_type)
);

create index idx_badges_user on public.badges(user_id);
alter table public.badges enable row level security;
create policy "Users can read own badges" on public.badges for select using (auth.uid() = user_id);
create policy "Users can insert own badges" on public.badges for insert with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
-- UTILITY FUNCTIONS
-- ═══════════════════════════════════════════════════════════

-- Timezone-safe current date (used by streak logic)
create or replace function public.get_current_date_text()
returns text as $$
begin
  return (current_date at time zone 'Asia/Ho_Chi_Minh')::date::text;
end;
$$ language plpgsql stable;

-- ═══════════════════════════════════════════════════════════
-- AUTO-CREATE PROFILE on signup
-- ═══════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
