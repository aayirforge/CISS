import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import BottomNavigation from './BottomNavigation';
import ThemeToggle from './ThemeToggle';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Settings, LogOut, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/analytics/notifications');
      setNotifications(res.data.notifications.filter(n => !n.isRead));
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    }
  };

  const handleMarkRead = async () => {
    try {
      await axios.patch('/api/analytics/notifications/read');
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // Check every 10 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const isEmployee = user?.role === 'Employee';

  if (isEmployee) {
    return (
      <div className="min-h-screen flex bg-slate-50 dark:bg-[#121212] text-slate-800 dark:text-zinc-100 transition-colors duration-300">
        
        {/* Desktop Sidebar (hidden on mobile) */}
        <div className="hidden lg:block">
          <Sidebar 
            notificationsCount={notifications.length} 
            onMarkNotificationsRead={handleMarkRead} 
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header (hidden on desktop) */}
          <header className="lg:hidden sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-zinc-800/50 px-5 py-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-600 dark:bg-brand-500 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-brand-500/20">
                {user.fullName.charAt(0)}
              </div>
              <div>
                <h1 className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-zinc-100">CISS Portal</h1>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Field Staff</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (notifications.length > 0 && showNotifications) {
                      handleMarkRead();
                    }
                  }}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 relative focus:outline-none cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-zinc-900 animate-ping" />
                  )}
                </button>
                
                {/* Mobile Notification Popover */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700 rounded-2xl shadow-xl z-50 p-4"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-700 pb-2 mb-2">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-200">Alerts</h4>
                        {notifications.length > 0 && (
                          <button 
                            onClick={handleMarkRead}
                            className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-2.5">
                        {notifications.length === 0 ? (
                          <p className="text-[10px] text-slate-400 dark:text-zinc-500 text-center py-4">No new notifications</p>
                        ) : (
                          notifications.map((n, idx) => (
                            <div key={idx} className="text-[10px] border-b border-slate-50 dark:border-zinc-700/50 pb-1.5 last:border-b-0">
                              <p className="font-semibold text-slate-800 dark:text-zinc-200">{n.title}</p>
                              <p className="text-slate-400 dark:text-zinc-400">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <Link to="/settings" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300" title="Settings">
                <Settings className="w-4 h-4" />
              </Link>
              
              <button 
                onClick={handleLogout}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-450 relative focus:outline-none cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>

              <ThemeToggle />
            </div>
          </header>

          {/* Desktop Top Bar for Employee (hidden on mobile) */}
          <header className="hidden lg:flex items-center justify-end px-10 py-5 bg-white/30 dark:bg-transparent border-b border-slate-200/10 dark:border-transparent gap-4">
            <div className="text-right">
              <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200">{user?.fullName}</h4>
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-medium uppercase tracking-wide">{user?.role}</p>
            </div>
            <ThemeToggle />
          </header>

          {/* Page Content Container */}
          <main className="flex-1 p-4 lg:p-10 max-w-7xl mx-auto w-full overflow-x-hidden pb-20 lg:pb-10">
            {children}
          </main>

          {/* Mobile Bottom Navigation Bar (hidden on desktop) */}
          <div className="lg:hidden">
            <BottomNavigation />
          </div>
        </div>
      </div>
    );
  }

  // Admin / HR / Accountant Desktop View
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-[#121212] text-slate-800 dark:text-zinc-100 transition-colors duration-300">
      <Sidebar 
        notificationsCount={notifications.length} 
        onMarkNotificationsRead={handleMarkRead} 
      />
      
      <div className="flex-1 flex flex-col">
        {/* Desktop Top Bar (Hidden on Mobile) */}
        <header className="hidden lg:flex items-center justify-end px-10 py-5 bg-white/30 dark:bg-transparent border-b border-slate-200/10 dark:border-transparent gap-4">
          <div className="text-right">
            <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200">{user?.fullName}</h4>
            <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-medium uppercase tracking-wide">{user?.role}</p>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
