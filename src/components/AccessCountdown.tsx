import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface AccessCountdownProps {
  accessDuration: number;
  createdAt: string;
  onRenew: () => void;
  compact?: boolean;
  iconClassName?: string; // permite customizar a cor do ícone
}

export const AccessCountdown: React.FC<AccessCountdownProps> = ({ 
  accessDuration, 
  createdAt, 
  onRenew,
  compact = false,
  iconClassName
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number} | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const startTime = new Date(createdAt).getTime();
      const now = new Date().getTime();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      const remainingSeconds = accessDuration - elapsedSeconds;
      const days = Math.floor(remainingSeconds / (24 * 60 * 60));
      const hours = Math.floor((remainingSeconds % (24 * 60 * 60)) / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      return { days: Math.max(0, days), hours: Math.max(0, hours), minutes: Math.max(0, minutes) };
    };
    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // atualiza a cada minuto
    return () => clearInterval(interval);
  }, [accessDuration, createdAt]);

  const daysRemaining = timeLeft ? timeLeft.days : 0;

  const getStatusColor = () => {
    if (daysRemaining <= 3) return 'text-red-400';
    if (daysRemaining <= 7) return 'text-amber-400';
    return 'text-emerald-400';
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`p-2 rounded-lg hover:bg-dark-tertiary transition-colors ${iconClassName || getStatusColor()}`}
          title="Tempo de acesso restante"
        >
          <Clock size={20} className={iconClassName || getStatusColor()} />
        </button>

        {showDetails && (
          <div className="absolute top-full right-0 mt-2 bg-dark-secondary rounded-lg shadow-gold-lg p-4 min-w-[200px] z-50">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className={getStatusColor()} />
                <span className={`font-medium ${getStatusColor()}`}>
                  {timeLeft && timeLeft.days === 0
                    ? `${timeLeft.hours}h ${timeLeft.minutes}min de acesso`
                    : `${timeLeft?.days ?? 0} ${timeLeft?.days === 1 ? 'dia' : 'dias'} de acesso`}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRenew();
                  setShowDetails(false);
                }}
                className="w-full px-4 py-2 bg-gold-primary text-dark-primary rounded-lg hover:bg-gold-hover transition-colors text-sm font-medium"
              >
                Renovar Acesso
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Clock size={20} className={iconClassName || getStatusColor()} />
        <span className={`font-medium ${getStatusColor()}`}>
          {timeLeft && timeLeft.days === 0
            ? `${timeLeft.hours}h ${timeLeft.minutes}min de acesso`
            : `${timeLeft?.days ?? 0} ${timeLeft?.days === 1 ? 'dia' : 'dias'} de acesso`}
        </span>
      </div>
      <button
        onClick={onRenew}
        className="px-4 py-2 bg-gold-primary text-dark-primary rounded-lg hover:bg-gold-hover transition-colors text-sm font-medium"
      >
        Renovar Acesso
      </button>
    </div>
  );
};