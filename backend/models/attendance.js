module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define('Attendance', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    checkInTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    checkOutTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    checkInPhoto: {
      type: DataTypes.TEXT, // Store base64 or file path
      allowNull: true
    },
    checkOutPhoto: {
      type: DataTypes.TEXT, // Store base64 or file path
      allowNull: true
    },
    checkInLat: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    checkInLng: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    checkOutLat: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    checkOutLng: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    checkInAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    checkOutAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    workingHours: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00
    },
    overtimeHours: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00
    },
    status: {
      type: DataTypes.ENUM('Present', 'Absent', 'Half Day', 'Late', 'Overtime', 'Leave'),
      defaultValue: 'Present'
    },
    checkInSimulated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    checkOutSimulated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isOutOfBounds: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['userId', 'date']
      }
    ]
  });

  return Attendance;
};
