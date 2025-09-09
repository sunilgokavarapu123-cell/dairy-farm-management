import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../config/api';
import SharedMetrics from './SharedMetrics';
import { 
  Milk,
  TrendingUp,
  Calendar,
  BarChart3,
  Droplets,
  Activity,
  Users,
  Target
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const MilkProduction = () => {
  const { token, user } = useAuth();
  const [cattleData, setCattleData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [productionStats, setProductionStats] = useState({
    totalDaily: 0,
    totalWeekly: 0,
    totalMonthly: 0,
    averagePerCattle: 0,
    producingCattle: 0,
    totalCattle: 0
  });


  const fetchMilkProductionData = async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    try {
      const res = await fetch(getApiUrl('/cattle'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error(`Failed to fetch cattle data: ${res.status}`);
      
      const data = await res.json();
      setCattleData(data);
      
      
      const stats = calculateProductionStats(data);
      setProductionStats(stats);
    } catch (err) {
      setError(`Could not fetch milk production data: ${err.message}`);
      setCattleData([]);
    }
    setLoading(false);
  };

  
  const calculateProductionStats = (cattle) => {
    const totalDaily = cattle.reduce((sum, animal) => {
      const production = parseFloat(animal.milkProduction) || 0;
      return sum + production;
    }, 0);
    
    const producingCattle = cattle.filter(animal => 
      parseFloat(animal.milkProduction) > 0
    ).length;
    
    const averagePerCattle = producingCattle > 0 ? totalDaily / producingCattle : 0;
    
    return {
      totalDaily: totalDaily,
      totalWeekly: totalDaily * 7,
      totalMonthly: totalDaily * 30,
      averagePerCattle: averagePerCattle,
      producingCattle: producingCattle,
      totalCattle: cattle.length
    };
  };

  
  const getBreedProductionData = () => {
    const breedStats = {};
    
    cattleData.forEach(animal => {
      const breed = animal.breed || 'Other';
      const production = parseFloat(animal.milkProduction) || 0;
      
      if (!breedStats[breed]) {
        breedStats[breed] = { totalProduction: 0, count: 0 };
      }
      
      breedStats[breed].totalProduction += production;
      breedStats[breed].count += 1;
    });
    
    return Object.entries(breedStats).map(([breed, stats]) => ({
      breed,
      totalProduction: parseFloat(stats.totalProduction.toFixed(2)),
      averageProduction: parseFloat((stats.totalProduction / stats.count).toFixed(2)),
      cattleCount: stats.count
    })).sort((a, b) => b.totalProduction - a.totalProduction);
  };

  
  const getProductionRangeData = () => {
    const ranges = [
      { range: '0L', min: 0, max: 0, color: '#9ca3af' },
      { range: '0.1-5L', min: 0.1, max: 5, color: '#ef4444' },
      { range: '5.1-10L', min: 5.1, max: 10, color: '#f59e0b' },
      { range: '10.1-15L', min: 10.1, max: 15, color: '#3b82f6' },
      { range: '15.1-20L', min: 15.1, max: 20, color: '#10b981' },
      { range: '20L+', min: 20.1, max: Infinity, color: '#8b5cf6' }
    ];
    
    return ranges.map(range => {
      const count = cattleData.filter(animal => {
        const production = parseFloat(animal.milkProduction) || 0;
        return production >= range.min && production <= range.max;
      }).length;
      
      return {
        name: range.range,
        value: count,
        color: range.color
      };
    }).filter(item => item.value > 0);
  };

  useEffect(() => {
    fetchMilkProductionData();
  }, [token]);

  const breedProductionData = getBreedProductionData();
  const productionRangeData = getProductionRangeData();

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
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Milk size={24} color="#10b981" />
            Milk Production Dashboard
          </h2>
          {user && user.role === 'admin' ? (
            <button
              onClick={fetchMilkProductionData}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                fontSize: '0.875rem',
                opacity: loading ? 0.6 : 1
              }}
            >
              <Activity size={16} />
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}>
              <Activity size={16} />
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

      {/* Production Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
              backgroundColor: '#10b981', 
              padding: '0.5rem', 
              borderRadius: '8px',
              color: 'white'
            }}>
              <Droplets size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
              Daily Production
            </h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
            {productionStats.totalDaily.toFixed(1)}L
          </div>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0 0 0' }}>
            From {productionStats.producingCattle} producing cattle
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
              backgroundColor: '#3b82f6', 
              padding: '0.5rem', 
              borderRadius: '8px',
              color: 'white'
            }}>
              <Calendar size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
              Weekly Production
            </h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
            {productionStats.totalWeekly.toFixed(0)}L
          </div>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0 0 0' }}>
            7-day projection
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
              backgroundColor: '#f59e0b', 
              padding: '0.5rem', 
              borderRadius: '8px',
              color: 'white'
            }}>
              <TrendingUp size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
              Average per Cattle
            </h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
            {productionStats.averagePerCattle.toFixed(1)}L
          </div>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0 0 0' }}>
            Per producing cattle/day
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
              backgroundColor: '#8b5cf6', 
              padding: '0.5rem', 
              borderRadius: '8px',
              color: 'white'
            }}>
              <Target size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
              Production Rate
            </h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
            {productionStats.totalCattle > 0 
              ? ((productionStats.producingCattle / productionStats.totalCattle) * 100).toFixed(0)
              : 0}%
          </div>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0 0 0' }}>
            {productionStats.producingCattle} of {productionStats.totalCattle} cattle
          </p>
        </div>
      </div>

      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          color: '#6b7280' 
        }}>
          Loading milk production data...
        </div>
      )}

      {!loading && cattleData.length === 0 && !error && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#6b7280',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <Milk size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No cattle data found</h3>
          <p>Add cattle with milk production data to see production statistics.</p>
        </div>
      )}

      {!loading && cattleData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Milk Production by Breed Chart */}
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
              Production by Breed
            </h3>
            {breedProductionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={breedProductionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="breed" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value}L${name === 'totalProduction' ? '/day' : '/day avg'}`, 
                      name === 'totalProduction' ? 'Total' : 'Average'
                    ]}
                    labelFormatter={(breed) => `${breed} Breed`}
                  />
                  <Bar dataKey="totalProduction" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                No production data available
              </div>
            )}
          </div>

          {/* Production Range Distribution */}
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
              <Users size={20} />
              Production Distribution
            </h3>
            {productionRangeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={productionRangeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {productionRangeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} cattle`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                No distribution data available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detailed Cattle Production Table */}
      {!loading && cattleData.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginTop: '2rem'
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
            Individual Cattle Production
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Tag Number</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Name</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Breed</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Daily Production</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Health Status</th>
                </tr>
              </thead>
              <tbody>
                {cattleData
                  .sort((a, b) => (parseFloat(b.milkProduction) || 0) - (parseFloat(a.milkProduction) || 0))
                  .map((animal) => (
                    <tr key={animal.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: '500' }}>
                        {animal.tagNumber}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#374151' }}>
                        {animal.name || '-'}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                        {animal.breed}
                      </td>
                      <td style={{ 
                        padding: '0.75rem', 
                        textAlign: 'right',
                        fontWeight: '600',
                        color: parseFloat(animal.milkProduction) > 0 ? '#10b981' : '#6b7280'
                      }}>
                        {parseFloat(animal.milkProduction) || 0}L/day
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: animal.healthStatus === 'healthy' ? '#d1fae5' : '#fef3c7',
                          color: animal.healthStatus === 'healthy' ? '#065f46' : '#92400e'
                        }}>
                          {animal.healthStatus}
                        </span>
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

export default MilkProduction;