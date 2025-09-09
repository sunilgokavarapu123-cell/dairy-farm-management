import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, Shield, Database, Settings, UserPlus, AlertCircle, Trash2 } from 'lucide-react';
import SharedMetrics from './SharedMetrics';
import { getApiUrl } from '../config/api';

const Admin = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  
  if (!user || user.role !== 'admin') {
    return (
      <main className="main-content">
        <div className="access-denied">
          <AlertCircle size={48} className="access-denied-icon" />
          <h2>Access Denied</h2>
          <p>You need administrator privileges to access this page.</p>
        </div>
      </main>
    );
  }

  
  const fetchUsers = async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await fetch(getApiUrl('/api/admin/users'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(`Could not fetch users: ${err.message}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  
  const promoteToAdmin = async (userId, userName) => {
    if (!confirm(`Are you sure you want to promote ${userName} to admin?`)) {
      return;
    }

    try {
      const response = await fetch(getApiUrl('/api/admin/assign-admin'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error(`Failed to promote user: ${response.status}`);
      }

      setSuccessMessage(`${userName} has been promoted to admin successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchUsers();
    } catch (err) {
      setError(`Could not promote user: ${err.message}`);
    }
  };

  
  const deleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone and will also delete all their orders.`)) {
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/api/admin/users/${userId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to delete user: ${response.status}`);
      }

      setSuccessMessage(`${userName} has been deleted successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchUsers(); 
    } catch (err) {
      setError(`Could not delete user: ${err.message}`);
    }
  };

  return (
    <main className="main-content">
      <SharedMetrics />
      
      <div className="admin-panel">
        <div className="admin-header">
          <div className="admin-title">
            <Shield size={24} />
            <h2>Admin Panel</h2>
          </div>
          <div className="admin-welcome">
            Welcome, {user.firstName} {user.lastName}
          </div>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="message error-message">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="message success-message">
            <Shield size={16} />
            {successMessage}
          </div>
        )}

        {/* User Management Section */}
        <div className="admin-section">
          <div className="section-header">
            <div className="section-title">
              <Users size={20} />
              <h3>User Management</h3>
            </div>
          </div>

          {loading ? (
            <div className="loading-message">Loading users...</div>
          ) : (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userData) => (
                    <tr key={userData.id}>
                      <td>{userData.id}</td>
                      <td>{userData.firstName} {userData.lastName}</td>
                      <td>{userData.email}</td>
                      <td>
                        <span className={`role-badge ${userData.role}`}>
                          {userData.role || 'user'}
                        </span>
                      </td>
                      <td>
                        <div className="user-actions">
                          {userData.role !== 'admin' ? (
                            <button 
                              className="promote-btn"
                              onClick={() => promoteToAdmin(userData.id, `${userData.firstName} ${userData.lastName}`)}
                            >
                              <UserPlus size={14} />
                              Promote to Admin
                            </button>
                          ) : (
                            <span className="admin-label">Admin User</span>
                          )}
                          
                          {userData.id !== user.id && (
                            <button 
                              className="delete-btn"
                              onClick={() => deleteUser(userData.id, `${userData.firstName} ${userData.lastName}`)}
                              title="Delete User"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {users.length === 0 && (
                <div className="no-users">
                  <Users size={32} />
                  <p>No users found</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Admin Stats */}
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{users.length}</div>
              <div className="stat-label">Total Users</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Shield size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{users.filter(u => u.role === 'admin').length}</div>
              <div className="stat-label">Admin Users</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Database size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">SQLite</div>
              <div className="stat-label">Database</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Admin;