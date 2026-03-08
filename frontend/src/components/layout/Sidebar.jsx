import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ListTodo,
  Receipt,
  UsersRound,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const navigation = [
  { name: 'Дашборд', to: '/', icon: LayoutDashboard },
  { name: 'Клиенты', to: '/clients', icon: Users },
  { name: 'Проекты', to: '/projects', icon: FolderKanban },
  { name: 'Задачи', to: '/tasks', icon: ListTodo },
  { name: 'Финансы', to: '/finance', icon: Receipt },
  { name: 'Команда', to: '/team', icon: UsersRound },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-200 z-30',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Логотип */}
      <div className="h-16 flex items-center px-4 border-b border-gray-200">
        <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">CS</span>
        </div>
        {!collapsed && (
          <span className="ml-3 font-bold text-gray-900 text-lg">CRM Studio</span>
        )}
      </div>

      {/* Навигация */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Свернуть/развернуть */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="m-3 p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </aside>
  );
}
