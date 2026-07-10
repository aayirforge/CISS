import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLeaveApproval() {
  const [leaves, setLeaves] = useState([]);
  const [remarks, setRemarks] = useState({});
  const [filter, setFilter] = useState('Pending'); 
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await axios.get('/api/leaves/all');
      setLeaves(res.data.leaves);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReview = async (id, status) => {
    setLoading(true);
    try {
      await axios.patch(`/api/leaves/${id}/review`, {
        status,
        comments: remarks[id] || ''
      });
      setRemarks({ ...remarks, [id]: '' });
      fetchLeaves();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemarkChange = (id, text) => {
    setRemarks({
      ...remarks,
      [id]: text
    });
  };

  const filteredLeaves = leaves.filter(lv => 
    filter === 'All' ? true : lv.status === filter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Leave Approvals System</h2>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Review employee leave applications and allocate approvals</p>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 self-start sm:self-auto bg-slate-100 dark:bg-zinc-800/40 p-1 rounded-xl">
          {['Pending', 'Approved', 'Rejected', 'All'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer
                ${filter === status 
                  ? 'bg-brand-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }
              `}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Leave Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredLeaves.map((leave) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={leave.id} 
              className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-zinc-200 text-xs">{leave.user?.fullName}</h4>
                    <p className="text-[9px] text-slate-400 dark:text-zinc-550 mt-0.5">{leave.user?.employeeId} | {leave.user?.department}</p>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase
                    ${leave.status === 'Approved' && 'bg-emerald-500/10 text-emerald-600'}
                    ${leave.status === 'Pending' && 'bg-amber-500/10 text-amber-600'}
                    ${leave.status === 'Rejected' && 'bg-rose-500/10 text-rose-600'}
                  `}>
                    {leave.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400 dark:text-zinc-500">Leave Category:</span>
                    <span className="font-bold text-slate-700 dark:text-zinc-300">{leave.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 dark:text-zinc-500">Duration:</span>
                    <span className="font-bold text-slate-700 dark:text-zinc-300">{leave.startDate} to {leave.endDate}</span>
                  </div>
                </div>

                <p className="mt-3 p-3 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/30 dark:border-zinc-700/35 text-[10px] rounded-xl text-slate-600 dark:text-zinc-400 font-medium">
                  {leave.reason}
                </p>

                {leave.attachmentPath && (
                  <a
                    href={`/${leave.attachmentPath}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[9px] text-brand-650 dark:text-brand-400 font-bold mt-3.5 cursor-pointer"
                  >
                    <FileText size={12} />
                    View Attachment Document
                  </a>
                )}
              </div>

              {leave.status === 'Pending' ? (
                <div className="space-y-3 pt-3.5 border-t border-slate-100 dark:border-zinc-800/60">
                  <div className="relative">
                    <span className="absolute top-2.5 left-3 text-slate-400">
                      <MessageSquare size={12} />
                    </span>
                    <input
                      type="text"
                      placeholder="Add review remarks..."
                      value={remarks[leave.id] || ''}
                      onChange={(e) => handleRemarkChange(leave.id, e.target.value)}
                      className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-750 rounded-xl text-[10px] focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleReview(leave.id, 'Rejected')}
                      disabled={loading}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      <XCircle size={10} />
                      Reject
                    </button>
                    <button
                      onClick={() => handleReview(leave.id, 'Approved')}
                      disabled={loading}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      <CheckCircle size={10} />
                      Approve
                    </button>
                  </div>
                </div>
              ) : leave.comments ? (
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/60 text-[9px] text-slate-400">
                  <strong className="text-slate-500 dark:text-zinc-300">Remarks:</strong> {leave.comments}
                </div>
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredLeaves.length === 0 && (
          <div className="col-span-2 bg-white dark:bg-zinc-950 border border-slate-200/50 dark:border-zinc-800/50 rounded-3xl p-12 text-center text-slate-400 text-xs">
            No leave requests found under '{filter}' status filter.
          </div>
        )}
      </div>
    </div>
  );
}
