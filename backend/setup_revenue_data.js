const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const setupRevenueData = () => {
  const dbPath = path.join(__dirname, 'orders.db');
  const db = new sqlite3.Database(dbPath);

  const today = new Date().toISOString();
  
  console.log('🚀 Setting up revenue data for today:', today.split('T')[0]);

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS finance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      orderId INTEGER,
      customerName TEXT,
      productName TEXT,
      quantity INTEGER,
      productRate REAL,
      totalValue REAL,
      orderStatus TEXT DEFAULT 'pending',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (orderId) REFERENCES user_orders(id)
    )`, (err) => {
      if (err) {
        console.error('❌ Error creating finance_records table:', err.message);
      } else {
        console.log('✅ finance_records table ready');
      }
    });

    db.run(`CREATE TABLE IF NOT EXISTS user_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      customerName TEXT,
      product TEXT NOT NULL,
      productName TEXT,
      quantity INTEGER NOT NULL,
      productRate REAL,
      totalValue REAL DEFAULT 0,
      status TEXT DEFAULT 'processing',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('❌ Error creating user_orders table:', err.message);
      } else {
        console.log('✅ user_orders table ready');
      }
    });

    db.all("PRAGMA table_info(user_orders)", (err, columns) => {
      const hasProductName = columns && columns.some(col => col.name === 'productName');
      const hasProductRate = columns && columns.some(col => col.name === 'productRate');
      
      if (!hasProductName) {
        console.log('Adding productName column to user_orders table...');
        db.run("ALTER TABLE user_orders ADD COLUMN productName TEXT", (err) => {
          if (!err) {
            console.log('✅ Successfully added productName column to user_orders table');
          }
        });
      }

      if (!hasProductRate) {
        console.log('Adding productRate column to user_orders table...');
        db.run("ALTER TABLE user_orders ADD COLUMN productRate REAL", (err) => {
          if (!err) {
            console.log('✅ Successfully added productRate column to user_orders table');
          }
        });
      }
    });

    const sampleFinanceData = [
      {
        userId: 9, // sunilg123@gmail.com user ID
        customerName: 'Rajesh Kumar',
        productName: 'Buffalo Milk',
        quantity: 10,
        productRate: 65.50,
        totalValue: 655.0,
        orderStatus: 'delivered',
        createdAt: today
      },
      {
        userId: 9,
        customerName: 'Priya Sharma',
        productName: 'Cow Milk',
        quantity: 15,
        productRate: 45.0,
        totalValue: 675.0,
        orderStatus: 'shipped',
        createdAt: today
      },
      {
        userId: 9,
        customerName: 'Amit Singh',
        productName: 'Cheese',
        quantity: 5,
        productRate: 120.0,
        totalValue: 600.0,
        orderStatus: 'processing',
        createdAt: today
      },
      {
        userId: 9,
        customerName: 'Sunita Devi',
        productName: 'Yogurt',
        quantity: 8,
        productRate: 80.0,
        totalValue: 640.0,
        orderStatus: 'delivered',
        createdAt: today
      },
      {
        userId: 9,
        customerName: 'Vikram Patel',
        productName: 'Butter',
        quantity: 3,
        productRate: 250.0,
        totalValue: 750.0,
        orderStatus: 'shipped',
        createdAt: today
      }
    ];

    const sampleOrdersData = [
      {
        userId: 9,
        customerName: 'Rajesh Kumar',
        product: 'Buffalo Milk',
        productName: 'Buffalo Milk',
        quantity: 10,
        productRate: 65.50,
        totalValue: 655.0,
        status: 'delivered',
        createdAt: today
      },
      {
        userId: 9,
        customerName: 'Priya Sharma',
        product: 'Cow Milk',
        productName: 'Cow Milk',
        quantity: 15,
        productRate: 45.0,
        totalValue: 675.0,
        status: 'pending',
        createdAt: today
      },
      {
        userId: 9,
        customerName: 'Amit Singh',
        product: 'Cheese',
        productName: 'Cheese',
        quantity: 5,
        productRate: 120.0,
        totalValue: 600.0,
        status: 'processing',
        createdAt: today
      },
      {
        userId: 9,
        customerName: 'Sunita Devi',
        product: 'Yogurt',
        productName: 'Yogurt',
        quantity: 8,
        productRate: 80.0,
        totalValue: 640.0,
        status: 'delivered',
        createdAt: today
      },
      {
        userId: 9,
        customerName: 'Vikram Patel',
        product: 'Butter',
        productName: 'Butter',
        quantity: 3,
        productRate: 250.0,
        totalValue: 750.0,
        status: 'pending',
        createdAt: today
      }
    ];

    const todayDateOnly = today.split('T')[0];
    db.run("DELETE FROM finance_records WHERE date(createdAt) = ?", [todayDateOnly], (err) => {
      if (!err) {
        console.log('🧹 Cleared existing finance records for today');
      }
    });
    
    db.run("DELETE FROM user_orders WHERE date(createdAt) = ? AND userId = 9", [todayDateOnly], (err) => {
      if (!err) {
        console.log('🧹 Cleared existing orders for today');
      }
    });

    const insertFinanceQuery = `
      INSERT INTO finance_records (
        userId, customerName, productName, quantity, 
        productRate, totalValue, orderStatus, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertOrderQuery = `
      INSERT INTO user_orders (
        userId, customerName, product, productName, quantity,
        productRate, totalValue, status, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    setTimeout(() => {
      console.log('📊 Inserting finance records...');
      sampleFinanceData.forEach((record, index) => {
        db.run(insertFinanceQuery, [
          record.userId,
          record.customerName,
          record.productName,
          record.quantity,
          record.productRate,
          record.totalValue,
          record.orderStatus,
          record.createdAt
        ], function(err) {
          if (err) {
            console.error(`❌ Error inserting finance record ${index + 1}:`, err.message);
          } else {
            console.log(`✅ Finance record ${index + 1} inserted with ID: ${this.lastID}`);
          }
        });
      });

      console.log('🛒 Inserting order records...');
      sampleOrdersData.forEach((record, index) => {
        db.run(insertOrderQuery, [
          record.userId,
          record.customerName,
          record.product,
          record.productName,
          record.quantity,
          record.productRate,
          record.totalValue,
          record.status,
          record.createdAt
        ], function(err) {
          if (err) {
            console.error(`❌ Error inserting order record ${index + 1}:`, err.message);
          } else {
            console.log(`✅ Order record ${index + 1} inserted with ID: ${this.lastID}`);
          }
        });
      });

      setTimeout(() => {
        console.log('\n📈 Expected Revenue Calculations:');
        
        const deliveredFinanceRevenue = sampleFinanceData
          .filter(r => ['delivered', 'shipped', 'processing'].includes(r.orderStatus))
          .reduce((sum, r) => sum + r.totalValue, 0);
        
        const totalOrdersValue = sampleOrdersData.reduce((sum, r) => sum + r.totalValue, 0);
        const totalOrdersCount = sampleOrdersData.length;
        
        console.log(`💰 Today's Revenue (Finance): ₹${deliveredFinanceRevenue.toLocaleString('en-IN')}`);
        console.log(`🛒 Today's Orders Value: ₹${totalOrdersValue.toLocaleString('en-IN')}`);
        console.log(`📦 Today's Orders Count: ${totalOrdersCount}`);
        
        console.log('\n✨ Sample data creation completed!');
        console.log('🔄 Refresh the revenue tab to see the updated values.');

        db.close((err) => {
          if (err) {
            console.error('❌ Error closing database:', err.message);
          } else {
            console.log('✅ Database connection closed.');
          }
        });
      }, 1000);
    }, 500);
  });
};

setupRevenueData();