-- Grant table privileges for the new Supabase auto-expose default.
-- Since the current Supabase default no longer auto-exposes tables created by
-- postgres to the anon/authenticated roles, explicit grants are required for
-- the app's PostgREST access (login, planner, etc.).
-- Safe to run against existing databases (grants are idempotent).

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
