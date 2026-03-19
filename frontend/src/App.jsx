import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageStudents from './pages/admin/ManageStudents';
import MarkAttendance from './pages/admin/MarkAttendance';
import DefaultersList from './pages/admin/DefaultersList';
import StudentDashboard from './pages/student/StudentDashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles is provided, check if user's role is in the array
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Prevent infinite loop by redirecting to a safe fallback or throwing error
    if (user.role === 'Admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const App = () => {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      
      {/* Root redirect based on role */}
      <Route path="/" element={
        user ? (
          user.role === 'Admin' ? <Navigate to="/admin/dashboard" /> : <Navigate to="/student/dashboard" />
        ) : <Navigate to="/login" />
      } />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/students" element={
        <ProtectedRoute allowedRoles={['Admin']}><ManageStudents /></ProtectedRoute>
      } />
      <Route path="/admin/attendance" element={
        <ProtectedRoute allowedRoles={['Admin']}><MarkAttendance /></ProtectedRoute>
      } />
      <Route path="/admin/defaulters" element={
        <ProtectedRoute allowedRoles={['Admin']}><DefaultersList /></ProtectedRoute>
      } />

      {/* Student Routes */}
      <Route path="/student/dashboard" element={
        <ProtectedRoute allowedRoles={['User', 'Student']}><StudentDashboard /></ProtectedRoute>
      } />
    </Routes>
  );
};

export default App;
