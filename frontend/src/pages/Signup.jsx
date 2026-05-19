import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ShieldAlert, Sparkles, User, UserCheck } from 'lucide-react';

export default function Signup() {
  const { signupWithEmail, loginWithGoogle, devBypassLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('CLIENT'); // CLIENT or MAID
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      return setError('Please fill in all fields.');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setError('');
    setLoading(true);
    try {
      await signupWithEmail(email, password, role);
      navigate('/profile'); // Send them to fill out profile first
    } catch (err) {
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    try {
      await loginWithGoogle(role);
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Google sign-up failed.');
    }
  };

  const handleBypass = async (roleType) => {
    setError('');
    await devBypassLogin(roleType);
    navigate('/profile');
  };

  return (
    <div className="max-w-md w-full mx-auto my-16 px-4 text-left">
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-brand-coral/10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-2 bg-brand-coral/10 rounded-2xl text-brand-coral">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-brand-dark">Join Want-A-Bai</h2>
          <p className="text-xs text-brand-dark/60">Create a secure account and complete your profile.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Selector Card Layout */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-brand-dark/70">Select Your Role</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole('CLIENT')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                role === 'CLIENT'
                  ? 'border-brand-coral bg-brand-coral/5 text-brand-coral font-bold'
                  : 'border-brand-gold/45 bg-white text-brand-dark/70'
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs">I want to hire help</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('MAID')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                role === 'MAID'
                  ? 'border-brand-coral bg-brand-coral/5 text-brand-coral font-bold'
                  : 'border-brand-gold/45 bg-white text-brand-dark/70'
              }`}
            >
              <UserCheck className="w-6 h-6" />
              <span className="text-xs">I am a Maid / Helper</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-dark/45">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="example@wantabai.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-brand-cream/25 border border-brand-gold/30 rounded-xl text-sm focus:outline-none focus:border-brand-coral transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-dark/45">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-brand-cream/25 border border-brand-gold/30 rounded-xl text-sm focus:outline-none focus:border-brand-coral transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Confirm Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-dark/45">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-brand-cream/25 border border-brand-gold/30 rounded-xl text-sm focus:outline-none focus:border-brand-coral transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-brand-coral hover:bg-brand-coral/95 text-white font-bold shadow-sm transition-all hover:scale-101 text-sm disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : `Register as ${role === 'CLIENT' ? 'Client' : 'Maid'}`}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-brand-gold/20"></div>
          <span className="flex-shrink mx-4 text-[10px] text-brand-dark/40 font-bold uppercase tracking-wider">or sign up with</span>
          <div className="flex-grow border-t border-brand-gold/20"></div>
        </div>

        {/* Google Sign-in */}
        <button
          onClick={handleGoogleSignup}
          className="w-full py-2.5 px-4 bg-white hover:bg-brand-cream/30 border border-brand-gold/40 text-brand-dark font-semibold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Google Registration
        </button>

        {/* Development Bypass Box */}
        <div className="p-4 bg-brand-cream/40 border border-brand-gold/30 rounded-2xl space-y-3">
          <div className="flex items-center gap-1.5 text-brand-coral font-bold text-[10px] uppercase tracking-wider">
            <UserCheck className="w-4 h-4" />
            <span>Developer Signup Bypass</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleBypass('CLIENT')}
              className="py-1.5 px-2 bg-white hover:bg-brand-coral/10 hover:text-brand-coral border border-brand-gold/30 rounded-lg text-[10px] font-bold shadow-sm transition-colors text-center"
            >
              Bypass to Client Setup
            </button>
            <button
              onClick={() => handleBypass('MAID')}
              className="py-1.5 px-2 bg-white hover:bg-brand-coral/10 hover:text-brand-coral border border-brand-gold/30 rounded-lg text-[10px] font-bold shadow-sm transition-colors text-center"
            >
              Bypass to Maid Setup
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-brand-dark/60">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brand-coral hover:underline">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
