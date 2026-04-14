import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile, isAdmin } from '@/lib/utils/auth-guard';
import { success, error } from '@/lib/utils/api-response';

/**
 * Get admin dashboard KPIs and stats
 * GET /api/admin/dashboard
 */
export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const isAdminUser = await isAdmin(request);

  if (!isAdminUser) {
    return error('Admin access required', 403);
  }

  try {
    const supabase = createServerClient();
    const profile = await getUserProfile(request);

    if (!profile) {
      return error('Profile not found', 404);
    }

    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get total doctors
    const { count: totalDoctors } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'doctor');

    // Get total patients
    const { count: totalPatients } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'patient');

    // Get total consultations
    const { count: totalConsultations } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true });

    // Get completed consultations (this month)
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count: completedThisMonth } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', monthStart.toISOString());

    // Get total revenue
    const { data: paidPayments } = await supabase
      .from('payments')
      .select('amount_cents')
      .eq('status', 'paid');

    const totalRevenue = (paidPayments || []).reduce((sum, p) => sum + (p.amount_cents || 0), 0);

    // Get KYC pending count
    const { count: kycPending } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('kyc_status', 'in_review');

    // Get active doctors (with consultations this month)
    const { data: activeDoctorsData } = await supabase
      .from('consultations')
      .select('doctor_id', { count: 'exact' })
      .gte('created_at', monthStart.toISOString());

    const activeDoctors = new Set(activeDoctorsData?.map((c: any) => c.doctor_id) || []).size;

    // Get average consultation duration
    const { data: completedConsultations } = await supabase
      .from('consultations')
      .select('duration_minutes')
      .eq('status', 'completed')
      .not('duration_minutes', 'is', null);

    const avgDuration =
      completedConsultations && completedConsultations.length > 0
        ? Math.round(
            completedConsultations.reduce((sum: number, c: any) => sum + (c.duration_minutes || 0), 0) /
              completedConsultations.length,
          )
        : 0;

    // Get consultation trends (last 7 days)
    const trends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const { count: dayCount } = await supabase
        .from('consultations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString());

      trends.push({
        date: date.toISOString().split('T')[0],
        count: dayCount || 0,
      });
    }

    return success(
      {
        kpis: {
          totalUsers,
          totalDoctors,
          totalPatients,
          totalConsultations,
          completedThisMonth,
          totalRevenue: totalRevenue / 100, // Convert cents to reais
          kycPending,
          activeDoctors,
          avgDuration,
        },
        trends,
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
