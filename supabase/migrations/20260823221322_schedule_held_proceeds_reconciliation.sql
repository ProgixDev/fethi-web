-- Retry release work and transfer reversals without embedding credentials in
-- schema history. The three values are encrypted in Supabase Vault during
-- environment provisioning.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'held-proceeds-reconcile-every-5-minutes',
  '*/5 * * * *',
  $job$
    select net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'held_proceeds_project_url'
      ) || '/functions/v1/held-proceeds-reconcile',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'held_proceeds_publishable_key'
        ),
        'X-Reconcile-Secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'held_proceeds_reconcile_secret'
        )
      ),
      body := '{}'::jsonb
    );
  $job$
);
