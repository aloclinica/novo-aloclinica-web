import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile } from '@/lib/utils/auth-guard';
import { CreateConsultationSchema } from '@/lib/validations/consultation';
import { success, error, paginate } from '@/lib/utils/api-response';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/utils/constants';

/**
 * List user's consultations (paginated)
 * GET /api/consultations?status=...&page=1&limit=20
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

    // Query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE)), MAX_PAGE_SIZE);
    const status = searchParams.get('status');

    // Build query
    let query = supabase.from('consultations').select(
      `
        *,
        doctor:doctor_id (
          *,
          profile:id (id, full_name, avatar_url)
        ),
        patient:patient_id (id, full_name)
      `,
      { count: 'exact' },
    );

    // Filter by user (patient or doctor depending on role)
    if (profile.role === 'patient') {
      query = query.eq('patient_id', profile.id);
    } else if (profile.role === 'doctor') {
      query = query.eq('doctor_id', profile.id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('scheduled_at', { ascending: false });

    const { data: consultations, count, error: queryError } = await query;

    if (queryError) {
      return error(queryError.message, 400);
    }

    const { data: paginatedConsultations, pagination } = paginate(
      consultations || [],
      page,
      limit,
      count || 0,
    );

    return success(paginatedConsultations, 200, pagination);
  } catch (err) {
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}

/**
 * Create new consultation
 * POST /api/consultations
 */
export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();

    // Validate request
    const validatedData = CreateConsultationSchema.parse(body);

    const supabase = createServerClient();
    const profile = await getUserProfile(request);

    if (!profile || profile.role !== 'patient') {
      return error('Only patients can create consultations', 403);
    }

    // Check doctor availability
    const { data: doctor, error: docError } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', validatedData.doctor_id)
      .single();

    if (docError || !doctor) {
      return error('Doctor not found', 404);
    }

    // TODO: Verify availability slot is free

    // Create consultation
    const { data: consultation, error: consultError } = await supabase
      .from('consultations')
      .insert({
        patient_id: profile.id,
        doctor_id: validatedData.doctor_id,
        scheduled_at: validatedData.scheduled_at,
        type: validatedData.type,
        chief_complaint: validatedData.chief_complaint,
        price_cents: doctor.consultation_price_cents,
        status: 'scheduled',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (consultError) {
      return error(consultError.message, 400);
    }

    // TODO: Create payment record
    // TODO: Send confirmation email

    return success(consultation, 201);
  } catch (err) {
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}
