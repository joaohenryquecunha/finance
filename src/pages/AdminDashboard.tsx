import React, { useState, useEffect } from 'react';
import { getAllUsers, approveUser, disapproveUser, deleteUser } from '../contexts/AuthContext';
import { CheckCircle, XCircle, UserCheck, UserX, Search, LogOut, Users, Calendar, Lock, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, differenceInDays, parseISO, addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserData {
  uid: string;
  username: string;
  isAdmin: boolean;
  isApproved: boolean;
  createdAt: string;
  accessDuration?: number;
  accessExpirationDate?: string | null;
}

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [accessDuration, setAccessDuration] = useState('30');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers as UserData[]);
    };
    fetchUsers();
  }, []);

  const handleApproveUser = async (uid: string, duration: number) => {
    await approveUser(uid, duration);
    const updatedUsers = await getAllUsers();
    setUsers(updatedUsers as UserData[]);
    setShowAccessModal(false);
    setSelectedUser(null);
  };

  const handleDisapproveUser = async (uid: string) => {
    await disapproveUser(uid);
    const updatedUsers = await getAllUsers();
    setUsers(updatedUsers as UserData[]);
  };

  const handleDeleteUser = async (uid: string) => {
    if (deletingId === uid) {
      try {
        await deleteUser(uid);
        setUsers(users.filter(user => user.uid !== uid));
        setDeletingId(null);
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Erro ao deletar usuário');
      }
    } else {
      setDeletingId(uid);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRemainingDays = (user: UserData) => {
    if (!user.accessExpirationDate) return 0;
    try {
      const expirationDate = parseISO(user.accessExpirationDate);
      const now = new Date();
      return Math.max(0, differenceInDays(expirationDate, now));
    } catch (error) {
      console.error('Error calculating remaining days:', error);
      return 0;
    }
  };

  const getAccessColor = (remainingDays: number) => {
    if (remainingDays <= 0) return 'text-red-500';
    if (remainingDays <= 3) return 'text-red-400';
    if (remainingDays <= 5) return 'text-amber-400';
    if (remainingDays <= 10) return 'text-yellow-400';
    if (remainingDays <= 15) return 'text-lime-400';
    return 'text-emerald-400';
  };

  const getUserStatus = (user: UserData) => {
    if (user.isAdmin) return { label: 'Administrador', color: 'text-gold-primary' };
    if (!user.isApproved) return { label: 'Pendente', color: 'text-red-400' };
    
    if (user.accessExpirationDate) {
      try {
        const expirationDate = parseISO(user.accessExpirationDate);
        const now = new Date();
        
        if (now > expirationDate) {
          return { label: 'Bloqueado', color: 'text-red-400' };
        }
        
        const daysRemaining = differenceInDays(expirationDate, now);
        return { 
          label: `${daysRemaining} dias restantes`, 
          color: getAccessColor(daysRemaining)
        };
      } catch (error) {
        console.error('Error calculating user status:', error);
        return { label: 'Erro no status', color: 'text-red-400' };
      }
    }
    
    return { label: 'Ativo', color: 'text-emerald-400' };
  };

  // Calculate user statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(user => {
    if (!user.isApproved) return false;
    if (!user.accessExpirationDate) return true;
    try {
      return new Date() <= parseISO(user.accessExpirationDate);
    } catch (error) {
      return false;
    }
  }).length;
  const blockedUsers = users.filter(user => {
    if (!user.accessExpirationDate) return false;
    try {
      return new Date() > parseISO(user.accessExpirationDate);
    } catch (error) {
      return false;
    }
  }).length;
  const pendingUsers = users.filter(user => !user.isApproved).length;

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

  const formatExpirationDate = (date: string | null | undefined) => {
    if (!date) return '';
    try {
      return format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      console.error('Error formatting expiration date:', error);
      return 'Data inválida';
    }
  };

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
              title="Usuários Bloqueados"
              value={blockedUsers}
              icon={<Lock size={24} />}
            />
            <StatCard
              title="Aguardando Aprovação"
              value={pendingUsers}
              icon={<UserX size={24} />}
            />
          </div>

          <div className="space-y-4">
            {filteredUsers.map((user) => {
              const status = getUserStatus(user);
              const remainingDays = getRemainingDays(user);
              
              return (
                <div
                  key={user.uid}
                  className="bg-dark-tertiary rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-gray-200 font-medium">{user.username}</p>
                        <p className={`text-sm ${status.color}`}>
                          {status.label}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-400">
                        Criado {formatDistanceToNow(parseISO(user.createdAt), { addSuffix: true, locale: ptBR })}
                      </p>
                      {user.accessExpirationDate && (
                        <>
                          <p className="text-sm text-gray-400">
                            Acesso até {formatExpirationDate(user.accessExpirationDate)}
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock size={14} className={getAccessColor(remainingDays)} />
                            <span className={getAccessColor(remainingDays)}>
                              {remainingDays} {remainingDays === 1 ? 'dia' : 'dias'} de acesso
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {!user.isAdmin && (
                    <div className="flex items-center gap-2">
                      {!user.isApproved ? (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setAccessDuration('30');
                            setShowAccessModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors"
                        >
                          <UserCheck size={20} />
                          <span>Aprovar</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDisapproveUser(user.uid)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                          <UserX size={20} />
                          <span>Bloquear</span>
                        </button>
                      )}
                      
                      {user.isApproved && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setAccessDuration(remainingDays.toString());
                            setShowAccessModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-dark-secondary text-gray-300 rounded-lg hover:text-gold-primary transition-colors"
                          title="Alterar período de acesso"
                        >
                          <Calendar size={20} />
                          <span className="hidden sm:inline">Adicionar Dias</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteUser(user.uid)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          deletingId === user.uid
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-dark-secondary text-gray-300 hover:text-red-400'
                        }`}
                        title={deletingId === user.uid ? 'Confirmar exclusão' : 'Deletar usuário'}
                      >
                        <Trash2 size={20} />
                        <span className="hidden sm:inline">
                          {deletingId === user.uid ? 'Confirmar' : 'Deletar'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredUsers.length === 0 && (
              <p className="text-center text-gray-400 py-4">
                {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário registrado além do administrador'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Access Duration Modal */}
      {showAccessModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-secondary rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gold-primary mb-4">
              {selectedUser.isApproved ? 'Adicionar Dias de Acesso' : 'Definir Período de Acesso'}
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {selectedUser.isApproved ? 'Dias a adicionar' : 'Duração do Acesso (em dias)'}
              </label>
              <input
                type="number"
                min="1"
                value={accessDuration}
                onChange={(e) => setAccessDuration(e.target.value)}
                className="w-full rounded-lg bg-dark-tertiary border-dark-tertiary text-gray-200 p-3 focus:ring-2 focus:ring-gold-primary focus:border-transparent"
              />
            </div>

            <div className="text-sm text-gray-400 mb-6 space-y-2">
              {selectedUser.isApproved && selectedUser.accessExpirationDate && (
                <p>
                  Dias atuais: {getRemainingDays(selectedUser)} dias
                </p>
              )}
              {accessDuration && (
                <p>
                  {selectedUser.isApproved ? 'Novo total de dias: ' : 'Total de dias: '}
                  <span className="text-gold-primary font-medium">
                    {selectedUser.isApproved 
                      ? (getRemainingDays(selectedUser) + parseInt(accessDuration))
                      : accessDuration
                    } dias
                  </span>
                </p>
              )}
              <p>
                Acesso válido até:{' '}
                <span className="text-gold-primary font-medium">
                  {format(
                    addDays(
                      selectedUser.isApproved && selectedUser.accessExpirationDate
                        ? parseISO(selectedUser.accessExpirationDate)
                        : new Date(),
                      parseInt(accessDuration)
                    ),
                    "dd 'de' MMMM 'de' yyyy",
                    { locale: ptBR }
                  )}
                </span>
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowAccessModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-400 hover:text-gold-primary"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleApproveUser(selectedUser.uid, parseInt(accessDuration))}
                className="px-4 py-2 bg-gold-primary text-dark-primary rounded-lg hover:bg-gold-hover transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};