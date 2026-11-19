# campXsolutions backend

The backend is provided by Supabase: Auth for KIET email OTP verification and password accounts, Postgres for student profiles and campus services, Row Level Security for authorization, and Realtime for feed/chat updates. This folder contains the SQL required to set up those services.

Apply the SQL files in [`supabase/migrations/`](./supabase/migrations/) in filename order through the Supabase SQL Editor. They create the student profile, lost-and-found, marketplace, facility report, and survey tables and their RLS policies. Student profiles are private to their owner; returned and archived item reports are visible only to their owner; facility reports and survey results are private to authorized staff, while student access is restricted to authenticated `@kiet.edu` accounts.

Students may submit reports about any campus facility or service problem, but cannot select or update submitted reports. Only staff can read those reports and move them through open, in-progress, and resolved statuses. Only staff can create, close, or reopen surveys; students can view active surveys and submit one response to each.

To grant staff access, edit the staff user's `app_metadata` in **Authentication → Users** and set `{"role":"admin"}`. This metadata is trusted because users cannot update their own `app_metadata`; do not implement staff roles using user-editable metadata. Have the staff member sign out and back in to refresh the JWT claim.

Use only the Supabase publishable/anon key in the frontend. Never expose a service-role key in client code.

Configure the Supabase **Magic Link** email template to display the one-time token (`{{ .Token }}`) so users can verify signup and request password changes with an email code. Supabase Auth enforces unique email accounts; an existing account's email OTP verifies ownership before its password can be changed.

When Supabase environment variables are missing, the frontend allows a local demo sign-in for any `@kiet.edu` address. This is not a real account or verified identity: demo sessions are stored only in that browser, and marketplace listings, reports, surveys, claims, and realtime chat require a configured Supabase project. Configure Supabase Auth before deployment.
