const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

const updateOrdersWithValues = async () => {
  console.log('Updating existing orders with totalValue...');
  
  db.all("PRAGMA table_info(user_orders)", (err, columns) => {
    if (err) {
      console.error('Error getting table info:', err);
      return;
    }
    
    console.log('Current user_orders table columns:');
    columns.forEach(col => {
      console.log(`- ${col.name} (${col.type})`);
    });
    
    const hasTotalValue = columns.some(col => col.name === 'totalValue');
    
    if (!hasTotalValue) {
      console.log('\n🔧 Adding totalValue column...');
      db.run("ALTER TABLE user_orders ADD COLUMN totalValue REAL DEFAULT 0", (err) => {
        if (err) {
          console.error('Error adding totalValue column:', err);
        } else {
          console.log('✅ Successfully added totalValue column');
          updateExistingOrders();
        }
      });
    } else {
      console.log('\n✅ totalValue column already exists');
      updateExistingOrders();
    }
  });
};

const updateExistingOrders = () => {
  const updateSql = `
    UPDATE user_orders 
    SET totalValue = CASE 
      WHEN LOWER(product) LIKE '%milk%' THEN quantity * 60.0
      WHEN LOWER(product) LIKE '%butter%' THEN quantity * 150.0
      WHEN LOWER(product) LIKE '%cheese%' THEN quantity * 200.0
      WHEN LOWER(product) LIKE '%yogurt%' THEN quantity * 80.0
      WHEN LOWER(product) LIKE '%cream%' THEN quantity * 120.0
      ELSE quantity * 50.0
    END
    WHERE totalValue = 0 OR totalValue IS NULL
  `;
  
  db.run(updateSql, function(err) {
    if (err) {
      console.error('Error updating existing orders:', err);
    } else {
      console.log(`✅ Updated ${this.changes} existing orders with totalValue`);
      
      createTodayOrders();
    }
  });
};

const createTodayOrders = () => {
  console.log('\n📅 Creating fresh orders for today...');
  
  const todayOrders = [
    { userId: 5, customerName: 'Rajesh Kumar', product: 'Fresh Milk (1L)', quantity: 5, totalValue: 300.00, status: 'delivered' },
    { userId: 5, customerName: 'Priya Sharma', product: 'Organic Butter (500g)', quantity: 2, totalValue: 450.00, status: 'shipped' },
    { userId: 6, customerName: 'Arun Patel', product: 'Cheese Block (200g)', quantity: 3, totalValue: 675.00, status: 'processing' }
  ];
  
  const today = new Date().toISOString();
  let processed = 0;
  
  todayOrders.forEach((order, index) => {
    db.run(
      'INSERT INTO user_orders (userId, customerName, product, quantity, totalValue, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [order.userId, order.customerName, order.product, order.quantity, order.totalValue, order.status, today],
      function(err) {
        processed++;
        if (err) {
          console.log(`❌ Error creating order for ${order.customerName}:`, err.message);
        } else {
          console.log(`✅ Created today's order: ${order.product} - ₹${order.totalValue}`);
        }
        
        if (processed === todayOrders.length) {
          showTodaysRevenue();
        }
      }
    );
  });
};

const showTodaysRevenue = () => {
  db.all('SELECT * FROM user_orders WHERE DATE(createdAt) = DATE("now") ORDER BY createdAt DESC', [], (err, orders) => {
    if (err) {
      console.error('Error fetching today\'s orders:', err);
    } else {
      console.log('\n📋 Today\'s orders in database:');
      let totalRevenue = 0;
      orders.forEach(order => {
        const value = parseFloat(order.totalValue) || 0;
        totalRevenue += value;
        console.log(`- ${order.product} (${order.customerName}) - ₹${value.toFixed(2)} [${order.status}]`);
      });
      console.log(`\n💰 Today's total revenue: ₹${totalRevenue.toFixed(2)}`);
      console.log('\n🎉 Database is ready! The "Today Revenue" metric should now show the correct value.');
    }
    db.close();
  });
};

updateOrdersWithValues();