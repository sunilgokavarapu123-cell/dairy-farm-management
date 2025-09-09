const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const db = new sqlite3.Database('database.sqlite');

const createAdminUsers = async () => {
  console.log('Creating admin users...');
  
  const adminUsers = [
    { email: 'sunilg123@gmail.com', firstName: 'Sunil', lastName: 'G', password: 'admin123', role: 'admin' },
    { email: 'vamsig1234@gmail.com', firstName: 'Vamsi', lastName: 'G', password: 'admin123', role: 'admin' }
  ];
  
  for (const user of adminUsers) {
    try {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT OR REPLACE INTO users (email, firstName, lastName, password, role) VALUES (?, ?, ?, ?, ?)',
          [user.email, user.firstName, user.lastName, hashedPassword, user.role],
          function(err) {
            if (err) {
              console.log(`Error creating user ${user.email}:`, err);
              reject(err);
            } else {
              console.log(`✅ Created admin user: ${user.email}`);
              resolve();
            }
          }
        );
      });
    } catch (error) {
      console.error(`Error processing user ${user.email}:`, error);
    }
  }
  
  db.all('SELECT id, email, firstName, lastName, role FROM users', (err, users) => {
    if (err) {
      console.error('Error fetching users:', err);
    } else {
      console.log('\nAll users in database:');
      users.forEach(user => {
        console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.firstName} ${user.lastName}, Role: ${user.role}`);
      });
    }
    db.close();
    console.log('\nAdmin users setup complete!');
  });
};

createAdminUsers();