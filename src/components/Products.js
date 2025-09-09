import React, { useState, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { ShoppingCart, Check, Plus, Minus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import SharedMetrics from './SharedMetrics';
import MessagePopup from './MessagePopup';
import { MessageContext } from '../contexts/MessageContext';
import { products } from '../data/products';

const Products = () => {
  const { user } = useAuth();
  const { addToCart, getCartItemsCount } = useCart();
  const { setMessage } = useContext(MessageContext);
  const [addedToCartItems, setAddedToCartItems] = useState(new Set());
  const [popupMessage, setPopupMessage] = useState('');
  const [quantities, setQuantities] = useState({});

  const categoryData = [
    { name: 'Dairy Products', value: 35, color: '#3b82f6' },
    { name: 'Animal Feed', value: 25, color: '#10b981' },
    { name: 'Equipment', value: 20, color: '#f59e0b' },
    { name: 'Veterinary', value: 15, color: '#8b5cf6' },
    { name: 'Other', value: 5, color: '#ef4444' }
  ];


  const getQuantity = (productId) => {
    return quantities[productId] || 1;
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity >= 1) {
      setQuantities(prev => ({ ...prev, [productId]: newQuantity }));
    }
  };

  const incrementQuantity = (productId) => {
    updateQuantity(productId, getQuantity(productId) + 1);
  };

  const decrementQuantity = (productId) => {
    updateQuantity(productId, getQuantity(productId) - 1);
  };

  const handleAddToCart = (product) => {
    const quantity = getQuantity(product.id);
    addToCart(product, quantity);
    
    setAddedToCartItems(prev => new Set([...prev, product.id]));
    
    setTimeout(() => {
      setAddedToCartItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }, 2000);
    
    const currentCartCount = getCartItemsCount();
    const message = `${quantity} × ${product.name} added to cart! (${currentCartCount + quantity} items total)`;
    setPopupMessage(message);
    setMessage(message);
    
    setQuantities(prev => ({ ...prev, [product.id]: 1 }));
  };

  return (
    <main className="main-content">
      <SharedMetrics />
      <div className="products-layout">
        <div className="chart-section">
          <div className="chart-card">
            <h3 className="chart-title">Product Category Distribution</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="products-section">
          <h3 className="section-title">All Products ({products.length})</h3>
          <div className="products-list">
            <div className="products-list-header">
              <div className="list-header-name">Product Name</div>
              <div className="list-header-category">Category</div>
              <div className="list-header-price">Price</div>
              <div className="list-header-actions">Add to Cart</div>
            </div>
            <div className="products-list-body">
              {products.map((product) => (
                <div key={product.id} className="product-list-item">
                  <div className="list-item-name">{product.name}</div>
                  <div className="list-item-category">
                    <span className="category-badge">{product.category}</span>
                  </div>
                  <div className="list-item-price">
                    <span className="current-price">{product.price}</span>
                    {product.originalPrice && (
                      <span className="original-price">{product.originalPrice}</span>
                    )}
                  </div>
                  <div className="list-item-tags">
                    <div style={{ fontWeight: 500, fontSize: '0.95em', marginBottom: 2 }}>Additional Info:</div>
                    {product.tags && product.tags.map((tag, i) => (
                      <span key={i} className="product-tag" style={{
                        display: 'inline-block',
                        background: '#f3f4f6',
                        color: '#374151',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '0.85em',
                        marginRight: 4
                      }}>{tag}</span>
                    ))}
                  </div>
                  <div className="list-item-actions">
                    <div className="quantity-selector">
                      <button 
                        className="quantity-btn"
                        onClick={() => decrementQuantity(product.id)}
                        disabled={getQuantity(product.id) <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="quantity-display">{getQuantity(product.id)}</span>
                      <button 
                        className="quantity-btn"
                        onClick={() => incrementQuantity(product.id)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button 
                      className={`action-btn add-to-cart ${addedToCartItems.has(product.id) ? 'added' : ''}`}
                      title={`Add ${getQuantity(product.id)} item(s) to Cart`}
                      onClick={() => handleAddToCart(product)}
                    >
                      {addedToCartItems.has(product.id) ? (
                        <Check size={16} />
                      ) : (
                        <ShoppingCart size={16} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <MessagePopup message={popupMessage} onClose={() => setPopupMessage('')} />
    </main>
  );
};

export default Products;
