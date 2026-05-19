import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingAPI } from '../services/api';
import { CardSkeleton } from '../components/common/SkeletonLoader';
import { 
  Briefcase, Calendar, Clock, DollarSign, 
  UserCheck, ShieldCheck, RefreshCw, XCircle, 
  CheckCircle, ShieldAlert, FileText, UserPlus
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form state for client re-raising requests inline
  const [expandedThreadId, setExpandedThreadId] = useState(null);
  const [reOfferForm, setReOfferForm] = useState({
    joiningDate: '',
    workingHours: '8',
    finalSalary: ''
  });

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const res = await bookingAPI.getMyBookings();
      setThreads(res.data.threads || []);
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const handleAction = async (apiCall, successText) => {
    setActionLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await apiCall;
      setSuccessMsg(successText);
      await loadDashboardData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Maid responds to request
  const handleMaidResponse = (requestId, action) => {
    const text = action === 'APPROVE' 
      ? 'Offer approved! WAB-ID contract is active.' 
      : 'Offer declined.';
    handleAction(bookingAPI.respondToRequest(requestId, action), text);
  };

  // Client requests contract termination
  const handleRequestTermination = (appointmentId) => {
    handleAction(
      bookingAPI.requestTermination(appointmentId), 
      'Termination requested. Awaiting helper confirmation.'
    );
  };

  // Maid approves termination request
  const handleApproveTermination = (appointmentId) => {
    handleAction(
      bookingAPI.approveTermination(appointmentId), 
      'Termination approved. Helper is now available again.'
    );
  };

  // Client submits a new offer in thread (re-raising after decline)
  const handleReOfferSubmit = async (e, threadId) => {
    e.preventDefault();
    setActionLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await bookingAPI.raiseRequest({
        threadId,
        joiningDate: reOfferForm.joiningDate,
        workingHours: parseInt(reOfferForm.workingHours),
        finalSalary: parseFloat(reOfferForm.finalSalary)
      });
      setSuccessMsg('New offer raised successfully!');
      setExpandedThreadId(null);
      await loadDashboardData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit offer.');
    } finally {
      setActionLoading(false);
    }
  };

  const openReOfferForm = (thread) => {
    setExpandedThreadId(thread.id);
    const lastRequest = thread.requests[0]; // sorted by desc in api
    setReOfferForm({
      joiningDate: lastRequest ? new Date(lastRequest.joiningDate).toISOString().split('T')[0] : '',
      workingHours: String(lastRequest?.workingHours || '8'),
      finalSalary: String(lastRequest?.finalSalary || '')
    });
  };

  if (!user) return <div className="p-8 text-center text-sm">Please log in to access the portal dashboard.</div>;

  const isClient = user.role === 'CLIENT';

  return (
    <div className="max-w-7xl mx-auto my-8 px-4 text-left">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-gold/20 pb-4 mb-8">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-brand-dark">
            {isClient ? 'Client Operations' : 'Helper Portal'}
          </h1>
          <p className="text-xs text-brand-dark/65">
            {isClient 
              ? 'Manage negotiations, appointments, and household assistants.' 
              : 'Respond to employment requests and manage your active contracts.'}
          </p>
        </div>
        <button 
          onClick={loadDashboardData}
          className="p-2 border border-brand-gold/30 hover:bg-brand-gold/10 rounded-xl text-xs flex items-center gap-1.5 font-semibold text-brand-dark"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="p-3 bg-brand-teal/20 border border-brand-teal/40 text-teal-800 rounded-xl text-xs flex items-center gap-2 mb-6">
          <CheckCircle className="w-4 h-4 text-teal-700 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 mb-6">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Active Employments (Appointments) - Left 2 Columns */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="font-display font-bold text-lg text-brand-dark mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-coral" />
                Active Employments & WAB-IDs
              </h2>

              {appointments.filter(a => a.status !== 'TERMINATED').length === 0 ? (
                <div className="bg-white/50 border border-brand-gold/15 p-12 text-center rounded-3xl text-xs text-brand-dark/50 space-y-4">
                  <p>No active employment contracts found.</p>
                  {isClient && (
                    <Link 
                      to="/discovery" 
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-coral text-white font-bold rounded-xl text-xs shadow-sm"
                    >
                      <UserPlus className="w-4 h-4" />
                      Browse Helpers
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.filter(a => a.status !== 'TERMINATED').map((app) => (
                    <div 
                      key={app.id} 
                      className="bg-white border border-brand-gold/25 p-6 rounded-3xl shadow-sm relative overflow-hidden"
                    >
                      {/* Top ribbon for WAB ID */}
                      <div className="bg-brand-coral/10 border-b border-brand-coral/20 px-6 py-2 -mx-6 -mt-6 mb-4 flex justify-between items-center">
                        <span className="text-xs font-extrabold text-brand-coral tracking-wider">
                          WAB CONTRACT: {app.wabId}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          app.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {app.status === 'TERMINATION_PENDING' ? 'Termination Requested' : 'Active'}
                        </span>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={isClient ? (app.maid.profilePhotoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100') : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'} 
                            alt="Avatar" 
                            className="w-10 h-10 rounded-full object-cover border"
                          />
                          <div>
                            <p className="text-[10px] text-brand-dark/40 font-bold uppercase">
                              {isClient ? 'Helper Staff' : 'Client Customer'}
                            </p>
                            <p className="text-xs font-bold text-brand-dark">
                              {isClient ? app.maid.fullName : app.client.fullName}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-brand-dark/75">
                            <Calendar className="w-3.5 h-3.5 text-brand-coral" />
                            <span>Joins: {new Date(app.joiningDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-brand-dark/75">
                            <Clock className="w-3.5 h-3.5 text-brand-coral" />
                            <span>Hours: {app.workingHours} hrs/day</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-brand-dark">
                            <DollarSign className="w-3.5 h-3.5 text-brand-coral" />
                            <span>Rs. {app.salary} / month</span>
                          </div>
                          <div className="text-[10px] text-brand-dark/50">
                            {isClient ? `Helper Mobile: ${app.maid.mobileNumber}` : `Client Mobile: ${app.client.mobileNumber}`}
                          </div>
                        </div>
                      </div>

                      {/* Verification Alert Note (Client side only) */}
                      {isClient && app.status === 'ACTIVE' && (
                        <div className="p-3 bg-brand-gold/15 border border-brand-gold/30 rounded-2xl text-[10px] text-brand-dark/75 leading-relaxed mb-4">
                          <span className="font-bold text-brand-dark">Mandatory safety check:</span> Please match WAB-ID <span className="font-bold text-brand-coral">{app.wabId}</span> with the helper's details during their arrival. Do not allow access if the ID does not match.
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="pt-4 border-t border-brand-gold/10 flex justify-end">
                        {isClient && app.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleRequestTermination(app.id)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-colors"
                          >
                            Request Employment Termination
                          </button>
                        )}

                        {isClient && app.status === 'TERMINATION_PENDING' && (
                          <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-3.5 py-1.5 rounded-xl">
                            Awaiting helper's confirmation to terminate contract
                          </span>
                        )}

                        {!isClient && app.status === 'TERMINATION_PENDING' && (
                          <button
                            onClick={() => handleApproveTermination(app.id)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                          >
                            Approve & Confirm Contract Termination
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Employment History (Terminated Contracts) */}
            {appointments.some(a => a.status === 'TERMINATED') && (
              <div>
                <h3 className="font-display font-bold text-sm text-brand-dark/60 mb-3 uppercase tracking-wider">
                  Contract History
                </h3>
                <div className="bg-white/50 border border-brand-gold/15 rounded-2xl divide-y divide-brand-gold/10">
                  {appointments.filter(a => a.status === 'TERMINATED').map(app => (
                    <div key={app.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                      <div>
                        <span className="font-bold text-brand-dark/50">{app.wabId}</span> •{' '}
                        <span className="font-bold">{isClient ? app.maid.fullName : app.client.fullName}</span>
                      </div>
                      <div className="text-[10px] text-brand-dark/50 text-right">
                        <div>Terminated: {new Date(app.lastWorkingDay).toLocaleDateString()}</div>
                        <div>Monthly Salary was: Rs. {app.salary}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Negotiation threads - Right Column */}
          <div className="space-y-6">
            <h2 className="font-display font-bold text-lg text-brand-dark flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-brand-coral" />
              Negotiations
            </h2>

            {threads.length === 0 ? (
              <div className="bg-white/50 border border-brand-gold/15 p-8 text-center rounded-3xl text-xs text-brand-dark/50">
                No active discussions open.
              </div>
            ) : (
              <div className="space-y-4">
                {threads.map((thread) => {
                  const declineCount = thread.requests.filter(r => r.status === 'DECLINED').length;
                  const latestRequest = thread.requests[0]; // sorted desc in API
                  const isClosed = thread.status === 'CLOSED';

                  return (
                    <div 
                      key={thread.id} 
                      className={`bg-white border p-5 rounded-3xl shadow-sm space-y-4 text-left ${
                        isClosed ? 'border-brand-gold/10 opacity-70' : 'border-brand-coral/15'
                      }`}
                    >
                      {/* Thread Header */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={isClient ? (thread.maid.profilePhotoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80') : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80'} 
                            alt="Avatar" 
                            className="w-8 h-8 rounded-full object-cover border"
                          />
                          <div>
                            <h4 className="font-bold text-xs text-brand-dark">
                              {isClient ? thread.maid.fullName : thread.client.fullName}
                            </h4>
                            <p className="text-[9px] text-brand-dark/50">
                              {isClient ? `Mobile: ${thread.maid.mobileNumber}` : `Mobile: ${thread.client.mobileNumber}`}
                            </p>
                          </div>
                        </div>

                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isClosed 
                            ? 'bg-brand-dark/10 text-brand-dark/60' 
                            : 'bg-brand-coral/10 text-brand-coral'
                        }`}>
                          {thread.status}
                        </span>
                      </div>

                      {/* Request Details log */}
                      {latestRequest ? (
                        <div className="p-3 bg-brand-cream/35 border border-brand-gold/10 rounded-2xl space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-brand-dark/50 uppercase font-bold tracking-wider">Latest Offer</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              latestRequest.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : latestRequest.status === 'APPROVED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-50 text-red-800'
                            }`}>
                              {latestRequest.status}
                            </span>
                          </div>
                          <div className="text-xs space-y-1">
                            <p className="font-bold">Rs. {latestRequest.finalSalary} / month</p>
                            <p className="text-brand-dark/70">Hours: {latestRequest.workingHours} hrs/day • Joins: {new Date(latestRequest.joiningDate).toLocaleDateString()}</p>
                          </div>

                          {/* Decline indicator */}
                          {declineCount > 0 && (
                            <div className="text-[10px] text-brand-coral font-semibold flex items-center gap-1 border-t border-brand-gold/10 pt-1.5 mt-1.5">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Decline count in thread: {declineCount} / 3</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] text-brand-dark/50 italic text-center py-2 bg-brand-cream/15 rounded-xl border border-dashed border-brand-gold/20">
                          {isClient ? 'No offer raised yet. Send an offer to start.' : 'Awaiting client offer.'}
                        </div>
                      )}

                      {/* Interactive Buttons per thread */}
                      {!isClosed && (
                        <div className="pt-2 border-t border-brand-gold/10">
                          {/* CLIENT ACTIONS */}
                          {isClient && (
                            <>
                              {(!latestRequest || latestRequest.status === 'DECLINED') && declineCount < 3 && (
                                <>
                                  {expandedThreadId === thread.id ? (
                                    /* Inline re-offer form */
                                    <form onSubmit={(e) => handleReOfferSubmit(e, thread.id)} className="space-y-3 pt-2 text-xs">
                                      <div>
                                        <label className="block text-[9px] font-bold text-brand-dark/65 mb-1">New Joining Date</label>
                                        <input
                                          type="date"
                                          required
                                          value={reOfferForm.joiningDate}
                                          onChange={(e) => setReOfferForm(prev => ({ ...prev, joiningDate: e.target.value }))}
                                          className="w-full px-2.5 py-1.5 border border-brand-gold/30 rounded-lg text-xs"
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-[9px] font-bold text-brand-dark/65 mb-1">Hours/Day</label>
                                          <select
                                            value={reOfferForm.workingHours}
                                            onChange={(e) => setReOfferForm(prev => ({ ...prev, workingHours: e.target.value }))}
                                            className="w-full px-2.5 py-1.5 border border-brand-gold/30 rounded-lg text-xs bg-white"
                                          >
                                            <option value="2">2 hrs</option>
                                            <option value="4">4 hrs</option>
                                            <option value="8">8 hrs</option>
                                            <option value="12">12 hrs</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="block text-[9px] font-bold text-brand-dark/65 mb-1">Salary Offer (Rs)</label>
                                          <input
                                            type="number"
                                            required
                                            value={reOfferForm.finalSalary}
                                            onChange={(e) => setReOfferForm(prev => ({ ...prev, finalSalary: e.target.value }))}
                                            className="w-full px-2.5 py-1.5 border border-brand-gold/30 rounded-lg text-xs"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          type="submit"
                                          disabled={actionLoading}
                                          className="flex-1 py-1.5 bg-brand-coral text-white font-bold rounded-lg text-xs shadow-sm transition-colors"
                                        >
                                          Submit Offer
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setExpandedThreadId(null)}
                                          className="px-2.5 py-1.5 border border-brand-gold/30 rounded-lg text-xs"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </form>
                                  ) : (
                                    <button
                                      onClick={() => openReOfferForm(thread)}
                                      className="w-full py-2 bg-brand-coral hover:bg-brand-coral/95 text-white font-bold rounded-xl text-xs shadow-sm transition-colors text-center"
                                    >
                                      {declineCount > 0 ? 'Modify & Resubmit Offer' : 'Submit Initial Offer'}
                                    </button>
                                  )}
                                </>
                              )}

                              {latestRequest?.status === 'PENDING' && (
                                <span className="text-[10px] font-semibold text-brand-dark/50 block text-center bg-brand-cream/20 py-2 border border-brand-gold/10 rounded-xl">
                                  Awaiting maid's response...
                                </span>
                              )}
                            </>
                          )}

                          {/* MAID ACTIONS */}
                          {!isClient && latestRequest?.status === 'PENDING' && (
                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => handleMaidResponse(latestRequest.id, 'APPROVE')}
                                disabled={actionLoading}
                                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center justify-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleMaidResponse(latestRequest.id, 'DECLINE')}
                                disabled={actionLoading}
                                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center justify-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
