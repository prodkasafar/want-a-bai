import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { adminAPI, discoveryAPI } from '../../services/api';
import { 
  Plus, Server, CheckCircle2, ShieldAlert, 
  Trash2, AlertTriangle 
} from 'lucide-react';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Delete states
  const [deleteTarget, setDeleteTarget] = useState(null); // service object or null
  const [deleting, setDeleting] = useState(false);

  // Floating Toast state
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '...' } or null

  const fetchServices = async () => {
    try {
      const res = await discoveryAPI.getServices();
      setServices(res.data.services || []);
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const initFetch = async () => {
      setLoading(true);
      await fetchServices();
      setLoading(false);
    };
    initFetch();
  }, []);

  // Polling updates every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchServices();
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!name) return;

    try {
      await adminAPI.createService({ name, description });
      setToast({ type: 'success', message: `Service category "${name}" created successfully.` });
      setName('');
      setDescription('');
      await fetchServices();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed to create service.' });
    }
  };

  const triggerDeleteService = (service) => {
    setDeleteTarget(service);
  };

  const confirmDeleteService = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminAPI.deleteService(deleteTarget.id);
      setToast({ type: 'success', message: `Service "${deleteTarget.name}" deleted successfully.` });
      setDeleteTarget(null);
      await fetchServices();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || `Failed to delete service ${deleteTarget.name}.` });
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
          <h1 className="font-display font-extrabold text-2xl text-brand-dark">Service Catalog Management</h1>
          <p className="text-xs text-brand-dark/65">Define and manage service categories available for helpers to offer.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Services List Table (Left 2 Columns) */}
          <div className="lg:col-span-2 bg-white border border-brand-gold/15 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-display font-bold text-base text-brand-dark flex items-center gap-2">
              <Server className="w-5 h-5 text-brand-coral" />
              Active Catalog Entries
            </h3>

            {loading ? (
              <div className="text-center py-8 text-xs">Loading services list...</div>
            ) : (
              <div className="divide-y divide-brand-gold/10">
                {services.map((service) => (
                  <div key={service.id} className="py-4 text-xs flex justify-between items-start gap-4 hover:bg-brand-gold/5 px-2 rounded-xl transition-colors">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-brand-dark">{service.name}</p>
                      <p className="text-brand-dark/70 mt-1 leading-relaxed font-sans">{service.description || 'No description provided'}</p>
                      <span className="text-[9px] text-brand-dark/40 block mt-2">ID: {service.id}</span>
                    </div>
                    <button
                      onClick={() => triggerDeleteService(service)}
                      className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-all transform hover:scale-105 active:scale-95 shrink-0"
                      title="Delete Catalog Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Service Form (Right Column) */}
          <div className="bg-white border border-brand-gold/15 p-6 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-display font-bold text-base text-brand-dark flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-coral" />
              Create New Entry
            </h3>

            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-dark/70 mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pet Care & Walking"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-cream/15 border border-brand-gold/30 rounded-xl text-xs focus:outline-none focus:border-brand-coral"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-dark/70 mb-1">Description</label>
                <textarea
                  rows="4"
                  placeholder="Details about what tasks are expected..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-cream/15 border border-brand-gold/30 rounded-xl text-xs focus:outline-none focus:border-brand-coral"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-brand-coral hover:bg-brand-coral/95 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
              >
                Create Category Entry
              </button>
            </form>
          </div>
        </div>

        {/* Custom Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-brand-gold/20 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl animate-scaleUp">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="font-display font-extrabold text-base text-brand-dark">Confirm Catalog Deletion</h3>
              </div>
              
              <p className="text-xs text-brand-dark/70 font-sans leading-relaxed">
                Are you sure you want to delete the service category <strong className="text-brand-dark">{deleteTarget.name}</strong>?
                <br /><br />
                <span className="text-[10px] text-red-500 font-bold block">
                  Warning: If this service is offered by helpers with active employments, deletion will be blocked by the system.
                </span>
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
                  onClick={confirmDeleteService}
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
