-- Ensure app superadmin for operations email (user_roles.admin; all admin RLS and UI).
-- Idempotent: safe if the auth user does not exist yet (no-op).

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE lower(trim(u.email)) = lower(trim('m.i.a.sciences@gmail.com'))
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
