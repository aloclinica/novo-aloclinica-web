import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth, getUserProfile, isPatient } from '@/lib/utils/auth-guard';
import { CreatePaymentSchema } from '@/lib/validations/payment';
import { success, error } from '@/lib/utils/api-response';
import { createPixPayment, createCreditCardPayment } from '@/lib/services/payment';

/**
 * Create payment for consultation
 * POST /api/payments
 */
export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const isPatientUser = await isPatient(request);

  if (!isPatientUser) {
    return error('Only patients can create payments', 403);
  }

  try {
    const body = await request.json();

    // Validate request
    const validatedData = CreatePaymentSchema.parse(body);

    const supabase = createServerClient();
    const profile = await getUserProfile(request);

    if (!profile) {
      return error('Profile not found', 404);
    }

    // Verify consultation exists and belongs to patient
    const { data: consultation, error: consultError } = await supabase
      .from('consultations')
      .select('*')
      .eq('id', validatedData.consultation_id)
      .eq('patient_id', profile.id)
      .single();

    if (consultError || !consultation) {
      return error('Consultation not found', 404);
    }

    let paymentGatewayResponse;

    if (validatedData.method === 'pix') {
      // Create PIX payment via Asaas
      paymentGatewayResponse = await createPixPayment({
        customer_id: profile.id, // In real scenario, map patient to Asaas customer ID
        amount: consultation.price_cents / 100,
        description: `Consulta - ${consultation.id}`,
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    } else if (validatedData.method === 'credit_card') {
      // Create credit card payment via Asaas
      paymentGatewayResponse = await createCreditCardPayment({
        customer_id: profile.id,
        amount: consultation.price_cents / 100,
        card_name: validatedData.card_name!,
        card_number: validatedData.card_number!,
        card_expiry_month: validatedData.card_expiry_month!,
        card_expiry_year: validatedData.card_expiry_year!,
        card_ccv: validatedData.card_ccv!,
        description: `Consulta - ${consultation.id}`,
        due_date: new Date().toISOString().split('T')[0],
      });
    }

    if (!paymentGatewayResponse) {
      return error('Failed to create payment', 400);
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        consultation_id: validatedData.consultation_id,
        patient_id: profile.id,
        amount_cents: consultation.price_cents,
        method: validatedData.method,
        gateway: 'asaas',
        gateway_id: paymentGatewayResponse.id,
        status: 'pending',
        pix_qr_code: paymentGatewayResponse.pix_qr_code,
        pix_expires_at: paymentGatewayResponse.expires_at,
      })
      .select()
      .single();

    if (paymentError) {
      return error(paymentError.message, 400);
    }

    // TODO: Send payment confirmation email

    return success(payment, 201);
  } catch (err) {
    if (err instanceof Error) {
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}
