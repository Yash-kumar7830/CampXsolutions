# CampXsolutions

campXsolutions is a KIET-only campus community app with three student services: lost-and-found, a student-to-student pre-owned marketplace, and private campus facility reports plus management-created surveys. The project is organized into separate frontend and backend folders:

- [`frontend/`](./frontend/) — React, JavaScript/JSX, Vite, and Tailwind CSS application.
- [`backend/`](./backend/) — Supabase database schema, Row Level Security policies, and Realtime setup.

Supabase provides the managed backend services (Auth, Postgres, and Realtime). The frontend connects using the Supabase publishable/anon key and database RLS; no service-role key is used in the browser.

## Backend setup

1. Create a Supabase project and run **all** SQL files, in filename order, from [`backend/supabase/migrations/`](./backend/supabase/migrations/) in its SQL Editor. The marketplace migrations set up photo storage, interest-gated seller contact access, and the required listing permissions.
2. In **Authentication → Providers → Email**, enable email sign-in and configure the **Magic Link** email template to show the one-time token (`{{ .Token }}`) instead of only a confirmation link. The app verifies the email OTP before asking the user to create a password.
3. In **Authentication → URL Configuration**, add your local and production app URLs.
4. In **Authentication → Users**, set staff members' `app_metadata` to `{"role":"admin"}` using the Supabase Dashboard or a trusted server-side admin tool. Never add a service-role key to the frontend. Sign out and back in after changing a user's role.
5. Review [`backend/README.md`](./backend/README.md) for backend details.

The schema creates lost-and-found items, claims, private messages, marketplace listings, facility reports, surveys, and survey responses. RLS restricts access to authenticated `@kiet.edu` students; facility reports and survey response results are available only to staff. Staff are identified by the trusted Supabase `app_metadata.role` claim.

## Frontend setup

1. Copy `frontend/.env.example` to `frontend/.env.local`.
2. Set the Supabase project URL and publishable/anon key:

   ```text
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
   ```

3. Install and run the frontend (the Vercel project root should be `frontend`):

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

4. For production, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Vercel environment variables, then deploy. The publishable/anon key is intended for the browser; never use the service-role key here.

## Main flows

- KIET members provide their name, branch, course, year of study, and email, verify the email OTP, then create a password. Supabase enforces unique account emails and stores the student profile with owner-only access.
- Existing account holders can request an email OTP to verify ownership and set a new password.
- Users can report a lost or found item with its category and campus location.
- Students can submit a campus facility issue or feedback report, including category, location, details, and issue urgency.
- A claim starts a private realtime conversation between the claimant and report owner.
- Students can list used items with up to three photos, set a price and phone number, and mark their own listings sold. A buyer records interest with **Buy / Show interest** before the seller's number is revealed.
- Staff can review and update facility-report status, publish single-choice surveys, close surveys, and review response totals.
- Only staff users with the trusted Supabase `app_metadata.role = "admin"` claim can create or manage surveys and read/update private facility reports. Students can browse active surveys and submit one response per survey; they cannot read facility reports or change report status.
- Campus problem reporting and surveys are grouped together at `/reports`; facility reporting is separate from the Lost & Found page.
- The report owner can verify or decline claims from the home page.
