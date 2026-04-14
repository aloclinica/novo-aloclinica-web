import { createBrowserClient as createBrowserClientBase } from '@supabase/ssr';

/**
 * Browser-safe Supabase client (anon key, RLS enforced)
 * Used in client components and browser environments
 */
export const createBrowserClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
  }

  return createBrowserClientBase(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
};
