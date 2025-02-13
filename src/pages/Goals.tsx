import React, { useState, useEffect } from 'react';
import { Goal } from '../types';
import { GoalForm } from '../components/GoalForm';
import { GoalChart } from '../components/GoalChart';
import { Plus, ArrowLeft, Calendar, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/format';
import { parseISO, isWithinInterval } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Sao_Paulo';

export const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>();
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { getUserData, updateUserData } = useAuth();

  useEffect(() => {
    const userData = getUserData();
    if (userData) {
      // Calculate current amount for each goal based on total balance
      const updatedGoals = calculateGoalsProgress(userData.goals || [], userData.transactions || []);
      setGoals(updatedGoals);
    }
  }, []);

  const calculateTotalBalance = (transactions: any[]) => {
    return transactions.reduce((acc, t) => {
      return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);
  };

  const calculateGoalsProgress = (goals: Goal[], transactions: any[]) => {
    // Calculate total balance up to current date
    const currentBalance = Math.max(0, calculateTotalBalance(transactions));

    return goals.map(goal => ({
      ...goal,
      currentAmount: currentBalance
    }));
  };

  const handleAddGoal = async (newGoal: Omit<Goal, 'id' | 'currentAmount' | 'createdAt' | 'updatedAt'>) => {
    const userData = getUserData();
    if (!userData) return;

    // Use total balance as initial amount
    const currentBalance = Math.max(0, calculateTotalBalance(userData.transactions || []));

    const goal: Goal = {
      ...newGoal,
      id: Math.random().toString(36).substr(2, 9),
      currentAmount: currentBalance,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedGoals = [...goals, goal];
    setGoals(updatedGoals);
    await updateUserData({ goals: updatedGoals });
    setShowForm(false);
  };

  const handleUpdateGoal = async (updatedGoal: Goal) => {
    const updatedGoals = goals.map(g => 
      g.id === updatedGoal.id ? {
        ...updatedGoal,
        updatedAt: new Date().toISOString()
      } : g
    );
    setGoals(updatedGoals);
    await updateUserData({ goals: updatedGoals });
    setEditingGoal(undefined);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (deletingId === goalId) {
      const updatedGoals = goals.filter(g => g.id !== goalId);
      setGoals(updatedGoals);
      await updateUserData({ goals: updatedGoals });
      setDeletingId(null);
    } else {
      setDeletingId(goalId);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

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
            <h1 className="text-2xl font-bold text-gold-primary">Metas Financeiras</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode(prev => prev === 'month' ? 'day' : 'month')}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-gold-primary transition-colors"
            >
              <Calendar size={20} />
              <span>Ver por {viewMode === 'month' ? 'dia' : 'mês'}</span>
            </button>
            <button
              onClick={() => setShowForm(true)}
              disabled={goals.length >= 3}
              className="flex items-center gap-2 bg-gold-primary text-dark-primary px-4 py-2 rounded-lg hover:bg-gold-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={20} />
              <span>Nova Meta</span>
            </button>
          </div>
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
              <h1 className="text-lg font-bold text-gold-primary">Metas Financeiras</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(prev => prev === 'month' ? 'day' : 'month')}
                className="p-2 text-gray-300 hover:text-gold-primary"
              >
                <Calendar size={20} />
              </button>
              <button
                onClick={() => setShowForm(true)}
                disabled={goals.length >= 3}
                className="p-2 text-gold-primary disabled:opacity-50"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mt-16 sm:mt-0">
          {goals.length === 0 ? (
            <div className="bg-dark-secondary rounded-xl p-6 sm:p-8 text-center">
              <p className="text-gray-400 mb-4">
                Você ainda não possui metas financeiras cadastradas.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-gold-primary text-dark-primary px-4 py-2 rounded-lg hover:bg-gold-hover transition-colors"
              >
                <Plus size={20} />
                <span>Criar Primeira Meta</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {goals.map(goal => (
                <div key={goal.id} className="relative group">
                  <GoalChart goal={goal} viewMode={viewMode} />
                  <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingGoal(goal)}
                      className="p-2 bg-dark-secondary text-gray-300 hover:text-gold-primary rounded-lg transition-colors"
                      title="Editar meta"
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className={`p-2 bg-dark-secondary rounded-lg transition-colors ${
                        deletingId === goal.id
                          ? 'text-red-400 bg-red-400/10'
                          : 'text-gray-300 hover:text-red-400'
                      }`}
                      title={deletingId === goal.id ? 'Confirmar exclusão' : 'Excluir meta'}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {(showForm || editingGoal) && (
          <GoalForm
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            editingGoal={editingGoal}
            onClose={() => {
              setShowForm(false);
              setEditingGoal(undefined);
            }}
            goalsCount={goals.length}
          />
        )}
      </div>
    </div>
  );
};