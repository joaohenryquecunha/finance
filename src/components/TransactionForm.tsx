import React, { useState, useEffect } from 'react';
import { Transaction, Category, Company } from '../types';
import { Plus, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';

const TIMEZONE = 'America/Sao_Paulo';

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction?: (transaction: Transaction) => void;
  categories: Category[];
  companies?: Company[];
  editingTransaction?: Transaction;
  onClose?: () => void;
}

const initialFormData = {
  description: '',
  amount: '',
  category: '',
  companyId: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  type: 'expense' as 'income' | 'expense' | 'investment'
};

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onAddTransaction,
  onUpdateTransaction,
  categories,
  companies = [],
  editingTransaction,
  onClose
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    ...initialFormData,
    category: categories[0]?.name || ''
  });

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        description: editingTransaction.description,
        amount: editingTransaction.amount.toString(),
        category: editingTransaction.category,
        companyId: editingTransaction.companyId || '',
        date: format(parseISO(editingTransaction.date), 'yyyy-MM-dd'),
        type: editingTransaction.type
      });
      setIsOpen(true);
    }
  }, [editingTransaction]);

  useEffect(() => {
    if (isOpen && !editingTransaction) {
      setFormData({
        ...initialFormData,
        date: format(new Date(), 'yyyy-MM-dd'),
        category: categories[0]?.name || ''
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const [year, month, day] = formData.date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day, 12, 0, 0);
    const utcDate = zonedTimeToUtc(localDate, TIMEZONE);
    
    if (editingTransaction && onUpdateTransaction) {
      onUpdateTransaction({
        ...editingTransaction,
        description: formData.description,
        amount: Number(formData.amount),
        category: formData.category,
        companyId: formData.companyId || undefined, // Corrigido para undefined
        date: utcDate.toISOString(),
        type: formData.type
      });
    } else {
      onAddTransaction({
        description: formData.description,
        amount: Number(formData.amount),
        category: formData.category,
        companyId: formData.companyId || undefined, // Corrigido para undefined
        date: utcDate.toISOString(),
        type: formData.type
      });
    }
    
    setFormData(initialFormData);
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Fixed button for mobile */}
      {!editingTransaction && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 z-50 lg:hidden bg-gold-primary text-dark-primary w-14 h-14 rounded-full shadow-gold-lg hover:bg-gold-hover transition-colors flex items-center justify-center"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Desktop button */}
      {!editingTransaction && !isOpen && (
        <div className="hidden lg:block mb-6">
          <button
            onClick={() => setIsOpen(true)}
            className="w-full bg-gold-primary text-dark-primary px-4 py-3 rounded-lg hover:bg-gold-hover transition-colors flex items-center justify-center gap-2 text-base sm:text-lg font-medium shadow-gold-sm"
          >
            <Plus size={24} />
            <span>Nova Transação</span>
          </button>
        </div>
      )}

      {/* Modal */}
      {(isOpen || editingTransaction) && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-[100]">
          <div className="bg-dark-secondary w-full sm:rounded-xl sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-dark-secondary p-4 border-b border-dark-tertiary flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gold-primary">
                {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gold-primary rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <label className="flex items-center justify-center p-3 rounded-lg cursor-pointer bg-dark-tertiary border-2 border-transparent transition-colors hover:border-gold-primary">
                    <input
                      type="radio"
                      name="transactionType"
                      checked={formData.type === 'expense'}
                      onChange={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                      className="sr-only"
                    />
                    <span className={`text-base font-medium ${formData.type === 'expense' ? 'text-red-400' : 'text-gray-400'}`}>
                      Despesa
                    </span>
                  </label>
                  <label className="flex items-center justify-center p-3 rounded-lg cursor-pointer bg-dark-tertiary border-2 border-transparent transition-colors hover:border-gold-primary">
                    <input
                      type="radio"
                      name="transactionType"
                      checked={formData.type === 'income'}
                      onChange={() => setFormData(prev => ({ ...prev, type: 'income' }))}
                      className="sr-only"
                    />
                    <span className={`text-base font-medium ${formData.type === 'income' ? 'text-emerald-400' : 'text-gray-400'}`}>
                      Receita
                    </span>
                  </label>
                  <label className="flex items-center justify-center p-3 rounded-lg cursor-pointer bg-dark-tertiary border-2 border-transparent transition-colors hover:border-gold-primary">
                    <input
                      type="radio"
                      name="transactionType"
                      checked={formData.type === 'investment'}
                      onChange={() => setFormData(prev => ({ ...prev, type: 'investment' }))}
                      className="sr-only"
                    />
                    <span className={`text-base font-medium ${formData.type === 'investment' ? 'text-blue-400' : 'text-gray-400'}`}>
                      Investimento
                    </span>
                  </label>
                </div>
              </div>

              {companies.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Empresa (opcional)
                  </label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyId: e.target.value }))}
                    className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent text-base"
                  >
                    <option value="">Selecione uma empresa</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent text-base"
                  placeholder={`Ex: ${formData.type === 'investment' ? 'Compra de ações' : formData.type === 'income' ? 'Salário' : 'Compras do mês'}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Valor
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent text-base"
                  placeholder="R$ 0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent text-base"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent text-base"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 text-gray-400 hover:text-gold-primary bg-dark-tertiary rounded-lg text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gold-primary text-dark-primary px-4 py-3 rounded-lg hover:bg-gold-hover transition-colors text-base font-medium"
                >
                  {editingTransaction ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};