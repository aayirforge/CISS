const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Rewrite PGHOST if set as a Render internal hostname
if (process.env.PGHOST && process.env.PGHOST.startsWith('dpg-') && !process.env.PGHOST.includes('.')) {
  const region = process.env.RENDER_REGION || 'singapore';
  process.env.PGHOST = `${process.env.PGHOST}.${region}-postgres.render.com`;
  console.log(`Rewrote PGHOST to: ${process.env.PGHOST}`);
}

let sequelize;
if (process.env.DATABASE_URL) {
  let url = process.env.DATABASE_URL;
  
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.startsWith('dpg-') && !parsedUrl.hostname.includes('.')) {
      const region = process.env.RENDER_REGION || 'singapore';
      parsedUrl.hostname = `${parsedUrl.hostname}.${region}-postgres.render.com`;
      url = parsedUrl.toString();
      console.log(`Rewrote Render internal DB URL to external: ${url.replace(/:[^:@]+@/, ':****@')}`);
    }
  } catch (err) {
    console.error('Error parsing DATABASE_URL:', err);
  }

  sequelize = new Sequelize(url, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: false
  });
}

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('./user')(sequelize, DataTypes);
db.Attendance = require('./attendance')(sequelize, DataTypes);
db.Document = require('./document')(sequelize, DataTypes);
db.Leave = require('./leave')(sequelize, DataTypes);
db.Payroll = require('./payroll')(sequelize, DataTypes);
db.AuditLog = require('./auditLog')(sequelize, DataTypes);
db.Notification = require('./notification')(sequelize, DataTypes);
db.LocationPing = require('./locationPing')(sequelize, DataTypes);

// Setup Associations
// User <-> Attendance
db.User.hasMany(db.Attendance, { foreignKey: 'userId', as: 'attendances' });
db.Attendance.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

// User <-> Document
db.User.hasMany(db.Document, { foreignKey: 'userId', as: 'documents' });
db.Document.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

// User <-> Leave
db.User.hasMany(db.Leave, { foreignKey: 'userId', as: 'leaves' });
db.Leave.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

// User <-> Payroll
db.User.hasMany(db.Payroll, { foreignKey: 'userId', as: 'payrolls' });
db.Payroll.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

db.Payroll.belongsTo(db.User, { foreignKey: 'preparedById', as: 'preparedBy' });
db.Payroll.belongsTo(db.User, { foreignKey: 'approvedById', as: 'approvedBy' });

// User <-> AuditLog
db.User.hasMany(db.AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
db.AuditLog.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

// User <-> Notification
db.User.hasMany(db.Notification, { foreignKey: 'userId', as: 'notifications' });
db.Notification.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

// User <-> LocationPing
db.User.hasMany(db.LocationPing, { foreignKey: 'userId', as: 'locationPings' });
db.LocationPing.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

// Attendance <-> LocationPing
db.Attendance.hasMany(db.LocationPing, { foreignKey: 'attendanceId', as: 'locationPings' });
db.LocationPing.belongsTo(db.Attendance, { foreignKey: 'attendanceId', as: 'attendance' });

module.exports = db;
