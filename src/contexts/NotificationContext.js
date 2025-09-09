import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { getApiUrl } from '../config/api';

export const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  deleteNotification: () => {},
  clearNotifications: () => {},
});

export const NotificationProvider = ({ children }) => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [previousOrders, setPreviousOrders] = useState([]);

  useEffect(() => {
    const sampleNotifications = [
      {
        id: 1,
        title: 'Order Status Update',
        message: 'Order #1001 has been shipped and is on its way to the customer',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), 
        isRead: false,
        type: 'order_update',
        orderId: 1001,
        status: 'shipped',
        priority: 'medium'
      },
      {
        id: 2,
        title: 'Order Delivered',
        message: 'Order #1002 has been successfully delivered to the customer',
        timestamp: new Date(Date.now() - 45 * 60 * 1000), 
        isRead: false,
        type: 'order_update',
        orderId: 1002,
        status: 'delivered',
        priority: 'low'
      },
      {
        id: 3,
        title: 'New Order Processing',
        message: 'Order #1005 is now being processed in the warehouse',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), 
        isRead: false,
        type: 'order_update',
        orderId: 1005,
        status: 'processing',
        priority: 'high'
      }
    ];
    setNotifications(sampleNotifications);
  }, []);

  const checkForOrderUpdates = async () => {
    if (!token) return;

    try {
      const response = await fetch(getApiUrl('/orders'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) return;

      const currentOrders = await response.json();

      if (previousOrders.length > 0) {
        currentOrders.forEach(currentOrder => {
          const previousOrder = previousOrders.find(o => o.id === currentOrder.id);
          
          if (previousOrder && previousOrder.status !== currentOrder.status) {
            const notification = {
              id: Date.now() + Math.random(),
              title: getStatusUpdateTitle(currentOrder.status),
              message: getStatusUpdateMessage(currentOrder.id, currentOrder.status, currentOrder.customerName),
              timestamp: new Date(),
              isRead: false,
              type: 'order_update',
              orderId: currentOrder.id,
              status: currentOrder.status,
              priority: getStatusPriority(currentOrder.status)
            };

            setNotifications(prev => [notification, ...prev.slice(0, 19)]); 
          }
        });

        const newOrders = currentOrders.filter(currentOrder => 
          !previousOrders.find(prevOrder => prevOrder.id === currentOrder.id)
        );

        newOrders.forEach(order => {
          const notification = {
            id: Date.now() + Math.random(),
            title: 'New Order Received',
            message: `New order #${order.id} from ${order.customerName || 'Customer'} has been received`,
            timestamp: new Date(),
            isRead: false,
            type: 'new_order',
            orderId: order.id,
            status: order.status,
            priority: 'high'
          };

          setNotifications(prev => [notification, ...prev.slice(0, 19)]);
        });
      }

      setPreviousOrders(currentOrders);
    } catch (error) {
      console.error('Error checking for order updates:', error);
    }
  };

  useEffect(() => {
    if (!token) return;

    checkForOrderUpdates();

    const interval = setInterval(checkForOrderUpdates, 30000);

    return () => clearInterval(interval);
  }, [token, previousOrders]);

  const getStatusUpdateTitle = (status) => {
    switch (status) {
      case 'processing': return 'Order Processing';
      case 'shipped': return 'Order Shipped';
      case 'delivered': return 'Order Delivered';
      case 'cancelled': return 'Order Cancelled';
      default: return 'Order Status Update';
    }
  };

  const getStatusUpdateMessage = (orderId, status, customerName) => {
    const customer = customerName || 'the customer';
    switch (status) {
      case 'processing':
        return `Order #${orderId} is now being processed in the warehouse`;
      case 'shipped':
        return `Order #${orderId} has been shipped and is on its way to ${customer}`;
      case 'delivered':
        return `Order #${orderId} has been successfully delivered to ${customer}`;
      case 'cancelled':
        return `Order #${orderId} has been cancelled`;
      default:
        return `Order #${orderId} status has been updated to ${status}`;
    }
  };

  const getStatusPriority = (status) => {
    switch (status) {
      case 'processing': return 'high';
      case 'shipped': return 'medium';
      case 'delivered': return 'low';
      case 'cancelled': return 'high';
      default: return 'medium';
    }
  };

  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  const addNotification = (title, message, type = 'general', priority = 'medium', orderId = null, status = null) => {
    const notification = {
      id: Date.now(),
      title,
      message,
      timestamp: new Date(),
      isRead: false,
      type,
      orderId,
      status,
      priority
    };
    setNotifications(prev => [notification, ...prev.slice(0, 19)]);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true } 
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};