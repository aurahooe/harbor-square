# Harbor Square

A quiet public wall. Sign in, write notes, mark them public, and they appear for everyone. Every hour the house hangs a new pulse and features a public note.

## Stack
- Next.js
- Supabase Auth + Postgres (RLS)
- Vercel cron at the top of every hour (`/api/hour`)

## Env
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Enable email auth in the Supabase project. Deploy on Vercel and add the same env vars.
