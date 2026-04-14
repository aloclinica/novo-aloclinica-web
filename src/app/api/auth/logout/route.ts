import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { success, error } from '@/lib/utils/api-response';

/**
 * User logout endpoint
 * POST /api/auth/logout
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Sign out
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      return error(signOutError.message, 400);
    }

    return success({ message: 'Logged out successfully' }, 200);
  } catch (err) {
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}
