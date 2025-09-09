import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../config/api';
import SharedMetrics from './SharedMetrics';
import FeedConsumptionChart from './FeedConsumptionChart';
import CattleBreedChart from './CattleBreedChart';
import { ShoppingBag, TrendingUp, Clock, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const { token } = useAuth();
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  
  const fetchRecentOrders = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/orders'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const orders = await res.json();
        
        
        const activeOrders = orders
          .filter(order => ['processing', 'shipped', 'pending'].includes(order.status?.toLowerCase()))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        
        setRecentOrders(activeOrders);
      }
    } catch (err) {
      console.log('Could not fetch recent orders:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecentOrders();
    
    
    const interval = setInterval(fetchRecentOrders, 30000);
    return () => clearInterval(interval);
  }, [token]);

  
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'processing': return '#f59e0b';
      case 'shipped': return '#3b82f6';
      case 'pending': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <main className="main-content">
      <SharedMetrics />
      
      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">Feed Consumption Trends</h3>
          <div className="chart-container">
            <FeedConsumptionChart />
          </div>
        </div>
        
        <div className="chart-card">
          <h3 className="chart-title">Cattle Breed Distribution</h3>
          <div className="chart-container">
            <CattleBreedChart />
          </div>
        </div>
      </div>

      {/* Recent Active Orders Preview */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        marginTop: '2rem',
        overflow: 'hidden'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <ShoppingBag size={24} color="#3498db" />
            Recent Active Orders
            {loading && <span style={{ fontSize: '1rem', color: '#3498db' }}>⟳</span>}
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
            Live Updates
          </div>
        </div>
        
        <div style={{ padding: '0' }}>
          {recentOrders.length === 0 ? (
            <div style={{ 
              padding: '2rem', 
              textAlign: 'center', 
              color: '#6b7280',
              fontSize: '1rem'
            }}>
              {loading ? 'Loading recent orders...' : 'No active orders found'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '0.875rem'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Customer</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Product</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Qty</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Value</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, index) => (
                    <tr 
                      key={order.id}
                      style={{ 
                        borderBottom: index < recentOrders.length - 1 ? '1px solid #f3f4f6' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <td style={{ padding: '0.75rem', color: '#374151', fontWeight: '500' }}>
                        {order.customerName}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#6b7280', fontWeight: '500' }}>
                        {order.product || order.productName}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', color: '#6b7280', fontWeight: '600' }}>
                        {order.quantity}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#374151', fontWeight: '600' }}>
                        ₹{parseFloat(order.totalValue || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textTransform: 'capitalize',
                          backgroundColor: `${getStatusColor(order.status)}20`,
                          color: getStatusColor(order.status)
                        }}>
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: 'currentColor',
                            animation: 'pulse 2s infinite'
                          }}></div>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Dashboard; 