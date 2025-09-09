import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useNotifications } from '../contexts/NotificationContext';
import { 
  X, 
  Settings, 
  Bell, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Database, 
  Eye, 
  EyeOff,
  Clock,
  Calendar,
  User,
  Shield,
  Palette,
  Globe,
  Save,
  RotateCcw
} from 'lucide-react';

const SettingsModal = ({ isOpen, onClose }) => {
  const { settings, updateSetting, resetSettings } = useSettings();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('general');
  const [tempSettings, setTempSettings] = useState(settings);

  useEffect(() => {
    setTempSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSettingChange = (key, value) => {
    setTempSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = () => {
    Object.keys(tempSettings).forEach(key => {
      if (tempSettings[key] !== settings[key]) {
        updateSetting(key, tempSettings[key]);
      }
    });
    
    addNotification(
      'Settings Saved',
      'Your preferences have been updated successfully',
      'system',
      'low'
    );
    
    onClose();
  };

  const cancelChanges = () => {
    setTempSettings(settings);
  };

  const resetToDefaults = () => {
    resetSettings();
    setTempSettings({
      theme: 'light',
      language: 'en',
      timezone: 'auto',
      autoRefresh: true,
      refreshInterval: 30,
      enableNotifications: true,
      soundEnabled: true,
      emailNotifications: false,
      orderStatusUpdates: true,
      milkProductionAlerts: true,
      systemMaintenanceAlerts: true,
      showTimestamps: true,
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      compactMode: false,
      showAnimations: true,
      showProfileInfo: true,
      shareAnalytics: false,
      sessionTimeout: 30
    });
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'display', label: 'Display', icon: Eye },
    { id: 'privacy', label: 'Privacy', icon: Shield }
  ];

  const renderGeneralSettings = () => (
    <div className="settings-section">
      <h3 className="settings-section-title">General Settings</h3>
      
      <div className="settings-group">
        <label className="settings-label">
          <Palette size={16} />
          Theme
        </label>
        <select 
          value={tempSettings.theme} 
          onChange={(e) => handleSettingChange('theme', e.target.value)}
          className="settings-select"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto</option>
        </select>
      </div>

      <div className="settings-group">
        <label className="settings-label">
          <Globe size={16} />
          Language
        </label>
        <select 
          value={tempSettings.language} 
          onChange={(e) => handleSettingChange('language', e.target.value)}
          className="settings-select"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
        </select>
      </div>

      <div className="settings-group">
        <label className="settings-label">
          <Clock size={16} />
          Timezone
        </label>
        <select 
          value={tempSettings.timezone} 
          onChange={(e) => handleSettingChange('timezone', e.target.value)}
          className="settings-select"
        >
          <option value="auto">Auto Detect</option>
          <option value="utc">UTC</option>
          <option value="est">EST</option>
          <option value="pst">PST</option>
          <option value="gmt">GMT</option>
        </select>
      </div>

      <div className="settings-group">
        <div className="settings-toggle">
          <label className="settings-label">
            <RefreshCw size={16} />
            Auto Refresh Data
          </label>
          <input
            type="checkbox"
            checked={tempSettings.autoRefresh}
            onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
            className="settings-checkbox"
          />
        </div>
        <p className="settings-description">Automatically refresh dashboard data</p>
      </div>

      {tempSettings.autoRefresh && (
        <div className="settings-group">
          <label className="settings-label">Refresh Interval (seconds)</label>
          <input
            type="range"
            min="10"
            max="120"
            value={tempSettings.refreshInterval}
            onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
            className="settings-slider"
          />
          <span className="settings-value">{tempSettings.refreshInterval}s</span>
        </div>
      )}
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="settings-section">
      <h3 className="settings-section-title">Notification Settings</h3>
      
      <div className="settings-group">
        <div className="settings-toggle">
          <label className="settings-label">
            <Bell size={16} />
            Enable Notifications
          </label>
          <input
            type="checkbox"
            checked={tempSettings.enableNotifications}
            onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
            className="settings-checkbox"
          />
        </div>
        <p className="settings-description">Show desktop notifications for important updates</p>
      </div>

      <div className="settings-group">
        <div className="settings-toggle">
          <label className="settings-label">
            {tempSettings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            Sound Notifications
          </label>
          <input
            type="checkbox"
            checked={tempSettings.soundEnabled}
            onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
            className="settings-checkbox"
            disabled={!tempSettings.enableNotifications}
          />
        </div>
        <p className="settings-description">Play sounds for notifications</p>
      </div>

      <div className="settings-group">
        <div className="settings-toggle">
          <label className="settings-label">
            <Database size={16} />
            Order Status Updates
          </label>
          <input
            type="checkbox"
            checked={tempSettings.orderStatusUpdates}
            onChange={(e) => handleSettingChange('orderStatusUpdates', e.target.checked)}
            className="settings-checkbox"
            disabled={!tempSettings.enableNotifications}
          />
        </div>
        <p className="settings-description">Get notified when order status changes</p>
      </div>

      <div className="settings-group">
        <div className="settings-toggle">
          <label className="settings-label">
            <Database size={16} />
            Milk Production Alerts
          </label>
          <input
            type="checkbox"
            checked={tempSettings.milkProductionAlerts}
            onChange={(e) => handleSettingChange('milkProductionAlerts', e.target.checked)}
            className="settings-checkbox"
            disabled={!tempSettings.enableNotifications}
          />
        </div>
        <p className="settings-description">Get alerts for milk production changes</p>
      </div>

      <div className="settings-group">
        <div className="settings-toggle">
          <label className="settings-label">
            <Settings size={16} />
            System Maintenance
          </label>
          <input
            type="checkbox"
            checked={tempSettings.systemMaintenanceAlerts}
            onChange={(e) => handleSettingChange('systemMaintenanceAlerts', e.target.checked)}
            className="settings-checkbox"
            disabled={!tempSettings.enableNotifications}
          />
        </div>
        <p className="settings-description">Get notified about system maintenance</p>
      </div>
    </div>
  );

  const renderDisplaySettings = () => (
    <div className="settings-section">
      <h3 className="settings-section-title">Display Settings</h3>
      
      <div className="settings-group">
        <div className="settings-toggle">
          <label className="settings-label">
            <Clock size={16} />
            Show Timestamps
          </label>
          <input
            type="checkbox"
            checked={tempSettings.showTimestamps}
            onChange={(e) => handleSettingChange('showTimestamps', e.target.checked)}
            className="settings-checkbox"
          />
        </div>
        <p className="settings-description">Display timestamps on data entries</p>
      </div>

      <div className="settings-group">
        <label className="settings-label">
          <Calendar size={16} />
          Date Format
        </label>
        <select 
          value={tempSettings.dateFormat} 
          onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
          className="settings-select"
        >
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
        </select>
      </div>

      <div className="settings-group">
        <label className="settings-label">
          <Clock size={16} />
          Time Format
        </label>
        <select 
          value={tempSettings.timeFormat} 
          onChange={(e) => handleSettingChange('timeFormat', e.target.value)}
          className="settings-select"
        >
          <option value="12h">12 Hour</option>
          <option value="24h">24 Hour</option>
        </select>
      </div>

      <div className="settings-group">
        <div className="settings-toggle">
          <label className="settings-label">
            <Eye size={16} />
            Compact Mode
          </label>
          <input
            type="checkbox"
            checked={tempSettings.compactMode}
            onChange={(e) => handleSettingChange('compactMode', e.target.checked)}
            className="settings-checkbox"
          />
        </div>
        <p className="settings-description">Show more data in less space</p>
      </div>

      <div className="settings-group">
        <div className="settings-toggle">
          <label className="settings-label">
            <Palette size={16} />
            Enable Animations
          </label>
          <input
            type="checkbox"
            checked={tempSettings.showAnimations}
            onChange={(e) => handleSettingChange('showAnimations', e.target.checked)}
            className="settings-checkbox"
          />
        </div>
        <p className="settings-description">Show transition animations</p>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="settings-section">
      <h3 className="settings-section-title">Privacy & Security</h3>
      
      <div className="settings-group">
        <div className="settings-toggle">
          <label className="settings-label">
            <User size={16} />
            Show Profile Info
          </label>
          <input
            type="checkbox"
            checked={tempSettings.showProfileInfo}
            onChange={(e) => handleSettingChange('showProfileInfo', e.target.checked)}
            className="settings-checkbox"
          />
        </div>
        <p className="settings-description">Display profile information in the header</p>
      </div>

      <div className="settings-group">
        <div className="settings-toggle">
          <label className="settings-label">
            <Database size={16} />
            Share Analytics
          </label>
          <input
            type="checkbox"
            checked={tempSettings.shareAnalytics}
            onChange={(e) => handleSettingChange('shareAnalytics', e.target.checked)}
            className="settings-checkbox"
          />
        </div>
        <p className="settings-description">Help improve the system by sharing usage analytics</p>
      </div>

      <div className="settings-group">
        <label className="settings-label">
          <Clock size={16} />
          Session Timeout (minutes)
        </label>
        <input
          type="range"
          min="5"
          max="120"
          value={tempSettings.sessionTimeout}
          onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
          className="settings-slider"
        />
        <span className="settings-value">{tempSettings.sessionTimeout} min</span>
      </div>
    </div>
  );

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
      alignItems: 'center',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
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
              fontSize: '1.5rem', 
              fontWeight: '600', 
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Settings size={24} />
              Settings
            </h2>
            <p style={{ 
              margin: '0.25rem 0 0 0', 
              fontSize: '0.875rem', 
              color: '#6b7280' 
            }}>
              Customize your dashboard experience
            </p>
          </div>
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

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar */}
          <div style={{
            width: '200px',
            backgroundColor: '#f9fafb',
            borderRight: '1px solid #e5e7eb',
            padding: '1rem 0'
          }}>
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    backgroundColor: activeTab === tab.id ? '#3b82f6' : 'transparent',
                    color: activeTab === tab.id ? 'white' : '#6b7280',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  <IconComponent size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div style={{
            flex: 1,
            padding: '1.5rem',
            overflowY: 'auto'
          }}>
            {activeTab === 'general' && renderGeneralSettings()}
            {activeTab === 'notifications' && renderNotificationSettings()}
            {activeTab === 'display' && renderDisplaySettings()}
            {activeTab === 'privacy' && renderPrivacySettings()}
          </div>
        </div>

        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={resetToDefaults}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: 'pointer',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <RotateCcw size={14} />
              Reset to Defaults
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={cancelChanges}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              Cancel
            </button>
            <button
              onClick={saveSettings}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Save size={14} />
              Save Settings
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .settings-section {
          margin-bottom: 2rem;
        }

        .settings-section-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .settings-group {
          margin-bottom: 1.5rem;
        }

        .settings-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .settings-toggle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }

        .settings-select,
        .settings-checkbox,
        .settings-slider {
          margin-top: 0.25rem;
        }

        .settings-select {
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          background-color: white;
          width: 100%;
          max-width: 200px;
        }

        .settings-checkbox {
          width: 1rem;
          height: 1rem;
          accent-color: #3b82f6;
        }

        .settings-slider {
          width: 100%;
          max-width: 200px;
          accent-color: #3b82f6;
        }

        .settings-value {
          display: inline-block;
          margin-left: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .settings-description {
          font-size: 0.75rem;
          color: #9ca3af;
          margin: 0.25rem 0 0 0;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};

export default SettingsModal;