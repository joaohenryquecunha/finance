import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardCard } from '../components/DashboardCard';
import { TransactionList } from '../components/TransactionList';
import { TransactionForm } from '../components/TransactionForm';
import { CategoryManager } from '../components/CategoryManager';
import { ExpenseChart } from '../components/ExpenseChart';
import { ReportGenerator } from '../components/ReportGenerator';
import { FinancialHealthChart } from '../components/FinancialHealthChart';
import { ProfileEditor } from '../components/ProfileEditor';
import { UserProfileModal } from '../components/UserProfileModal';
import { AccessCountdown } from '../components/AccessCountdown';
import { RenewalModal } from '../components/RenewalModal';
import { PaymentSuccessModal } from '../components/PaymentSuccessModal';
import { defaultCategories } from '../data';
import { Transaction, Category, Company } from '../types';
import { LogOut, Wallet, TrendingUp, TrendingDown, Settings, Menu, UserCircle, Pencil, DollarSign, Building2, Landmark, FileDown, X, Play } from 'lucide-react';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getDiasRestantes } from '../utils/access';

type DateFilter = 'day' | 'month' | 'year';

const TIMEZONE = 'America/Sao_Paulo';

export const Dashboard: React.FC = () => {
  const { user, signOut, getUserData, updateUserData, updateUsername, updateUserProfile, updatePassword, checkAccessExpiration } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [showProfileModal, setShowProfileModal] = useState(
    (!user?.profile || !user?.profile.email) && !user?.isAdmin
  );
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // Estado para controlar o drop do relógio no mobile
  const [showMobileAccessDrop, setShowMobileAccessDrop] = useState(false);
  // Estado para modal de filtro de relatório
  const [showReportModal, setShowReportModal] = useState(false);
  const [canGenerateReport, setCanGenerateReport] = useState(false);
  const currentYear = new Date().getFullYear();
  const [yearGridStart, setYearGridStart] = useState(currentYear); // Corrige tela preta no modal de relatório
  const [reportFilter, setReportFilter] = useState<'month' | 'year'>('month');
  const [selectedReportMonth, setSelectedReportMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  }); // yyyy-MM já inicia com mês atual
  const [selectedReportYear, setSelectedReportYear] = useState<string>(String(currentYear)); // ano atual
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  const [cardsData, setCardsData] = useState({
    balance: 0,
    income: { amount: 0, trend: 0 },
    expenses: { amount: 0, trend: 0 },
    investments: { amount: 0, trend: 0 }
  });

  useEffect(() => {
    if (reportFilter === 'month') {
      setCanGenerateReport(!!selectedReportMonth);
    } else {
      setCanGenerateReport(!!selectedReportYear);
    }
  }, [reportFilter, selectedReportMonth, selectedReportYear]);

  useEffect(() => {
    if (!user || user.isAdmin) return;
    
    const isExpired = checkAccessExpiration();
    if (isExpired) {
      setShowRenewalModal(true);
    }
  }, [user, checkAccessExpiration]);

  useEffect(() => {
    const userData = getUserData();
    if (userData) {
      setTransactions(userData.transactions || []);
      setCategories(userData.categories.length > 0 ? userData.categories : defaultCategories);
    }
  }, [getUserData]);

  // Corrigir dependências do fetchCompanies
  const fetchCompanies = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const companiesRef = collection(db, 'companies');
      const q = query(companiesRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const companiesData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          cnpj: data.cnpj || '',
          userId: data.userId || '',
          createdAt: data.createdAt || new Date().toISOString()
        };
      });
      setCompanies(companiesData);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    }
  }, [user?.uid]); // Corrigido: depende apenas de user?.uid

  useEffect(() => {
    if (user?.uid) {
      fetchCompanies();
    }
  }, [user?.uid, fetchCompanies]); // Corrigido: depende apenas de user?.uid

  useEffect(() => {
    if (user && !user.isAdmin && (!user.profile || !user.profile.email)) {
      setShowProfileModal(true);
    }
  }, [user]);

  useEffect(() => {
    const paymentSuccess = searchParams.get('payment_success');
    const accessDuration = searchParams.get('access_duration');
    
    if (paymentSuccess === 'true' && accessDuration) {
      setShowPaymentSuccess(true);
      navigate('/dashboard', { replace: true });
    }
  }, [searchParams, navigate]);

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

  // Atualizar getFilteredTransactions para aceitar selectedMonth
  const getFilteredTransactions = useCallback((monthStr?: string) => {
    let dateToUse = new Date();
    if (monthStr) {
      const [year, month] = monthStr.split('-').map(Number);
      dateToUse = new Date(year, month - 1, 1);
    }
    const range = getDateRange(dateToUse, dateFilter);
    return transactions.filter(transaction => {
      const transactionDate = utcToZonedTime(parseISO(transaction.date), TIMEZONE);
      const startDate = utcToZonedTime(range.start, TIMEZONE);
      const endDate = utcToZonedTime(range.end, TIMEZONE);
      return isWithinInterval(transactionDate, { 
        start: startDate,
        end: endDate
      });
    });
  }, [transactions, dateFilter]);

  // income, expenses e investments precisam ser recalculados sempre que filteredTransactions mudar
  // Mover calculateTrend para useCallback para não causar dependência mutável
  const calculateTrend = useCallback((currentAmount: number, type: 'income' | 'expense' | 'investment') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const previousMonth = new Date(year, month - 2, 1); // mês anterior
    const previousMonthStr = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;
    const previousTransactions = getFilteredTransactions(previousMonthStr);
    const previousAmount = previousTransactions.reduce((acc, transaction) => 
      transaction.type === type ? acc + transaction.amount : acc, 0);
    if (previousAmount === 0) return currentAmount > 0 ? 100 : 0;
    return Math.round(((currentAmount - previousAmount) / previousAmount) * 100);
  }, [selectedMonth, getFilteredTransactions]);

  // Calcule dateRange e filteredTransactionsByRange no escopo principal
  const dateRange = getDateRange(new Date(Number(selectedMonth.split('-')[0]), Number(selectedMonth.split('-')[1]) - 1, 1), dateFilter);
  const filteredTransactionsByRange = transactions.filter(transaction => {
    const transactionDate = utcToZonedTime(parseISO(transaction.date), TIMEZONE);
    const startDate = utcToZonedTime(dateRange.start, TIMEZONE);
    const endDate = utcToZonedTime(dateRange.end, TIMEZONE);
    return isWithinInterval(transactionDate, { start: startDate, end: endDate });
  });

  useEffect(() => {
    // Calcule filteredTransactionsByRange dentro do efeito para garantir dependências estáveis
    const dateRange = getDateRange(new Date(Number(selectedMonth.split('-')[0]), Number(selectedMonth.split('-')[1]) - 1, 1), dateFilter);
    const filteredTransactionsByRange = transactions.filter(transaction => {
      const transactionDate = utcToZonedTime(parseISO(transaction.date), TIMEZONE);
      const startDate = utcToZonedTime(dateRange.start, TIMEZONE);
      const endDate = utcToZonedTime(dateRange.end, TIMEZONE);
      return isWithinInterval(transactionDate, { start: startDate, end: endDate });
    });
    setCardsData({
      balance: filteredTransactionsByRange.reduce((acc, transaction)  => {
        return transaction.type === 'income'
          ? acc + transaction.amount
          : acc - transaction.amount;
      }, 0),
      income: (() => {
        const total = filteredTransactionsByRange.reduce((acc, transaction) => {
          return transaction.type === 'income'
            ? acc + transaction.amount
            : acc;
        }, 0);
        return {
          amount: total,
          trend: calculateTrend(total, 'income')
        };
      })(),
      expenses: (() => {
        const total = filteredTransactionsByRange.reduce((acc, transaction) => {
          return transaction.type === 'expense'
            ? acc + transaction.amount
            : acc;
        }, 0);
        return {
          amount: total,
          trend: calculateTrend(total, 'expense')
        };
      })(),
      investments: (() => {
        const total = filteredTransactionsByRange.reduce((acc, transaction) => {
          return transaction.type === 'investment'
            ? acc + transaction.amount
            : acc;
        }, 0);
        return {
          amount: total,
          trend: calculateTrend(total, 'investment')
        };
      })()
    });
  }, [transactions, selectedMonth, dateFilter, calculateTrend]);

  const handleAddTransaction = async (newTransaction: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTransaction,
      id: Math.random().toString(36).substr(2, 9)
    };
    const updatedTransactions = [transaction, ...transactions];
    setTransactions(updatedTransactions);
    await updateUserData({ transactions: updatedTransactions });
  };

  const handleUpdateTransaction = async (updatedTransaction: Transaction) => {
    const updatedTransactions = transactions.map(t =>
      t.id === updatedTransaction.id ? updatedTransaction : t
    );
    setTransactions(updatedTransactions);
    await updateUserData({ transactions: updatedTransactions });
    setEditingTransaction(undefined);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      const updatedTransactions = transactions.filter(t => t.id !== transactionId);
      setTransactions(updatedTransactions);
      await updateUserData({ transactions: updatedTransactions });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setTransactions(transactions);
    }
  };

  const handleAddCategory = async (newCategory: Omit<Category, 'id'>) => {
    const category: Category = {
      ...newCategory,
      id: Math.random().toString(36).substr(2, 9)
    };
    const updatedCategories = [...categories, category];
    setCategories(updatedCategories);
    await updateUserData({ categories: updatedCategories });
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const updatedCategories = categories.filter(category => category.id !== categoryId);
    setCategories(updatedCategories);
    await updateUserData({ categories: updatedCategories });
  };

  // Adiciona função para editar categoria
  const handleEditCategory = async (categoryId: string, updated: { name: string; color: string }) => {
    // Atualiza a lista de categorias
    const oldCategory = categories.find(cat => cat.id === categoryId);
    if (!oldCategory) return;
    const updatedCategories = categories.map(cat =>
      cat.id === categoryId ? { ...cat, ...updated } : cat
    );
    // Atualiza todas as transações que usam o nome antigo da categoria
    const updatedTransactions = transactions.map(tx =>
      tx.category === oldCategory.name ? { ...tx, category: updated.name } : tx
    );
    setCategories(updatedCategories);
    setTransactions(updatedTransactions);
    await updateUserData({ categories: updatedCategories, transactions: updatedTransactions });
  };

  const handleUpdateUsername = async (newUsername: string) => {
    try {
      await updateUsername(newUsername);
    } catch (error) {
      console.error('Error updating username:', error);
      throw error;
    }
  };

  const handleUpdatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await updatePassword(currentPassword, newPassword);
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  };

  const handleProfileSubmit = async (data: { cpf?: string; phone?: string; email?: string }) => {
    try {
      // Preenche campos obrigatórios com string vazia se não vierem
      const profile = {
        cpf: data.cpf ?? '',
        phone: data.phone ?? '',
        email: data.email ?? ''
      };
      await updateUserProfile(profile);
      setShowProfileModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  const getRemainingDays = () => {
    if (!user?.accessDuration || !user?.createdAt) return 0;
    return getDiasRestantes(user.accessDuration, user.createdAt);
  };

  // Fecha o menu ao clicar fora
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e: MouseEvent) => {
      const menu = document.getElementById('dashboard-menu-cards');
      if (menu && !menu.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  // Bloquear scroll do body quando o menu mobile estiver aberto
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMobileMenu]);

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Navbar moderna */}
      <header className="bg-dark-secondary shadow-gold-sm border-b border-dark-tertiary">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="hidden lg:flex items-center justify-between h-20">
            {/* Esquerda: Logo e usuário */}
            <div className="flex items-center gap-6">
              <div className="bg-dark-tertiary p-3 rounded-full flex items-center justify-center">
                <Wallet className="w-7 h-7 text-gold-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400">Olá,</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-gold-primary">{user?.username}</span>
                  <button
                    onClick={() => setShowProfileEditor(true)}
                    className="p-1 text-gray-400 hover:text-gold-primary transition-colors"
                    title="Editar perfil"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Centro: Acesso e renovação */}
            <div className="hidden lg:flex items-center gap-4">
              {!user?.isAdmin && user?.accessDuration && user?.createdAt && (
                <AccessCountdown
                  accessDuration={user.accessDuration}
                  createdAt={user.createdAt}
                  onRenew={() => setShowRenewalModal(true)}
                />
              )}
            </div>

            {/* Direita: Menu drop em cards */}
            <div className="relative">
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 bg-dark-tertiary text-gray-300 rounded-lg hover:text-gold-primary hover:bg-dark-primary transition-colors border border-dark-terciary shadow-sm lg:px-3 lg:py-2"
                aria-label="Abrir menu"
              >
                <Menu size={26} />
                <span className="hidden lg:inline text-base font-medium">Menu</span>
              </button>
              {showMenu && (
                <div
                  id="dashboard-menu-cards"
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                  onClick={e => {
                    if (e.target === e.currentTarget) setShowMenu(false);
                  }}
                >
                  <div className="relative max-w-md md:max-w-2xl w-full mx-4 animate-fade-in">
                    <div className="bg-dark-secondary rounded-2xl shadow-2xl relative pt-14 pb-6 px-6">
                      <button
                        onClick={() => setShowMenu(false)}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gold-primary rounded-full transition-colors z-20"
                        aria-label="Fechar menu"
                      >
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        <button
                          onClick={() => { navigate('/companies'); setShowMenu(false); }}
                          className="flex flex-col items-center gap-2 p-4 md:p-6 rounded-xl bg-dark-tertiary hover:bg-gold-primary/10 transition-colors shadow-lg border border-dark-tertiary w-full"
                        >
                          <Building2 size={32} className="text-gold-primary" />
                          <span className="text-lg font-semibold text-gray-200">Empresas</span>
                        </button>
                        <button
                          onClick={() => { navigate('/goals'); setShowMenu(false); }}
                          className="flex flex-col items-center gap-2 p-4 md:p-6 rounded-xl bg-dark-tertiary hover:bg-gold-primary/10 transition-colors shadow-lg border border-dark-tertiary w-full"
                        >
                          <DollarSign size={32} className="text-gold-primary" />
                          <span className="text-lg font-semibold text-gray-200">Metas</span>
                        </button>
                        <button
                          onClick={() => { setShowCategoryManager(true); setShowMenu(false); }}
                          className="flex flex-col items-center gap-2 p-4 md:p-6 rounded-xl bg-dark-tertiary hover:bg-gold-primary/10 transition-colors shadow-lg border border-dark-tertiary w-full"
                        >
                          <Settings size={32} className="text-gold-primary" />
                          <span className="text-lg font-semibold text-gray-200">Categorias</span>
                        </button>
                        <button
                          onClick={() => setShowReportModal(true)}
                          className="flex flex-col items-center gap-2 p-4 md:p-6 rounded-xl bg-dark-tertiary hover:bg-gold-primary/10 transition-colors shadow-lg border border-dark-tertiary w-full"
                        >
                          <FileDown size={32} className="text-gold-primary" />
                          <span className="text-lg font-semibold text-gray-200">Relatórios</span>
                        </button>
                        <button
                          onClick={() => window.open('https://uzzi-finance-motion-player-06.vercel.app/', '_blank')}
                          className="flex flex-col items-center gap-2 p-4 md:p-6 rounded-xl bg-dark-tertiary hover:bg-gold-primary/10 transition-colors shadow-lg border border-dark-tertiary w-full"
                        >
                          <Play size={32} className="text-gold-primary" />
                          <span className="text-lg font-semibold text-gray-200">Tutorial e Cursos</span>
                        </button>
                        <button
                          onClick={() => { signOut(); setShowMenu(false); }}
                          className="flex flex-col items-center gap-2 p-4 md:p-6 rounded-xl bg-dark-tertiary hover:bg-red-400/10 transition-colors shadow-lg border border-dark-tertiary w-full"
                        >
                          <LogOut size={32} className="text-red-400" />
                          <span className="text-lg font-semibold text-red-400">Sair</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Header */}
      <div className="lg:hidden bg-dark-secondary px-4 py-3 fixed top-0 left-0 right-0 z-50 shadow-gold-sm">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-dark-tertiary p-2 rounded-full">
                <Wallet className="w-5 h-5 text-gold-primary" />
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <h1 className="text-lg font-bold text-gold-primary">
                    Olá, {user?.username}
                  </h1>
                  <p className="text-xs text-gray-400">
                    Bem-vindo ao seu painel
                  </p>
                </div>
                <button
                  onClick={() => setShowProfileEditor(true)}
                  className="p-1 text-gray-400 hover:text-gold-primary transition-colors"
                  title="Editar perfil"
                >
                  <Pencil size={14} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Ícone do relógio para abrir o drop do AccessCountdown */}
              {!user?.isAdmin && user?.accessDuration && user?.createdAt && (
                <button
                  onClick={() => setShowMobileAccessDrop((v) => !v)}
                  className={`p-2 hover:text-gold-primary ${getAccessCountdownColor(user.accessDuration, user.createdAt)}`}
                  aria-label="Ver tempo de acesso"
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </button>
              )}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-gray-400 hover:text-gold-primary"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
        {/* Drop do relógio no mobile */}
        {showMobileAccessDrop && (
          <div className="absolute right-4 top-16 z-50 bg-dark-secondary rounded-xl shadow-lg p-4 border border-dark-terciary animate-fade-in">
            {user?.accessDuration && user?.createdAt && (
              <AccessCountdown
                accessDuration={user.accessDuration}
                createdAt={user.createdAt}
                onRenew={() => { setShowRenewalModal(true); setShowMobileAccessDrop(false); }}
                iconClassName={getAccessCountdownColor(user.accessDuration, user.createdAt)}
              />
            )}
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gold-primary"
              onClick={() => setShowMobileAccessDrop(false)}
              aria-label="Fechar tempo de acesso"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}
        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="absolute top-full left-0 right-0 bg-dark-secondary border-t border-dark-terciary py-2 px-4 shadow-gold-sm z-40" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { navigate('/companies'); setShowMobileMenu(false); }}
                className="w-full flex flex-col items-center gap-2 py-4 rounded-xl bg-dark-tertiary hover:bg-gold-primary/10 transition-colors shadow-lg border border-dark-terciary"
              >
                <Building2 size={28} className="text-gold-primary" />
                <span className="text-base font-semibold text-gray-200">Empresas</span>
              </button>
              <button
                onClick={() => { navigate('/goals'); setShowMobileMenu(false); }}
                className="w-full flex flex-col items-center gap-2 py-4 rounded-xl bg-dark-tertiary hover:bg-gold-primary/10 transition-colors shadow-lg border border-dark-terciary"
              >
                <DollarSign size={28} className="text-gold-primary" />
                <span className="text-base font-semibold text-gray-200">Metas</span>
              </button>
              <button
                onClick={() => { setShowProfileEditor(true); setShowMobileMenu(false); }}
                className="w-full flex flex-col items-center gap-2 py-4 rounded-xl bg-dark-tertiary hover:bg-gold-primary/10 transition-colors shadow-lg border border-dark-terciary"
              >
                <UserCircle size={28} className="text-gold-primary" />
                <span className="text-base font-semibold text-gray-200">Editar Perfil</span>
              </button>
              <button
                onClick={() => { setShowCategoryManager(true); setShowMobileMenu(false); }}
                className="w-full flex flex-col items-center gap-2 py-4 rounded-xl bg-dark-tertiary hover:bg-gold-primary/10 transition-colors shadow-lg border border-dark-terciary"
              >
                <Settings size={28} className="text-gold-primary" />
                <span className="text-base font-semibold text-gray-200">Gerenciar Categorias</span>
              </button>
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full flex flex-col items-center gap-2 py-4 rounded-xl bg-dark-tertiary hover:bg-gold-primary/10 transition-colors shadow-lg border border-dark-terciary"
              >
                <FileDown size={28} className="text-gold-primary" />
                <span className="text-base font-semibold text-gray-200">Relatórios</span>
              </button>
              <button
                onClick={() => window.open('https://uzzi-finance-motion-player-06.vercel.app/', '_blank')}
                className="w-full flex flex-col items-center gap-2 py-4 rounded-xl bg-dark-tertiary hover:bg-gold-primary/10 transition-colors shadow-lg border border-dark-terciary"
              >
                <Play size={28} className="text-gold-primary" />
                <span className="text-base font-semibold text-gray-200">Tutorial e Cursos</span>
              </button>
              <button
                onClick={() => { signOut(); setShowMobileMenu(false); }}
                className="w-full flex flex-col items-center gap-2 py-4 rounded-xl bg-dark-tertiary hover:bg-red-400/10 transition-colors shadow-lg border border-dark-terciary"
              >
                <LogOut size={28} className="text-red-400" />
                <span className="text-base font-semibold text-red-400">Sair</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-6 pt-20 lg:pt-6">
        <TransactionForm
          onAddTransaction={handleAddTransaction}
          onUpdateTransaction={handleUpdateTransaction}
          categories={categories}
          companies={companies}
          editingTransaction={editingTransaction}
          onClose={() => setEditingTransaction(undefined)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <DashboardCard
            title="Saldo Total"
            value={cardsData.balance}
            icon={Wallet}
            type="balance"
          />
          <DashboardCard
            title="Receitas"
            value={cardsData.income.amount}
            icon={TrendingUp}
            type="income"
            trend={cardsData.income.trend}
          />
          <DashboardCard
            title="Despesas"
            value={cardsData.expenses.amount}
            icon={TrendingDown}
            type="expense"
            trend={cardsData.expenses.trend}
          />
          <DashboardCard
            title="Investimentos"
            value={cardsData.investments.amount}
            icon={Landmark}
            type="investment"
            trend={cardsData.investments.trend}
          />
        </div>

        <div className="mb-6">
          <FinancialHealthChart 
            transactions={transactions}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpenseChart
            transactions={transactions}
            categories={categories}
            dateFilter={dateFilter}
            dateRange={dateRange}
            onDateFilterChange={setDateFilter}
          />
          <TransactionList 
            transactions={transactions}
            dateRange={dateRange}
            onEditTransaction={setEditingTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        </div>

        {showCategoryManager && (
          <CategoryManager
            categories={categories}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onEditCategory={handleEditCategory}
            onClose={() => setShowCategoryManager(false)}
          />
        )}

        {showProfileEditor && (
          <ProfileEditor
            currentUsername={user?.username || ''}
            onUpdateUsername={handleUpdateUsername}
            onUpdatePassword={handleUpdatePassword}
            onClose={() => setShowProfileEditor(false)}
          />
        )}

        {showProfileModal && (
          <UserProfileModal
            onSubmit={handleProfileSubmit}
            initialProfile={{
              cpf: user?.profile?.cpf || '',
              phone: user?.profile?.phone || '',
              email: user?.profile?.email || ''
            }}
          />
        )}

        {showRenewalModal && (
          <RenewalModal
            onClose={() => setShowRenewalModal(false)}
            daysRemaining={getRemainingDays()}
          />
        )}

        {showPaymentSuccess && user?.accessDuration && (
          <PaymentSuccessModal
            onClose={() => setShowPaymentSuccess(false)}
            accessDuration={user.accessDuration}
          />
        )}

        {/* Modal de filtro de relatório */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-dark-secondary rounded-2xl shadow-2xl p-6 w-full max-w-xs relative">
              <button
                onClick={() => setShowReportModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gold-primary rounded-full transition-colors"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
              <h2 className="text-lg font-bold text-gold-primary mb-4">Gerar Relatório</h2>
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex gap-2">
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold border-2 transition-all ${reportFilter === 'month' ? 'bg-gold-primary text-dark-primary border-gold-primary shadow' : 'bg-dark-tertiary text-gray-200 border-dark-tertiary hover:border-gold-primary'}`}
                    onClick={() => {
                      setReportFilter('month');
                      const now = new Date();
                      setSelectedReportMonth(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`);
                    }}
                  >
                    <span className="inline-block w-3 h-3 rounded-full border-2 mr-2" style={{borderColor: reportFilter==='month' ? '#FFD700' : '#888', background: reportFilter==='month' ? '#111' : 'transparent'}}></span>
                    Mensal
                  </button>
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold border-2 transition-all ${reportFilter === 'year' ? 'bg-gold-primary text-dark-primary border-gold-primary shadow' : 'bg-dark-tertiary text-gray-200 border-dark-terciary hover:border-gold-primary'}`}
                    onClick={() => {
                      setReportFilter('year');
                      setSelectedReportYear(String(currentYear));
                    }}
                  >
                    <span className="inline-block w-3 h-3 rounded-full border-2 mr-2" style={{borderColor: reportFilter==='year' ? '#FFD700' : '#888', background: reportFilter==='year' ? '#111' : 'transparent'}}></span>
                    Anual
                  </button>
                </div>
              </div>
              {reportFilter === 'month' && (
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1 text-sm">Selecione o mês e o ano</label>
                  <div className="flex flex-col gap-2">
                    {/* Grid de meses */}
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {months.map((m, idx) => (
                        <button
                          key={m}
                          className={`rounded-lg py-2 font-semibold transition-all border-2 ${selectedReportMonth && selectedReportMonth.endsWith(`-${String(idx+1).padStart(2,'0')}`) ? 'bg-gold-primary text-dark-primary border-gold-primary' : 'bg-dark-terciary text-gray-200 border-dark-terciary hover:border-gold-primary'}`}
                          onClick={() => {
                            if (selectedReportMonth) {
                              const [y] = selectedReportMonth.split('-');
                              setSelectedReportMonth(`${y}-${String(idx+1).padStart(2,'0')}`);
                            } else {
                              setSelectedReportMonth(`${currentYear}-${String(idx+1).padStart(2,'0')}`);
                            }
                          }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    {/* Grid de anos navegável */}
                    <div className="flex items-center justify-between mb-1">
                      <button onClick={() => setYearGridStart(y => y-4)} className="text-gold-primary px-2 py-1 rounded hover:bg-gold-primary/10">«</button>
                      <span className="text-gray-400 text-sm">Ano</span>
                      <button onClick={() => setYearGridStart(y => y+4)} className="text-gold-primary px-2 py-1 rounded hover:bg-gold-primary/10">»</button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({length: 4}, (_,i) => yearGridStart + i).map(y => (
                        <button
                          key={y}
                          className={`rounded-lg py-2 font-semibold transition-all border-2 ${selectedReportMonth && selectedReportMonth.startsWith(`${y}-`) ? 'bg-gold-primary text-dark-primary border-gold-primary' : 'bg-dark-terciary text-gray-200 border-dark-terciary hover:border-gold-primary'}`}
                          onClick={() => {
                            if (selectedReportMonth) {
                              const [,m] = selectedReportMonth.split('-');
                              setSelectedReportMonth(`${y}-${m}`);
                            } else {
                              setSelectedReportMonth(`${y}-01`);
                            }
                          }}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Exemplo: Mai/2025</p>
                </div>
              )}
              {reportFilter === 'year' && (
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1 text-sm">Selecione o ano</label>
                  <div className="flex items-center justify-between mb-1">
                    <button onClick={() => setYearGridStart(y => y-4)} className="text-gold-primary px-2 py-1 rounded hover:bg-gold-primary/10">«</button>
                    <span className="text-gray-400 text-sm">Ano</span>
                    <button onClick={() => setYearGridStart(y => y+4)} className="text-gold-primary px-2 py-1 rounded hover:bg-gold-primary/10">»</button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({length: 4}, (_,i) => yearGridStart + i).map(y => (
                      <button
                        key={y}
                        className={`rounded-lg py-2 font-semibold transition-all border-2 ${selectedReportYear === String(y) ? 'bg-gold-primary text-dark-primary border-gold-primary' : 'bg-dark-terciary text-gray-200 border-dark-terciary hover:border-gold-primary'}`}
                        onClick={() => setSelectedReportYear(String(y))}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <ReportGenerator
                transactions={transactions}
                categories={categories}
                companies={companies}
                className="w-full flex flex-col items-center gap-2 text-base font-semibold text-gray-200"
                filter={reportFilter}
                period={reportFilter === 'month' ? selectedReportMonth : selectedReportYear}
                onClose={() => setShowReportModal(false)}
                disabled={!canGenerateReport}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function getAccessCountdownColor(accessDuration: number, createdAt: string) {
  const startTime = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const elapsedSeconds = Math.floor((now - startTime) / 1000);
  const remainingSeconds = accessDuration - elapsedSeconds;
  const days = Math.max(0, Math.floor(remainingSeconds / (24 * 60 * 60)));
  if (days <= 3) return 'text-red-400';
  if (days <= 7) return 'text-amber-400';
  return 'text-emerald-400';
}

export default Dashboard;