const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.all('SELECT * FROM users', (err, users) => {
  if (err) {
    console.error('Error fetching users:', err);
  } else {
    console.log('All users in database:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.firstName} ${user.lastName}, Role: ${user.role}, Password: ${user.password?.substring(0, 20)}...`);
    });
    
    console.log('\n--- Testing login for sunilg123@gmail.com ---');
    db.get('SELECT * FROM users WHERE email = ?', ['sunilg123@gmail.com'], (err, user) => {
      if (err) {
        console.error('Error:', err);
      } else if (user) {
        console.log('Query result:', {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          passwordHash: user.password?.substring(0, 20) + '...'
        });
      } else {
        console.log('No user found with that email');
      }
      db.close();
    });
  }
});