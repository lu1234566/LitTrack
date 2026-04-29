import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Library, Image as ImageIcon, Settings, PlusCircle, LogOut, UserCircle, Sparkles, History, Search, Menu, X, Calendar, Download, Quote, Folder } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Library, label: 'Meus Livros', path: '/livros' },
  { icon: Folder, label: 'Minhas Estantes', path: '/estantes' },
  { icon: Search, label: 'Pesquisar Livros', path: '/pesquisar' },
  { icon: Quote, label: 'Citações', path: '/citacoes' },
  { icon: UserCircle, label: 'Perfil Literário', path: '/perfil-literario' },
  { icon: History, label: 'Linha do Tempo', path: '/linha-do-tempo' },
  { icon: Calendar, label: 'Retrospectiva', path: '/retrospectiva' },
  { icon: Sparkles, label: 'Recomendações', path: '/recomendacoes' },
  { icon: Download, label: 'Backup e Exportação', path: '/exportar' },
  { icon: ImageIcon, label: 'Galeria', path: '/galeria' },
  { icon: PlusCircle, label: 'Adicionar', path: '/adicionar' },
];

const SidebarContent: React.FC<{ 
  isMobileLayout: boolean, 
  setIsSidebarOpen: (open: boolean) => void,
  user: any,
  logout: () => void
}> = ({ isMobileLayout, setIsSidebarOpen, user, logout }) => (
  <>
    <div className="p-6 flex items-center justify-between">
      <Logo />
      {isMobileLayout && (
        <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-neutral-400 hover:text-neutral-200">
          <X size={24} />
        </button>
      )}
    </div>

    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-amber-500/10 text-amber-500'
                : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
            )
          }
        >
          <item.icon size={20} />
          {item.label}
        </NavLink>
      ))}
    </nav>

    <div className="p-4 border-t border-neutral-800 space-y-2">
      {user && (
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <img src={user.profilePhoto} alt={user.name} className="w-8 h-8 rounded-full border border-neutral-700" />
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium text-neutral-200 truncate">{user.name}</span>
            <span className="text-xs text-neutral-500 truncate">{user.email}</span>
          </div>
        </div>
      )}
      <NavLink
        to="/configuracoes"
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium transition-all',
            isActive
              ? 'bg-amber-500/10 text-amber-500'
              : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
          )
        }
      >
        <Settings size={20} />
        Configurações
      </NavLink>
      <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition-all">
        <LogOut size={20} />
        Sair
      </button>
    </div>
  </>
);

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { isMobileLayout } = useSettings();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className={cn("flex h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-500/30", isMobileLayout ? "flex-col" : "flex-row")}>
      {/* Mobile Header */}
      {isMobileLayout && (
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-neutral-400 hover:text-neutral-200">
              <Menu size={24} />
            </button>
            <Logo className="scale-90 origin-left" />
          </div>
          {user && (
            <img src={user.profilePhoto} alt={user.name} className="w-8 h-8 rounded-full border border-neutral-700" />
          )}
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobileLayout && (
        <aside className="flex w-64 border-r border-neutral-800 bg-neutral-900/50 flex-col">
          <SidebarContent 
            isMobileLayout={isMobileLayout} 
            setIsSidebarOpen={setIsSidebarOpen} 
            user={user} 
            logout={logout} 
          />
        </aside>
      )}

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isMobileLayout && isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-72 bg-neutral-950 border-r border-neutral-800 z-50 flex flex-col shadow-2xl"
            >
              <SidebarContent 
                isMobileLayout={isMobileLayout} 
                setIsSidebarOpen={setIsSidebarOpen} 
                user={user} 
                logout={logout} 
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>


      {/* Main Content */}
      <main className={cn("flex-1 overflow-y-auto", isMobileLayout ? "pb-6" : "pb-0")}>
        <div className={cn("mx-auto", isMobileLayout ? "p-4" : "max-w-7xl p-8")}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
