require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const sequelize    = require('./config/db');
require('./models/User');
require('./models/App');
require('./models/Payment');
require('./models/Message');

const authRoutes     = require('./routes/auth');
const adminRoutes    = require('./routes/admin');
const uploadRoutes   = require('./routes/upload');
const appsRoutes     = require('./routes/apps');
const paymentsRoutes = require('./routes/payments');
const messagesRoutes = require('./routes/messages');

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: false, limit: '20mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/api/auth',     authRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/upload',   uploadRoutes);
app.use('/api/apps',     appsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/messages', messagesRoutes);

app.get('/api', (_req, res) => res.json({ project: 'KYBEROS', version: '2.0.0', status: 'running' }));
app.get('/api/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date() }));

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    console.log('🔄 Starting KYBERS.OS server...');
    
    // Database connection with timeout
    const connectWithTimeout = Promise.race([
      sequelize.authenticate(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 30000)
      )
    ]);
    
    await connectWithTimeout;
    console.log('✅ Database connected (SQLite)');
    
    // Sync tables (faster with alter)
    await sequelize.sync({ alter: true });
    console.log('✅ Tables synced');
    
    // Create admin user if not exists
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    
    const adminEmail = 'perdebaevadilbek586@gmail.com';
    
    try {
      let admin = await User.findOne({ where: { email: adminEmail } });
      
      if (!admin) {
        const hashedPassword = await bcrypt.hash('kyber404', 10);
        admin = await User.create({
          name: 'Admin',
          email: adminEmail,
          password: hashedPassword,
          isAdmin: true
        });
        console.log('✅ Admin user created');
        console.log('   Email: perdebaevadilbek586@gmail.com');
        console.log('   Password: kyber404');
      } else {
        await admin.update({ isAdmin: true });
        console.log('✅ Admin ensured');
      }
    } catch (adminErr) {
      console.warn('⚠️  Admin setup warning:', adminErr.message);
      // Continue server startup even if admin setup fails
    }
    
    // Start server immediately
    app.listen(PORT, () => {
      console.log('');
      console.log('========================================');
      console.log(`🚀 KYBERS.OS Server Running`);
      console.log(`📡 API: http://localhost:${PORT}`);
      console.log(`🔧 Health: http://localhost:${PORT}/api/health`);
      console.log('========================================');
      console.log('');
    });
  } catch (err) {
    console.error('');
    console.error('========================================');
    console.error('❌ Server Start Failed');
    console.error('========================================');
    console.error('Error:', err.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check .env file exists');
    console.error('2. Check database connection');
    console.error('3. Check port 5000 is available');
    console.error('========================================');
    console.error('');
    process.exit(1);
  }
})();
