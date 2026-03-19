import React, { useEffect, useState } from 'react';
import { MdAdd, MdEdit, MdDelete, MdClose } from 'react-icons/md';
import api from '../../api';

const initialForm = { name: '', roll_number: '', className: '', section: '', username: '', password: '' };

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/students');
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const openAddModal = () => {
    setEditMode(false);
    setFormData(initialForm);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setEditMode(true);
    setEditId(student.id);
    setFormData({
      name: student.name,
      roll_number: student.roll_number,
      className: student.class,
      section: student.section,
      username: student.username || '',
      password: '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editMode) {
        await api.put(`/students/${editId}`, formData);
      } else {
        await api.post('/students', formData);
      }
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student? This will also remove their attendance records.')) return;
    try {
      await api.delete(`/students/${id}`);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete student');
    }
  };

  return (
    <div>
      <div className="top-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Manage Students</h1>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Add, edit, and remove student records</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <MdAdd /> Add Student
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        {loading ? <p>Loading students...</p> : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Roll No.</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Username</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No students found. Click "Add Student" to get started.
                  </td></tr>
                ) : students.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td>{s.roll_number}</td>
                    <td>{s.class}</td>
                    <td>{s.section}</td>
                    <td>{s.username}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-icon" title="Edit" onClick={() => openEditModal(s)}>
                          <MdEdit />
                        </button>
                        <button className="btn btn-icon" title="Delete"
                          style={{ color: 'var(--danger)' }} onClick={() => handleDelete(s.id)}>
                          <MdDelete />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: 500, padding: '2rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{editMode ? 'Edit Student' : 'Add New Student'}</h2>
              <button className="btn btn-icon" onClick={() => setShowModal(false)}><MdClose /></button>
            </div>

            {formError && <div className="error-message">{formError}</div>}

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" required placeholder="e.g. John Doe"
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Roll Number *</label>
                  <input className="form-input" required placeholder="e.g. 2024001"
                    value={formData.roll_number} onChange={e => setFormData({ ...formData, roll_number: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Class *</label>
                  <input className="form-input" required placeholder="e.g. 10"
                    value={formData.className} onChange={e => setFormData({ ...formData, className: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Section *</label>
                  <input className="form-input" required placeholder="e.g. A"
                    value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })} />
                </div>
                {!editMode && (
                  <>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Username *</label>
                      <input className="form-input" required placeholder="Student login ID"
                        value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Password *</label>
                      <input className="form-input" type="password" required placeholder="Initial password"
                        value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setShowModal(false)}
                  style={{ background: 'var(--background)', color: 'var(--text-muted)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editMode ? 'Save Changes' : 'Add Student')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStudents;
