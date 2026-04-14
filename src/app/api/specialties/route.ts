import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { success, error } from '@/lib/utils/api-response';

/**
 * List all specialties
 * GET /api/specialties
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const { data: specialties, error: queryError } = await supabase
      .from('specialties')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (queryError) {
      return error(queryError.message, 400);
    }

    return success(specialties || [], 200);
  } catch (err) {
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}
