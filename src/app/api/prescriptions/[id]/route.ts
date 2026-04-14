import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, getUserProfile } from '@/lib/utils/auth-guard';
import { success, error } from '@/lib/utils/api-response';

/**
 * Get prescription details with signed URL for PDF
 * GET /api/prescriptions/[id]
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

    // Fetch prescription
    const { data: prescription, error: queryError } = await supabase
      .from('prescriptions')
      .select(
        `
        *,
        doctor:doctor_id (id, full_name, avatar_url),
        consultation:consultation_id (id, scheduled_at),
        patient:patient_id (id, full_name, date_of_birth)
      `,
      )
      .eq('id', params.id)
      .single();

    if (queryError || !prescription) {
      return error('Prescription not found', 404);
    }

    // Check access (patient or doctor)
    if (profile.role !== 'admin' && prescription.patient_id !== profile.id && prescription.doctor_id !== profile.id) {
      return error('Forbidden', 403);
    }

    // Get signed URL for PDF if exists
    let pdfUrl = null;
    if (prescription.pdf_url) {
      const adminClient = createAdminClient();
      try {
        const { data } = await adminClient.storage
          .from('prescriptions')
          .createSignedUrl(prescription.pdf_url, 3600); // 1 hour expiration

        pdfUrl = data?.signedUrl;
      } catch (err) {
        console.error('[Prescription] Error generating signed URL:', err);
      }
    }

    return success(
      {
        ...prescription,
        pdf_signed_url: pdfUrl,
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
