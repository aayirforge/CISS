module.exports = (sequelize, DataTypes) => {
  const LocationPing = sequelize.define('LocationPing', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    attendanceId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    lat: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    lng: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    capturedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['attendanceId']
      },
      {
        fields: ['capturedAt']
      }
    ]
  });

  return LocationPing;
};
