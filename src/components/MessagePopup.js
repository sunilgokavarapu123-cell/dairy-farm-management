import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const MessagePopup = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); 

      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) {
    return null;
  }

  return (
    <div className="message-popup-overlay">
      <div className="message-popup">
        <div className="message-popup-content">
          <p>{message}</p>
        </div>
        <button 
          className="message-popup-close" 
          onClick={onClose}
          aria-label="Close message"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default MessagePopup;