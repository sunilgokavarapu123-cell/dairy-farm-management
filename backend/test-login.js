const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const db = new sqlite3.Database('database.sqlite');

const testLogin = async () => {
  const email = 'sunilg123@gmail.com';
  const password = 'admin123';
  
  console.log('Testing login with:', { email, password });
  
  db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], async (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return;
    }
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      passwordHash: user.password.substring(0, 20) + '...'
    });
    
    try {
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log('Password validation result:', isValidPassword);
      
      if (isValidPassword) {
        console.log('✅ Login would succeed');
      } else {
        console.log('❌ Login would fail - password mismatch');
        
        // Test if the password was stored correctly
        const testHash = await bcrypt.hash(password, 10);
        console.log('Test hash for comparison:', testHash.substring(0, 20) + '...');
        const testComparison = await bcrypt.compare(password, testHash);
        console.log('Test hash comparison (should be true):', testComparison);
      }
    } catch (error) {
      console.error('Bcrypt error:', error);
    }
    
    db.close();
  });
};

testLogin();