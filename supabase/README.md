# Supabase development

Remote project ref: `xnromcineefyabmrnaro`

The tracked files contain schema and local development configuration only. Never commit a Secret Key, `service_role` key, database password, connection string, or CLI access token.

## Local preparation

After installing the Supabase CLI and a Docker-compatible runtime:

```sh
npx supabase start
npx supabase db reset
```

## Link and deploy

External operations require approval before they are run:

```sh
npx supabase login
npx supabase link --project-ref xnromcineefyabmrnaro
npx supabase migration list
npx supabase db push
```

Review every pending migration before `db push`. Do not use `db reset --linked` against this project.

## Browser configuration

Copy `v2-supabase-config.example.js` to the ignored `v2-supabase-config.js` and place only an `sb_publishable_...` key in it. The actual login UI and cloud-sync trigger will be enabled after the Auth redirect URL is decided.
