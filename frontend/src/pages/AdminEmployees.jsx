import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  X, 
  Check, 
  Eye, 
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Add Form State
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    employeeId: '',
    role: 'Employee',
    department: 'Engineering',
    designation: 'Software Engineer',
    basicSalary: 3000,
    hra: 800,
    conveyance: 200,
    allowances: 300
  });

  const [verifyRemark, setVerifyRemark] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/employees');
      setEmployees(res.data.employees);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      await axios.post('/api/employees', form);
      setMsg({ type: 'success', text: 'Employee account created successfully!' });
      setShowAddModal(false);
      fetchEmployees();
      // Reset form
      setForm({
        fullName: '',
        email: '',
        password: '',
        employeeId: '',
        role: 'Employee',
        department: 'Engineering',
        designation: 'Software Engineer',
        basicSalary: 3000,
        hra: 800,
        conveyance: 200,
        allowances: 300
      });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to create employee.' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await axios.patch(`/api/employees/${id}/status`, { status: nextStatus });
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePayrollAccess = async (id, currentAccess) => {
    try {
      await axios.patch(`/api/employees/${id}/payroll-permission`, { canPreparePayroll: !currentAccess });
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await axios.delete(`/api/employees/${id}`);
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewDocs = async (emp) => {
    setSelectedEmp(emp);
    try {
      const res = await axios.get(`/api/employees/${emp.id}/documents`);
      setDocuments(res.data.documents);
      setShowDocModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyDoc = async (docId, status) => {
    try {
      await axios.patch(`/api/employees/document/${docId}/verify`, {
        status,
        remarks: verifyRemark
      });
      setVerifyRemark('');
      // Reload docs
      if (selectedEmp) {
        const res = await axios.get(`/api/employees/${selectedEmp.id}/documents`);
        setDocuments(res.data.documents);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Employee Directory</h2>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Manage corporate personnel accounts, payroll structure baseline, and documents compliance</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/10 active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus size={14} />
          Create Employee
        </button>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold
          ${msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'}
        `}>
          {msg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Directory Table Card */}
      <div className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/50 dark:border-zinc-850 text-slate-400 dark:text-zinc-500 font-bold uppercase text-[9px] tracking-wider">
                <th className="py-3 px-2">Emp ID</th>
                <th className="py-3 px-2">Name</th>
                <th className="py-3 px-2">Department</th>
                <th className="py-3 px-2">Designation</th>
                <th className="py-3 px-2">System Role</th>
                <th className="py-3 px-2">Payroll Access</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/40">
              {employees.map((emp) => (
                <tr key={emp.id} className="text-slate-700 dark:text-zinc-300">
                  <td className="py-3.5 px-2 font-mono font-bold text-slate-800 dark:text-zinc-200">{emp.employeeId}</td>
                  <td className="py-3.5 px-2">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-zinc-100">{emp.fullName}</div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-550 mt-0.5">{emp.email}</div>
                    </div>
                  </td>
                  <td className="py-3.5 px-2">{emp.department || 'N/A'}</td>
                  <td className="py-3.5 px-2">{emp.designation || 'N/A'}</td>
                  <td className="py-3.5 px-2">
                    <span className="px-2 py-0.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/30 dark:border-zinc-700/30 rounded-md font-bold text-[9px]">
                      {emp.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-2">
                    {emp.designation?.toLowerCase() === 'accountant' ? (
                      <button
                        onClick={() => handleTogglePayrollAccess(emp.id, emp.canPreparePayroll)}
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase transition-all cursor-pointer
                          ${emp.canPreparePayroll ? 'bg-brand-600/15 text-brand-600 hover:bg-brand-600/25' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:bg-slate-200'}
                        `}
                      >
                        {emp.canPreparePayroll ? 'Authorized' : 'Unauthorized'}
                      </button>
                    ) : (
                      <span className="text-slate-400 dark:text-zinc-600 text-[10px]">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-2">
                    <button
                      onClick={() => handleToggleStatus(emp.id, emp.status)}
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase transition-all cursor-pointer
                        ${emp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:bg-slate-200'}
                      `}
                    >
                      {emp.status}
                    </button>
                  </td>
                  <td className="py-3.5 px-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleViewDocs(emp)}
                        title="Verify Documents"
                        className="p-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/20 dark:hover:bg-brand-950/40 text-brand-600 dark:text-brand-400 transition-all cursor-pointer"
                      >
                        <ShieldCheck size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        title="Delete Profile"
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-all cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200/50 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Create Employee Profile</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Full Name</label>
                  <input type="text" name="fullName" required value={form.fullName} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Employee ID</label>
                  <input type="text" name="employeeId" required value={form.employeeId} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Email Address</label>
                  <input type="email" name="email" required value={form.email} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Password</label>
                  <input type="password" name="password" required value={form.password} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Department</label>
                  <select name="department" value={form.department} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-slate-800 dark:text-zinc-200">
                    <option value="Engineering">Engineering</option>
                    <option value="HR">HR</option>
                    <option value="Accounts">Accounts</option>
                    <option value="Sales">Sales</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Designation</label>
                  <input type="text" name="designation" value={form.designation} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">System Role</label>
                  <select name="role" value={form.role} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-slate-800 dark:text-zinc-200">
                    <option value="Employee">Employee</option>
                    <option value="HR Manager">HR Manager</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Senior Accountant">Senior Accountant</option>
                    <option value="Team Leader">Team Leader</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Basic Salary ($)</label>
                  <input type="number" name="basicSalary" value={form.basicSalary} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">HRA ($)</label>
                  <input type="number" name="hra" value={form.hra} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Conveyance ($)</label>
                  <input type="number" name="conveyance" value={form.conveyance} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Allowances ($)</label>
                  <input type="number" name="allowances" value={form.allowances} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all cursor-pointer">Create Profile</button>
            </form>
          </div>
        </div>
      )}

      {/* Document Review Modal */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto border border-slate-200/50 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Document Compliance Review</h3>
                <p className="text-[10px] text-slate-450 dark:text-zinc-500 mt-1">Reviewing files for {selectedEmp?.fullName}</p>
              </div>
              <button onClick={() => setShowDocModal(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              {documents.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-zinc-500 text-center py-6">No documents uploaded by this employee.</p>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="p-4 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/40 dark:border-zinc-800/60 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800 dark:text-zinc-200">{doc.type}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase
                          ${doc.status === 'Verified' && 'bg-emerald-500/10 text-emerald-600'}
                          ${doc.status === 'Pending' && 'bg-amber-500/10 text-amber-600'}
                          ${doc.status === 'Rejected' && 'bg-rose-500/10 text-rose-600'}
                        `}>
                          {doc.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-550 mb-1">File: {doc.fileName}</p>
                      <a href={`/${doc.filePath}`} target="_blank" rel="noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1 font-bold text-[9px] cursor-pointer">
                        <Eye size={12} /> View Uploaded File
                      </a>
                    </div>

                    {doc.status === 'Pending' && (
                      <div className="space-y-2 md:max-w-xs w-full">
                        <input
                          type="text"
                          placeholder="Add verification remarks..."
                          value={verifyRemark}
                          onChange={(e) => setVerifyRemark(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 rounded-lg text-[10px]"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleVerifyDoc(doc.id, 'Rejected')}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[9px] flex items-center gap-1 cursor-pointer"
                          >
                            <X size={10} /> Reject
                          </button>
                          <button
                            onClick={() => handleVerifyDoc(doc.id, 'Verified')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[9px] flex items-center gap-1 cursor-pointer"
                          >
                            <Check size={10} /> Verify
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
