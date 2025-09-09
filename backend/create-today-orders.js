const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

const createTodayOrders = async () => {
  console.log('Creating orders for today to test revenue calculation...');
  
  const todayOrders = [
    { userId: 5, customerName: 'Rajesh Kumar', product: 'Fresh Milk (1L)', quantity: 5, totalValue: 300.00, status: 'delivered' },
    { userId: 5, customerName: 'Priya Sharma', product: 'Organic Butter (500g)', quantity: 2, totalValue: 450.00, status: 'shipped' },
    { userId: 6, customerName: 'Arun Patel', product: 'Cheese Block (200g)', quantity: 3, totalValue: 675.00, status: 'processing' },
    { userId: 5, customerName: 'Meera Singh', product: 'Yogurt Cups (Pack of 6)', quantity: 4, totalValue: 520.00, status: 'delivered' },
    { userId: 6, customerName: 'Vikash Gupta', product: 'Heavy Cream (250ml)', quantity: 1, totalValue: 125.75, status: 'pending' }
  ];
  
  const today = new Date().toISOString();
  
  for (const order of todayOrders) {
    try {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO user_orders (userId, customerName, product, quantity, totalValue, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [order.userId, order.customerName, order.product, order.quantity, order.totalValue, order.status, today],
          function(err) {
            if (err) {
              console.log(`Error creating order for ${order.customerName}:`, err);
              reject(err);
            } else {
              console.log(`✅ Created today's order: ${order.product} for ${order.customerName} - ₹${order.totalValue}`);
              resolve();
            }
          }
        );
      });
    } catch (error) {
      console.error(`Error processing order for ${order.customerName}:`, error);
    }
  }
  
  const totalRevenue = todayOrders.reduce((sum, order) => sum + order.totalValue, 0);
  console.log(`\n📊 Total expected today's revenue: ₹${totalRevenue.toFixed(2)}`);
  
  db.all('SELECT * FROM user_orders WHERE DATE(createdAt) = DATE("now") ORDER BY createdAt DESC', [], (err, orders) => {
    if (err) {
      console.error('Error fetching today\'s orders:', err);
    } else {
      console.log('\n📋 Today\'s orders in database:');
      let actualRevenue = 0;
      orders.forEach(order => {
        console.log(`- ${order.product} (${order.customerName}) - ₹${order.totalValue} [${order.status}]`);
        actualRevenue += parseFloat(order.totalValue) || 0;
      });
      console.log(`\n💰 Actual today's revenue from DB: ₹${actualRevenue.toFixed(2)}`);
    }
    db.close();
    console.log('\n✅ Today\'s orders created successfully! You can now test the revenue calculation in the frontend.');
  });
};

createTodayOrders();