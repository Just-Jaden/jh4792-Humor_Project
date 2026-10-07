# Campus to City Captions

A Next.js App Router humor app backed by Supabase and Gemini. Anyone can browse
AI-generated caption challenges, while signed-in users can upload photos and
vote captions up or down.

## Product intent

- **Audience:** Sam's biography is a taste profile, not mandatory caption
  subject matter. The voice is image-first, current, specific, and tuned to an
  18-to-22-year-old balancing classes, roommates, friendships, dating, clubs,
  deadlines, limited money, new independence, late nights, and exploration.
- **Daily return:** a changing feed captures the small moments from each week,
  while community votes keep re-ranking the five captions on every post.
- **Popular content:** captions are recognizable to Columbia students but broad
  enough to share beyond campus. Location, dorm, subway, and Midwest references
  appear only when the photo earns them instead of becoming repetitive filler.
- **Improvement over a single AI answer:** every photo gets a specific
  observation, a relatable young-adult angle, an internet-native angle, a
  deadpan option, and an absurd escalation. Voting turns generation into a
  feedback loop that reveals what the audience actually finds funny.

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

## Assignment 4 setup

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Add these server-only variables to `.env.local` and Vercel:

   ```text
   GEMINI_API_KEY=your-key
   GEMINI_MODEL=gemini-flash-lite-latest
   ```

3. Run `supabase/assignment-4-rating.sql` in the Supabase SQL Editor. It creates
   the image, caption, and vote tables; keeps caption scores synchronized; adds
   the `memes` bucket; enables strict RLS on every application table; and
   replaces Supabase's broad default table grants with exact per-role and
   per-column privileges. Re-run the file after pulling changes because it is
   idempotent and may include policy hardening.
4. In Supabase Table Editor, confirm RLS is enabled for `jokes`, `profiles`,
   `images`, `captions`, and `caption_votes`.

## Assignment 4 test checklist

1. Signed out: load `/`, confirm the feed is public, confirm votes ask you to
   sign in, and confirm `/create` redirects to `/login`.
2. Signed in: upload a JPEG, PNG, or WebP smaller than 5 MB and confirm exactly
   five captions appear on the feed.
3. Confirm the new `captions` rows include the full prompt and Gemini model.
4. Upvote, downvote, switch directions, and click the active vote again to
   remove it. Refresh after each case to confirm the result persists.
5. Re-test onboarding, profile editing, avatar upload, and `/vault`.

## Deploy and submit

1. Add all four `.env.example` variables to Vercel.
2. Push the finished commit and let Vercel create a deployment.
3. Disable Vercel Deployment Protection, then open the commit-specific
   deployment URL in an Incognito window.
4. Complete one Google sign-in, upload, and voting cycle in production.
5. Submit the commit-specific URL as plain text, not a Vercel dashboard link.
6. During the feedback session, record what the PM struggled with and make a
   small, finished iteration based on that feedback.
