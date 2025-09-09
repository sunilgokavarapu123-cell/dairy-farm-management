const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const addDynamicOrder = () => {
  const dbPath = path.join(__dirname, 'orders.db');
  const db = new sqlite3.Database(dbPath);

  const today = new Date().toISOString();
  const orderValue = Math.floor(Math.random() * 1000) + 200;
  const quantity = Math.floor(Math.random() * 10) + 1; 
  const rate = Math.floor(orderValue / quantity * 100) / 100; 
  
  const customers = ['Amit Verma', 'Sita Singh', 'Rahul Kumar', 'Priya Patel', 'Vijay Sharma'];
  const products = ['Fresh Milk', 'Organic Yogurt', 'Butter', 'Cheese', 'Paneer'];
  const statuses = ['delivered', 'shipped', 'processing'];
  
  const customer = customers[Math.floor(Math.random() * customers.length)];
  const product = products[Math.floor(Math.random() * products.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  console.log('🆕 Adding new dynamic order:', {
    customer,
    product,
    quantity,
    rate: rate.toFixed(2),
    value: orderValue,
    status
  });

  db.serialize(() => {
    // Insert new order
    const insertOrderQuery = `
      INSERT INTO user_orders (
        userId, customerName, product, productName, quantity,
        productRate, totalValue, status, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(insertOrderQuery, [
      9, // User ID for sunilg123@gmail.com
      customer,
      product,
      product,
      quantity,
      rate,
      orderValue,
      'pending',
      today
    ], function(err) {
      if (err) {
        console.error('❌ Error inserting order:', err.message);
      } else {
        console.log(`✅ Order inserted with ID: ${this.lastID}`);
      }
    });

    if (['delivered', 'shipped', 'processing'].includes(status)) {
      const insertFinanceQuery = `
        INSERT INTO finance_records (
          userId, customerName, productName, quantity, 
          productRate, totalValue, orderStatus, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(insertFinanceQuery, [
        9,
        customer,
        product,
        quantity,
        rate,
        orderValue,
        status,
        today
      ], function(err) {
        if (err) {
          console.error('❌ Error inserting finance record:', err.message);
        } else {
          console.log(`✅ Finance record inserted with ID: ${this.lastID}`);
          console.log(`💰 This will add ₹${orderValue} to today's revenue!`);
        }
      });
    }

    setTimeout(() => {
      db.all(`
        SELECT COUNT(*) as count, SUM(totalValue) as total 
        FROM user_orders 
        WHERE userId = 9 AND date(createdAt) = date('now')
      `, (err, orderResult) => {
        if (!err && orderResult[0]) {
          console.log(`📊 Today's Orders: ${orderResult[0].count} orders, ₹${orderResult[0].total || 0} total`);
        }
      });

      db.all(`
        SELECT COUNT(*) as count, SUM(totalValue) as total 
        FROM finance_records 
        WHERE userId = 9 AND date(createdAt) = date('now') 
        AND orderStatus IN ('delivered', 'shipped', 'processing')
      `, (err, financeResult) => {
        if (!err && financeResult[0]) {
          console.log(`💰 Today's Revenue: ₹${financeResult[0].total || 0} from ${financeResult[0].count} records`);
        }
      });

      console.log('\n🔄 The revenue tab will automatically update within 30 seconds!');
      
      db.close((err) => {
        if (err) {
          console.error('❌ Error closing database:', err.message);
        } else {
          console.log('✅ Database connection closed.');
        }
      });
    }, 500);
  });
};

addDynamicOrder();