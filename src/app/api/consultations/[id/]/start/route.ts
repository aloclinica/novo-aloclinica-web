import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile, isDoctor } from '@/lib/utils/auth-guard';
import { success, error } from '@/lib/utils/api-response';
import { createRoom, createMeetingToken } from '@/lib/services/video';

/**
 * Start consultation (doctor initiates room)
 * POST /api/consultations/[id]/start
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const isDoctorUser = await isDoctor(request);

  if (!isDoctorUser) {
    return error('Only doctors can start consultations', 403);
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

    // Verify doctor is the one starting
    if (consultation.doctor_id !== profile.id) {
      return error('Forbidden', 403);
    }

    // Create video room
    const room = await createRoom({ consultation_id: params.id });

    if (!room) {
      return error('Failed to create video room', 500);
    }

    // Create access token for doctor
    const token = await createMeetingToken({
      room_name: room.name,
      user_id: profile.id,
      user_name: profile.full_name,
      is_owner: true,
    });

    if (!token) {
      return error('Failed to create access token', 500);
    }

    // Update consultation with room info
    const { data: updated, error: updateError } = await supabase
      .from('consultations')
      .update({
        status: 'in_progress',
        room_url: room.url,
        room_token: token.token,
        started_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      return error(updateError.message, 400);
    }

    // TODO: Send notification to patient

    return success(
      {
        room_url: room.url,
        room_token: token.token,
        consultation: updated,
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
