import React from 'react';
import { useCart } from '../contexts/CartContext';
import { ShoppingCart, Trash2, Plus, Minus, Package, Calendar } from 'lucide-react';

const OrderSummary = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, getCartItemsCount } = useCart();

  if (cart.length === 0) {
    return (
      <div className="order-summary-empty">
        <ShoppingCart size={48} className="empty-cart-icon" />
        <h3>Your cart is empty</h3>
        <p>Add some products from the Products section to see them here.</p>
      </div>
    );
  }

  const formatPrice = (price) => {
    if (typeof price === 'string') {
      return price;
    }
    return `₹${price.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="order-summary">
      <div className="order-summary-header">
        <div className="summary-icon-title">
          <Package size={20} />
          <h3>Cart Summary</h3>
        </div>
        <div className="cart-stats">
          <span className="cart-items-count">{getCartItemsCount()} items</span>
          <span className="cart-total">Total: ₹{getCartTotal().toLocaleString()}</span>
        </div>
      </div>

      <div className="order-summary-body">
        {cart.map((item) => (
          <div key={item.id} className="summary-item">
            <div className="item-details">
              <div className="item-info">
                <h4 className="item-name">{item.name}</h4>
                <span className="item-category">{item.category}</span>
                {item.tags && (
                  <div className="item-tags">
                    {item.tags.map((tag, index) => (
                      <span key={index} className="item-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="item-pricing">
                <div className="price-info">
                  <span className="item-price">{formatPrice(item.price)}</span>
                  {item.originalPrice && (
                    <span className="item-original-price">{formatPrice(item.originalPrice)}</span>
                  )}
                  {item.discount && (
                    <span className="item-discount">{item.discount}% OFF</span>
                  )}
                </div>
              </div>
            </div>

            <div className="item-controls">
              <div className="quantity-info">
                <span className="quantity-label">Qty:</span>
                <div className="quantity-controls">
\                    <button 
                      className="qty-btn decrease"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={12} />
                    </button>
                  <span className="quantity-display">{item.quantity}</span>
                    <button 
                      className="qty-btn increase"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus size={12} />
                    </button>
                </div>
              </div>
              
              <div className="item-total">
                ₹{(parseFloat(item.price.replace('₹', '').replace(',', '')) * item.quantity).toLocaleString()}
              </div>
              
                <button 
                  className="remove-btn"
                  onClick={() => removeFromCart(item.id)}
                  title="Remove from cart"
                >
                  <Trash2 size={16} />
                </button>
            </div>

            {item.addedAt && (
              <div className="item-metadata">
                <Calendar size={12} />
                <span className="added-date">Added: {formatDate(item.addedAt)}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="order-summary-footer">
        <div className="summary-totals">
          <div className="subtotal-row">
            <span>Subtotal ({getCartItemsCount()} items):</span>
            <span>₹{getCartTotal().toLocaleString()}</span>
          </div>
          <div className="total-row">
            <span>Total Amount:</span>
            <span className="total-amount">₹{getCartTotal().toLocaleString()}</span>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default OrderSummary;