import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { utcToZonedTime } from 'date-fns-tz';
import { Transaction } from '../types';

interface FinancialHealthChartProps {
  transactions: Transaction[];
}

const TIMEZONE = 'America/Sao_Paulo';

export const FinancialHealthChart: React.FC<FinancialHealthChartProps> = ({ transactions }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const calculateHealthScore = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    
    const filteredTransactions = transactions.filter(t => {
      const date = utcToZonedTime(parseISO(t.date), TIMEZONE);
      return date.getFullYear() === year && date.getMonth() === month - 1;
    });

    const income = filteredTransactions.reduce((acc, t) => 
      t.type === 'income' ? acc + t.amount : acc, 0);
    const expenses = filteredTransactions.reduce((acc, t) => 
      t.type === 'expense' ? acc + t.amount : acc, 0);

    if (income === 0) return 0;

    const ratio = (income - expenses) / income;
    const score = ratio * 100;

    return Math.min(Math.max(score, -100), 100);
  };

  const healthScore = calculateHealthScore();
  const indicatorPosition = Math.min(Math.max((healthScore + 100) / 2, 0), 100);

  const getGradientColors = () => {
    return {
      background: `linear-gradient(90deg, 
        #EF4444 0%, 
        #EF4444 20%, 
        #F97316 40%, 
        #F97316 60%, 
        #22C55E 80%, 
        #22C55E 100%)`
    };
  };

  const getIndicatorColor = () => {
    if (healthScore < 0) return '#EF4444';
    if (healthScore < 50) return '#F97316';
    return '#22C55E';
  };

  const getHealthStatus = () => {
    if (healthScore < 0) return 'Crítico';
    if (healthScore < 50) return 'Atenção';
    return 'Saudável';
  };

  const getStatusText = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const filteredTransactions = transactions.filter(t => {
      const date = utcToZonedTime(parseISO(t.date), TIMEZONE);
      return date.getFullYear() === year && date.getMonth() === month - 1;
    });

    const income = filteredTransactions.reduce((acc, t) => 
      t.type === 'income' ? acc + t.amount : acc, 0);
    const expenses = filteredTransactions.reduce((acc, t) => 
      t.type === 'expense' ? acc + t.amount : acc, 0);

    if (income === 0) {
      return 'Nenhuma receita registrada neste mês';
    }

    if (healthScore >= 0) {
      const savingsPercent = ((income - expenses) / income * 100).toFixed(1);
      return `Você está economizando ${savingsPercent}% da sua renda`;
    } else {
      const overspendingPercent = ((expenses - income) / income * 100).toFixed(1);
      return `Você está gastando ${overspendingPercent}% a mais que sua renda`;
    }
  };

  return (
    <div className="bg-dark-secondary p-4 sm:p-6 rounded-xl shadow-gold-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-lg font-semibold text-gold-primary">Saúde Financeira</h2>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full sm:w-auto rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-2 focus:ring-2 focus:ring-gold-primary focus:border-transparent"
        />
      </div>

      <div className="mb-6 sm:mb-8 px-2">
        <div className="flex justify-between text-xs sm:text-sm text-gray-400 mb-2">
          <span>Crítico</span>
          <span>Equilibrado</span>
          <span>Saudável</span>
        </div>
        <div className="relative h-4 mx-1">
          {/* Barra de gradiente */}
          <div 
            className="absolute inset-0 rounded-full"
            style={getGradientColors()}
          />
          {/* Indicador */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-4 border-dark-secondary transition-all duration-500 shadow-lg"
            style={{ 
              left: `calc(${indicatorPosition}% - 10px)`,
              backgroundColor: getIndicatorColor()
            }}
          />
        </div>
      </div>

      <div className="text-center px-2">
        <div className="text-xl sm:text-2xl font-bold mb-2" style={{ color: getIndicatorColor() }}>
          {getHealthStatus()}
        </div>
        <div className="text-xs sm:text-sm text-gray-400">
          {format(new Date(selectedMonth), "MMMM 'de' yyyy", { locale: ptBR })}
        </div>
        <div className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-300">
          {getStatusText()}
        </div>
      </div>
    </div>
  );
};