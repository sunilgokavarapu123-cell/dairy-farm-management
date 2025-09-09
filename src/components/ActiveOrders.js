import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../config/api';
import { 
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  Package,
  AlertCircle,
  RefreshCw,
  TrendingUp
} from 'lucide-react';

const ActiveOrders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState('active');


  const fetchOrders = async (isAutoRefresh = false) => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    try {
      console.log(`🔄 ${isAutoRefresh ? 'Auto-refreshing' : 'Fetching'} active orders...`);
      const res = await fetch(getApiUrl('/orders'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
      const data = await res.json();
      
      console.log('📋 Active Orders: Fetched data', {
        totalOrders: data.length,
        activeOrders: data.filter(o => ['processing', 'shipped', 'pending'].includes(o.status?.toLowerCase())).length,
        todayOrders: data.filter(o => {
          const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
          const today = new Date().toISOString().split('T')[0];
          return orderDate === today;
        }).length
      });
      
      setOrders(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(`Could not connect to backend: ${err.message}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    
  
    const refreshInterval = setInterval(() => {
      fetchOrders(true);
    }, 20000);
    
    return () => clearInterval(refreshInterval);
  }, [token]);

  
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'processing': return <Clock size={16} />;
      case 'shipped': return <Truck size={16} />;
      case 'delivered': return <CheckCircle size={16} />;
      case 'pending': return <AlertCircle size={16} />;
      default: return <Package size={16} />;
    }
  };

  
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'processing': return '#f59e0b';
      case 'shipped': return '#3b82f6';
      case 'delivered': return '#10b981';
      case 'pending': return '#8b5cf6';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  
  const filteredOrders = filterStatus === 'all' 
    ? orders
    : filterStatus === 'active'
    ? orders.filter(order => ['processing', 'shipped', 'pending'].includes(order.status?.toLowerCase()))
    : orders.filter(order => order.status?.toLowerCase() === filterStatus);

  
  const stats = {
    total: orders.length,
    active: orders.filter(o => ['processing', 'shipped', 'pending'].includes(o.status?.toLowerCase())).length,
    today: orders.filter(o => {
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      return orderDate === today;
    }).length,
    delivered: orders.filter(o => o.status?.toLowerCase() === 'delivered').length,
    processing: orders.filter(o => o.status?.toLowerCase() === 'processing').length,
    shipped: orders.filter(o => o.status?.toLowerCase() === 'shipped').length
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem' 
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '800', 
          color: '#1f2937',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <ShoppingBag size={36} color="#3498db" />
          Active Orders Management
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: '#3498db',
            fontWeight: '600'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#3498db',
              animation: 'pulse 2s infinite'
            }}></div>
            Auto-refresh: 20s
          </div>
          <button
            onClick={() => fetchOrders()}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 2rem',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              opacity: loading ? 0.6 : 1,
              boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            <RefreshCw size={18} />
            {loading ? 'Refreshing...' : 'Refresh Now'}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#3498db', marginBottom: '0.5rem' }}>
            {loading ? '⟳' : stats.active}
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
            Active Orders
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b', marginBottom: '0.5rem' }}>
            {loading ? '...' : stats.processing}
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
            Processing
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6', marginBottom: '0.5rem' }}>
            {loading ? '...' : stats.shipped}
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
            Shipped
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981', marginBottom: '0.5rem' }}>
            {loading ? '...' : stats.today}
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
            Today's Orders
          </div>
        </div>
      </div>

      {/* Filter and Orders List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📋 Orders List ({filteredOrders.length})
              {loading && <span style={{ fontSize: '1rem', color: '#3498db' }}>⟳</span>}
            </h3>
            <div style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              Updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>
              Filter:
            </label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                cursor: 'pointer',
                minWidth: '120px'
              }}
            >
              <option value="active">Active Only</option>
              <option value="all">All Orders</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="pending">Pending</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>

        {error && (
          <div style={{ 
            color: '#ef4444', 
            padding: '1rem',
            backgroundColor: '#fef2f2',
            borderBottom: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '0.875rem'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Customer</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Product</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Qty</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Value</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ 
                    padding: '3rem', 
                    textAlign: 'center', 
                    color: '#6b7280',
                    fontSize: '1rem'
                  }}>
                    {loading ? 'Loading orders...' : 'No orders found'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, index) => {
                  const isToday = new Date(order.createdAt).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                  const isActive = ['processing', 'shipped', 'pending'].includes(order.status?.toLowerCase());
                  
                  return (
                    <tr 
                      key={order.id}
                      style={{ 
                        borderBottom: '1px solid #f3f4f6',
                        backgroundColor: isToday ? 'rgba(52, 152, 219, 0.02)' : 'transparent',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <td style={{ padding: '1rem', color: '#374151', fontWeight: '500' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isToday && (
                            <span style={{ 
                              fontSize: '0.75rem', 
                              backgroundColor: '#3498db', 
                              color: 'white', 
                              padding: '0.125rem 0.375rem', 
                              borderRadius: '999px',
                              fontWeight: '600'
                            }}>
                              TODAY
                            </span>
                          )}
                          {order.customerName}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', color: '#6b7280', fontWeight: '500' }}>
                        {order.product || order.productName}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontWeight: '600' }}>
                        {order.quantity}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: '#374151', fontWeight: '600' }}>
                        ₹{parseFloat(order.totalValue || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textTransform: 'capitalize',
                          backgroundColor: `${getStatusColor(order.status)}20`,
                          color: getStatusColor(order.status)
                        }}>
                          {isActive && (
                            <div style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: 'currentColor',
                              animation: 'pulse 2s infinite'
                            }}></div>
                          )}
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.75rem' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActiveOrders;