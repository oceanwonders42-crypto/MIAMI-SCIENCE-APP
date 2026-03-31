# Admin web deployment

## Access control

- **Navigation:** The **Admin** item is shown only when `user_roles.role` is `admin` (`src/components/layout/AppNav.tsx`).
- **Routes:** All `/admin/*` pages use `src/app/admin/layout.tsx`, which redirects non-admins to `/dashboard` and unauthenticated users to the login route.

`NEXT_PUBLIC_APP_STORE_BUILD` does **not** hide Admin from admins; App Store / Capacitor and the public web app use the same role-based nav and server layout gate.

## Optional operator hostname

You can still serve the same deployment on a dedicated hostname (e.g. `ops.app.mia-science.com`) for operator bookmarks or DNS. **`NEXT_PUBLIC_ADMIN_WEB_HOSTS` is not read by application code** after the host-based middleware redirect was removed; it can be omitted or cleared in Vercel.

## Verification

- **Admin:** Sidebar includes **Admin**; on narrow viewports the bottom bar includes **Admin**; `/admin` loads.
- **Customer or affiliate (non-admin):** No **Admin** in nav; a direct visit to `/admin` redirects to `/dashboard`.
