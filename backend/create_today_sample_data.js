const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const createTodaySampleData = () => {
  const dbPath = path.join(__dirname, 'dairy_farm.db');
  const db = new sqlite3.Database(dbPath);

  const today = new Date().toISOString();
  
  console.log('🚀 Creating sample data for today:', today.split('T')[0]);

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

  // Sample orders for today
  const sampleOrdersData = [
    {
      userId: 9,
      customerName: 'Rajesh Kumar',
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
      productName: 'Butter',
      quantity: 3,
      productRate: 250.0,
      totalValue: 750.0,
      status: 'pending',
      createdAt: today
    }
  ];

  const insertFinanceQuery = `
    INSERT INTO user_finance (
      userId, customerName, productName, quantity, 
      productRate, totalValue, orderStatus, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const insertOrderQuery = `
    INSERT INTO user_orders (
      userId, customerName, productName, quantity,
      productRate, totalValue, status, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.serialize(() => {
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
  });

  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err.message);
    } else {
      console.log('✅ Database connection closed.');
    }
  });
};

createTodaySampleData();