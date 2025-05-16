import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface PaymentConfirmationModalProps {
  onConfirm: () => void;
  onClose: () => void;
}

export const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  onConfirm,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-dark-secondary w-full max-w-md rounded-xl">
        <div className="p-4 border-b border-dark-tertiary flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gold-primary">Aviso Importante</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gold-primary rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-400/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-amber-400" />
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="text-gray-200 mb-4">
              Para ativar seu acesso corretamente, o CPF informado durante a compra deve ser <span className="text-gold-primary font-medium">exatamente igual</span> ao CPF cadastrado em sua conta.
            </p>
            <p className="text-sm text-gray-400">
              Caso contrário, seu acesso não será ativado automaticamente e será necessário entrar em contato com o suporte.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-400 hover:text-gold-primary bg-dark-tertiary rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-gold-primary text-dark-primary px-4 py-3 rounded-lg hover:bg-gold-hover transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};