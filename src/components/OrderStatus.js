import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../config/api';
import SharedMetrics from './SharedMetrics';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Package, 
  Truck, 
  Calendar,
  User,
  DollarSign,
  Hash,
  Edit3,
  Save,
  X,
  RefreshCw
} from 'lucide-react';

const OrderStatus = () => {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingOrder, setEditingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const statusConfig = {
    pending: {
      icon: Clock,
      color: '#f59e0b',
      bgColor: '#fef3c7',
      label: 'Pending'
    },
    processing: {
      icon: Package,
      color: '#3b82f6',
      bgColor: '#dbeafe',
      label: 'Processing'
    },
    shipped: {
      icon: Truck,
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      label: 'Shipped'
    },
    delivered: {
      icon: CheckCircle,
      color: '#10b981',
      bgColor: '#d1fae5',
      label: 'Delivered'
    },
    cancelled: {
      icon: XCircle,
      color: '#ef4444',
      bgColor: '#fee2e2',
      label: 'Cancelled'
    }
  };

  const fetchOrders = async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    try {
      const res = await fetch(getApiUrl('/orders'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
      
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      setError(`Could not fetch orders: ${err.message}`);
      setOrders([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const startEditing = (order) => {
    setEditingOrder(order.id);
    setNewStatus(order.status);
  };

  const cancelEditing = () => {
    setEditingOrder(null);
    setNewStatus('');
  };

  const updateOrderStatus = async (orderId) => {
    if (!newStatus) return;
    
    setUpdating(true);
    try {
      const res = await fetch(getApiUrl(`/orders/${orderId}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) {
        throw new Error(`Failed to update order: ${res.status}`);
      }
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      setEditingOrder(null);
      setNewStatus('');
      
    } catch (err) {
      setError(`Could not update order status: ${err.message}`);
    }
    setUpdating(false);
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }
    
    try {
      const res = await fetch(getApiUrl(`/orders/${orderId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error(`Failed to delete order: ${res.status}`);
      }
      
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      
    } catch (err) {
      setError(`Could not delete order: ${err.message}`);
    }
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  const getStatusIcon = (status) => {
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    return <IconComponent size={20} />;
  };

  const getStatusStyle = (status) => {
    const config = statusConfig[status] || statusConfig.pending;
    return {
      color: config.color,
      backgroundColor: config.bgColor,
      border: `1px solid ${config.color}20`
    };
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getPieChartData = () => {
    const statusCounts = {};
    
    Object.keys(statusConfig).forEach(status => {
      statusCounts[status] = 0;
    });
    
    orders.forEach(order => {
      if (statusCounts.hasOwnProperty(order.status)) {
        statusCounts[order.status]++;
      }
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: statusConfig[status].label,
      value: count,
      color: statusConfig[status].color,
      percentage: orders.length > 0 ? ((count / orders.length) * 100).toFixed(1) : 0
    })).filter(item => item.value > 0);
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
            Order Status Management
          </h2>
          <button
            onClick={fetchOrders}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: loading ? '#f3f4f6' : '#3b82f6',
              color: loading ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              fontSize: '0.875rem',
              transition: 'background-color 0.2s'
            }}
          >
            <RefreshCw size={16} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          flexWrap: 'wrap',
          marginBottom: '2rem' 
        }}>
          <button
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: statusFilter === 'all' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
              backgroundColor: statusFilter === 'all' ? '#eff6ff' : 'white',
              color: statusFilter === 'all' ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            All Orders ({orders.length})
          </button>
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = orders.filter(order => order.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: statusFilter === status ? `2px solid ${config.color}` : '1px solid #e5e7eb',
                  backgroundColor: statusFilter === status ? config.bgColor : 'white',
                  color: statusFilter === status ? config.color : '#6b7280',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {getStatusIcon(status)}
                {config.label} ({count})
              </button>
            );
          })}
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
          Loading orders...
        </div>
      )}

      {!loading && filteredOrders.length === 0 && !error && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#6b7280',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No orders found</h3>
          <p>
            {statusFilter === 'all' 
              ? 'No orders have been placed yet.' 
              : `No orders with status "${statusConfig[statusFilter]?.label || statusFilter}" found.`
            }
          </p>
        </div>
      )}

      {!loading && filteredOrders.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gap: '1.5rem',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          marginBottom: '2rem'
        }}>
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Hash size={16} color="#6b7280" />
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>
                    Order #{order.id}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div 
                    style={{
                      ...getStatusStyle(order.status),
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {getStatusIcon(order.status)}
                    {statusConfig[order.status]?.label || order.status}
                  </div>
                  {editingOrder !== order.id && (
                    <button
                      onClick={() => startEditing(order)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        padding: '0.25rem',
                        cursor: 'pointer',
                        color: '#6b7280'
                      }}
                      title="Edit status"
                    >
                      <Edit3 size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteOrder(order.id)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #ef4444',
                      borderRadius: '4px',
                      padding: '0.25rem',
                      cursor: 'pointer',
                      color: '#ef4444'
                    }}
                    title="Delete order"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {editingOrder === order.id && (
                <div style={{ 
                  marginBottom: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                      disabled={updating}
                    >
                      {Object.entries(statusConfig).map(([status, config]) => (
                        <option key={status} value={status}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => updateOrderStatus(order.id)}
                      disabled={updating}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.5rem',
                        cursor: updating ? 'not-allowed' : 'pointer',
                        opacity: updating ? 0.6 : 1
                      }}
                      title="Save changes"
                    >
                      <Save size={14} />
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={updating}
                      style={{
                        background: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.5rem',
                        cursor: updating ? 'not-allowed' : 'pointer',
                        opacity: updating ? 0.6 : 1
                      }}
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <Package size={16} color="#6b7280" />
                  <span style={{ fontWeight: '500', color: '#374151' }}>
                    {order.product}
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <User size={16} color="#6b7280" />
                  <span style={{ color: '#6b7280' }}>
                    {order.customerName}
                  </span>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '1rem'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem'
                  }}>
                    <DollarSign size={16} color="#6b7280" />
                    <span style={{ fontWeight: '500', color: '#374151' }}>
                      Qty: {order.quantity} | Total: ₹{(order.totalValue || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid #f3f4f6',
                color: '#6b7280',
                fontSize: '0.875rem'
              }}>
                <Calendar size={14} />
                <span>Ordered: {formatDate(order.created_at || order.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          marginTop: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            color: '#1f2937',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            Order Status Distribution
          </h3>
          <div style={{ 
            height: '300px', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getPieChartData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  label={({name, percentage}) => `${name}: ${percentage}%`}
                >
                  {getPieChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </main>
  );
};

export default OrderStatus;