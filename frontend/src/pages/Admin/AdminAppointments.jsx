import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { adminAPI } from '../../services/api';
import { 
  Calendar, ShieldAlert, CheckCircle2, XCircle, 
  Search, ChevronDown, ChevronUp, SlidersHorizontal, 
  MapPin, Phone, Mail, CreditCard, Clock, Activity, 
  Info, Sparkles, User
} from 'lucide-react';

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Action state
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Expand states
  const [expandedAppIds, setExpandedAppIds] = useState(new Set());

  // Search & Filter state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    generalQuery: '',
    wabId: '',
    clientName: '',
    maidName: '',
    status: '',
    date: '',
    serviceType: '',
    paymentStatus: '',
    contact: '',
    email: '',
    location: ''
  });

  const fetchAppointments = async () => {
    try {
      const res = await adminAPI.getBookings();
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const initFetch = async () => {
      setLoading(true);
      await fetchAppointments();
      setLoading(false);
    };
    initFetch();
  }, []);

  // background polling (every 8 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchAppointments();
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleCancelAppointment = async (appointmentId, wabId) => {
    if (!window.confirm(`Are you sure you want to FORCE CANCEL appointment ${wabId}? This will instantly sever the contract and set the helper's status to AVAILABLE.`)) {
      return;
    }

    setSuccess('');
    setError('');
    setActionLoading(true);

    try {
      await adminAPI.cancelAppointment(appointmentId);
      setSuccess(`Appointment ${wabId} forced cancelled successfully.`);
      await fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleExpand = (id) => {
    const next = new Set(expandedAppIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedAppIds(next);
  };

  const handleFilterChange = (field, val) => {
    setFilters(prev => ({ ...prev, [field]: val }));
  };

  const resetFilters = () => {
    setFilters({
      generalQuery: '',
      wabId: '',
      clientName: '',
      maidName: '',
      status: '',
      date: '',
      serviceType: '',
      paymentStatus: '',
      contact: '',
      email: '',
      location: ''
    });
  };

  // Real-time local filtering (multi-criteria + partial match support)
  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      // 1. General search (matches WAB-ID, Client Name, Maid Name)
      if (filters.generalQuery) {
        const query = filters.generalQuery.toLowerCase();
        const matchesGeneral = 
          app.wabId.toLowerCase().includes(query) ||
          app.client.fullName.toLowerCase().includes(query) ||
          app.maid.fullName.toLowerCase().includes(query);
        if (!matchesGeneral) return false;
      }

      // 2. WAB-ID filter
      if (filters.wabId && !app.wabId.toLowerCase().includes(filters.wabId.toLowerCase())) {
        return false;
      }

      // 3. Client Name filter
      if (filters.clientName && !app.client.fullName.toLowerCase().includes(filters.clientName.toLowerCase())) {
        return false;
      }

      // 4. Maid Name filter
      if (filters.maidName && !app.maid.fullName.toLowerCase().includes(filters.maidName.toLowerCase())) {
        return false;
      }

      // 5. Status filter
      if (filters.status && app.status !== filters.status) {
        return false;
      }

      // 6. Date filter (joiningDate comparison)
      if (filters.date) {
        const appDate = new Date(app.joiningDate).toISOString().split('T')[0];
        if (appDate !== filters.date) return false;
      }

      // 7. Service Type filter (checks if maid offers this service)
      if (filters.serviceType) {
        const hasService = app.maid.services?.some(s => 
          s.service.name.toLowerCase().includes(filters.serviceType.toLowerCase())
        );
        if (!hasService) return false;
      }

      // 8. Payment Status (Derived logic: ACTIVE status maps to PAID, TERMINATED status to REFUNDED/CLOSED)
      if (filters.paymentStatus) {
        const derivedPayment = app.status === 'ACTIVE' ? 'PAID' : 'CLOSED';
        if (derivedPayment !== filters.paymentStatus) return false;
      }

      // 9. Contact Number (matches client or maid primary phone)
      if (filters.contact) {
        const query = filters.contact;
        const matchesContact = 
          app.client.mobileNumber.includes(query) ||
          app.maid.mobileNumber.includes(query);
        if (!matchesContact) return false;
      }

      // 10. Email (matches client email)
      if (filters.email) {
        const appEmail = app.client.email || '';
        if (!appEmail.toLowerCase().includes(filters.email.toLowerCase())) {
          return false;
        }
      }

      // 11. Location (matches client address)
      if (filters.location) {
        const appAddress = app.client.address || '';
        if (!appAddress.toLowerCase().includes(filters.location.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, filters]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-left">
      <Sidebar />

      {/* Main Admin Content */}
      <main className="flex-1 p-6 md:p-8 bg-brand-light-gray space-y-6 relative">
        {/* Header */}
        <div className="border-b border-brand-gold/20 pb-4">
          <h1 className="font-display font-extrabold text-2xl text-brand-dark">System Appointments Logs</h1>
          <p className="text-xs text-brand-dark/65">Audit employment contracts, track active WAB-IDs, and resolve contract issues.</p>
        </div>

        {success && (
          <div className="p-3 bg-brand-teal/20 border border-brand-teal/40 text-teal-800 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters Controls Card */}
        <div className="bg-white border border-brand-gold/15 p-4 rounded-2xl shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row justify-between gap-3 items-center">
            {/* Quick General Search */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-dark/40" />
              <input
                type="text"
                placeholder="Search WAB-ID, Client, or Helper..."
                value={filters.generalQuery}
                onChange={(e) => handleFilterChange('generalQuery', e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-brand-cream/15 border border-brand-gold/30 rounded-xl text-xs focus:outline-none focus:border-brand-coral"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  showAdvancedFilters 
                    ? 'bg-brand-coral text-white' 
                    : 'bg-brand-cream text-brand-dark hover:bg-brand-gold/20'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Advanced Filters
              </button>
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-xs font-bold text-brand-dark/60 hover:text-brand-dark hover:bg-brand-cream rounded-xl transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Advanced Multi-Field Filters Grid */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-3 border-t border-brand-gold/10 animate-fadeIn">
              {/* WAB-ID */}
              <div>
                <label className="block text-[10px] font-bold text-brand-dark/70 mb-1">WAB-ID</label>
                <input
                  type="text"
                  placeholder="e.g. WAB-1234"
                  value={filters.wabId}
                  onChange={(e) => handleFilterChange('wabId', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-brand-cream/10 border border-brand-gold/25 rounded-lg text-[11px] focus:outline-none focus:border-brand-coral"
                />
              </div>

              {/* Client Name */}
              <div>
                <label className="block text-[10px] font-bold text-brand-dark/70 mb-1">Client Name</label>
                <input
                  type="text"
                  placeholder="Client name..."
                  value={filters.clientName}
                  onChange={(e) => handleFilterChange('clientName', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-brand-cream/10 border border-brand-gold/25 rounded-lg text-[11px] focus:outline-none focus:border-brand-coral"
                />
              </div>

              {/* Maid Name */}
              <div>
                <label className="block text-[10px] font-bold text-brand-dark/70 mb-1">Helper Name</label>
                <input
                  type="text"
                  placeholder="Helper name..."
                  value={filters.maidName}
                  onChange={(e) => handleFilterChange('maidName', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-brand-cream/10 border border-brand-gold/25 rounded-lg text-[11px] focus:outline-none focus:border-brand-coral"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-bold text-brand-dark/70 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-brand-cream/10 border border-brand-gold/25 rounded-lg text-[11px] focus:outline-none focus:border-brand-coral"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="TERMINATION_PENDING">TERMINATION PENDING</option>
                  <option value="TERMINATED">TERMINATED</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] font-bold text-brand-dark/70 mb-1">Joining Date</label>
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-brand-cream/10 border border-brand-gold/25 rounded-lg text-[11px] focus:outline-none focus:border-brand-coral"
                />
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-[10px] font-bold text-brand-dark/70 mb-1">Service Type</label>
                <input
                  type="text"
                  placeholder="e.g. Cooking"
                  value={filters.serviceType}
                  onChange={(e) => handleFilterChange('serviceType', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-brand-cream/10 border border-brand-gold/25 rounded-lg text-[11px] focus:outline-none focus:border-brand-coral"
                />
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-[10px] font-bold text-brand-dark/70 mb-1">Payment Status</label>
                <select
                  value={filters.paymentStatus}
                  onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-brand-cream/10 border border-brand-gold/25 rounded-lg text-[11px] focus:outline-none focus:border-brand-coral"
                >
                  <option value="">All Payments</option>
                  <option value="PAID">PAID</option>
                  <option value="CLOSED">CLOSED / REFUNDED</option>
                </select>
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-[10px] font-bold text-brand-dark/70 mb-1">Contact Number</label>
                <input
                  type="text"
                  placeholder="Client / Helper Tel..."
                  value={filters.contact}
                  onChange={(e) => handleFilterChange('contact', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-brand-cream/10 border border-brand-gold/25 rounded-lg text-[11px] focus:outline-none focus:border-brand-coral"
                />
              </div>

              {/* Email */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-brand-dark/70 mb-1">Client Email</label>
                <input
                  type="text"
                  placeholder="Email ID..."
                  value={filters.email}
                  onChange={(e) => handleFilterChange('email', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-brand-cream/10 border border-brand-gold/25 rounded-lg text-[11px] focus:outline-none focus:border-brand-coral"
                />
              </div>

              {/* Location */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-brand-dark/70 mb-1">Location Address</label>
                <input
                  type="text"
                  placeholder="Client home address details..."
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-brand-cream/10 border border-brand-gold/25 rounded-lg text-[11px] focus:outline-none focus:border-brand-coral"
                />
              </div>
            </div>
          )}
        </div>

        {/* Appointments Table Grid */}
        <div className="bg-white border border-brand-gold/15 rounded-3xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-xs">Loading appointments...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-12 text-center text-xs text-brand-dark/40 italic">No appointments match search filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-brand-cream/35 border-b border-brand-gold/25 text-brand-dark/65 font-bold">
                    <th className="w-8"></th>
                    <th className="px-6 py-3">WAB-ID</th>
                    <th className="px-6 py-3">Client Customer</th>
                    <th className="px-6 py-3">Helper Maid</th>
                    <th className="px-6 py-3">Joining Date</th>
                    <th className="px-6 py-3">Salary & Hours</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-gold/10">
                  {filteredAppointments.map(app => {
                    const isExpanded = expandedAppIds.has(app.id);
                    return (
                      <React.Fragment key={app.id}>
                        {/* Summary Header Row */}
                        <tr 
                          onClick={() => toggleExpand(app.id)}
                          className="hover:bg-brand-gold/5 cursor-pointer transition-colors"
                        >
                          <td className="pl-4 py-4 text-center">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-brand-dark/40" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-brand-dark/40" />
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold text-brand-coral font-mono">
                            {app.wabId}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-brand-dark">{app.client.fullName}</div>
                            <div className="text-[9px] text-brand-dark/40">Tel: {app.client.mobileNumber}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-brand-dark">{app.maid.fullName}</div>
                            <div className="text-[9px] text-brand-dark/40">Tel: {app.maid.mobileNumber}</div>
                          </td>
                          <td className="px-6 py-4">
                            {new Date(app.joiningDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div>Rs. {app.salary} / mo</div>
                            <div className="text-[9px] text-brand-dark/40">{app.workingHours} hrs/day</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                              app.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-700'
                                : app.status === 'TERMINATION_PENDING'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-brand-dark/10 text-brand-dark/60'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            {app.status !== 'TERMINATED' && (
                              <button
                                onClick={() => handleCancelAppointment(app.id, app.wabId)}
                                disabled={actionLoading}
                                className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors inline-block"
                                title="Force Sever Contract"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            {app.status === 'TERMINATED' && (
                              <span className="text-[9px] text-brand-dark/40 font-mono">
                                Terminated: {new Date(app.lastWorkingDay).toLocaleDateString()}
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* Accordion Detailed Row */}
                        {isExpanded && (
                          <tr className="bg-brand-cream/10">
                            <td colSpan="8" className="p-6 border-b border-brand-gold/15">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-brand-dark leading-relaxed animate-fadeIn">
                                
                                {/* Column 1: Client details & address */}
                                <div className="space-y-3 bg-white p-4.5 rounded-2xl border border-brand-gold/15">
                                  <h4 className="font-display font-extrabold text-[11px] text-brand-coral uppercase tracking-wider flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" />
                                    Client Profile
                                  </h4>
                                  <div className="space-y-2">
                                    <p className="font-bold text-sm">{app.client.fullName}</p>
                                    <div className="flex items-center gap-2 text-brand-dark/80">
                                      <Phone className="w-3.5 h-3.5 text-brand-coral shrink-0" />
                                      <span>{app.client.mobileNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-brand-dark/80">
                                      <Mail className="w-3.5 h-3.5 text-brand-coral shrink-0" />
                                      <span className="truncate">{app.client.email || 'No email registered'}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-brand-dark/80 pt-1 border-t border-brand-gold/10">
                                      <MapPin className="w-3.5 h-3.5 text-brand-coral shrink-0 mt-0.5" />
                                      <span className="leading-relaxed font-sans">{app.client.address}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Column 2: Helper Details */}
                                <div className="space-y-3 bg-white p-4.5 rounded-2xl border border-brand-gold/15">
                                  <h4 className="font-display font-extrabold text-[11px] text-brand-coral uppercase tracking-wider flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5" />
                                    Helper Maid details
                                  </h4>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2.5">
                                      <img 
                                        src={app.maid.profilePhotoUrl} 
                                        alt="" 
                                        className="w-8 h-8 rounded-full object-cover border"
                                      />
                                      <div>
                                        <p className="font-bold">{app.maid.fullName}</p>
                                        <p className="text-[9px] text-brand-dark/50">Primary: {app.maid.mobileNumber}</p>
                                      </div>
                                    </div>
                                    <div className="text-[10px] text-brand-dark/80 space-y-1 pt-1 border-t border-brand-gold/10 font-sans">
                                      <p><strong>Emergency Contact:</strong> {app.maid.emergencyContact}</p>
                                      {app.maid.alternateMobile && <p><strong>Alt Mobile:</strong> {app.maid.alternateMobile}</p>}
                                      <p className="truncate"><strong>Permanent Addr:</strong> {app.maid.permanentAddress}</p>
                                      <p className="mt-1 flex flex-wrap gap-1">
                                        <strong>Offered Services:</strong>
                                        {app.maid.services?.map(s => (
                                          <span key={s.id} className="bg-brand-cream border px-1 rounded text-[8px] font-bold">
                                            {s.service.name}
                                          </span>
                                        ))}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Column 3: Employment, Payment & Timeline */}
                                <div className="space-y-3 bg-white p-4.5 rounded-2xl border border-brand-gold/15">
                                  <h4 className="font-display font-extrabold text-[11px] text-brand-coral uppercase tracking-wider flex items-center gap-1.5">
                                    <CreditCard className="w-3.5 h-3.5" />
                                    Employment & Payments
                                  </h4>
                                  <div className="space-y-2 text-[10px]">
                                    <div className="flex justify-between items-center bg-brand-cream/30 p-2 rounded-xl border border-brand-gold/10">
                                      <span className="font-bold">Monthly Salary</span>
                                      <span className="font-bold text-sm text-brand-coral">Rs. {app.salary}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[9px] text-brand-dark/70 font-sans">
                                      <div>
                                        <strong>Working Hours:</strong>
                                        <p className="font-bold text-[10px] text-brand-dark">{app.workingHours} hrs / day</p>
                                      </div>
                                      <div>
                                        <strong>Billing Cycle:</strong>
                                        <p className="font-bold text-[10px] text-brand-dark">Monthly Postpaid</p>
                                      </div>
                                      <div>
                                        <strong>Payment Status:</strong>
                                        <p className="font-bold text-[10px] text-teal-700">{app.status === 'ACTIVE' ? 'PAID (Auto)' : 'CLOSED'}</p>
                                      </div>
                                      <div>
                                        <strong>Agreement Type:</strong>
                                        <p className="font-bold text-[10px] text-brand-dark">Standard Help</p>
                                      </div>
                                    </div>

                                    {/* Timeline */}
                                    <div className="pt-2 border-t border-brand-gold/10 space-y-1">
                                      <p className="text-[9px] font-bold text-brand-dark/50 uppercase tracking-widest flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-brand-coral" /> Timeline History
                                      </p>
                                      <ul className="text-[9px] space-y-1 text-brand-dark/80 font-mono">
                                        <li>• Created Log: {new Date(app.createdAt).toLocaleString()}</li>
                                        <li>• Joining Date: {new Date(app.joiningDate).toLocaleDateString()}</li>
                                        {app.status === 'TERMINATED' && (
                                          <li className="text-red-600 font-bold">• Severed: {new Date(app.lastWorkingDay).toLocaleDateString()}</li>
                                        )}
                                      </ul>
                                    </div>
                                  </div>
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
