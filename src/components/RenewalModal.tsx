import React, { useState, useEffect } from 'react';
import { X, CreditCard, Calendar, Crown, Star, Shield } from 'lucide-react';
import { PaymentConfirmationModal } from './PaymentConfirmationModal';

interface Plan {
  id: string;
  name: string;
  days: number;
  monthlyPrice: number;
  fullPrice: number;
  link: string;
  recommended?: boolean;
  features: string[];
  icon: React.ReactNode;
}

interface RenewalModalProps {
  onClose: () => void;
  daysRemaining: number;
}

const plans: Plan[] = [
  {
    id: '30days',
    name: '1 mês de acesso',
    days: 30,
    monthlyPrice: 5.14,
    fullPrice: 49.90,
    link: 'https://payfast.greenn.com.br/114536', 
    features: [
      'Acesso a todas as funcionalidades',
      'Suporte por WhatsApp',
      'Relatórios em PDF'
    ],
    icon: <Shield className="w-6 h-6 text-gold-primary" />
  },
  {
    id: '180days',
    name: '6 meses de acesso',
    days: 180,
    monthlyPrice: 25.70,
    fullPrice: 249.90,
    link: 'https://payfast.greenn.com.br/114905', // Replace with actual payment link
    features: [
      'Acesso a todas as funcionalidades',
      'Suporte prioritário',
      'Relatórios em PDF',
      'Economia de 16%'
    ],
    icon: <Star className="w-6 h-6 text-gold-primary" />
  },
  {
    id: '365days',
    name: '1 ano de acesso',
    days: 365,
    monthlyPrice: 51.41,
    fullPrice: 499.90,
    link: 'https://payfast.greenn.com.br/114906', // Replace with actual payment link
    recommended: true,
    features: [
      'Acesso a todas as funcionalidades',
      'Suporte VIP',
      'Relatórios em PDF',
      'Economia de 17%',
      'Acesso antecipado a novidades'
    ],
    icon: <Crown className="w-6 h-6 text-gold-primary" />
  }
];

export const RenewalModal: React.FC<RenewalModalProps> = ({ onClose, daysRemaining }) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handlePlanSelect = (planId: string) => {
    setPendingPlanId(planId);
    setShowConfirmation(true);
  };

  const handleConfirmPurchase = () => {
    const plan = plans.find(p => p.id === pendingPlanId);
    if (plan?.link) {
      window.location.href = plan.link;
    }
    setShowConfirmation(false);
    setPendingPlanId(null);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={handleBackdropClick}
      >
        <div className="bg-dark-secondary w-full max-w-4xl rounded-xl max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6 border-b border-dark-tertiary flex justify-between items-center sticky top-0 bg-dark-secondary z-10">
            <div>
              <h2 className="text-xl font-semibold text-gold-primary">
                Renovar Acesso
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gold-primary rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative bg-dark-tertiary rounded-xl p-6 ${
                    selectedPlan === plan.id
                      ? 'ring-2 ring-gold-primary shadow-gold-lg'
                      : ''
                  } ${plan.recommended ? 'ring-2 ring-gold-primary lg:-translate-y-2' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.recommended && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gold-primary text-dark-primary px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                        Recomendado
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      {plan.icon}
                      <span className="text-sm text-emerald-400 font-medium">
                        {plan.days} dias
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-200 mb-2">
                      {plan.name}
                    </h3>

                    <div className="flex-grow">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-2xl sm:text-3xl font-bold text-gold-primary">
                          12x R$ {plan.monthlyPrice.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-4">
                        ou R$ {plan.fullPrice.toFixed(2)} à vista
                      </p>

                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature, index) => (
                          <li 
                            key={index} 
                            className="flex items-center gap-2 text-sm text-gray-300"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-gold-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlanSelect(plan.id);
                      }}
                      onMouseEnter={() => setHoveredButton(plan.id)}
                      onMouseLeave={() => setHoveredButton(null)}
                      className={`group relative w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-500 ease-out overflow-hidden ${
                        plan.recommended
                          ? 'bg-gold-primary text-dark-primary hover:bg-gold-hover'
                          : 'bg-dark-secondary text-gray-200 hover:bg-dark-primary'
                      }`}
                    >
                      <div className={`absolute inset-0 w-full h-full transition-transform duration-500 ease-out transform ${
                        hoveredButton === plan.id ? 'scale-x-100' : 'scale-x-0'
                      } ${
                        plan.recommended 
                          ? 'bg-gold-hover origin-left'
                          : 'bg-dark-primary origin-left'
                      }`} 
                      />
                      <CreditCard 
                        size={20} 
                        className={`relative transition-transform duration-300 ${
                          hoveredButton === plan.id ? 'scale-110' : ''
                        }`}
                      />
                      <span className="relative">Obter Acesso</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-400 text-center mt-6">
              Pagamento 100% seguro • Satisfação garantida • Suporte exclusivo
            </p>
          </div>
        </div>
      </div>

      {showConfirmation && (
        <PaymentConfirmationModal
          onConfirm={handleConfirmPurchase}
          onClose={() => {
            setShowConfirmation(false);
            setPendingPlanId(null);
          }}
        />
      )}
    </>
  );
};