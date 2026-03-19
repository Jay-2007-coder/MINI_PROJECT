import React, { useEffect, useState, useContext } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { MdCheckCircle, MdCancel, MdCalendarToday } from 'react-icons/md';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, Title, Tooltip, Legend, ArcElement
);

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, recordsRes] = await Promise.all([
          api.get('/attendance/stats'),
          api.get('/attendance'),
        ]);
        setStats(statsRes.data?.students ?? []);
        setRecords(recordsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, border: '4px solid #4F46E5',
          borderTop: '4px solid transparent', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem'
        }} />
        <p>Loading your attendance...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const totalClasses = stats.reduce((acc, curr) => acc + (curr.total_classes || curr.total_records || 0), 0);
  const presentCount = stats.reduce((acc, curr) => acc + (curr.classes_present || curr.days_present || 0), 0);
  const percentage = totalClasses > 0 ? parseFloat(((presentCount / totalClasses) * 100).toFixed(2)) : 0;
  const isDefaulter = Math.round(percentage) < 75;

  // Group records by month for bar chart
  const monthlyData = {};
  records.forEach(r => {
    const monthKey = new Date(r.date).toLocaleDateString('default', { month: 'short', year: '2-digit' });
    if (!monthlyData[monthKey]) monthlyData[monthKey] = { present: 0, absent: 0 };
    if (r.status === 'Present') monthlyData[monthKey].present++;
    else monthlyData[monthKey].absent++;
  });
  const months = Object.keys(monthlyData).slice(-6);

  const barData = {
    labels: months,
    datasets: [
      {
        label: 'Classes Present',
        data: months.map(m => monthlyData[m].present),
        backgroundColor: 'rgba(16,185,129,0.75)',
        borderRadius: 6,
      },
      {
        label: 'Classes Absent',
        data: months.map(m => monthlyData[m].absent),
        backgroundColor: 'rgba(239,68,68,0.75)',
        borderRadius: 6,
      },
    ],
  };

  const doughnutData = {
    labels: ['Present', 'Absent'],
    datasets: [{
      data: [presentCount, totalClasses - presentCount],
      backgroundColor: ['#10B981', '#EF4444'],
      borderWidth: 0,
    }],
  };

  const subjectChartData = {
    labels: stats.map(s => s.subject),
    datasets: [{
      label: 'Attendance %',
      data: stats.map(s => s.percentage),
      backgroundColor: stats.map(s => s.percentage < 75 ? 'rgba(239,68,68,0.75)' : 'rgba(16,185,129,0.75)'),
      borderRadius: 6,
    }]
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div>
      <div className="top-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>My Attendance</h1>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Welcome back, <strong>{user?.username}</strong></p>
        </div>
      </div>

      {/* Big percentage indicator */}
      <div className="glass-panel" style={{
        padding: '2rem', marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', gap: '2rem',
        borderLeft: `6px solid ${isDefaulter ? '#EF4444' : '#10B981'}`,
      }}>
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: `conic-gradient(${isDefaulter ? '#EF4444' : '#10B981'} ${percentage * 3.6}deg, #E5E7EB ${percentage * 3.6}deg)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{
            width: 90, height: 90, borderRadius: '50%', background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'absolute', flexDirection: 'column',
          }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: isDefaulter ? '#EF4444' : '#10B981' }}>
              {percentage}%
            </span>
          </div>
        </div>
        <div>
          <h2 style={{ marginBottom: '0.5rem' }}>
            {isDefaulter ? '⚠️ Below Required Attendance' : '✅ Attendance in Good Standing'}
          </h2>
          <p style={{ margin: 0 }}>
            You have attended <strong>{presentCount}</strong> out of <strong>{totalClasses}</strong> total classes.
            {isDefaulter && (
              <span style={{ color: '#DC2626', marginLeft: '0.5rem', fontWeight: 600 }}>
                You need more attendance to cross 75%.
              </span>
            )}
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <span className={`badge ${isDefaulter ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.875rem', padding: '0.4rem 1rem' }}>
              {isDefaulter ? 'DEFAULTER' : 'REGULAR'}
            </span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #10B981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="stat-title">Classes Present</span>
            <MdCheckCircle style={{ fontSize: '1.75rem', color: '#10B981' }} />
          </div>
          <span className="stat-value" style={{ color: '#10B981' }}>{presentCount}</span>
        </div>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #EF4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="stat-title">Classes Absent</span>
            <MdCancel style={{ fontSize: '1.75rem', color: '#EF4444' }} />
          </div>
          <span className="stat-value" style={{ color: '#EF4444' }}>
            {totalClasses - presentCount}
          </span>
        </div>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #4F46E5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="stat-title">Total Classes</span>
            <MdCalendarToday style={{ fontSize: '1.75rem', color: '#4F46E5' }} />
          </div>
          <span className="stat-value">{totalClasses}</span>
        </div>
      </div>

      {/* Charts Row */}
      {records.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Subject-wise Attendance %</h3>
            <Bar data={subjectChartData} options={{ ...barOptions, scales: { y: { max: 100, beginAtZero: true } } }} />
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Overall Ratio</h3>
            <div style={{ position: 'relative', height: '300px' }}>
              <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Monthly History</h3>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      ) : null}

      {/* Attendance Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Attendance Log</h3>
        {records.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No attendance records found yet.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Subject</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const d = new Date(r.date);
                  return (
                    <tr key={r.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td>{d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td>{d.toLocaleDateString('default', { weekday: 'long' })}</td>
                      <td><span className="badge" style={{ background: '#E0E7FF', color: '#3730A3' }}>{r.subject}</span> {r.lectureNumber && `(Lec ${r.lectureNumber})`}</td>
                      <td>
                        {r.startTime && r.endTime ? `${r.startTime} - ${r.endTime}` : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                      </td>
                      <td>
                        <span className={`badge ${r.status === 'Present' ? 'badge-success' : 'badge-danger'}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
