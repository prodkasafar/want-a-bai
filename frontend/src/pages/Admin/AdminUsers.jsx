import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { adminAPI } from '../../services/api';
import { 
  Users, Trash2, Smartphone, MapPin, 
  CheckCircle2, ShieldAlert, AlertTriangle 
} from 'lucide-react';

export default function AdminUsers() {
  const [clients, setClients] = useState([]);
  const [maids, setMaids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('CLIENTS'); // CLIENTS or MAIDS
  
  // Custom Modal & Deletion loading
  const [deleteTarget, setDeleteTarget] = useState(null); // { userId, name, role } or null
  const [deleting, setDeleting] = useState(false);
  
  // Floating Toast Notification state
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message: '...' } or null

  const fetchUsers = async () => {
    try {
      const res = await adminAPI.getUsers();
      setClients(res.data.clients || []);
      setMaids(res.data.maids || []);
    } catch (err) {
      console.error('Failed to fetch user directory:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const initFetch = async () => {
      setLoading(true);
      await fetchUsers();
      setLoading(false);
    };
    initFetch();
  }, []);

  // Optimized background polling fallback (every 8 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchUsers();
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const triggerOffboard = (userId, name, role) => {
    setDeleteTarget({ userId, name, role });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminAPI.deleteUser(deleteTarget.userId);
      setToast({
        type: 'success',
        message: `${deleteTarget.role === 'MAID' ? 'Maid' : 'Client'} "${deleteTarget.name}" offboarded successfully.`
      });
      setDeleteTarget(null);
      // Immediately pull fresh directory
      await fetchUsers();
    } catch (err) {
      setToast({
        type: 'error',
        message: err.response?.data?.error || `Failed to offboard ${deleteTarget.name}.`
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-left">
      <Sidebar />

      {/* Main Admin Content */}
      <main className="flex-1 p-6 md:p-8 bg-brand-light-gray space-y-8 relative">
        {/* Header */}
        <div className="border-b border-brand-gold/20 pb-4">
          <h1 className="font-display font-extrabold text-2xl text-brand-dark">User Account Directories</h1>
          <p className="text-xs text-brand-dark/65">Review and manage registered client and maid profiles.</p>
        </div>

        {/* Tab Headers */}
        <div className="flex gap-4 border-b border-brand-gold/15 pb-2">
          <button
            onClick={() => setActiveTab('CLIENTS')}
            className={`pb-2 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'CLIENTS' 
                ? 'border-brand-coral text-brand-coral' 
                : 'border-transparent text-brand-dark/50'
            }`}
          >
            Clients Directory ({clients.length})
          </button>
          <button
            onClick={() => setActiveTab('MAIDS')}
            className={`pb-2 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'MAIDS' 
                ? 'border-brand-coral text-brand-coral' 
                : 'border-transparent text-brand-dark/50'
            }`}
          >
            Maids Directory ({maids.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs">Loading user directories...</div>
        ) : (
          <div className="bg-white border border-brand-gold/15 rounded-3xl shadow-sm overflow-hidden">
            {activeTab === 'CLIENTS' ? (
              /* Clients Grid/Table */
              clients.length === 0 ? (
                <div className="p-12 text-center text-xs text-brand-dark/40 italic">No clients registered yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-brand-cream/35 border-b border-brand-gold/25 text-brand-dark/65 font-bold">
                        <th className="px-6 py-3">Client Name</th>
                        <th className="px-6 py-3">Contact</th>
                        <th className="px-6 py-3">Address</th>
                        <th className="px-6 py-3">Marital Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-gold/10">
                      {clients.map(c => (
                        <tr key={c.id} className="hover:bg-brand-gold/5 transition-colors">
                          <td className="px-6 py-4 font-bold text-brand-dark">
                            <div>{c.fullName}</div>
                            <div className="text-[9px] text-brand-dark/40 font-normal">DOB: {new Date(c.dob).toLocaleDateString()} • {c.gender}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1"><Smartphone className="w-3.5 h-3.5 text-brand-coral animate-pulse" /> {c.mobileNumber}</div>
                            <div className="text-[9px] text-brand-dark/50 pl-4.5">{c.email || 'No email ID'}</div>
                          </td>
                          <td className="px-6 py-4 truncate max-w-[200px]" title={c.address}>
                            {c.address}
                          </td>
                          <td className="px-6 py-4">{c.maritalStatus}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => triggerOffboard(c.userId, c.fullName, 'CLIENT')}
                              className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-all transform hover:scale-105 active:scale-95 inline-block"
                              title="Delete Client Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              /* Maids Grid/Table */
              maids.length === 0 ? (
                <div className="p-12 text-center text-xs text-brand-dark/40 italic">No maids registered yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-brand-cream/35 border-b border-brand-gold/25 text-brand-dark/65 font-bold">
                        <th className="px-6 py-3">Maid Helper</th>
                        <th className="px-6 py-3">Contact Details</th>
                        <th className="px-6 py-3">Offered Services</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-gold/10">
                      {maids.map(m => (
                        <tr key={m.id} className="hover:bg-brand-gold/5 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <img 
                              src={m.profilePhotoUrl} 
                              alt="" 
                              className="w-9 h-9 rounded-full object-cover border border-brand-gold/30 shadow-sm"
                            />
                            <div>
                              <p className="font-bold text-brand-dark">{m.fullName}</p>
                              <p className="text-[9px] text-brand-dark/40">DOB: {new Date(m.dob).toLocaleDateString()} • {m.gender}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>Primary: {m.mobileNumber}</div>
                            {m.alternateMobile && <div className="text-[9px] text-brand-dark/50">Alt: {m.alternateMobile}</div>}
                            <div className="text-[9px] text-brand-dark/50">Emerg: {m.emergencyContact}</div>
                          </td>
                          <td className="px-6 py-4 max-w-[220px]">
                            <div className="flex flex-wrap gap-1">
                              {m.services.map(s => (
                                <span key={s.id} className="text-[9px] bg-brand-cream border border-brand-gold/15 px-1.5 py-0.5 rounded text-brand-dark font-medium shadow-2xs">
                                  {s.service.name} (Rs.{s.expectedSalary})
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                              m.status === 'AVAILABLE'
                                ? 'bg-green-100 text-green-700'
                                : m.status === 'IN_TALKS'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => triggerOffboard(m.userId, m.fullName, 'MAID')}
                              className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-all transform hover:scale-105 active:scale-95 inline-block"
                              title="Delete Maid Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        )}

        {/* Custom Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-brand-gold/20 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl animate-scaleUp">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="font-display font-extrabold text-base text-brand-dark">Confirm Account Offboarding</h3>
              </div>
              
              <p className="text-xs text-brand-dark/70 font-sans leading-relaxed">
                Are you sure you want to offboard <strong className="text-brand-dark">{deleteTarget.name}</strong> ({deleteTarget.role.toLowerCase()})? This action will permanently remove their profile and credentials.
              </p>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  disabled={deleting}
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 bg-brand-cream border border-brand-gold/30 hover:bg-brand-gold/15 text-brand-dark font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={deleting}
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-70 shadow-sm"
                >
                  {deleting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Deleting...
                    </>
                  ) : (
                    'Confirm Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification System */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-white border border-brand-gold/30 rounded-2xl shadow-xl animate-slideIn">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="text-xs font-bold text-brand-dark">{toast.message}</span>
          </div>
        )}
      </main>
    </div>
  );
}
