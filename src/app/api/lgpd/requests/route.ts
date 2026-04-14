import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile } from '@/lib/utils/auth-guard';
import { success, error, paginate } from '@/lib/utils/api-response';
import { z } from 'zod';

/**
 * Create or list LGPD requests
 * POST /api/lgpd/requests - Create new request
 * GET /api/lgpd/requests - List user's requests
 */

const CreateLGPDRequestSchema = z.object({
  request_type: z.enum(['access', 'deletion', 'correction', 'portability']),
  description: z.string().optional(),
});

type CreateLGPDRequestInput = z.infer<typeof CreateLGPDRequestSchema>;

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const validatedData = CreateLGPDRequestSchema.parse(body);

    const supabase = createServerClient();
    const profile = await getUserProfile(request);

    if (!profile) {
      return error('Profile not found', 404);
    }

    // Calculate due date (15 business days from now)
    const dueDate = new Date();
    let businessDays = 0;
    while (businessDays < 15) {
      dueDate.setDate(dueDate.getDate() + 1);
      // Skip weekends
      if (dueDate.getDay() !== 0 && dueDate.getDay() !== 6) {
        businessDays++;
      }
    }

    // Create LGPD request
    const { data: lgpdRequest, error: requestError } = await supabase
      .from('lgpd_requests')
      .insert({
        user_id: profile.id,
        request_type: validatedData.request_type,
        description: validatedData.description,
        status: 'pending',
        due_at: dueDate.toISOString(),
      })
      .select()
      .single();

    if (requestError) {
      return error(requestError.message, 400);
    }

    // TODO: Send request confirmation email
    // TODO: Create audit log for compliance

    return success(lgpdRequest, 201);
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
      .from('lgpd_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id);

    // Get paginated results
    const { data: lgpdRequests, error: queryError } = await supabase
      .from('lgpd_requests')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (queryError) {
      return error(queryError.message, 400);
    }

    return success(paginate(lgpdRequests, count || 0, page, limit), 200);
  } catch (err) {
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}
