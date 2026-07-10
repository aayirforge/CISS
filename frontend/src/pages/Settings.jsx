import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import axios from 'axios';
import { 
  Settings as SettingsIcon, 
  Lock, 
  Bell, 
  Smartphone, 
  MapPin, 
  CheckCircle2, 
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings() {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Notifications Toggles
  const [notifyShift, setNotifyShift] = useState(true);
  const [notifyLeaves, setNotifyLeaves] = useState(true);
  const [notifyPayroll, setNotifyPayroll] = useState(true);

  // Privacy Geolocation Toggle
  const [trackGPS, setTrackGPS] = useState(true);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      await axios.put('/api/employees/password/change', {
        oldPassword,
        newPassword
      });
      setMsg({ type: 'success', text: 'Password changed successfully.' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to change password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <SettingsIcon className="text-brand-600 dark:text-brand-500" size={22} />
          Settings Portal
        </h2>
        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
          Configure notification alerts, secure credentials, and manage connected devices.
        </p>
      </div>

      {/* Message Notifications */}
      <AnimatePresence>
        {msg.text && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold
              ${msg.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
              }
            `}
          >
            {msg.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
            <span>{msg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Theme Configuration Card */}
      <div className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50 flex justify-between items-center">
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Light / Dark theme</h4>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Toggle interface appearance mode</p>
        </div>
        <div className="p-1 rounded-xl bg-slate-100 dark:bg-zinc-800/40">
          <ThemeToggle />
        </div>
      </div>

      {/* 2. Push Notification Configurations */}
      <div className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50 space-y-4.5">
        <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
          <Bell size={14} />
          Notification Options
        </h3>
        
        <div className="space-y-3.5 text-xs">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-semibold text-slate-800 dark:text-zinc-200">Shift Reminders</p>
              <p className="text-[9px] text-slate-400 dark:text-zinc-500">Alert me 15m before shift starts</p>
            </div>
            <input 
              type="checkbox" 
              checked={notifyShift} 
              onChange={() => setNotifyShift(!notifyShift)}
              className="w-4 h-4 rounded border-slate-200 text-brand-650 focus:ring-brand-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-semibold text-slate-800 dark:text-zinc-200">Leave Approvals</p>
              <p className="text-[9px] text-slate-400 dark:text-zinc-500">Receive update on leave request statuses</p>
            </div>
            <input 
              type="checkbox" 
              checked={notifyLeaves} 
              onChange={() => setNotifyLeaves(!notifyLeaves)}
              className="w-4 h-4 rounded border-slate-200 text-brand-650 focus:ring-brand-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-semibold text-slate-800 dark:text-zinc-200">Payslip Releases</p>
              <p className="text-[9px] text-slate-400 dark:text-zinc-500">Notify when monthly salary slip is uploaded</p>
            </div>
            <input 
              type="checkbox" 
              checked={notifyPayroll} 
              onChange={() => setNotifyPayroll(!notifyPayroll)}
              className="w-4 h-4 rounded border-slate-200 text-brand-650 focus:ring-brand-500 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* 3. Privacy & GPS Access */}
      <div className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin size={14} />
          Location Privacy Control
        </h3>
        <label className="flex items-center justify-between cursor-pointer text-xs">
          <div>
            <p className="font-semibold text-slate-800 dark:text-zinc-200">Continuous Location Feeds</p>
            <p className="text-[9px] text-slate-400 dark:text-zinc-500">Allows managers to review coordinates on clock shifts</p>
          </div>
          <input 
            type="checkbox" 
            checked={trackGPS} 
            onChange={() => setTrackGPS(!trackGPS)}
            className="w-4 h-4 rounded border-slate-200 text-brand-650 focus:ring-brand-500 cursor-pointer"
          />
        </label>
      </div>

      {/* 4. Connected Device Sessions */}
      <div className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
          <Smartphone size={14} />
          Active Device Sessions
        </h3>
        
        <div className="space-y-3.5 text-xs">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-brand-600" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-zinc-200">Capacitor Android Build</p>
                <p className="text-[9px] text-slate-400 dark:text-zinc-500">Active now • Mobile App client</p>
              </div>
            </div>
            <span className="text-[8px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-bold uppercase">
              Current
            </span>
          </div>

          <div className="flex justify-between items-center opacity-65">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-zinc-200">Desktop Web Browser (Chrome)</p>
                <p className="text-[9px] text-slate-400 dark:text-zinc-500">Last active 2 hrs ago • Windows 11</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Security & Credentials update */}
      <div className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50">
        <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Lock size={14} />
          Update Security Password
        </h3>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Current Password</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800/30 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs text-slate-800 dark:text-zinc-200 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800/30 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs text-slate-800 dark:text-zinc-200 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800/30 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs text-slate-800 dark:text-zinc-200 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-brand-500/10 active:scale-95 transition-all cursor-pointer"
          >
            {loading ? 'Processing changes...' : 'Update Password Details'}
          </button>
        </form>
      </div>

    </div>
  );
}
