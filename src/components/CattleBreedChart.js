import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../config/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const CattleBreedChart = () => {
  const { token } = useAuth();
  const [data, setData] = useState([
    { name: 'Gir', value: 45, color: '#3b82f6' },
    { name: 'Jersey', value: 30, color: '#f59e0b' },
    { name: 'Ongole', value: 15, color: '#10b981' },
    { name: 'Sindhi', value: 10, color: '#8b5cf6' }
  ]); 

  const breedColors = {
    'Gir': '#3b82f6',
    'Jersey': '#f59e0b',
    'Ongole': '#10b981',
    'Sindhi': '#8b5cf6',
    'Holstein': '#ef4444',
    'Sahiwal': '#14b8a6',
    'Red Sindhi': '#f97316',
    'Other': '#6b7280'
  };

  useEffect(() => {
    const fetchCattleBreedData = async () => {
      if (!token) return;
      
      try {
        const res = await fetch(getApiUrl('/cattle'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const cattleData = await res.json();
          
          
          const breedCounts = {};
          cattleData.forEach(cattle => {
            const breed = cattle.breed || 'Other';
            breedCounts[breed] = (breedCounts[breed] || 0) + 1;
          });
          
          
          const chartData = Object.entries(breedCounts).map(([breed, count]) => ({
            name: breed,
            value: count,
            color: breedColors[breed] || breedColors.Other
          }));
          
          if (chartData.length > 0) {
            setData(chartData);
          }
        }
      } catch (err) {
        console.log('Could not fetch cattle breed data:', err);
        
      }
    };

    fetchCattleBreedData();
  }, [token]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />

        
      </PieChart>
    </ResponsiveContainer>
  );
};

export default CattleBreedChart;
