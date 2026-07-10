const express = require('express');
const router = express.Router();
const {
  prepareSalary,
  reviewSalary,
  getPayrollHistory,
  listAllPayrolls
} = require('../controllers/payrollController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

const authorizePayrollPrep = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { role, designation, canPreparePayroll } = req.user;
  if (['Super Admin', 'Admin', 'Accountant', 'Senior Accountant'].includes(role)) {
    return next();
  }
  if (role === 'Employee' && designation?.toLowerCase() === 'accountant' && canPreparePayroll === true) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Only authorized accountants can prepare payroll.' });
};

const authorizePayrollView = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { role, designation, canPreparePayroll } = req.user;
  if (['Super Admin', 'Admin', 'HR Manager', 'Accountant', 'Senior Accountant'].includes(role)) {
    return next();
  }
  if (role === 'Employee' && designation?.toLowerCase() === 'accountant' && canPreparePayroll === true) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Unauthorized to view payroll.' });
};

router.post(
  '/prepare',
  authenticateJWT,
  authorizePayrollPrep,
  prepareSalary
);

router.patch(
  '/:id/review',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Admin'),
  reviewSalary
);

router.get('/history', authenticateJWT, getPayrollHistory);

router.get(
  '/history/:userId',
  authenticateJWT,
  authorizePayrollView,
  getPayrollHistory
);

router.get(
  '/all',
  authenticateJWT,
  authorizePayrollView,
  listAllPayrolls
);

module.exports = router;
