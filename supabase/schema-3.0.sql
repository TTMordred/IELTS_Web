-- Google Calendar two-way sync: link each session to its pushed event.
ALTER TABLE public.study_plan_items
  ADD COLUMN IF NOT EXISTS gcal_event_id text;

COMMENT ON COLUMN public.study_plan_items.gcal_event_id IS
  'Google Calendar event id of the pushed all-day event. NULL = not pushed yet.';
