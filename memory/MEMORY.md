# CashKarma — Project Memory

## Stack
- React + TypeScript + Vite
- Tailwind CSS
- Supabase (auth + database)
- lucide-react for icons

## Key File Paths
- `src/lib/supabase.ts` — Supabase client + full Database type definitions
- `src/types/auth.ts` — User, LoginCredentials, RegisterCredentials, AuthContextType
- `src/utils/auth.ts` — authenticateUser, registerUser, signInWithGoogle, updateUserProfile, signOut, getUserById, getAllUsers
- `src/contexts/AuthContext.tsx` — AuthProvider, useAuth hook; handles onAuthStateChange, OAuth profile creation
- `src/pages/AuthPage.tsx` — Login/Register page switcher
- `src/pages/DashboardPage.tsx` — Main dashboard
- `src/pages/GroupDetailsPage.tsx` — Group detail view
- `src/pages/InvitePage.tsx` — Invite link handler
- `src/components/LoginForm.tsx` — Email login + Google OAuth button
- `src/components/RegisterForm.tsx` — Email registration + Google OAuth button

## Auth Pattern
- Supabase email/password + Google OAuth (`signInWithOAuth`)
- `onAuthStateChange` in AuthContext handles session events (SIGNED_IN, SIGNED_OUT, INITIAL_SESSION)
- For Google OAuth users: profile row is created on first SIGNED_IN if it doesn't exist, using `user_metadata` (given_name, family_name, picture)
- Profiles table maps to app's `User` type via `rowToUser()` helper in utils/auth.ts

## Database Tables (Supabase)
- `profiles` — id, email, first_name, last_name, avatar_url, currency, created_at, updated_at
- `groups` — id, name, description, avatar_url, location, currency, created_by, timestamps
- `group_members` — id, group_id, user_id, role (admin|member), joined_at
- `payments` — expense/payment records with split logic
- `settlements` — debt settlement records
- `group_invitations` — invite by user_id, status (pending|accepted|declined)
- `invite_codes` — one per group, used for link-based invites

## Conventions
- Components use named exports (not default)
- Auth errors are thrown as `new Error(message)` and caught in component state
- Supabase redirectTo for OAuth: `window.location.origin`
