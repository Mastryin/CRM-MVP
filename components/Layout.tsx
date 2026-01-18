import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, LogOut, Settings, Phone, Layers, ChevronDown, Moon, Sun } from 'lucide-react';
import clsx from 'clsx';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Leads', path: '/', icon: LayoutDashboard },
    { label: 'Calls', path: '/calls', icon: Phone },
  ];

  if (user?.role === 'superadmin') {
    navItems.push({ label: 'Settings', path: '/settings', icon: Settings });
  }

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 h-16 flex items-center justify-between px-6 shadow-sm z-30 shrink-0 transition-colors duration-200">
        {/* Left: Logo */}
        <div className="flex items-center gap-3 w-48">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-blue-200 shadow-md">
             <Layers className="text-white" size={18} />
          </div>
          <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-tight">Mastry</span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cohort CRM</span>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-50/50 dark:bg-slate-700/50 p-1.5 rounded-xl border border-slate-100 dark:border-slate-600">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/60 dark:border-slate-600" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
              >
                <Icon size={16} className={clsx(isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: User Profile & Theme Toggle */}
        <div className="w-48 flex justify-end items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="relative" ref={profileRef}>
                <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-600 group"
                >
                    <div className="text-right hidden md:block">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">{user?.full_name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">{user?.role.replace('_', ' ')}</div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm ring-2 ring-white dark:ring-slate-700">
                        {user?.full_name.charAt(0)}
                    </div>
                    <ChevronDown size={14} className="text-slate-400 mr-1" />
                </button>

                {/* Dropdown */}
                {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                        <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-700 md:hidden">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.full_name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                        </div>
                        <div className="px-2 py-2">
                            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 px-2 py-1 uppercase">Account</div>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-2 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors rounded-lg"
                            >
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;