import React from 'react';
import SharedMetrics from './SharedMetrics';
import FinanceTable from './FinanceTable';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { getApiUrl } from '../config/api';
import { getProductPrice, extractNumericPrice } from '../data/products';

const Finance = () => {
  const { token } = useAuth();
  const { cart } = useCart();
  const [financeItems, setFinanceItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');


  const fetchOrdersForFinance = async () => {
    if (!token) return;
    
    setLoading(true);
    setError('');
    try {
      const res = await fetch(getApiUrl('/orders'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
      
      const orders = await res.json();
      
      
      const items = orders.map(order => {
        let productRate = 0;
        
        
        const cartItem = cart.find(item => item.name === order.product);
        if (cartItem && cartItem.price) {
          productRate = extractNumericPrice(cartItem.price);
        } else {
        
          productRate = getProductPrice(order.product);
        }
        
        const quantity = parseInt(order.quantity) || 1;
        const totalValue = quantity * productRate;
        
        return {
          id: order.id,
          productName: order.product,
          quantity: quantity,
          productRate: productRate,
          totalValue: totalValue,
          customerName: order.customerName,
          status: order.status,
          createdAt: order.created_at || order.createdAt,
          orderId: order.id
        };
      });
      
      setFinanceItems(items);
    } catch (err) {
      setError(`Could not fetch orders for finance: ${err.message}`);
      setFinanceItems([]);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchOrdersForFinance();
  }, [token]); 

  
  React.useEffect(() => {
    const handleOrderCreated = () => {
      fetchOrdersForFinance();
    };

    window.addEventListener('orderCreated', handleOrderCreated);
    return () => window.removeEventListener('orderCreated', handleOrderCreated);
  }, []);

  return (
    <main className="main-content">
      <SharedMetrics />
      
      {error && (
        <div style={{ 
          color: 'red', 
          marginBottom: '1rem', 
          padding: '1rem', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '6px' 
        }}>
          {error}
        </div>
      )}
      
      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          color: '#6b7280' 
        }}>
          Loading finance data...
        </div>
      )}
      
      <FinanceTable items={financeItems} />
    </main>
  );
};

export default Finance;
