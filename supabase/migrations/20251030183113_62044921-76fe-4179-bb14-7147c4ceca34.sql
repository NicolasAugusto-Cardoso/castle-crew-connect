-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the verse-of-the-day fetch job to run daily at 00:05 America/Sao_Paulo
-- This converts to 03:05 UTC (accounting for daylight saving, this may vary)
-- Using cron pattern: 5 3 * * * (at 03:05 UTC, which is 00:05 in Sao Paulo during standard time)
SELECT cron.schedule(
  'fetch-verse-of-the-day',
  '5 3 * * *', -- Run at 03:05 UTC (00:05 America/Sao_Paulo)
  $$
  SELECT
    net.http_post(
        url:=concat(current_setting('app.settings.supabase_url'), '/functions/v1/fetch-verse-of-the-day'),
        headers:=jsonb_build_object(
          'Content-Type', 'application/json', 
          'Authorization', concat('Bearer ', current_setting('app.settings.supabase_anon_key'))
        ),
        body:=jsonb_build_object('scheduled', true, 'timestamp', now())
    ) as request_id;
  $$
);

-- Store the Supabase URL and anon key as settings for the cron job
-- These will be automatically populated by Supabase
DO $$
BEGIN
  -- Set Supabase URL
  PERFORM set_config('app.settings.supabase_url', current_setting('SUPABASE_URL', true), false);
  
  -- Set Supabase anon key
  PERFORM set_config('app.settings.supabase_anon_key', current_setting('SUPABASE_ANON_KEY', true), false);
EXCEPTION
  WHEN OTHERS THEN
    -- Settings may already exist or not be available during migration
    NULL;
END $$;