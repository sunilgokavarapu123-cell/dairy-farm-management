export const products = [
  {
    id: 1,
    name: 'Fresh Milk',
    category: 'Dairy Products',
    price: '₹25,000',
    originalPrice: '₹28,000',
    numericPrice: 25000,
    discount: 11,
    stock: 50,
    tags: ['Fresh', 'Organic', 'Premium']
  },
  {
    id: 2,
    name: 'Organic Butter',
    category: 'Dairy Products',
    price: '₹15,000',
    originalPrice: '₹17,000',
    numericPrice: 15000,
    discount: 12,
    stock: 30,
    tags: ['Organic', 'Creamy', 'Natural']
  },
  {
    id: 3,
    name: 'Farm Cheese',
    category: 'Dairy Products',
    price: '₹30,000',
    originalPrice: '₹33,000',
    numericPrice: 30000,
    discount: 9,
    stock: 25,
    tags: ['Artisan', 'Aged', 'Premium']
  },
  {
    id: 4,
    name: 'Yogurt',
    category: 'Dairy Products',
    price: '₹12,000',
    originalPrice: '₹14,000',
    numericPrice: 12000,
    discount: 14,
    stock: 40,
    tags: ['Probiotic', 'Healthy', 'Fresh']
  },
  {
    id: 5,
    name: 'Heavy Cream',
    category: 'Dairy Products',
    price: '₹18,000',
    originalPrice: '₹20,000',
    numericPrice: 18000,
    discount: 10,
    stock: 20,
    tags: ['Rich', 'Premium', 'Cooking']
  },
  {
    id: 6,
    name: 'Cottage Cheese',
    category: 'Dairy Products',
    price: '₹20,000',
    originalPrice: '₹22,000',
    numericPrice: 20000,
    discount: 9,
    stock: 35,
    tags: ['Protein Rich', 'Healthy', 'Fresh']
  },
  // Farm Equipment and Feed
  {
    id: 7,
    name: 'Premium Dairy Feed',
    category: 'Animal Feed',
    price: '₹2,500',
    originalPrice: '₹3,000',
    numericPrice: 2500,
    discount: 17,
    stock: 45,
    tags: ['Organic', 'Premium', 'Balanced']
  },
  {
    id: 8,
    name: 'Milking Machine Pro',
    category: 'Equipment',
    price: '₹45,000',
    originalPrice: '₹50,000',
    numericPrice: 45000,
    discount: 10,
    stock: 12,
    tags: ['Automated', 'Efficient', 'Professional']
  },
  {
    id: 9,
    name: 'Organic Cow Feed',
    category: 'Animal Feed',
    price: '₹1,800',
    originalPrice: '₹2,200',
    numericPrice: 1800,
    discount: 18,
    stock: 78,
    tags: ['Organic', 'Healthy', 'Natural']
  },
  {
    id: 10,
    name: 'Veterinary Kit',
    category: 'Veterinary',
    price: '₹8,500',
    originalPrice: '₹10,000',
    numericPrice: 8500,
    discount: 15,
    stock: 23,
    tags: ['Complete', 'Professional', 'Health']
  },
  {
    id: 11,
    name: 'Milk Storage Tank',
    category: 'Equipment',
    price: '₹75,000',
    originalPrice: '₹85,000',
    numericPrice: 75000,
    discount: 12,
    stock: 8,
    tags: ['Large Capacity', 'Durable', 'Storage']
  }
];

export const getProductByName = (productName) => {
  return products.find(product => product.name === productName);
};

export const getProductPrice = (productName) => {
  const product = getProductByName(productName);
  return product ? product.numericPrice : 10000; 
};

export const extractNumericPrice = (priceString) => {
  if (!priceString) return 0;
  const numericValue = priceString.replace(/[^\d]/g, '');
  return numericValue ? parseInt(numericValue, 10) : 0;
};

export default { products, getProductByName, getProductPrice, extractNumericPrice };