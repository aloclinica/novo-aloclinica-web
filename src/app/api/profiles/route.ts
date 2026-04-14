import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile } from '@/lib/utils/auth-guard';
import { success, error } from '@/lib/utils/api-response';

/**
 * Get authenticated user's profile
 * GET /api/profiles
 */
export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const supabase = createServerClient();

  const profile = await getUserProfile(request);

  if (!profile) {
    return error('Profile not found', 404);
  }

  return success(profile, 200);
}

/**
 * Update authenticated user's profile
 * PATCH /api/profiles
 */
export async function PATCH(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const supabase = createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return error('User not found', 401);
    }

    // Allowed fields to update
    const allowedFields = ['full_name', 'phone', 'avatar_url', 'address'];

    const updateData = Object.entries(body).reduce((acc, [key, value]) => {
      if (allowedFields.includes(key)) {
        return { ...acc, [key]: value };
      }
      return acc;
    }, {});

    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      return error(updateError.message, 400);
    }

    return success(updated, 200);
  } catch (err) {
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}
