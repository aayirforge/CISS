import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, ShieldAlert, Key } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const userData = await login(email, password);
      if (userData.role === 'Employee') {
        navigate('/employee');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-950 via-zinc-900 to-brand-950 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/10 dark:bg-black/35 backdrop-blur-xl border border-white/15 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
      >
        
        {/* Decorative ambient blur */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-brand-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-brand-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 text-white font-extrabold text-xl mb-4 shadow-lg shadow-brand-500/20">
            CS
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">CISS HRMS Portal</h2>
          <p className="text-zinc-300 text-xs mt-2">Enterprise HR & Smart Attendance Platform</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-500/15 border border-red-500/30 text-red-200 rounded-2xl flex items-center gap-2 text-xs"
          >
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                placeholder="name@ciss.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-600/50 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            {submitting ? 'Authenticating...' : (
              <>
                <LogIn size={16} />
                Sign In
              </>
            )}
          </button>
        </form>



      </motion.div>
    </div>
  );
}
