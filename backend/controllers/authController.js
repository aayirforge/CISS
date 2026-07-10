const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, AuditLog } = require('../models');

const register = async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      fullName,
      parentName,
      dob,
      gender,
      address,
      contactNumber,
      alternateContactNumber,
      emergencyContact,
      employeeId,
      department,
      designation,
      joiningDate,
      basicSalary,
      hra,
      conveyance,
      allowances
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const existingEmpId = await User.findOne({ where: { employeeId } });
    if (existingEmpId) {
      return res.status(400).json({ error: 'Employee ID is already assigned.' });
    }

    const hashedPassword = await bcrypt.hash(password || 'password123', 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: role || 'Employee',
      fullName,
      parentName,
      dob,
      gender,
      address,
      contactNumber,
      alternateContactNumber,
      emergencyContact,
      employeeId,
      department,
      designation,
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      basicSalary: basicSalary || 0,
      hra: hra || 0,
      conveyance: conveyance || 0,
      allowances: allowances || 0
    });

    await AuditLog.create({
      userId: newUser.id,
      action: 'REGISTER',
      details: `Registered new user with email ${email} and role ${role || 'Employee'}`
    });

    // Don't return password
    const userJson = newUser.toJSON();
    delete userJson.password;

    res.status(201).json({ message: 'User registered successfully', user: userJson });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'Inactive') {
      return res.status(403).json({ error: 'Your account is deactivated. Please contact support.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '24h' }
    );

    await AuditLog.create({
      userId: user.id,
      action: 'LOGIN',
      details: `User logged in from IP ${req.ip}`
    });

    const userJson = user.toJSON();
    delete userJson.password;

    res.status(200).json({
      message: 'Login successful',
      token,
      user: userJson
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const userJson = req.user.toJSON();
    delete userJson.password;
    res.status(200).json({ user: userJson });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile
};
