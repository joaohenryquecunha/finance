import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ProfileEditorProps {
  currentUsername: string;
  onUpdateUsername: (newUsername: string) => Promise<void>;
  onUpdatePassword?: (currentPassword: string, newPassword: string) => Promise<void>;
  onClose: () => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({
  currentUsername,
  onUpdateUsername,
  onUpdatePassword,
  onClose
}) => {
  const [username, setUsername] = useState(currentUsername);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'username' | 'password'>('username');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (activeTab === 'username') {
      if (!username.trim() || username === currentUsername) {
        onClose();
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        await onUpdateUsername(username.trim());
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao atualizar nome de usuário');
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError('Todos os campos são obrigatórios');
        return;
      }

      if (newPassword.length < 6) {
        setError('A nova senha deve ter pelo menos 6 caracteres');
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('As senhas não coincidem');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        if (onUpdatePassword) {
          await onUpdatePassword(currentPassword, newPassword);
          onClose();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao atualizar senha');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-secondary w-full sm:rounded-xl sm:max-w-md">
        <div className="p-4 border-b border-dark-tertiary flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gold-primary">Editar Perfil</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gold-primary rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="flex border-b border-dark-tertiary mb-4">
            <button
              onClick={() => setActiveTab('username')}
              className={`px-4 py-2 -mb-px text-sm font-medium ${
                activeTab === 'username'
                  ? 'text-gold-primary border-b-2 border-gold-primary'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Nome de Usuário
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-4 py-2 -mb-px text-sm font-medium ${
                activeTab === 'password'
                  ? 'text-gold-primary border-b-2 border-gold-primary'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Senha
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'username' ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome de Usuário
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent"
                  placeholder="Digite seu novo nome de usuário"
                  disabled={isLoading}
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Senha Atual
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent"
                    placeholder="Digite sua senha atual"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent"
                    placeholder="Mínimo 6 caracteres"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent"
                    placeholder="Digite a nova senha novamente"
                    disabled={isLoading}
                  />
                </div>
              </>
            )}

            {error && (
              <div className="text-sm text-red-400 text-center bg-red-400/10 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-gray-400 hover:text-gold-primary bg-dark-tertiary rounded-lg"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-gold-primary text-dark-primary px-4 py-3 rounded-lg hover:bg-gold-hover transition-colors disabled:opacity-50"
                disabled={isLoading || (activeTab === 'username' && (!username.trim() || username === currentUsername))}
              >
                {isLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};