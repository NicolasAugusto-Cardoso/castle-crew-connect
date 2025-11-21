-- Remover o cron job quebrado atual
SELECT cron.unschedule('fetch-verse-of-the-day');

-- Criar novo cron job com URL e token hardcoded
SELECT cron.schedule(
  'fetch-verse-of-the-day',
  '5 3 * * *', -- 03:05 UTC = 00:05 America/Sao_Paulo
  $$
  SELECT
    net.http_post(
        url:='https://tcvtgzubarrsppppazfo.supabase.co/functions/v1/fetch-verse-of-the-day',
        headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjdnRnenViYXJyc3BwcHBhemZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODgzNTEsImV4cCI6MjA3NzI2NDM1MX0.n7OzGytG8czUGn0_mYTB4y7hi24mxrwfbxYUcwSzo2Y'
        ),
        body:=jsonb_build_object('scheduled', true, 'timestamp', now())
    ) as request_id;
  $$
);