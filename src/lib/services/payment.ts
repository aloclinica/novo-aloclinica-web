import { ASAAS_API_KEY, ASAAS_ENVIRONMENT, ASAAS_SANDBOX_URL, ASAAS_PRODUCTION_URL } from '@/lib/utils/constants';
import crypto from 'crypto';

const ASAAS_BASE_URL = ASAAS_ENVIRONMENT === 'production' ? ASAAS_PRODUCTION_URL : ASAAS_SANDBOX_URL;

// ============================================================
// ASAAS PAYMENT SERVICE
// ============================================================

interface CreatePixPaymentParams {
  customer_id: string; // Asaas customer ID
  amount: number; // Valor em reais (ex: 150.00)
  description: string;
  due_date: string; // YYYY-MM-DD
}

interface CreateCreditCardPaymentParams {
  customer_id: string;
  amount: number;
  card_name: string;
  card_number: string;
  card_expiry_month: number;
  card_expiry_year: number;
  card_ccv: string;
  description: string;
  due_date: string;
}

export const createPixPayment = async (params: CreatePixPaymentParams) => {
  if (!ASAAS_API_KEY) {
    console.error('[Asaas] API key not configured');
    return null;
  }

  try {
    const response = await fetch(`${ASAAS_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': ASAAS_API_KEY,
      },
      body: JSON.stringify({
        customer: params.customer_id,
        billingType: 'PIX',
        dueDate: params.due_date,
        value: params.amount,
        description: params.description,
      }),
    });

    if (!response.ok) {
      console.error('[Asaas] Error:', await response.text());
      return null;
    }

    const data = await response.json();

    return {
      id: data.id,
      status: data.status,
      pix_qr_code: data.pixQrCode?.qrCode,
      pix_copy_and_paste: data.pixQrCode?.addressKey,
      expires_at: data.pixQrCode?.expirationDate,
    };
  } catch (error) {
    console.error('[Asaas] Exception:', error);
    return null;
  }
};

export const createCreditCardPayment = async (params: CreateCreditCardPaymentParams) => {
  if (!ASAAS_API_KEY) {
    console.error('[Asaas] API key not configured');
    return null;
  }

  try {
    const response = await fetch(`${ASAAS_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': ASAAS_API_KEY,
      },
      body: JSON.stringify({
        customer: params.customer_id,
        billingType: 'CREDIT_CARD',
        dueDate: params.due_date,
        value: params.amount,
        description: params.description,
        creditCard: {
          holderName: params.card_name,
          number: params.card_number,
          expiryMonth: params.card_expiry_month,
          expiryYear: params.card_expiry_year,
          ccv: params.card_ccv,
        },
      }),
    });

    if (!response.ok) {
      console.error('[Asaas] Error:', await response.text());
      return null;
    }

    const data = await response.json();

    return {
      id: data.id,
      status: data.status,
    };
  } catch (error) {
    console.error('[Asaas] Exception:', error);
    return null;
  }
};

export const getPaymentStatus = async (payment_id: string) => {
  if (!ASAAS_API_KEY) {
    console.error('[Asaas] API key not configured');
    return null;
  }

  try {
    const response = await fetch(`${ASAAS_BASE_URL}/payments/${payment_id}`, {
      method: 'GET',
      headers: {
        'access-token': ASAAS_API_KEY,
      },
    });

    if (!response.ok) {
      console.error('[Asaas] Error:', await response.text());
      return null;
    }

    const data = await response.json();

    return {
      id: data.id,
      status: data.status,
      value: data.value,
      net_value: data.netValue,
      paid_date: data.paymentDate,
      confirmed_date: data.confirmedDate,
    };
  } catch (error) {
    console.error('[Asaas] Exception:', error);
    return null;
  }
};

export const refundPayment = async (payment_id: string, amount?: number) => {
  if (!ASAAS_API_KEY) {
    console.error('[Asaas] API key not configured');
    return null;
  }

  try {
    const response = await fetch(`${ASAAS_BASE_URL}/payments/${payment_id}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': ASAAS_API_KEY,
      },
      body: JSON.stringify({
        ...(amount && { value: amount }),
      }),
    });

    if (!response.ok) {
      console.error('[Asaas] Error:', await response.text());
      return null;
    }

    return true;
  } catch (error) {
    console.error('[Asaas] Exception:', error);
    return null;
  }
};

export const verifyWebhookSignature = (payload: string, signature: string) => {
  if (!ASAAS_API_KEY) {
    return false;
  }

  const hash = crypto.createHmac('sha256', ASAAS_API_KEY).update(payload).digest('hex');

  return hash === signature;
};
