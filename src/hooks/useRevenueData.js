import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../config/api';

export const useRevenueData = (refreshInterval = 30000) => {
  const { token } = useAuth();
  const [revenueStats, setRevenueStats] = useState({
    todayRevenue: 0,
    todayOrdersValue: 0,
    todayOrdersCount: 0,
    loading: true,
    error: null
  });

  const calculateRevenueStats = (financeRecords, ordersRecords) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Finance data calculations (today's revenue)
    const todayFinanceRecords = financeRecords.filter(r => {
      const recordDate = new Date(r.createdAt).toISOString().split('T')[0];
      return recordDate === today && ['delivered', 'shipped', 'processing'].includes(r.orderStatus?.toLowerCase());
    });
    
    // Today's orders calculations
    const todayOrders = ordersRecords.filter(o => {
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
      return orderDate === today;
    });
    
    const todayOrdersValue = todayOrders.reduce((sum, o) => sum + (parseFloat(o.totalValue) || 0), 0);
    const todayOrdersCount = todayOrders.length;
    const todayRevenue = todayFinanceRecords.reduce((sum, r) => sum + (parseFloat(r.totalValue) || 0), 0);
    
    return {
      todayRevenue,
      todayOrdersValue,
      todayOrdersCount,
      loading: false,
      error: null
    };
  };

  const fetchRevenueData = async () => {
    if (!token) {
      setRevenueStats(prev => ({ ...prev, loading: false, error: 'No token available' }));
      return;
    }
    
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
      
      if (!financeRes.ok || !ordersRes.ok) {
        throw new Error(`API Error: Finance(${financeRes.status}) Orders(${ordersRes.status})`);
      }
      
      const financeData = await financeRes.json();
      const ordersData = await ordersRes.json();
      
      const stats = calculateRevenueStats(financeData, ordersData);
      setRevenueStats(stats);
    } catch (err) {
      setRevenueStats(prev => ({
        ...prev,
        loading: false,
        error: err.message
      }));
    }
  };

  useEffect(() => {
    fetchRevenueData();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchRevenueData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [token, refreshInterval]);

  return {
    ...revenueStats,
    refresh: fetchRevenueData
  };
};