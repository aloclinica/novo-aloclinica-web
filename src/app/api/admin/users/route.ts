import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile, isAdmin } from '@/lib/utils/auth-guard';
import { success, error, paginate } from '@/lib/utils/api-response';

/**
 * List all users (admin only)
 * GET /api/admin/users?page=1&limit=20&role=doctor&kyc_status=approved
 */
export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const isAdminUser = await isAdmin(request);

  if (!isAdminUser) {
    return error('Admin access required', 403);
  }

  try {
    const supabase = createServerClient();
    const profile = await getUserProfile(request);

    if (!profile) {
      return error('Profile not found', 404);
    }

    const searchParams = new URL(request.url).searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const roleFilter = searchParams.get('role');
    const kycStatusFilter = searchParams.get('kyc_status');
    const searchQuery = searchParams.get('search');

    const offset = (page - 1) * limit;

    // Build count query
    let countQuery = supabase.from('profiles').select('*', { count: 'exact', head: true });

    if (roleFilter) {
      countQuery = countQuery.eq('role', roleFilter);
    }
    if (kycStatusFilter) {
      countQuery = countQuery.eq('kyc_status', kycStatusFilter);
    }
    if (searchQuery) {
      countQuery = countQuery.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    const { count } = await countQuery;

    // Build data query
    let dataQuery = supabase
      .from('profiles')
      .select(
        `
        id,
        email,
        full_name,
        role,
        avatar_url,
        phone,
        kyc_status,
        created_at,
        updated_at,
        doctors (id, crm, specialization)
      `,
      )
      .order('created_at', { ascending: false });

    if (roleFilter) {
      dataQuery = dataQuery.eq('role', roleFilter);
    }
    if (kycStatusFilter) {
      dataQuery = dataQuery.eq('kyc_status', kycStatusFilter);
    }
    if (searchQuery) {
      dataQuery = dataQuery.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    const { data: users, error: queryError } = await dataQuery.range(offset, offset + limit - 1);

    if (queryError) {
      return error(queryError.message, 400);
    }

    return success(paginate(users, count || 0, page, limit), 200);
  } catch (err) {
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}
