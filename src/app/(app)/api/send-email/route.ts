import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { ServiceOrder, Client, EmailSettings } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { serviceOrder, client }: { serviceOrder: ServiceOrder; client: Client } = await request.json();

    if (!serviceOrder || !client) {
      return NextResponse.json({ message: 'Dados da ordem de serviço ou cliente ausentes.' }, { status: 400 });
    }

    // Determine the recipient email
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

    const SMTP_SERVER = emailSettings.smtpServer;
    const SMTP_PORT = emailSettings.smtpPort || 587;
    const SMTP_SECURITY = emailSettings.smtpSecurity || 'tls';
    const SENDER_EMAIL = emailSettings.senderEmail;
    const SMTP_PASSWORD = emailSettings.smtpPassword;

    if (!SMTP_SERVER || !SENDER_EMAIL || !SMTP_PASSWORD) {
        return NextResponse.json({ message: 'Configurações de SMTP incompletas no banco de dados.' }, { status: 500 });
    }

    // Determine secure option based on SMTP_SECURITY
    let secure = false;
    if (SMTP_SECURITY === 'ssl' || SMTP_SECURITY === 'ssltls') {
        secure = true; // Use SSL/TLS directly
    } else if (SMTP_SECURITY === 'starttls') {
        // STARTTLS is usually on port 587 and involves upgrading the connection
        secure = false;
    } else if (SMTP_SECURITY === 'tls') {
        secure = false; // TLS can be implied or upgraded via STARTTLS
    }


    const transporter = nodemailer.createTransport({
      host: SMTP_SERVER,
      port: SMTP_PORT,
      secure: secure, // true for 465, false for other ports like 587 (STARTTLS)
      requireTLS: SMTP_SECURITY === 'starttls', // Enforce STARTTLS if specified
      auth: {
        user: SENDER_EMAIL,
        pass: SMTP_PASSWORD,
      },
      tls: {
        // Do not fail on invalid certs, for self-signed or development.
        // In production, you should validate certificates.
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"TSMIT" <${SENDER_EMAIL}>`,
      to: recipientEmail, // Use the determined recipient email
      subject: `Atualização da Ordem de Serviço ${serviceOrder.orderNumber} - Status: Entregue`,
      html: `
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
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'E-mail de notificação enviado com sucesso.' });
  } catch (error) {
    console.error('Erro ao enviar e-mail de notificação:', error);
    return NextResponse.json({ message: 'Erro ao enviar e-mail de notificação.', error: (error as Error).message }, { status: 500 });
  }
}