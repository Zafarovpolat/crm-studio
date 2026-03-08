import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', position: '' });
  const { register, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(form);
      navigate('/');
    } catch {
      // ошибка уже в store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-xl mb-4">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Регистрация</h1>
            <p className="text-gray-500 mt-1">Создайте аккаунт в CRM Studio</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-danger-50 text-danger-600 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Имя</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="Иван Иванов"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="email@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Должность</label>
              <input
                type="text"
                name="position"
                value={form.position}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="Frontend-разработчик"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Пароль</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="Минимум 6 символов"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
            >
              {loading ? 'Создание...' : 'Создать аккаунт'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
