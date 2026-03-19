import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { MdSchool, MdPerson, MdLock, MdAdminPanelSettings, MdSchool as MdStudent } from 'react-icons/md';

const Login = () => {
  const { login, loading: loginLoading, error: loginError } = useContext(AuthContext);
  const navigate = useNavigate();

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [regData, setRegData] = useState({ username: '', password: '', confirmPassword: '', role: 'Admin' });
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const user = await login(loginData.username, loginData.password);
      navigate(user.role === 'Admin' ? '/admin/dashboard' : '/student/dashboard');
    } catch {
      // error shown via context
    }
  };

  // REGISTER (public endpoint)
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (regData.password !== regData.confirmPassword) {
      return setRegError('Passwords do not match');
    }
    if (regData.password.length < 6) {
      return setRegError('Password must be at least 6 characters');
    }

    setRegLoading(true);
    try {
      const { data } = await api.post('/auth/register-public', {
        username: regData.username,
        password: regData.password,
      });

      // Auto-login after registration
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      setRegSuccess('Account created! Redirecting...');
      setTimeout(() => {
        window.location.href = data.role === 'Admin' ? '/admin/dashboard' : '/student/dashboard';
      }, 800);
    } catch (err) {
      setRegError(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-box glass-panel animate-fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4F46E5 0%, #10B981 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 0.75rem',
            boxShadow: '0 8px 32px rgba(79,70,229,0.35)',
          }}>
            <MdSchool style={{ fontSize: '2rem', color: 'white' }} />
          </div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '0.15rem' }}>SAS</h1>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Student Attendance System</p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', background: '#F3F4F6', borderRadius: 10,
          padding: 4, marginBottom: '1.5rem',
        }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => { setTab(t); setRegError(''); setRegSuccess(''); }}
              style={{
                flex: 1, padding: '0.6rem', border: 'none', cursor: 'pointer',
                borderRadius: 8, fontWeight: 600, fontSize: '0.875rem',
                transition: 'all 0.2s',
                background: tab === t ? 'white' : 'transparent',
                color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}>
              {t === 'login' ? '🔐 Login' : '📋 Register'}
            </button>
          ))}
        </div>

        {/* LOGIN FORM */}
        {tab === 'login' && (
          <>
            {loginError && <div className="error-message">{loginError}</div>}
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <div style={{ position: 'relative' }}>
                  <MdPerson style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="form-input" style={{ paddingLeft: '2.5rem' }}
                    type="text" placeholder="Enter your username" required
                    value={loginData.username}
                    onChange={e => setLoginData({ ...loginData, username: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <MdLock style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="form-input" style={{ paddingLeft: '2.5rem' }}
                    type="password" placeholder="Enter your password" required
                    value={loginData.password}
                    onChange={e => setLoginData({ ...loginData, password: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
                disabled={loginLoading}>
                {loginLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Welcome back! Please enter your credentials.
            </p>
          </>
        )}

        {/* REGISTER FORM */}
        {tab === 'register' && (
          <>
            {regError && <div className="error-message">{regError}</div>}
            {regSuccess && (
              <div style={{ padding: '0.75rem', background: '#D1FAE5', color: '#065F46', borderRadius: 8, marginBottom: '1rem', textAlign: 'center', fontWeight: 600 }}>
                {regSuccess}
              </div>
            )}
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Admin Registration</label>
                <div style={{
                  padding: '0.75rem', borderRadius: 8, border: '2px solid var(--primary)',
                  background: 'rgba(79,70,229,0.06)', position: 'relative'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <MdAdminPanelSettings style={{ fontSize: '1.25rem', color: 'var(--primary)', marginRight: '0.5rem' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Admin Account</div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Create a new administrator account</div>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#B45309', marginTop: '0.5rem', background: '#FEF3C7', padding: '0.5rem 0.75rem', borderRadius: 6, marginBottom: 0 }}>
                  ⚠️ Only one administrator account is allowed.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Username</label>
                <div style={{ position: 'relative' }}>
                  <MdPerson style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="form-input" style={{ paddingLeft: '2.5rem' }}
                    type="text" placeholder="Choose a username" required
                    value={regData.username}
                    onChange={e => setRegData({ ...regData, username: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" placeholder="Min 6 chars" required
                    value={regData.password}
                    onChange={e => setRegData({ ...regData, password: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Confirm</label>
                  <input className="form-input" type="password" placeholder="Repeat password" required
                    value={regData.confirmPassword}
                    onChange={e => setRegData({ ...regData, confirmPassword: e.target.value })} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '1.25rem' }}
                disabled={regLoading}>
                {regLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
            <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Already have an account? Click <strong>Login</strong> above.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
