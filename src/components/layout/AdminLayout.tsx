import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { 
  LayoutDashboard, 
  LogOut, 
  Tv, 
  Bell, 
  Search,
  Trophy,
  Layers,
  Menu,
  X,
  Megaphone
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 antialiased">
      {/* MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div 
          onClick={closeMobileMenu} 
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
        />
      )}

      {/* SIDEBAR (DESKTOP & MOBILE DRAWER) */}
      <aside 
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col justify-between border-r border-slate-800/80 bg-slate-900/95 p-4 backdrop-blur-md transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo & Brand Header */}
          <div className="mb-8 flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 shadow-lg shadow-rose-900/30">
                <Tv className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-wide text-white">StreamESPN</h1>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  Admin Panel
                </div>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button 
              onClick={closeMobileMenu}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Main Menu</p>
            <NavLink
              to="/dashboard"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`
              }
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/sports"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`
              }
            >
              <Trophy className="h-4 w-4" />
              <span>Sports Categories</span>
            </NavLink>

            <NavLink
              to="/subcategories"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`
              }
            >
              <Layers className="h-4 w-4" />
              <span>Subcategories</span>
            </NavLink>

            <NavLink
              to="/matches"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`
              }
            >
              <Tv className="h-4 w-4" />
              <span>Live & Upcoming Matches</span>
            </NavLink>

            <NavLink
              to="/ads"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`
              }
            >
              <Megaphone className="h-4 w-4" />
              <span>Ads & Referral Settings</span>
            </NavLink>
          </div>
        </div>

        {/* Sidebar Footer / User Info */}
        <div className="border-t border-slate-800 pt-4">
          <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-800/50 p-3 backdrop-blur-sm border border-slate-700/50">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 font-bold text-sm border border-rose-500/30">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="truncate">
                <p className="truncate text-xs font-semibold text-white">{user?.name || 'System Admin'}</p>
                <p className="truncate text-[11px] text-slate-400">{user?.email || 'N/A'}</p>
              </div>
            </div>
            <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300 border border-rose-500/30 uppercase">
              {user?.role || 'ADMIN'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-rose-600 hover:text-white hover:border-rose-600"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* RIGHT SIDE MAIN CONTENT AREA (RESPONSIVE) */}
      <div className="flex-1 md:pl-64 flex flex-col h-screen overflow-hidden w-full">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 md:px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-300 hover:bg-slate-800 hover:text-white md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <h2 className="text-base md:text-lg font-bold text-white tracking-tight">Admin Dashboard</h2>
            <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
              API Connected
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search stream, users..."
                className="h-9 w-64 rounded-full border border-slate-800 bg-slate-900/90 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <button className="relative rounded-full border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white hover:border-slate-700 transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500"></span>
            </button>

            <div className="h-6 w-px bg-slate-800"></div>

            <div className="flex items-center gap-2">
              <div className="text-right text-xs">
                <p className="font-semibold text-white truncate max-w-[100px] sm:max-w-none">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-slate-400 hidden sm:block">{user?.email || ''}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Main Canvas */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
