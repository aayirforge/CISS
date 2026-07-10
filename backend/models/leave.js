module.exports = (sequelize, DataTypes) => {
  const Leave = sequelize.define('Leave', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM(
        'Casual Leave',
        'Sick Leave',
        'Earned Leave',
        'Emergency Leave',
        'Work From Home'
      ),
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    attachmentPath: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
      defaultValue: 'Pending'
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });

  return Leave;
};
