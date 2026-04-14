import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile } from '@/lib/utils/auth-guard';
import { success, error } from '@/lib/utils/api-response';

/**
 * Get consultation details
 * GET /api/consultations/[id]
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const supabase = createServerClient();
    const profile = await getUserProfile(request);

    if (!profile) {
      return error('Profile not found', 404);
    }

    const { data: consultation, error: queryError } = await supabase
      .from('consultations')
      .select(
        `
        *,
        doctor:doctor_id (
          *,
          profile:id (id, full_name, avatar_url)
        ),
        patient:patient_id (id, full_name, phone)
      `,
      )
      .eq('id', params.id)
      .single();

    if (queryError) {
      return error('Consultation not found', 404);
    }

    // Check access (must be patient or doctor involved)
    if (
      profile.role !== 'admin' &&
      consultation.patient_id !== profile.id &&
      consultation.doctor_id !== profile.id
    ) {
      return error('Forbidden', 403);
    }

    return success(consultation, 200);
  } catch (err) {
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}

/**
 * Update consultation (cancel, confirm, etc)
 * PATCH /api/consultations/[id]
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const supabase = createServerClient();
    const profile = await getUserProfile(request);

    if (!profile) {
      return error('Profile not found', 404);
    }

    const { data: consultation, error: fetchError } = await supabase
      .from('consultations')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !consultation) {
      return error('Consultation not found', 404);
    }

    // Check access
    if (profile.role !== 'admin' && consultation.patient_id !== profile.id && consultation.doctor_id !== profile.id) {
      return error('Forbidden', 403);
    }

    // Only allow certain status updates
    const allowedUpdates = ['cancelled_patient', 'cancelled_doctor'];

    if (body.status && !allowedUpdates.includes(body.status)) {
      return error('Invalid status update', 400);
    }

    const { data: updated, error: updateError } = await supabase
      .from('consultations')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      return error(updateError.message, 400);
    }

    // TODO: Send cancellation email
    // TODO: Process refund if applicable

    return success(updated, 200);
  } catch (err) {
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}
