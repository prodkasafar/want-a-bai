import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';

export default function Login() {
  const { loginWithEmail, loginWithGoogle, devBypassLogin, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please fill in all fields.');
    }
    setError('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle(); // Default sync role is CLIENT
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    }
  };

  const handleBypass = async (role) => {
    setError('');
    await devBypassLogin(role);
    navigate('/dashboard');
  };

  return (
    <div className="max-w-md w-full mx-auto my-16 px-4 text-left">
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-brand-coral/10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-2 bg-brand-coral/10 rounded-2xl text-brand-coral">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-brand-dark">Welcome Back</h2>
          <p className="text-xs text-brand-dark/60">Log in to manage domestic helpers and appointments.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-brand-cream/25 border border-brand-gold/30 rounded-xl text-sm focus:outline-none focus:border-brand-coral transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-brand-coral hover:bg-brand-coral/95 text-white font-bold shadow-sm transition-all hover:scale-101 text-sm disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Sign In with Email'}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-brand-gold/20"></div>
          <span className="flex-shrink mx-4 text-[10px] text-brand-dark/40 font-bold uppercase tracking-wider">or continue with</span>
          <div className="flex-grow border-t border-brand-gold/20"></div>
        </div>

        {/* Google Sign-in */}
        <button
          onClick={handleGoogleLogin}
          className="w-full py-2.5 px-4 bg-white hover:bg-brand-cream/30 border border-brand-gold/40 text-brand-dark font-semibold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2"
        >
          {/* Simple google SVG icon */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Google Sign-In
        </button>

        {/* Development Bypass Box */}
        <div className="p-4 bg-brand-cream/40 border border-brand-gold/30 rounded-2xl space-y-3">
          <div className="flex items-center gap-1.5 text-brand-coral font-bold text-[10px] uppercase tracking-wider">
            <UserCheck className="w-4 h-4" />
            <span>Developer Bypass Terminal</span>
          </div>
          <p className="text-[10px] text-brand-dark/60 leading-normal">
            Bypass Firebase network calls and sign in instantly as a pre-seeded test database role:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleBypass('CLIENT')}
              className="py-1.5 px-2 bg-white hover:bg-brand-coral/10 hover:text-brand-coral border border-brand-gold/30 rounded-lg text-[10px] font-bold shadow-sm transition-colors text-center"
            >
              Client
            </button>
            <button
              onClick={() => handleBypass('MAID')}
              className="py-1.5 px-2 bg-white hover:bg-brand-coral/10 hover:text-brand-coral border border-brand-gold/30 rounded-lg text-[10px] font-bold shadow-sm transition-colors text-center"
            >
              Maid
            </button>
            <button
              onClick={() => handleBypass('ADMIN')}
              className="py-1.5 px-2 bg-brand-dark text-brand-gold hover:bg-brand-dark/90 rounded-lg text-[10px] font-bold shadow-sm transition-colors text-center"
            >
              Admin
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-brand-dark/60">
            Don't have an account?{' '}
            <Link to="/signup" className="font-bold text-brand-coral hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
