import React, { useEffect, useState } from 'react';
import { MdWarningAmber, MdDownload } from 'react-icons/md';
import api from '../../api';

const DefaultersList = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchStats = async (sDate = '', eDate = '') => {
    try {
      setLoading(true);
      let query = '';
      if (sDate || eDate) {
        const params = new URLSearchParams();
        if (sDate) params.append('startDate', sDate);
        if (eDate) params.append('endDate', eDate);
        query = '?' + params.toString();
      }
      const { data } = await api.get(`/attendance/stats${query}`);
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Aggregate stats per student for Overall Defaulter Check
  const aggregatedDefaulters = [];
  if (stats?.students) {
    const studentMap = {};
    stats.students.forEach(s => {
      if (!studentMap[s.student_id]) {
        studentMap[s.student_id] = { 
          ...s, 
          classes_present: 0, 
          total_classes: 0, 
          working_days: 0,
          subjects: [] 
        };
      }
      studentMap[s.student_id].classes_present += (s.classes_present || 0);
      studentMap[s.student_id].total_classes += (s.total_classes || 0);
      studentMap[s.student_id].working_days = Math.max(studentMap[s.student_id].working_days, (s.working_days || 0));
      
      const subjectPercentage = s.total_classes > 0 ? (s.classes_present / s.total_classes) * 100 : 0;
      const isSubjectDefaulter = subjectPercentage < 75;
      
      studentMap[s.student_id].subjects.push({
        name: s.subject,
        percentage: s.percentage || subjectPercentage,
        isDefaulter: s.isDefaulter || isSubjectDefaulter
      });
      
      if (s.isDefaulter || isSubjectDefaulter) {
        studentMap[s.student_id].hasAnyDefaulterSubject = true;
      }
    });

    Object.values(studentMap).forEach(s => {
      if (s.hasAnyDefaulterSubject) {
        const overallPercentage = s.total_classes > 0 
          ? parseFloat(((s.classes_present / s.total_classes) * 100).toFixed(2)) 
          : 0;
        aggregatedDefaulters.push({ ...s, percentage: overallPercentage });
      }
    });
  }

  const uniqueStudentCount = stats?.students 
    ? new Set(stats.students.map(s => s.student_id)).size 
    : 0;

  const handleDownload = (format) => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({ token });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const url = `http://localhost:5000/api/exports/defaulters/${format}?${params.toString()}`;
    window.open(url, '_blank');
  };

  return (
    <div>
      <div className="top-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Defaulters List</h1>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Students with attendance below 75%</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.25rem 0.5rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>From:</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} 
              style={{ border: 'none', outline: 'none', fontSize: '0.875rem' }} />
            <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>To:</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} 
              style={{ border: 'none', outline: 'none', fontSize: '0.875rem' }} />
            <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }} onClick={() => fetchStats(startDate, endDate)}>
              Filter
            </button>
          </div>
          <button className="btn" style={{ background: '#FEE2E2', color: '#DC2626' }}
            onClick={() => handleDownload('pdf')}>
            <MdDownload /> PDF
          </button>
          <button className="btn" style={{ background: '#DBEAFE', color: '#1D4ED8' }}
            onClick={() => handleDownload('csv')}>
            <MdDownload /> CSV
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #EF4444' }}>
          <span className="stat-title">Total Defaulters</span>
          <span className="stat-value" style={{ color: '#EF4444' }}>{loading ? '—' : aggregatedDefaulters.length}</span>
        </div>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #4F46E5' }}>
          <span className="stat-title">Total Students</span>
          <span className="stat-value">{loading ? '—' : uniqueStudentCount}</span>
        </div>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #10B981' }}>
          <span className="stat-title">Working Days</span>
          <span className="stat-value" style={{ color: '#10B981' }}>{loading ? '—' : stats?.totalWorkingDays ?? 0}</span>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>
        ) : aggregatedDefaulters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <MdWarningAmber style={{ fontSize: '3rem', color: '#D1D5DB', marginBottom: '1rem' }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>No Defaulters Found</p>
            <p>All students are in good standing for this period.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Name</th>
                  <th>Roll No.</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Subjects</th>
                  <th>Classes Attended</th>
                  <th>Total Classes</th>
                  <th>Working Days (Calendar)</th>
                  <th>Overall %</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedDefaulters.map((s, i) => {
                  const required = Math.ceil(0.75 * s.total_classes);
                  const shortfall = required - s.classes_present;
                  return (
                    <tr key={s.student_id}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>{s.roll_number}</td>
                      <td>{s.class}</td>
                      <td>{s.section}</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {s.subjects.map(sub => (
                            <span key={sub.name} className="badge" style={{ 
                              background: sub.isDefaulter ? '#FEE2E2' : '#E0E7FF', 
                              color: sub.isDefaulter ? '#DC2626' : '#3730A3', 
                              fontSize: '0.7rem' 
                            }}>
                              {sub.name} ({Math.round(sub.percentage)}%)
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>{s.classes_present}</td>
                      <td>{s.total_classes}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{s.working_days}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, height: 8, background: '#FEE2E2', borderRadius: 99, minWidth: '60px' }}>
                            <div style={{
                              width: `${Math.min(s.percentage, 100)}%`, height: '100%',
                              background: '#EF4444', borderRadius: 99,
                            }} />
                          </div>
                          <span style={{ color: '#DC2626', fontWeight: 700 }}>{s.percentage}%</span>
                        </div>
                      </td>
                      <td>
                        {s.percentage < 75 ? (
                          <span className="badge badge-danger">Needs {shortfall} more class{shortfall !== 1 ? 'es' : ''} (Overall)</span>
                        ) : (
                          <span className="badge" style={{ background: '#FEF3C7', color: '#92400E' }}>Subject Defaulter</span>
                        )}
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

export default DefaultersList;
