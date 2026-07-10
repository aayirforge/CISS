const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  reviewLeave
} = require('../controllers/leaveController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/apply', authenticateJWT, upload.single('attachment'), applyLeave);
router.get('/my-leaves', authenticateJWT, getMyLeaves);

router.get(
  '/all',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Admin', 'HR Manager'),
  getAllLeaves
);

router.patch(
  '/:id/review',
  authenticateJWT,
  authorizeRoles('Super Admin', 'Admin', 'HR Manager'),
  reviewLeave
);

module.exports = router;
