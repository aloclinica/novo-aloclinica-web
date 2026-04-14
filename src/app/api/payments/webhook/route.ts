import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { success, error } from '@/lib/utils/api-response';
import { verifyWebhookSignature } from '@/lib/services/payment';
import { AsaasWebhookSchema } from '@/lib/validations/payment';

/**
 * Asaas payment webhook
 * POST /api/payments/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('asaas-signature');

    if (!signature) {
      return error('Missing signature', 401);
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      return error('Invalid signature', 401);
    }

    const payload = JSON.parse(body);

    // Validate schema
    const validatedData = AsaasWebhookSchema.parse(payload);

    const supabase = createAdminClient();

    // Map Asaas status to our payment status
    const statusMap: Record<string, string> = {
      PENDING: 'pending',
      CONFIRMED: 'paid',
      RECEIVED: 'paid',
      OVERDUE: 'failed',
      FAILED: 'failed',
      REFUNDED: 'refunded',
      CHARGEBACK: 'chargeback',
    };

    const newStatus = statusMap[validatedData.payment.status] || 'pending';

    // Update payment record
    await supabase
      .from('payments')
      .update({
        status: newStatus,
        gateway_response: validatedData.payment,
        paid_at: validatedData.payment.paymentDate,
      })
      .eq('gateway_id', validatedData.payment.id);

    // If payment confirmed, update consultation status
    if (newStatus === 'paid') {
      const { data: payment } = await supabase
        .from('payments')
        .select('consultation_id')
        .eq('gateway_id', validatedData.payment.id)
        .single();

      if (payment) {
        await supabase
          .from('consultations')
          .update({ payment_status: 'paid', status: 'scheduled' })
          .eq('id', payment.consultation_id);

        // TODO: Send payment confirmation email
      }
    }

    return success({ processed: true }, 200);
  } catch (err) {
    if (err instanceof Error) {
      console.error('[Webhook] Error:', err);
      return error(err.message, 400);
    }
    return error('Invalid request', 400);
  }
}
