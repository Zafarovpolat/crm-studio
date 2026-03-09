import { useEffect, useState } from 'react';
import { Plus, UserPlus, Mail, Phone, Clock, Shield, ShieldCheck, ShieldAlert, UserX } from 'lucide-react';
import api from '../../api/axios';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import {
  EMPLOYEE_TYPES, ROLES, formatDate, formatSeconds,
} from '../../utils/constants';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

export default function TeamPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'admin';

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { data } = await api.patch(`/users/${userId}/role`, { role: newRole });
      toast.success(`Роль изменена на "${roleLabels[newRole]}"`);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...data } : u)));
      setSelectedUser((prev) => (prev && prev.id === userId ? { ...prev, ...data } : prev));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Не удалось сменить роль');
    }
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Вы уверены, что хотите деактивировать этого пользователя?')) return;
    try {
      await api.patch(`/users/${userId}/deactivate`);
      toast.success('Пользователь деактивирован');
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const roleColors = { admin: 'red', manager: 'blue', executor: 'green' };
  const roleLabels = { admin: 'Администратор', manager: 'Менеджер', executor: 'Исполнитель' };
  const typeLabels = { staff: 'Штатный', contractor: 'Подрядчик', freelancer: 'Фрилансер' };
  const roleIcons = { admin: ShieldAlert, manager: ShieldCheck, executor: Shield };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Команда</h1>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Пригласить
        </button>
      </div>

      {/* Сводка */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-3xl font-bold text-gray-900">{users.length}</p>
          <p className="text-sm text-gray-500">Всего сотрудников</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-3xl font-bold text-gray-900">
            {users.filter((u) => u.employeeType === 'staff').length}
          </p>
          <p className="text-sm text-gray-500">Штатные</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-3xl font-bold text-gray-900">
            {users.filter((u) => u.employeeType !== 'staff').length}
          </p>
          <p className="text-sm text-gray-500">Подрядчики и фрилансеры</p>
        </div>
      </div>

      {/* Карточки сотрудников */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <div
            key={user.id}
            onClick={() => setSelectedUser(user)}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-lg font-bold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.position || 'Не указана'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={roleColors[user.role]}>{roleLabels[user.role]}</Badge>
                  <span className="text-xs text-gray-400">{typeLabels[user.employeeType] || 'Штатный'}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
              {user.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {user.email}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Модалка приглашения (регистрация нового сотрудника) */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Пригласить сотрудника">
        <InviteForm onSaved={() => { setShowInvite(false); fetchUsers(); }} onCancel={() => setShowInvite(false)} />
      </Modal>

      {/* Модалка карточки сотрудника */}
      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)} title="Карточка сотрудника">
        {selectedUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xl font-bold">
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedUser.name}</h3>
                <p className="text-sm text-gray-500">{selectedUser.position || 'Не указана'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-gray-400">Email</span>
                <p className="text-sm text-gray-700">{selectedUser.email}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Тип</span>
                <p className="text-sm text-gray-700">{typeLabels[selectedUser.employeeType] || 'Штатный'}</p>
              </div>
            </div>

            {/* Секция управления ролью */}
            <div className="pt-4 border-t border-gray-200">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Роль</span>
              {isAdmin && selectedUser.id !== currentUser.id ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {ROLES.map((r) => {
                    const RoleIcon = roleIcons[r.value];
                    const isActive = selectedUser.role === r.value;
                    const colorMap = {
                      admin: isActive
                        ? 'bg-red-100 border-red-400 text-red-700 shadow-sm'
                        : 'border-gray-200 text-gray-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600',
                      manager: isActive
                        ? 'bg-blue-100 border-blue-400 text-blue-700 shadow-sm'
                        : 'border-gray-200 text-gray-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600',
                      executor: isActive
                        ? 'bg-green-100 border-green-400 text-green-700 shadow-sm'
                        : 'border-gray-200 text-gray-500 hover:border-green-300 hover:bg-green-50 hover:text-green-600',
                    };
                    return (
                      <button
                        key={r.value}
                        onClick={() => handleRoleChange(selectedUser.id, r.value)}
                        disabled={isActive}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition ${colorMap[r.value]} ${isActive ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <RoleIcon className="w-3.5 h-3.5" />
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-2">
                  <Badge variant={roleColors[selectedUser.role]}>{roleLabels[selectedUser.role]}</Badge>
                  {selectedUser.id === currentUser.id && (
                    <span className="ml-2 text-xs text-gray-400">(вы)</span>
                  )}
                </div>
              )}
            </div>

            {/* Кнопка деактивации (только для admin, не для себя) */}
            {isAdmin && selectedUser.id !== currentUser.id && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleDeactivate(selectedUser.id)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                >
                  <UserX className="w-4 h-4" />
                  Деактивировать аккаунт
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function InviteForm({ onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'executor', position: '', employeeType: 'staff',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      toast.success('Сотрудник добавлен');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Имя *</label>
        <input name="name" value={form.name} onChange={handleChange} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Email *</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Пароль *</label>
        <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Роль</label>
          <select name="role" value={form.role} onChange={handleChange} className={inputClass}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Тип</label>
          <select name="employeeType" value={form.employeeType} onChange={handleChange} className={inputClass}>
            {EMPLOYEE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass}>Должность</label>
        <input name="position" value={form.position} onChange={handleChange} className={inputClass} />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
          Отмена
        </button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50">
          {loading ? 'Создание...' : 'Добавить'}
        </button>
      </div>
    </form>
  );
}
