import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { User, ShieldCheck, UploadCloud, FileText, Check, AlertCircle, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EmployeeProfile() {
  const { user, updateProfileState } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    parentName: '',
    dob: '',
    gender: '',
    address: '',
    contactNumber: '',
    alternateContactNumber: '',
    emergencyContact: ''
  });

  const [docType, setDocType] = useState('Aadhaar Card');
  const [docExpiry, setDocExpiry] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        parentName: user.parentName || '',
        dob: user.dob || '',
        gender: user.gender || '',
        address: user.address || '',
        contactNumber: user.contactNumber || '',
        alternateContactNumber: user.alternateContactNumber || '',
        emergencyContact: user.emergencyContact || ''
      });
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`/api/employees/${user.id}/documents`);
      setDocuments(res.data.documents);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await axios.put(`/api/employees/${user.id}`, formData);
      updateProfileState(res.data.employee);
      setMsg({ type: 'success', text: 'Profile details saved successfully!' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setDocFile(e.target.files[0]);
  };

  const handleDocUpload = async (e) => {
    e.preventDefault();
    if (!docFile) {
      setMsg({ type: 'error', text: 'Please select a document file to upload.' });
      return;
    }

    setUploading(true);
    setMsg({ type: '', text: '' });

    const data = new FormData();
    data.append('document', docFile);
    data.append('type', docType);
    if (docExpiry) {
      data.append('expiryDate', docExpiry);
    }

    try {
      await axios.post('/api/employees/document/upload', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMsg({ type: 'success', text: `${docType} uploaded successfully.` });
      setDocFile(null);
      setDocExpiry('');
      fetchDocuments();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to upload document.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <User className="text-brand-600 dark:text-brand-500" size={22} />
          Profile Details & Documents
        </h2>
        <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
          Maintain your personal data and verify identity details
        </p>
      </div>

      {/* Message Alerts */}
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
            {msg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{msg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Form */}
      <div className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50">
        <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-4">Personal Information</h3>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800/30 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs text-slate-800 dark:text-zinc-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Guardian Name</label>
              <input
                type="text"
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800/30 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs text-slate-800 dark:text-zinc-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Birth Date</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800/30 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs text-slate-850 dark:text-zinc-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800/30 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs text-slate-800 dark:text-zinc-200 focus:outline-none"
              >
                <option value="">Choose Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Mobile</label>
              <input
                type="text"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800/30 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs text-slate-800 dark:text-zinc-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Emergency Mobile</label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800/30 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs text-slate-800 dark:text-zinc-200 focus:outline-none"
                placeholder="Name - Phone number"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Postal Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows="2.5"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800/30 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs text-slate-800 dark:text-zinc-200 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-brand-500/10 active:scale-95 transition-all cursor-pointer"
          >
            {loading ? 'Saving Profile...' : 'Save Personal Details'}
          </button>
        </form>
      </div>

      {/* Corporate Details */}
      <div className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50">
        <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Briefcase size={14} className="text-slate-400" />
          Employment Information
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-450 dark:text-zinc-500 block text-[9px] font-bold uppercase">Emp ID</span>
            <span className="font-extrabold text-slate-800 dark:text-zinc-200">{user?.employeeId}</span>
          </div>
          <div>
            <span className="text-slate-450 dark:text-zinc-500 block text-[9px] font-bold uppercase">Department</span>
            <span className="font-extrabold text-slate-800 dark:text-zinc-200">{user?.department || 'Engineering'}</span>
          </div>
          <div>
            <span className="text-slate-450 dark:text-zinc-500 block text-[9px] font-bold uppercase">Designation</span>
            <span className="font-extrabold text-slate-800 dark:text-zinc-200">{user?.designation || 'Engineer'}</span>
          </div>
          <div>
            <span className="text-slate-450 dark:text-zinc-500 block text-[9px] font-bold uppercase">Joining Date</span>
            <span className="font-extrabold text-slate-800 dark:text-zinc-200">{user?.joiningDate || '2026-05-01'}</span>
          </div>
        </div>
      </div>

      {/* Identity Verification & Upload Document Panel */}
      <div className="glass-card rounded-3xl p-5 border border-slate-200/50 dark:border-zinc-800/50">
        <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-brand-650" />
          Verify Credentials
        </h3>
        <form onSubmit={handleDocUpload} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Doc Category</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs text-slate-800 dark:text-zinc-200"
            >
              <option value="Aadhaar Card">Aadhaar Card</option>
              <option value="PAN Card">PAN Card</option>
              <option value="Passport">Passport</option>
              <option value="Educational Certificate">Educational Certificate</option>
              <option value="Profile Photograph">Profile Photograph</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Expiry (If applicable)</label>
            <input
              type="date"
              value={docExpiry}
              onChange={(e) => setDocExpiry(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 rounded-xl text-xs text-slate-800 dark:text-zinc-200"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">File Attachment</label>
            <div className="relative border-2 border-dashed border-slate-200/60 dark:border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:border-brand-500 transition-colors">
              <UploadCloud className="w-6 h-6 text-slate-400 dark:text-zinc-650 mb-1" />
              <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-medium">Click to select files (PDF, JPG, PNG)</span>
              <input
                type="file"
                required
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {docFile && (
                <span className="text-[9px] font-bold text-brand-600 dark:text-brand-400 mt-2">
                  📎 Selected: {docFile.name}
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-brand-500/10 active:scale-95 transition-all cursor-pointer"
          >
            {uploading ? 'Uploading File...' : 'Upload verification file'}
          </button>
        </form>
      </div>

      {/* Uploaded Documents List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Uploaded Documents</h3>
        {documents.map((doc) => (
          <div 
            key={doc.id} 
            className="glass-card rounded-2xl p-4 border border-slate-200/50 dark:border-zinc-800/50 space-y-2.5"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{doc.type}</span>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase
                ${doc.status === 'Verified' && 'bg-emerald-500/10 text-emerald-600'}
                ${doc.status === 'Pending' && 'bg-amber-500/10 text-amber-600'}
                ${doc.status === 'Rejected' && 'bg-rose-500/10 text-rose-600'}
              `}>
                {doc.status}
              </span>
            </div>
            
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">File: {doc.fileName}</p>
            {doc.expiryDate && (
              <p className="text-[9px] text-slate-400 dark:text-zinc-500">Expires: {doc.expiryDate}</p>
            )}

            {doc.remarks && (
              <div className="p-2 bg-slate-50 dark:bg-zinc-800/40 rounded-xl text-[9px] text-slate-500 border border-slate-200/10 dark:border-zinc-800/60">
                <strong>Admin Remarks:</strong> {doc.remarks}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 flex justify-end">
              <a
                href={`/${doc.filePath}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-[9px] font-bold text-brand-600 dark:text-brand-400 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                View Document
              </a>
            </div>
          </div>
        ))}

        {documents.length === 0 && (
          <p className="text-xs text-slate-400 dark:text-zinc-500 text-center py-8">No verification files uploaded yet.</p>
        )}
      </div>
    </div>
  );
}
