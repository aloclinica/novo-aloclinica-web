import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile, isAdmin } from '@/lib/utils/auth-guard';
import { success, error, paginate } from '@/lib/utils/api-response';

/**
 * List all consultations (admin only)
 * GET /api/admin/consultations?page=1&limit=20&status=completed&doctor_id=xxx
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
    const statusFilter = searchParams.get('status');
    const doctorIdFilter = searchParams.get('doctor_id');
    const patientIdFilter = searchParams.get('patient_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const offset = (page - 1) * limit;

    // Build count query
    let countQuery = supabase.from('consultations').select('*', { count: 'exact', head: true });

    if (statusFilter) {
      countQuery = countQuery.eq('status', statusFilter);
    }
    if (doctorIdFilter) {
      countQuery = countQuery.eq('doctor_id', doctorIdFilter);
    }
    if (patientIdFilter) {
      countQuery = countQuery.eq('patient_id', patientIdFilter);
    }
    if (startDate) {
      countQuery = countQuery.gte('scheduled_at', startDate);
    }
    if (endDate) {
      countQuery = countQuery.lte('scheduled_at', endDate);
    }

    const { count } = await countQuery;

    // Build data query
    let dataQuery = supabase
      .from('consultations')
      .select(
        `
        *,
        doctor:doctor_id (id, full_name, avatar_url),
        patient:patient_id (id, full_name, phone),
        payments (id, status, amount_cents, method)
      `,
      )
      .order('scheduled_at', { ascending: false });

    if (statusFilter) {
      dataQuery = dataQuery.eq('status', statusFilter);
    }
    if (doctorIdFilter) {
      dataQuery = dataQuery.eq('doctor_id', doctorIdFilter);
    }
    if (patientIdFilter) {
      dataQuery = dataQuery.eq('patient_id', patientIdFilter);
    }
    if (startDate) {
      dataQuery = dataQuery.gte('scheduled_at', startDate);
    }
    if (endDate) {
      dataQuery = dataQuery.lte('scheduled_at', endDate);
    }

    const { data: consultations, error: queryError } = await dataQuery.range(offset, offset + limit - 1);

    if (queryError) {
      return error(queryError.message, 400);
    }

    return success(paginate(consultations, count || 0, page, limit), 200);
  } catch (err) {
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}
