import React, { useState, useEffect } from 'react';
import { getAllUsers, approveUser, disapproveUser } from '../contexts/AuthContext';
import { CheckCircle, XCircle, UserCheck, UserX, Search, LogOut, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UserData {
  uid: string;
  username: string;
  isAdmin: boolean;
  isApproved: boolean;
}

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers as UserData[]);
    };
    fetchUsers();
  }, []);

  const handleApproveUser = async (uid: string) => {
    await approveUser(uid);
    const updatedUsers = await getAllUsers();
    setUsers(updatedUsers as UserData[]);
  };

  const handleDisapproveUser = async (uid: string) => {
    await disapproveUser(uid);
    const updatedUsers = await getAllUsers();
    setUsers(updatedUsers as UserData[]);
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
          </div>

          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.uid}
                className="bg-dark-tertiary rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-gray-200 font-medium">{user.username}</p>
                  <p className="text-sm text-gray-400">
                    {user.isAdmin ? 'Administrador' : 'Usuário'}
                  </p>
                </div>
                {!user.isAdmin && (
                  <div className="flex items-center gap-4">
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
                        onClick={() => handleApproveUser(user.uid)}
                        className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                        title="Aprovar usuário"
                      >
                        <UserCheck className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDisapproveUser(user.uid)}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Revogar aprovação"
                      >
                        <UserX className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}
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
    </div>
  );
};