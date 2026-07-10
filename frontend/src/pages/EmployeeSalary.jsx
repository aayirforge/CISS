import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CreditCard, FileDown, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EmployeeSalary() {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState([]);
  const [selectedSlip, setSelectedSlip] = useState(null);

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const res = await axios.get('/api/payroll/history');
      setPayrolls(res.data.history);
      if (res.data.history.length > 0) {
        setSelectedSlip(res.data.history[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <CreditCard className="text-brand-600 dark:text-brand-500" size={22} />
          Payslips & Salary
        </h2>
        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
          Review your pay slips, track net incomes, and download payroll receipts
        </p>
      </div>

      <div className="space-y-5">
        {/* Top: Payslips List (Horizontal Carousel on Mobile) */}
        <div className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50">
          <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Release Logs</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {payrolls.map((payroll) => (
              <button
                key={payroll.id}
                onClick={() => setSelectedSlip(payroll)}
                className={`p-4 rounded-2xl border text-xs flex flex-col justify-between min-w-[140px] shrink-0 text-left transition-all cursor-pointer
                  ${selectedSlip?.id === payroll.id 
                    ? 'bg-brand-50/50 border-brand-300 dark:bg-brand-950/20 dark:border-brand-800' 
                    : 'bg-slate-50 border-slate-200/50 hover:bg-slate-100 dark:bg-zinc-800/40 dark:border-zinc-800 dark:hover:bg-zinc-800/80'
                  }
                `}
              >
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-zinc-200">{payroll.month}</h4>
                  <span className="text-[9px] text-slate-400 dark:text-zinc-500 mt-1 block">Status: {payroll.status}</span>
                </div>
                <div className="mt-4">
                  <span className="text-sm font-black text-slate-800 dark:text-white block">${payroll.netSalary}</span>
                  <span className="text-[8px] text-slate-400 dark:text-zinc-500 block">Net Payable</span>
                </div>
              </button>
            ))}

            {payrolls.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-zinc-500 text-center py-4 w-full">No payroll receipts found.</p>
            )}
          </div>
        </div>

        {/* Detailed Breakdown Card */}
        <AnimatePresence mode="wait">
          {selectedSlip ? (
            <motion.div 
              key={selectedSlip.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50 space-y-5"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800/60 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Statement for {selectedSlip.month}</h3>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase mt-0.5 block">
                    Status: <span className={selectedSlip.status === 'Approved' ? 'text-emerald-600' : 'text-amber-500'}>{selectedSlip.status}</span>
                  </span>
                </div>

                {selectedSlip.status === 'Approved' && selectedSlip.pdfPath && (
                  <a
                    href={`/${selectedSlip.pdfPath}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-[10px] font-bold shadow-md shadow-brand-500/10 active:scale-95 transition-all cursor-pointer"
                  >
                    <FileDown size={12} />
                    Download PDF
                  </a>
                )}
              </div>

              {/* Attendance metrics */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/40 dark:border-zinc-800/40 rounded-xl text-[10px]">
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block mb-0.5">Shift Days</span>
                  <span className="font-bold text-slate-700 dark:text-zinc-300">{selectedSlip.workingDays} days</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block mb-0.5">Present Days</span>
                  <span className="font-bold text-slate-700 dark:text-zinc-300">{selectedSlip.presentDays} days</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block mb-0.5">Overtime</span>
                  <span className="font-bold text-slate-700 dark:text-zinc-300">{selectedSlip.overtimeHours} hrs</span>
                </div>
              </div>

              {/* Earnings & Deductions details */}
              <div className="space-y-4 pt-2">
                {/* Earnings */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                    <ArrowUpRight className="text-emerald-500" size={12} />
                    Earnings
                  </h4>
                  <div className="bg-slate-50/50 dark:bg-zinc-800/20 p-3.5 border border-slate-100 dark:border-zinc-800/50 rounded-xl space-y-2 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-zinc-400">Basic Salary</span>
                      <span className="font-bold text-slate-700 dark:text-zinc-200">${selectedSlip.basicSalary}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-zinc-400">HRA Allowance</span>
                      <span className="font-bold text-slate-700 dark:text-zinc-200">${selectedSlip.hra}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-zinc-400">Conveyance Reimbursement</span>
                      <span className="font-bold text-slate-700 dark:text-zinc-200">${selectedSlip.conveyance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-zinc-400">Additional Allowances</span>
                      <span className="font-bold text-slate-700 dark:text-zinc-200">${selectedSlip.allowances}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-zinc-400">Overtime Premium</span>
                      <span className="font-bold text-slate-700 dark:text-zinc-200">${selectedSlip.overtimePay}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-zinc-400">Incentive / Bonus</span>
                      <span className="font-bold text-slate-700 dark:text-zinc-200">${selectedSlip.bonus}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                    <ArrowDownRight className="text-rose-500" size={12} />
                    Deductions
                  </h4>
                  <div className="bg-slate-50/50 dark:bg-zinc-800/20 p-3.5 border border-slate-100 dark:border-zinc-800/50 rounded-xl space-y-2 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-zinc-400">Income Tax Deduction</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">${selectedSlip.tax}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-zinc-400">Loss of Pay / Unpaid Absences</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">${selectedSlip.deductions}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Payout Summary */}
              <div className="p-5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-2xl flex justify-between items-center mt-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-85 block">Net Payable Amount</span>
                  <span className="text-2xl font-black">${selectedSlip.netSalary}</span>
                </div>
                <div className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center">
                  <DollarSign size={20} />
                </div>
              </div>

            </motion.div>
          ) : (
            <div className="bg-white dark:bg-zinc-950 border border-slate-200/50 dark:border-zinc-800/50 rounded-3xl p-12 text-center text-slate-400 text-xs">
              Select a pay slip from the logs to view details.
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
