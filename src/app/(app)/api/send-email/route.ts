import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { ServiceOrder, Client, EmailSettings } from '@/lib/types';
import { adminDb } from '@/lib/firebaseAdmin'; // Importa adminDb do Firebase Admin SDK

/**
 * Sends an email using the provided settings.
 * This function assumes emailSettings are complete and will throw an error if sending fails for other reasons.
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

  console.log('Email Settings being used:', { smtpServer, smtpPort, smtpSecurity, senderEmail: senderEmail ? '[REDACTED]' : 'N/A' });

  const secureConnection = smtpPort === 465 || smtpSecurity === 'ssl' || smtpSecurity === 'ssltls';
  const requireStartTLS = smtpPort === 587 && (smtpSecurity === 'starttls' || smtpSecurity === 'tls');

  console.log('Nodemailer transporter options:', { host: smtpServer, port: smtpPort || 587, secure: secureConnection, requireTLS: requireStartTLS });

  const transporter = nodemailer.createTransport({
    host: smtpServer,
    port: smtpPort || 587,
    secure: secureConnection,
    requireTLS: requireStartTLS,
    auth: {
      user: senderEmail,
      pass: smtpPassword,
    },
    tls: {
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

    console.log('Received POST request for send-email. Service Order ID:', serviceOrder?.id, 'Client ID:', client?.id);

    if (!serviceOrder || !client) {
      console.error('Dados da ordem de serviço ou cliente ausentes na requisição.');
      return NextResponse.json({ message: 'Dados da ordem de serviço ou cliente ausentes.' }, { status: 400 });
    }

    const recipientEmail = client.email || serviceOrder.collaborator.email;

    if (!recipientEmail) {
      console.error('Nenhum e-mail de destinatário válido fornecido para o cliente ou colaborador.');
      return NextResponse.json({ message: 'Nenhum e-mail de destinatário válido fornecido para o cliente ou colaborador.' }, { status: 400 });
    }
    console.log('Recipient Email:', recipientEmail);

    // Usa adminDb para acessar o Firestore com privilégios de administrador
    const settingsDocRef = adminDb.collection('settings').doc('email');
    const settingsSnap = await settingsDocRef.get();

    if (!settingsSnap.exists) {
      console.warn('Configurações de e-mail não encontradas no banco de dados (documento settings/email). Pulando o envio de e-mail.');
      return NextResponse.json({ message: 'Ordem de serviço atualizada. Envio de e-mail ignorado: Configurações de e-mail não encontradas.' }, { status: 200 });
    }

    const emailSettings = settingsSnap.data() as EmailSettings;
    console.log('Fetched Email Settings from Firestore:', emailSettings);

    // Check for incomplete SMTP settings before attempting to send
    if (!emailSettings.smtpServer || !emailSettings.senderEmail || !emailSettings.smtpPassword) {
      console.warn('Configurações de SMTP incompletas detectadas. Pulando o envio de e-mail.');
      return NextResponse.json({ message: 'Ordem de serviço atualizada. Envio de e-mail ignorado: Configurações de SMTP incompletas.' }, { status: 200 });
    }

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

    await sendEmail(recipientEmail, subject, htmlContent, emailSettings);

    return NextResponse.json({ message: 'E-mail de notificação enviado com sucesso.' });
  } catch (error: unknown) {
    console.error('Erro geral na rota /api/send-email:', error);
    return NextResponse.json({
      message: 'Erro ao enviar e-mail de notificação.',
      error: (error instanceof Error) ? error.message : String(error),
      detailedError: (error instanceof Error) ? error.stack : undefined
    }, { status: 500 });
  }
}