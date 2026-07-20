import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

<<<<<<< HEAD
=======
// Pages
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
import Landing      from './pages/Landing';
import Login        from './pages/Login';
import Signup       from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import Overview     from './pages/dashboard/Overview';
import Subscriptions from './pages/dashboard/Subscriptions';
import Analytics    from './pages/dashboard/Analytics';
import AIAdvisor    from './pages/dashboard/AIAdvisor';
import Notifications from './pages/dashboard/Notifications';
import Billing      from './pages/dashboard/Billing';
import Profile      from './pages/dashboard/Profile';
import Settings     from './pages/dashboard/Settings';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#09090f' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid #4f8ef730', borderTop:'3px solid #4f8ef7', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 16px' }}></div>
<<<<<<< HEAD
        <div style={{ color:'#a0a0c0', fontSize:14 }}>Loading...</div>
=======
        <div style={{ color:'#a0a0c0', fontSize:14 }}>Loading SubSync AI…</div>
>>>>>>> a4018679ffdc8492f131e3a4c16fcdcb7dbc21b8
      </div>
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"      element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route index element={<Overview />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="analytics"     element={<Analytics />} />
        <Route path="advisor"       element={<AIAdvisor />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="billing"       element={<Billing />} />
        <Route path="profile"       element={<Profile />} />
        <Route path="settings"      element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background:'#1c1c32', color:'#f0f0ff', border:'1px solid #ffffff20', borderRadius:10, fontSize:14 },
            success: { iconTheme: { primary:'#10b981', secondary:'#1c1c32' } },
            error:   { iconTheme: { primary:'#f43f5e', secondary:'#1c1c32' } }
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
