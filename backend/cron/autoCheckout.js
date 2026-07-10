const { Attendance, AuditLog, Notification, User } = require('../models');
const { Op } = require('sequelize');

const runAutoCheckout = async () => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const sixHoursMs = 6 * 60 * 60 * 1000;
    const now = new Date();

    // Find all checked-in records that haven't been checked out
    const activeAttendances = await Attendance.findAll({
      where: {
        checkOutTime: null
      }
    });

    for (const record of activeAttendances) {
      const inTime = new Date(record.checkInTime);
      const diffMs = now.getTime() - inTime.getTime();

      // If it's been more than 6 hours
      if (diffMs >= sixHoursMs) {
        const autoCheckOutTime = new Date(inTime.getTime() + sixHoursMs);
        
        await record.update({
          checkOutTime: autoCheckOutTime,
          checkOutAddress: 'Location not available (System Auto Checkout)',
          workingHours: 6.0,
          overtimeHours: 0.0,
          status: 'Present' // Assuming 6 hours counts as present
        });

        await AuditLog.create({
          userId: record.userId,
          action: 'CHECK_OUT',
          details: `System Auto Checked out at ${autoCheckOutTime.toLocaleTimeString()} (after 6 hours). Working Hours: 6.0, Status: Present`
        });

        await Notification.create({
          userId: record.userId,
          title: 'System Auto Checkout',
          message: `You forgot to clock out. The system automatically clocked you out after 6 hours.`
        });
        
        console.log(`Auto-checked out user ${record.userId} for record ${record.id}`);
      }
    }
  } catch (error) {
    console.error('Error running auto checkout job:', error);
  }
};

const initAutoCheckoutJob = () => {
  // Run every 15 minutes (900,000 ms)
  setInterval(runAutoCheckout, 15 * 60 * 1000);
  console.log('Auto-checkout background job initialized (runs every 15 minutes).');
  // Optionally, run it once immediately on startup
  runAutoCheckout();
};

module.exports = {
  initAutoCheckoutJob,
  runAutoCheckout
};
