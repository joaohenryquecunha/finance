import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { formatCurrency } from '../utils/format';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  type: 'balance' | 'income' | 'expense';
  className?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  type,
  className = ''
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'balance':
        return {
          bg: 'bg-dark-secondary',
          iconBg: 'bg-dark-tertiary',
          iconColor: 'text-gold-primary',
          valueColor: 'text-gold-primary'
        };
      case 'income':
        return {
          bg: 'bg-dark-secondary',
          iconBg: 'bg-[#1C2B1C]',
          iconColor: 'text-emerald-400',
          valueColor: 'text-emerald-400'
        };
      case 'expense':
        return {
          bg: 'bg-dark-secondary',
          iconBg: 'bg-[#2B1C1C]',
          iconColor: 'text-red-400',
          valueColor: 'text-red-400'
        };
    }
  };

  const styles = getTypeStyles();
  const formattedValue = typeof value === 'number' ? formatCurrency(value) : value;

  return (
    <div className={`${styles.bg} rounded-xl p-4 sm:p-6 shadow-gold-sm hover:shadow-gold-md transition-shadow ${className}`}>
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-400">{title}</h3>
          <p className={`text-xl sm:text-2xl font-semibold mt-1 ${styles.valueColor} glow-text`}>
            {formattedValue}
          </p>
        </div>
        <div className={`p-2 sm:p-3 rounded-full ${styles.iconBg}`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${styles.iconColor}`} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center">
          <span className={`text-xs sm:text-sm ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
          <span className="text-xs sm:text-sm text-gray-500 ml-2">vs. mês anterior</span>
        </div>
      )}
    </div>
  );
};