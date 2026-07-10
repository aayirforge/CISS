const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  exportReport,
  getAuditLogs,
  getNotifications,
  markNotificationsRead
} = require('../controllers/analyticsController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

router.get(
  '/stats',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Admin', 'HR Manager'),
  getDashboardStats
);

router.get(
  '/export/:type',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Admin', 'HR Manager'),
  exportReport
);

router.get(
  '/audit-logs',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Admin'),
  getAuditLogs
);

router.get('/notifications', authenticateJWT, getNotifications);
router.patch('/notifications/read', authenticateJWT, markNotificationsRead);

module.exports = router;
