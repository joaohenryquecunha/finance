import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Company, Transaction } from '../types';
import { CompanyForm } from '../components/CompanyForm';
import { CompanyTransactionChart } from '../components/CompanyTransactionChart';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

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

  const getCompanyTransactions = (companyId: string): Transaction[] => {
    const userData = getUserData();
    if (!userData) return [];
    return userData.transactions.filter(t => t.companyId === companyId);
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

        {/* Main Content */}
        <div className="mt-16 sm:mt-0">
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