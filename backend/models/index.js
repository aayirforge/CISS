const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config();

console.log('--- DB Environment Variable Scan ---');
const INTERNAL_HOST = 'dpg-d92bf7ernols738tpebg-a';
const RENDER_REGION = process.env.RENDER_REGION || 'singapore';
const EXTERNAL_HOST = `${INTERNAL_HOST}.${RENDER_REGION}-postgres.render.com`;

for (const [key, value] of Object.entries(process.env)) {
  if (value && value.includes(INTERNAL_HOST)) {
    console.log(`  Found ${key}: ${value.replace(/:[^:@]+@/, ':****@')}`);
    // Rewrite ALL env vars containing the internal hostname
    process.env[key] = value.replace(new RegExp(INTERNAL_HOST.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), EXTERNAL_HOST);
    console.log(`  Rewrote ${key}: ${process.env[key].replace(/:[^:@]+@/, ':****@')}`);
  }
}
console.log('-----------------------------------');

let sequelize;
if (process.env.DATABASE_URL) {
  const url = process.env.DATABASE_URL;
  console.log(`Connecting to: ${url.replace(/:[^:@]+@/, ':****@')}`);

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
