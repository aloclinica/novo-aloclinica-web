import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile, isDoctor } from '@/lib/utils/auth-guard';
import { success, error } from '@/lib/utils/api-response';
import { CreateMedicalRecordSchema } from '@/lib/validations/medical';

/**
 * Create medical record for consultation
 * POST /api/consultations/[id]/medical-record
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const isDoctorUser = await isDoctor(request);

  if (!isDoctorUser) {
    return error('Only doctors can create medical records', 403);
  }

  try {
    const body = await request.json();

    // Validate schema
    const validatedData = CreateMedicalRecordSchema.parse(body);

    const supabase = createServerClient();
    const profile = await getUserProfile(request);

    if (!profile) {
      return error('Profile not found', 404);
    }

    // Verify consultation exists and doctor is the one who attended
    const { data: consultation, error: consultError } = await supabase
      .from('consultations')
      .select('*')
      .eq('id', params.id)
      .eq('doctor_id', profile.id)
      .single();

    if (consultError || !consultation) {
      return error('Consultation not found or access denied', 404);
    }

    // Verify consultation is completed
    if (consultation.status !== 'completed') {
      return error('Medical records can only be created for completed consultations', 400);
    }

    // Create medical record
    const { data: record, error: recordError } = await supabase
      .from('medical_records')
      .insert({
        consultation_id: params.id,
        doctor_id: profile.id,
        patient_id: consultation.patient_id,
        chief_complaint: validatedData.chief_complaint,
        history_of_present_illness: validatedData.history_of_present_illness,
        past_medical_history: validatedData.past_medical_history,
        medications: validatedData.medications,
        allergies: validatedData.allergies,
        physical_examination: validatedData.physical_examination,
        assessment: validatedData.assessment,
        plan: validatedData.plan,
      })
      .select()
      .single();

    if (recordError) {
      return error(recordError.message, 400);
    }

    // TODO: Send medical record notification to patient
    // TODO: Archive record for LGPD compliance

    return success(record, 201);
  } catch (err) {
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}
