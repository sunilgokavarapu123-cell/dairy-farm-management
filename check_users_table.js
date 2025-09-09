const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./backend/orders.db');

db.all("PRAGMA table_info(users)", (err, columns) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log('Users table columns:');
  columns.forEach(col => {
    console.log(`${col.cid}: ${col.name} (${col.type})`);
  });
  process.exit(0);
});
