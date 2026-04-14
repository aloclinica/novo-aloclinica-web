import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile, isDoctor } from '@/lib/utils/auth-guard';
import { success, error } from '@/lib/utils/api-response';

/**
 * End consultation (doctor ends the room)
 * POST /api/consultations/[id]/end
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const isDoctorUser = await isDoctor(request);

  if (!isDoctorUser) {
    return error('Only doctors can end consultations', 403);
  }

  try {
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

    // Verify doctor is the one ending
    if (consultation.doctor_id !== profile.id) {
      return error('Forbidden', 403);
    }

    // Verify consultation is in progress
    if (consultation.status !== 'in_progress') {
      return error('Consultation is not in progress', 400);
    }

    // Calculate duration in minutes
    const startedAt = new Date(consultation.started_at).getTime();
    const endedAt = new Date().getTime();
    const durationMinutes = Math.floor((endedAt - startedAt) / 1000 / 60);

    // Update consultation with end time
    const { data: updated, error: updateError } = await supabase
      .from('consultations')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        duration_minutes: durationMinutes,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      return error(updateError.message, 400);
    }

    // TODO: Process split payment to doctor
    // TODO: Delete video room from Daily.co
    // TODO: Send consultation completion email to both parties

    return success(
      {
        consultation: updated,
        duration_minutes: durationMinutes,
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
