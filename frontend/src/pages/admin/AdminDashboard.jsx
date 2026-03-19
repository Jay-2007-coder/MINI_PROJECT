import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { MdPeople, MdWarningAmber, MdCheckCircle, MdCalendarToday } from 'react-icons/md';
import api from '../../api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, studentsRes] = await Promise.all([
          api.get('/attendance/stats'),
          api.get('/students'),
        ]);
        setStats(statsRes.data);
        setStudents(studentsRes.data);
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
        <p>Loading dashboard...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const totalStudents = students.length;

  // Aggregate stats per student
  const studentMap = {};
  stats?.students?.forEach(s => {
    const present = s.classes_present ?? s.days_present ?? 0;
    const total = s.total_classes ?? s.total_records ?? 0;
    
    if (!studentMap[s.student_id]) {
      studentMap[s.student_id] = { ...s, days_present: 0, total_records: 0 };
    }
    studentMap[s.student_id].days_present += present;
    studentMap[s.student_id].total_records += total;
  });

  const studentStats = Object.values(studentMap).map(s => {
    const percentage = s.total_records > 0 ? parseFloat(((s.days_present / s.total_records) * 100).toFixed(2)) : 0;
    return { ...s, percentage, isDefaulter: Math.round(percentage) < 75 };
  });

  const defaulterCount = studentStats.filter(s => s.isDefaulter).length;
  const avgAttendance = studentStats.length > 0
    ? (studentStats.reduce((acc, s) => acc + s.percentage, 0) / studentStats.length).toFixed(1)
    : 0;

  const statCards = [
    { label: 'Total Students', value: totalStudents, icon: <MdPeople />, color: '#4F46E5' },
    { label: 'Working Days', value: stats?.totalWorkingDays ?? 0, icon: <MdCalendarToday />, color: '#10B981' },
    { label: 'Avg Attendance', value: `${avgAttendance}%`, icon: <MdCheckCircle />, color: '#F59E0B' },
    { label: 'Defaulters', value: defaulterCount, icon: <MdWarningAmber />, color: '#EF4444' },
  ];

  // Chart data: top 8 students bar chart (overall)
  const top8 = studentStats.sort((a, b) => b.percentage - a.percentage).slice(0, 8);
  const barData = {
    labels: top8.map(s => s.name.split(' ')[0]),
    datasets: [{
      label: 'Attendance %',
      data: top8.map(s => s.percentage),
      backgroundColor: top8.map(s => s.isDefaulter ? 'rgba(239,68,68,0.7)' : 'rgba(79,70,229,0.7)'),
      borderRadius: 8,
    }],
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false }, title: { display: false } },
    scales: {
      y: { min: 0, max: 100, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } },
    },
  };

  // Doughnut: Present vs Defaulters
  const doughnutData = {
    labels: ['≥75% Attendance', '<75% (Defaulters)'],
    datasets: [{
      data: [totalStudents - defaulterCount, defaulterCount],
      backgroundColor: ['#10B981', '#EF4444'],
      borderWidth: 0,
    }],
  };

  return (
    <div>
      <div className="top-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Admin Dashboard</h1>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Overview of attendance and student statistics</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map((card) => (
          <div key={card.label} className="glass-panel stat-card" style={{ borderLeft: `4px solid ${card.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="stat-title">{card.label}</span>
              <span style={{ fontSize: '1.75rem', color: card.color }}>{card.icon}</span>
            </div>
            <span className="stat-value" style={{ color: card.color }}>{card.value}</span>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Student Attendance Overview</h3>
          {top8.length > 0 ? <Bar data={barData} options={barOptions} /> : <p>No attendance data yet.</p>}
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Attendance Status</h3>
          {totalStudents > 0 ? (
            <>
              <Doughnut data={doughnutData} options={{ plugins: { legend: { position: 'bottom' } } }} />
            </>
          ) : <p>No student data yet.</p>}
        </div>
      </div>

      {/* Recent Students Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Student Attendance Summary</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Roll No.</th>
                <th>Class</th>
                <th>Classes Attended</th>
                <th>Attendance %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {studentStats.length > 0 ? studentStats.map((s) => (
                <tr key={s.student_id}>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td>{s.roll_number}</td>
                  <td>{s.class} - {s.section}</td>
                  <td>{s.days_present} / {s.total_records}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flex: 1, height: 6, background: '#E5E7EB', borderRadius: 99 }}>
                        <div style={{
                          width: `${Math.min(s.percentage, 100)}%`, height: '100%',
                          background: s.isDefaulter ? '#EF4444' : '#10B981',
                          borderRadius: 99, transition: 'width 0.5s ease'
                        }} />
                      </div>
                      <span style={{ minWidth: '3rem', fontSize: '0.8rem', fontWeight: 600 }}>{s.percentage}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${s.isDefaulter ? 'badge-danger' : 'badge-success'}`}>
                      {s.isDefaulter ? 'Defaulter' : 'Regular'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No attendance data yet. Mark attendance first.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
