import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, getUserProfile, isAdmin } from '@/lib/utils/auth-guard';
import { success, error } from '@/lib/utils/api-response';
import { z } from 'zod';

/**
 * Approve or reject KYC
 * POST /api/admin/users/[id]/kyc
 */

const KYCDecisionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejection_reason: z.string().optional(),
});

type KYCDecisionInput = z.infer<typeof KYCDecisionSchema>;

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const isAdminUser = await isAdmin(request);

  if (!isAdminUser) {
    return error('Admin access required', 403);
  }

  try {
    const body = await request.json();
    const validatedData = KYCDecisionSchema.parse(body);

    if (validatedData.status === 'rejected' && !validatedData.rejection_reason) {
      return error('Rejection reason is required', 400);
    }

    const supabase = createServerClient();
    const profile = await getUserProfile(request);

    if (!profile) {
      return error('Profile not found', 404);
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', params.id)
      .single();

    if (userError || !user) {
      return error('User not found', 404);
    }

    // Update KYC status
    const kycStatus = validatedData.status === 'approved' ? 'approved' : 'rejected';

    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({
        kyc_status: kycStatus,
        kyc_reviewed_at: new Date().toISOString(),
        kyc_reviewed_by: profile.id,
        kyc_rejection_reason: validatedData.rejection_reason || null,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      return error(updateError.message, 400);
    }

    // Create audit log
    const adminClient = createAdminClient();
    await adminClient.from('audit_logs').insert({
      user_id: profile.id,
      action: `KYC_${validatedData.status.toUpperCase()}`,
      table_name: 'profiles',
      row_id: params.id,
      old_values: { kyc_status: user.kyc_status },
      new_values: { kyc_status: kycStatus },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    });

    // TODO: Send KYC approval/rejection email to user
    // TODO: If approved and doctor, enable booking

    return success(
      {
        message: `KYC ${validatedData.status}`,
        user: updated,
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
