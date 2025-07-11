import * as admin from 'firebase-admin';

let adminApp: admin.app.App;

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_CONFIG || '{}');

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("Erro ao inicializar Firebase Admin SDK:", error);
    throw new Error("Falha na inicialização do Firebase Admin SDK.");
  }
} else {
  adminApp = admin.app(); 
}

// Renomeado de adminDb para db para consistência
const db = adminApp.firestore();

export { db };