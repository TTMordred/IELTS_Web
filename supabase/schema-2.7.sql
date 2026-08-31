-- Planner rework: allow multiple study plan items per (user_id, date).
-- Drops the old 3-slot model (morning/afternoon/evening).

ALTER TABLE public.study_plan_items
  DROP CONSTRAINT IF EXISTS study_plan_items_user_id_date_time_slot_key;

ALTER TABLE public.study_plan_items
  DROP COLUMN IF EXISTS time_slot;

CREATE INDEX IF NOT EXISTS idx_study_plan_user_date
  ON public.study_plan_items(user_id, date);
