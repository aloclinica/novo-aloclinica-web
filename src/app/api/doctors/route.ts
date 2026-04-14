import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { success, error, paginate } from '@/lib/utils/api-response';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/utils/constants';

/**
 * List doctors (public, filtered)
 * GET /api/doctors?specialty_id=...&min_price=...&max_price=...&page=1&limit=20
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE)), MAX_PAGE_SIZE);
    const specialtyId = searchParams.get('specialty_id');
    const minPrice = searchParams.get('min_price') ? parseInt(searchParams.get('min_price')!) : null;
    const maxPrice = searchParams.get('max_price') ? parseInt(searchParams.get('max_price')!) : null;
    const minRating = searchParams.get('min_rating') ? parseFloat(searchParams.get('min_rating')!) : null;

    // Build query
    let query = supabase
      .from('doctors')
      .select(
        `
        *,
        profile:id (
          id,
          full_name,
          avatar_url,
          created_at
        )
      `,
        { count: 'exact' },
      )
      .eq('is_available', true);

    if (specialtyId) {
      query = query.contains('specialties', [specialtyId]);
    }

    if (minPrice !== null) {
      query = query.gte('consultation_price_cents', minPrice);
    }

    if (maxPrice !== null) {
      query = query.lte('consultation_price_cents', maxPrice);
    }

    if (minRating !== null) {
      query = query.gte('avg_rating', minRating);
    }

    const { data: doctors, count, error: queryError } = await query;

    if (queryError) {
      return error(queryError.message, 400);
    }

    const { data: paginatedDoctors, pagination } = paginate(doctors || [], page, limit, count || 0);

    return success(paginatedDoctors, 200, pagination);
  } catch (err) {
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}
