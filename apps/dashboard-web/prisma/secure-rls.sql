DO $$
DECLARE
  app_table text;
  app_sequence text;
  app_tables text[] := ARRAY[
    'User',
    'Account',
    'Session',
    'VerificationToken',
    'Project',
    'AnalyticsEvent',
    'Feedback',
    'Follow',
    'Waitlist',
    'EmbedProjectSettings',
    'EmbedAllowedOrigin',
    'Donation',
    'dashboard_users',
    'creator_projects'
  ];
BEGIN
  FOREACH app_table IN ARRAY app_tables
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', app_table);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', app_table);

    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC', app_table);
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon', app_table);
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM authenticated', app_table);
  END LOOP;

  FOR app_sequence IN
    SELECT sequence_name
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
  LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES ON SEQUENCE public.%I FROM PUBLIC', app_sequence);
    EXECUTE format('REVOKE ALL PRIVILEGES ON SEQUENCE public.%I FROM anon', app_sequence);
    EXECUTE format('REVOKE ALL PRIVILEGES ON SEQUENCE public.%I FROM authenticated', app_sequence);
  END LOOP;

  ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;

  ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;
END $$;
