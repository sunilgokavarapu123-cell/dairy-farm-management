import React, { createContext, useState, useContext, useCallback } from 'react';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

const searchableData = {
    products: [
      {
        id: 1,
        name: 'Premium Dairy Feed',
        category: 'Animal Feed',
        price: '₹2,500',
        originalPrice: '₹3,000',
        discount: 17,
        stock: 45,
        tags: ['Organic', 'Premium', 'Balanced'],
        type: 'product'
      },
      {
        id: 2,
        name: 'Milking Machine Pro',
        category: 'Equipment',
        price: '₹45,000',
        originalPrice: '₹50,000',
        discount: 10,
        stock: 12,
        tags: ['Automated', 'Efficient', 'Professional'],
        type: 'product'
      },
      {
        id: 3,
        name: 'Organic Cow Feed',
        category: 'Animal Feed',
        price: '₹1,800',
        originalPrice: '₹2,200',
        discount: 18,
        stock: 78,
        tags: ['Organic', 'Healthy', 'Natural'],
        type: 'product'
      },
      {
        id: 4,
        name: 'Veterinary Kit',
        category: 'Veterinary',
        price: '₹3,500',
        originalPrice: '₹4,000',
        discount: 12,
        stock: 25,
        tags: ['Medical', 'Emergency', 'Complete'],
        type: 'product'
      },
      {
        id: 5,
        name: 'Fresh Milk Storage Tank',
        category: 'Equipment',
        price: '₹85,000',
        originalPrice: '₹95,000',
        discount: 11,
        stock: 8,
        tags: ['Stainless Steel', 'Cooling', 'Large'],
        type: 'product'
      },
      {
        id: 6,
        name: 'Mineral Supplements',
        category: 'Veterinary',
        price: '₹1,200',
        originalPrice: '₹1,500',
        discount: 20,
        stock: 60,
        tags: ['Health', 'Nutrition', 'Essential'],
        type: 'product'
      }
    ],
    metrics: [
      {
        id: 'total-cattle',
        title: 'Total Cattle',
        value: '248',
        trend: '+5 this month',
        description: 'Current number of cattle in the farm',
        type: 'metric'
      },
      {
        id: 'daily-production',
        title: 'Daily Production',
        value: '1,850L',
        trend: '+12% yesterday',
        description: 'Daily milk production in liters',
        type: 'metric'
      },
      {
        id: 'today-revenue',
        title: 'Today Revenue',
        value: '₹45,200',
        trend: '+8% avg',
        description: 'Revenue generated today',
        type: 'metric'
      },
      {
        id: 'active-orders',
        title: 'Active Orders',
        value: '12',
        trend: '3 new today',
        description: 'Currently active orders',
        type: 'metric'
      }
    ],
    categories: [
      { name: 'Dairy Products', value: 35, type: 'category' },
      { name: 'Animal Feed', value: 25, type: 'category' },
      { name: 'Equipment', value: 20, type: 'category' },
      { name: 'Veterinary', value: 15, type: 'category' },
      { name: 'Other', value: 5, type: 'category' }
    ],
    sections: [
      { name: 'Dashboard', path: '/dashboard', description: 'Main dashboard with metrics and charts', type: 'section' },
      { name: 'Products', path: '/dashboard/products', description: 'Product catalog and inventory', type: 'section' },
      { name: 'Orders', path: '/dashboard/orders', description: 'Order management and tracking', type: 'section' },
      { name: 'Finance', path: '/dashboard/finance', description: 'Financial overview and reports', type: 'section' }
    ]
};

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('all');

  const performSearch = useCallback((query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearchActive(false);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    let results = [];

    const productResults = searchableData.products.filter(product => 
      product.name.toLowerCase().includes(lowerQuery) ||
      product.category.toLowerCase().includes(lowerQuery) ||
      product.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );

  
    const metricResults = searchableData.metrics.filter(metric =>
      metric.title.toLowerCase().includes(lowerQuery) ||
      metric.description.toLowerCase().includes(lowerQuery)
    );

    
    const categoryResults = searchableData.categories.filter(category =>
      category.name.toLowerCase().includes(lowerQuery)
    );

    const sectionResults = searchableData.sections.filter(section =>
      section.name.toLowerCase().includes(lowerQuery) ||
      section.description.toLowerCase().includes(lowerQuery)
    );


    results = [
      ...productResults,
      ...metricResults,
      ...categoryResults,
      ...sectionResults
    ];

    
    if (currentFilter !== 'all') {
      results = results.filter(result => result.type === currentFilter);
    }

    results.sort((a, b) => {
      const aName = (a.name || a.title || '').toLowerCase();
      const bName = (b.name || b.title || '').toLowerCase();
      
      const aExact = aName.includes(lowerQuery);
      const bExact = bName.includes(lowerQuery);
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

    setSearchResults(results);
    setIsSearchActive(true);
  }, [currentFilter]);

  const updateSearchQuery = useCallback((query) => {
    setSearchQuery(query);
    performSearch(query);
  }, [performSearch]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchActive(false);
  }, []);

  const filterResults = useCallback((filterType) => {
    setCurrentFilter(filterType);
    if (searchQuery) {
      performSearch(searchQuery);
    }
  }, [searchQuery, performSearch]);

  const value = {
    searchQuery,
    searchResults,
    isSearchActive,
    currentFilter,
    updateSearchQuery,
    clearSearch,
    filterResults,
    searchableData
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

export default SearchContext;