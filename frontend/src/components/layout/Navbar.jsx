import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../services/api';
import { 
  Bell, Menu, X, LogOut, Compass, 
  LayoutDashboard, User, ShieldAlert, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await notificationAPI.getNotifications();
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err.message);
    }
  };

  // Poll for new notifications every 10 seconds for real-time updates
  useEffect(() => {
    fetchNotifications();
    if (user) {
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Handle clicking outside of notification dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full glass-light border-b border-brand-coral/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <span className="p-1.5 bg-brand-coral rounded-xl text-white">
                <Sparkles className="w-6 h-6" />
              </span>
              <span className="font-display font-bold text-2xl tracking-tight text-brand-dark">
                Want-A-<span className="text-brand-coral">Bai</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/discovery" 
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive('/discovery') 
                  ? 'bg-brand-coral/15 text-brand-coral' 
                  : 'text-brand-dark/75 hover:bg-brand-gold/10 hover:text-brand-dark'
              }`}
            >
              <Compass className="w-4 h-4" />
              Find Maids
            </Link>

            {user && (
              <>
                <Link 
                  to="/dashboard" 
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/dashboard') 
                      ? 'bg-brand-coral/15 text-brand-coral' 
                      : 'text-brand-dark/75 hover:bg-brand-gold/10 hover:text-brand-dark'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                <Link 
                  to="/profile" 
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/profile') 
                      ? 'bg-brand-coral/15 text-brand-coral' 
                      : 'text-brand-dark/75 hover:bg-brand-gold/10 hover:text-brand-dark'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>

                {user.role === 'ADMIN' && (
                  <Link 
                    to="/admin" 
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-brand-dark bg-brand-gold hover:bg-brand-gold/80 transition-all border border-brand-dark/10 shadow-sm"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right Side Buttons (Auth / Notif) */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                    className="p-2 text-brand-dark/70 hover:bg-brand-gold/20 hover:text-brand-coral rounded-xl transition-all relative"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-coral text-[9px] font-bold text-white ring-2 ring-brand-cream">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {notifDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-brand-coral/10 py-2 overflow-hidden z-50 max-h-96 overflow-y-auto"
                      >
                        <div className="px-4 py-2 border-b border-brand-gold/10 flex justify-between items-center bg-brand-cream/35">
                          <span className="font-semibold text-sm text-brand-dark">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="text-xs bg-brand-coral/10 text-brand-coral px-2 py-0.5 rounded-full font-bold">
                              {unreadCount} New
                            </span>
                          )}
                        </div>

                        <div className="divide-y divide-brand-gold/10">
                          {notifications.length === 0 ? (
                            <div className="px-4 py-6 text-center text-xs text-brand-dark/50">
                              No notifications yet
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <div 
                                key={notif.id} 
                                onClick={() => handleMarkAsRead(notif.id)}
                                className={`px-4 py-3 text-left transition-colors cursor-pointer hover:bg-brand-gold/10 ${
                                  !notif.isRead ? 'bg-brand-coral/5 border-l-2 border-brand-coral' : ''
                                }`}
                              >
                                <p className="font-semibold text-xs text-brand-dark">{notif.title}</p>
                                <p className="text-[11px] text-brand-dark/70 mt-1 leading-normal">{notif.message}</p>
                                <span className="text-[9px] text-brand-dark/40 block mt-1">
                                  {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User Info & Logout */}
                <div className="flex items-center gap-3 pl-2 border-l border-brand-gold/30">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-brand-dark max-w-[120px] truncate">
                      {user.clientProfile?.fullName || user.maidProfile?.fullName || 'System Admin'}
                    </p>
                    <p className="text-[9px] font-bold text-brand-coral tracking-widest">
                      {user.role}
                    </p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-brand-dark/60 hover:text-brand-coral hover:bg-brand-coral/10 rounded-xl transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link 
                  to="/login" 
                  className="px-4 py-2 text-sm font-semibold text-brand-dark/80 hover:text-brand-coral transition-colors"
                >
                  Log In
                </Link>
                <Link 
                  to="/signup" 
                  className="px-4 py-2 rounded-xl bg-brand-coral hover:bg-brand-coral/95 text-white text-sm font-semibold shadow-sm transition-all hover:scale-102"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            {user && (
              <button 
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 mr-2 text-brand-dark/70 hover:bg-brand-gold/20 rounded-xl transition-all relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-coral text-[9px] font-bold text-white ring-2 ring-brand-cream">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-brand-dark hover:bg-brand-gold/20 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-brand-coral/10 bg-brand-cream/95 backdrop-blur-lg overflow-hidden"
          >
            <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3 text-left">
              <Link 
                to="/discovery" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-base font-semibold hover:bg-brand-gold/20"
              >
                Find Maids
              </Link>
              {user && (
                <>
                  <Link 
                    to="/dashboard" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-base font-semibold hover:bg-brand-gold/20"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/profile" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-base font-semibold hover:bg-brand-gold/20"
                  >
                    Profile
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link 
                      to="/admin" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-xl text-base font-bold text-brand-coral bg-brand-gold/45"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button 
                    onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                    className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-base font-semibold text-brand-coral hover:bg-brand-coral/10 mt-4 border-t border-brand-gold/20 pt-4"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              )}

              {!user && (
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-brand-gold/20 px-3">
                  <Link 
                    to="/login" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-brand-dark/20 text-center text-sm font-semibold"
                  >
                    Log In
                  </Link>
                  <Link 
                    to="/signup" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-brand-coral text-white text-center text-sm font-semibold"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
