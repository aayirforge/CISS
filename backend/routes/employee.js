const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/employeeController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Base employee routes
router.get(
  '/',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Admin', 'HR Manager', 'Accountant', 'Senior Accountant', 'Team Leader'),
  listEmployees
);

router.post(
  '/',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Admin', 'HR Manager'),
  createEmployee
);

router.put(
  '/password/change',
  authenticateJWT,
  changePassword
);

router.put(
  '/:id',
  authenticateJWT,
  updateEmployee
);

router.patch(
  '/:id/status',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Admin'),
  toggleStatus
);

router.delete(
  '/:id',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Admin'),
  deleteEmployee
);

// Document uploading & validation routes
router.post(
  '/document/upload',
  authenticateJWT,
  upload.single('document'),
  uploadDocument
);

router.get(
  '/:userId/documents',
  authenticateJWT,
  listUserDocuments
);

router.get(
  '/documents/expiring',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Admin', 'HR Manager'),
  getExpiringDocuments
);

router.patch(
  '/document/:docId/verify',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Admin', 'HR Manager'),
  verifyDocument
);

router.patch(
  '/:id/payroll-permission',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Admin'),
  togglePayrollPermission
);

module.exports = router;
