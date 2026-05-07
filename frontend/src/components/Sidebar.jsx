import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Bot
} from 'lucide-react';

const navItems = [
  { to: '/summary',       icon: LayoutDashboard, label: 'Resumen'        },
  { to: '/conversations', icon: MessageSquare,   label: 'Conversaciones' },
  { to: '/analytics',     icon: BarChart3,       label: 'Analytics'      },
  { to: '/config',        icon: Settings,        label: 'Configuración'  },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-dark-800 border-r border-slate-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">AI Dashboard</h1>
            <p className="text-slate-400 text-xs">{user?.orgName}</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Usuario */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
            alt="avatar"
            className="w-8 h-8 rounded-full bg-slate-600"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-slate-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm transition-colors w-full px-2 py-1.5 rounded hover:bg-slate-700"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;