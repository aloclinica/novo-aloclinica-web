import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile, isDoctor } from '@/lib/utils/auth-guard';
import { success, error, paginate } from '@/lib/utils/api-response';
import { CreatePrescriptionSchema } from '@/lib/validations/medical';

/**
 * Create prescription or list prescriptions
 * POST /api/prescriptions - Create new prescription
 * GET /api/prescriptions - List patient's prescriptions
 */

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const isDoctorUser = await isDoctor(request);

  if (!isDoctorUser) {
    return error('Only doctors can create prescriptions', 403);
  }

  try {
    const body = await request.json();

    // Validate schema
    const validatedData = CreatePrescriptionSchema.parse(body);

    const supabase = createServerClient();
    const profile = await getUserProfile(request);

    if (!profile) {
      return error('Profile not found', 404);
    }

    // Verify consultation exists
    const { data: consultation, error: consultError } = await supabase
      .from('consultations')
      .select('*')
      .eq('id', validatedData.consultation_id)
      .eq('doctor_id', profile.id)
      .single();

    if (consultError || !consultation) {
      return error('Consultation not found', 404);
    }

    // Create prescription
    const { data: prescription, error: prescriptionError } = await supabase
      .from('prescriptions')
      .insert({
        consultation_id: validatedData.consultation_id,
        doctor_id: profile.id,
        patient_id: consultation.patient_id,
        medications: validatedData.medications,
        instructions: validatedData.instructions,
        valid_days: validatedData.valid_days || 30,
      })
      .select()
      .single();

    if (prescriptionError) {
      return error(prescriptionError.message, 400);
    }

    // TODO: Generate PDF via puppeteer/pdfkit
    // TODO: Upload PDF to Supabase Storage
    // TODO: Send prescription email to patient

    return success(prescription, 201);
  } catch (err) {
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}

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
    const limit = parseInt(searchParams.get('limit') || '10');

    const offset = (page - 1) * limit;

    // Get total count
    const { count } = await supabase
      .from('prescriptions')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', profile.id);

    // Get paginated results
    const { data: prescriptions, error: queryError } = await supabase
      .from('prescriptions')
      .select(
        `
        *,
        doctor:doctor_id (id, full_name, avatar_url),
        consultation:consultation_id (id, scheduled_at)
      `,
      )
      .eq('patient_id', profile.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (queryError) {
      return error(queryError.message, 400);
    }

    return success(paginate(prescriptions, count || 0, page, limit), 200);
  } catch (err) {
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}
