import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  Bell, 
  MessageCircle, 
  Menu, 
  Settings, 
  User, 
  LogOut, 
  ChevronDown, 
  Search 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSearch } from '../contexts/SearchContext';
import { useNavigate } from 'react-router-dom';
import MessagesModal from './MessagesModal';
import NotificationsModal from './NotificationsModal';
import SettingsModal from './SettingsModal';
import { useNotifications } from '../contexts/NotificationContext';
import { MessageContext } from '../contexts/MessageContext';

const Header = () => {
  const { user, logout } = useAuth();
  const { searchQuery, updateSearchQuery, clearSearch } = useSearch();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const profileRef = useRef(null);
  const { latestMessage, clearMessage, unreadCount } = useContext(MessageContext);
  const { unreadCount: notificationUnreadCount } = useNotifications();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
  };

  const handleViewProfile = () => {
    navigate('/dashboard/profile');
    setIsProfileOpen(false);
  };


  const getInitials = (user) => {
    if (!user) return 'U';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const getUserName = (user) => {
    if (!user) return 'User';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User';
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      
      console.log('Searching for:', searchQuery.trim());
    }
  };

  const handleSearchChange = (e) => {
    updateSearchQuery(e.target.value);
  };

  const handleSearchClear = () => {
    clearSearch();
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <div className="logo-icon">
            <Menu size={16} />
          </div>
          <div className="logo-text">DAIRYFARM</div>
        </div>

        <div className="header-search">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className={`search-input-container ${isSearchFocused ? 'focused' : ''}`}>
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search across all data..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                className="search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleSearchClear}
                  className="search-clear"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="header-actions">
          <button 
            className="header-btn" 
            aria-label="Messages" 
            onClick={() => setShowMessagesModal(true)}
            style={{ position: 'relative' }}
          >
            <MessageCircle size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                fontSize: '10px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white'
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <button 
            className="header-btn" 
            aria-label="Notifications" 
            onClick={() => setShowNotificationsModal(true)}
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            {notificationUnreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                fontSize: '10px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white'
              }}>
                {notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}
              </span>
            )}
          </button>
          <button 
            className="header-btn" 
            aria-label="Settings" 
            onClick={() => setShowSettingsModal(true)}
          >
            <Settings size={18} />
          </button>

          <div className="user-profile-container" ref={profileRef}>
            <div 
              className="user-chip"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              role="button"
              tabIndex={0}
            >
              <div className="user-avatar">{getInitials(user)}</div>
              <div className="user-meta">
                <div className="user-name">{getUserName(user)}</div>
                <div className="date-time">
                  {formatDate(currentTime)} {formatTime(currentTime)}
                </div>
              </div>
              <ChevronDown 
                size={16} 
                className={`profile-chevron ${isProfileOpen ? 'open' : ''}`}
              />
            </div>
            
            {isProfileOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <div className="profile-avatar-large">{getInitials(user)}</div>
                  <div className="profile-info">
                    <div className="profile-name">{getUserName(user)}</div>
                    <div className="profile-email">{user?.email}</div>
                  </div>
                </div>
                
                <div className="profile-dropdown-divider"></div>
                
                <div className="profile-dropdown-menu">
                  <button className="profile-menu-item" onClick={handleViewProfile}>
                    <User size={16} />
                    <span>View Profile</span>
                  </button>
                  <button className="profile-menu-item">
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                </div>
                
                <div className="profile-dropdown-divider"></div>
                
                <button className="profile-menu-item logout" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <MessagesModal 
        isOpen={showMessagesModal} 
        onClose={() => setShowMessagesModal(false)} 
      />
      <NotificationsModal 
        isOpen={showNotificationsModal} 
        onClose={() => setShowNotificationsModal(false)} 
      />
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
      />
    </header>
  );
};

export default Header; 