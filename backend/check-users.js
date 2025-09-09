const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.all('SELECT id, email, firstName, lastName, role FROM users', (err, users) => {
  if (err) {
    console.error('Error fetching users:', err);
  } else {
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.firstName} ${user.lastName}, Role: ${user.role}`);
    });
  }
  db.close();
});