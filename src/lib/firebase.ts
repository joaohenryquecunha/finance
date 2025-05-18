import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = { 
  apiKey: "AIzaSyBflqbgJiZCjXnzOextYL1JVe2rrbwY9_s",
  authDomain: "financeiro-3d76b.firebaseapp.com",
  projectId: "financeiro-3d76b",
  storageBucket: "financeiro-3d76b.firebasestorage.app",
  messagingSenderId: "182167446099",
  appId: "1:182167446099:web:074fc6eddd5f434f0e9ca6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Setup admin user if it doesn't exist
export const setupAdminUser = async () => {
  try {
    const adminUsername = 'januzzi';
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