import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { ServiceOrder, Client, EmailSettings } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Sends an email using the provided settings.
 * @param recipientEmail The email address of the recipient.
 * @param subject The subject line of the email.
 * @param htmlContent The HTML content of the email body.
 * @param emailSettings The email configuration settings from Firestore.
 */
async function sendEmail(
  recipientEmail: string,
  subject: string,
  htmlContent: string,
  emailSettings: EmailSettings
) {
  const { smtpServer, smtpPort, smtpSecurity, senderEmail, smtpPassword } = emailSettings;

  if (!smtpServer || !senderEmail || !smtpPassword) {
    throw new Error('Configurações de SMTP incompletas no banco de dados.');
  }

  // Determine secure option based on SMTP_PORT and SMTP_SECURITY
  // Nodemailer's 'secure' option: true for 465 (SMTPS), false for other ports (like 587 with STARTTLS)
  const secureConnection = smtpPort === 465 || smtpSecurity === 'ssl' || smtpSecurity === 'ssltls';
  // Nodemailer's 'requireTLS' option: true to enforce STARTTLS
  const requireStartTLS = smtpPort === 587 && (smtpSecurity === 'starttls' || smtpSecurity === 'tls');

  const transporter = nodemailer.createTransport({
    host: smtpServer,
    port: smtpPort || 587, // Default to 587 if not specified
    secure: secureConnection,
    requireTLS: requireStartTLS,
    auth: {
      user: senderEmail,
      pass: smtpPassword,
    },
    tls: {
      // It's recommended to set rejectUnauthorized to true in production
      // if you are using a valid certificate.
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: `"TSMIT" <${senderEmail}>`,
    to: recipientEmail,
    subject: subject,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
}

export async function POST(request: Request) {
  try {
    const { serviceOrder, client }: { serviceOrder: ServiceOrder; client: Client } = await request.json();

    if (!serviceOrder || !client) {
      return NextResponse.json({ message: 'Dados da ordem de serviço ou cliente ausentes.' }, { status: 400 });
    }

    // Determine the recipient email, prioritizing client email
    const recipientEmail = client.email || serviceOrder.collaborator.email;

    if (!recipientEmail) {
      return NextResponse.json({ message: 'Nenhum e-mail de destinatário válido fornecido para o cliente ou colaborador.' }, { status: 400 });
    }

    // Fetch email settings from Firestore
    const settingsDocRef = doc(db, 'settings', 'email');
    const settingsSnap = await getDoc(settingsDocRef);

    if (!settingsSnap.exists()) {
      return NextResponse.json({ message: 'Configurações de e-mail não encontradas no banco de dados.' }, { status: 500 });
    }

    const emailSettings = settingsSnap.data() as EmailSettings;

    // Construct the email content and subject specific to the "Entregue" status
    const subject = `Atualização da Ordem de Serviço ${serviceOrder.orderNumber} - Status: Entregue`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0056b3;">Ordem de Serviço ${serviceOrder.orderNumber} - Entregue!</h2>
        <p>Prezado(a) ${client.name},</p>
        <p>Temos uma excelente notícia! Sua Ordem de Serviço <strong>${serviceOrder.orderNumber}</strong> referente ao equipamento <strong>${serviceOrder.equipment.type}</strong> com problema <strong>${serviceOrder.reportedProblem}</strong> foi oficialmente marcada como <strong>ENTREGUE</strong>.</p>
        <p><strong>Detalhes da Entrega:</strong></p>
        <ul>
          <li><strong>Número da OS:</strong> ${serviceOrder.orderNumber}</li>
          <li><strong>Equipamento:</strong> ${serviceOrder.equipment.type} - ${serviceOrder.equipment.brand} ${serviceOrder.equipment.model}</li>
          <li><strong>Problema Relatado:</strong> ${serviceOrder.reportedProblem}</li>
          <li><strong>Status Atual:</strong> <strong style="color: #28a745;">ENTREGUE</strong></li>
          ${serviceOrder.technicalSolution ? `<li><strong>Solução Técnica:</strong> ${serviceOrder.technicalSolution}</li>` : ''}
          <li><strong>Data da Atualização:</strong> ${new Date().toLocaleDateString('pt-BR')}</li>
        </ul>
        <p>Agradecemos a sua confiança nos nossos serviços. Caso tenha qualquer dúvida ou necessite de mais assistência, por favor, não hesite em nos contatar.</p>
        <p>Atenciosamente,</p>
        <p>Sua Equipe TSMIT</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
        <p style="font-size: 0.8em; color: #777;">Este é um e-mail automático, por favor, não responda.</p>
      </div>
    `;

    // Call the refactored sendEmail function
    await sendEmail(recipientEmail, subject, htmlContent, emailSettings);

    return NextResponse.json({ message: 'E-mail de notificação enviado com sucesso.' });
  } catch (error) {
    console.error('Erro ao enviar e-mail de notificação:', error);
    return NextResponse.json({ 
      message: 'Erro ao enviar e-mail de notificação.', 
      error: (error instanceof Error) ? error.message : String(error) 
    }, { status: 500 });
  }
}