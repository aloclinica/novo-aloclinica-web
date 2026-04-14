import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile, isDoctor } from '@/lib/utils/auth-guard';
import { success, error } from '@/lib/utils/api-response';
import { z } from 'zod';

/**
 * Set doctor availability schedule
 * PUT /api/doctors/[id]/availability
 */

const AvailabilitySchema = z.object({
  day_of_week: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  is_available: z.boolean(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
});

type AvailabilityInput = z.infer<typeof AvailabilitySchema>;

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const isDoctorUser = await isDoctor(request);

  if (!isDoctorUser) {
    return error('Only doctors can set availability', 403);
  }

  try {
    const body = await request.json();
    const profile = await getUserProfile(request);

    if (!profile) {
      return error('Profile not found', 404);
    }

    // Only doctors can set their own availability
    if (params.id !== profile.id) {
      return error('Forbidden', 403);
    }

    // Validate input
    const validatedData = AvailabilitySchema.parse(body);

    // Validate time format
    const [startHour, startMin] = validatedData.start_time.split(':').map(Number);
    const [endHour, endMin] = validatedData.end_time.split(':').map(Number);

    if (startHour < 0 || startHour > 23 || startMin < 0 || startMin > 59) {
      return error('Invalid start time', 400);
    }

    if (endHour < 0 || endHour > 23 || endMin < 0 || endMin > 59) {
      return error('Invalid end time', 400);
    }

    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;

    if (startTotalMin >= endTotalMin) {
      return error('End time must be after start time', 400);
    }

    const supabase = createServerClient();

    // Upsert availability record
    const { data: availability, error: upsertError } = await supabase
      .from('doctor_availability')
      .upsert({
        doctor_id: profile.id,
        day_of_week: validatedData.day_of_week,
        is_available: validatedData.is_available,
        start_time: validatedData.start_time,
        end_time: validatedData.end_time,
      })
      .eq('doctor_id', profile.id)
      .eq('day_of_week', validatedData.day_of_week)
      .select()
      .single();

    if (upsertError) {
      return error(upsertError.message, 400);
    }

    return success(availability, 200);
  } catch (err) {
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}
