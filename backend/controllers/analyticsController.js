const { User, Attendance, Leave, Payroll, AuditLog, Notification } = require('../models');
const { Op } = require('sequelize');

const getDashboardStats = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Employees counts
    const totalEmployees = await User.count();
    const activeEmployees = await User.count({ where: { status: 'Active' } });

    // Today's attendance counts
    const presentToday = await Attendance.count({
      where: {
        date: todayStr,
        status: { [Op.in]: ['Present', 'Late', 'Overtime'] }
      }
    });

    const halfDaysToday = await Attendance.count({
      where: {
        date: todayStr,
        status: 'Half Day'
      }
    });

    const absentToday = activeEmployees - (presentToday + halfDaysToday);

    // Tasks metrics
    const pendingLeaves = await Leave.count({ where: { status: 'Pending' } });
    const pendingSalaryApprovals = await Payroll.count({ where: { status: 'Pending Approval' } });

    // Compute monthly payroll expense
    const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-05"
    const payrollExpense = await Payroll.sum('netSalary', {
      where: {
        month: currentMonth,
        status: 'Approved'
      }
    }) || 0;

    // Attendance Analytics (last 7 days rates)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Group attendance counts by date
    const attendanceStats = await Attendance.findAll({
      where: {
        date: {
          [Op.gte]: sevenDaysAgo.toISOString().split('T')[0]
        }
      },
      attributes: ['date', 'status', [Attendance.sequelize.fn('COUNT', Attendance.sequelize.col('id')), 'count']],
      group: ['date', 'status'],
      order: [['date', 'ASC']]
    });

    res.status(200).json({
      metrics: {
        totalEmployees,
        activeEmployees,
        presentToday: presentToday + halfDaysToday,
        absentToday: Math.max(0, absentToday),
        pendingLeaves,
        pendingSalaryApprovals,
        payrollExpense
      },
      attendanceStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export Reports to CSV
const exportReport = async (req, res) => {
  try {
    const { type } = req.params; // 'employees', 'attendance', 'leaves', 'payroll'
    let csvContent = '';
    let filename = '';

    if (type === 'employees') {
      filename = 'employee_report.csv';
      const employees = await User.findAll({ attributes: { exclude: ['password'] } });
      csvContent = 'Employee ID,Full Name,Email,Role,Status,Department,Designation,Joining Date,Basic Salary\n';
      employees.forEach(emp => {
        csvContent += `"${emp.employeeId}","${emp.fullName}","${emp.email}","${emp.role}","${emp.status}","${emp.department || ''}","${emp.designation || ''}","${emp.joiningDate || ''}","${emp.basicSalary}"\n`;
      });
    } else if (type === 'attendance') {
      filename = 'attendance_report.csv';
      const logs = await Attendance.findAll({
        include: [{ model: User, as: 'user', attributes: ['fullName', 'employeeId'] }]
      });
      csvContent = 'Employee ID,Name,Date,Check-In,Check-Out,Hours Worked,Overtime Hours,Status\n';
      logs.forEach(log => {
        csvContent += `"${log.user?.employeeId || ''}","${log.user?.fullName || ''}","${log.date}","${log.checkInTime}","${log.checkOutTime || ''}","${log.workingHours}","${log.overtimeHours}","${log.status}"\n`;
      });
    } else if (type === 'leaves') {
      filename = 'leaves_report.csv';
      const leaves = await Leave.findAll({
        include: [{ model: User, as: 'user', attributes: ['fullName', 'employeeId'] }]
      });
      csvContent = 'Employee ID,Name,Type,Start Date,End Date,Reason,Status,Comments\n';
      leaves.forEach(lv => {
        csvContent += `"${lv.user?.employeeId || ''}","${lv.user?.fullName || ''}","${lv.type}","${lv.startDate}","${lv.endDate}","${lv.reason}","${lv.status}","${lv.comments || ''}"\n`;
      });
    } else if (type === 'payroll') {
      filename = 'payroll_report.csv';
      const payrolls = await Payroll.findAll({
        include: [{ model: User, as: 'user', attributes: ['fullName', 'employeeId'] }]
      });
      csvContent = 'Employee ID,Name,Month,Working Days,Present Days,Net Salary,Status\n';
      payrolls.forEach(pr => {
        csvContent += `"${pr.user?.employeeId || ''}","${pr.user?.fullName || ''}","${pr.month}","${pr.workingDays}","${pr.presentDays}","${pr.netSalary}","${pr.status}"\n`;
      });
    } else {
      return res.status(400).json({ error: 'Invalid report type.' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Audit Logs (Admin)
const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      include: [{ model: User, as: 'user', attributes: ['fullName', 'employeeId', 'role'] }],
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    res.status(200).json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Notifications for currently logged-in user
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark notifications read
const markNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.update({ isRead: true }, { where: { userId, isRead: false } });
    res.status(200).json({ message: 'Notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  exportReport,
  getAuditLogs,
  getNotifications,
  markNotificationsRead
};
