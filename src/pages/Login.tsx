import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, Settings, Loader2, UserPlus, LogIn } from 'lucide-react';
import { RenewalModal } from '../components/RenewalModal';
import { isEmailInUse } from '../utils/userHelpers';

export const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const expired = searchParams.get('expired');
    if (expired === 'true') {
      setShowRenewalModal(true);
      setError('Seu acesso expirou. Renove para continuar.');
    }
  }, [searchParams]); // Removido showRenewalModal para evitar loops

  // Effect to handle WhatsApp button animation
  useEffect(() => {
    const timer = setInterval(() => {
      setShowWhatsApp(prev => !prev);
    }, 3000);

    return () => clearInterval(timer);
  }, []); // Garantir que o timer seja configurado apenas uma vez

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
    if (isLoading) return;
    
    setError('');
    setSuccess('');

    if (isRegistering) {
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem');
        return;
      }
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        setError('E-mail inválido');
        return;
      }
      // Validação de e-mail único
      const emailExists = await isEmailInUse(email);
      if (emailExists) {
        setError('Este e-mail já está em uso por outro usuário.');
        return;
      }
      const cleanCPF = cpf.replace(/\D/g, '');
      const cleanPhone = phone.replace(/\D/g, '');
      if (!validateCPF(cleanCPF)) {
        setError('CPF inválido');
        return;
      }
      if (cleanPhone.length < 11) {
        setError('Número de telefone inválido');
        return;
      }
    }
    
    setIsLoading(true);

    try {
      if (isRegistering) {
        const cleanCPF = cpf.replace(/\D/g, '');
        const cleanPhone = phone.replace(/\D/g, '');
        await signUp(username, password, { cpf: cleanCPF, phone: cleanPhone, email });
        setSuccess('Conta criada com sucesso! Você tem 30 dias de acesso gratuito.');
        setIsRegistering(false);
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setCpf('');
        setPhone('');
        setEmail('');
      } else {
        await signIn(username, password, showAdminLogin);
        if (showAdminLogin) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  // Adicionando fallback para evitar tela branca
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gold-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4">
      {/* WhatsApp Button */}
      <a
        href="https://www.contate.me/januzzifinance"
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed top-4 left-4 z-50 transition-all duration-500 ease-in-out transform ${
          showWhatsApp ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-green-400 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
          <div className="relative flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transition-colors">
             <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              width="20"
              height="20"
              fill="white"
            >
              <path
                d="M16 0C7.163 0 0 7.163 0 16c0 2.84.741 5.536 2.03 7.898L0 32l8.302-2.26A15.896 15.896 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.2a13.2 13.2 0 0 1-6.625-1.754l-.474-.28-4.949 1.347 1.317-4.822-.306-.487A13.182 13.182 0 0 1 2.8 16c0-7.298 5.902-13.2 13.2-13.2S29.2 8.702 29.2 16 23.298 29.2 16 29.2zm6.988-9.158c-.385-.193-2.18-1.078-2.544-1.205-.364-.128-.627-.193-.892.193s-1.048 1.205-1.285 1.448c-.237.244-.445.274-.83.081-.385-.193-1.628-.601-3.094-1.916-1.143-1.02-1.906-2.283-2.123-2.683-.217-.4-.028-.596.163-.789.168-.167.385-.44.577-.66.193-.22.256-.366.385-.61.128-.244.064-.457-.032-.65-.097-.193-.892-2.152-1.223-2.949-.321-.772-.648-.668-.892-.68-.23-.01-.492-.012-.753-.012-.26 0-.684.098-1.042.476-.358.378-1.368 1.34-1.368 3.27 0 1.929 1.401 3.795 1.596 4.053.195.258 2.754 4.38 6.674 5.74.934.318 1.662.508 2.23.648.937.228 1.79.195 2.461.118.751-.089 2.262-.922 2.584-1.812.321-.89.321-1.649.224-1.811-.097-.163-.26-.26-.645-.452z"
              />
            </svg>
            <span className="font-medium">Suporte</span>
          </div>
        </div>
      </a>

      <div className="bg-dark-secondary p-6 sm:p-8 rounded-xl shadow-gold-lg w-full max-w-md relative">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="relative">
            <div className="bg-dark-tertiary p-3 rounded-full animate-bounce">
              <Wallet className="w-8 h-8 text-gold-primary animate-pulse" />
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <span className="text-gold-primary font-bold text-lg tracking-wider animate-slide-up">
                Uzzi Finance
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-center mb-10 sm:mb-8">
          <div className="bg-dark-tertiary rounded-lg p-1 w-full sm:w-auto">
            <div className="grid grid-cols-2">
              <button
                onClick={() => !isLoading && setIsRegistering(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  !isRegistering
                    ? 'bg-gold-primary text-dark-primary'
                    : 'text-gray-400 hover:text-gray-300'
                } flex items-center justify-center gap-2`}
              >
                <LogIn size={18} className="hidden sm:block" />
                <span>Entrar</span>
              </button>
              {!showAdminLogin && (
                <button
                  onClick={() => !isLoading && setIsRegistering(true)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isRegistering
                      ? 'bg-gold-primary text-dark-primary'
                      : 'text-gray-400 hover:text-gray-300'
                  } flex items-center justify-center gap-2`}
                >
                  <UserPlus size={18} className="hidden sm:block" />
                  <span>Criar Conta</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gold-primary text-center mb-6">
          {showAdminLogin ? 'Acesso Administrativo' : 'Acesso ao Sistema'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
              Nome de Usuário
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              disabled={isLoading}
              className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent disabled:opacity-50"
              placeholder={showAdminLogin ? 'Usuário administrador' : 'Digite seu usuário'}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent disabled:opacity-50"
              placeholder={isRegistering ? 'Mínimo 6 caracteres' : 'Digite sua senha'}
            />
          </div>

          {isRegistering && (
            <>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  Confirmar Senha
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent disabled:opacity-50"
                  placeholder="Digite a senha novamente"
                />
              </div>

              <div>
                <label htmlFor="cpf" className="block text-sm font-medium text-gray-300 mb-1">
                  CPF
                </label>
                <input
                  id="cpf"
                  type="text"
                  required
                  maxLength={14}
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  disabled={isLoading}
                  className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent disabled:opacity-50"
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                  Telefone
                </label>
                <input
                  id="phone"
                  type="text"
                  required
                  maxLength={15}
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  disabled={isLoading}
                  className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent disabled:opacity-50"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent disabled:opacity-50"
                  placeholder="Digite seu e-mail"
                />
              </div>
            </>
          )}

          {error && (
            <div className="text-sm text-red-400 text-center bg-red-400/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-emerald-400 text-center bg-emerald-400/10 p-3 rounded-lg">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !username || !password || (isRegistering && (!confirmPassword || !cpf || !phone))}
            className="w-full bg-gold-primary text-dark-primary font-medium py-3 px-4 rounded-lg hover:bg-gold-hover transition-colors disabled:opacity-50 disabled:hover:bg-gold-primary flex items-center justify-center gap-2 h-12 mt-6"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {showAdminLogin ? 'Acessar Painel Admin' : (isRegistering ? 'Criar Conta' : 'Entrar')}
              </>
            )}
          </button>
        </form>

        <button
          onClick={() => {
            setShowAdminLogin(!showAdminLogin);
            setError('');
            setSuccess('');
            setUsername('');
            setPassword('');
            setConfirmPassword('');
            setCpf('');
            setPhone('');
            setEmail('');
            setIsRegistering(false);
          }}
          className={`absolute top-4 right-4 p-2 transition-colors ${
            showAdminLogin 
              ? 'text-gold-primary hover:text-gold-hover' 
              : 'text-gray-400 hover:text-gold-primary'
          }`}
          title={showAdminLogin ? 'Voltar ao login normal' : 'Acesso Administrativo'}
        >
          <Settings size={20} />
        </button>
      </div>

      {showRenewalModal && (
        <RenewalModal
          onClose={() => {
            setShowRenewalModal(false);
            // Se está na rota ?expired=true, redireciona para /login sem query
            if (window.location.search.includes('expired=true')) {
              navigate('/login', { replace: true });
            }
          }}
          daysRemaining={0}
        />
      )}
    </div>
  );
};