import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../config/api';
import SharedMetrics from './SharedMetrics';
import { 
  Plus,
  Heart,
  Calendar,
  Hash,
  Activity,
  Weight,
  MapPin,
  Edit3,
  Trash2,
  Save,
  X
} from 'lucide-react';

const Cattle = () => {
  const { token, user } = useAuth();
  const [cattle, setCattle] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCattle, setEditingCattle] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    gender: '',
    age: '',
    weight: '',
    healthStatus: 'healthy',
    milkProduction: '',
    dateAcquired: '',
    notes: ''
  });

  const breeds = ['Gir', 'Jersey', 'Ongole', 'Sindhi', 'Holstein', 'Sahiwal', 'Red Sindhi', 'Other'];
  const genders = ['Male', 'Female'];
  const healthStatuses = ['Healthy', 'Sick', 'Pregnant', 'Treatment', 'Quarantine'];

  const fetchCattle = async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    try {
      const res = await fetch(getApiUrl('/cattle'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error(`Failed to fetch cattle: ${res.status}`);
      
      const data = await res.json();
      setCattle(data);
    } catch (err) {
      setError(`Could not fetch cattle: ${err.message}`);
      setCattle([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCattle();
  }, [token]);

  const handleOpenModal = (cattleToEdit = null) => {
    if (cattleToEdit) {
      setEditingCattle(cattleToEdit);
      setFormData({
        name: cattleToEdit.name || '',
        breed: cattleToEdit.breed,
        gender: cattleToEdit.gender,
        age: cattleToEdit.age || '',
        weight: cattleToEdit.weight || '',
        healthStatus: cattleToEdit.healthStatus,
        milkProduction: cattleToEdit.milkProduction || '',
        dateAcquired: cattleToEdit.dateAcquired || '',
        notes: cattleToEdit.notes || ''
      });
    } else {
      setEditingCattle(null);
      setFormData({
        name: '',
        breed: '',
        gender: '',
        age: '',
        weight: '',
        healthStatus: 'healthy',
        milkProduction: '',
        dateAcquired: '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCattle(null);
    setFormData({
      name: '',
      breed: '',
      gender: '',
      age: '',
      weight: '',
      healthStatus: 'healthy',
      milkProduction: '',
      dateAcquired: '',
      notes: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.breed || !formData.gender) {
      setError('Breed and gender are required');
      return;
    }

    try {
      const url = editingCattle 
        ? getApiUrl(`/cattle/${editingCattle.id}`)
        : getApiUrl('/cattle');
      
      const method = editingCattle ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      await res.json();
      fetchCattle();
      handleCloseModal();
    } catch (err) {
      setError(`Could not save cattle: ${err.message}`);
    }
  };

  const handleDelete = async (cattleId) => {
    if (!window.confirm('Are you sure you want to delete this cattle record?')) {
      return;
    }

    try {
      const res = await fetch(getApiUrl(`/cattle/${cattleId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      fetchCattle();
    } catch (err) {
      setError(`Could not delete cattle: ${err.message}`);
    }
  };

  const getHealthStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy': return '#10b981';
      case 'sick': return '#ef4444';
      case 'pregnant': return '#f59e0b';
      case 'treatment': return '#8b5cf6';
      case 'quarantine': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  return (
    <main className="main-content">
      <SharedMetrics />
      
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem' 
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            color: '#1f2937',
            margin: 0
          }}>
            Cattle Management
            <span style={{ 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: '#6b7280',
              marginLeft: '0.5rem' 
            }}>
              ({cattle.length} total)
            </span>
          </h2>
          {user && user.role === 'admin' && (
            <button
              onClick={() => handleOpenModal()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.875rem',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
            >
              <Plus size={16} />
              Add Cattle
            </button>
          )}
          {user && user.role !== 'admin' && (
            <div style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}>
              Read-only mode
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ 
          color: '#ef4444', 
          marginBottom: '1rem', 
          padding: '1rem', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '8px' 
        }}>
          {error}
        </div>
      )}
      
      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          color: '#6b7280' 
        }}>
          Loading cattle...
        </div>
      )}

      {!loading && cattle.length === 0 && !error && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#6b7280',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <Heart size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No cattle records found</h3>
          <p>Click "Add Cattle" to start managing your cattle.</p>
        </div>
      )}

      {!loading && cattle.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gap: '1.5rem',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))'
        }}>
          {cattle.map((animal) => (
            <div
              key={animal.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                    {animal.name || `Cattle #${animal.tagNumber}`}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <Hash size={14} color="#6b7280" />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      Tag: {animal.tagNumber}
                    </span>
                  </div>
                </div>
                {user && user.role === 'admin' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleOpenModal(animal)}
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Edit cattle"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(animal.id)}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Delete cattle"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <strong>Breed:</strong> {animal.breed}
                </div>
                <div>
                  <strong>Gender:</strong> {animal.gender}
                </div>
                {animal.age && (
                  <div>
                    <strong>Age:</strong> {animal.age} years
                  </div>
                )}
                {animal.weight && (
                  <div>
                    <strong>Weight:</strong> {animal.weight} kg
                  </div>
                )}
                <div>
                  <strong>Health:</strong> 
                  <span style={{ 
                    color: getHealthStatusColor(animal.healthStatus),
                    fontWeight: '500',
                    marginLeft: '0.25rem'
                  }}>
                    {animal.healthStatus}
                  </span>
                </div>
                {animal.milkProduction > 0 && (
                  <div>
                    <strong>Milk:</strong> {animal.milkProduction}L/day
                  </div>
                )}
              </div>

              {animal.dateAcquired && (
                <div style={{ 
                  marginTop: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #f3f4f6',
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  <Calendar size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Acquired: {new Date(animal.dateAcquired).toLocaleDateString()}
                </div>
              )}

              {user?.role === 'admin' && animal.userId && (
                <div style={{ 
                  marginTop: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#9ca3af'
                }}>
                  Owner ID: {animal.userId}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Cattle Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
                {editingCattle ? 'Edit Cattle' : 'Add New Cattle'}
              </h3>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Tag Number
                  </label>
                  <input
                    type="text"
                    value={editingCattle ? editingCattle.tagNumber : 'Auto-generated after saving'}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      backgroundColor: '#f9fafb',
                      color: '#6b7280',
                      cursor: 'not-allowed'
                    }}
                    title={editingCattle ? 'Tag number cannot be modified' : 'Tag number will be automatically generated'}
                  />
                  {!editingCattle && (
                    <p style={{ 
                      fontSize: '0.75rem', 
                      color: '#6b7280', 
                      marginTop: '0.25rem',
                      fontStyle: 'italic'
                    }}>
                      A unique tag number will be automatically assigned
                    </p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Breed *
                  </label>
                  <select
                    name="breed"
                    value={formData.breed}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Select breed</option>
                    {breeds.map(breed => (
                      <option key={breed} value={breed}>{breed}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Select gender</option>
                    {genders.map(gender => (
                      <option key={gender} value={gender}>{gender}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Age (years)
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    min="0"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    min="0"
                    step="0.1"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Health Status
                  </label>
                  <select
                    name="healthStatus"
                    value={formData.healthStatus}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  >
                    {healthStatuses.map(status => (
                      <option key={status} value={status.toLowerCase()}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Milk Production (L/day)
                  </label>
                  <input
                    type="number"
                    name="milkProduction"
                    value={formData.milkProduction}
                    onChange={handleInputChange}
                    min="0"
                    step="0.1"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Date Acquired
                </label>
                <input
                  type="date"
                  name="dateAcquired"
                  value={formData.dateAcquired}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                marginTop: '2rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #d1d5db',
                    backgroundColor: 'white',
                    color: '#374151',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Save size={16} />
                  {editingCattle ? 'Update Cattle' : 'Add Cattle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Cattle;