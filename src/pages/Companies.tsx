import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Company, Transaction } from '../types';
import { CompanyForm } from '../components/CompanyForm';
import { CompanyTransactionChart } from '../components/CompanyTransactionChart';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, isWithinInterval } from 'date-fns';

export const Companies: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, getUserData } = useAuth();

  // Corrigir: garantir que fetchCompanies seja estável
  const fetchCompanies = React.useCallback(async () => {
    if (!user?.uid) return;
    try {
      const companiesRef = collection(db, 'companies');
      const q = query(companiesRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const companiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Company[];
      setCompanies(companiesData);
    } catch (err) {
      setError('Erro ao carregar empresas');
      console.error('Error fetching companies:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      fetchCompanies();
    }
  }, [user?.uid, fetchCompanies]); // Agora seguro

  const handleAddCompany = async (newCompany: Omit<Company, 'id' | 'userId' | 'createdAt'>) => {
    if (!user?.uid) return;

    try {
      const companiesRef = collection(db, 'companies');
      const docRef = await addDoc(companiesRef, {
        name: newCompany.name,
        cnpj: newCompany.cnpj,
        userId: user.uid,
        createdAt: new Date().toISOString()
      });

      const company: Company = {
        id: docRef.id,
        name: newCompany.name,
        cnpj: newCompany.cnpj,
        userId: user.uid,
        createdAt: new Date().toISOString()
      };

      setCompanies([company, ...companies]);
      setShowForm(false);
    } catch (err) {
      console.error('Error adding company:', err);
      alert('Erro ao adicionar empresa. Verifique se o CNPJ já está cadastrado.');
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (deletingId === companyId) {
      try {
        const companyRef = doc(db, 'companies', companyId);
        await deleteDoc(companyRef);
        setCompanies(companies.filter(c => c.id !== companyId));
      } catch (err) {
        console.error('Error deleting company:', err);
        alert('Erro ao excluir empresa');
      } finally {
        setDeletingId(null);
      }
    } else {
      setDeletingId(companyId);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  // Filtros de data
  type DateFilter = 'day' | 'month' | 'year';
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });

  // Função para obter range de datas
  const getDateRange = (date: Date, filter: DateFilter) => {
    switch (filter) {
      case 'day':
        return { start: startOfDay(date), end: endOfDay(date) };
      case 'month':
        return { start: startOfMonth(date), end: endOfMonth(date) };
      case 'year':
        return { start: startOfYear(date), end: endOfYear(date) };
    }
  };

  // Função para filtrar transações da empresa pelo filtro de data
  const getCompanyTransactions = (companyId: string): Transaction[] => {
    const userData = getUserData();
    if (!userData) return [];
    const range = getDateRange(selectedDate, dateFilter);
    return userData.transactions.filter(t => {
      if (t.companyId !== companyId) return false;
      const transactionDate = parseISO(t.date);
      return isWithinInterval(transactionDate, { start: range.start, end: range.end });
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-primary animate-spin" />
      </div>
    );
  }

  const userData = getUserData();
  if (!userData) return null;

  return (
    <div className="min-h-screen bg-dark-primary p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header for Desktop */}
        <div className="hidden sm:flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-gray-400 hover:text-gold-primary rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gold-primary">Empresas</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-gold-primary text-dark-primary px-4 py-2 rounded-lg hover:bg-gold-hover transition-colors"
          >
            <Plus size={20} />
            <span>Nova Empresa</span>
          </button>
        </div>

        {/* Header for Mobile */}
        <div className="sm:hidden fixed top-0 left-0 right-0 bg-dark-secondary z-50 px-4 py-3 shadow-gold-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 -ml-2 text-gray-400 hover:text-gold-primary rounded-lg"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-lg font-bold text-gold-primary">Empresas</h1>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="p-2 text-gold-primary"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Filtros de data */}
        <div className="flex flex-wrap gap-2 mb-4 items-center sm:mt-0 mt-12">
          <label className="text-gray-300 font-medium">Filtrar por:</label>
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value as DateFilter)}
            className="bg-dark-tertiary text-gray-200 rounded-lg px-3 py-2 border-none focus:ring-2 focus:ring-gold-primary"
          >
            <option value="day">Dia</option>
            <option value="month">Mês</option>
            <option value="year">Ano</option>
          </select>
          <input
            type={dateFilter === 'day' ? 'date' : dateFilter === 'month' ? 'month' : 'number'}
            value={
              dateFilter === 'day'
                ? selectedDate.toISOString().slice(0, 10)
                : dateFilter === 'month'
                ? selectedDate.toISOString().slice(0, 7)
                : selectedDate.getFullYear()
            }
            min={dateFilter === 'year' ? 2000 : undefined}
            max={dateFilter === 'year' ? 2100 : undefined}
            onChange={e => {
              if (dateFilter === 'day') {
                setSelectedDate(new Date(e.target.value + 'T00:00:00'));
              } else if (dateFilter === 'month') {
                const [year, month] = e.target.value.split('-').map(Number);
                setSelectedDate(new Date(year, month - 1, 1));
              } else {
                setSelectedDate(new Date(Number(e.target.value), 0, 1));
              }
            }}
            className="bg-dark-tertiary text-gray-200 rounded-lg px-3 py-2 border-none focus:ring-2 focus:ring-gold-primary"
            style={{ width: dateFilter === 'year' ? 100 : undefined }}
          />
        </div>

        {/* Main Content */}
        <div className="mt-4 sm:mt-0">
          {error ? (
            <div className="bg-red-400/10 text-red-400 p-4 rounded-lg text-center">
              {error}
            </div>
          ) : companies.length === 0 ? (
            <div className="bg-dark-secondary rounded-xl p-6 sm:p-8 text-center">
              <div className="flex justify-center mb-4">
                <Building2 size={48} className="text-gray-400" />
              </div>
              <p className="text-gray-400 mb-4">
                Você ainda não possui empresas cadastradas.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-gold-primary text-dark-primary px-4 py-2 rounded-lg hover:bg-gold-hover transition-colors"
              >
                <Plus size={20} />
                <span>Cadastrar Primeira Empresa</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {companies.map(company => (
                <div
                  key={company.id}
                  className="bg-dark-secondary rounded-lg p-4 hover:shadow-gold-sm transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-200">
                        {company.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        CNPJ: {company.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {/* TODO: Implement edit */}}
                        className="p-2 text-gray-400 hover:text-gold-primary rounded-lg transition-colors"
                      >
                        <Pencil size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteCompany(company.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          deletingId === company.id
                            ? 'text-red-400 bg-red-400/10'
                            : 'text-gray-400 hover:text-red-400'
                        }`}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  <CompanyTransactionChart 
                    transactions={getCompanyTransactions(company.id)}
                    categories={userData.categories}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {showForm && (
          <CompanyForm
            onAddCompany={handleAddCompany}
            onClose={() => setShowForm(false)}
          />
        )}
      </div>
    </div>
  );
};