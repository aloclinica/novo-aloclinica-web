import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { success, error } from '@/lib/utils/api-response';
import { SLOT_DURATION_MINUTES, CONSULTATION_TIMEOUT_MINUTES } from '@/lib/utils/constants';

/**
 * Get doctor availability slots
 * GET /api/doctors/[id]/availability?date=2026-04-15
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return error('date query parameter is required', 400);
    }

    // Validate date format
    const requestedDate = new Date(dateParam);
    if (isNaN(requestedDate.getTime())) {
      return error('Invalid date format', 400);
    }

    // Date must be in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (requestedDate < today) {
      return error('Date must be in the future', 400);
    }

    const supabase = createServerClient();

    // Verify doctor exists
    const { data: doctor, error: doctorError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', params.id)
      .eq('role', 'doctor')
      .single();

    if (doctorError || !doctor) {
      return error('Doctor not found', 404);
    }

    // Get doctor's availability schedule for that day of week
    const dayOfWeek = requestedDate.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    const { data: availability } = await supabase
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', params.id)
      .eq('day_of_week', dayName)
      .single();

    if (!availability || !availability.is_available) {
      return success({ slots: [] }, 200);
    }

    // Get existing consultations for that day
    const dateStart = new Date(dateParam);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(dateParam);
    dateEnd.setHours(23, 59, 59, 999);

    const { data: consultations } = await supabase
      .from('consultations')
      .select('*')
      .eq('doctor_id', params.id)
      .gte('scheduled_at', dateStart.toISOString())
      .lt('scheduled_at', dateEnd.toISOString())
      .in('status', ['scheduled', 'in_progress']);

    // Generate available slots
    const slots = [];
    const startHour = parseInt(availability.start_time.split(':')[0]);
    const startMin = parseInt(availability.start_time.split(':')[1]);
    const endHour = parseInt(availability.end_time.split(':')[0]);
    const endMin = parseInt(availability.end_time.split(':')[1]);

    let currentTime = new Date(dateParam);
    currentTime.setHours(startHour, startMin, 0, 0);

    const endTime = new Date(dateParam);
    endTime.setHours(endHour, endMin, 0, 0);

    // Check if slot is in the past (for today)
    const now = new Date();
    const isTodayDate = dateStart.toDateString() === now.toDateString();

    while (currentTime < endTime) {
      // Skip if slot is in the past
      if (isTodayDate && currentTime <= now) {
        currentTime.setMinutes(currentTime.getMinutes() + SLOT_DURATION_MINUTES);
        continue;
      }

      // Check if slot is booked
      const slotStart = currentTime.getTime();
      const slotEnd = slotStart + SLOT_DURATION_MINUTES * 60 * 1000;

      const isBooked = consultations?.some((consultation) => {
        const consultStart = new Date(consultation.scheduled_at).getTime();
        const consultEnd = consultStart + CONSULTATION_TIMEOUT_MINUTES * 60 * 1000;

        // Check for overlap
        return slotStart < consultEnd && slotEnd > consultStart;
      });

      if (!isBooked) {
        slots.push({
          time: currentTime.toISOString(),
          available: true,
        });
      }

      currentTime.setMinutes(currentTime.getMinutes() + SLOT_DURATION_MINUTES);
    }

    return success({ slots, date: dateParam }, 200);
  } catch (err) {
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}
