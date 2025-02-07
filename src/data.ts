import { Transaction, Category } from './types';

export const defaultCategories: Category[] = [
  { id: '1', name: 'Alimentação', color: '#FF6B6B' },
  { id: '2', name: 'Transporte', color: '#4ECDC4' },
  { id: '3', name: 'Moradia', color: '#45B7D1' },
  { id: '4', name: 'Lazer', color: '#96CEB4' },
  { id: '5', name: 'Saúde', color: '#FFEEAD' },
  { id: '6', name: 'Educação', color: '#D4A5A5' },
  { id: '7', name: 'Outros', color: '#9B9B9B' }
];

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    description: 'Salário',
    amount: 5000,
    category: 'Renda',
    date: '2024-03-05',
    type: 'income'
  },
  {
    id: '2',
    description: 'Aluguel',
    amount: 1200,
    category: 'Moradia',
    date: '2024-03-10',
    type: 'expense'
  },
  {
    id: '3',
    description: 'Supermercado',
    amount: 500,
    category: 'Alimentação',
    date: '2024-03-15',
    type: 'expense'
  },
  {
    id: '4',
    description: 'Uber',
    amount: 100,
    category: 'Transporte',
    date: '2024-03-18',
    type: 'expense'
  },
  {
    id: '5',
    description: 'Freelance',
    amount: 2000,
    category: 'Renda',
    date: '2024-03-20',
    type: 'income'
  }
];