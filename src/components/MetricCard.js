import React from 'react';
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, Heart, Milk, ClipboardList, Zap } from 'lucide-react';

const MetricCard = ({ title, value, trend, icon, color, onClick, clickable }) => {
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'cow':
        return <Heart size={24} />;
      case 'milk':
        return <Milk size={24} />;
      case 'money':
        return <DollarSign size={24} />;
      case 'orders':
        return <ClipboardList size={24} />;
      case 'users':
        return <Users size={24} />;
      case 'package':
        return <Package size={24} />;
      case 'cart':
        return <ShoppingCart size={24} />;
      case 'cattle':
        return <Heart size={24} />;
      default:
        return <Zap size={24} />;
    }
  };

  return (
    <div 
      className="metric-card"
      style={{ 
        '--accent-color': color,
        cursor: clickable ? 'pointer' : 'default',
        transition: clickable ? 'transform 0.2s, box-shadow 0.2s' : 'none'
      }}
      onClick={clickable ? onClick : undefined}
      onMouseEnter={clickable ? (e) => {
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
      } : undefined}
      onMouseLeave={clickable ? (e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      } : undefined}
    >
      <div className="metric-header">
        <div 
          className="metric-icon"
          style={{ backgroundColor: color }}
        >
          {getIcon(icon)}
        </div>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{title}</div>
      {trend && (
        <div className="metric-trend">
          <TrendingUp size={16} />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard; 