import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileCheck,
  CreditCard,
  History,
  UserCircle,
  LogOut,
  Menu,
  X,
  Bell,
  Settings,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({ notificationsCount, onMarkNotificationsRead }) {
  const { user, logout, isAdmin, isHR, isAccountant } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [];

  if (user && user.role === 'Employee') {
    navItems.push(
      { name: 'Dashboard', path: '/employee', icon: LayoutDashboard },
      { name: 'Clock In/Out', path: '/employee/attendance', icon: CalendarDays },
      { name: 'Leave Management', path: '/employee/leaves', icon: FileCheck }
    );

    if (user.designation?.toLowerCase() === 'accountant' && user.canPreparePayroll === true) {
      navItems.push({ name: 'Prepare Salary', path: '/employee/payroll', icon: CreditCard });
    }

    navItems.push(
      { name: 'Salary Breakdown', path: '/employee/salary', icon: Wallet },
      { name: 'My Profile', path: '/employee/profile', icon: UserCircle },
      { name: 'Settings', path: '/settings', icon: Settings }
    );
  }

  if (isAdmin() || isHR()) {
    navItems.push(
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { name: 'Employees', path: '/admin/employees', icon: Users },
      { name: 'Attendance Logs', path: '/admin/attendance', icon: CalendarDays },
      { name: 'Leave Requests', path: '/admin/leaves', icon: FileCheck }
    );
  }

  // Accountant view
  if (isAccountant()) {
    navItems.push(
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { name: 'Payroll Preparation', path: '/admin/payroll', icon: CreditCard }
    );
  } else if (isAdmin()) {
    navItems.push(
      { name: 'Payroll Manager', path: '/admin/payroll', icon: CreditCard },
      { name: 'Audit Logs', path: '/admin/audit', icon: History }
    );
  }

  // Add settings link to admin/HR/Accountant sidebar
  if (user && user.role !== 'Employee') {
    navItems.push({ name: 'Settings', path: '/settings', icon: Settings });
  }

  return (
    <>
      {/* Mobile Top Navbar */}
      <div className="lg:hidden w-full bg-white dark:bg-zinc-900 border-b border-slate-200/50 dark:border-zinc-800/50 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <h1 className="font-extrabold text-lg tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
          <span className="w-2.5 h-6 bg-brand-500 rounded-full inline-block"></span>
          CISS Portal
        </h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 text-slate-600 dark:text-zinc-300"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Sidebar overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-72 glass-sidebar flex flex-col justify-between p-6 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div>
          {/* Logo */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-extrabold text-xl tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
              <span className="w-3 h-7 bg-brand-600 dark:bg-brand-500 rounded-full inline-block animate-pulse"></span>
              CISS HRMS
            </h1>
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
          </div>

          {/* User Profile Summary */}
          {user && (
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-600 dark:bg-brand-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-brand-500/20">
                  {user.fullName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{user.fullName}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium tracking-wide uppercase mt-0.5">{user.role}</p>
                </div>
              </div>
            </div>
          )}

          {/* Nav Links */}
          <nav className="space-y-1.5">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={idx}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                    ${isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20 dark:bg-brand-500' 
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-200'
                    }
                  `}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="space-y-4">
          {notificationsCount > 0 && (
            <button
              onClick={onMarkNotificationsRead}
              className="w-full flex items-center justify-between p-3 bg-brand-50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/40 text-brand-700 dark:text-brand-300 rounded-xl text-xs font-semibold hover:scale-[1.01] active:scale-95 transition-all"
            >
              <div className="flex items-center gap-2">
                <Bell size={14} className="animate-bounce" />
                <span>{notificationsCount} New notifications</span>
              </div>
              <span className="text-[10px] bg-brand-600 text-white px-2 py-0.5 rounded-full">Clear</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
