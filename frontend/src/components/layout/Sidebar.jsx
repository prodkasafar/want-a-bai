import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart2, Server, Users, Calendar, 
  ArrowLeft, Shield, Menu, X, ChevronLeft, ChevronRight, UserCheck 
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  
  // Persist sidebar state in localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('admin_sidebar_collapsed', isCollapsed);
  }, [isCollapsed]);

  const menuItems = [
    {
      name: 'Overview',
      path: '/admin',
      icon: BarChart2
    },
    {
      name: 'Services Catalog',
      path: '/admin/services',
      icon: Server
    },
    {
      name: 'User Accounts',
      path: '/admin/users',
      icon: Users
    },
    {
      name: 'Appointments',
      path: '/admin/appointments',
      icon: Calendar
    },
    {
      name: 'Administrator Access',
      path: '/admin/admins',
      icon: UserCheck
    }
  ];

  const isActive = (path) => location.pathname === path;

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const closeMobile = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Floating Hamburger for Mobile View - Fixed to prevent layout shift */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed bottom-4 right-4 z-40 p-3 bg-brand-dark hover:bg-brand-dark/90 text-brand-gold rounded-full shadow-lg border border-brand-gold/30 flex items-center justify-center transition-transform hover:scale-105"
        title="Open Admin Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          onClick={closeMobile}
          className="md:hidden fixed inset-0 bg-black/60 z-40 transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed md:relative inset-y-0 left-0 z-50 md:z-10
          flex flex-col min-h-screen bg-brand-dark text-white border-r border-brand-gold/20 text-left
          transition-all duration-300 ease-in-out shrink-0
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed && !isMobileOpen ? 'md:w-20' : 'md:w-64'}
        `}
      >
        {/* Header Title Area */}
        <div className="p-4 border-b border-brand-gold/10 flex items-center justify-between gap-2 h-18">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Shield className="w-5 h-5 text-brand-gold shrink-0" />
            {(!isCollapsed || isMobileOpen) && (
              <div className="animate-fadeIn">
                <h2 className="font-display font-bold text-xs tracking-wider text-brand-gold uppercase truncate">
                  Admin Console
                </h2>
                <p className="text-[9px] text-white/50 font-sans">Control Center</p>
              </div>
            )}
          </div>

          {/* Collapse toggle (Desktop only) */}
          <button 
            onClick={toggleCollapse}
            className="hidden md:flex p-1.5 hover:bg-brand-gold/15 rounded-lg text-white/70 hover:text-white transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Close mobile drawer (Mobile only) */}
          <button 
            onClick={closeMobile}
            className="md:hidden p-1.5 hover:bg-brand-gold/15 rounded-lg text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobile}
                className={`
                  relative group flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-bold transition-all
                  ${active 
                    ? 'bg-brand-coral text-white shadow-md' 
                    : 'text-white/70 hover:bg-brand-gold/15 hover:text-white'}
                `}
                title={isCollapsed && !isMobileOpen ? item.name : undefined}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                {(!isCollapsed || isMobileOpen) ? (
                  <span className="truncate animate-fadeIn">{item.name}</span>
                ) : (
                  /* Tooltip on Hover in Collapsed State */
                  <span className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-150 origin-left bg-brand-dark border border-brand-gold/25 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white whitespace-nowrap z-50 shadow-lg">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Exit link / Footer */}
        <div className="p-3 border-t border-brand-gold/10">
          <Link
            to="/dashboard"
            onClick={closeMobile}
            className={`
              flex items-center justify-center gap-2 w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-brand-dark bg-brand-cream hover:bg-brand-gold transition-colors
              ${isCollapsed && !isMobileOpen ? 'px-2' : ''}
            `}
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span className="animate-fadeIn">Exit Console</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
