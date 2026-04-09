-- ═══════════════════════════════════════════════════════════
-- IELTS Self-Study Hub — Phase 2 Schema (Reading, Writing, Speaking, Grammar)
-- Run this in Supabase SQL Editor AFTER schema.sql
-- ═══════════════════════════════════════════════════════════

-- ── READING MODULE ──────────────────────────────────────────

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
create policy "Users CRUD own reading" on public.reading_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

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

create index idx_reading_passages_record on public.reading_passage_details(record_id);
alter table public.reading_passage_details enable row level security;
create policy "Users CRUD own reading passages" on public.reading_passage_details for all
  using (exists (select 1 from public.reading_records where id = record_id and user_id = auth.uid()))
  with check (exists (select 1 from public.reading_records where id = record_id and user_id = auth.uid()));

create table if not exists public.reading_type_results (
  id uuid primary key default gen_random_uuid(),
  passage_detail_id uuid not null references public.reading_passage_details(id) on delete cascade,
  question_type text not null,
  correct integer not null default 0,
  total integer not null default 0,
  mistakes_note text
);

create index idx_reading_types_passage on public.reading_type_results(passage_detail_id);
alter table public.reading_type_results enable row level security;
create policy "Users CRUD own reading types" on public.reading_type_results for all
  using (exists (
    select 1 from public.reading_passage_details pd
    join public.reading_records rr on pd.record_id = rr.id
    where pd.id = passage_detail_id and rr.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.reading_passage_details pd
    join public.reading_records rr on pd.record_id = rr.id
    where pd.id = passage_detail_id and rr.user_id = auth.uid()
  ));

-- ── WRITING MODULE ──────────────────────────────────────────

create table if not exists public.writing_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  task_type text not null check (task_type in ('task1', 'task2')),
  sub_type text not null,
  topic text,
  topic_category text,
  question_text text,
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
create policy "Users CRUD own writing" on public.writing_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── SPEAKING MODULE ─────────────────────────────────────────

create table if not exists public.speaking_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  type text not null check (type in ('practice', 'mock_test', 'real_test')),
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
create policy "Users CRUD own speaking" on public.speaking_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

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
create policy "Users CRUD own speaking parts" on public.speaking_part_details for all
  using (exists (select 1 from public.speaking_entries where id = entry_id and user_id = auth.uid()))
  with check (exists (select 1 from public.speaking_entries where id = entry_id and user_id = auth.uid()));

-- ── GRAMMAR NOTES ───────────────────────────────────────────

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
create policy "Users CRUD own grammar" on public.grammar_notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
