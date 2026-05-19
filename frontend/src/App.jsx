import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import MaidDiscovery from './pages/MaidDiscovery';
import Dashboard from './pages/Dashboard';

// Admin Subpages
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminServices from './pages/Admin/AdminServices';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminAppointments from './pages/Admin/AdminAppointments';
import AdminAccess from './pages/Admin/AdminAccess';

// Route Guard for authenticated users
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-cream">
        <div className="w-10 h-10 border-4 border-brand-coral border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Route Guard for Admin users only
function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-cream">
        <div className="w-10 h-10 border-4 border-brand-coral border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          {/* Top Bar Navigation */}
          <Navbar />

          {/* Main App Content Area */}
          <div className="flex-1">
            <Routes>
              {/* Public Views */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/discovery" element={<MaidDiscovery />} />

              {/* Client/Maid Authenticated Views */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Admin Panel Views (Restricted) */}
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/admin/services" 
                element={
                  <AdminRoute>
                    <AdminServices />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <AdminRoute>
                    <AdminUsers />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/admin/appointments" 
                element={
                  <AdminRoute>
                    <AdminAppointments />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/admin/admins" 
                element={
                  <AdminRoute>
                    <AdminAccess />
                  </AdminRoute>
                } 
              />

              {/* Catch all redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          {/* Page Footer */}
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
