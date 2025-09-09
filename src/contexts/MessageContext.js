import React, { createContext, useState, useEffect } from 'react';

export const MessageContext = createContext({
  messages: [],
  unreadCount: 0,
  latestMessage: '',
  setMessage: () => {},
  addMessage: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearMessage: () => {},
  deleteMessage: () => {},
});

export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [latestMessage, setLatestMessage] = useState('');

  useEffect(() => {
    const sampleMessages = [
      {
        id: 1,
        text: 'System maintenance scheduled for tonight at 11 PM',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), 
        isRead: false,
        type: 'system',
        priority: 'medium'
      },
      {
        id: 2,
        text: 'New cattle health report available for review',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), 
        isRead: false,
        type: 'notification',
        priority: 'high'
      },
      {
        id: 3,
        text: 'Daily milk production target achieved! 🎉',
        timestamp: new Date(Date.now() - 10 * 60 * 1000), 
        isRead: false,
        type: 'success',
        priority: 'low'
      }
    ];
    setMessages(sampleMessages);
  }, []);

  const unreadCount = messages.filter(msg => !msg.isRead).length;

  const addMessage = (text, type = 'notification', priority = 'medium') => {
    const newMessage = {
      id: Date.now(),
      text,
      timestamp: new Date(),
      isRead: false,
      type,
      priority
    };
    setMessages(prev => [newMessage, ...prev]);
    setLatestMessage(text);
  };

  const setMessage = (msg) => {
    setLatestMessage(msg);
    if (msg) {
      addMessage(msg);
    }
  };

  const markAsRead = (messageId) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      )
    );
  };

  const markAllAsRead = () => {
    setMessages(prev => 
      prev.map(msg => ({ ...msg, isRead: true }))
    );
  };

  const deleteMessage = (messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const clearMessage = () => setLatestMessage('');

  return (
    <MessageContext.Provider value={{ 
      messages,
      unreadCount,
      latestMessage, 
      setMessage,
      addMessage,
      markAsRead,
      markAllAsRead,
      deleteMessage,
      clearMessage 
    }}>
      {children}
    </MessageContext.Provider>
  );
};
