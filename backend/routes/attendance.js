const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getTodayStatus,
  getHistory,
  getDailyLogs,
  submitLocationPing,
  getLiveLocations
} = require('../controllers/attendanceController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

router.post('/checkin', authenticateJWT, checkIn);
router.post('/checkout', authenticateJWT, checkOut);
router.get('/today', authenticateJWT, getTodayStatus);
router.get('/history', authenticateJWT, getHistory);

// Employee: periodic GPS ping while checked in
router.post('/location-ping', authenticateJWT, submitLocationPing);

// Admin: get live locations of all checked-in employees
router.get(
  '/live-locations',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Admin', 'HR Manager'),
  getLiveLocations
);

router.get(
  '/history/:userId',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Admin', 'HR Manager', 'Team Leader'),
  getHistory
);

router.get(
  '/logs',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Admin', 'HR Manager', 'Team Leader'),
  getDailyLogs
);

module.exports = router;
