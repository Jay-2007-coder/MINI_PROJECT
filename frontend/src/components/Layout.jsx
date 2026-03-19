import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  MdDashboard,
  MdPeople,
  MdFactCheck,
  MdWarning,
  MdLogout,
  MdSchool,
} from 'react-icons/md';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <MdDashboard /> },
    { to: '/admin/students', label: 'Students', icon: <MdPeople /> },
    { to: '/admin/attendance', label: 'Mark Attendance', icon: <MdFactCheck /> },
    { to: '/admin/defaulters', label: 'Defaulters', icon: <MdWarning /> },
  ];

  const studentLinks = [
    { to: '/student/dashboard', label: 'My Attendance', icon: <MdDashboard /> },
  ];

  const links = user?.role === 'Admin' ? adminLinks : studentLinks;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <MdSchool style={{ fontSize: '2rem' }} />
          <span>SAS</span>
        </div>
        <nav style={{ flex: 1 }}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: 8,
            background: 'rgba(79,70,229,0.08)',
            marginBottom: '1rem',
            fontSize: '0.8rem',
          }}>
            <div style={{ fontWeight: 600 }}>{user?.username}</div>
            <div style={{ color: 'var(--text-muted)' }}>{user?.role}</div>
          </div>
          <button className="btn" onClick={handleLogout} style={{
            width: '100%',
            background: 'rgba(239,68,68,0.1)',
            color: 'var(--danger)',
          }}>
            <MdLogout /> Logout
          </button>
        </div>
      </aside>
      <main className="main-content animate-fade-in">
        {children}
      </main>
    </div>
  );
};

export default Layout;
