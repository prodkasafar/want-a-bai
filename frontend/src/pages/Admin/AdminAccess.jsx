import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { adminAPI } from '../../services/api';
import { 
  UserCheck, Shield, Mail, Smartphone, MapPin, 
  CheckCircle2, ShieldAlert, Search, User, AlertTriangle
} from 'lucide-react';

export default function AdminAccess() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Manual email input
  const [manualEmail, setManualEmail] = useState('');

  // Loading & confirmation states
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState(null); // { type, message }

  const fetchAllUsers = async () => {
    try {
      const res = await adminAPI.getUsers();
      // Combine clients and maids into a single searchable list
      const clientList = (res.data.clients || []).map(c => ({
        id: c.id,
        userId: c.userId,
        fullName: c.fullName,
        email: c.email || c.user?.email || '',
        phone: c.mobileNumber,
        role: 'CLIENT',
        raw: c
      }));
      const maidList = (res.data.maids || []).map(m => ({
        id: m.id,
        userId: m.userId,
        fullName: m.fullName,
        email: m.email || m.user?.email || '',
        phone: m.mobileNumber,
        role: 'MAID',
        raw: m
      }));
      setUsers([...clientList, ...maidList]);
    } catch (err) {
      console.error('Failed to load users for directory lookup:', err);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Filter users based on query
  const suggestions = searchQuery.trim() === '' ? [] : users.filter(u => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery)
  ).slice(0, 5);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchQuery('');
  };

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!manualEmail.trim()) return;

    setLoading(true);
    try {
      // Find locally first
      const found = users.find(u => u.email.toLowerCase() === manualEmail.trim().toLowerCase());
      if (found) {
        setSelectedUser(found);
        setManualEmail('');
      } else {
        // If not loaded locally, we can let them promote directly by typing the email.
        setSelectedUser({
          userId: null,
          fullName: 'External Account / Direct Email',
          email: manualEmail.trim().toLowerCase(),
          phone: 'N/A',
          role: 'UNKNOWN (Pending Promotion)'
        });
        setManualEmail('');
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to verify email.' });
    } finally {
      setLoading(false);
    }
  };

  const executePromotion = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const res = await adminAPI.promoteToAdmin(selectedUser.email);
      setToast({ type: 'success', message: res.data.message || 'User successfully upgraded to Administrator.' });
      setShowConfirmModal(false);
      setSelectedUser(null);
      // Refresh local directory
      await fetchAllUsers();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed to promote user to Admin.' });
      setShowConfirmModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-left">
      <Sidebar />

      {/* Main Admin Content */}
      <main className="flex-1 p-6 md:p-8 bg-brand-light-gray space-y-8 relative">
        {/* Header */}
        <div className="border-b border-brand-gold/20 pb-4">
          <h1 className="font-display font-extrabold text-2xl text-brand-dark">Administrator Access Management</h1>
          <p className="text-xs text-brand-dark/65">Promote registered client or maid accounts to system Administrator level.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Lookup User Section */}
          <div className="bg-white border border-brand-gold/15 p-6 rounded-3xl shadow-sm space-y-6">
            <div className="space-y-2">
              <h3 className="font-display font-bold text-base text-brand-dark flex items-center gap-2">
                <Search className="w-5 h-5 text-brand-coral" />
                Find User Directory Account
              </h3>
              <p className="text-xs text-brand-dark/60 font-sans leading-relaxed">
                Search through active clients or helper maids to elevate their account access privileges.
              </p>
            </div>

            {/* Autocomplete Input */}
            <div className="relative">
              <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Search by Name, Email, or Mobile</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-dark/40" />
                <input
                  type="text"
                  placeholder="Type name, email address, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-brand-cream/15 border border-brand-gold/30 rounded-xl text-xs focus:outline-none focus:border-brand-coral"
                />
              </div>

              {/* Suggestions dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-brand-gold/25 rounded-xl shadow-lg z-20 overflow-hidden divide-y divide-brand-gold/10 animate-fadeIn">
                  {suggestions.map((u, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectUser(u)}
                      className="w-full text-left px-4 py-3 hover:bg-brand-gold/5 flex justify-between items-center text-xs"
                    >
                      <div>
                        <p className="font-bold text-brand-dark">{u.fullName}</p>
                        <p className="text-[10px] text-brand-dark/50 font-mono">{u.email || 'No email'}</p>
                      </div>
                      <span className="text-[9px] font-bold bg-brand-cream border px-2 py-0.5 rounded text-brand-dark/70">
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-brand-gold/15"></div>
              <span className="flex-shrink mx-4 text-[10px] font-extrabold text-brand-dark/40 uppercase tracking-widest">Or</span>
              <div className="flex-grow border-t border-brand-gold/15"></div>
            </div>

            {/* Direct Email Promotion */}
            <form onSubmit={handleManualSearch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Enter Email Address Manually</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="e.g. employee@wantabai.com"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    className="flex-1 px-3 py-2 bg-brand-cream/15 border border-brand-gold/30 rounded-xl text-xs focus:outline-none focus:border-brand-coral"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-dark hover:bg-brand-dark/95 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    Lookup
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* User Details & Promotion Confirmation Card */}
          {selectedUser ? (
            <div className="bg-white border border-brand-gold/15 p-6 rounded-3xl shadow-sm space-y-6 animate-scaleUp">
              <div className="space-y-2 border-b border-brand-gold/15 pb-4">
                <h3 className="font-display font-bold text-base text-brand-dark flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-brand-coral" />
                  Target Account Selected
                </h3>
                <p className="text-xs text-brand-dark/65">Review profile metrics before upgrading account access privileges.</p>
              </div>

              {/* Card Profile Details */}
              <div className="space-y-4 text-xs">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-brand-cream border border-brand-gold/20 rounded-2xl">
                    <User className="w-6 h-6 text-brand-coral" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-brand-dark">{selectedUser.fullName}</h4>
                    <span className="text-[10px] font-bold bg-brand-gold/20 text-brand-dark/75 border border-brand-gold/20 px-2 py-0.5 rounded">
                      Role: {selectedUser.role}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 font-sans text-brand-dark/80">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-brand-coral shrink-0" />
                    <strong>Email:</strong> {selectedUser.email || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-brand-coral shrink-0" />
                    <strong>Mobile Number:</strong> {selectedUser.phone}
                  </div>
                  {selectedUser.raw?.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-brand-coral shrink-0 mt-0.5" />
                      <div>
                        <strong>Location Address:</strong>
                        <p className="text-brand-dark/70 text-[11px] leading-relaxed mt-0.5">{selectedUser.raw.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-brand-gold/10">
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full py-2.5 bg-brand-coral hover:bg-brand-coral/95 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Elevate User to Administrator
                </button>
              </div>
            </div>
          ) : (
            /* Placeholder */
            <div className="bg-brand-cream/10 border border-dashed border-brand-gold/30 rounded-3xl p-12 text-center text-xs text-brand-dark/50 italic flex flex-col items-center justify-center min-h-[250px]">
              <Shield className="w-8 h-8 text-brand-gold/40 mb-3" />
              <span>Select an account from the lookup panel to evaluate administrator elevation.</span>
            </div>
          )}
        </div>

        {/* Promotion Confirmation Modal */}
        {showConfirmModal && selectedUser && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-brand-gold/20 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl animate-scaleUp">
              <div className="flex items-center gap-3 text-brand-coral">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="font-display font-extrabold text-base text-brand-dark">Confirm Administrator Promotion</h3>
              </div>
              
              <p className="text-xs text-brand-dark/70 font-sans leading-relaxed">
                Are you sure you want to elevate <strong className="text-brand-dark">{selectedUser.fullName}</strong> (<span className="font-mono text-brand-dark">{selectedUser.email}</span>) to the <strong>Administrator</strong> role?
                <br /><br />
                This grants full write and delete permissions for appointments, catalogs, and all system directory databases.
              </p>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  disabled={loading}
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 bg-brand-cream border border-brand-gold/30 hover:bg-brand-gold/15 text-brand-dark font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={loading}
                  onClick={executePromotion}
                  className="px-4 py-2 bg-brand-coral hover:bg-brand-coral/95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-70 shadow-sm"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Upgrading...
                    </>
                  ) : (
                    'Confirm Upgrade'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Alerts System */}
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
