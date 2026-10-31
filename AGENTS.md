# PadhaiPilot — instructions for coding agents

Start with `docs/HANDOFF_ANTIGRAVITY.md` (current state, branches, safe release procedure, ordered task list), then `docs/PROJECT_AUDIT.md` and `docs/ENGINEERING_TRACKER.md`.

Non-negotiables:
- npm only, no Expo. Production API and portals run on Vercel; pushing `main` deploys production.
- Never run Prisma migrate/db push/seed against the database in the root `.env` (real production credentials). Author migrations offline and rehearse on a throwaway database.
- Never weaken the auth hardening (scrypt, strong `JWT_SECRET`, exact-origin CORS, role guards, no demo routes in production).
- The Teacher Portal theme is the master design; only Playfair Display, Raleway and Inter.
- No fabricated data in production code paths; tenant ids and roles always come from the verified JWT, never from client input.
- Report "Implemented" and "Verified" honestly.
