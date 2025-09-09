import React from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Package, ShoppingBag, User } from 'lucide-react';
import './AddOrderModal.css';

const AddOrderModal = ({ isOpen, onClose, onSubmit }) => {
  const { cart, getCartItemsCount, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  

  const customerName = user ? `${user.firstName} ${user.lastName}` : '';
  
  const [formData, setFormData] = React.useState({
    customerName: customerName,
    status: 'processing'
  });

  
  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: `${user.firstName} ${user.lastName}`
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
  
    if (name === 'customerName' || name === 'status') return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    
    if (!formData.customerName.trim()) {
      alert('Customer name is required');
      return;
    }
    
    if (cart.length === 0) {
      alert('No items in cart to create order');
      return;
    }

    try {
    
      for (const item of cart) {
        const orderData = {
          customerName: formData.customerName.trim(),
          product: item.name,
          quantity: item.quantity,
          status: formData.status
        };
        await onSubmit(orderData);
      }
      

      clearCart();
      
    
      setFormData({
        customerName: '',
        status: 'processing'
      });
      
      onClose();
    } catch (error) {
      console.error('Error submitting orders:', error);
      alert('Error creating orders. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal order-summary-modal">
        <div className="modal-header">
          <ShoppingBag size={24} />
          <h3>Create Order from Cart Items</h3>
        </div>
        
        {/* Order Summary Display */}
        <div className="order-summary-display">
          <div className="summary-stats">
            <div className="stat-item">
              <Package size={20} />
              <span>{getCartItemsCount()} Items</span>
            </div>
            <div className="stat-item">
              <span className="total-amount">₹{getCartTotal().toLocaleString()}</span>
            </div>
          </div>
          
          <div className="items-list">
            {cart.map((item, index) => (
              <div key={item.id} className="order-item">
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <span className="item-category">{item.category}</span>
                </div>
                <div className="item-details">
                  <span className="quantity">Qty: {item.quantity}</span>
                  <span className="price">{item.price}</span>
                  <span className="subtotal">
                    ₹{(parseFloat(item.price.replace('₹', '').replace(',', '')) * item.quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="order-form">
          <div className="form-group">
            <label>
              <User size={16} />
              Customer Name:
            </label>
            <input 
              type="text" 
              name="customerName" 
              value={formData.customerName} 
              onChange={handleChange}
              placeholder="Logged-in user name"
              required 
              readOnly
              className="readonly-input"
            />
          </div>
          
          <div className="form-group">
            <label>Order Status:</label>
            <select 
              name="status" 
              value={formData.status} 
              onChange={handleChange}
              disabled
              className="readonly-select"
            >
              <option value="processing">Processing</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="order-note">
            <p><strong>Note:</strong> This will create {cart.length} separate order(s) for the customer with the selected items and quantities.</p>
          </div>

          <div className="modal-actions">
            <button type="submit" className="submit-btn">
              Create {cart.length} Order{cart.length > 1 ? 's' : ''}
            </button>
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOrderModal;
