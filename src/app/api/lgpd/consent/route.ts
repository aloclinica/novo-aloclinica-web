import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile } from '@/lib/utils/auth-guard';
import { success, error } from '@/lib/utils/api-response';
import { z } from 'zod';

/**
 * Register LGPD consent
 * POST /api/lgpd/consent
 */

const ConsentSchema = z.object({
  consent_type: z.enum(['data_processing', 'marketing', 'third_party', 'analytics']),
  given: z.boolean(),
});

type ConsentInput = z.infer<typeof ConsentSchema>;

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const validatedData = ConsentSchema.parse(body);

    const supabase = createServerClient();
    const profile = await getUserProfile(request);

    if (!profile) {
      return error('Profile not found', 404);
    }

    // Get client IP and user agent
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-client-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create consent record
    const { data: consent, error: consentError } = await supabase
      .from('lgpd_consents')
      .insert({
        user_id: profile.id,
        consent_type: validatedData.consent_type,
        given: validatedData.given,
        ip_address: clientIp,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (consentError) {
      return error(consentError.message, 400);
    }

    // TODO: Send consent confirmation email

    return success(consent, 201);
  } catch (err) {
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}
