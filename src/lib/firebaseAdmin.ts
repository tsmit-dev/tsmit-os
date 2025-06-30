import * as admin from 'firebase-admin';

let adminApp: admin.app.App | undefined;

if (!admin.apps.length) {
  try {
    // A chave da conta de serviço é carregada de uma variável de ambiente no Netlify.
    // Certifique-se de que FIREBASE_ADMIN_SDK_CONFIG é definida com o conteúdo JSON da sua chave.
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_CONFIG || '{}');

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Se você usa o Realtime Database, adicione databaseURL aqui
      // databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  } catch (error) {
    console.error("Erro ao inicializar Firebase Admin SDK:", error);
    // É crucial que a aplicação não continue se o Admin SDK não for inicializado corretamente
    throw new Error("Falha na inicialização do Firebase Admin SDK.");
  }
} else {
  adminApp = admin.app(); // Se já inicializado, obtenha a instância existente
}

const adminDb = adminApp.firestore();

export { adminDb };