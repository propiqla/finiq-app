import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// FinIQ (banking marketplace) client — scoped to the `banking` schema,
// kept deliberately separate from `app/supabase.ts` (scoped to `public`,
// the PropIQ real estate schema). No shared queries between the two;
// the only thing they have in common is `auth.users`.
//
// IMPORTANT: `banking` must be added under Project Settings -> API ->
// Exposed schemas in the Supabase dashboard before any call below will
// succeed. PostgREST only routes to schemas explicitly listed there —
// until then every call here returns a 404 / "schema not found" error.
export const supabaseBanking = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'banking' },
})
