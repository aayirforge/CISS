module.exports = (sequelize, DataTypes) => {
  const Payroll = sequelize.define('Payroll', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    month: {
      type: DataTypes.STRING, // e.g. "2026-05"
      allowNull: false
    },
    workingDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    presentDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    leavesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    overtimeHours: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00
    },
    basicSalary: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    hra: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    conveyance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    allowances: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    bonus: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    overtimePay: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    deductions: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    netSalary: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    status: {
      type: DataTypes.ENUM('Pending Approval', 'Approved', 'Rejected'),
      defaultValue: 'Pending Approval'
    },
    pdfPath: {
      type: DataTypes.STRING,
      allowNull: true
    },
    preparedById: {
      type: DataTypes.UUID,
      allowNull: true
    },
    approvedById: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['userId', 'month']
      }
    ]
  });

  return Payroll;
};
