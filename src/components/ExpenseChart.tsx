import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';
import { Transaction, Category } from '../types';
import { formatCurrency } from '../utils/format';

interface ExpenseChartProps {
  transactions: Transaction[];
  categories: Category[];
  dateFilter: 'day' | 'month' | 'year';
  selectedDate: Date;
  dateRange: {
    start: Date;
    end: Date;
  };
  onDateFilterChange: (filter: 'day' | 'month' | 'year') => void;
  onSelectedDateChange: (date: Date) => void;
}

const TIMEZONE = 'America/Sao_Paulo';

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
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
  selectedDate,
  dateRange,
  onDateFilterChange,
  onSelectedDateChange
}) => {
  const getCategoryColor = (categoryName: string, type: 'income' | 'expense'): string => {
    const baseCategoryName = categoryName.replace(/ \(Receita\)| \(Despesa\)$/, '');
    
    if (type === 'income') {
      return '#10B981';
    }
    
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
        income: 0,
        expense: 0
      };
    }
    if (transaction.type === 'income') {
      acc[category].income += transaction.amount;
    } else {
      acc[category].expense += transaction.amount;
    }
    return acc;
  }, {} as Record<string, { income: number; expense: number }>);

  const chartData = Object.entries(transactionsByCategory)
    .filter(([_, value]) => value.income > 0 || value.expense > 0)
    .map(([categoryName, value]) => {
      return [
        {
          name: `${categoryName} (Receita)`,
          value: value.income,
          type: 'income',
          category: categoryName
        },
        {
          name: `${categoryName} (Despesa)`,
          value: value.expense,
          type: 'expense',
          category: categoryName
        }
      ];
    }).flat().filter(item => item.value > 0);

  const formatDateLabel = () => {
    switch (dateFilter) {
      case 'day':
        return format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      case 'month':
        return format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });
      case 'year':
        return format(selectedDate, 'yyyy', { locale: ptBR });
    }
  };

  const handleDateChange = (value: string) => {
    let newDate: Date;
    
    switch (dateFilter) {
      case 'day':
        // Para dia, mantemos o horário como meio-dia para evitar problemas de fuso
        const [year, month, day] = value.split('-').map(Number);
        newDate = new Date(year, month - 1, day, 12, 0, 0);
        break;
      
      case 'month':
        // Para mês, definimos como dia 1 às 12:00
        const [yearMonth, monthMonth] = value.split('-').map(Number);
        newDate = new Date(yearMonth, monthMonth - 1, 1, 12, 0, 0);
        break;
      
      case 'year':
        // Para ano, definimos como 1º de janeiro às 12:00
        newDate = new Date(parseInt(value), 0, 1, 12, 0, 0);
        break;
      
      default:
        return;
    }

    onSelectedDateChange(newDate);
  };

  const getDateInput = () => {
    const currentDate = selectedDate;
    
    switch (dateFilter) {
      case 'day':
        return (
          <input
            type="date"
            value={format(currentDate, 'yyyy-MM-dd')}
            onChange={(e) => handleDateChange(e.target.value)}
            className="rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-2 focus:ring-2 focus:ring-gold-primary focus:border-transparent w-full sm:w-auto"
          />
        );
      case 'month':
        return (
          <input
            type="month"
            value={format(currentDate, 'yyyy-MM')}
            onChange={(e) => handleDateChange(e.target.value)}
            className="rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-2 focus:ring-2 focus:ring-gold-primary focus:border-transparent w-full sm:w-auto"
          />
        );
      case 'year':
        return (
          <input
            type="number"
            value={format(currentDate, 'yyyy')}
            onChange={(e) => handleDateChange(e.target.value)}
            min="1900"
            max="2100"
            className="rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-2 focus:ring-2 focus:ring-gold-primary focus:border-transparent w-full sm:w-auto"
          />
        );
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
          {getDateInput()}
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
                      fill={getCategoryColor(entry.name, entry.type)}
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
                  style={{ backgroundColor: getCategoryColor(entry.name, entry.type) }}
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