import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import { adminAPI } from '../../services/api';
import { 
  Users, Calendar, Clock, ArrowRightLeft, 
  ShieldAlert, RefreshCw, FileText, AlertTriangle 
} from 'lucide-react';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    clientsCount: 0,
    maidsCount: 0,
    activeAppointments: 0,
    pendingRequests: 0
  });
  const [maidsAnalytics, setMaidsAnalytics] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await adminAPI.getAnalytics();
      setMetrics(res.data.metrics || {});
      setMaidsAnalytics(res.data.maidsAnalytics || []);
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
  }, []);

  // Setup dynamic polling background synchronizations every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchDashboardData(false);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-left">
      <Sidebar />
      
      {/* Main Admin Content */}
      <main className="flex-1 p-6 md:p-8 bg-brand-light-gray space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-brand-gold/20 pb-4">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-brand-dark">Administrative Dashboard</h1>
            <p className="text-xs text-brand-dark/65">E2E system monitoring, user metrics, and operational control.</p>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="p-2 border border-brand-gold/30 hover:bg-brand-gold/15 rounded-xl text-xs flex items-center gap-1.5 font-semibold text-brand-dark bg-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Data
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs">Loading admin statistics...</div>
        ) : (
          <>
            {/* Analytics Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Registered Clients', val: metrics.clientsCount, icon: Users, color: 'bg-brand-teal/20' },
                { title: 'Registered Maids', val: metrics.maidsCount, icon: Users, color: 'bg-brand-gold/30' },
                { title: 'Active Appointments', val: metrics.activeAppointments, icon: Calendar, color: 'bg-brand-coral/10' },
                { title: 'Pending Negotiations', val: metrics.pendingRequests, icon: ArrowRightLeft, color: 'bg-white' }
              ].map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div key={idx} className="bg-white border border-brand-gold/15 p-6 rounded-3xl shadow-sm flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${card.color}`}>
                      <Icon className="w-6 h-6 text-brand-dark" />
                    </div>
                    <div>
                      <p className="text-[10px] text-brand-dark/40 font-bold uppercase tracking-wider">{card.title}</p>
                      <h3 className="font-display font-extrabold text-2xl text-brand-dark mt-0.5">{card.val}</h3>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Dec-Factor Analytics Table (Left 2 columns) */}
              <div className="lg:col-span-2 bg-white border border-brand-gold/15 p-6 rounded-3xl shadow-sm space-y-4">
                <div>
                  <h3 className="font-display font-bold text-base text-brand-dark">Declination-Factor Analytics</h3>
                  <p className="text-[10px] text-brand-dark/65">Ratio of decline requests to negotiation threads. Red highlighting indicates ratio exceeding 2.5.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-brand-gold/20 text-brand-dark/50 font-bold">
                        <th className="py-2.5">Maid Name</th>
                        <th className="py-2.5">Total Threads</th>
                        <th className="py-2.5">Total Declines</th>
                        <th className="py-2.5 text-right">Dec-Factor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-gold/10">
                      {maidsAnalytics.map((maid) => (
                        <tr 
                          key={maid.id} 
                          className={`hover:bg-brand-gold/5 ${maid.highlightRed ? 'bg-red-50 text-red-900 font-semibold' : ''}`}
                        >
                          <td className="py-3 flex items-center gap-2">
                            <img 
                              src={maid.profilePhotoUrl} 
                              alt="" 
                              className="w-7 h-7 rounded-full object-cover border"
                            />
                            <span>{maid.fullName}</span>
                          </td>
                          <td className="py-3">{maid.threadsCount} threads</td>
                          <td className="py-3">{maid.totalDeclined} declines</td>
                          <td className="py-3 text-right">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              maid.highlightRed 
                                ? 'bg-red-600 text-white shadow-sm' 
                                : 'bg-brand-cream border border-brand-gold/20 text-brand-dark'
                            }`}>
                              {maid.highlightRed && <AlertTriangle className="w-3 h-3" />}
                              {maid.decFactor}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Administrative Logs (Right Column) */}
              <div className="bg-white border border-brand-gold/15 p-6 rounded-3xl shadow-sm space-y-4">
                <div>
                  <h3 className="font-display font-bold text-base text-brand-dark">Audit Logs</h3>
                  <p className="text-[10px] text-brand-dark/65">Historical log of actions performed by administrators.</p>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {logs.length === 0 ? (
                    <div className="text-center py-6 text-brand-dark/40 italic">No logs recorded yet</div>
                  ) : (
                    logs.map(log => (
                      <div key={log.id} className="p-3 bg-brand-cream/35 border border-brand-gold/10 rounded-2xl text-[10px] space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-brand-coral">{log.action}</span>
                          <span className="text-[9px] text-brand-dark/40">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-brand-dark/80 font-sans leading-normal">{log.details}</p>
                        <span className="text-[9px] text-brand-dark/40 block">Actor ID: {log.userId.slice(0, 8)}...</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
