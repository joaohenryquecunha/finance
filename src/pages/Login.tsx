import React, { useState } from 'react';
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
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

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