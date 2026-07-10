import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Clock, CalendarDays, Wallet, User, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const BottomNavigation = () => {
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const isDesignatedAccountant = user?.designation?.toLowerCase() === 'accountant' && user?.canPreparePayroll === true;

  const navItems = [
    { label: 'Home', path: '/employee', icon: Home },
    { label: 'Clock', path: '/employee/attendance', icon: Clock },
    { label: 'Leaves', path: '/employee/leaves', icon: CalendarDays },
  ];

  if (isDesignatedAccountant) {
    navItems.push({ label: 'Payroll', path: '/employee/payroll', icon: CreditCard });
  }

  navItems.push(
    { label: 'Salary', path: '/employee/salary', icon: Wallet },
    { label: 'Profile', path: '/employee/profile', icon: User },
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-slate-200/50 dark:border-zinc-800/50 shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.05)] px-4 flex items-center justify-around pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path;

        return (
          <Link
            key={item.label}
            to={item.path}
            className="flex flex-col items-center justify-center flex-1 h-full relative"
          >
            <motion.div
              whileTap={{ scale: 0.85 }}
              className={`p-1.5 rounded-xl transition-colors duration-200 flex flex-col items-center ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
              }`}
            >
              <Icon className="w-5.5 h-5.5" />
              <span className="text-[10px] mt-1 font-medium font-sans">{item.label}</span>
            </motion.div>
            {isActive && (
              <motion.div
                layoutId="bottomTabDot"
                className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-brand-600 dark:bg-brand-400"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default BottomNavigation;
