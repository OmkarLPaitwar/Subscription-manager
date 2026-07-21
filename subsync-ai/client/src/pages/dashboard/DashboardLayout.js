import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../utils/api';

const NAV = [
  { to: '/dashboard',               icon: '⬛', label: 'Dashboard' },
  { to: '/dashboard/subscriptions', icon: '💳', label: 'My Subscriptions' },
  { to: '/dashboard/analytics',     icon: '📈', label: 'Analytics' },
  { to: '/dashboard/advisor',       icon: '🤖', label: 'AI Advisor' },
  { to: '/dashboard/notifications', icon: '🔔', label: 'Notifications', badge: true },
  { to: '/dashboard/billing',       icon: '🧾', label: 'Billing' },
  { to: '/dashboard/settings',      icon: '⚙️', label: 'Settings' },
];

const PAGE_TITLES = {
  '/dashboard': 'Dashboard Overview',
  '/dashboard/subscriptions': 'My Subscriptions',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/advisor': 'AI Advisor',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/billing': 'Billing & Plans',
  '/dashboard/settings': 'Settings',
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [theme, setTheme] = useState(user?.preferences?.theme || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    notificationAPI.unreadCount()
      .then(r => setUnread(r.data.count))
      .catch(() => {});
  }, [location.pathname]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : 'U';
  const title = PAGE_TITLES[location.pathname] || 'Dashboard';

  return (
    <div style={S.layout}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:99, display:'none' /* shown via media query */ }} />
      )}

      {/* SIDEBAR */}
      <aside style={{ ...S.sidebar, transform: sidebarOpen ? 'translateX(0)' : undefined }}>
        <div style={S.sidebarLogo}>
          <span onClick={() => navigate('/')} style={S.logo}>SubSync AI</span>
        </div>

        <div style={S.sidebarSection}>Main</div>
        {NAV.slice(0,4).map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'}
            onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({ ...S.navItem, ...(isActive ? S.navActive : {}) })}>
            <span style={S.navIcon}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div style={S.sidebarSection}>Management</div>
        {NAV.slice(4).map(item => (
          <NavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({ ...S.navItem, ...(isActive ? S.navActive : {}) })}>
            <span style={S.navIcon}>{item.icon}</span>
            {item.label}
            {item.badge && unread > 0 && (
              <span style={S.badge}>{unread}</span>
            )}
          </NavLink>
        ))}

        <div style={S.sidebarFooter}>
          <div style={S.userMini}>
            <div style={S.avatar}>{initials}</div>
            <div style={{ flex:1, overflow:'hidden' }}>
              <div style={S.userName}>{user?.firstName} {user?.lastName}</div>
              <div style={S.userEmail}>{user?.email}</div>
            </div>
            <button style={S.logoutBtn} onClick={handleLogout} title="Log out">↩</button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={S.main}>
        {/* Top Bar */}
        <div style={S.topBar}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button style={S.menuBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <h1 style={S.topTitle}>{title}</h1>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button style={S.iconBtn} onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
            <button style={S.iconBtn} onClick={() => navigate('/dashboard/notifications')} title="Notifications">
              🔔 {unread > 0 && <span style={S.notifDot}></span>}
            </button>
            <div style={S.avatar}>{initials}</div>
          </div>
        </div>

        {/* Page Content */}
        <div style={S.content}>
          <Outlet context={{ setUnread }} />
        </div>
      </div>
    </div>
  );
}

const S = {
  layout:       { display:'flex', minHeight:'100vh' },
  sidebar:      { width:240, background:'var(--bg2)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', position:'fixed', left:0, top:0, bottom:0, zIndex:50, transition:'transform .3s' },
  sidebarLogo:  { padding:'20px 20px 20px', borderBottom:'1px solid var(--border)', marginBottom:8 },
  logo:         { fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, background:'var(--grad)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', cursor:'pointer' },
  sidebarSection: { fontSize:10, fontWeight:700, color:'var(--text3)', letterSpacing:'1.5px', textTransform:'uppercase', padding:'12px 20px 4px' },
  navItem:      { display:'flex', alignItems:'center', gap:11, padding:'10px 20px', fontSize:14, fontWeight:500, color:'var(--text2)', cursor:'pointer', borderLeft:'2px solid transparent', textDecoration:'none', transition:'all .15s' },
  navActive:    { color:'var(--blue)', background:'rgba(79,142,247,.08)', borderLeftColor:'var(--blue)' },
  navIcon:      { fontSize:15, width:20, textAlign:'center' },
  badge:        { marginLeft:'auto', background:'var(--red)', color:'#fff', borderRadius:10, fontSize:10, fontWeight:700, padding:'2px 6px', minWidth:18, textAlign:'center' },
  sidebarFooter:{ marginTop:'auto', padding:'16px 20px', borderTop:'1px solid var(--border)' },
  userMini:     { display:'flex', alignItems:'center', gap:10 },
  avatar:       { width:32, height:32, borderRadius:'50%', background:'var(--grad)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 },
  userName:     { fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  userEmail:    { fontSize:11, color:'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  logoutBtn:    { background:'transparent', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:14, padding:4, transition:'color .2s' },
  main:         { marginLeft:240, flex:1 },
  topBar:       { background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'0 28px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:40 },
  topTitle:     { fontFamily:'Syne,sans-serif', fontSize:'1.1rem', fontWeight:700 },
  iconBtn:      { position:'relative', width:36, height:36, background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'var(--r2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:15, transition:'all .2s' },
  notifDot:     { position:'absolute', top:6, right:6, width:7, height:7, background:'var(--red)', borderRadius:'50%', border:'1.5px solid var(--bg2)' },
  menuBtn:      { display:'none', background:'transparent', border:'none', color:'var(--text)', fontSize:20, cursor:'pointer', padding:4 },
  content:      { padding:28, minHeight:'calc(100vh - 60px)' },
};
