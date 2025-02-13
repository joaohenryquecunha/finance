import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Goal } from '../types';
import { format } from 'date-fns';

interface GoalFormProps {
  onAddGoal: (goal: Omit<Goal, 'id' | 'currentAmount' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateGoal?: (goal: Goal) => void;
  editingGoal?: Goal;
  onClose: () => void;
  goalsCount: number;
}

export const GoalForm: React.FC<GoalFormProps> = ({
  onAddGoal,
  onUpdateGoal,
  editingGoal,
  onClose,
  goalsCount
}) => {
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    if (editingGoal) {
      setFormData({
        name: editingGoal.name,
        targetAmount: editingGoal.targetAmount.toString(),
        endDate: format(new Date(editingGoal.endDate), 'yyyy-MM-dd')
      });
    }
  }, [editingGoal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingGoal && onUpdateGoal) {
      onUpdateGoal({
        ...editingGoal,
        name: formData.name,
        targetAmount: Number(formData.targetAmount),
        endDate: new Date(formData.endDate).toISOString()
      });
    } else {
      if (goalsCount >= 3) {
        alert('Você atingiu o limite máximo de 3 metas.');
        return;
      }
      
      onAddGoal({
        name: formData.name,
        targetAmount: Number(formData.targetAmount),
        endDate: new Date(formData.endDate).toISOString()
      });
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-secondary w-full max-w-md rounded-xl">
        <div className="p-4 border-b border-dark-tertiary flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gold-primary">
            {editingGoal ? 'Editar Meta' : 'Nova Meta'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gold-primary rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome da Meta
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent"
              placeholder="Ex: Comprar um carro"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Valor da Meta
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.targetAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
              className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent"
              placeholder="R$ 0,00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Data Final
            </label>
            <input
              type="date"
              required
              value={formData.endDate}
              min={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-400 hover:text-gold-primary bg-dark-tertiary rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-gold-primary text-dark-primary px-4 py-3 rounded-lg hover:bg-gold-hover transition-colors"
            >
              {editingGoal ? 'Atualizar' : 'Criar Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};