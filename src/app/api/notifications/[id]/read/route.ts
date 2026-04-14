import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile } from '@/lib/utils/auth-guard';
import { success, error } from '@/lib/utils/api-response';

/**
 * Mark notification as read
 * PATCH /api/notifications/[id]/read
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const supabase = createServerClient();
    const profile = await getUserProfile(request);

    if (!profile) {
      return error('Profile not found', 404);
    }

    // Verify notification belongs to user
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', profile.id)
      .single();

    if (fetchError || !notification) {
      return error('Notification not found', 404);
    }

    // Mark as read
    const { data: updated, error: updateError } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', params.id)
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
