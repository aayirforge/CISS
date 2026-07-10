import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Calendar, CheckCircle, Clock, XCircle, FileText, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LeaveManagement() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState({
    'Casual Leave': 12,
    'Sick Leave': 10,
    'Earned Leave': 15,
    'Emergency Leave': 5,
    'Work From Home': 'Unlimited'
  });
  const [utilization, setUtilization] = useState({});
  const [formData, setFormData] = useState({
    type: 'Casual Leave',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const fetchMyLeaves = async () => {
    try {
      const res = await axios.get('/api/leaves/my-leaves');
      setLeaves(res.data.leaves);
      if (res.data.balances) setBalances(res.data.balances);
      if (res.data.utilization) setUtilization(res.data.utilization);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    setAttachment(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    const data = new FormData();
    data.append('type', formData.type);
    data.append('startDate', formData.startDate);
    data.append('endDate', formData.endDate);
    data.append('reason', formData.reason);
    if (attachment) {
      data.append('attachment', attachment);
    }

    try {
      await axios.post('/api/leaves/apply', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMsg({ type: 'success', text: 'Leave application submitted successfully!' });
      setFormData({
        type: 'Casual Leave',
        startDate: '',
        endDate: '',
        reason: ''
      });
      setAttachment(null);
      fetchMyLeaves();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to apply for leave.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <Calendar className="text-brand-600 dark:text-brand-500" size={22} />
          Leave & Absence Log
        </h2>
        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Apply for leave, view approvals, and track quotas.</p>
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
            {msg.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
            <span>{msg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Balances Horizontal Scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {Object.entries(balances).map(([key, val]) => (
          <div 
            key={key} 
            className="glass-card rounded-2xl p-4 min-w-[125px] flex-1 shrink-0 border border-slate-200/50 dark:border-zinc-800/50"
          >
            <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold block truncate uppercase tracking-wider mb-2">
              {key.replace(' Leave', '')}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-800 dark:text-white">{val}</span>
              <span className="text-[9px] text-slate-400 dark:text-zinc-500">left</span>
            </div>
            {utilization[key] > 0 && (
              <span className="text-[8px] font-bold text-brand-600 dark:text-brand-400 mt-2 block">
                Used: {utilization[key]}d
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Apply Leave Panel */}
      <div className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50">
        <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-4">Apply for Holidays</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Leave Category</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs text-slate-800 dark:text-zinc-200"
            >
              <option value="Casual Leave">Casual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Earned Leave">Earned Leave</option>
              <option value="Emergency Leave">Emergency Leave</option>
              <option value="Work From Home">Work From Home</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">From Date</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs text-slate-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">To Date</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs text-slate-800 dark:text-zinc-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Reason</label>
            <textarea
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows="3"
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs text-slate-800 dark:text-zinc-200"
              placeholder="Provide a detailed reason..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Medical Slip / File Upload</label>
            <div className="relative border-2 border-dashed border-slate-200/60 dark:border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:border-brand-500 transition-colors">
              <Upload className="w-6 h-6 text-slate-400 dark:text-zinc-600 mb-2" />
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Click to select files (PDF, JPG, PNG)</span>
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {attachment && (
                <span className="text-[9px] font-bold text-brand-600 dark:text-brand-400 mt-2">
                  📎 Selected: {attachment.name}
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-brand-500/10 active:scale-95 transition-all cursor-pointer"
          >
            {loading ? 'Submitting Application...' : 'Send Leave Request'}
          </button>
        </form>
      </div>

      {/* History Log Cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Leave Logs</h3>
        {leaves.map((leave) => (
          <div 
            key={leave.id} 
            className="glass-card rounded-2xl p-4 border border-slate-200/50 dark:border-zinc-800/50 space-y-3"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{leave.type}</span>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1
                ${leave.status === 'Approved' && 'bg-emerald-500/10 text-emerald-600'}
                ${leave.status === 'Pending' && 'bg-amber-500/10 text-amber-600'}
                ${leave.status === 'Rejected' && 'bg-rose-500/10 text-rose-600'}
              `}>
                {leave.status === 'Approved' && <CheckCircle size={10} />}
                {leave.status === 'Pending' && <Clock size={10} />}
                {leave.status === 'Rejected' && <XCircle size={10} />}
                {leave.status}
              </span>
            </div>
            
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>{leave.startDate} to {leave.endDate}</span>
            </div>

            <p className="text-[10px] text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-slate-200/20 dark:border-zinc-700/20">
              {leave.reason}
            </p>

            {leave.attachmentPath && (
              <a
                href={`/${leave.attachmentPath}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[9px] font-bold text-brand-600 dark:text-brand-400 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                View Attachment File
              </a>
            )}

            {leave.comments && (
              <div className="border-t border-slate-100 dark:border-zinc-800/60 pt-2.5 mt-1 text-[9px] text-slate-400">
                <span className="font-bold text-slate-600 dark:text-zinc-300">Approver Feedback:</span> {leave.comments}
              </div>
            )}
          </div>
        ))}

        {leaves.length === 0 && (
          <p className="text-xs text-slate-400 dark:text-zinc-500 text-center py-8">No leave logs present yet.</p>
        )}
      </div>

    </div>
  );
}
