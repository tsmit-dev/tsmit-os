import { NextResponse } from 'next/server';
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import { ServiceOrder, Client, EmailSettings } from '@/lib/types';
import { db } from '@/lib/firebaseAdmin';

// Initialize MailerSend with your API token
const mailerSend = new MailerSend({
  apiKey: 'mlsn.8b705c26458b033a96e26edeaca21b56308a7f5374b7a42e39d8cdf6de9402de',
});

async function sendEmailWithMailerSend(
  recipientEmail: string,
  recipientName: string,
  subject: string,
  htmlContent: string,
  senderEmail: string
) {
  const sentFrom = new Sender(senderEmail, "TSMIT - Suporte");
  const recipients = [new Recipient(recipientEmail, recipientName)];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject(subject)
    .setHtml(htmlContent);

  try {
    await mailerSend.email.send(emailParams);
  } catch (error) {
    console.error('Error sending email via MailerSend:', error);
    if (error instanceof Error && 'body' in error) {
      console.error('MailerSend Error Body:', (error as any).body);
    }
    throw new Error('Failed to send email via MailerSend.');
  }
}

function generateDynamicEmailContent(order: ServiceOrder, clientName: string, emailBody: string): { subject: string, htmlContent: string } {
    const subject = `Atualização da OS ${order.orderNumber} - Status: ${order.status.name}`;
    
    // Replace placeholders
    const personalizedBody = emailBody
        .replace(/{client_name}/g, clientName)
        .replace(/{os_number}/g, order.orderNumber)
        .replace(/{status_name}/g, order.status.name)
        .replace(/{technical_solution}/g, order.technicalSolution || 'Nenhuma solução técnica detalhada foi fornecida.')
        .replace(/ /g, '<br>');

    const commonStyle = "font-family: Arial, sans-serif; line-height: 1.6; color: #333;";
    const headerStyle = "color: #0056b3;";
    const footerStyle = "font-size: 0.8em; color: #777;";

    const htmlContent = `
        <div style="${commonStyle}">
            <h2 style="${headerStyle}">Atualização da Ordem de Serviço ${order.orderNumber}</h2>
            <p>Prezado(a) ${clientName},</p>
            <div>${personalizedBody}</div>
            <p><strong>Resumo do Equipamento:</strong></p>
            <ul>
                <li><strong>Número da OS:</strong> ${order.orderNumber}</li>
                <li><strong>Equipamento:</strong> ${order.equipment.type} - ${order.equipment.brand} ${order.equipment.model}</li>
                <li><strong>Problema Relatado:</strong> ${order.reportedProblem}</li>
            </ul>
            <p>Atenciosamente,</p>
            <p>Sua Equipe TSMIT</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
            <p style="${footerStyle}">Este é um e-mail automático, por favor, não responda.</p>
        </div>`;
    
    return { subject, htmlContent };
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const svcOrder = body.serviceOrder as ServiceOrder;
    const cli = body.client as Client;
    const emailBody = body.emailBody as string | undefined;

    if (!svcOrder?.id || !svcOrder.status?.name) {
      return NextResponse.json(
        { error: "serviceOrder.id e serviceOrder.status.name são obrigatórios." },
        { status: 400 }
      );
    }

    const orderId = svcOrder.id;
    const recipientEmail = cli.email || svcOrder.collaborator.email;
    const recipientName  = cli.name  || svcOrder.collaborator.name;

    const settingsDocRef = db.collection('settings').doc('email');
    const settingsSnap = await settingsDocRef.get();

    if (!settingsSnap.exists) {
      return NextResponse.json({ error: 'Configurações de e-mail não encontradas no Firestore.' }, { status: 500 });
    }
    
    const emailSettings = settingsSnap.data() as EmailSettings;
    const senderEmail = emailSettings.senderEmail;

    if (!senderEmail) {
        return NextResponse.json({ error: 'E-mail do remetente não configurado no Firestore (settings/email).' }, { status: 500 });
    }

    if (!recipientEmail) {
      return NextResponse.json({ error: 'Nenhum e-mail de destinatário válido.' }, { status: 400 });
    }

    let subject: string;
    let htmlContent: string;

    if (emailBody) {
        const result = generateDynamicEmailContent(svcOrder, cli.name, emailBody);
        subject = result.subject;
        htmlContent = result.htmlContent;
    } else {
        // Fallback to a default content if no emailBody is provided
        subject = `Atualização da OS ${svcOrder.orderNumber} - Status: ${svcOrder.status.name}`;
        htmlContent = `<p>Prezado(a) ${cli.name},</p><p>Sua Ordem de Serviço <strong>${svcOrder.orderNumber}</strong> teve seu status atualizado para: <strong>${svcOrder.status.name.toUpperCase()}</strong>.</p><p>Atenciosamente,<br/>Equipe TSMIT</p>`;
    }

    await sendEmailWithMailerSend(recipientEmail, recipientName, subject, htmlContent, senderEmail);

    return NextResponse.json({ message: 'E-mail enviado com sucesso via MailerSend.' });

  } catch (error) {
    console.error('Erro ao processar a requisição de e-mail:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    return NextResponse.json({ error: 'Erro interno do servidor.', details: errorMessage }, { status: 500 });
  }
}