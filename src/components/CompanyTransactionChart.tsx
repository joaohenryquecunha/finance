import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { Transaction, Category } from '../types';
import { formatCurrency } from '../utils/format';

interface CompanyTransactionChartProps {
  transactions: Transaction[];
  categories: Category[];
}

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

export const CompanyTransactionChart: React.FC<CompanyTransactionChartProps> = ({ 
  transactions,
  categories
}) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-dark-secondary rounded-xl p-6 text-center">
        <p className="text-gray-400">Nenhuma transação registrada para esta empresa</p>
      </div>
    );
  }

  const totalIncome = transactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum, 0);
  const totalExpense = transactions.reduce((sum, t) => t.type === 'expense' ? sum + t.amount : sum, 0);
  const totalInvestment = transactions.reduce((sum, t) => t.type === 'investment' ? sum + t.amount : sum, 0);
  const balance = totalIncome - totalExpense - totalInvestment;

  const getCategoryColor = (categoryName: string): string => {
    const baseCategoryName = categoryName.split(' (')[0];
    // First try to get color from localStorage
    const cachedColor = localStorage.getItem(`category_color_${baseCategoryName}`);
    if (cachedColor) return cachedColor;
    
    // If not in cache, try to get from categories prop
    const category = categories.find(cat => cat.name === baseCategoryName);
    if (category) {
      // Save to cache for future use
      localStorage.setItem(`category_color_${baseCategoryName}`, category.color);
      return category.color;
    }
    
    return '#9B9B9B'; // Default color
  };

  const transactionsByCategory = transactions.reduce((acc, transaction) => {
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

  return (
    <div className="bg-dark-secondary rounded-xl p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left side - Pie Chart */}
        <div className="flex-1">
          <div className="h-[300px]">
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
        </div>

        {/* Right side - Summary */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="space-y-4">
            <div className="bg-dark-tertiary rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Receitas</p>
              <p className="text-2xl font-semibold text-emerald-400">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-dark-tertiary rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Despesas</p>
              <p className="text-2xl font-semibold text-red-400">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="bg-dark-tertiary rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Investimentos</p>
              <p className="text-2xl font-semibold text-blue-400">{formatCurrency(totalInvestment)}</p>
            </div>
            <div className="bg-dark-tertiary rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Saldo</p>
              <p className={`text-2xl font-semibold ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Distribuição por Categoria</h3>
            <div className="space-y-2">
              {chartData.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg bg-dark-tertiary"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getCategoryColor(entry.category) }}
                    />
                    <span className="text-sm text-gray-300">{entry.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-200">
                    {formatCurrency(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};