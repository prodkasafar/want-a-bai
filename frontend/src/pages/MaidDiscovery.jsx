import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { discoveryAPI, bookingAPI } from '../services/api';
import { CardSkeleton } from '../components/common/SkeletonLoader';
import { 
  Search, SlidersHorizontal, MapPin, 
  Briefcase, DollarSign, Calendar, Clock, 
  Smartphone, ShieldCheck, X, Check 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MaidDiscovery() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [maids, setMaids] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [status, setStatus] = useState('AVAILABLE'); // AVAILABLE, IN_TALKS, or ALL (empty)

  // Drawer / Negotiation State
  const [selectedMaid, setSelectedMaid] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);
  const [activeThread, setActiveThread] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Offer Form State
  const [offerForm, setOfferForm] = useState({
    joiningDate: '',
    workingHours: '8',
    finalSalary: ''
  });

  const fetchMaids = async () => {
    setLoading(true);
    try {
      const res = await discoveryAPI.getMaids({
        search: search || undefined,
        serviceId: serviceId || undefined,
        maxSalary: maxSalary || undefined,
        status: status || undefined
      });
      setMaids(res.data.maids || []);
    } catch (err) {
      console.error('Failed to load maids list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch global services list
    const fetchServices = async () => {
      try {
        const res = await discoveryAPI.getServices();
        setServicesList(res.data.services || []);
      } catch (err) {
        console.error('Failed to load services:', err);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    fetchMaids();
  }, [serviceId, status]); // Auto trigger on dropdown selections

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMaids();
  };

  const openMaidDetails = async (maid) => {
    setSelectedMaid(maid);
    setDrawerOpen(true);
    setActionError('');
    setActionSuccess('');
    setActiveThread(null);
    setOfferForm({
      joiningDate: '',
      workingHours: '8',
      finalSalary: String(maid.services[0]?.expectedSalary || '')
    });

    // Check if there is already an open thread for this maid (client only)
    if (user && user.role === 'CLIENT' && user.clientProfile) {
      try {
        // Initializing thread does this check transparently.
        // We will just let the client click 'Initiate Talks' to load/create it
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Step 1: Open Thread (shares contact info)
  const handleStartTalks = async () => {
    if (!user) {
      return navigate('/login');
    }
    if (user.role !== 'CLIENT' || !user.clientProfile) {
      return setActionError('Only Clients with completed profiles can initiate negotiations.');
    }

    setThreadLoading(true);
    setActionError('');
    try {
      const res = await bookingAPI.initializeThread(selectedMaid.id);
      setActiveThread(res.data.thread);
      setActionSuccess('Negotiation opened! Mobile number is now shared.');
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to start negotiation.');
    } finally {
      setThreadLoading(false);
    }
  };

  // Step 2: Send Employment Offer Request
  const handleSendOffer = async (e) => {
    e.preventDefault();
    if (!activeThread) return;

    setActionError('');
    setActionSuccess('');
    setThreadLoading(true);

    try {
      await bookingAPI.raiseRequest({
        threadId: activeThread.id,
        joiningDate: offerForm.joiningDate,
        workingHours: parseInt(offerForm.workingHours),
        finalSalary: parseFloat(offerForm.finalSalary)
      });
      setActionSuccess('Employment offer sent! Redirecting to dashboard...');
      setTimeout(() => {
        setDrawerOpen(false);
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to submit offer.');
    } finally {
      setThreadLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto my-8 px-4 text-left">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-brand-dark">Discover Helper Staff</h1>
          <p className="text-xs text-brand-dark/65">Find, contact, and hire verified Bais in your neighborhood.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Filters Panel (Left column on large screens) */}
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-brand-coral/10 space-y-6">
          <div className="flex items-center gap-2 border-b border-brand-gold/20 pb-3">
            <SlidersHorizontal className="w-4 h-4 text-brand-coral" />
            <h3 className="font-display font-bold text-sm text-brand-dark">Filter Settings</h3>
          </div>

          <form onSubmit={handleSearchSubmit} className="space-y-4">
            {/* Search Input */}
            <div>
              <label className="block text-xs font-semibold text-brand-dark/70 mb-1">Search Name</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-white border border-brand-gold/30 rounded-xl text-xs focus:outline-none focus:border-brand-coral"
                />
                <button type="submit" className="absolute right-2 top-2 text-brand-dark/50 hover:text-brand-coral">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Service Filter */}
            <div>
              <label className="block text-xs font-semibold text-brand-dark/70 mb-1">Service Type</label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-brand-gold/30 rounded-xl text-xs focus:outline-none focus:border-brand-coral"
              >
                <option value="">All Services</option>
                {servicesList.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Max Salary */}
            <div>
              <label className="block text-xs font-semibold text-brand-dark/70 mb-1">Max Salary (Rs/mo)</label>
              <input
                type="number"
                placeholder="e.g. 10000"
                value={maxSalary}
                onChange={(e) => setMaxSalary(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-brand-gold/30 rounded-xl text-xs focus:outline-none"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-semibold text-brand-dark/70 mb-1">Availability</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-brand-gold/30 rounded-xl text-xs focus:outline-none focus:border-brand-coral"
              >
                <option value="AVAILABLE">Available Now</option>
                <option value="IN_TALKS">In Negotiation</option>
                <option value="">Show All (incl. Appointed)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-brand-coral text-white font-bold rounded-xl text-xs shadow-sm hover:bg-brand-coral/95 transition-all"
            >
              Apply Filter Parameters
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : maids.length === 0 ? (
            <div className="bg-white/50 border border-brand-gold/20 p-12 text-center rounded-2xl text-xs text-brand-dark/65">
              No matching maids found. Try broadening your filter selections.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {maids.map((maid) => (
                <div 
                  key={maid.id} 
                  onClick={() => openMaidDetails(maid)}
                  className="glass-card p-6 rounded-3xl border border-brand-coral/10 hover:border-brand-coral/30 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Photo and Status */}
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={maid.profilePhotoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100'} 
                          alt={maid.fullName} 
                          className="w-14 h-14 rounded-full object-cover border-2 border-brand-gold"
                        />
                        <div>
                          <h3 className="font-display font-bold text-base text-brand-dark">{maid.fullName}</h3>
                          <div className="flex items-center gap-1 text-[10px] text-brand-dark/50 mt-0.5">
                            <MapPin className="w-3 h-3 text-brand-coral" />
                            <span className="truncate max-w-[130px]">{maid.permanentAddress}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        maid.status === 'AVAILABLE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-brand-gold/20 text-brand-dark/80'
                      }`}>
                        {maid.status}
                      </span>
                    </div>

                    {/* Services and Pricing */}
                    <div className="space-y-1 mb-4">
                      <p className="text-[10px] uppercase font-bold text-brand-dark/40 tracking-wider">Services Offered</p>
                      <div className="flex flex-wrap gap-1">
                        {maid.services.slice(0, 3).map(s => (
                          <span key={s.id} className="text-[10px] bg-brand-cream border border-brand-gold/20 px-2 py-0.5 rounded-md text-brand-dark">
                            {s.service.name} (Rs.{s.expectedSalary})
                          </span>
                        ))}
                        {maid.services.length > 3 && (
                          <span className="text-[10px] text-brand-dark/50 px-1 py-0.5">+{maid.services.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-brand-gold/10 flex justify-between items-center text-xs">
                    <span className="text-[10px] text-brand-dark/50">DOB: {new Date(maid.dob).toLocaleDateString()}</span>
                    <span className="text-brand-coral font-bold hover:underline">View details & hire →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Slide-out details and negotiation drawer */}
      <AnimatePresence>
        {drawerOpen && selectedMaid && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-brand-dark z-40"
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 max-w-md w-full bg-brand-cream/95 backdrop-blur-md shadow-2xl z-50 overflow-y-auto border-l border-brand-coral/20 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-brand-gold/20 flex justify-between items-center bg-white/40">
                <h2 className="font-display font-extrabold text-lg text-brand-dark">Helper Application Profile</h2>
                <button 
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 hover:bg-brand-gold/20 rounded-lg transition-colors text-brand-dark/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 space-y-6 flex-1 text-left">
                {/* Maid Base Bio */}
                <div className="flex gap-4 items-center">
                  <img 
                    src={selectedMaid.profilePhotoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'} 
                    alt={selectedMaid.fullName} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-brand-coral shadow-sm"
                  />
                  <div>
                    <h3 className="font-display font-extrabold text-base text-brand-dark">{selectedMaid.fullName}</h3>
                    <p className="text-xs text-brand-dark/60">Gender: {selectedMaid.gender} • Age: {new Date().getFullYear() - new Date(selectedMaid.dob).getFullYear()}</p>
                    <p className="text-xs text-brand-dark/65 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-brand-coral" />
                      <span>{selectedMaid.permanentAddress}</span>
                    </p>
                  </div>
                </div>

                {/* Error/Success banners inside drawer */}
                {actionError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
                    {actionError}
                  </div>
                )}
                {actionSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    <span>{actionSuccess}</span>
                  </div>
                )}

                {/* Services list with detailed rates */}
                <div className="space-y-3 bg-white/50 p-4 rounded-2xl border border-brand-gold/15">
                  <h4 className="font-display font-bold text-xs text-brand-dark flex items-center gap-1.5 uppercase tracking-wider">
                    <Briefcase className="w-4 h-4 text-brand-coral" />
                    Salary Expectations By Service
                  </h4>
                  <div className="divide-y divide-brand-gold/10">
                    {selectedMaid.services.map(s => (
                      <div key={s.id} className="py-2 flex justify-between items-center text-xs">
                        <span className="font-semibold">{s.service.name}</span>
                        <span className="font-bold text-brand-coral">Rs. {s.expectedSalary} / month</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Negotiation Workflow Terminal */}
                {(!user || user.role === 'CLIENT') && (
                  <div className="border-t border-brand-gold/20 pt-6 space-y-4">
                    <h4 className="font-display font-extrabold text-sm text-brand-dark">Contract Initiation Terminal</h4>

                    {!activeThread ? (
                      <div className="space-y-3">
                        <p className="text-[11px] text-brand-dark/65 leading-relaxed">
                          To initiate negotiations and reveal contact details, open a negotiation thread. This will mark the maid's status as <span className="font-bold text-brand-coral">IN_TALKS</span>.
                        </p>
                        <button
                          onClick={handleStartTalks}
                          disabled={threadLoading || selectedMaid.status === 'APPOINTED'}
                          className="w-full py-3 bg-brand-coral text-white font-bold rounded-xl text-xs shadow-md hover:bg-brand-coral/95 transition-all disabled:opacity-50"
                        >
                          {threadLoading ? 'Connecting...' : 'Initiate Negotiation & View Contact'}
                        </button>
                      </div>
                    ) : (
                      // Thread is open! Show contact info & request form
                      <div className="space-y-6">
                        {/* Contact details */}
                        <div className="bg-brand-teal/15 border border-brand-teal/40 p-4 rounded-xl space-y-2">
                          <p className="text-[10px] uppercase font-bold text-brand-dark/50 tracking-wider">Shared Contact Details</p>
                          <div className="flex items-center gap-2 text-xs font-bold">
                            <Smartphone className="w-4 h-4 text-brand-coral" />
                            <span>Mobile Number: {selectedMaid.mobileNumber}</span>
                          </div>
                          {selectedMaid.alternateMobile && (
                            <div className="text-xs text-brand-dark/70 pl-6">
                              Alternate: {selectedMaid.alternateMobile}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-brand-dark/70 mt-1 pl-6">
                            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                            <span>Emergency Contact: {selectedMaid.emergencyContact}</span>
                          </div>
                        </div>

                        {/* Send Offer Form */}
                        <form onSubmit={handleSendOffer} className="space-y-4 bg-white/40 p-4 rounded-xl border border-brand-gold/15">
                          <p className="text-[10px] uppercase font-bold text-brand-dark/50 tracking-wider">Raise Official Employment Offer</p>
                          
                          <div>
                            <label className="block text-[10px] font-semibold text-brand-dark/70 mb-1">Proposed Joining Date *</label>
                            <input
                              type="date"
                              required
                              value={offerForm.joiningDate}
                              onChange={(e) => setOfferForm(prev => ({ ...prev, joiningDate: e.target.value }))}
                              className="w-full px-3 py-2 bg-white border border-brand-gold/30 rounded-lg text-xs focus:outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-semibold text-brand-dark/70 mb-1">Working Hours/Day *</label>
                              <select
                                value={offerForm.workingHours}
                                onChange={(e) => setOfferForm(prev => ({ ...prev, workingHours: e.target.value }))}
                                className="w-full px-3 py-2 bg-white border border-brand-gold/30 rounded-lg text-xs focus:outline-none"
                              >
                                <option value="2">2 hrs (Part-Time)</option>
                                <option value="4">4 hrs</option>
                                <option value="8">8 hrs (Full-Time)</option>
                                <option value="10">10 hrs</option>
                                <option value="12">12 hrs (Live-in)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-brand-dark/70 mb-1">Final Monthly Salary (Rs) *</label>
                              <input
                                type="number"
                                required
                                value={offerForm.finalSalary}
                                onChange={(e) => setOfferForm(prev => ({ ...prev, finalSalary: e.target.value }))}
                                className="w-full px-3 py-2 bg-white border border-brand-gold/30 rounded-lg text-xs focus:outline-none"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={threadLoading}
                            className="w-full py-3 bg-brand-coral text-white font-bold rounded-xl text-xs shadow-md hover:bg-brand-coral/95 transition-all disabled:opacity-50"
                          >
                            {threadLoading ? 'Submitting...' : 'Send Official Employment Offer'}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
