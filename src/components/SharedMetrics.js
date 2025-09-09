import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config/api';
import MetricCard from './MetricCard';

const SharedMetrics = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [cattleCount, setCattleCount] = useState(248); 
  const [dailyProduction, setDailyProduction] = useState(1850);
  const [todayRevenue, setTodayRevenue] = useState(45200); 
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [todayOrdersCount, setTodayOrdersCount] = useState(0);

  useEffect(() => {
    const fetchCattleData = async () => {
      if (!token) return;
      
      try {
        console.log('🔄 SharedMetrics: Fetching cattle data with showAll=true for user:', user?.role || 'normal');
        
        const res = await fetch(getApiUrl('/cattle?showAll=true'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setCattleCount(data.length);
          
          console.log('🐄 SharedMetrics: Fetched all cattle data', {
            totalCattle: data.length,
            userRole: user?.role || 'normal',
            cattleDetails: data.map(c => ({ 
              id: c.id, 
              name: c.name, 
              breed: c.breed, 
              milkProduction: c.milkProduction,
              userId: c.userId 
            }))
          });
          
        
          const totalProduction = data.reduce((sum, animal) => {
            const production = parseFloat(animal.milkProduction) || 0;
            return sum + production;
          }, 0);
          
          console.log('🥛 SharedMetrics: Total milk production calculated', {
            totalProduction: totalProduction,
            cattleWithProduction: data.filter(c => c.milkProduction > 0).length
          });
          
          setDailyProduction(totalProduction);
        }
      } catch (err) {
        console.log('Could not fetch cattle data:', err);
      }
    };

    fetchCattleData();
  }, [token, user]);

  useEffect(() => {
    const fetchRevenueData = async () => {
      if (!token) return;
      
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
        
        if (financeRes.ok && ordersRes.ok) {
          const financeData = await financeRes.json();
          const orders = await ordersRes.json();
          
          console.log('📊 SharedMetrics: Fetched data', {
            financeRecords: financeData.length,
            totalOrders: orders.length,
            userRole: user?.role || 'normal'
          });
          
          const today = new Date();
          const todayDateStr = today.toISOString().split('T')[0]; 
          
          const todayOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
            return orderDate === todayDateStr;
          });
          
          const activeOrders = orders.filter(order => 
            ['processing', 'shipped', 'pending', 'in transit'].includes(order.status?.toLowerCase())
          );
          
          const todaysOrderValue = todayOrders.reduce((sum, order) => 
            sum + (parseFloat(order.totalValue) || 0), 0
          );
          
          const todayFinanceRecords = financeData.filter(r => {
            const recordDate = new Date(r.createdAt).toISOString().split('T')[0];
            const matchesDate = recordDate === todayDateStr;
            const validStatus = ['delivered', 'shipped', 'processing'].includes(r.orderStatus?.toLowerCase());
            return matchesDate && validStatus;
          });
          
          const todaysFinanceRevenue = todayFinanceRecords.reduce((sum, record) => 
            sum + (parseFloat(record.totalValue) || 0), 0
          );
          
          const todaysRevenue = todaysFinanceRevenue > 0 ? todaysFinanceRevenue : todaysOrderValue;
          
          console.log('📈 SharedMetrics: Calculated data', {
            todayOrders: todayOrders.length,
            activeOrders: activeOrders.length,
            todayFinanceRecords: todayFinanceRecords.length,
            todaysOrderValue,
            todaysFinanceRevenue,
            todaysRevenue,
            userRole: user?.role || 'normal',
            todayOrdersDetails: todayOrders.map(o => ({ 
              id: o.id, 
              customer: o.customerName, 
              value: o.totalValue,
              date: o.createdAt 
            }))
          });
          
          setTodayRevenue(todaysRevenue);
          setActiveOrdersCount(activeOrders.length);
          setTodayOrdersCount(todayOrders.length);
        }
      } catch (err) {
        console.log('Could not fetch revenue data:', err);
      }
    };

    fetchRevenueData();
    
    const refreshInterval = setInterval(() => {
      fetchRevenueData();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [token]);

  const handleCattleClick = () => {
    navigate('/dashboard/cattle');
  };

  const handleMilkProductionClick = () => {
    navigate('/dashboard/milk-production');
  };

  const handleRevenueClick = () => {
    navigate('/dashboard/revenue');
  };

  const handleActiveOrdersClick = () => {
    navigate('/dashboard/orders');
  };

  const metrics = [
    {
      id: 'total-cattle',
      title: 'Total Cattle',
      value: cattleCount.toString(),
      trend: '+5 this month',
      trendDirection: 'up',
      icon: 'cow',
      color: '#e74c3c',
      onClick: null,
      clickable: false
    },
    {
      id: 'daily-production',
      title: 'Daily Production',
      value: `${dailyProduction.toFixed(1)}L`,
      trend: dailyProduction > 0 ? 'From cattle records' : 'No production data',
      trendDirection: 'up',
      icon: 'milk',
      color: '#f39c12',
      onClick: null,
      clickable: false
    },
    {
      id: 'today-revenue',
      title: user && user.role === 'admin' ? 'Today Revenue' : 'Today Orders Value',
      value: `₹${todayRevenue.toLocaleString('en-IN')}`,
      trend: todayRevenue > 0 ? `₹${todayRevenue.toLocaleString('en-IN')} from ${todayOrdersCount} orders` : 'No orders today',
      trendDirection: 'up',
      icon: 'money',
      color: '#9b59b6',
      onClick: null,
      clickable: false
    },
    {
      id: 'active-orders',
      title: 'Active Orders',
      value: activeOrdersCount.toString(),
      trend: `${todayOrdersCount} new today`,
      trendDirection: 'up',
      icon: 'orders',
      color: '#3498db',
      onClick: handleActiveOrdersClick,
      clickable: true
    }
  ];

  return (
    <div className="shared-metrics-section">
      <div className="dashboard-header">
        <h2 className="dashboard-title">DairyFarm Management System</h2>
      </div>
      <div className="metrics-grid">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} {...metric} />
        ))}
      </div>
    </div>
  );
};

export default SharedMetrics;
