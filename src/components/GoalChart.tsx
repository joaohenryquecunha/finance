import React from 'react';
import { Goal } from '../types';
import { differenceInDays, differenceInMonths } from 'date-fns';
import { formatCurrency } from '../utils/format';
import { motion } from 'framer-motion';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface GoalChartProps {
  goal: Goal;
  viewMode: 'month' | 'day';
}

export const GoalChart: React.FC<GoalChartProps> = ({ goal, viewMode }) => {
  const calculateRequiredSavings = () => {
    const startDate = new Date(goal.createdAt);
    const endDate = new Date(goal.endDate);
    const remainingAmount = goal.targetAmount - goal.currentAmount;

    if (viewMode === 'month') {
      const months = Math.max(1, differenceInMonths(endDate, startDate));
      return remainingAmount / months;
    } else {
      const days = Math.max(1, differenceInDays(endDate, startDate));
      return remainingAmount / days;
    }
  };

  const requiredSavings = calculateRequiredSavings();
  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const daysLeft = differenceInDays(new Date(goal.endDate), new Date());

  const getProgressColor = () => {
    if (progress >= 75) return '#10B981';
    if (progress >= 50) return '#FFD700';
    if (progress >= 25) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-dark-tertiary rounded-lg p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left side - Progress Circle and Basic Info */}
        <div className="flex-1 flex flex-col items-center lg:items-start">
          <h3 className="text-xl font-semibold text-gold-primary mb-4">{goal.name}</h3>
          
          <div className="w-48 h-48 mb-6">
            <CircularProgressbar
              value={progress}
              text={`${progress.toFixed(1)}%`}
              styles={buildStyles({
                rotation: 0.25,
                strokeLinecap: 'round',
                textSize: '16px',
                pathTransitionDuration: 0.5,
                pathColor: getProgressColor(),
                textColor: getProgressColor(),
                trailColor: '#333',
                backgroundColor: '#1E1E1E'
              })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-dark-secondary p-4 rounded-lg"
            >
              <p className="text-sm text-gray-400">Meta</p>
              <p className="text-lg font-medium text-gray-200">
                {formatCurrency(goal.targetAmount)}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-dark-secondary p-4 rounded-lg"
            >
              <p className="text-sm text-gray-400">Atual</p>
              <p className="text-lg font-medium text-gray-200">
                {formatCurrency(goal.currentAmount)}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Right side - Savings Info and Progress Bars */}
        <div className="flex-1 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-dark-secondary p-4 rounded-lg mb-4"
          >
            <p className="text-sm text-gray-400 mb-2">
              Economia necessária {viewMode === 'month' ? 'por mês' : 'por dia'}
            </p>
            <p className="text-2xl font-semibold text-emerald-400">
              {formatCurrency(requiredSavings)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-dark-secondary p-4 rounded-lg"
          >
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-400">Dias restantes</p>
              <p className="text-lg font-medium text-gold-primary">{daysLeft}</p>
            </div>
            <div className="h-2 bg-dark-tertiary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: getProgressColor() }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-4 p-4 bg-dark-secondary rounded-lg"
          >
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-400">Falta</p>
              <p className="text-lg font-medium text-gray-200">
                {formatCurrency(goal.targetAmount - goal.currentAmount)}
              </p>
            </div>
            <div className="h-2 bg-dark-tertiary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: `${100 - progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gold-primary rounded-full"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};