import React from 'react';
import { X, Trash2, Clock, CheckCircle, Package, Truck, XCircle, AlertCircle, ShoppingBag, Bell } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationsModal = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  if (!isOpen) return null;

  const getNotificationIcon = (type, status, priority) => {
    const iconProps = { size: 16 };
    
    if (type === 'order_update') {
      switch (status) {
        case 'processing':
          return <Package {...iconProps} className="text-blue-600" />;
        case 'shipped':
          return <Truck {...iconProps} className="text-purple-600" />;
        case 'delivered':
          return <CheckCircle {...iconProps} className="text-green-600" />;
        case 'cancelled':
          return <XCircle {...iconProps} className="text-red-600" />;
        default:
          return <Clock {...iconProps} className="text-yellow-600" />;
      }
    } else if (type === 'new_order') {
      return <ShoppingBag {...iconProps} className="text-blue-600" />;
    } else {
      if (priority === 'high') {
        return <AlertCircle {...iconProps} className="text-red-600" />;
      }
      return <Bell {...iconProps} className="text-blue-600" />;
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'processing':
        return { bg: '#dbeafe', text: '#1d4ed8' };
      case 'shipped':
        return { bg: '#ede9fe', text: '#7c3aed' };
      case 'delivered':
        return { bg: '#d1fae5', text: '#047857' };
      case 'cancelled':
        return { bg: '#fee2e2', text: '#dc2626' };
      default:
        return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return { bg: '#fef2f2', text: '#dc2626', label: 'High' };
      case 'medium':
        return { bg: '#fef3c7', text: '#d97706', label: 'Medium' };
      case 'low':
        return { bg: '#f0f9ff', text: '#0284c7', label: 'Low' };
      default:
        return null;
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingTop: '5vh'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '650px',
        maxHeight: '80vh',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc'
        }}>
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Bell size={20} />
              Notifications
            </h2>
            {unreadCount > 0 && (
              <p style={{ 
                margin: '0.25rem 0 0 0', 
                fontSize: '0.875rem', 
                color: '#6b7280' 
              }}>
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                title="Mark all as read"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: '#6b7280'
              }}
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div style={{
          maxHeight: '60vh',
          overflowY: 'auto'
        }}>
          {notifications.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <Bell size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid #f3f4f6',
                  cursor: 'pointer',
                  backgroundColor: notification.isRead ? 'white' : '#eff6ff',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = notification.isRead ? '#f9fafb' : '#dbeafe';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = notification.isRead ? 'white' : '#eff6ff';
                }}
              >
                <div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
                  {getNotificationIcon(notification.type, notification.status, notification.priority)}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      fontWeight: notification.isRead ? '500' : '600',
                      color: '#1f2937',
                      lineHeight: '1.25'
                    }}>
                      {notification.title}
                    </h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
                      {notification.priority && getPriorityBadge(notification.priority) && (
                        <span style={{
                          padding: '0.125rem 0.375rem',
                          borderRadius: '4px',
                          fontSize: '0.625rem',
                          fontWeight: '600',
                          backgroundColor: getPriorityBadge(notification.priority).bg,
                          color: getPriorityBadge(notification.priority).text
                        }}>
                          {getPriorityBadge(notification.priority).label}
                        </span>
                      )}
                      
                      {notification.status && (
                        <span style={{
                          padding: '0.125rem 0.375rem',
                          borderRadius: '4px',
                          fontSize: '0.625rem',
                          fontWeight: '600',
                          textTransform: 'capitalize',
                          backgroundColor: getStatusBadgeColor(notification.status).bg,
                          color: getStatusBadgeColor(notification.status).text
                        }}>
                          {notification.status}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p style={{
                    margin: '0 0 0.75rem 0',
                    fontSize: '0.8125rem',
                    color: '#4b5563',
                    lineHeight: '1.5'
                  }}>
                    {notification.message}
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={12} style={{ color: '#9ca3af' }} />
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#9ca3af'
                      }}>
                        {getTimeAgo(notification.timestamp)}
                      </span>
                      {notification.orderId && (
                        <>
                          <span style={{ color: '#d1d5db' }}>•</span>
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                            Order #{notification.orderId}
                          </span>
                        </>
                      )}
                      {!notification.isRead && (
                        <span style={{
                          display: 'inline-block',
                          width: '6px',
                          height: '6px',
                          backgroundColor: '#3b82f6',
                          borderRadius: '50%',
                          marginLeft: '0.25rem'
                        }}></span>
                      )}
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      style={{
                        padding: '0.25rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#9ca3af',
                        opacity: 0.6,
                        transition: 'opacity 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.color = '#ef4444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.6';
                        e.currentTarget.style.color = '#9ca3af';
                      }}
                      title="Delete notification"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;