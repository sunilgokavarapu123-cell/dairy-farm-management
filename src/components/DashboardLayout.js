import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Products from './Products';
import Orders from './Orders';
import OrderStatus from './OrderStatus';
import Finance from './Finance';
import Admin from './Admin';
import Cattle from './Cattle';
import MilkProduction from './MilkProduction';
import RevenueDetails from './RevenueDetails';
import Profile from './Profile';
import AdminRoute from './AdminRoute';

const DashboardLayout = () => {
  return (
    <>
      <Header />
      <div className="dashboard-container">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/order-status" element={
            <AdminRoute>
              <OrderStatus />
            </AdminRoute>
          } />
          <Route path="/finance" element={<Finance />} />
          <Route path="/revenue" element={<RevenueDetails />} />
          <Route path="/cattle" element={<Cattle />} />
          <Route path="/milk-production" element={<MilkProduction />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          } />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </>
  );
};

export default DashboardLayout;