const { User, Document, AuditLog, Notification } = require('../models');
const fs = require('fs');
const path = require('path');

// Get all employees
const listEmployees = async (req, res) => {
  try {
    const { department, status, role } = req.query;
    const whereClause = {};
    if (department) whereClause.department = department;
    if (status) whereClause.status = status;
    if (role) whereClause.role = role;

    const employees = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ employees });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new employee account
const createEmployee = async (req, res) => {
  try {
    const { email, password, role, fullName, employeeId, department, designation, basicSalary, hra, conveyance, allowances } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists.' });
    }

    const existingEmp = await User.findOne({ where: { employeeId } });
    if (existingEmp) {
      return res.status(400).json({ error: 'Employee ID already exists.' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password || 'password123', 10);

    const employee = await User.create({
      email,
      password: hashedPassword,
      role: role || 'Employee',
      fullName,
      employeeId,
      department,
      designation,
      joiningDate: new Date().toISOString().split('T')[0],
      basicSalary: basicSalary || 0,
      hra: hra || 0,
      conveyance: conveyance || 0,
      allowances: allowances || 0
    });

    await AuditLog.create({
      userId: req.user.id,
      action: 'CREATE_EMPLOYEE',
      details: `Created employee profile for ${fullName} (${employeeId})`
    });

    await Notification.create({
      userId: employee.id,
      title: 'Welcome!',
      message: `Your account has been created by the Admin. Default password is 'password123'. Please complete your profile.`
    });

    const empJson = employee.toJSON();
    delete empJson.password;
    res.status(201).json({ message: 'Employee profile created.', employee: empJson });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update employee account details
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findByPk(id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    // Restrict what standard employees can edit vs HR / Admin
    const updateData = { ...req.body };
    delete updateData.password; // Do not allow password editing here

    if (req.user.role === 'Employee' && req.user.id !== id) {
      return res.status(403).json({ error: 'You are not authorized to edit other profiles.' });
    }

    // If standard employee, restrict salary/roles updates
    if (req.user.role === 'Employee') {
      delete updateData.role;
      delete updateData.status;
      delete updateData.department;
      delete updateData.designation;
      delete updateData.basicSalary;
      delete updateData.hra;
      delete updateData.conveyance;
      delete updateData.allowances;
    }

    await employee.update(updateData);

    await AuditLog.create({
      userId: req.user.id,
      action: 'UPDATE_EMPLOYEE',
      details: `Updated employee profile details for ID: ${id}`
    });

    const updatedEmpJson = employee.toJSON();
    delete updatedEmpJson.password;
    res.status(200).json({ message: 'Employee updated successfully.', employee: updatedEmpJson });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggle status Active/Inactive
const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Active' or 'Inactive'

    const employee = await User.findByPk(id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    await employee.update({ status });

    await AuditLog.create({
      userId: req.user.id,
      action: 'TOGGLE_STATUS',
      details: `Set status of employee ${employee.fullName} to ${status}`
    });

    res.status(200).json({ message: `Employee status set to ${status}`, employee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findByPk(id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const name = employee.fullName;
    await employee.destroy();

    await AuditLog.create({
      userId: req.user.id,
      action: 'DELETE_EMPLOYEE',
      details: `Deleted employee profile for ${name}`
    });

    res.status(200).json({ message: `Employee ${name} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Document Upload Route Controller
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file uploaded.' });
    }

    const { type, expiryDate } = req.body;
    const userId = req.user.id;

    // Check if document of this type already exists, if so delete/overwrite or update
    const existingDoc = await Document.findOne({ where: { userId, type } });
    if (existingDoc) {
      // Remove old file
      try {
        const oldPath = path.join(__dirname, '..', existingDoc.filePath);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch (err) {
        console.error('Failed to delete old file:', err);
      }
      await existingDoc.destroy();
    }

    // File path relative to backend root
    const filePath = `uploads/${req.file.filename}`;

    const document = await Document.create({
      userId,
      type,
      filePath,
      fileName: req.file.originalname,
      expiryDate: expiryDate || null,
      status: 'Pending'
    });

    await AuditLog.create({
      userId,
      action: 'UPLOAD_DOCUMENT',
      details: `Uploaded document: ${type} (${req.file.originalname})`
    });

    res.status(201).json({ message: 'Document uploaded successfully. Awaiting verification.', document });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// List user documents
const listUserDocuments = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const documents = await Document.findAll({ where: { userId } });
    res.status(200).json({ documents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verify/Reject Document
const verifyDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const { status, remarks } = req.body; // 'Verified' or 'Rejected'

    const document = await Document.findByPk(docId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    await document.update({ status, remarks });

    await AuditLog.create({
      userId: req.user.id,
      action: 'VERIFY_DOCUMENT',
      details: `Set status of document ID ${docId} to ${status}. Remarks: ${remarks || 'None'}`
    });

    await Notification.create({
      userId: document.userId,
      title: `Document ${status}`,
      message: `Your document of type '${document.type}' was ${status.toLowerCase()}.${remarks ? ' Reason: ' + remarks : ''}`
    });

    res.status(200).json({ message: `Document status set to ${status}`, document });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Expiring Documents Alerts
const getExpiringDocuments = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringDocs = await Document.findAll({
      where: {
        expiryDate: {
          [Op.not]: null,
          [Op.lte]: thirtyDaysFromNow.toISOString().split('T')[0]
        },
        status: 'Verified'
      },
      include: [{ model: User, as: 'user', attributes: ['fullName', 'employeeId', 'email'] }]
    });

    res.status(200).json({ expiringDocs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const togglePayrollPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { canPreparePayroll } = req.body;

    const employee = await User.findByPk(id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    await employee.update({ canPreparePayroll });

    await AuditLog.create({
      userId: req.user.id,
      action: 'TOGGLE_PAYROLL_PERMISSION',
      details: `Set payroll preparation permission of employee ${employee.fullName} to ${canPreparePayroll}`
    });

    res.status(200).json({ message: `Payroll permission set to ${canPreparePayroll}`, employee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    const employee = await User.findByPk(userId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(oldPassword, employee.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await employee.update({ password: hashedPassword });

    await AuditLog.create({
      userId,
      action: 'CHANGE_PASSWORD',
      details: `Changed password successfully.`
    });

    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  listEmployees,
  createEmployee,
  updateEmployee,
  toggleStatus,
  deleteEmployee,
  uploadDocument,
  listUserDocuments,
  verifyDocument,
  getExpiringDocuments,
  togglePayrollPermission,
  changePassword
};
