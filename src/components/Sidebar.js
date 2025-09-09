import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  DollarSign, 
  Menu,
  Home,
  Database,
  TrendingUp,
  Eye,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Milk
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const handleMenuClick = () => {
    if (window.innerWidth <= 768) {
      setIsMobileOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const getInitials = (user) => {
    if (!user) return 'U';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const getUserName = (user) => {
    if (!user) return 'User';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User';
  };

  const handleLogout = () => {
    logout();
  };

  let menuItems = [
    { 
      id: 'dashboard', 
      path: '/dashboard',
      icon: Home, 
      label: 'Dashboard'
    },
    { 
      id: 'products', 
      path: '/dashboard/products',
      icon: Database, 
      label: 'Products'
    },
    { 
      id: 'orders', 
      path: '/dashboard/orders',
      icon: TrendingUp, 
      label: 'Orders'
    },
    { 
      id: 'cattle', 
      path: '/dashboard/cattle',
      icon: Heart, 
      label: 'Cattle'
    },
    { 
      id: 'milk-production', 
      path: '/dashboard/milk-production',
      icon: Milk, 
      label: 'Milk Production'
    },
    { 
      id: 'finance', 
      path: '/dashboard/finance',
      icon: DollarSign, 
      label: 'Finance'
    },
  ];

  if (user && user.role === 'admin') {
    menuItems.push({
      id: 'order-status', 
      path: '/dashboard/order-status',
      icon: Clock, 
      label: 'Status of Order'
    });
  }

  if (user && user.role === 'admin') {
    menuItems.push({
      id: 'admin',
      path: '/dashboard/admin',
      icon: Settings,
      label: 'Admin'
    });
  }

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    }
    return location.pathname.startsWith(path);
  };

  const renderIcon = (IconComponent) => {
    return IconComponent ? <IconComponent size={20} /> : null;
  };

  return (
    <>
      <div className="mobile-menu-toggle" onClick={toggleMobileMenu}>
        <Menu size={24} />
      </div>

      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-profile-top">
          <button 
            className="profile-toggle-btn"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <div className="profile-avatar-btn">
              {getInitials(user)}
            </div>
            {!isCollapsed && (
              <div className="profile-details-btn">
                <div className="profile-name-btn">{getUserName(user)}</div>
                <div className="profile-email-btn">{user?.email}</div>
              </div>
            )}
            <div className="profile-chevron">
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </div>
          </button>
        </div>

        <div className="sidebar-header">
          <div className="sidebar-title">{isCollapsed ? 'Nav' : 'Navigation'}</div>
          {!isCollapsed && (
            <div className="sidebar-subtitle">Manage your farm operations</div>
          )}
        </div>
        
        <div className="nav-menu">
          {menuItems.map((item) => (
            <Link 
              key={item.id}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={handleMenuClick}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="nav-icon-wrapper">
                {renderIcon(item.icon)}
              </div>
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
          <>
            <div className="nav-divider"></div>
            <button 
              className="nav-item database-view-btn dashboard-admin-db"
              onClick={() => {
                const token = localStorage.getItem('token');
                if (token) {
                  window.open(`http://localhost:4000/database?token=${encodeURIComponent(token)}`, '_blank', 'noopener,noreferrer');
                } else {
                  window.open('http://localhost:4000/database', '_blank', 'noopener,noreferrer');
                }
                handleMenuClick();
                const notification = document.createElement('div');
                notification.style.cssText = `
                  position: fixed;
                  top: 90px;
                  right: 20px;
                  background: linear-gradient(135deg, #667eea, #764ba2);
                  color: white;
                  padding: 12px 20px;
                  border-radius: 8px;
                  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                  z-index: 1000;
                  font-weight: 500;
                  animation: slideInRight 0.3s ease-out;
                `;
                notification.textContent = 'Database view opened in new tab';
                document.body.appendChild(notification);
                setTimeout(() => {
                  notification.style.animation = 'slideOutRight 0.3s ease-in';
                  setTimeout(() => notification.remove(), 300);
                }, 3000);
              }}
              title={isCollapsed ? "Database" : "Database View"}
            >
              <div className="nav-icon-wrapper">
                <Database size={20} />
              </div>
              {!isCollapsed && <span>Database</span>}
            </button>
          </>
        </div>

        <div className="sidebar-bottom-actions">
          <div className="nav-divider"></div>
          {!isCollapsed ? (
            <div className="bottom-actions-expanded">
              <button 
                className="nav-item settings-btn"
                title="Settings"
              >
                <div className="nav-icon-wrapper">
                  <Settings size={20} />
                </div>
                <span>Settings</span>
              </button>
              <button 
                className="nav-item logout-btn"
                onClick={handleLogout}
                title="Logout"
              >
                <div className="nav-icon-wrapper">
                  <LogOut size={20} />
                </div>
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="bottom-actions-collapsed">
              <button 
                className="nav-item settings-btn-collapsed"
                title="Settings"
              >
                <div className="nav-icon-wrapper">
                  <Settings size={20} />
                </div>
              </button>
              <button 
                className="nav-item logout-btn-collapsed"
                onClick={handleLogout}
                title="Logout"
              >
                <div className="nav-icon-wrapper">
                  <LogOut size={20} />
                </div>
              </button>
            </div>
          )}
        </div>
      </aside>

      {isMobileOpen && <div className="mobile-overlay" onClick={() => setIsMobileOpen(false)} />}
    </>
  );
};

export default Sidebar;