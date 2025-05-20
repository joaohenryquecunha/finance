import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../utils/firebaseHelpers';
import { CheckCircle, XCircle, UserCheck, UserX, Search, LogOut, Users, Clock, Calendar, AlertTriangle, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDiasRestantes } from '../utils/access';
import { parseISO, addDays, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UserData {
  uid: string;
  username: string;
  isAdmin: boolean;
  isApproved: boolean;
  accessDuration?: number;
  createdAt?: string;
  profile?: {
    cpf: string;
    phone: string;
  };
}

interface AccessModalProps {
  user: UserData;
  onClose: () => void;
  onSave: (userId: string, accessDuration: number, expirationDate: string) => Promise<void>;
}

interface DeleteUserModalProps {
  user: UserData;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ user, onClose, onConfirm }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-dark-secondary w-full max-w-md rounded-xl">
        <div className="p-4 border-b border-dark-tertiary">
          <h2 className="text-lg font-semibold text-red-400">Excluir Usuário</h2>
          <p className="text-sm text-gray-400 mt-1">{user.username}</p>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-400/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="text-gray-200 mb-4">
              Você está prestes a excluir permanentemente este usuário e todos os seus dados.
            </p>
            <p className="text-sm text-red-400 font-medium">
              Esta ação não pode ser desfeita!
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-400 hover:text-gray-300 bg-dark-tertiary rounded-lg"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="flex-1 bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Excluindo...' : 'Excluir Usuário'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AccessModal: React.FC<AccessModalProps> = ({ user, onClose, onSave }) => {
  const [days, setDays] = useState('30');
  const [isLoading, setIsLoading] = useState(false);
  const [operation, setOperation] = useState<'add' | 'remove'>('add');

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const daysNumber = parseInt(days);
      
      // Calculate new duration based on operation
      let newDuration = user.accessDuration || 0;
      if (operation === 'add') {
        newDuration += (daysNumber * 24 * 60 * 60); // Convert days to seconds
      } else {
        newDuration = Math.max(0, newDuration - (daysNumber * 24 * 60 * 60));
      }

      // Calculate new expiration date
      const startDate = user.createdAt ? new Date(user.createdAt) : new Date();
      const expirationDate = addDays(startDate, Math.floor(newDuration / (24 * 60 * 60))).toISOString();

      await onSave(user.uid, newDuration, expirationDate);
      onClose();
    } catch (error) {
      console.error('Error updating access:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentDays = user.accessDuration ? Math.floor(user.accessDuration / (24 * 60 * 60)) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-secondary rounded-xl w-full max-w-md">
        <div className="p-4 border-b border-dark-tertiary">
          <h2 className="text-lg font-semibold text-gold-primary">
            Gerenciar Período de Acesso
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {user.username}
          </p>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-dark-tertiary rounded-lg p-4">
            <p className="text-sm text-gray-400">Período atual</p>
            <p className="text-lg font-medium text-gray-200 mt-1">
              {currentDays} dias
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setOperation('add')}
              className={`p-3 rounded-lg transition-colors ${
                operation === 'add'
                  ? 'bg-emerald-400/10 text-emerald-400 border-2 border-emerald-400'
                  : 'bg-dark-tertiary text-gray-400 border-2 border-transparent'
              }`}
            >
              Adicionar dias
            </button>
            <button
              onClick={() => setOperation('remove')}
              className={`p-3 rounded-lg transition-colors ${
                operation === 'remove'
                  ? 'bg-red-400/10 text-red-400 border-2 border-red-400'
                  : 'bg-dark-tertiary text-gray-400 border-2 border-transparent'
              }`}
            >
              Remover dias
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quantidade de dias
            </label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              min="1"
              className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent"
              placeholder="Ex: 30"
            />
          </div>

          <div className="bg-dark-tertiary rounded-lg p-4 mt-4">
            <p className="text-sm text-gray-400">Após a alteração</p>
            <p className={`text-lg font-medium mt-1 ${
              operation === 'add' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {operation === 'add' 
                ? `${currentDays + parseInt(days || '0')} dias`
                : `${Math.max(0, currentDays - parseInt(days || '0'))} dias`
              }
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-gold-primary"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !days || parseInt(days) <= 0}
              className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                operation === 'add'
                  ? 'bg-emerald-400 text-dark-primary hover:bg-emerald-500'
                  : 'bg-red-400 text-dark-primary hover:bg-red-500'
              }`}
            >
              {isLoading ? 'Salvando...' : operation === 'add' ? 'Adicionar' : 'Remover'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers as UserData[]);
    };
    fetchUsers();
  }, []);

  const handleDeleteUser = async (user: UserData) => {
    try {
      // Delete user document
      await deleteDoc(doc(db, 'users', user.uid));
      // Delete user data document
      await deleteDoc(doc(db, 'userData', user.uid));
      
      // Update local state
      setUsers(users.filter(u => u.uid !== user.uid));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate user statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.isApproved).length;
  const inactiveUsers = users.filter(user => !user.isApproved).length;
  const trialUsers = users.filter(user => {
    if (user.isAdmin) return false;
    return getDiasRestantes(user.accessDuration, user.createdAt) > 0;
  }).length;

  const getAccessStatus = (user: UserData) => {
    if (user.isAdmin) return { text: 'Acesso permanente', color: 'text-emerald-400' };
    const diasRestantes = getDiasRestantes(user.accessDuration, user.createdAt);
    if (diasRestantes === 0) return { text: 'Expirado', color: 'text-red-400' };
    return { text: `${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'} de acesso`, color: 'text-emerald-400' };
  };

  const getAccountAge = (createdAt?: string) => {
    if (!createdAt) return 'Data desconhecida';
    return formatDistanceToNow(parseISO(createdAt), { locale: ptBR, addSuffix: true });
  };

  const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-dark-tertiary rounded-lg p-4 flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        <p className="text-2xl font-semibold text-gold-primary mt-1">{value}</p>
      </div>
      <div className="p-3 rounded-full bg-dark-secondary text-gold-primary">
        {icon}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-primary p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-dark-secondary rounded-xl shadow-gold-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <h1 className="text-2xl font-bold text-gold-primary">Gerenciamento de Usuários</h1>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-dark-tertiary text-gray-300 rounded-lg hover:text-gold-primary transition-colors"
              >
                <LogOut size={20} />
                <span>Sair</span>
              </button>
            </div>
            
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Buscar usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 pl-10 pr-4 py-2 focus:ring-2 focus:ring-gold-primary focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total de Usuários"
              value={totalUsers}
              icon={<Users size={24} />}
            />
            <StatCard
              title="Usuários Ativos"
              value={activeUsers}
              icon={<UserCheck size={24} />}
            />
            <StatCard
              title="Usuários Inativos"
              value={inactiveUsers}
              icon={<UserX size={24} />}
            />
            <StatCard
              title="Em Período de Teste"
              value={trialUsers}
              icon={<Clock size={24} />}
            />
          </div>

          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.uid}
                className="bg-dark-tertiary rounded-lg p-4"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-200 font-medium">{user.username}</p>
                      {user.isAdmin ? (
                        <span className="text-xs bg-gold-primary/20 text-gold-primary px-2 py-1 rounded-full">
                          Administrador
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-500/20 text-gray-300 px-2 py-1 rounded-full">
                          Usuário
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-gray-400">Criado: </span>
                        <span className="text-gray-300">{getAccountAge(user.createdAt)}</span>
                      </div>
                      {!user.isAdmin && (
                        <div className={`flex items-center gap-1 text-sm ${getAccessStatus(user).color}`}>
                          <span>•</span>
                          <span>{getAccessStatus(user).text}</span>
                        </div>
                      )}
                    </div>
                    {user.profile && (
                      <div className="mt-2 text-sm text-gray-400">
                        <span>CPF: {user.profile.cpf} • </span>
                        <span>Telefone: {user.profile.phone}</span>
                      </div>
                    )}
                  </div>

                  {!user.isAdmin && (
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2 text-gray-400 hover:text-gold-primary hover:bg-dark-secondary rounded-lg transition-colors"
                        title="Definir período de acesso"
                      >
                        <Calendar size={20} />
                      </button>
                      <div className="flex items-center">
                        {user.isApproved ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <span className="ml-2 text-sm text-gray-400">
                          {user.isApproved ? 'Aprovado' : 'Pendente'}
                        </span>
                      </div>
                      {!user.isApproved ? (
                        <button
                          onClick={() => console.error('Aprovação de usuário não implementada.')}
                          className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                          title="Aprovar usuário"
                        >
                          <UserCheck className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => console.error('Desaprovação de usuário não implementada.')}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Revogar aprovação"
                        >
                          <UserX className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => setUserToDelete(user)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Excluir usuário"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <p className="text-center text-gray-400 py-4">
                {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário registrado além do administrador'}
              </p>
            )}
          </div>
        </div>
      </div>

      {selectedUser && (
        <AccessModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSave={() => {
            console.error('Atualização de acesso não implementada.');
            return Promise.resolve();
          }}
        />
      )}

      {userToDelete && (
        <DeleteUserModal
          user={userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={() => handleDeleteUser(userToDelete)}
        />
      )}
    </div>
  );
};