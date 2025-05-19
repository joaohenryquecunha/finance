import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { 
  doc, 
  getDoc,
  setDoc,
  collection,
  query,
  getDocs,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Transaction, Category, UserProfile } from '../types';
import { useNavigate } from 'react-router-dom';

interface User {
  uid: string;
  username: string;
  isAdmin: boolean;
  isApproved: boolean;
  accessDuration?: number;
  createdAt?: string;
  profile?: UserProfile;
}

interface UserData {
  transactions: Transaction[];
  categories: Category[];
}

interface AuthContextType {
  user: User | null;
  signIn: (username: string, password: string, isAdminLogin?: boolean) => Promise<void>;
  signUp: (username: string, password: string, profile: UserProfile) => Promise<void>;
  signOut: () => Promise<void>;
  getUserData: () => { transactions: Transaction[]; categories: Category[]; } | null;
  updateUserData: (data: { transactions?: Transaction[]; categories?: Category[]; }) => Promise<void>;
  updateUsername: (newUsername: string) => Promise<void>;
  updateUserProfile: (profile: UserProfile) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  checkAccessExpiration: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin credentials from environment variables
const ADMIN_CREDENTIALS = {
  username: import.meta.env.VITE_ADMIN_USERNAME,
  password: import.meta.env.VITE_ADMIN_PASSWORD
};

// Storage keys
const USER_STORAGE_KEY = 'jf_user';
const USER_DATA_STORAGE_KEY = 'jf_user_data';

// Helper function to remove undefined values from an object
const removeUndefinedValues = (obj: Record<string, any>): Record<string, any> => {
  const cleanObj = { ...obj };
  Object.keys(cleanObj).forEach(key => {
    if (cleanObj[key] === undefined) {
      delete cleanObj[key];
    } else if (Array.isArray(cleanObj[key])) {
      cleanObj[key] = cleanObj[key].map((item: any) => 
        typeof item === 'object' && item !== null ? removeUndefinedValues(item) : item
      );
    } else if (typeof cleanObj[key] === 'object' && cleanObj[key] !== null) {
      cleanObj[key] = removeUndefinedValues(cleanObj[key]);
    }
  });
  return cleanObj;
};

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

  // Effect to observe user document changes
  useEffect(() => {
    if (!user?.uid || user.isAdmin) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (
          user.accessDuration !== userData.accessDuration ||
          user.isApproved !== userData.isApproved
        ) {
          const updatedUser = {
            ...user,
            accessDuration: userData.accessDuration,
            isApproved: userData.isApproved
          };
          setUser(updatedUser);

          // If accessDuration changed, redirect to success page
          if (userData.accessDuration !== user.accessDuration) {
            navigate(`/dashboard?payment_success=true&access_duration=${userData.accessDuration}`);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [user, navigate]);

  // --- Funções signOut e checkAccessExpiration ---
  const checkAccessExpiration = () => {
    if (!user || user.isAdmin) return false;
    if (user.isApproved) return false;
    if (!user.accessDuration || !user.createdAt) return true;
    const startTime = new Date(user.createdAt).getTime();
    const now = new Date().getTime();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    return elapsedSeconds >= user.accessDuration;
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

  // --- useEffect que depende de signOut e checkAccessExpiration ---
  useEffect(() => {
    if (!user || user.isAdmin) return;

    const checkAccess = () => {
      if (checkAccessExpiration()) {
        signOut();
      }
    };

    const interval = setInterval(checkAccess, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user, checkAccessExpiration, signOut]);

  // Effect to sync with Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && !user?.isAdmin) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Check if access has expired
            if (!userData.isAdmin && (!userData.accessDuration || !userData.createdAt)) {
              await firebaseSignOut(auth);
              setUser(null);
              setUserData(null);
              navigate('/login?expired=true');
              return;
            }

            // Check if elapsed time exceeds duration
            if (!userData.isAdmin && userData.accessDuration && userData.createdAt) {
              const startTime = new Date(userData.createdAt).getTime();
              const now = new Date().getTime();
              const elapsedSeconds = Math.floor((now - startTime) / 1000);
              
              if (elapsedSeconds >= userData.accessDuration && !userData.isApproved) {
                await firebaseSignOut(auth);
                setUser(null);
                setUserData(null);
                navigate('/login?expired=true');
                return;
              }
            }

            const newUser = {
              uid: firebaseUser.uid,
              username: userData.username,
              isAdmin: userData.isAdmin || false,
              isApproved: userData.isApproved || false,
              accessDuration: userData.accessDuration,
              createdAt: userData.createdAt,
              profile: userData.profile
            };
            setUser(newUser);

            // Set up real-time listener for user data
            const userDataRef = doc(db, 'userData', firebaseUser.uid);
            const unsubscribeUserData = onSnapshot(userDataRef, (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data() as UserData;
                setUserData(data);
                localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(data));
              }
            });

            return () => unsubscribeUserData();
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
  }, [user, navigate]);

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

      // Check if access duration is defined
      if (!userDocData.isAdmin && (!userDocData.accessDuration || !userDocData.createdAt)) {
        await firebaseSignOut(auth);
        navigate('/login?expired=true');
        throw new Error('Seu período de acesso expirou');
      }

      // Check if access has expired
      if (!userDocData.isAdmin && userDocData.accessDuration && userDocData.createdAt) {
        const startTime = new Date(userDocData.createdAt).getTime();
        const now = new Date().getTime();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        
        if (elapsedSeconds >= userDocData.accessDuration && !userDocData.isApproved) {
          await firebaseSignOut(auth);
          navigate('/login?expired=true');
          throw new Error('Seu período de acesso expirou');
        }
      }

      const newUser = {
        uid: userCredential.user.uid,
        username: userDocData.username,
        isAdmin: userDocData.isAdmin || false,
        isApproved: userDocData.isApproved || false,
        accessDuration: userDocData.accessDuration,
        createdAt: userDocData.createdAt,
        profile: userDocData.profile
      };
      setUser(newUser);

      // Set up real-time listener for user data
      const userDataRef = doc(db, 'userData', userCredential.user.uid);
      const unsubscribe = onSnapshot(userDataRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserData;
          setUserData(data);
          localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(data));
        }
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

  const signUp = async (username: string, password: string, profile: UserProfile) => {
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

      const accessDuration = 30 * 24 * 60 * 60; // 30 days in seconds

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username,
        isAdmin: false,
        isApproved: true,
        accessDuration,
        profile,
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

  const updateUserData = async (data: { transactions?: Transaction[]; categories?: Category[]; }) => {
    if (!user) return;

    try {
      const updatedData = {
        ...(userData || { transactions: [], categories: [] }),
        ...data
      };

      // Remove any undefined values from the data
      const cleanData = removeUndefinedValues(updatedData);

      if (!user.isAdmin) {
        const userDataRef = doc(db, 'userData', user.uid);
        await updateDoc(userDataRef, cleanData);
      }
      
      setUserData(cleanData as UserData);
      localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(cleanData));
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  };

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

  const updateUserProfile = async (profile: UserProfile) => {
    if (!user) throw new Error('Usuário não autenticado');
    if (user.isAdmin) throw new Error('Não é possível atualizar perfil do administrador');

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { profile });
      setUser(prev => prev ? { ...prev, profile } : null);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error('Usuário não autenticado');
    if (user.isAdmin) throw new Error('Não é possível alterar a senha do administrador');

    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('Usuário não autenticado');

      const email = `${user.username}@user.com`;
      const credential = EmailAuthProvider.credential(email, currentPassword);
      
      // Reautenticate user
      await reauthenticateWithCredential(firebaseUser, credential);
      
      // Update password
      await updatePassword(firebaseUser, newPassword);
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        throw new Error('Senha atual incorreta');
      }
      throw new Error('Erro ao atualizar senha');
    }
  };

  const getUserData = () => userData;

  return (
    <AuthContext.Provider value={{ 
      user, 
      signIn, 
      signUp, 
      signOut,
      getUserData,
      updateUserData,
      updateUsername,
      updateUserProfile,
      updatePassword: updateUserPassword,
      checkAccessExpiration
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

export const updateUserAccess = async (uid: string, accessDuration: number) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      accessDuration,
      createdAt: new Date().toISOString() // Reset the start time when updating access duration
    });
  } catch (error) {
    console.error('Error updating user access:', error);
    throw error;
  }
};