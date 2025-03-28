import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  deleteUser as firebaseDeleteUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc,
  setDoc,
  collection,
  query,
  getDocs,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Transaction, Category } from '../types';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, addDays } from 'date-fns';

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
  signOut: () => Promise<void>;
  getUserData: () => { transactions: Transaction[]; categories: Category[]; } | null;
  updateUserData: (data: { transactions?: Transaction[]; categories?: Category[]; }) => Promise<void>;
  updateUsername: (newUsername: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded admin credentials
const ADMIN_CREDENTIALS = {
  username: 'januzzi',
  password: 'januzzi@!'
};

// Storage keys
const USER_STORAGE_KEY = 'jf_user';
const USER_DATA_STORAGE_KEY = 'jf_user_data';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [userData, setUserData] = useState<UserData | null>(() => {
    const storedData = localStorage.getItem(USER_DATA_STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : null;
  });
  const navigate = useNavigate();

  // Effect to persist user state
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  // Effect to persist user data
  useEffect(() => {
    if (userData) {
      localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(USER_DATA_STORAGE_KEY);
    }
  }, [userData]);

  // Check user access status
  const checkUserAccess = async (userDoc: any) => {
    const createdAt = new Date(userDoc.createdAt);
    const now = new Date();
    const daysSinceCreation = differenceInDays(now, createdAt);

    // If user has no access expiration date and account is older than 30 days
    if (!userDoc.accessExpirationDate && daysSinceCreation > 30) {
      await updateDoc(doc(db, 'users', userDoc.uid), {
        isApproved: false
      });
      return false;
    }

    // If user has access expiration date and it has expired
    if (userDoc.accessExpirationDate) {
      const expirationDate = new Date(userDoc.accessExpirationDate);
      if (now > expirationDate) {
        await updateDoc(doc(db, 'users', userDoc.uid), {
          isApproved: false
        });
        return false;
      }
    }

    return userDoc.isApproved;
  };

  // Periodic check for user access status
  useEffect(() => {
    if (!user?.isAdmin && user?.uid) {
      const checkAccess = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const hasAccess = await checkUserAccess(userDoc.data());
          if (!hasAccess && user.isApproved) {
            await firebaseSignOut(auth);
            setUser(null);
            setUserData(null);
            navigate('/login');
          }
        }
      };

      // Check immediately and then every hour
      checkAccess();
      const interval = setInterval(checkAccess, 3600000); // 1 hour

      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && !user?.isAdmin) {
        try {
          if (user?.uid === firebaseUser.uid) {
            return;
          }

          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Check access status
            const hasAccess = await checkUserAccess(userData);
            
            const newUser = {
              uid: firebaseUser.uid,
              username: userData.username,
              isAdmin: userData.isAdmin || false,
              isApproved: hasAccess
            };
            setUser(newUser);

            if (!hasAccess) {
              await firebaseSignOut(auth);
              setUser(null);
              setUserData(null);
              navigate('/login');
              return;
            }

            const userDataDoc = await getDoc(doc(db, 'userData', firebaseUser.uid));
            if (userDataDoc.exists()) {
              const newUserData = userDataDoc.data() as UserData;
              setUserData(newUserData);
            } else {
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
      }
    });

    return () => unsubscribe();
  }, [user]);

  const updateUsername = async (newUsername: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    if (user.isAdmin) throw new Error('Não é possível alterar o nome do administrador');

    try {
      // Check if username is already taken
      const usersRef = collection(db, 'users');
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);
      const exists = querySnapshot.docs.some(doc => 
        doc.data().username === newUsername && doc.id !== user.uid
      );
      
      if (exists) {
        throw new Error('Nome de usuário já está em uso');
      }

      // Update username in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        username: newUsername
      });

      // Update local state
      setUser(prev => prev ? { ...prev, username: newUsername } : null);

    } catch (error) {
      console.error('Error updating username:', error);
      throw error;
    }
  };

  const signIn = async (username: string, password: string, isAdminLogin?: boolean) => {
    try {
      if (isAdminLogin) {
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
          const adminUser = {
            uid: 'admin',
            username: ADMIN_CREDENTIALS.username,
            isAdmin: true,
            isApproved: true
          };
          setUser(adminUser);
          setUserData({ transactions: [], categories: [] });
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(adminUser));
          localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify({ transactions: [], categories: [] }));
          return;
        }
        throw new Error('Credenciais de administrador inválidas');
      }

      const email = `${username}@user.com`;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        await firebaseSignOut(auth);
        throw new Error('Usuário não encontrado');
      }

      const userDocData = userDoc.data();
      
      // Check access status
      const hasAccess = await checkUserAccess(userDocData);
      
      if (!hasAccess) {
        await firebaseSignOut(auth);
        throw new Error('Sua conta está bloqueada. Entre em contato com o administrador.');
      }

      const newUser = {
        uid: userCredential.user.uid,
        username: userDocData.username,
        isAdmin: userDocData.isAdmin || false,
        isApproved: hasAccess
      };
      setUser(newUser);

      const userDataDoc = await getDoc(doc(db, 'userData', userCredential.user.uid));
      if (userDataDoc.exists()) {
        setUserData(userDataDoc.data() as UserData);
      }

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
      const usersRef = collection(db, 'users');
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);
      const exists = querySnapshot.docs.some(doc => doc.data().username === username);
      
      if (exists) {
        throw new Error('Nome de usuário já está em uso');
      }

      const email = `${username}@user.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username,
        isAdmin: false,
        isApproved: false,
        createdAt: new Date().toISOString()
      });

      const initialUserData = { transactions: [], categories: [] };
      await setDoc(doc(db, 'userData', userCredential.user.uid), initialUserData);

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
      if (!user?.isAdmin) {
        await firebaseSignOut(auth);
      }
      
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(USER_DATA_STORAGE_KEY);
      
      setUser(null);
      setUserData(null);
      
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
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

      if (!user.isAdmin) {
        await updateDoc(doc(db, 'userData', user.uid), updatedData);
      }
      
      setUserData(updatedData);
      localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(updatedData));
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
      updateUserData,
      updateUsername
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

export const approveUser = async (uid: string, duration: number) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('Usuário não encontrado');
    }

    const userData = userDoc.data();
    const currentDate = new Date();
    let newExpirationDate: Date;

    if (userData.accessExpirationDate) {
      // If user already has an expiration date, add days to it
      const currentExpiration = new Date(userData.accessExpirationDate);
      if (currentExpiration > currentDate) {
        // If current expiration is in the future, add days to it
        newExpirationDate = addDays(currentExpiration, duration);
      } else {
        // If current expiration is in the past, add days from now
        newExpirationDate = addDays(currentDate, duration);
      }
    } else {
      // If user doesn't have an expiration date, set it from now
      newExpirationDate = addDays(currentDate, duration);
    }

    await updateDoc(userRef, {
      isApproved: true,
      accessExpirationDate: newExpirationDate.toISOString(),
      accessDuration: duration
    });
  } catch (error) {
    console.error('Error approving user:', error);
    throw error;
  }
};

export const disapproveUser = async (uid: string) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      isApproved: false,
      accessExpirationDate: null,
      accessDuration: null
    });
  } catch (error) {
    console.error('Error disapproving user:', error);
    throw error;
  }
};

export const deleteUser = async (uid: string) => {
  try {
    // Delete user data from Firestore
    await deleteDoc(doc(db, 'users', uid));
    await deleteDoc(doc(db, 'userData', uid));

    // Delete user from Firebase Auth
    const user = auth.currentUser;
    if (user && user.uid === uid) {
      await firebaseDeleteUser(user);
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};