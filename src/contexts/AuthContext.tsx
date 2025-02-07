import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  doc, 
  getDoc,
  setDoc,
  collection,
  query,
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Transaction, Category } from '../types';

interface User {
  uid: string;
  username: string;
  isAdmin: boolean;
  isApproved: boolean;
}

interface UserData {
  transactions: Transaction[];
  categories: Category[];
}

interface AuthContextType {
  user: User | null;
  signIn: (username: string, password: string, isAdminLogin?: boolean) => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  signOut: () => void;
  getUserData: () => { transactions: Transaction[]; categories: Category[]; } | null;
  updateUserData: (data: { transactions?: Transaction[]; categories?: Category[]; }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded admin credentials
const ADMIN_CREDENTIALS = {
  username: 'januzzi',
  password: 'januzzi@!'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              username: userData.username,
              isAdmin: userData.isAdmin || false,
              isApproved: userData.isApproved || false
            });

            // Inicializa os dados do usuário se necessário
            const userDataDoc = await getDoc(doc(db, 'userData', firebaseUser.uid));
            if (userDataDoc.exists()) {
              setUserData(userDataDoc.data() as UserData);
            } else {
              // Cria documento de dados do usuário se não existir
              const initialUserData = { transactions: [], categories: [] };
              await setDoc(doc(db, 'userData', firebaseUser.uid), initialUserData);
              setUserData(initialUserData);
            }
          } else {
            console.error('User document not found');
            await firebaseSignOut(auth);
            setUser(null);
            setUserData(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          await firebaseSignOut(auth);
          setUser(null);
          setUserData(null);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (username: string, password: string, isAdminLogin?: boolean) => {
    try {
      // Admin login
      if (isAdminLogin) {
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
          setUser({
            uid: 'admin',
            username: ADMIN_CREDENTIALS.username,
            isAdmin: true,
            isApproved: true
          });
          return;
        }
        throw new Error('Credenciais de administrador inválidas');
      }

      // Regular user login
      const email = `${username}@user.com`;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Verifica se o documento do usuário existe
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        await firebaseSignOut(auth);
        throw new Error('Usuário não encontrado');
      }

      const userData = userDoc.data();

      // Verifica se o usuário está aprovado
      if (!userData.isApproved) {
        await firebaseSignOut(auth);
        throw new Error('Sua conta está aguardando aprovação do administrador');
      }

      // Atualiza o estado do usuário
      setUser({
        uid: userCredential.user.uid,
        username: userData.username,
        isAdmin: userData.isAdmin || false,
        isApproved: userData.isApproved
      });

    } catch (error: any) {
      console.error('Error in signIn:', error);
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Muitas tentativas de login. Por favor, aguarde alguns minutos e tente novamente.');
      }
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email') {
        throw new Error('Usuário ou senha inválidos');
      }
      throw error;
    }
  };

  const signUp = async (username: string, password: string) => {
    try {
      // Verifica se o usuário já existe
      const usersRef = collection(db, 'users');
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);
      const exists = querySnapshot.docs.some(doc => doc.data().username === username);
      
      if (exists) {
        throw new Error('Nome de usuário já está em uso');
      }

      // Cria o usuário no Authentication
      const email = `${username}@user.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Cria o documento do usuário no Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username,
        isAdmin: false,
        isApproved: false,
        createdAt: new Date().toISOString()
      });

      // Inicializa os dados do usuário
      await setDoc(doc(db, 'userData', userCredential.user.uid), {
        transactions: [],
        categories: []
      });

    } catch (error: any) {
      console.error('Error in signUp:', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Nome de usuário já está em uso');
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (user?.isAdmin) {
        // Para admin, apenas limpa o estado
        setUser(null);
        setUserData(null);
      } else {
        // Para usuários regulares, faz logout do Firebase
        await firebaseSignOut(auth);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getUserData = () => userData;

  const updateUserData = async (data: { transactions?: Transaction[]; categories?: Category[]; }) => {
    if (!user) return;

    try {
      const updatedData = {
        ...(userData || { transactions: [], categories: [] }),
        ...data
      };

      await updateDoc(doc(db, 'userData', user.uid), updatedData);
      setUserData(updatedData);
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      signIn, 
      signUp, 
      signOut,
      getUserData,
      updateUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

export const approveUser = async (uid: string) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      isApproved: true
    });
  } catch (error) {
    console.error('Error approving user:', error);
    throw error;
  }
};

export const disapproveUser = async (uid: string) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      isApproved: false
    });
  } catch (error) {
    console.error('Error disapproving user:', error);
    throw error;
  }
};