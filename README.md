# CareBridge: Family-Centric Elder Care Coordination Platform

CareBridge connects elderly users, distant family members and local caregivers around medicines, appointments, caregiver tasks and emergency SOS alerts. It is a care-coordination tool, **not** a medical diagnosis system, and it does not replace emergency services (call 112 in India).

**Live site:** https://carebridge-fcz7.onrender.com

## Team
- G Advita Reddy
- Saativika Polineni
- Ranganath
- Sudarshan Datta

## Tech stack
- Frontend: React, TypeScript, Tailwind CSS (Vite), responsive web
- Backend: Supabase (PostgreSQL, Auth, Row Level Security, Realtime)
- Hosting: Render (static site)

## Demo accounts
All four accounts belong to one demo care circle ("Rao Family"). The password for every account is `Demo@1234`.

| Role | Email | Name |
|---|---|---|
| Elderly | elderly@demo.com | Venkat Rao |
| Family | family@demo.com | Ravi Rao |
| Caregiver | caregiver@demo.com | Lakshmi Devi |
| Admin | admin@demo.com | Demo Admin |

All data is demo data. These credentials are for the academic demo only.

## Run locally
1. Install Node.js (LTS) and Git.
2. `git clone https://github.com/AdvitaReddy/CareBridge.git`
3. `cd CareBridge`
4. `npm install`
5. Create a file named `.env` in the project folder:
```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```
   The URL must not end with `/rest/v1/`. Never commit `.env`.
6. `npm run dev`, then open http://localhost:5173

## Database setup (Supabase)
1. Create the four demo users under Authentication → Users (password `Demo@1234`, tick Auto Confirm).
2. In the SQL Editor, run the files in the `supabase` folder in order: `schema.sql`, `seed.sql`, then `schema2.sql` to `schema7.sql`.
3. Run `notify pgrst, 'reload schema';`
4. Turn on Realtime for the tables the app uses: `doses`, `notifications`, `timeline_events`, `sos_events`, `invitations`, `tasks`, `visit_notes` and `appointments`.

## Configuration values
These live in the `app_config` table, not in the code:

| Key | Default | Meaning |
|---|---|---|
| missed_window_minutes | 30 | Minutes after the scheduled time before a dose becomes Missed |
| sos_cancel_seconds | 10 | SOS cancel window |
| sos_escalation_minutes | 5 | Minutes before an unacknowledged SOS escalates |

## Deployment (Render)
- Build command: `npm install && npm run build`; publish directory: `dist`
- Environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Variables are read at build time, so rebuild after changing them.
- Rewrite rule: source `/*`, destination `/index.html`, action Rewrite.

## Demo controls (admin only)
Log in as admin to find the demo panel: make the next dose due now, force a dose to Missed, trigger a test SOS, skip to escalation, make the next appointment due in 1 hour, and reset demo data. Every demo action is written to the audit log and flagged as a demo event.

## Not included
Push notifications, health-record upload, SMS and voice reminders. See the deviation note.