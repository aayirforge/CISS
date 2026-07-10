import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Lock, ShieldAlert, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    employeeId: '',
    department: 'Engineering',
    designation: 'Software Engineer',
    role: 'Employee'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await axios.post('/api/auth/register', formData);
      setSuccess('Registration successful! Redirecting to login page...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
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
        className="w-full max-w-lg bg-white/10 dark:bg-black/35 backdrop-blur-xl border border-white/15 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
      >
        
        {/* Decorative ambient blur */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-brand-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-brand-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-brand-600 text-white font-extrabold text-lg mb-3 shadow-lg shadow-brand-500/20">
            CS
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Create Account</h2>
          <p className="text-zinc-300 text-xs mt-1">Join CISS HRMS & Enterprise Network</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-4 bg-red-500/15 border border-red-500/30 text-red-200 rounded-2xl flex items-center gap-2 text-xs"
          >
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 rounded-2xl flex items-center gap-2 text-xs"
          >
            <span>{success}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-2">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                  <User size={15} />
                </span>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-xs"
                  placeholder="Amit Kumar"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-2">Employee ID</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                  <ClipboardList size={15} />
                </span>
                <input
                  type="text"
                  name="employeeId"
                  required
                  value={formData.employeeId}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-xs"
                  placeholder="EMP1001"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                <Mail size={15} />
              </span>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-xs"
                placeholder="name@ciss.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                <Lock size={15} />
              </span>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-xs"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-2">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-zinc-800 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-xs"
              >
                <option value="Engineering">Engineering</option>
                <option value="HR">HR</option>
                <option value="Accounts">Accounts</option>
                <option value="Sales">Sales</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-2">Designation</label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-xs"
                placeholder="Software Engineer"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-2">System Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-zinc-800 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-xs"
            >
              <option value="Employee">Employee</option>
              <option value="HR Manager">HR Manager</option>
              <option value="Accountant">Accountant</option>
              <option value="Senior Accountant">Senior Accountant</option>
              <option value="Team Leader">Team Leader</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-600/50 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            {submitting ? 'Creating account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-zinc-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-bold underline">
              Sign In
            </Link>
          </p>
        </div>

      </motion.div>
    </div>
  );
}
