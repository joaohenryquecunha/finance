import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function isEmailInUse(email: string, excludeUid?: string): Promise<boolean> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('profile.email', '==', email));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return false;
  // Se for para edição, permite o próprio usuário
  if (excludeUid) {
    return snapshot.docs.some(doc => doc.id !== excludeUid);
  }
  return true;
}
