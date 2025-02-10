import React, { useState } from 'react';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/format';
import { Pencil, Trash2, MoreVertical, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const TIMEZONE = 'America/Sao_Paulo';

interface TransactionListProps {
  transactions: Transaction[];
  dateRange: {
    start: Date;
    end: Date;
  };
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transactionId: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  dateRange,
  onEditTransaction,
  onDeleteTransaction
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const formatTransactionDate = (dateString: string) => {
    const date = parseISO(dateString);
    const zonedDate = utcToZonedTime(date, TIMEZONE);
    return format(zonedDate, "dd 'de' MMMM", { locale: ptBR });
  };

  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = utcToZonedTime(parseISO(transaction.date), TIMEZONE);
    const startDate = utcToZonedTime(dateRange.start, TIMEZONE);
    const endDate = utcToZonedTime(dateRange.end, TIMEZONE);
    
    return isWithinInterval(transactionDate, { 
      start: startDate,
      end: endDate
    });
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDelete = (transactionId: string) => {
    if (deletingId === transactionId) {
      onDeleteTransaction(transactionId);
      setDeletingId(null);
      setOpenMenuId(null);
    } else {
      setDeletingId(transactionId);
      setTimeout(() => {
        setDeletingId(null);
      }, 3000);
    }
  };

  const toggleMenu = (transactionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenMenuId(openMenuId === transactionId ? null : transactionId);
    setDeletingId(null);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.transaction-menu')) {
        setOpenMenuId(null);
        setDeletingId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="bg-dark-secondary rounded-xl shadow-gold-sm">
      <div className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gold-primary mb-4">Transações</h2>
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <p className="text-center text-gray-400 py-4">
              Nenhuma transação registrada neste período
            </p>
          ) : (
            filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`relative bg-dark-tertiary rounded-xl overflow-visible transition-all duration-200 hover:shadow-gold-sm ${
                  openMenuId === transaction.id ? 'z-[100]' : 'z-0'
                }`}
              >
                {/* Mobile Layout */}
                <div className="block sm:hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          transaction.type === 'income' ? 'bg-emerald-400/10' : 'bg-red-400/10'
                        }`}>
                          {transaction.type === 'income' ? (
                            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-200 mb-0.5 line-clamp-1">
                            {transaction.description}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {formatTransactionDate(transaction.date)}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-600" />
                            <span className="text-xs text-gray-400">
                              {transaction.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="transaction-menu relative">
                        <button
                          onClick={(e) => toggleMenu(transaction.id, e)}
                          className="p-2 -mr-2 text-gray-400 hover:text-gold-primary rounded-lg transition-colors"
                        >
                          <MoreVertical size={20} />
                        </button>

                        {/* Mobile Menu Dropdown */}
                        {openMenuId === transaction.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 rounded-lg bg-dark-secondary shadow-lg border border-dark-primary overflow-hidden">
                            <button
                              onClick={() => {
                                onEditTransaction(transaction);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-dark-tertiary hover:text-gold-primary transition-colors flex items-center gap-2"
                            >
                              <Pencil size={16} />
                              <span>Editar transação</span>
                            </button>
                            <button
                              onClick={() => handleDelete(transaction.id)}
                              className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 ${
                                deletingId === transaction.id
                                  ? 'bg-red-500/10 text-red-400'
                                  : 'text-gray-300 hover:bg-dark-tertiary hover:text-red-400'
                              }`}
                            >
                              <Trash2 size={16} />
                              <span>
                                {deletingId === transaction.id
                                  ? 'Clique para confirmar'
                                  : 'Excluir transação'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-dark-secondary">
                      <span className={`text-lg font-semibold ${
                        transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:flex sm:items-center justify-between p-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'income' ? 'bg-[#1C2B1C]' : 'bg-[#2B1C1C]'
                    }`}>
                      <span className={`text-lg ${
                        transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-base text-gray-200">{transaction.description}</p>
                      <p className="text-sm text-gray-400">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-6">
                    <div className="text-right">
                      <p className={`font-medium text-base glow-text ${
                        transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-gray-400">
                        {formatTransactionDate(transaction.date)}
                      </p>
                    </div>
                    <div className="transaction-menu relative">
                      <button
                        onClick={(e) => toggleMenu(transaction.id, e)}
                        className="p-2 text-gray-400 hover:text-gold-primary rounded-lg transition-colors"
                      >
                        <MoreVertical size={20} />
                      </button>
                      
                      {/* Desktop Menu Dropdown */}
                      {openMenuId === transaction.id && (
                        <div className="absolute right-0 top-[calc(100%+4px)] w-48 rounded-lg bg-dark-secondary shadow-xl border border-dark-primary overflow-hidden">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                onEditTransaction(transaction);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-dark-tertiary hover:text-gold-primary transition-colors flex items-center gap-2"
                            >
                              <Pencil size={16} />
                              <span>Editar transação</span>
                            </button>
                            <button
                              onClick={() => handleDelete(transaction.id)}
                              className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 ${
                                deletingId === transaction.id
                                  ? 'bg-red-500/10 text-red-400'
                                  : 'text-gray-300 hover:bg-dark-tertiary hover:text-red-400'
                              }`}
                            >
                              <Trash2 size={16} />
                              <span>
                                {deletingId === transaction.id
                                  ? 'Clique para confirmar'
                                  : 'Excluir transação'}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};