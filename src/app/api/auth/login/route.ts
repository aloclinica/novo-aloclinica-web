import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { LoginSchema } from '@/lib/validations/auth';
import { success, error } from '@/lib/utils/api-response';

/**
 * User login endpoint
 * POST /api/auth/login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = LoginSchema.parse(body);

    const supabase = createServerClient();

    // Sign in with email/password
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (authError || !data.user || !data.session) {
      return error(authError?.message || 'Invalid credentials', 401);
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      return error('Profile not found', 404);
    }

    // TODO: Log login attempt in audit_logs

    return success(
      {
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
        },
        user: profile,
      },
      200,
    );
  } catch (err) {
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}
