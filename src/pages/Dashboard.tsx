import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardCard } from '../components/DashboardCard';
import { TransactionList } from '../components/TransactionList';
import { TransactionForm } from '../components/TransactionForm';
import { CategoryManager } from '../components/CategoryManager';
import { ExpenseChart } from '../components/ExpenseChart';
import { ReportGenerator } from '../components/ReportGenerator';
import { FinancialHealthChart } from '../components/FinancialHealthChart';
import { defaultCategories } from '../data';
import { Transaction, Category } from '../types';
import { LogOut, Wallet, TrendingUp, TrendingDown, Settings, Menu } from 'lucide-react';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

type DateFilter = 'day' | 'month' | 'year';

const TIMEZONE = 'America/Sao_Paulo';

export const Dashboard: React.FC = () => {
  const { user, signOut, getUserData, updateUserData } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });

  useEffect(() => {
    const userData = getUserData();
    if (userData) {
      setTransactions(userData.transactions || []);
      setCategories(userData.categories.length > 0 ? userData.categories : defaultCategories);
    }
  }, []);

  const getDateRange = (date: Date, filter: DateFilter) => {
    const zonedDate = utcToZonedTime(date, TIMEZONE);
    
    switch (filter) {
      case 'day':
        return {
          start: zonedTimeToUtc(startOfDay(zonedDate), TIMEZONE),
          end: zonedTimeToUtc(endOfDay(zonedDate), TIMEZONE)
        };
      case 'month':
        return {
          start: zonedTimeToUtc(startOfMonth(zonedDate), TIMEZONE),
          end: zonedTimeToUtc(endOfMonth(zonedDate), TIMEZONE)
        };
      case 'year':
        return {
          start: zonedTimeToUtc(startOfYear(zonedDate), TIMEZONE),
          end: zonedTimeToUtc(endOfYear(zonedDate), TIMEZONE)
        };
    }
  };

  const handleAddTransaction = (newTransaction: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTransaction,
      id: Math.random().toString(36).substr(2, 9)
    };
    const updatedTransactions = [transaction, ...transactions];
    setTransactions(updatedTransactions);
    updateUserData({ transactions: updatedTransactions });
  };

  const handleAddCategory = (newCategory: Omit<Category, 'id'>) => {
    const category: Category = {
      ...newCategory,
      id: Math.random().toString(36).substr(2, 9)
    };
    const updatedCategories = [...categories, category];
    setCategories(updatedCategories);
    updateUserData({ categories: updatedCategories });
  };

  const handleDeleteCategory = (categoryId: string) => {
    const updatedCategories = categories.filter(category => category.id !== categoryId);
    setCategories(updatedCategories);
    updateUserData({ categories: updatedCategories });
  };

  const getFilteredTransactions = () => {
    const range = getDateRange(selectedDate, dateFilter);
    return transactions.filter(transaction => {
      const transactionDate = utcToZonedTime(parseISO(transaction.date), TIMEZONE);
      const startDate = utcToZonedTime(range.start, TIMEZONE);
      const endDate = utcToZonedTime(range.end, TIMEZONE);
      
      return isWithinInterval(transactionDate, { 
        start: startDate,
        end: endDate
      });
    });
  };

  const calculateBalance = () => {
    const filteredTransactions = getFilteredTransactions();
    return filteredTransactions.reduce((acc, transaction) => {
      return transaction.type === 'income'
        ? acc + transaction.amount
        : acc - transaction.amount;
    }, 0);
  };

  const calculateTotalIncome = () => {
    const filteredTransactions = getFilteredTransactions();
    return filteredTransactions.reduce((acc, transaction) => {
      return transaction.type === 'income'
        ? acc + transaction.amount
        : acc;
    }, 0);
  };

  const calculateTotalExpenses = () => {
    const filteredTransactions = getFilteredTransactions();
    return filteredTransactions.reduce((acc, transaction) => {
      return transaction.type === 'expense'
        ? acc + transaction.amount
        : acc;
    }, 0);
  };

  const dateRange = getDateRange(selectedDate, dateFilter);

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Mobile Header */}
      <div className="lg:hidden bg-dark-secondary px-4 py-3 fixed top-0 left-0 right-0 z-50 shadow-gold-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-dark-tertiary p-2 rounded-full">
              <Wallet className="w-5 h-5 text-gold-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gold-primary">
                Olá, {user?.username}
              </h1>
              <p className="text-xs text-gray-400">
                Bem-vindo ao seu painel
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 text-gray-400 hover:text-gold-primary"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="absolute top-full left-0 right-0 bg-dark-secondary border-t border-dark-tertiary py-2 px-4 shadow-gold-sm">
            <button
              onClick={() => {
                setShowCategoryManager(true);
                setShowMobileMenu(false);
              }}
              className="w-full text-left py-3 px-4 rounded-lg hover:bg-dark-tertiary transition-colors flex items-center gap-2 text-gray-300"
            >
              <Settings size={20} />
              <span>Gerenciar Categorias</span>
            </button>
            <ReportGenerator
              transactions={transactions}
              categories={categories}
              className="w-full text-left py-3 px-4 rounded-lg hover:bg-dark-tertiary transition-colors flex items-center gap-2 text-gray-300"
            />
            <button
              onClick={signOut}
              className="w-full text-left py-3 px-4 rounded-lg hover:bg-dark-tertiary transition-colors flex items-center gap-2 text-gray-300"
            >
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-6 pt-20 lg:pt-6">
        {/* Transaction Form */}
        <TransactionForm
          onAddTransaction={handleAddTransaction}
          categories={categories}
        />

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <DashboardCard
            title="Saldo Total"
            value={calculateBalance()}
            icon={Wallet}
            type="balance"
          />
          <DashboardCard
            title="Receitas"
            value={calculateTotalIncome()}
            icon={TrendingUp}
            type="income"
            trend={12}
          />
          <DashboardCard
            title="Despesas"
            value={calculateTotalExpenses()}
            icon={TrendingDown}
            type="expense"
            trend={-5}
          />
        </div>

        {/* Financial Health Chart */}
        <div className="mb-6">
          <FinancialHealthChart transactions={transactions} />
        </div>

        {/* Charts and Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpenseChart
            transactions={transactions}
            categories={categories}
            dateFilter={dateFilter}
            selectedDate={selectedDate}
            dateRange={dateRange}
            onDateFilterChange={setDateFilter}
            onSelectedDateChange={setSelectedDate}
          />
          <TransactionList 
            transactions={transactions}
            dateRange={dateRange}
          />
        </div>

        {/* Category Manager Modal */}
        {showCategoryManager && (
          <CategoryManager
            categories={categories}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onClose={() => setShowCategoryManager(false)}
          />
        )}
      </div>
    </div>
  );
};