
const express = require('express');
const sqlite3Pkg = require('sqlite3');
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here-change-in-production';

console.log('🔧 Database Configuration:');
console.log(`  - SQL Server: ${process.env.DB_SERVER || 'localhost'}`);
console.log(`  - Database: ${process.env.DB_NAME || 'DairyFarmDB'}`);

console.log(`  - User: ${process.env.DB_USER || 'sa'}`);
console.log(`  - Environment: ${process.env.NODE_ENV || 'development'}`);

const sqlite3 = sqlite3Pkg.verbose();
const db = new sqlite3.Database('./orders.db', (err) => {
  if (err) {
    console.error('Could not connect to SQLite database', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

const sqlConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'your-password',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'DairyFarmDB',
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
  requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT) || 30000,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true' || false,
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let sqlPool;

async function initializeDatabase() {
  try {
    sqlPool = await sql.connect(sqlConfig);
    console.log('Connected to SQL Server database');
    
    await sqlPool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(255) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        firstName NVARCHAR(100) NOT NULL,
        lastName NVARCHAR(100) NOT NULL,
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE(),
        resetToken NVARCHAR(255),
        resetTokenExpiry DATETIME
      )
    `);
    
    await sqlPool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_orders' AND xtype='U')
      CREATE TABLE user_orders (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NOT NULL,
        customerName NVARCHAR(255),
        product NVARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        totalValue DECIMAL(10,2) DEFAULT 0,
        status NVARCHAR(50) DEFAULT 'processing',
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);
    
    await sqlPool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='finance_records' AND xtype='U')
      CREATE TABLE finance_records (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NOT NULL,
        orderId INT,
        customerName NVARCHAR(255) NOT NULL,
        productName NVARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        productRate DECIMAL(10,2) NOT NULL,
        totalValue DECIMAL(10,2) NOT NULL,
        orderStatus NVARCHAR(50) DEFAULT 'processing',
        transactionType NVARCHAR(50) DEFAULT 'sale',
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (orderId) REFERENCES user_orders(id)
      )
    `);
    
    console.log('Database tables created/verified');
  } catch (err) {
    console.error('SQL Server connection failed:', err);
    console.log('Falling back to SQLite for all operations');
  }
}

initializeDatabase();

db.run(`CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customerName TEXT,
  product TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  resetToken TEXT,
  resetTokenExpiry DATETIME
)`);

db.all("PRAGMA table_info(users)", (err, columns) => {
  if (!err && Array.isArray(columns) && !columns.some(col => col.name === 'role')) {
    db.run("ALTER TABLE users ADD COLUMN role TEXT", [], (alterErr) => {
      if (!alterErr) {
        db.run("UPDATE users SET role = 'user' WHERE role IS NULL");
      }
    });
  } else if (!err && Array.isArray(columns) && columns.some(col => col.name === 'role')) {
    db.run("UPDATE users SET role = 'user' WHERE role IS NULL");
  }
});


const adminUsers = [
  {
    email: 'sunilg123@gmail.com',
    passwordHash: '$2b$12$nXqbcFCo1wCo06YOWgmAFOFBMvA09e21r1AHSsd2kFTOXysCtSdOC',
    firstName: 'Sunil',
    lastName: 'G',
    role: 'admin',
  },
  {
    email: 'vamsig1234@gmail.com',
    passwordHash: '$2a$12$7qPVh9axbekQiPc0wni3Uehqjnl.tXoNxWGmcOMDypT9/l/bVH5hi', 
    firstName: 'Vamsi',
    lastName: 'G',
    role: 'admin',
  },
];

adminUsers.forEach((admin) => {
  db.get('SELECT * FROM users WHERE email = ?', [admin.email], (err, row) => {
    if (!row) {
      db.run(
        'INSERT INTO users (email, password, firstName, lastName, role) VALUES (?, ?, ?, ?, ?)',
        [admin.email, admin.passwordHash, admin.firstName, admin.lastName, admin.role],
        function (err) {
          if (err) {
            console.error('Failed to insert admin user:', err.message);
          } else {
            console.log('Admin user created: ' + admin.email);
          }
        }
      );
    } else {
      console.log('Admin user already exists: ' + admin.email);
    }
  });
});

db.run(`CREATE TABLE IF NOT EXISTS user_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  customerName TEXT,
  product TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  totalValue REAL DEFAULT 0,
  status TEXT DEFAULT 'processing',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
)`, function(err) {
  if (!err) {
    db.all("PRAGMA table_info(user_orders)", (err, columns) => {
      const hasTotalValue = columns && columns.some(col => col.name === 'totalValue');
      if (!hasTotalValue) {
        console.log('Adding totalValue column to existing user_orders table...');
        db.run("ALTER TABLE user_orders ADD COLUMN totalValue REAL DEFAULT 0", (err) => {
          if (!err) {
            console.log('✅ Successfully added totalValue column to user_orders table');
          } else {
            console.log('Error adding totalValue column:', err);
          }
        });
      }
    });
    
    db.get('SELECT COUNT(*) as count FROM user_orders', (err, result) => {
      if (!err && result.count === 0) {
        console.log('Creating sample orders for testing...');
        
        const sampleOrders = [
          { userId: 9, customerName: 'Sunil G', product: 'Fresh Milk', quantity: 2, totalValue: 120.00, status: 'delivered' },
          { userId: 9, customerName: 'Sunil G', product: 'Organic Butter', quantity: 1, totalValue: 85.50, status: 'shipped' },
          { userId: 10, customerName: 'Vamsi G', product: 'Cheese Blocks', quantity: 3, totalValue: 450.00, status: 'processing' },
          { userId: 10, customerName: 'Vamsi G', product: 'Yogurt Cups', quantity: 5, totalValue: 275.25, status: 'pending' },
          { userId: 9, customerName: 'Sunil G', product: 'Cream', quantity: 1, totalValue: 65.75, status: 'cancelled' }
        ];
        
        sampleOrders.forEach(order => {
          db.run(
            'INSERT INTO user_orders (userId, customerName, product, quantity, totalValue, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [order.userId, order.customerName, order.product, order.quantity, order.totalValue, order.status, new Date().toISOString()],
            function(err) {
              if (err) {
                console.log('Error creating sample order:', err);
              } else {
                console.log(`Created sample order: ${order.product} for ${order.customerName}`);
              }
            }
          );
        });
      }
    });
  }
});

db.run(`CREATE TABLE IF NOT EXISTS cattle (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  tagNumber TEXT UNIQUE NOT NULL,
  name TEXT,
  breed TEXT NOT NULL,
  gender TEXT NOT NULL,
  age INTEGER,
  weight REAL,
  healthStatus TEXT DEFAULT 'healthy',
  milkProduction REAL DEFAULT 0,
  dateAcquired DATE,
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
)`);

db.run(`CREATE TABLE IF NOT EXISTS finance_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  orderId INTEGER,
  customerName TEXT NOT NULL,
  productName TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  productRate REAL NOT NULL,
  totalValue REAL NOT NULL,
  orderStatus TEXT DEFAULT 'processing',
  transactionType TEXT DEFAULT 'sale',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (orderId) REFERENCES user_orders(id)
)`);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, firstName: user.firstName, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const generateResetToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};


app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    if (sqlPool) {
      try {
        const result = await sqlPool.request()
          .input('email', sql.NVarChar, email.toLowerCase())
          .input('password', sql.NVarChar, hashedPassword)
          .input('firstName', sql.NVarChar, firstName)
          .input('lastName', sql.NVarChar, lastName)
          .query(`
            INSERT INTO users (email, password, firstName, lastName)
            OUTPUT INSERTED.id, INSERTED.email, INSERTED.firstName, INSERTED.lastName
            VALUES (@email, @password, @firstName, @lastName)
          `);
        
        const user = result.recordset[0];
        const roleResult = await sqlPool.request()
          .input('email', sql.NVarChar, user.email)
          .query('SELECT role FROM users WHERE email = @email');
        user.role = (roleResult.recordset[0] && roleResult.recordset[0].role) || 'user';
        const token = generateToken(user);
        
        res.status(201).json({
          message: 'User registered successfully',
          token,
          user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role }
        });
      } catch (sqlError) {
        if (sqlError.code === 'EREQUEST' && sqlError.number === 2627) {
          return res.status(409).json({ error: 'Email already exists' });
        }
        throw sqlError;
      }
    } else {
      db.run(
        'INSERT INTO users (email, password, firstName, lastName) VALUES (?, ?, ?, ?)',
        [email.toLowerCase(), hashedPassword, firstName, lastName],
        function (err) {
          if (err) {
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
              return res.status(409).json({ error: 'Email already exists' });
            }
            return res.status(500).json({ error: err.message });
          } else {
            db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err2, user) => {
              if (err2 || !user) {
                return res.status(500).json({ error: 'User created but not found' });
              }
              const token = generateToken(user);
              res.status(201).json({
                message: 'User registered successfully',
                token,
                user
              });
            });
          }
        }
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login attempt:', { email, passwordLength: password?.length });
    
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    if (sqlPool) {
      console.log('🔄 Using SQL Server for login');
      const result = await sqlPool.request()
        .input('email', sql.NVarChar, email.toLowerCase())
        .query('SELECT id, email, password, firstName, lastName FROM users WHERE email = @email');
      
      if (result.recordset.length === 0) {
        console.log('❌ User not found in SQL Server');
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const user = result.recordset[0];
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log('🔑 Password validation result:', isValidPassword);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const roleResult = await sqlPool.request()
        .input('email', sql.NVarChar, user.email)
        .query('SELECT role FROM users WHERE email = @email');
      user.role = (roleResult.recordset[0] && roleResult.recordset[0].role) || 'user';
      const token = generateToken(user);
      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role }
      });
    } else {
      console.log('🔄 Using SQLite for login');
      db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], async (err, user) => {
        if (err) {
          console.log('❌ Database error:', err);
          return res.status(500).json({ error: err.message });
        }
        if (!user) {
          console.log('❌ User not found in SQLite:', email);
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        console.log('✅ User found in SQLite:', { id: user.id, email: user.email, role: user.role });
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('🔑 Password validation result:', isValidPassword);
        if (!isValidPassword) {
          console.log('❌ Password validation failed');
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        console.log('✅ Login successful, generating token');
        const token = generateToken(user);
        res.json({
          message: 'Login successful',
          token,
          user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role }
        });
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    if (sqlPool) {
      const userResult = await sqlPool.request()
        .input('email', sql.NVarChar, email.toLowerCase())
        .query('SELECT id FROM users WHERE email = @email');
      
      if (userResult.recordset.length === 0) {
        return res.json({ message: 'If the email exists, a reset link will be sent.' });
      }
      
      const resetToken = generateResetToken();
      const resetTokenExpiry = new Date(Date.now() + 3600000); 
      
      await sqlPool.request()
        .input('email', sql.NVarChar, email.toLowerCase())
        .input('resetToken', sql.NVarChar, resetToken)
        .input('resetTokenExpiry', sql.DateTime, resetTokenExpiry)
        .query('UPDATE users SET resetToken = @resetToken, resetTokenExpiry = @resetTokenExpiry WHERE email = @email');
      
      console.log(`Password reset token for ${email}: ${resetToken}`);
      
      res.json({ 
        message: 'If the email exists, a reset link will be sent.',
        resetToken 
      });
    } else {
      db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()], (err, user) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (!user) {
          return res.json({ message: 'If the email exists, a reset link will be sent.' });
        }
        
        const resetToken = generateResetToken();
        const resetTokenExpiry = new Date(Date.now() + 3600000); 
        
        db.run(
          'UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?',
          [resetToken, resetTokenExpiry.toISOString(), email.toLowerCase()],
          function (err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            console.log(`Password reset token for ${email}: ${resetToken}`);
            
            res.json({ 
              message: 'If the email exists, a reset link will be sent.',
              resetToken 
            });
          }
        );
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error processing request' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    if (sqlPool) {
      const userResult = await sqlPool.request()
        .input('resetToken', sql.NVarChar, token)
        .query('SELECT id, email FROM users WHERE resetToken = @resetToken AND resetTokenExpiry > GETDATE()');
      
      if (userResult.recordset.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }
      
      const user = userResult.recordset[0];
      
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      await sqlPool.request()
        .input('id', sql.Int, user.id)
        .input('password', sql.NVarChar, hashedPassword)
        .query('UPDATE users SET password = @password, resetToken = NULL, resetTokenExpiry = NULL WHERE id = @id');
      
      res.json({ message: 'Password reset successfully' });
    } else {
      db.get('SELECT id, email FROM users WHERE resetToken = ? AND resetTokenExpiry > ?', [token, new Date().toISOString()], async (err, user) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (!user) {
          return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        
        try {
          const hashedPassword = await bcrypt.hash(newPassword, 12);
          
          db.run(
            'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?',
            [hashedPassword, user.id],
            function (err) {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              
              res.json({ message: 'Password reset successfully' });
            }
          );
        } catch (hashError) {
          console.error('Password hashing error:', hashError);
          res.status(500).json({ error: 'Server error resetting password' });
        }
      });
    }
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error resetting password' });
  }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    if (sqlPool) {
      const result = await sqlPool.request()
        .input('id', sql.Int, req.user.id)
        .query('SELECT id, email, firstName, lastName, role, createdAt FROM users WHERE id = @id');
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ user: result.recordset[0] });
    } else {
      console.log('🔄 Using SQLite for profile');
      db.get('SELECT id, email, firstName, lastName, role, createdAt FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err) {
          console.error('SQLite profile error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('📤 Sending user data to frontend:', JSON.stringify(user, null, 2));
        res.json({ user });
      });
    }
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});


app.get('/', (req, res) => {
  res.redirect('http://localhost:3000');
});

app.all('/database', (req, res, next) => {
  let token = null;
  if (req.headers['authorization']) {
    token = req.headers['authorization'].split(' ')[1];
  } else if (req.method === 'POST' && req.body && req.body.token) {
    token = req.body.token;
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }
  if (!token) {
    return res.status(401).send('<h1>Access Denied</h1><p>Access token required.</p>');
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err || !user) {
      return res.status(403).send('<h1>Access Denied</h1><p>Invalid or expired token.</p>');
    }
    if (user.role !== 'admin') {
      return res.status(403).send('<h1>Access Denied</h1><p>Only admin users can view the database.</p>');
    }
    req.user = user;
    db.all('SELECT * FROM user_orders ORDER BY createdAt DESC', [], (err, userOrders) => {
      if (err) {
        res.status(500).send(`<h1>Error</h1><p>${err.message}</p>`);
      } else {
        db.all('SELECT * FROM users ORDER BY createdAt DESC', [], (userErr, users) => {
          if (userErr) {
            res.status(500).send(`<h1>Error</h1><p>${userErr.message}</p>`);
          } else {
            const htmlTable = generateDatabaseView(userOrders, users);
            res.send(htmlTable);
          }
        });
      }
    });
  });
});

app.get('/orders', authenticateToken, async (req, res) => {
  try {
    const format = req.query.format;
    const acceptHeader = req.headers.accept || '';
    
    if (sqlPool) {
      let query, inputs;
      
      if (req.user.role === 'admin') {
        query = 'SELECT id, customerName, product, quantity, status, createdAt, userId FROM user_orders ORDER BY createdAt DESC';
        inputs = [];
      } else {
        query = 'SELECT id, customerName, product, quantity, status, createdAt FROM user_orders WHERE userId = @userId ORDER BY createdAt DESC';
        inputs = [{ name: 'userId', type: sql.Int, value: req.user.id }];
      }
      
      const request = sqlPool.request();
      inputs.forEach(input => request.input(input.name, input.type, input.value));
      const result = await request.query(query);
      
      const orders = result.recordset;
      
      if (format === 'json' || (!acceptHeader.includes('text/html') && format !== 'html')) {
        res.json(orders);
      } else {
        const htmlTable = generateOrdersTable(orders);
        res.send(htmlTable);
      }
    } else {
      let query, params;
      
      if (req.user.role === 'admin') {
        query = 'SELECT id, customerName, product, quantity, status, createdAt, userId FROM user_orders ORDER BY createdAt DESC';
        params = [];
      } else {
        query = 'SELECT id, customerName, product, quantity, status, createdAt FROM user_orders WHERE userId = ? ORDER BY createdAt DESC';
        params = [req.user.id];
      }
      
      db.all(query, params, (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          if (format === 'json' || (!acceptHeader.includes('text/html') && format !== 'html')) {
            res.json(rows);
          } else {
            const htmlTable = generateOrdersTable(rows);
            res.send(htmlTable);
          }
        }
      });
    }
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Server error fetching orders' });
  }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    console.log('🛒 Orders API request:', {
      userId: req.user.id,
      userRole: req.user.role,
      email: req.user.email
    });

    if (sqlPool) {
      const result = await sqlPool.request()
        .query('SELECT id, customerName, product, quantity, totalValue, status, createdAt, userId FROM user_orders ORDER BY createdAt DESC');
      
      console.log('📊 SQL Server: Found', result.recordset.length, 'total orders');
      res.json(result.recordset);
    } else {
      db.all('SELECT * FROM user_orders ORDER BY createdAt DESC', [], (err, rows) => {
        if (err) {
          console.error('SQLite orders error:', err);
          res.status(500).json({ error: err.message });
        } else {
          console.log('📊 SQLite: Found', rows.length, 'total orders for all users');
          console.log('📄 Orders data:', rows.map(r => ({ 
            id: r.id, 
            customer: r.customerName, 
            product: r.product, 
            userId: r.userId, 
            status: r.status 
          })));
          res.json(rows);
        }
      });
    }
  } catch (error) {
    console.error('API Orders fetch error:', error);
    res.status(500).json({ error: 'Server error fetching orders' });
  }
});

function generateOrdersTable(orders) {
  const tableRows = orders.map(order => `
    <tr>
      <td>${order.id}</td>
      <td>${order.customerName || 'N/A'}</td>
      <td>${order.product}</td>
      <td>${order.quantity}</td>
      <td><span class="status-${order.status.replace(' ', '-')}">${order.status}</span></td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Orders Table - ASTROLITE Dashboard</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f8fafc;
          color: #1f2937;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        h1 {
          color: #1f2937;
          text-align: center;
          margin-bottom: 30px;
          font-size: 2rem;
          font-weight: 600;
        }
        .subtitle {
          text-align: center;
          color: #6b7280;
          margin-bottom: 30px;
          font-style: italic;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          margin: 20px 0;
        }
        th {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          padding: 16px;
          text-align: left;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 0.875rem;
        }
        td {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          transition: background-color 0.2s;
        }
        tr:hover {
          background-color: #f9fafb;
        }
        tr:last-child td {
          border-bottom: none;
        }
        .status-processing {
          background: #fef3c7;
          color: #92400e;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .status-shipped {
          background: #dbeafe;
          color: #1e40af;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .status-in-transit {
          background: #e0e7ff;
          color: #5b21b6;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .status-delivered {
          background: #d1fae5;
          color: #065f46;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .status-cancelled {
          background: #fee2e2;
          color: #991b1b;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          color: #3b82f6;
        }
        .stat-label {
          color: #6b7280;
          font-size: 0.875rem;
          margin-top: 5px;
        }
        .actions {
          margin: 20px 0;
          text-align: center;
        }
        .btn {
          background: #3b82f6;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          margin: 0 10px;
          text-decoration: none;
          display: inline-block;
        }
        .btn:hover {
          background: #2563eb;
        }
        @media (max-width: 768px) {
          table, thead, tbody, th, td, tr {
            display: block;
          }
          thead tr {
            position: absolute;
            top: -9999px;
            left: -9999px;
          }
          tr {
            border: 1px solid #ccc;
            margin-bottom: 10px;
            background: white;
            border-radius: 8px;
            padding: 10px;
          }
          td {
            border: none;
            position: relative;
            padding-left: 50%;
            padding-top: 10px;
            padding-bottom: 10px;
          }
          td:before {
            content: attr(data-label) ": ";
            position: absolute;
            left: 6px;
            width: 45%;
            padding-right: 10px;
            white-space: nowrap;
            font-weight: bold;
            color: #666;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🐄 ASTROLITE Orders Dashboard</h1>
        <p class="subtitle">Real-time orders data from dairy farm management system</p>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-number">${orders.length}</div>
            <div class="stat-label">Total Orders</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${orders.filter(o => o.status === 'processing').length}</div>
            <div class="stat-label">Processing</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${orders.filter(o => o.status === 'delivered').length}</div>
            <div class="stat-label">Delivered</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${orders.reduce((sum, o) => sum + o.quantity, 0)}</div>
            <div class="stat-label">Total Items</div>
          </div>
        </div>

        <div class="actions">
          <a href="/orders" class="btn">🔄 Refresh Data</a>
          <a href="/orders?format=json" class="btn">📊 JSON API</a>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer Name</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.875rem;">
          <p>🚀 Powered by ASTROLITE Dashboard | Last updated: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper function to generate database view HTML
function generateDatabaseView(userOrders, users) {
  const userOrderRows = userOrders.map(order => {
    const user = users.find(u => u.id === order.userId);
    return `
    <tr>
      <td>${order.id}</td>
      <td>${user ? `${user.firstName} ${user.lastName} (${user.email})` : 'Unknown User'}</td>
      <td>${order.customerName || 'N/A'}</td>
      <td>${order.product}</td>
      <td>${order.quantity}</td>
      <td><span class="status-${order.status.replace(' ', '-')}">${order.status}</span></td>
      <td>${new Date(order.createdAt).toLocaleDateString()}</td>
    </tr>
  `}).join('');

  const userRows = users.map(user => `
    <tr>
      <td>${user.id}</td>
      <td>${user.firstName} ${user.lastName}</td>
      <td>${user.email}</td>
      <td>${user.role || 'user'}</td>
      <td>${new Date(user.createdAt).toLocaleDateString()}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Database View - ASTROLITE Dashboard</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f8fafc;
          color: #1f2937;
        }
        .container {
          max-width: 1400px;
          margin: 0 auto;
        }
        h1 {
          color: #1f2937;
          text-align: center;
          margin-bottom: 30px;
          font-size: 2rem;
          font-weight: 600;
        }
        .section {
          margin-bottom: 3rem;
        }
        .section h2 {
          color: #374151;
          margin-bottom: 1rem;
          font-size: 1.5rem;
          font-weight: 600;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 0.5rem;
        }
        .subtitle {
          text-align: center;
          color: #6b7280;
          margin-bottom: 30px;
          font-style: italic;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          margin: 20px 0;
        }
        th {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          padding: 16px;
          text-align: left;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 0.875rem;
        }
        td {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          transition: background-color 0.2s;
        }
        tr:hover {
          background-color: #f9fafb;
        }
        tr:last-child td {
          border-bottom: none;
        }
        .status-processing {
          background: #fef3c7;
          color: #92400e;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .status-shipped {
          background: #dbeafe;
          color: #1e40af;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .status-in-transit {
          background: #e0e7ff;
          color: #5b21b6;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .status-delivered {
          background: #d1fae5;
          color: #065f46;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .status-cancelled {
          background: #fee2e2;
          color: #991b1b;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          color: #3b82f6;
        }
        .stat-label {
          color: #6b7280;
          font-size: 0.875rem;
          margin-top: 5px;
        }
        .actions {
          margin: 20px 0;
          text-align: center;
        }
        .btn {
          background: #3b82f6;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          margin: 0 10px;
          text-decoration: none;
          display: inline-block;
        }
        .btn:hover {
          background: #2563eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🐄 ASTROLITE Database View</h1>
        <p class="subtitle">Real-time database contents from dairy farm management system</p>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-number">${users.length}</div>
            <div class="stat-label">Total Users</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${userOrders.length}</div>
            <div class="stat-label">Total Orders</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${userOrders.filter(o => o.status === 'processing').length}</div>
            <div class="stat-label">Processing Orders</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${userOrders.reduce((sum, o) => sum + o.quantity, 0)}</div>
            <div class="stat-label">Total Items</div>
          </div>
        </div>

        <div class="actions">
          <a href="/database" class="btn">🔄 Refresh Data</a>
          <a href="/" class="btn">🏠 Dashboard Home</a>
          <a href="http://localhost:3000/login" class="btn">🔐 Login</a>
        </div>

        <div class="section">
          <h2>📋 User Orders</h2>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>User</th>
                <th>Customer Name</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${userOrderRows || '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #6b7280;">No orders found</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>👥 Registered Users</h2>
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Registration Date</th>
              </tr>
            </thead>
            <tbody>
              ${userRows || '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #6b7280;">No users found</td></tr>'}
            </tbody>
          </table>
        </div>

        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 0.875rem;">
          <p>🚀 Powered by ASTROLITE Dashboard | Last updated: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getProductPrice(productName) {
  const productPrices = {
    'Fresh Milk': 25000,
    'Organic Butter': 15000,
    'Farm Cheese': 30000,
    'Yogurt': 12000,
    'Heavy Cream': 18000,
    'Cottage Cheese': 20000,
    'Premium Dairy Feed': 2500,
    'Milking Machine Pro': 45000,
    'Organic Cow Feed': 1800,
    'Veterinary Kit': 8500,
    'Milk Storage Tank': 75000,
    'Dairy Products Mix': 3200
  };
  return productPrices[productName] || 10000;
}

function createFinanceRecord(userId, orderId, customerName, productName, quantity, status) {
  const productRate = getProductPrice(productName);
  const totalValue = quantity * productRate;
  
  const insertFinanceQuery = `
    INSERT INTO finance_records (userId, orderId, customerName, productName, quantity, productRate, totalValue, orderStatus, transactionType)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(insertFinanceQuery, [
    userId, 
    orderId, 
    customerName, 
    productName, 
    quantity, 
    productRate, 
    totalValue, 
    status,
    'sale'
  ], function(financeErr) {
    if (financeErr) {
      console.error('Error creating finance record:', financeErr);
    } else {
      console.log('Finance record created for order ID:', orderId);
    }
  });
}

app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { customerName, product, quantity, status } = req.body;
    
    if (!product || !quantity) {
      return res.status(400).json({ 
        error: 'Missing required fields: product and quantity are required' 
      });
    }
    
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ 
        error: 'Quantity must be a positive number' 
      });
    }
    
    const sanitizedData = {
      customerName: customerName ? customerName.toString().trim() : null,
      product: product.toString().trim(),
      quantity: qty,
      status: status ? status.toString().trim() : 'processing'
    };
    
    if (sqlPool) {
      const result = await sqlPool.request()
        .input('userId', sql.Int, req.user.id)
        .input('customerName', sql.NVarChar, sanitizedData.customerName)
        .input('product', sql.NVarChar, sanitizedData.product)
        .input('quantity', sql.Int, sanitizedData.quantity)
        .input('status', sql.NVarChar, sanitizedData.status)
        .query(`
          INSERT INTO user_orders (userId, customerName, product, quantity, status)
          OUTPUT INSERTED.id, INSERTED.customerName, INSERTED.product, INSERTED.quantity, INSERTED.status, INSERTED.createdAt
          VALUES (@userId, @customerName, @product, @quantity, @status)
        `);
      
      const newOrder = result.recordset[0];
      
      createFinanceRecord(
        req.user.id, 
        newOrder.id, 
        sanitizedData.customerName, 
        sanitizedData.product, 
        sanitizedData.quantity, 
        sanitizedData.status
      );
      
      res.status(201).json(newOrder);
    } else {
      db.run(
        'INSERT INTO user_orders (userId, customerName, product, quantity, status) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, sanitizedData.customerName, sanitizedData.product, sanitizedData.quantity, sanitizedData.status],
        function (err) {
          if (err) {
            res.status(500).json({ error: err.message });
          } else {
            const orderId = this.lastID;
            
            createFinanceRecord(
              req.user.id, 
              orderId, 
              sanitizedData.customerName, 
              sanitizedData.product, 
              sanitizedData.quantity, 
              sanitizedData.status
            );
            
            res.status(201).json({ 
              id: orderId, 
              userId: req.user.id,
              customerName: sanitizedData.customerName, 
              product: sanitizedData.product, 
              quantity: sanitizedData.quantity, 
              status: sanitizedData.status,
              createdAt: new Date().toISOString()
            });
          }
        }
      );
    }
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Server error creating order' });
  }
});

app.delete('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    
    const orderId = parseInt(id);
    if (isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    
    if (sqlPool) {
      const result = await sqlPool.request()
        .input('id', sql.Int, orderId)
        .input('userId', sql.Int, req.user.id)
        .query('DELETE FROM user_orders WHERE id = @id AND userId = @userId');
      
      if (result.rowsAffected[0] === 0) {
        res.status(404).json({ error: 'Order not found or not authorized' });
      } else {
        res.json({ message: 'Order deleted successfully' });
      }
    } else {
      db.run('DELETE FROM user_orders WHERE id = ? AND userId = ?', [orderId, req.user.id], function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
          res.status(404).json({ error: 'Order not found or not authorized' });
        } else {
          res.json({ message: 'Order deleted successfully' });
        }
      });
    }
  } catch (error) {
    console.error('Order deletion error:', error);
    res.status(500).json({ error: 'Server error deleting order' });
  }
});

app.put('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`PUT /orders/${id} - Updating order status to: ${status}`);
    
    const orderId = parseInt(id);
    if (isNaN(orderId) || orderId <= 0) {
      console.log(`Invalid order ID: ${id}`);
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      console.log(`Invalid status: ${status}`);
      return res.status(400).json({ error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
    }
    
    if (sqlPool) {
      const result = await sqlPool.request()
        .input('id', sql.Int, orderId)
        .input('status', sql.NVarChar, status)
        .query('UPDATE user_orders SET status = @status WHERE id = @id');
      
      if (result.rowsAffected[0] === 0) {
        res.status(404).json({ error: 'Order not found' });
      } else {
        const updatedOrder = await sqlPool.request()
          .input('id', sql.Int, orderId)
          .query('SELECT * FROM user_orders WHERE id = @id');
        
        res.json({ 
          message: 'Order status updated successfully', 
          order: updatedOrder.recordset[0] 
        });
      }
    } else {
      // Fallback to SQLite - Update order status in user_orders table
      console.log(`Using SQLite - Updating order ${orderId} to status ${status}`);
      
      db.run('UPDATE user_orders SET status = ? WHERE id = ?', [status, orderId], function (err) {
        if (err) {
          console.log(`SQLite user_orders update error:`, err);
          return res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
          console.log(`Order ${orderId} not found - no rows updated`);
          return res.status(404).json({ error: 'Order not found' });
        } else {
          console.log(`Successfully updated ${this.changes} row(s) in user_orders for order ${orderId}`);
          
          // Fetch updated order from the user_orders table
          db.get('SELECT * FROM user_orders WHERE id = ?', [orderId], (err, row) => {
            if (err) {
              console.log(`Error fetching updated order:`, err);
              res.status(500).json({ error: err.message });
            } else {
              console.log(`Updated order fetched:`, row);
              res.json({ 
                message: 'Order status updated successfully', 
                order: row 
              });
            }
          });
        }
      });
    }
  } catch (error) {
    console.error('Order update error:', error);
    res.status(500).json({ error: 'Server error updating order' });
  }
});

app.post('/api/admin/assign-admin', authenticateToken, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  db.run('UPDATE users SET role = ? WHERE id = ?', ['admin', userId], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User promoted to admin successfully' });
  });
});
app.get('/api/admin/users', authenticateToken, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  db.all('SELECT id, firstName, lastName, email, role FROM users ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ users: rows });
  });
});

app.delete('/api/admin/users/:id', authenticateToken, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Only admins can delete users.' });
  }
  
  const userId = parseInt(req.params.id);
  if (isNaN(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }
  
  db.get('SELECT id, firstName, lastName, email, role FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    db.run('DELETE FROM user_orders WHERE userId = ?', [userId], function(orderDeleteErr) {
      if (orderDeleteErr) {
        console.error('Error deleting user orders:', orderDeleteErr);
      }
      
      db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'User not found or already deleted' });
        }
        
        res.json({ 
          message: 'User deleted successfully',
          deletedUser: {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email
          }
        });
      });
    });
  });
});


app.get('/api/finance', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  db.all('SELECT * FROM finance_records WHERE userId = ? ORDER BY createdAt DESC', [userId], (err, records) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(records);
  });
});

app.post('/api/finance', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { orderId, customerName, productName, quantity, productRate, totalValue, orderStatus, transactionType } = req.body;
  
  if (!customerName || !productName || !quantity || !productRate || !totalValue) {
    return res.status(400).json({ error: 'Missing required fields: customerName, productName, quantity, productRate, totalValue' });
  }
  
  if (quantity <= 0 || productRate <= 0 || totalValue <= 0) {
    return res.status(400).json({ error: 'Quantity, productRate, and totalValue must be positive numbers' });
  }
  
  const insertQuery = `
    INSERT INTO finance_records (userId, orderId, customerName, productName, quantity, productRate, totalValue, orderStatus, transactionType)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(insertQuery, [
    userId, 
    orderId || null, 
    customerName, 
    productName, 
    quantity, 
    productRate, 
    totalValue, 
    orderStatus || 'processing',
    transactionType || 'sale'
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    db.get('SELECT * FROM finance_records WHERE id = ?', [this.lastID], (err, record) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json(record);
    });
  });
});

app.put('/api/finance/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const recordId = req.params.id;
  const { customerName, productName, quantity, productRate, totalValue, orderStatus, transactionType } = req.body;
  
  db.get('SELECT * FROM finance_records WHERE id = ? AND userId = ?', [recordId, userId], (err, record) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!record) {
      return res.status(404).json({ error: 'Finance record not found' });
    }
    
    const updateQuery = `
      UPDATE finance_records 
      SET customerName = COALESCE(?, customerName),
          productName = COALESCE(?, productName),
          quantity = COALESCE(?, quantity),
          productRate = COALESCE(?, productRate),
          totalValue = COALESCE(?, totalValue),
          orderStatus = COALESCE(?, orderStatus),
          transactionType = COALESCE(?, transactionType),
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ? AND userId = ?
    `;
    
    db.run(updateQuery, [
      customerName, 
      productName, 
      quantity, 
      productRate, 
      totalValue, 
      orderStatus,
      transactionType,
      recordId, 
      userId
    ], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Return updated record
      db.get('SELECT * FROM finance_records WHERE id = ?', [recordId], (err, updatedRecord) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(updatedRecord);
      });
    });
  });
});

app.delete('/api/finance/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const recordId = req.params.id;
  
  db.get('SELECT * FROM finance_records WHERE id = ? AND userId = ?', [recordId, userId], (err, record) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!record) {
      return res.status(404).json({ error: 'Finance record not found' });
    }
    
    db.run('DELETE FROM finance_records WHERE id = ? AND userId = ?', [recordId, userId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ 
        message: 'Finance record deleted successfully',
        deletedRecord: record
      });
    });
  });
});

app.get('/api/finance/summary', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  const summaryQuery = `
    SELECT 
      COUNT(*) as totalRecords,
      SUM(totalValue) as totalRevenue,
      AVG(totalValue) as averageOrderValue,
      SUM(CASE WHEN orderStatus = 'delivered' THEN totalValue ELSE 0 END) as confirmedRevenue,
      COUNT(CASE WHEN orderStatus = 'processing' THEN 1 END) as processingOrders,
      COUNT(CASE WHEN orderStatus = 'delivered' THEN 1 END) as deliveredOrders
    FROM finance_records 
    WHERE userId = ?
  `;
  
  db.get(summaryQuery, [userId], (err, summary) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(summary);
  });
});

const initializeCattleData = () => {
  const sampleCattle = [
    { name: 'Bella', breed: 'Holstein', milkProduction: 25.5, userId: 9, age: 4, weight: 650, healthStatus: 'Healthy' },
    { name: 'Daisy', breed: 'Jersey', milkProduction: 18.2, userId: 9, age: 3, weight: 450, healthStatus: 'Healthy' },
    { name: 'Luna', breed: 'Holstein', milkProduction: 22.8, userId: 9, age: 5, weight: 680, healthStatus: 'Healthy' },
    { name: 'Moo-nificent', breed: 'Guernsey', milkProduction: 20.1, userId: 9, age: 4, weight: 580, healthStatus: 'Healthy' },
    { name: 'Bessie', breed: 'Holstein', milkProduction: 26.3, userId: 9, age: 6, weight: 720, healthStatus: 'Healthy' },
    { name: 'Rosie', breed: 'Jersey', milkProduction: 19.4, userId: 9, age: 2, weight: 420, healthStatus: 'Healthy' },
    { name: 'Clover', breed: 'Brown Swiss', milkProduction: 21.7, userId: 9, age: 4, weight: 600, healthStatus: 'Healthy' },
    { name: 'Buttercup', breed: 'Holstein', milkProduction: 24.9, userId: 9, age: 5, weight: 670, healthStatus: 'Healthy' }
  ];

  db.get('SELECT COUNT(*) as count FROM cattle', (err, result) => {
    if (!err && result.count === 0) {
      console.log('🐄 No cattle found, initializing sample data...');
      sampleCattle.forEach(cattle => {
        db.run(`INSERT INTO cattle (name, breed, milkProduction, userId, age, weight, healthStatus, createdAt, updatedAt) 
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [cattle.name, cattle.breed, cattle.milkProduction, cattle.userId, cattle.age, cattle.weight, cattle.healthStatus],
          (insertErr) => {
            if (insertErr) {
              console.log('Error inserting cattle:', insertErr.message);
            } else {
              console.log(`✅ Added cattle: ${cattle.name} (${cattle.breed}) - ${cattle.milkProduction}L/day`);
            }
          }
        );
      });
    } else if (!err) {
      console.log(`🐄 Found ${result.count} cattle records in database`);
    }
  });
};

setTimeout(() => {
  initializeCattleData();
}, 2000); 

app.get('/api/cattle', authenticateToken, async (req, res) => {
  try {
    const showAll = req.query.showAll === 'true';
    
    console.log('🐄 Cattle API request:', {
      userId: req.user.id,
      userRole: req.user.role,
      showAllParam: req.query.showAll,
      showAllParsed: showAll,
      queryParams: req.query
    });
    
    const query = 'SELECT * FROM cattle ORDER BY createdAt DESC';
    const params = [];
    
    db.all(query, params, (err, rows) => {
      if (err) {
        console.log('🚨 Cattle database error:', err.message);
        res.status(500).json({ error: err.message });
      } else {
        console.log('📊 Cattle API response:', {
          totalCattleFound: rows.length,
          sampleData: rows.slice(0, 2).map(c => ({
            id: c.id,
            name: c.name,
            breed: c.breed,
            milkProduction: c.milkProduction,
            userId: c.userId
          }))
        });
        res.json(rows);
      }
    });
  } catch (error) {
    console.error('Cattle fetch error:', error);
    res.status(500).json({ error: 'Server error fetching cattle' });
  }
});

app.post('/api/cattle', authenticateToken, async (req, res) => {
  try {
    const { name, breed, gender, age, weight, healthStatus, milkProduction, dateAcquired, notes } = req.body;
    
    if (!breed || !gender) {
      return res.status(400).json({ 
        error: 'Missing required fields: breed and gender are required' 
      });
    }
    
    const generateTagNumber = () => {
      const year = new Date().getFullYear().toString().slice(-2);
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      return `CTL${year}${month}${random}`;
    };
    
    const attemptInsert = (attempts = 0) => {
      if (attempts > 10) {
        return res.status(500).json({ error: 'Unable to generate unique tag number after multiple attempts' });
      }
      
      const tagNumber = generateTagNumber();
      
      db.run(
        `INSERT INTO cattle (userId, tagNumber, name, breed, gender, age, weight, healthStatus, milkProduction, dateAcquired, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, tagNumber, name, breed, gender, age, weight, healthStatus || 'healthy', milkProduction || 0, dateAcquired, notes],
        function (err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              return attemptInsert(attempts + 1);
            } else {
              res.status(500).json({ error: err.message });
            }
          } else {
            const cattleId = this.lastID;
            
            db.get('SELECT * FROM cattle WHERE id = ?', [cattleId], (err, row) => {
              if (err) {
                res.status(500).json({ error: err.message });
              } else {
                res.status(201).json(row);
              }
            });
          }
        }
      );
    };
    
    attemptInsert();
  } catch (error) {
    console.error('Cattle creation error:', error);
    res.status(500).json({ error: 'Server error creating cattle record' });
  }
});

app.put('/api/cattle/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { tagNumber, name, breed, gender, age, weight, healthStatus, milkProduction, dateAcquired, notes } = req.body;
    
    const cattleId = parseInt(id);
    if (isNaN(cattleId) || cattleId <= 0) {
      return res.status(400).json({ error: 'Invalid cattle ID' });
    }
    
    const query = req.user.role === 'admin' 
      ? 'SELECT * FROM cattle WHERE id = ?'
      : 'SELECT * FROM cattle WHERE id = ? AND userId = ?';
    const params = req.user.role === 'admin' ? [cattleId] : [cattleId, req.user.id];
    
    db.get(query, params, (err, cattle) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else if (!cattle) {
        res.status(404).json({ error: 'Cattle not found or not authorized' });
      } else {
        db.run(
          `UPDATE cattle SET tagNumber = ?, name = ?, breed = ?, gender = ?, age = ?, weight = ?, 
           healthStatus = ?, milkProduction = ?, dateAcquired = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [tagNumber, name, breed, gender, age, weight, healthStatus, milkProduction, dateAcquired, notes, cattleId],
          function (err) {
            if (err) {
              if (err.message.includes('UNIQUE constraint failed')) {
                res.status(400).json({ error: 'Tag number already exists' });
              } else {
                res.status(500).json({ error: err.message });
              }
            } else {
              db.get('SELECT * FROM cattle WHERE id = ?', [cattleId], (err, row) => {
                if (err) {
                  res.status(500).json({ error: err.message });
                } else {
                  res.json({ message: 'Cattle updated successfully', cattle: row });
                }
              });
            }
          }
        );
      }
    });
  } catch (error) {
    console.error('Cattle update error:', error);
    res.status(500).json({ error: 'Server error updating cattle' });
  }
});

app.delete('/api/cattle/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const cattleId = parseInt(id);
    
    if (isNaN(cattleId) || cattleId <= 0) {
      return res.status(400).json({ error: 'Invalid cattle ID' });
    }
    
    const query = req.user.role === 'admin' 
      ? 'DELETE FROM cattle WHERE id = ?'
      : 'DELETE FROM cattle WHERE id = ? AND userId = ?';
    const params = req.user.role === 'admin' ? [cattleId] : [cattleId, req.user.id];
    
    db.run(query, params, function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else if (this.changes === 0) {
        res.status(404).json({ error: 'Cattle not found or not authorized' });
      } else {
        res.json({ message: 'Cattle deleted successfully' });
      }
    });
  } catch (error) {
    console.error('Cattle deletion error:', error);
    res.status(500).json({ error: 'Server error deleting cattle' });
  }
});

app.get('/debug/orders', authenticateToken, async (req, res) => {
  try {
    console.log(`🔍 Debug: User ${req.user.email} (role: ${req.user.role}) requesting order debug info`);
    
    db.all('SELECT * FROM user_orders ORDER BY createdAt DESC', [], (err, rows) => {
      if (err) {
        console.error('🚨 Debug orders database error:', err);
        res.status(500).json({ error: err.message });
      } else {
        console.log(`Debug: Found ${rows.length} orders in user_orders table`);
        res.json({
          totalOrders: rows.length,
          orders: rows,
          user: req.user
        });
      }
    });
  } catch (error) {
    console.error('Debug orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
