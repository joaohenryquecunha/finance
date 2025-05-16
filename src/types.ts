export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense' | 'investment';
  companyId?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  userId: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  cpf: string;
  phone: string;
}

export interface User {
  uid: string;
  username: string;
  isAdmin: boolean;
  isApproved: boolean;
  accessDuration?: number;
  createdAt?: string;
  profile?: UserProfile;
}