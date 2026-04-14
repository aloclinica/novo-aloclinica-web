import { NextRequest } from 'next/server';
import { success } from '@/lib/utils/api-response';

/**
 * Health check endpoint
 * GET /api/health
 */
export async function GET(request: NextRequest) {
  return success(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
    },
    200,
  );
}
