import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { History } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/analytics/audit-logs');
      setLogs(res.data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white">Audit Trails</h2>
        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Review system logs, administrator adjustments, and employee session security audits</p>
      </div>

      {/* Audit Log Card */}
      <div className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50 shadow-sm">
        <h3 className="font-bold text-slate-850 dark:text-zinc-250 mb-4 text-xs flex items-center gap-1.5">
          <History size={16} className="text-brand-600 dark:text-brand-500" />
          Event Logger
        </h3>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-zinc-850 text-slate-400 dark:text-zinc-550 font-bold uppercase text-[9px] tracking-wider">
                <th className="py-3 px-2">Timestamp</th>
                <th className="py-3 px-2">Employee / User</th>
                <th className="py-3 px-2">Role</th>
                <th className="py-3 px-2">Event Action</th>
                <th className="py-3 px-2">Details Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/40">
              {logs.map((log) => (
                <tr key={log.id} className="text-slate-700 dark:text-zinc-300">
                  <td className="py-3.5 px-2 font-mono text-[9px] text-slate-400 dark:text-zinc-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-2">
                    {log.user ? (
                      <div>
                        <span className="font-bold text-slate-800 dark:text-zinc-200">{log.user.fullName}</span>
                        <span className="text-[9px] text-slate-400 dark:text-zinc-500 block mt-0.5">{log.user.employeeId}</span>
                      </div>
                    ) : 'System / Self-Registered'}
                  </td>
                  <td className="py-3.5 px-2">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold">
                      {log.user?.role || 'Guest'}
                    </span>
                  </td>
                  <td className="py-3.5 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider
                      ${['LOGIN', 'REGISTER'].includes(log.action) && 'bg-blue-500/10 text-blue-600'}
                      ${['CHECK_IN', 'CHECK_OUT'].includes(log.action) && 'bg-emerald-500/10 text-emerald-600'}
                      ${['APPROVE_PAYROLL', 'REVIEW_LEAVE'].includes(log.action) && 'bg-purple-500/10 text-purple-600'}
                      ${['DELETE_EMPLOYEE'].includes(log.action) && 'bg-rose-500/10 text-rose-600'}
                    `}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 font-medium max-w-xs truncate text-[9px]" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-400 dark:text-zinc-500">
                    No system log entries recorded in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
