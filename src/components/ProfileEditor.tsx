import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ProfileEditorProps {
  currentUsername: string;
  onUpdateUsername: (newUsername: string) => Promise<void>;
  onClose: () => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({
  currentUsername,
  onUpdateUsername,
  onClose
}) => {
  const [username, setUsername] = useState(currentUsername);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

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

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
              disabled={isLoading || !username.trim() || username === currentUsername}
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};