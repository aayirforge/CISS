module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM(
        'Super Admin',
        'Admin',
        'HR Manager',
        'Accountant',
        'Senior Accountant',
        'Team Leader',
        'Employee'
      ),
      defaultValue: 'Employee'
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active'
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    parentName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    contactNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    alternateContactNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emergencyContact: {
      type: DataTypes.STRING,
      allowNull: true
    },
    employeeId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    joiningDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
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
    canPreparePayroll: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });

  return User;
};
