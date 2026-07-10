const { Leave, User, AuditLog, Notification } = require('../models');

// Apply for leave (Employee)
const applyLeave = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, startDate, endDate, reason } = req.body;
    const attachmentPath = req.file ? `uploads/${req.file.filename}` : null;

    if (!type || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'All fields (type, startDate, endDate, reason) are required.' });
    }

    const leave = await Leave.create({
      userId,
      type,
      startDate,
      endDate,
      reason,
      attachmentPath,
      status: 'Pending'
    });

    await AuditLog.create({
      userId,
      action: 'APPLY_LEAVE',
      details: `Applied for ${type} from ${startDate} to ${endDate}`
    });

    // Notify Admins and HR (Send notification to HR/Admin accounts, or broadcast simulation)
    // Find admins to log notifications
    const admins = await User.findAll({ where: { role: ['Admin', 'HR Manager', 'Super Admin'] } });
    for (const admin of admins) {
      await Notification.create({
        userId: admin.id,
        title: 'New Leave Request',
        message: `${req.user.fullName} has applied for ${type} starting on ${startDate}.`
      });
    }

    res.status(201).json({ message: 'Leave request submitted successfully.', leave });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get leave history for employee
const getMyLeaves = async (req, res) => {
  try {
    const userId = req.user.id;
    const leaves = await Leave.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    // Compute basic balances summary
    // Typically: Casual (12), Sick (10), Earned (15), Emergency (5)
    const approvedLeaves = leaves.filter(l => l.status === 'Approved');
    const utilization = {
      'Casual Leave': 0,
      'Sick Leave': 0,
      'Earned Leave': 0,
      'Emergency Leave': 0,
      'Work From Home': 0
    };

    approvedLeaves.forEach(l => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (utilization[l.type] !== undefined) {
        utilization[l.type] += diffDays;
      }
    });

    const balances = {
      'Casual Leave': Math.max(0, 12 - utilization['Casual Leave']),
      'Sick Leave': Math.max(0, 10 - utilization['Sick Leave']),
      'Earned Leave': Math.max(0, 15 - utilization['Earned Leave']),
      'Emergency Leave': Math.max(0, 5 - utilization['Emergency Leave']),
      'Work From Home': 'Unlimited'
    };

    res.status(200).json({ leaves, balances, utilization });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: Get all leave requests
const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['fullName', 'employeeId', 'department', 'designation']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ leaves });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: Approve or Reject leave
const reviewLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body; // 'Approved' or 'Rejected'

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be Approved or Rejected.' });
    }

    const leave = await Leave.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName'] }]
    });

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found.' });
    }

    await leave.update({ status, comments });

    await AuditLog.create({
      userId: req.user.id,
      action: 'REVIEW_LEAVE',
      details: `${status} leave for employee ID: ${leave.userId}`
    });

    await Notification.create({
      userId: leave.userId,
      title: `Leave Request ${status}`,
      message: `Your leave request for ${leave.type} from ${leave.startDate} has been ${status.toLowerCase()}.${comments ? ' Comment: ' + comments : ''}`
    });

    res.status(200).json({ message: `Leave status updated to ${status}`, leave });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  reviewLeave
};
