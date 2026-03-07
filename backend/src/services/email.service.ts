import { config } from '../config';
import { AppError } from '../middleware/error-handler';

export async function sendProfessorInvitationEmail(
  professorEmail: string,
  accessCode: string,
): Promise<void> {
  if (!config.sendgridApiKey) {
    throw new AppError(500, 'SENDGRID_API_KEY is not configured');
  }

  if (!config.emailFrom) {
    throw new AppError(500, 'EMAIL_FROM is not configured');
  }

  let sgMail: {
    setApiKey: (key: string) => void;
    send: (message: {
      to: string;
      from: string;
      subject: string;
      text: string;
    }) => Promise<unknown>;
  };

  try {
    sgMail = require('@sendgrid/mail') as typeof sgMail;
  } catch {
    throw new AppError(500, 'SendGrid client is not installed');
  }

  sgMail.setApiKey(config.sendgridApiKey);

  await sgMail.send({
    to: professorEmail,
    from: config.emailFrom,
    subject: 'Convite para acompanhar estágio',
    text: [
      'Foi convidado para acompanhar o estágio de um estudante no StageSync.',
      '',
      'Use o código abaixo para aceder:',
      '',
      `CODE: ${accessCode}`,
      '',
      `Login: ${config.appUrl}/professor/login`,
      '',
      'Este código é de utilização única e expira em 30 dias.',
    ].join('\n'),
  });
}
