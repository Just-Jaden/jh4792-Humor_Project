# Humor Project

A Next.js App Router project backed by Supabase jokes, Google authentication,
profiles, and avatar uploads.

## Assignment 3 setup

1. Copy `.env.example` to `.env.local` and add the Supabase project URL and
   anon/publishable key.
2. Run `supabase/assignment-3-auth.sql` in the Supabase SQL Editor.
3. In Google Cloud, create a Web OAuth client. Use the Supabase provider
   callback shown in the Supabase Google provider settings as Google's
   authorized redirect URI.
4. Enable Google in Supabase Authentication and add these application redirect
   URLs:
   - `http://localhost:3001/auth/callback`
   - Your Vercel preview and production URLs ending in `/auth/callback`
5. Add the same environment variables to Vercel and disable Vercel Deployment
   Protection for the submitted deployment.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001). Test `/vault` while signed
out, complete Google sign-in, finish onboarding, edit `/profile`, and upload an
avatar.

Binary image data is stored in Supabase Storage. Only the public URL is stored
in `profiles.avatar_url`.
