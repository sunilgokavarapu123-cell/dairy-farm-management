import React from 'react';
import './FinanceTable.css';

const FinanceTable = ({ items, readonly = true }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <div className="finance-table-container">
      <div className="finance-header">
        <h2>Finance Details - Orders Summary</h2>
        {readonly && (
          <span className="readonly-badge">
            <span className="readonly-icon">🔒</span>
            Read Only
          </span>
        )}
      </div>
      
      <div className="finance-stats">
        <div className="finance-stat">
          <span className="stat-label">Total Orders:</span>
          <span className="stat-value">{items.length}</span>
        </div>
        <div className="finance-stat">
          <span className="stat-label">Total Revenue:</span>
          <span className="stat-value">
            {items.reduce((sum, item) => sum + (item.totalValue || 0), 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
          </span>
        </div>
        <div className="finance-stat">
          <span className="stat-label">Active Orders:</span>
          <span className="stat-value">
            {items.filter(item => item.status === 'processing' || item.status === 'confirmed').length}
          </span>
        </div>
      </div>

      <table className="finance-table">
        <thead>
          <tr>
            <th>Serial No.</th>
            <th>Order Date</th>
            <th>Customer Name</th>
            <th>Product Name</th>
            <th>Quantity</th>
            <th>Unit Rate</th>
            <th>Total Value</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items && items.length > 0 ? (
            <>
              {items.map((item, idx) => (
                <tr key={item.orderId || idx} className="readonly-row">
                  <td>{idx + 1}</td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>{item.customerName || 'N/A'}</td>
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                  <td>{item.productRate.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                  <td className="total-value">{item.totalValue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                  <td>
                    <span className={`status-badge ${item.status}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={7} style={{ textAlign: 'right', padding: '1rem', fontWeight: 'bold' }}>
                  <div className="total-summary">
                    <span>Grand Total: </span>
                    <span className="grand-total">
                      {items.reduce((sum, item) => sum + (item.totalValue || 0), 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </span>
                  </div>
                </td>
              </tr>
            </>
          ) : (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <p>No orders available</p>
                  <small>Create orders from the Orders section to see finance data here</small>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FinanceTable;
