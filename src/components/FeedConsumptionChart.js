import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const FeedConsumptionChart = () => {
  const data = [
    { month: 'Jan', primary: 1200, supplementary: 800, mineral: 400 },
    { month: 'Feb', primary: 1400, supplementary: 900, mineral: 500 },
    { month: 'Mar', primary: 1600, supplementary: 1000, mineral: 600 },
    { month: 'Apr', primary: 1800, supplementary: 1100, mineral: 700 },
    { month: 'May', primary: 2000, supplementary: 1200, mineral: 800 },
    { month: 'Jun', primary: 2200, supplementary: 1300, mineral: 900 }
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis label={{ value: 'Kg', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="primary" stackId="a" fill="#10b981" name="Primary Feed" />
        <Bar dataKey="supplementary" stackId="a" fill="#f59e0b" name="Supplementary Feed" />
        <Bar dataKey="mineral" stackId="a" fill="#3b82f6" name="Mineral Feed" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default FeedConsumptionChart;
