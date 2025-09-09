
import React, { useState, useEffect } from 'react';
import { Plus, ShoppingBag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

import SharedMetrics from './SharedMetrics';
import AddOrderModal from './AddOrderModal';
import OrderManagementModal from './OrderManagementModal';
import MessagePopup from './MessagePopup';
import OrderSummary from './OrderSummary';
import { getApiUrl } from '../config/api';
import './OrdersList.css';
import { useContext } from 'react';
import { MessageContext } from '../contexts/MessageContext';

const Orders = () => {
  const { token, user } = useAuth();
  const { cart, getCartItemsCount } = useCart();
  const [showModal, setShowModal] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [showCartSummary, setShowCartSummary] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const { setMessage } = useContext(MessageContext);


  const fetchOrders = async (isAutoRefresh = false) => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    try {
      console.log(`🔄 ${isAutoRefresh ? 'Auto-refreshing' : 'Fetching'} orders data...`);
      const res = await fetch(getApiUrl('/orders'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
      const data = await res.json();
      
      console.log('📋 Orders fetched:', {
        totalOrders: data.length,
        todayOrders: data.filter(o => {
          const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
          const today = new Date().toISOString().split('T')[0];
          return orderDate === today;
        }).length,
        statusBreakdown: data.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {})
      });
      
      setOrders(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(`Could not connect to backend: ${err.message}. Make sure it is running on port 4000.`);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    
  
    const refreshInterval = setInterval(() => {
      fetchOrders(true);
    }, 25000);
    
    return () => clearInterval(refreshInterval);
  }, [token]);

  const orderVolumeData = [
    { month: 'Jan', orders: 650, target: 700 },
    { month: 'Feb', orders: 720, target: 700 },
    { month: 'Mar', orders: 800, target: 750 },
    { month: 'Apr', orders: 900, target: 800 },
    { month: 'May', orders: 850, target: 850 },
    { month: 'Jun', orders: 780, target: 900 }
  ];

  const salesTrendData = [
    { month: 'Jan', sales: 65000, target: 70000 },
    { month: 'Feb', sales: 72000, target: 75000 },
    { month: 'Mar', sales: 80000, target: 80000 },
    { month: 'Apr', sales: 95000, target: 85000 },
    { month: 'May', sales: 88000, target: 90000 },
    { month: 'Jun', sales: 85000, target: 95000 }
  ];

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleAddOrder = async (orderData) => {
    if (!token) return;
    setError('');
    try {
      const res = await fetch(getApiUrl('/orders'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      await res.json();
      fetchOrders();
      
  
      window.dispatchEvent(new CustomEvent('orderCreated'));
      
    
      const now = new Date();
  const msg = `Order confirmed for product "${orderData.product}" on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;
  setPopupMessage(msg);
  setMessage(msg);
    } catch (err) {
      setError(`Could not add order: ${err.message}`);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!token) return;
    
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }
    
    setError('');
    try {
      const res = await fetch(getApiUrl(`/orders/${orderId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      await res.json();
      fetchOrders();
      setMessage('Order deleted successfully');
    } catch (err) {
      setError(`Could not delete order: ${err.message}`);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    if (!token) return;
    
    setError('');
    try {
      const res = await fetch(getApiUrl(`/orders/${orderId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      await res.json();
      fetchOrders();
      setMessage(`Order status updated to ${newStatus}`);
    } catch (err) {
      setError(`Could not update order status: ${err.message}`);
    }
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setShowManagementModal(true);
  };

  const handleCreateNewOrder = () => {
    setEditingOrder(null);
    setShowManagementModal(true);
  };

  const handleManagementModalSubmit = async (orderData) => {
    if (editingOrder) {
      
      await handleUpdateOrderStatus(editingOrder.id, orderData.status);
    } else {
      
      await handleAddOrder(orderData);
    }
  };

  
  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(order => order.status === filterStatus);

  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return orderDate === today;
  });

  
  const activeOrders = orders.filter(o => 
    ['processing', 'shipped', 'in transit'].includes(o.status?.toLowerCase())
  );


  const orderStats = {
    total: orders.length,
    today: todayOrders.length,
    active: activeOrders.length,
    delivered: orders.filter(o => o.status?.toLowerCase() === 'delivered').length,
    todayValue: todayOrders.reduce((sum, order) => sum + (parseFloat(order.totalValue) || 0), 0)
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
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '800', 
            color: '#1f2937',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <ShoppingBag size={36} color="#3b82f6" />
            Orders Dashboard
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              color: '#3b82f6',
              fontWeight: '600'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                animation: 'pulse 2s infinite'
              }}></div>
              Live Updates
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => fetchOrders()}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1rem 2rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  opacity: loading ? 0.6 : 1,
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? '⟳' : '🔄'} {loading ? 'Refreshing...' : 'Refresh Orders'}
              </button>
            </div>
          </div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: '16px',
          padding: '1.5rem 2rem',
          border: '1px solid #e5e7eb',
          marginBottom: '1rem',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            fontSize: '0.75rem',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '2rem',
            alignItems: 'center'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '2.5rem', 
                fontWeight: '800', 
                color: loading ? '#9ca3af' : '#3b82f6', 
                marginBottom: '0.25rem',
                transition: 'color 0.3s ease'
              }}>
                {loading ? '⟳' : orderStats.today}
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Today's Orders
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981', marginBottom: '0.25rem' }}>
                {loading ? '...' : orderStats.active}
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Active Orders
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b', marginBottom: '0.25rem' }}>
                {loading ? '...' : orderStats.delivered}
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Delivered
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#8b5cf6', marginBottom: '0.25rem' }}>
                {loading ? '...' : orderStats.total}
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Total Orders
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444', marginBottom: '0.25rem' }}>
                ₹{loading ? '...' : orderStats.todayValue.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Today's Value
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {cart.length > 0 && (
        <div className="cart-summary-section">
          <div className="section-header">
            <div className="section-title-with-icon">
              <ShoppingBag size={24} />
              <h3>Order Summary ({getCartItemsCount()} items)</h3>
            </div>
            <button 
              className="toggle-summary-btn"
              onClick={() => setShowCartSummary(!showCartSummary)}
            >
              {showCartSummary ? 'Hide Summary' : 'Show Summary'}
            </button>
          </div>
          {showCartSummary && (
            <div className="cart-summary-content">
              <OrderSummary />
            </div>
          )}
        </div>
      )}
      
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
      {loading && <div>Loading orders...</div>}
      {/* Enhanced Orders List with Live Data */}
      {orders.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          marginBottom: '2rem'
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
                📋 Active Orders ({filteredOrders.length})
                {loading && <span style={{ fontSize: '1rem', color: '#3b82f6' }}>⟳</span>}
              </h3>
              <div style={{
                fontSize: '0.75rem',
                color: '#10b981',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  animation: 'pulse 2s infinite'
                }}></div>
                Live
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label htmlFor="order-status-filter" style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#6b7280' 
              }}>
                Filter:
              </label>
              <select
                id="order-status-filter"
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
                  minWidth: '140px'
                }}
              >
                <option value="all">All Orders</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="pending">Pending</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '0.875rem'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', minWidth: '150px' }}>Customer</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151', minWidth: '120px' }}>Product</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151', width: '80px' }}>Qty</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151', minWidth: '100px' }}>Value</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151', minWidth: '120px' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151', minWidth: '100px' }}>Created</th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151', width: '200px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => {
                  const isToday = new Date(order.createdAt).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                  const isActive = ['processing', 'shipped', 'pending'].includes(order.status?.toLowerCase());
                  return (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        backgroundColor: isActive
                          ? 'rgba(16, 185, 129, 0.08)' 
                          : isToday
                            ? 'rgba(59, 130, 246, 0.02)'
                            : 'transparent',
                        boxShadow: isActive ? '0 0 0 2px #10b98133' : undefined,
                        borderLeft: isActive ? '4px solid #10b981' : undefined,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <td style={{ padding: '1rem', color: '#374151', fontWeight: '500' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isToday && (
                            <span style={{ 
                              fontSize: '0.75rem', 
                              backgroundColor: '#3b82f6', 
                              color: 'white', 
                              padding: '0.125rem 0.375rem', 
                              borderRadius: '999px',
                              fontWeight: '600'
                            }}>
                              NEW
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
                          backgroundColor: 
                            order.status?.toLowerCase() === 'delivered' ? 'rgba(16, 185, 129, 0.1)' :
                            order.status?.toLowerCase() === 'shipped' ? 'rgba(59, 130, 246, 0.1)' :
                            order.status?.toLowerCase() === 'processing' ? 'rgba(245, 158, 11, 0.1)' :
                            'rgba(156, 163, 175, 0.1)',
                          color:
                            order.status?.toLowerCase() === 'delivered' ? '#10b981' :
                            order.status?.toLowerCase() === 'shipped' ? '#3b82f6' :
                            order.status?.toLowerCase() === 'processing' ? '#f59e0b' :
                            '#6b7280'
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
                          {order.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.75rem' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              borderRadius: '4px',
                              border: '1px solid #d1d5db',
                              backgroundColor: 'white',
                              cursor: 'pointer',
                              minWidth: '80px'
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <button 
                            onClick={() => handleEditOrder(order)}
                            style={{
                              padding: '0.375rem 0.5rem',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                            title="Edit order"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDeleteOrder(order.id)}
                            style={{
                              padding: '0.375rem 0.5rem',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                            title="Delete order"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="dashboard-header">
        <h2 className="dashboard-title">Orders Management</h2>
        {cart.length > 0 ? (
          <button className="add-order-btn primary" onClick={handleOpenModal}>
            <Plus size={20} /> Create Orders from Cart ({getCartItemsCount()} items)
          </button>
        ) : (
          <div className="empty-cart-message">
            <span>Add items to cart from Products section to create orders</span>
          </div>
        )}
      </div>
      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">Order Volume Trends</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orderVolumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#3b82f6" />
                <Bar dataKey="target" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-card">
          <h3 className="chart-title">Sales Trend Analysis</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Area type="monotone" dataKey="target" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <AddOrderModal isOpen={showModal} onClose={handleCloseModal} onSubmit={handleAddOrder} />
      
      <OrderManagementModal 
        isOpen={showManagementModal} 
        onClose={() => {
          setShowManagementModal(false);
          setEditingOrder(null);
        }}
        onSubmit={handleManagementModalSubmit}
        editingOrder={editingOrder}
        mode={editingOrder ? 'edit' : 'create'}
      />
      
      <MessagePopup message={popupMessage} onClose={() => setPopupMessage('')} />
    </main>
  );
};

export default Orders;
