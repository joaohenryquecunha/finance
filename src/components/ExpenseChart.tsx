import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import { isWithinInterval, parseISO } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { Transaction, Category } from '../types';
import { formatCurrency } from '../utils/format';

interface ExpenseChartProps {
  transactions: Transaction[];
  categories: Category[];
  dateFilter: 'day' | 'month' | 'year';
  dateRange: {
    start: Date;
    end: Date;
  };
  onDateFilterChange: (filter: 'day' | 'month' | 'year') => void;
}

const TIMEZONE = 'America/Sao_Paulo';

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.03) return null;

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor="middle" 
      dominantBaseline="middle"
      style={{
        fontSize: '12px',
        fontWeight: 'bold',
        textShadow: '0px 1px 2px rgba(0,0,0,0.5)'
      }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ 
  transactions, 
  categories,
  dateFilter,
  dateRange,
  onDateFilterChange
}) => {
  const getCategoryColor = (categoryName: string): string => {
    const baseCategoryName = categoryName.split(' (')[0];
    const category = categories.find(cat => cat.name === baseCategoryName);
    return category?.color || '#9B9B9B';
  };

  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = utcToZonedTime(parseISO(transaction.date), TIMEZONE);
    const startDate = utcToZonedTime(dateRange.start, TIMEZONE);
    const endDate = utcToZonedTime(dateRange.end, TIMEZONE);
    
    return isWithinInterval(transactionDate, { 
      start: startDate,
      end: endDate
    });
  });

  const transactionsByCategory = filteredTransactions.reduce((acc, transaction) => {
    const category = transaction.category;
    if (!acc[category]) {
      acc[category] = {
        name: category,
        income: 0,
        expense: 0,
        investment: 0
      };
    }
    if (transaction.type === 'income') {
      acc[category].income += transaction.amount;
    } else if (transaction.type === 'expense') {
      acc[category].expense += transaction.amount;
    } else {
      acc[category].investment += transaction.amount;
    }
    return acc;
  }, {} as Record<string, { 
    name: string; 
    income: number; 
    expense: number; 
    investment: number;
  }>);

  const chartData = Object.entries(transactionsByCategory)
    .flatMap(([category, data]) => {
      const items = [];
      if (data.income > 0) {
        items.push({
          name: `${category} (Receita)`,
          value: data.income,
          category
        });
      }
      if (data.expense > 0) {
        items.push({
          name: `${category} (Despesa)`,
          value: data.expense,
          category
        });
      }
      if (data.investment > 0) {
        items.push({
          name: `${category} (Investimento)`,
          value: data.investment,
          category
        });
      }
      return items;
    })
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const formatDateLabel = () => {
    switch (dateFilter) {
      case 'day':
        return dateRange.start.toLocaleDateString('pt-BR');
      case 'month':
        return dateRange.start.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
      case 'year':
        return dateRange.start.getFullYear();
    }
  };

  return (
    <div className="bg-dark-secondary p-4 sm:p-6 rounded-xl shadow-gold-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-lg font-semibold text-gold-primary">Distribuição Financeira</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <select
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value as 'day' | 'month' | 'year')}
            className="rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-2 focus:ring-2 focus:ring-gold-primary focus:border-transparent w-full sm:w-auto"
          >
            <option value="day">Dia</option>
            <option value="month">Mês</option>
            <option value="year">Ano</option>
          </select>
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-4 font-medium">
        Período: {formatDateLabel()}
      </p>

      {chartData.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-gray-400 bg-dark-tertiary rounded-xl">
          <p className="text-center px-4">
            Nenhuma transação registrada neste período
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="h-[300px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius="80%"
                  paddingAngle={2}
                  label={renderCustomizedLabel}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getCategoryColor(entry.category)}
                      style={{
                        filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.2))'
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#1E1E1E',
                    border: 'none',
                    borderRadius: '0.75rem',
                    padding: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgba(255, 215, 0, 0.1), 0 2px 4px -1px rgba(255, 215, 0, 0.06)',
                    color: '#E5E7EB'
                  }}
                  itemStyle={{
                    color: '#E5E7EB'
                  }}
                  labelStyle={{
                    color: '#E5E7EB'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {chartData.map((entry, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-lg bg-dark-tertiary"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getCategoryColor(entry.category) }}
                />
                <span className="text-sm text-gray-300 truncate flex-1">
                  {entry.name}
                </span>
                <span className="text-sm font-medium text-gray-200">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};