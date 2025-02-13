import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, Settings, Loader2, UserPlus, LogIn } from 'lucide-react';

export const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Effect to handle WhatsApp button animation
  useEffect(() => {
    const timer = setInterval(() => {
      setShowWhatsApp(prev => !prev);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

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
    }
    
    setIsLoading(true);

    try {
      if (isRegistering) {
        await signUp(username, password);
        setSuccess('Conta criada com sucesso! Aguarde a aprovação do administrador.');
        setIsRegistering(false);
        setUsername('');
        setPassword('');
        setConfirmPassword('');
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

  const switchMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setSuccess('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

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
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="animate-bounce"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span className="font-medium">Obter Acesso</span>
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
                Januzzi Finance
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
            disabled={isLoading || !username || !password || (isRegistering && !confirmPassword)}
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
    </div>
  );
};