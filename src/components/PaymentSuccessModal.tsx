import React from 'react';
import { CheckCircle, X } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

interface PaymentSuccessModalProps {
  onClose: () => void;
  accessDuration: number; // Duration in seconds
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  onClose,
  accessDuration
}) => {
  const { user } = useAuth();

  const getDurationText = () => {
    if (!user?.createdAt) return '0 dias';
    
    // Convert accessDuration from seconds to days
    const days = Math.floor(accessDuration / (24 * 60 * 60));
    return `${days} dias`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-secondary w-full max-w-md rounded-xl">
        <div className="p-4 border-b border-dark-tertiary flex justify-between items-center">
          <h2 className="text-lg font-semibold text-emerald-400">Pagamento Confirmado</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gold-primary rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-400/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-200 mb-2">
              Acesso Atualizado com Sucesso!
            </h3>
            
            <p className="text-gray-400 mb-4">
              Seu período de acesso foi atualizado para:
            </p>
            
            <p className="text-lg font-medium text-emerald-400">
              {getDurationText()}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 bg-emerald-400 text-dark-primary px-4 py-3 rounded-lg hover:bg-emerald-500 transition-colors font-medium"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};