import { Profile, Consultation, Doctor, Prescription } from '@/types/database.types';
import { EMAIL_FROM_ADDRESS, EMAIL_FROM_NAME } from '@/lib/utils/constants';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3';

// ============================================================
// BREVO EMAIL SERVICE
// ============================================================

interface SendEmailPayload {
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

const sendEmail = async (payload: SendEmailPayload) => {
  if (!BREVO_API_KEY) {
    console.error('[Brevo] API key not configured');
    return false;
  }

  try {
    const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          email: EMAIL_FROM_ADDRESS,
          name: EMAIL_FROM_NAME,
        },
        to: payload.to,
        subject: payload.subject,
        htmlContent: payload.htmlContent,
        textContent: payload.textContent,
      }),
    });

    if (!response.ok) {
      console.error('[Brevo] Error:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Brevo] Exception:', error);
    return false;
  }
};

// ============================================================
// TEMPLATES
// ============================================================

export const sendConsultationConfirmation = async (
  patient: Profile,
  doctor: Doctor & { profile: Profile },
  consultation: Consultation,
) => {
  const appointmentDate = new Date(consultation.scheduled_at).toLocaleDateString('pt-BR');
  const appointmentTime = new Date(consultation.scheduled_at).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Consulta Confirmada!</h2>
        <p>Olá ${patient.full_name},</p>
        <p>Sua consulta com <strong>${doctor.profile.full_name}</strong> foi confirmada!</p>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Data:</strong> ${appointmentDate}</p>
          <p><strong>Hora:</strong> ${appointmentTime}</p>
          <p><strong>Tipo:</strong> ${consultation.type === 'video' ? 'Videochamada' : 'Chat'}</p>
          <p><strong>Valor:</strong> R$ ${(consultation.price_cents / 100).toFixed(2)}</p>
        </div>

        <p>Você receberá um lembrete 30 minutos antes da consulta.</p>
        <p>Atenciosamente,<br>Equipe AloClínica</p>
      </body>
    </html>
  `;

  return sendEmail({
    to: [{ email: patient.cpf }], // Using CPF as email placeholder in this schema
    subject: 'Consulta Confirmada - AloClínica',
    htmlContent,
  });
};

export const sendConsultationReminder = async (
  patient: Profile,
  doctor: Profile,
  consultation: Consultation,
) => {
  const appointmentTime = new Date(consultation.scheduled_at).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Lembrete de Consulta</h2>
        <p>Olá ${patient.full_name},</p>
        <p>Sua consulta com <strong>${doctor.full_name}</strong> começa em <strong>30 minutos</strong>!</p>

        <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Hora:</strong> ${appointmentTime}</p>
          <p>Certifique-se de ter uma conexão estável de internet e câmera funcionando.</p>
        </div>

        <a href="${process.env.NEXTAUTH_URL}/consultations/${consultation.id}" style="background-color: #0066cc; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; display: inline-block;">Acessar Consulta</a>

        <p>Atenciosamente,<br>Equipe AloClínica</p>
      </body>
    </html>
  `;

  return sendEmail({
    to: [{ email: patient.cpf }],
    subject: 'Lembrete: Sua Consulta Começa em 30 Minutos',
    htmlContent,
  });
};

export const sendPrescriptionReady = async (patient: Profile, prescription: Prescription) => {
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Sua Receita Está Pronta!</h2>
        <p>Olá ${patient.full_name},</p>
        <p>Sua receita médica foi disponibilizada no seu perfil.</p>

        <div style="background-color: #f0f8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>Tipo: <strong>${prescription.type}</strong></p>
          <p>Válida até: <strong>${new Date(prescription.valid_until || '').toLocaleDateString('pt-BR')}</strong></p>
        </div>

        <a href="${process.env.NEXTAUTH_URL}/prescriptions/${prescription.id}" style="background-color: #0066cc; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; display: inline-block;">Ver Receita</a>

        <p>Atenciosamente,<br>Equipe AloClínica</p>
      </body>
    </html>
  `;

  return sendEmail({
    to: [{ email: patient.cpf }],
    subject: 'Sua Receita Está Pronta - AloClínica',
    htmlContent,
  });
};

export const sendKYCApproved = async (profile: Profile) => {
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>KYC Aprovado!</h2>
        <p>Parabéns ${profile.full_name},</p>
        <p>Sua verificação de identidade foi <strong>aprovada</strong>!</p>

        <p>Você agora pode acessar todos os recursos da plataforma sem restrições.</p>

        <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background-color: #28a745; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; display: inline-block;">Acessar Dashboard</a>

        <p>Atenciosamente,<br>Equipe AloClínica</p>
      </body>
    </html>
  `;

  return sendEmail({
    to: [{ email: profile.cpf }],
    subject: 'Verificação de Identidade Aprovada - AloClínica',
    htmlContent,
  });
};

export const sendKYCRejected = async (profile: Profile, reason?: string) => {
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Verificação de Identidade - Documentação Necessária</h2>
        <p>Olá ${profile.full_name},</p>
        <p>Sua verificação de identidade foi <strong>rejeitada</strong>.</p>

        ${reason ? `<p>Motivo: <strong>${reason}</strong></p>` : ''}

        <p>Você pode enviar novamente os documentos no seu perfil.</p>

        <a href="${process.env.NEXTAUTH_URL}/profile/kyc" style="background-color: #0066cc; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; display: inline-block;">Enviar Documentos Novamente</a>

        <p>Atenciosamente,<br>Equipe AloClínica</p>
      </body>
    </html>
  `;

  return sendEmail({
    to: [{ email: profile.cpf }],
    subject: 'Verificação de Identidade - Ação Necessária',
    htmlContent,
  });
};

export const sendPaymentConfirmation = async (
  patient: Profile,
  amountCents: number,
  consultationId: string,
) => {
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Pagamento Confirmado!</h2>
        <p>Olá ${patient.full_name},</p>
        <p>Seu pagamento foi recebido com sucesso.</p>

        <div style="background-color: #f0f8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Valor:</strong> R$ ${(amountCents / 100).toFixed(2)}</p>
          <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <a href="${process.env.NEXTAUTH_URL}/consultations/${consultationId}" style="background-color: #0066cc; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; display: inline-block;">Ver Consulta</a>

        <p>Atenciosamente,<br>Equipe AloClínica</p>
      </body>
    </html>
  `;

  return sendEmail({
    to: [{ email: patient.cpf }],
    subject: 'Pagamento Confirmado - AloClínica',
    htmlContent,
  });
};
