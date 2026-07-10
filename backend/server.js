const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./models');
const { initAutoCheckoutJob } = require('./cron/autoCheckout');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employee'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/leaves', require('./routes/leave'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/analytics', require('./routes/analytics'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'CISS Management Services HRMS API is running.' });
});

// Seed default users
const seedUsers = async () => {
  console.log('Seeding or updating default roles...');
  
  const adminPassword = await bcrypt.hash('aayir1234', 10);

  // Create or Update Super Admin
  const [adminUser, adminCreated] = await db.User.findOrCreate({
    where: { email: 'admin@ciss.com' },
    defaults: {
      password: adminPassword,
      role: 'Admin',
      fullName: 'CISS Admin User',
      employeeId: 'EMP0001',
      department: 'Management',
      designation: 'CEO / Founder',
      joiningDate: '2020-01-01',
      basicSalary: 12000,
      hra: 3000,
      conveyance: 1000,
      allowances: 1500
    }
  });
  if (!adminCreated) {
    await adminUser.update({ password: adminPassword });
  }

  console.log('Default users seeded and synchronized:');
  console.log(' - Admin: admin@ciss.com (aayir1234)');
};

// Sync database and start server
db.sequelize.sync({ alter: true }).then(async () => {
  console.log('Database synced successfully.');
  await seedUsers();
  initAutoCheckoutJob();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to sync database:', err);
});
