import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, getUserProfile } from '@/lib/utils/auth-guard';
import { success, error } from '@/lib/utils/api-response';

/**
 * Upload KYC documents
 * POST /api/profiles/kyc
 */
export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const document = formData.get('document') as File;
    const selfie = formData.get('selfie') as File;

    if (!document || !selfie) {
      return error('Document and selfie files are required', 400);
    }

    // Validate file sizes (5MB max each)
    const maxFileSize = 5 * 1024 * 1024;
    if (document.size > maxFileSize || selfie.size > maxFileSize) {
      return error('Files must be smaller than 5MB', 400);
    }

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(document.type) || !allowedTypes.includes(selfie.type)) {
      return error('Only JPEG, PNG, or PDF files are allowed', 400);
    }

    const supabase = createServerClient();
    const profile = await getUserProfile(request);

    if (!profile) {
      return error('Profile not found', 404);
    }

    // Upload files to Supabase Storage
    const adminClient = createAdminClient();
    const timestamp = Date.now();

    const documentFileName = `${profile.id}/document-${timestamp}`;
    const selfieFileName = `${profile.id}/selfie-${timestamp}`;

    const [docUpload, selfieUpload] = await Promise.all([
      adminClient.storage.from('kyc-documents').upload(documentFileName, document),
      adminClient.storage.from('kyc-documents').upload(selfieFileName, selfie),
    ]);

    if (docUpload.error || selfieUpload.error) {
      return error('Failed to upload files', 500);
    }

    // Update profile with KYC status
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({
        kyc_status: 'in_review',
        kyc_document_url: `kyc-documents/${documentFileName}`,
        kyc_selfie_url: `kyc-documents/${selfieFileName}`,
        kyc_submitted_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (updateError) {
      return error(updateError.message, 400);
    }

    // TODO: Trigger Unico Check KYC process
    // TODO: Send email confirmation to user

    return success(
      {
        message: 'KYC documents submitted for review',
        kyc_status: 'in_review',
      },
      201,
    );
  } catch (err) {
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}
