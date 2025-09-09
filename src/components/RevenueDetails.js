import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../config/api';
import SharedMetrics from './SharedMetrics';
import { 
  DollarSign,
  TrendingUp,
  Calendar,
  BarChart3,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';

const RevenueDetails = () => {
  const { token, user } = useAuth();
  const [financeData, setFinanceData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revenueStats, setRevenueStats] = useState({
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    totalOrders: 0,
    deliveredOrders: 0,
    processingOrders: 0,
    todayOrdersValue: 0,
    todayOrdersCount: 0
  });

  const fetchRevenueData = async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    try {
      const [financeRes, ordersRes] = await Promise.all([
        fetch(getApiUrl('/finance'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch(getApiUrl('/orders'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);
      
      if (!financeRes.ok) throw new Error(`Failed to fetch finance data: ${financeRes.status}`);
      if (!ordersRes.ok) throw new Error(`Failed to fetch orders data: ${ordersRes.status}`);
      
      const financeData = await financeRes.json();
      const ordersData = await ordersRes.json();
      
      setFinanceData(financeData);
      setOrdersData(ordersData);
      
      const stats = calculateRevenueStats(financeData, ordersData);
      setRevenueStats(stats);
    } catch (err) {
      setError(`Could not fetch revenue data: ${err.message}`);
      setFinanceData([]);
      setOrdersData([]);
    }
    setLoading(false);
  };

  const calculateRevenueStats = (financeRecords, ordersRecords) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log('📊 Revenue Calculation Debug:', {
      totalFinanceRecords: financeRecords.length,
      totalOrdersRecords: ordersRecords.length,
      today,
      sampleFinanceRecord: financeRecords[0],
      sampleOrderRecord: ordersRecords[0]
    });
    
    const todayFinanceRecords = financeRecords.filter(r => {
      const recordDate = new Date(r.createdAt).toISOString().split('T')[0];
      const matchesDate = recordDate === today;
      const validStatus = ['delivered', 'shipped', 'processing'].includes(r.orderStatus?.toLowerCase());
      return matchesDate && validStatus;
    });
    
    const weekFinanceRecords = financeRecords.filter(r => {
      const recordDate = new Date(r.createdAt).toISOString().split('T')[0];
      return recordDate >= weekAgo && ['delivered', 'shipped', 'processing'].includes(r.orderStatus?.toLowerCase());
    });
    
    const monthFinanceRecords = financeRecords.filter(r => {
      const recordDate = new Date(r.createdAt).toISOString().split('T')[0];
      return recordDate >= monthAgo && ['delivered', 'shipped', 'processing'].includes(r.orderStatus?.toLowerCase());
    });
    
    const todayOrders = ordersRecords.filter(o => {
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
      return orderDate === today;
    });
    
    const todayOrdersValue = todayOrders.reduce((sum, o) => sum + (parseFloat(o.totalValue) || 0), 0);
    const todayOrdersCount = todayOrders.length;
    
    const todayRevenue = todayFinanceRecords.reduce((sum, r) => sum + (parseFloat(r.totalValue) || 0), 0);
    const weekRevenue = weekFinanceRecords.reduce((sum, r) => sum + (parseFloat(r.totalValue) || 0), 0);
    const monthRevenue = monthFinanceRecords.reduce((sum, r) => sum + (parseFloat(r.totalValue) || 0), 0);
    
    console.log('💰 Calculated Revenue Values:', {
      todayRevenue,
      todayFinanceRecordsCount: todayFinanceRecords.length,
      todayOrdersValue,
      todayOrdersCount,
      weekRevenue,
      monthRevenue
    });
    
    return {
      todayRevenue,
      weekRevenue,
      monthRevenue,
      totalOrders: financeRecords.length,
      deliveredOrders: financeRecords.filter(r => r.orderStatus?.toLowerCase() === 'delivered').length,
      processingOrders: financeRecords.filter(r => r.orderStatus?.toLowerCase() === 'processing').length,
      todayOrdersValue: todayOrdersValue,
      todayOrdersCount: todayOrdersCount
    };
  };

  const getStatusRevenueData = () => {
    const statusStats = {};
    
    financeData.forEach(record => {
      const status = record.orderStatus?.toLowerCase() || 'unknown';
      const value = parseFloat(record.totalValue) || 0;
      
      if (!statusStats[status]) {
        statusStats[status] = { totalRevenue: 0, count: 0 };
      }
      
      statusStats[status].totalRevenue += value;
      statusStats[status].count += 1;
    });
    
    return Object.entries(statusStats).map(([status, stats]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      revenue: parseFloat(stats.totalRevenue.toFixed(2)),
      orders: stats.count,
      color: getStatusColor(status)
    })).sort((a, b) => b.revenue - a.revenue);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered': return '#10b981';
      case 'shipped': return '#3b82f6'; 
      case 'processing': return '#f59e0b';
      case 'pending': return '#8b5cf6';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered': return <CheckCircle size={16} />;
      case 'shipped': return <Package size={16} />;
      case 'processing': return <Activity size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const getDailyRevenueData = () => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRevenue = financeData
        .filter(record => {
          const recordDate = new Date(record.createdAt).toISOString().split('T')[0];
          return recordDate === dateStr && ['delivered', 'shipped', 'processing'].includes(record.orderStatus?.toLowerCase());
        })
        .reduce((sum, record) => sum + (parseFloat(record.totalValue) || 0), 0);
      
      last7Days.push({
        date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        revenue: parseFloat(dayRevenue.toFixed(2))
      });
    }
    return last7Days;
  };

  useEffect(() => {
    fetchRevenueData();
    
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing revenue data...');
      fetchRevenueData();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [token]);

  const statusRevenueData = getStatusRevenueData();
  const dailyRevenueData = getDailyRevenueData();

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
            <DollarSign size={36} color="#10b981" />
            {user && user.role === 'admin' ? 'Revenue Dashboard' : 'Spendings Dashboard'}
          </h1>
          {user && user.role === 'admin' ? (
            <button
              onClick={fetchRevenueData}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem 2rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                opacity: loading ? 0.6 : 1,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              <RefreshCw size={18} />
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 2rem',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '1rem'
            }}>
              <RefreshCw size={18} />
              Read-only mode
            </div>
          )}
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
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: '#10b981',
            fontWeight: '600'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              animation: 'pulse 2s infinite'
            }}></div>
            Live Data
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            alignItems: 'center'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '2.5rem', 
                fontWeight: '800', 
                color: loading ? '#9ca3af' : '#10b981', 
                marginBottom: '0.25rem',
                transition: 'color 0.3s ease'
              }}>
                {loading ? '⟳' : `₹${revenueStats.todayRevenue.toLocaleString('en-IN')}`}
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {user && user.role === 'admin' ? "Today's Revenue" : "Today's Spendings"}
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6', marginBottom: '0.25rem' }}>
                {loading ? '...' : revenueStats.todayOrdersCount}
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Orders Today
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b', marginBottom: '0.25rem' }}>
                ₹{loading ? '...' : revenueStats.weekRevenue.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {user && user.role === 'admin' ? 'Week Revenue' : 'Week Spendings'}
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#8b5cf6', marginBottom: '0.25rem' }}>
                ₹{loading ? '...' : revenueStats.monthRevenue.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {user && user.role === 'admin' ? 'Month Revenue' : 'Month Spendings'}
              </div>
            </div>
          </div>
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

      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          backgroundColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          padding: '3rem 2rem',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(16, 185, 129, 0.4), 0 8px 32px rgba(16, 185, 129, 0.3)',
          border: '3px solid #10b981',
          color: 'white',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          transform: 'translateY(-5px)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
            opacity: 0.8
          }}></div>
          
          <div style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            padding: '0.75rem',
            borderRadius: '50%',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
          }}>
            <DollarSign size={28} />
          </div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ 
              margin: '0 0 1.5rem 0', 
              fontSize: '1.75rem', 
              fontWeight: '700', 
              color: 'white',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              {user && user.role === 'admin' ? "💰 TODAY'S REVENUE" : "💸 TODAY'S SPENDINGS"}
            </h2>
            
            <div style={{ 
              fontSize: '5rem', 
              fontWeight: '900', 
              color: 'white',
              textShadow: '3px 3px 6px rgba(0, 0, 0, 0.4)',
              marginBottom: '1rem',
              lineHeight: '1',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              ₹{loading ? '...' : revenueStats.todayRevenue.toLocaleString('en-IN')}
            </div>
            
            <div style={{
              fontSize: '1.2rem',
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: '600',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
              marginBottom: '0.5rem'
            }}>
              {new Date().toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            
            <div style={{
              fontSize: '1rem',
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: '500',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                🎯 {loading ? '...' : revenueStats.todayOrdersCount} Orders Today
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                💼 ₹{loading ? '...' : revenueStats.todayOrdersValue.toLocaleString('en-IN')} Order Value
              </span>
              <span>•</span>
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem',
                fontSize: '0.85rem',
                opacity: 0.7
              }}>
                ⚡ Live Data
              </span>
            </div>
          </div>
        </div>
      </div>

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
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ 
              backgroundColor: '#3b82f6', 
              padding: '0.5rem', 
              borderRadius: '8px',
              color: 'white'
            }}>
              <Calendar size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
              Week Revenue
            </h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
            ₹{revenueStats.weekRevenue.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ 
              backgroundColor: '#f59e0b', 
              padding: '0.5rem', 
              borderRadius: '8px',
              color: 'white'
            }}>
              <TrendingUp size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
              Month Revenue
            </h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
            ₹{revenueStats.monthRevenue.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ 
              backgroundColor: '#3b82f6', 
              padding: '0.5rem', 
              borderRadius: '8px',
              color: 'white'
            }}>
              <Calendar size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
              Week Revenue
            </h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
            ₹{revenueStats.weekRevenue.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ 
              backgroundColor: '#f59e0b', 
              padding: '0.5rem', 
              borderRadius: '8px',
              color: 'white'
            }}>
              <TrendingUp size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
              Month Revenue
            </h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
            ₹{revenueStats.monthRevenue.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ 
              backgroundColor: '#8b5cf6', 
              padding: '0.5rem', 
              borderRadius: '8px',
              color: 'white'
            }}>
              <CheckCircle size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
              Delivered Orders
            </h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
            {revenueStats.deliveredOrders}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0 0 0' }}>
            of {revenueStats.totalOrders} total orders
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ 
              backgroundColor: '#ef4444', 
              padding: '0.5rem', 
              borderRadius: '8px',
              color: 'white'
            }}>
              <Package size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
              Today's Order Value
            </h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
            ₹{revenueStats.todayOrdersValue.toLocaleString('en-IN')}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0 0 0' }}>
            {revenueStats.todayOrdersCount} orders created today
          </p>
        </div>
      </div>

      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          color: '#6b7280' 
        }}>
          Loading revenue data...
        </div>
      )}

      {!loading && financeData.length === 0 && !error && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#6b7280',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <DollarSign size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No {user && user.role === 'admin' ? 'revenue' : 'spending'} data found</h3>
          <p>Add financial records to see {user && user.role === 'admin' ? 'revenue' : 'spending'} statistics.</p>
        </div>
      )}

      {!loading && financeData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ 
              margin: '0 0 1.5rem 0', 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <TrendingUp size={20} />
{user && user.role === 'admin' ? 'Daily Revenue (Last 7 Days)' : 'Daily Spendings (Last 7 Days)'}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value}`, user && user.role === 'admin' ? 'Revenue' : 'Spendings']} />
                <Line type="monotone" dataKey="revenue" stroke="#9b59b6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ 
              margin: '0 0 1.5rem 0', 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <BarChart3 size={20} />
{user && user.role === 'admin' ? 'Revenue by Status' : 'Spendings by Status'}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? `₹${value}` : value,
                    name === 'revenue' ? (user && user.role === 'admin' ? 'Revenue' : 'Spendings') : 'Orders'
                  ]}
                />
                <Bar dataKey="revenue" fill="#9b59b6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {!loading && financeData.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ 
            margin: '0 0 1.5rem 0', 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Activity size={20} />
{user && user.role === 'admin' ? 'Recent Revenue Records' : 'Recent Spending Records'}
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Customer</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Product</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Qty</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Rate</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Total</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {financeData
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .slice(0, 10)
                  .map((record) => (
                    <tr key={record.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem', color: '#374151' }}>
                        {record.customerName}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                        {record.productName}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', color: '#6b7280' }}>
                        {record.quantity}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#6b7280' }}>
                        ₹{record.productRate}
                      </td>
                      <td style={{ 
                        padding: '0.75rem', 
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#10b981'
                      }}>
                        ₹{parseFloat(record.totalValue).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: `${getStatusColor(record.orderStatus)}20`,
                          color: getStatusColor(record.orderStatus)
                        }}>
                          {getStatusIcon(record.orderStatus)}
                          {record.orderStatus}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        {new Date(record.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
};

export default RevenueDetails;