import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { success, error } from '@/lib/utils/api-response';

/**
 * Get doctor profile (public)
 * GET /api/doctors/[id]
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient();

    const { data: doctor, error: docError } = await supabase
      .from('doctors')
      .select(
        `
        *,
        profile:id (
          id,
          full_name,
          avatar_url,
          created_at
        ),
        reviews (
          id,
          rating,
          comment,
          created_at
        )
      `,
      )
      .eq('id', params.id)
      .single();

    if (docError) {
      return error('Doctor not found', 404);
    }

    return success(doctor, 200);
  } catch (err) {
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}
