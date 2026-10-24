import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error(
    'Missing Supabase settings. Copy .env.example to .env.local, fill in ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then restart ' +
      'the dev server.',
  )
}

// The publishable (or legacy anon) key is safe in the browser: it has no
// special privileges, and Row Level Security decides what each user can do.
export const supabase = createClient(url, key, {
  auth: {
    // PKCE: email links and OAuth return a one-time code that the browser
    // exchanges for a session, instead of putting tokens in the URL.
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})