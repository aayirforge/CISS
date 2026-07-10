module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
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
        'Aadhaar Card',
        'PAN Card',
        'Birth Certificate',
        'Passport',
        'Educational Certificate',
        'Experience Certificate',
        'Profile Photograph'
      ),
      allowNull: false
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Verified', 'Rejected'),
      defaultValue: 'Pending'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    }
  });

  return Document;
};
