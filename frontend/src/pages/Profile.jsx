import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileAPI, discoveryAPI } from '../services/api';
import { User, Smartphone, MapPin, Award, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const [servicesList, setServicesList] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Client State
  const [clientData, setClientData] = useState({
    fullName: '',
    gender: 'Female',
    dob: '',
    address: '',
    maritalStatus: 'Single',
    mobileNumber: '',
    email: ''
  });

  // Maid State
  const [maidData, setMaidData] = useState({
    fullName: '',
    gender: 'Female',
    dob: '',
    permanentAddress: '',
    mobileNumber: '',
    alternateMobile: '',
    emergencyContact: '',
    profilePhotoUrl: ''
  });

  // Chosen services state for Maid
  // Format: { [serviceId]: { checked: boolean, salary: string } }
  const [chosenServices, setChosenServices] = useState({});

  useEffect(() => {
    // Fetch services list
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
    if (!user) return;

    if (user.role === 'CLIENT' && user.clientProfile) {
      const p = user.clientProfile;
      setClientData({
        fullName: p.fullName || '',
        gender: p.gender || 'Female',
        dob: p.dob ? new Date(p.dob).toISOString().split('T')[0] : '',
        address: p.address || '',
        maritalStatus: p.maritalStatus || 'Single',
        mobileNumber: p.mobileNumber || user.phone || '',
        email: p.email || user.email || ''
      });
    } else if (user.role === 'CLIENT') {
      // Auto-populate from Firebase Auth
      setClientData(prev => ({
        ...prev,
        mobileNumber: user.phone || '',
        email: user.email || ''
      }));
    }

    if (user.role === 'MAID' && user.maidProfile) {
      const p = user.maidProfile;
      setMaidData({
        fullName: p.fullName || '',
        gender: p.gender || 'Female',
        dob: p.dob ? new Date(p.dob).toISOString().split('T')[0] : '',
        permanentAddress: p.permanentAddress || '',
        mobileNumber: p.mobileNumber || user.phone || '',
        alternateMobile: p.alternateMobile || '',
        emergencyContact: p.emergencyContact || '',
        profilePhotoUrl: p.profilePhotoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
      });

      // Populate services offered
      const servicesMap = {};
      if (Array.isArray(p.services)) {
        p.services.forEach(s => {
          servicesMap[s.serviceId] = {
            checked: true,
            salary: String(s.expectedSalary)
          };
        });
      }
      setChosenServices(servicesMap);
    } else if (user.role === 'MAID') {
      setMaidData(prev => ({
        ...prev,
        mobileNumber: user.phone || '',
        profilePhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
      }));
    }
  }, [user]);

  // Calculations for profile completion percentage
  const calculateCompletion = () => {
    if (!user) return 0;
    if (user.role === 'CLIENT') {
      const fields = [clientData.fullName, clientData.dob, clientData.address, clientData.mobileNumber];
      const completed = fields.filter(f => !!f).length;
      return Math.round((completed / fields.length) * 100);
    } else {
      const fields = [maidData.fullName, maidData.dob, maidData.permanentAddress, maidData.mobileNumber, maidData.emergencyContact, maidData.profilePhotoUrl];
      const completedFields = fields.filter(f => !!f).length;
      
      const hasServices = Object.values(chosenServices).some(s => s.checked && parseFloat(s.salary) > 0);
      const totalSteps = fields.length + 1;
      const completedSteps = completedFields + (hasServices ? 1 : 0);
      
      return Math.round((completedSteps / totalSteps) * 100);
    }
  };

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);
    try {
      await profileAPI.upsertClient(clientData);
      setSuccess('Profile updated successfully!');
      await refreshProfile();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleMaidSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);

    // Format selected services
    const servicesPayload = Object.keys(chosenServices)
      .filter(id => chosenServices[id].checked)
      .map(id => ({
        serviceId: id,
        expectedSalary: parseFloat(chosenServices[id].salary || 0)
      }));

    if (servicesPayload.length === 0) {
      setLoading(false);
      return setError('Please select and set salary for at least one service offered.');
    }

    try {
      const payload = {
        ...maidData,
        services: servicesPayload
      };
      await profileAPI.upsertMaid(payload);
      setSuccess('Maid profile updated successfully!');
      await refreshProfile();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceCheckboxChange = (serviceId) => {
    setChosenServices(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        checked: !prev[serviceId]?.checked
      }
    }));
  };

  const handleServiceSalaryChange = (serviceId, salary) => {
    setChosenServices(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        salary
      }
    }));
  };

  if (!user) return <div className="p-8 text-center text-sm">Please log in to view profile details.</div>;

  const completionPercent = calculateCompletion();

  return (
    <div className="max-w-4xl mx-auto my-12 px-4 text-left">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Completion Card */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-md border border-brand-coral/10 text-center space-y-4">
            <h3 className="font-display font-bold text-lg text-brand-dark">Profile Completion</h3>
            
            {/* Progress Circular Ring */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="48" className="stroke-brand-gold/20 fill-none" strokeWidth="8" />
                <circle 
                  cx="56" 
                  cy="56" 
                  r="48" 
                  className="stroke-brand-coral fill-none transition-all duration-500" 
                  strokeWidth="8" 
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - completionPercent / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xl font-extrabold text-brand-dark">{completionPercent}%</span>
            </div>

            <p className="text-[11px] text-brand-dark/60 leading-relaxed px-4">
              Complete your profile details to unlock helper discovery, service listings, and booking request functionalities.
            </p>
          </div>
        </div>

        {/* Right Side: Profile Forms */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-md border border-brand-coral/10 space-y-6">
            <div className="border-b border-brand-gold/20 pb-4 flex justify-between items-center">
              <div>
                <h2 className="font-display font-extrabold text-xl text-brand-dark">Personal Information</h2>
                <p className="text-[11px] text-brand-dark/60">Update details connected with your WAB credentials.</p>
              </div>
              <span className="text-xs font-bold text-brand-coral uppercase tracking-widest px-2.5 py-1 bg-brand-coral/10 rounded-full">
                {user.role}
              </span>
            </div>

            {success && (
              <div className="p-3 bg-brand-teal/20 border border-brand-teal/40 text-teal-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* CLIENT PROFILE FORM */}
            {user.role === 'CLIENT' && (
              <form onSubmit={handleClientSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={clientData.fullName}
                      onChange={(e) => setClientData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-brand-cream/25 border border-brand-gold/30 rounded-xl text-sm focus:outline-none focus:border-brand-coral transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Gender *</label>
                    <select
                      value={clientData.gender}
                      onChange={(e) => setClientData(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-brand-cream/25 border border-brand-gold/30 rounded-xl text-sm focus:outline-none focus:border-brand-coral transition-colors"
                    >
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={clientData.dob}
                      onChange={(e) => setClientData(prev => ({ ...prev, dob: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-brand-cream/25 border border-brand-gold/30 rounded-xl text-sm focus:outline-none focus:border-brand-coral transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Marital Status *</label>
                    <select
                      value={clientData.maritalStatus}
                      onChange={(e) => setClientData(prev => ({ ...prev, maritalStatus: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-brand-cream/25 border border-brand-gold/30 rounded-xl text-sm focus:outline-none focus:border-brand-coral transition-colors"
                    >
                      <option>Single</option>
                      <option>Married</option>
                      <option>Widowed</option>
                      <option>Divorced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 XXXXX XXXXX"
                    value={clientData.mobileNumber}
                    onChange={(e) => setClientData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-brand-cream/25 border border-brand-gold/30 rounded-xl text-sm focus:outline-none focus:border-brand-coral transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Email ID (Optional)</label>
                  <input
                    type="email"
                    value={clientData.email}
                    onChange={(e) => setClientData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-brand-cream/25 border border-brand-gold/30 rounded-xl text-sm focus:outline-none focus:border-brand-coral transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Current Address *</label>
                  <textarea
                    rows="3"
                    required
                    value={clientData.address}
                    onChange={(e) => setClientData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-brand-cream/25 border border-brand-gold/30 rounded-xl text-sm focus:outline-none focus:border-brand-coral transition-colors"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-brand-coral hover:bg-brand-coral/95 text-white font-bold rounded-xl text-sm shadow-sm transition-all disabled:opacity-50"
                >
                  {loading ? 'Saving Profile...' : 'Save Client Profile'}
                </button>
              </form>
            )}

            {/* MAID PROFILE FORM */}
            {user.role === 'MAID' && (
              <form onSubmit={handleMaidSubmit} className="space-y-6">
                
                {/* Profile Photo Display */}
                <div className="flex items-center gap-4 bg-brand-cream/20 p-4 rounded-2xl border border-brand-gold/20">
                  <img 
                    src={maidData.profilePhotoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'} 
                    alt="Maid Profile Photo" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-brand-coral"
                  />
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-brand-dark/70 mb-1">Profile Photo URL *</label>
                    <input
                      type="text"
                      required
                      value={maidData.profilePhotoUrl}
                      onChange={(e) => setMaidData(prev => ({ ...prev, profilePhotoUrl: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-white border border-brand-gold/30 rounded-lg text-xs focus:outline-none focus:border-brand-coral"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={maidData.fullName}
                      onChange={(e) => setMaidData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-brand-cream/25 border border-brand-gold/30 rounded-xl text-sm focus:outline-none focus:border-brand-coral transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Gender *</label>
                    <select
                      value={maidData.gender}
                      onChange={(e) => setMaidData(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-brand-cream/25 border border-brand-gold/30 rounded-xl text-sm focus:outline-none focus:border-brand-coral transition-colors"
                    >
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={maidData.dob}
                      onChange={(e) => setMaidData(prev => ({ ...prev, dob: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-brand-cream/25 border border-brand-gold/30 rounded-xl text-sm focus:outline-none focus:border-brand-coral transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Emergency Contact *</label>
                    <input
                      type="tel"
                      required
                      placeholder="Family member phone"
                      value={maidData.emergencyContact}
                      onChange={(e) => setMaidData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-brand-cream/25 border border-brand-gold/30 rounded-xl text-sm focus:outline-none focus:border-brand-coral transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={maidData.mobileNumber}
                      onChange={(e) => setMaidData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-brand-cream/25 border border-brand-gold/30 rounded-xl text-sm focus:outline-none focus:border-brand-coral transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Alternate Mobile Number</label>
                    <input
                      type="tel"
                      value={maidData.alternateMobile}
                      onChange={(e) => setMaidData(prev => ({ ...prev, alternateMobile: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-brand-cream/25 border border-brand-gold/30 rounded-xl text-sm focus:outline-none focus:border-brand-coral transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Permanent Address *</label>
                  <textarea
                    rows="3"
                    required
                    value={maidData.permanentAddress}
                    onChange={(e) => setMaidData(prev => ({ ...prev, permanentAddress: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-brand-cream/25 border border-brand-gold/30 rounded-xl text-sm focus:outline-none focus:border-brand-coral transition-colors"
                  ></textarea>
                </div>

                {/* Services Selection Section */}
                <div className="border-t border-brand-gold/20 pt-4 space-y-3">
                  <div>
                    <h3 className="font-display font-bold text-sm text-brand-dark">Services Offered & Salary</h3>
                    <p className="text-[10px] text-brand-dark/60">Select the categories you want to service and provide your expected salary (per month) in Rupees.</p>
                  </div>

                  <div className="space-y-2">
                    {servicesList.map((service) => {
                      const selection = chosenServices[service.id] || { checked: false, salary: '' };
                      return (
                        <div 
                          key={service.id} 
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-brand-gold/15 bg-white/40"
                        >
                          <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selection.checked}
                              onChange={() => handleServiceCheckboxChange(service.id)}
                              className="mt-1 accent-brand-coral h-4 w-4 rounded"
                            />
                            <div className="text-left">
                              <p className="text-xs font-bold text-brand-dark">{service.name}</p>
                              <p className="text-[10px] text-brand-dark/65 max-w-sm mt-0.5 leading-relaxed">{service.description}</p>
                            </div>
                          </label>

                          {selection.checked && (
                            <div className="flex items-center gap-2 self-start sm:self-center">
                              <span className="text-xs font-semibold text-brand-dark/65">Rs.</span>
                              <input
                                type="number"
                                required={selection.checked}
                                placeholder="8000"
                                value={selection.salary}
                                onChange={(e) => handleServiceSalaryChange(service.id, e.target.value)}
                                className="w-28 px-2 py-1 border border-brand-gold/30 rounded-lg text-xs focus:outline-none focus:border-brand-coral"
                              />
                              <span className="text-[10px] text-brand-dark/50">/month</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-brand-coral hover:bg-brand-coral/95 text-white font-bold rounded-xl text-sm shadow-sm transition-all disabled:opacity-50"
                >
                  {loading ? 'Saving Profile...' : 'Save Maid Profile'}
                </button>
              </form>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
