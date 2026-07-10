import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Clock, 
  Calendar, 
  Wallet, 
  MapPin, 
  ArrowRight,
  TrendingUp,
  Award,
  Bell,
  Download,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [leavesData, setLeavesData] = useState({ leaves: [], balances: {}, utilization: {} });
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [todayRes, historyRes, leavesRes, payrollRes] = await Promise.all([
          axios.get('/api/attendance/today').catch(() => ({ data: { record: null } })),
          axios.get('/api/attendance/history?filter=monthly').catch(() => ({ data: { history: [] } })),
          axios.get('/api/leaves/my-leaves').catch(() => ({ data: { leaves: [], balances: {}, utilization: {} } })),
          axios.get('/api/payroll/history').catch(() => ({ data: { history: [] } }))
        ]);

        setTodayRecord(todayRes.data.record);
        setHistory(historyRes.data.history);
        setLeavesData(leavesRes.data);
        setPayrolls(payrollRes.data.history);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const totalWorkingHours = history.reduce((acc, curr) => acc + parseFloat(curr.workingHours || 0), 0);
  const totalOvertimeHours = history.reduce((acc, curr) => acc + parseFloat(curr.overtimeHours || 0), 0);
  const latestPayroll = payrolls[0];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-lg mx-auto"
    >
      {/* Welcome Banner */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white p-6 shadow-lg shadow-brand-500/15"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl -mr-10 -mt-10" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <span className="bg-white/20 p-2 rounded-xl text-white text-xs font-bold backdrop-blur-md">
              💼 {user?.employeeId}
            </span>
            <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {user?.role}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Hey, {user?.fullName}!</h2>
            <p className="text-white/80 text-xs mt-1 font-medium">{user?.designation} • {user?.department}</p>
          </div>
        </div>
      </motion.div>

      {/* Clock In/Out Quick Access Card */}
      <motion.div 
        variants={itemVariants}
        className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50 shadow-sm relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Today's Shift</h3>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
            ${todayRecord 
              ? todayRecord.status === 'Late' 
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' 
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'
            }
          `}>
            {todayRecord ? todayRecord.status : 'Not Clocked In'}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800/60 pt-4 mb-4">
          <div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">Check In Time</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">
              {todayRecord ? formatTime(todayRecord.checkInTime) : '--:--'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">Check Out Time</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">
              {todayRecord?.checkOutTime ? formatTime(todayRecord.checkOutTime) : '--:--'}
            </span>
          </div>
          <Link 
            to="/employee/attendance"
            className="p-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl flex items-center justify-center shadow-md shadow-brand-500/20 active:scale-95 transition-all"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </motion.div>

      {/* KPI Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        {/* Monthly Working Hours */}
        <div className="glass-card rounded-3xl p-5 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase">Monthly</span>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-800 dark:text-white block">
              {totalWorkingHours.toFixed(1)}h
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              OT: {totalOvertimeHours.toFixed(1)}h
            </span>
          </div>
        </div>

        {/* Leaves Utilization */}
        <div className="glass-card rounded-3xl p-5 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase">Leaves</span>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-800 dark:text-white block">
              {leavesData.leaves.filter(l => l.status === 'Approved').length} Days
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Pending: {leavesData.leaves.filter(l => l.status === 'Pending').length}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Latest Payslip Quick Card */}
      {latestPayroll && (
        <motion.div 
          variants={itemVariants}
          className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Latest Salary Slip</h4>
                <p className="text-[9px] text-slate-400 dark:text-zinc-500">Released for {latestPayroll.month}</p>
              </div>
            </div>
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              ${latestPayroll.netSalary}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-100 dark:border-zinc-800/60 pt-3">
            <span className="text-[10px] text-slate-400 dark:text-zinc-500">Tax paid: ${latestPayroll.tax}</span>
            {latestPayroll.pdfPath && (
              <a 
                href={`/${latestPayroll.pdfPath}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1 text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/30 px-3 py-1.5 rounded-xl cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </a>
            )}
          </div>
        </motion.div>
      )}

      {/* Recent Activity Log */}
      <motion.div 
        variants={itemVariants}
        className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50 shadow-sm"
      >
        <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-4">
          Recent Attendance Log
        </h3>
        
        <div className="space-y-4">
          {history.slice(0, 3).map((log, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  log.status === 'Present' ? 'bg-emerald-500' :
                  log.status === 'Late' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-zinc-200">{log.date}</p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                    Checked in: {formatTime(log.checkInTime)}
                  </p>
                </div>
              </div>
              <span className="font-bold text-slate-600 dark:text-zinc-400">{log.workingHours || '-'} hrs</span>
            </div>
          ))}

          {history.length === 0 && (
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 text-center py-4">No attendance data yet.</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
