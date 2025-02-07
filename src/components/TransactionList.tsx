import React from 'react';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/format';

const TIMEZONE = 'America/Sao_Paulo';

interface TransactionListProps {
  transactions: Transaction[];
  dateRange: {
    start: Date;
    end: Date;
  };
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, dateRange }) => {
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

  return (
    <div className="bg-dark-secondary rounded-xl shadow-gold-sm">
      <div className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gold-primary mb-4">Transações</h2>
        <div className="space-y-3 sm:space-y-4">
          {filteredTransactions.length === 0 ? (
            <p className="text-center text-gray-400 py-4">
              Nenhuma transação registrada neste período
            </p>
          ) : (
            filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 sm:p-4 rounded-lg hover:bg-dark-tertiary transition-colors"
              >
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'income' ? 'bg-[#1C2B1C]' : 'bg-[#2B1C1C]'
                    }`}
                  >
                    <span
                      className={`text-base sm:text-lg ${
                        transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm sm:text-base text-gray-200">{transaction.description}</p>
                    <p className="text-xs sm:text-sm text-gray-400">{transaction.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium text-sm sm:text-base glow-text ${
                    transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400">
                    {formatTransactionDate(transaction.date)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};