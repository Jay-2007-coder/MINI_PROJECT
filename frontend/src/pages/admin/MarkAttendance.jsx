import React, { useEffect, useState } from 'react';
import { MdSave, MdCalendarToday } from 'react-icons/md';
import api from '../../api';

const MarkAttendance = () => {
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState('Mathematics');
  const [lectureNumber, setLectureNumber] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const subjects = ['Mathematics', 'Science', 'English', 'History', 'Physics', 'Chemistry', 'Computer Science'];

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data } = await api.get('/students');
        setStudents(data);
        // Default all to Present
        const defaults = {};
        data.forEach(s => { defaults[s.id] = 'Present'; });
        setAttendance(defaults);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  // Fetch existing attendance when date, subject, or lecture changes
  useEffect(() => {
    if (!date || !subject) return;
    const fetchExisting = async () => {
      try {
        let url = `/attendance?date=${date}&subject=${subject}`;
        if (lectureNumber) url += `&lectureNumber=${lectureNumber}`;
        const { data } = await api.get(url);
        
        // Reset states first
        const defaults = {};
        students.forEach(s => { defaults[s.id] = 'Present'; });
        setAttendance(defaults);
        setStartTime('');
        setEndTime('');

        if (data.length > 0) {
          const existing = {};
          let foundStart = '';
          let foundEnd = '';
          data.forEach(r => { 
            existing[r.student_id] = r.status;
            if (r.startTime && !foundStart) foundStart = r.startTime;
            if (r.endTime && !foundEnd) foundEnd = r.endTime;
          });
          setAttendance(prev => ({ ...prev, ...existing }));
          if (foundStart) setStartTime(foundStart);
          if (foundEnd) setEndTime(foundEnd);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (students.length > 0) fetchExisting();
  }, [date, subject, lectureNumber, students.length]);

  const toggleStatus = (id) => {
    setAttendance(prev => ({ ...prev, [id]: prev[id] === 'Present' ? 'Absent' : 'Present' }));
  };

  const markAll = (status) => {
    const all = {};
    students.forEach(s => { all[s.id] = status; });
    setAttendance(all);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setSavedMsg('');
    try {
      const attendanceList = students.map(s => ({ student_id: s.id, status: attendance[s.id] || 'Absent' }));
      await api.post('/attendance', { date, startTime, endTime, subject, lectureNumber, attendanceList });
      setSavedMsg('✓ Attendance saved successfully!');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      setSavedMsg('Error saving attendance: ' + (err.response?.data?.message || 'Server error'));
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendance).filter(v => v === 'Present').length;
  const absentCount = students.length - presentCount;

  return (
    <div>
      <div className="top-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Mark Attendance</h1>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Mark daily attendance for all students</p>
        </div>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || students.length === 0}>
          <MdSave /> {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      {savedMsg && (
        <div style={{
          padding: '0.75rem 1rem', marginBottom: '1rem',
          background: savedMsg.startsWith('✓') ? '#D1FAE5' : '#FEE2E2',
          color: savedMsg.startsWith('✓') ? '#065F46' : '#991B1B',
          borderRadius: 8, fontWeight: 600, fontSize: '0.875rem'
        }}>
          {savedMsg}
        </div>
      )}

      {/* Controls */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MdCalendarToday /> Date
            </label>
            <input type="date" className="form-input" value={date}
              onChange={e => setDate(e.target.value)} style={{ minWidth: 180 }} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              Subject
            </label>
            <select className="form-input" value={subject} onChange={e => setSubject(e.target.value)} style={{ minWidth: 150 }}>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              Lecture No. (Optional)
            </label>
            <input type="text" className="form-input" value={lectureNumber} placeholder="e.g. 1"
              onChange={e => setLectureNumber(e.target.value)} style={{ width: 140 }} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              From Time
            </label>
            <input type="time" className="form-input" value={startTime}
              onChange={e => setStartTime(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              To Time
            </label>
            <input type="time" className="form-input" value={endTime}
              onChange={e => setEndTime(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn" onClick={() => markAll('Present')}
              style={{ background: '#D1FAE5', color: '#065F46' }}>All Present</button>
            <button className="btn" onClick={() => markAll('Absent')}
              style={{ background: '#FEE2E2', color: '#991B1B' }}>All Absent</button>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginLeft: 'auto' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#10B981' }}>{presentCount}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Present</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#EF4444' }}>{absentCount}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Absent</div>
            </div>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        {loading ? <p>Loading students...</p> : students.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
            No students found. Add students first.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {students.map(student => {
              const isPresent = attendance[student.id] === 'Present';
              return (
                <div
                  key={student.id}
                  onClick={() => toggleStatus(student.id)}
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: 10,
                    border: `2px solid ${isPresent ? '#10B981' : '#EF4444'}`,
                    background: isPresent ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{student.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {student.roll_number} · Class {student.class}-{student.section}
                    </div>
                  </div>
                  <span className={`badge ${isPresent ? 'badge-success' : 'badge-danger'}`}>
                    {isPresent ? 'Present' : 'Absent'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkAttendance;
