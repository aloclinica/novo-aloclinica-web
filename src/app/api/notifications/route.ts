import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile } from '@/lib/utils/auth-guard';
import { success, error, paginate } from '@/lib/utils/api-response';

/**
 * List user's notifications
 * GET /api/notifications?page=1&limit=20&read=false
 */
export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const supabase = createServerClient();
    const profile = await getUserProfile(request);

    if (!profile) {
      return error('Profile not found', 404);
    }

    const searchParams = new URL(request.url).searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const readFilter = searchParams.get('read');

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id);

    if (readFilter !== null) {
      const isRead = readFilter === 'true';
      query = query.eq('is_read', isRead);
    }

    // Get total count
    const { count } = await query;

    // Get paginated results
    let dataQuery = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (readFilter !== null) {
      const isRead = readFilter === 'true';
      dataQuery = dataQuery.eq('is_read', isRead);
    }

    const { data: notifications, error: queryError } = await dataQuery.range(offset, offset + limit - 1);

    if (queryError) {
      return error(queryError.message, 400);
    }

    return success(paginate(notifications, count || 0, page, limit), 200);
  } catch (err) {
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}
