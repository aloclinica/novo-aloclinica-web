import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SignupPatientSchema, SignupDoctorSchema } from '@/lib/validations/auth';
import { success, error } from '@/lib/utils/api-response';
import { UserRole } from '@/types/database.types';

/**
 * User signup endpoint
 * POST /api/auth/signup
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    let validatedData;
    if (body.role === 'patient') {
      validatedData = SignupPatientSchema.parse(body);
    } else if (body.role === 'doctor') {
      validatedData = SignupDoctorSchema.parse(body);
    } else {
      return error('Invalid role', 400);
    }

    const supabase = createServerClient();
    const adminClient = createAdminClient();

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (authError || !authData.user) {
      return error(authError?.message || 'Failed to create user', 400);
    }

    // Create profile
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: authData.user.id,
        role: validatedData.role,
        full_name: validatedData.full_name,
        cpf: validatedData.cpf,
        phone: validatedData.phone,
        birth_date: validatedData.birth_date,
        kyc_level: 0,
        kyc_status: 'pending',
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      // Clean up auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return error('Failed to create profile', 400);
    }

    // Create doctor record if applicable
    if (validatedData.role === 'doctor' && 'crm' in validatedData) {
      const { error: doctorError } = await adminClient
        .from('doctors')
        .insert({
          id: authData.user.id,
          crm: validatedData.crm,
          crm_state: validatedData.crm_state,
          consultation_price_cents: 15000, // Default price R$ 150
          is_available: false,
        });

      if (doctorError) {
        return error('Failed to create doctor profile', 400);
      }
    }

    // TODO: Send confirmation email via Brevo

    return success(
      {
        id: authData.user.id,
        email: authData.user.email,
        role: profile.role,
        profile,
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
