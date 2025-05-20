import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const removeUndefinedValues = (obj: Record<string, any>): Record<string, any> => {
  const cleanObj: Record<string, any> = { ...obj };
  Object.keys(cleanObj).forEach((key) => {
    if (cleanObj[key] === undefined) {
      delete cleanObj[key];
    } else if (Array.isArray(cleanObj[key])) {
      cleanObj[key] = cleanObj[key].map((item) =>
        typeof item === 'object' && item !== null ? removeUndefinedValues(item) : item
      );
    }
  });
  return cleanObj;
};

export const updateUserAccess = async (uid: string, accessDuration: number) => {
  const userDataRef = doc(db, 'users', uid);
  await updateDoc(userDataRef, { accessDuration });
};

export const getAllUsers = async () => {
  const usersCollection = collection(db, 'users');
  const usersSnapshot = await getDocs(usersCollection);
  return usersSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      uid: data.uid || '',
      username: data.username || '',
      isAdmin: data.isAdmin || false,
      isApproved: data.isApproved || false,
      accessDuration: data.accessDuration || 0,
      createdAt: data.createdAt || '',
      profile: data.profile || { cpf: '', phone: '' },
    };
  });
};
