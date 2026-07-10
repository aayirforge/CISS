import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Check, X, ShieldAlert, FileText, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPayroll() {
  const { user, isAccountant, isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); 
  
  const [bonus, setBonus] = useState(0);
  const [deductions, setDeductions] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchEmployees();
    fetchPayrolls();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/employees?role=Employee');
      setEmployees(res.data.employees);
      if (res.data.employees.length > 0) {
        setSelectedEmpId(res.data.employees[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayrolls = async () => {
    try {
      const res = await axios.get('/api/payroll/all');
      setPayrolls(res.data.payrolls);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrepare = async (e) => {
    e.preventDefault();
    if (!selectedEmpId || !month) return;
    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      await axios.post('/api/payroll/prepare', {
        userId: selectedEmpId,
        month,
        bonus,
        deductions
      });
      setMsg({ type: 'success', text: 'Payroll successfully prepared. Sent for Admin approval.' });
      setBonus(0);
      setDeductions(0);
      fetchPayrolls();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to prepare payroll.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status) => {
    try {
      await axios.patch(`/api/payroll/${id}/review`, { status });
      fetchPayrolls();
    } catch (err) {
      console.error(err);
    }
  };

  const isRoleAuthorizedForPrep = () => {
    if (!user) return false;
    if (['Super Admin', 'Admin', 'Accountant', 'Senior Accountant'].includes(user.role)) return true;
    if (user.role === 'Employee' && user.designation?.toLowerCase() === 'accountant' && user.canPreparePayroll === true) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white">Payroll Management</h2>
        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Prepare monthly employee salaries, review breakdowns, and disburse approvals</p>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold
          ${msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'}
        `}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Accountant Section: Prepare Salary */}
        <div className="lg:col-span-1">
          {isRoleAuthorizedForPrep() ? (
            <div className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50 shadow-sm">
              <h3 className="text-xs font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <CreditCard size={14} className="text-brand-600 dark:text-brand-500" />
                Prepare Salary Slip
              </h3>
              
              <form onSubmit={handlePrepare} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Select Employee</label>
                  <select
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs text-slate-800 dark:text-zinc-200"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeId})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Select Month</label>
                  <input
                    type="month"
                    required
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs text-slate-800 dark:text-zinc-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Bonus / Incentives ($)</label>
                    <input
                      type="number"
                      value={bonus}
                      onChange={(e) => setBonus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs text-slate-800 dark:text-zinc-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Deductions ($)</label>
                    <input
                      type="number"
                      value={deductions}
                      onChange={(e) => setDeductions(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs text-slate-800 dark:text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-brand-500/10 active:scale-95 transition-all cursor-pointer"
                >
                  {loading ? 'Processing Calculations...' : 'Submit to Admin Approval'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-950 border border-slate-200/50 dark:border-zinc-850 rounded-3xl p-6 shadow-sm text-center text-slate-450 dark:text-zinc-500 text-xs">
              🔒 Salary preparation is restricted to the Accountant and Senior Accountant roles.
            </div>
          )}
        </div>

        {/* Prepared Payrolls approval list */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50 shadow-sm">
          <h3 className="font-bold text-slate-850 dark:text-zinc-250 mb-4 text-xs">Payroll Ledger</h3>
          
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-zinc-850 text-slate-400 dark:text-zinc-550 font-bold uppercase text-[9px] tracking-wider">
                  <th className="py-3 px-2">Employee</th>
                  <th className="py-3 px-2">Month</th>
                  <th className="py-3 px-2">Net Salary</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/40">
                {payrolls.map((pr) => (
                  <tr key={pr.id} className="text-slate-700 dark:text-zinc-300">
                    <td className="py-3.5 px-2">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-zinc-150">{pr.user?.fullName}</div>
                        <div className="text-[9px] text-slate-450 dark:text-zinc-500 mt-0.5">{pr.user?.employeeId} | {pr.user?.department}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 font-bold">{pr.month}</td>
                    <td className="py-3.5 px-2 font-black text-slate-800 dark:text-white">${pr.netSalary}</td>
                    <td className="py-3.5 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase
                        ${pr.status === 'Approved' && 'bg-emerald-500/10 text-emerald-600'}
                        ${pr.status === 'Pending Approval' && 'bg-amber-500/10 text-amber-600'}
                        ${pr.status === 'Rejected' && 'bg-rose-500/10 text-rose-600'}
                      `}>
                        {pr.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      {pr.status === 'Pending Approval' && (isAdmin() || (user && user.role === 'Admin')) ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleReview(pr.id, 'Rejected')}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                          <button
                            onClick={() => handleReview(pr.id, 'Approved')}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 cursor-pointer"
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      ) : pr.status === 'Approved' && pr.pdfPath ? (
                        <a
                          href={`/${pr.pdfPath}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-600 dark:text-brand-400 hover:underline text-[9px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <FileText size={12} /> Download PDF
                        </a>
                      ) : '-'}
                    </td>
                  </tr>
                ))}

                {payrolls.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-400 dark:text-zinc-500">
                      No payroll records prepared yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
