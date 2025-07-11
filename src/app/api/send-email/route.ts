import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { ServiceOrder, Client, EmailSettings } from '@/lib/types';
import { db } from '@/lib/firebaseAdmin';

/**
 * Sends an email using the provided SMTP settings from Firestore.
 */
async function sendEmail(
  recipientEmail: string,
  subject: string,
  htmlContent: string,
  emailSettings: EmailSettings
) {
  const { smtpServer, smtpPort, smtpSecurity, senderEmail, smtpPassword } = emailSettings;

  if (!smtpServer || !senderEmail || !smtpPassword || !smtpPort) {
    throw new Error('As configurações de SMTP estão incompletas no Firestore.');
  }
  
  const secureConnection = smtpSecurity === 'ssl' || smtpSecurity === 'ssltls';

  const transporter = nodemailer.createTransport({
    host: smtpServer,
    port: smtpPort,
    secure: secureConnection,
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

/**
 * Generates the email content based on the service order and status.
 */
function generateEmailContent(order: ServiceOrder, statusName: string, clientName: string): { subject: string, htmlContent: string } {
    const subject = `Atualização da OS ${order.orderNumber} - Status: ${statusName}`;

    const commonStyle = "font-family: Arial, sans-serif; line-height: 1.6; color: #333;";
    const headerStyle = "color: #0056b3;";
    const strongStyle = "color: #0056b3;";
    const footerStyle = "font-size: 0.8em; color: #777;";
    
    let messageBody = '';

    switch (statusName.toLowerCase()) {
        case 'pronto para retirada':
            messageBody = `<p>Temos uma ótima notícia! Sua Ordem de Serviço <strong>${order.orderNumber}</strong> já está finalizada e disponível para retirada.</p><p><strong>Detalhes da Solução:</strong></p><p style="background-color: #f5f5f5; border-left: 4px solid #0056b3; padding: 10px; margin: 10px 0;">${order.technicalSolution || 'Nenhuma solução técnica detalhada foi fornecida.'}</p><p>Por favor, dirija-se à nossa recepção para retirar seu equipamento.</p>`;
            break;
        case 'entregue':
             messageBody = `<p>Sua Ordem de Serviço <strong>${order.orderNumber}</strong> foi oficialmente marcada como <strong>ENTREGUE</strong>.</p><p>Agradecemos a sua confiança em nossos serviços e esperamos vê-lo novamente!</p>`;
            break;
        default:
             messageBody = `<p>Sua Ordem de Serviço <strong>${order.orderNumber}</strong> teve seu status atualizado para: <strong style="${strongStyle}">${statusName.toUpperCase()}</strong>.</p><p>Acesse nosso portal para mais detalhes.</p>`;
    }

    const htmlContent = `<div style="${commonStyle}"><h2 style="${headerStyle}">Atualização da Ordem de Serviço ${order.orderNumber}</h2><p>Prezado(a) ${clientName},</p>${messageBody}<p><strong>Resumo do Equipamento:</strong></p><ul><li><strong>Número da OS:</strong> ${order.orderNumber}</li><li><strong>Equipamento:</strong> ${order.equipment.type} - ${order.equipment.brand} ${order.equipment.model}</li><li><strong>Problema Relatado:</strong> ${order.reportedProblem}</li></ul><p>Atenciosamente,</p><p>Sua Equipe TSMIT</p><hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/><p style="${footerStyle}">Este é um e-mail automático, por favor, não responda.</p></div>`;
    
    return { subject, htmlContent };
}


export async function POST(request: Request) {
  try {
    const { orderId, statusName } = await request.json();

    if (!orderId || !statusName) {
      return NextResponse.json({ error: 'orderId e statusName são obrigatórios.' }, { status: 400 });
    }

    // --- Fetch all data from Firestore using Admin SDK ---
    const orderDocRef = db.collection('serviceOrders').doc(orderId);
    const settingsDocRef = db.collection('settings').doc('email');

    const [orderSnap, settingsSnap] = await Promise.all([
      orderDocRef.get(),
      settingsDocRef.get()
    ]);
    
    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Ordem de Serviço não encontrada.' }, { status: 404 });
    }
    const serviceOrder = orderSnap.data() as ServiceOrder;

    if (!settingsSnap.exists) {
        return NextResponse.json({ error: 'Configurações de e-mail não encontradas no Firestore.' }, { status: 500 });
    }
    const emailSettings = settingsSnap.data() as EmailSettings;

    const clientDocRef = db.collection('clients').doc(serviceOrder.clientId);
    const clientSnap = await clientDocRef.get();

    if (!clientSnap.exists) {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }
    const client = clientSnap.data() as Client;
    // --- End of data fetching ---

    const recipientEmail = client.email || serviceOrder.collaborator.email;
    if (!recipientEmail) {
      return NextResponse.json({ error: 'Nenhum e-mail de destinatário válido.' }, { status: 400 });
    }

    const { subject, htmlContent } = generateEmailContent(serviceOrder, statusName, client.name);

    await sendEmail(recipientEmail, subject, htmlContent, emailSettings);

    return NextResponse.json({ message: 'E-mail de notificação enviado com sucesso.' });

  } catch (error) {
    console.error('Erro ao processar a requisição de e-mail:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    return NextResponse.json({ error: 'Erro interno do servidor.', details: errorMessage }, { status: 500 });
  }
}