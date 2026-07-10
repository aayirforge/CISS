import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Clock, 
  FileCheck, 
  CreditCard, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    pendingLeaves: 0,
    pendingSalaryApprovals: 0,
    payrollExpense: 0
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/analytics/stats');
      setMetrics(res.data.metrics);
      
      const rawStats = res.data.attendanceStats;
      const datesObj = {};
      rawStats.forEach(item => {
        if (!datesObj[item.date]) {
          datesObj[item.date] = { date: item.date, Present: 0, Late: 0, Overtime: 0 };
        }
        if (['Present', 'Late', 'Overtime'].includes(item.status)) {
          datesObj[item.date][item.status] = parseInt(item.count) || 0;
        }
      });
      
      const parsedData = Object.values(datesObj).sort((a, b) => new Date(a.date) - new Date(b.date));
      if (parsedData.length === 0) {
        setChartData([
          { date: 'Mon', Present: 5, Late: 1, Overtime: 1 },
          { date: 'Tue', Present: 6, Late: 0, Overtime: 2 },
          { date: 'Wed', Present: 7, Late: 1, Overtime: 1 },
          { date: 'Thu', Present: 4, Late: 2, Overtime: 2 },
          { date: 'Fri', Present: 8, Late: 0, Overtime: 1 }
        ]);
      } else {
        setChartData(parsedData);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { name: 'Total Employees', value: metrics.totalEmployees, icon: Users, color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10' },
    { name: 'Present Today', value: metrics.presentToday, icon: Clock, color: 'text-emerald-600 dark:text-emerald-450 bg-emerald-500/10' },
    { name: 'Staff Absent', value: metrics.absentToday, icon: AlertCircle, color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10' },
    { name: 'Pending Leaves', value: metrics.pendingLeaves, icon: FileCheck, color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10' },
    { name: 'Salary Approvals', value: metrics.pendingSalaryApprovals, icon: CreditCard, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white">HRMS Command Center</h2>
        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Live corporate metrics, attendance logging, and tasks approvals</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={idx} 
              className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">{card.name}</span>
                <div className={`p-2 rounded-xl ${card.color}`}>
                  <Icon size={14} />
                </div>
              </div>
              <span className="text-2xl font-black text-slate-800 dark:text-white">{card.value}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Analytics chart and quick updates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance Recharts line graph */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm">Weekly Attendance Trends</h3>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">Activity and timing tracking rates</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-xl">
              <TrendingUp size={12} />
              <span>Live Updates</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-zinc-800/60" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255,255,255,0.95)', 
                    border: 'none', 
                    borderRadius: '16px', 
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' 
                  }}
                  itemStyle={{ fontSize: '10px', fontWeight: '600' }}
                  labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#1e293b' }}
                />
                <Area type="monotone" dataKey="Present" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPresent)" />
                <Area type="monotone" dataKey="Late" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Payroll Summary & Quick Exports */}
        <div className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50 flex flex-col justify-between h-72">
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm">Monthly Payroll</h3>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500">Total approved salary distribution for this month</p>
            
            <div className="p-5 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/30 dark:border-zinc-800/60 rounded-2xl mt-4">
              <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold block uppercase tracking-wider">Net Expenses</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white">${metrics.payrollExpense}</span>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-zinc-800/60">
            <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Export Data (CSV)</span>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <a
                href="/api/analytics/export/employees"
                download
                className="p-2 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200/30 dark:border-zinc-700/50 rounded-xl font-bold text-center active:scale-95 transition-all text-slate-700 dark:text-zinc-300"
              >
                👥 Staff
              </a>
              <a
                href="/api/analytics/export/attendance"
                download
                className="p-2 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200/30 dark:border-zinc-700/50 rounded-xl font-bold text-center active:scale-95 transition-all text-slate-700 dark:text-zinc-300"
              >
                📅 Attendance
              </a>
              <a
                href="/api/analytics/export/leaves"
                download
                className="p-2 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200/30 dark:border-zinc-700/50 rounded-xl font-bold text-center active:scale-95 transition-all text-slate-700 dark:text-zinc-300"
              >
                🍂 Leaves
              </a>
              <a
                href="/api/analytics/export/payroll"
                download
                className="p-2 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200/30 dark:border-zinc-700/50 rounded-xl font-bold text-center active:scale-95 transition-all text-slate-700 dark:text-zinc-300"
              >
                💰 Payroll
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
