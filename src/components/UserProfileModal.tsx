import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isEmailInUse } from '../utils/userHelpers';

interface UserProfileModalProps {
  onSubmit: (data: { cpf?: string; phone?: string; email?: string }) => Promise<void>;
  initialProfile?: { cpf?: string; phone?: string; email?: string };
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ onSubmit, initialProfile }) => {
  const [cpf, setCpf] = useState(initialProfile?.cpf || '');
  const [phone, setPhone] = useState(initialProfile?.phone || '');
  const [email, setEmail] = useState(initialProfile?.email || '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const missingCPF = !initialProfile?.cpf;
  const missingPhone = !initialProfile?.phone;
  const missingEmail = !initialProfile?.email;

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const validateCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleanCPF)) return false;
    let sum = 0;
    let remainder;
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const data: { cpf?: string; phone?: string; email?: string } = {};
    if (missingCPF) {
      const cleanCPF = cpf.replace(/\D/g, '');
      if (!validateCPF(cleanCPF)) {
        setError('CPF inválido');
        return;
      }
      data.cpf = cleanCPF;
    }
    if (missingPhone) {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 11) {
        setError('Número de telefone inválido');
        return;
      }
      data.phone = cleanPhone;
    }
    if (missingEmail) {
      if (!email || !/^([^@\s]+)@([^@\s]+)\.[^@\s]+$/.test(email)) {
        setError('E-mail inválido');
        return;
      }
      // Validação de e-mail único
      const emailExists = await isEmailInUse(email);
      if (emailExists) {
        setError('Este e-mail já está em uso por outro usuário.');
        return;
      }
      data.email = email;
    }
    setIsLoading(true);
    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-secondary w-full max-w-md rounded-xl">
        <div className="p-4 border-b border-dark-tertiary flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gold-primary">Complete seu Cadastro</h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gold-primary rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {missingCPF && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                CPF
              </label>
              <input
                type="text"
                required
                maxLength={14}
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent"
                placeholder="000.000.000-00"
                disabled={isLoading}
              />
            </div>
          )}
          {missingPhone && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Telefone
              </label>
              <input
                type="text"
                required
                maxLength={15}
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent"
                placeholder="(00) 00000-0000"
                disabled={isLoading}
              />
            </div>
          )}
          {missingEmail && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent"
                placeholder="Digite seu e-mail"
                disabled={isLoading}
              />
            </div>
          )}
          {error && (
            <div className="text-sm text-red-400 text-center bg-red-400/10 p-3 rounded-lg">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading || (missingCPF && !cpf) || (missingPhone && !phone) || (missingEmail && !email)}
            className="w-full bg-gold-primary text-dark-primary px-4 py-3 rounded-lg hover:bg-gold-hover transition-colors disabled:opacity-50 font-medium"
          >
            {isLoading ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>
    </div>
  );
};