import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = { 
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Setup admin user if it doesn't exist
export const setupAdminUser = async () => {
  try {
    const adminUsername = import.meta.env.VITE_ADMIN_USERNAME;
    const adminEmail = `${adminUsername}@user.com`;

    // Verifica primeiro se o documento do admin existe no Firestore
    const adminQuery = await getDoc(doc(db, 'users', 'admin'));
    
    if (!adminQuery.exists()) {
      // Se não existe, cria o documento do admin
      await setDoc(doc(db, 'users', 'admin'), {
        username: adminUsername,
        isAdmin: true,
        isApproved: true,
        createdAt: new Date().toISOString()
      });

      await setDoc(doc(db, 'userData', 'admin'), {
        transactions: [],
        categories: []
      });

      console.log('Admin documents created successfully');
    }

    console.log('Admin setup completed');
  } catch (error) {
    console.error('Error in setupAdminUser:', error);
  }
};

// Função utilitária para ser chamada após pagamento confirmado
export async function liberarAcessoUsuario(uid: string, dias: number) {
  const userRef = doc(db, 'users', uid);
  const accessDuration = dias * 24 * 60 * 60;
  await updateDoc(userRef, {
    accessDuration,
    isApproved: false, // ou true se quiser liberar imediatamente
    createdAt: new Date().toISOString()
  });
}