import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  BarChart3, 
  Tag, 
  Navigation,
  ShoppingCart,
  TrendingUp,
  Filter,
  X
} from 'lucide-react';
import { useSearch } from '../contexts/SearchContext';

const SearchResults = () => {
  const navigate = useNavigate();
  const { 
    searchQuery, 
    searchResults, 
    isSearchActive, 
    currentFilter, 
    clearSearch, 
    filterResults 
  } = useSearch();

  if (!isSearchActive || searchResults.length === 0) {
    return null;
  }

  const getIcon = (type) => {
    switch (type) {
      case 'product':
        return <Package size={16} />;
      case 'metric':
        return <BarChart3 size={16} />;
      case 'category':
        return <Tag size={16} />;
      case 'section':
        return <Navigation size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'product':
        return '#3b82f6';
      case 'metric':
        return '#10b981';
      case 'category':
        return '#f59e0b';
      case 'section':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  const handleResultClick = (result) => {
    if (result.type === 'section') {
      navigate(result.path);
      clearSearch();
    } else if (result.type === 'product') {
      navigate('/dashboard/products');
      clearSearch();
    } else if (result.type === 'metric') {
      navigate('/dashboard');
      clearSearch();
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Results', count: searchResults.length },
    { value: 'product', label: 'Products', count: searchResults.filter(r => r.type === 'product').length },
    { value: 'metric', label: 'Metrics', count: searchResults.filter(r => r.type === 'metric').length },
    { value: 'category', label: 'Categories', count: searchResults.filter(r => r.type === 'category').length },
    { value: 'section', label: 'Sections', count: searchResults.filter(r => r.type === 'section').length }
  ].filter(option => option.count > 0);

  return (
    <div className="search-results-overlay">
      <div className="search-results-container">
        <div className="search-results-header">
          <div className="search-results-title">
            <span>Search Results for "{searchQuery}"</span>
            <span className="results-count">({searchResults.length} found)</span>
          </div>
          <button onClick={clearSearch} className="search-close-btn">
            <X size={18} />
          </button>
        </div>

        <div className="search-filters">
          {filterOptions.map(option => (
            <button
              key={option.value}
              onClick={() => filterResults(option.value)}
              className={`search-filter-btn ${currentFilter === option.value ? 'active' : ''}`}
            >
              <Filter size={14} />
              {option.label} ({option.count})
            </button>
          ))}
        </div>

        <div className="search-results-list">
          {searchResults.map((result, index) => (
            <div
              key={`${result.type}-${result.id || index}`}
              className="search-result-item"
              onClick={() => handleResultClick(result)}
            >
              <div className="search-result-icon" style={{ color: getTypeColor(result.type) }}>
                {getIcon(result.type)}
              </div>
              
              <div className="search-result-content">
                <div className="search-result-main">
                  <h4 className="search-result-title">
                    {result.name || result.title}
                  </h4>
                  <span className="search-result-type" style={{ color: getTypeColor(result.type) }}>
                    {result.type}
                  </span>
                </div>
                
                <div className="search-result-details">
                  {result.type === 'product' && (
                    <div className="product-details">
                      <span className="product-category">{result.category}</span>
                      <span className="product-price">{result.price}</span>
                      {result.discount > 0 && (
                        <span className="product-discount">{result.discount}% off</span>
                      )}
                    </div>
                  )}
                  
                  {result.type === 'metric' && (
                    <div className="metric-details">
                      <span className="metric-value">{result.value}</span>
                      <span className="metric-trend">
                        <TrendingUp size={12} />
                        {result.trend}
                      </span>
                    </div>
                  )}
                  
                  {result.description && (
                    <p className="search-result-description">{result.description}</p>
                  )}
                  
                  {result.tags && (
                    <div className="search-result-tags">
                      {result.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="search-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {result.type === 'product' && (
                <div className="search-result-actions">
                  <button className="quick-action-btn">
                    <ShoppingCart size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {searchResults.length === 0 && (
          <div className="no-results">
            <p>No results found for "{searchQuery}"</p>
            <p>Try searching for products, metrics, categories, or sections.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;