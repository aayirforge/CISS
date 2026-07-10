const { Payroll, User, Attendance, Leave, AuditLog, Notification } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Helper: Calculate monthly payroll variables
const calculateSalaryParams = async (userId, month) => {
  const employee = await User.findByPk(userId);
  if (!employee) throw new Error('Employee not found');

  // Parse Year and Month
  const [year, monthStr] = month.split('-');
  const daysInMonth = new Date(year, monthStr, 0).getDate();

  // Get total check-ins
  const attendances = await Attendance.findAll({
    where: {
      userId,
      date: {
        [Op.between]: [`${month}-01`, `${month}-${daysInMonth}`]
      }
    }
  });

  const presentDays = attendances.filter(a => ['Present', 'Late', 'Overtime'].includes(a.status)).length;
  const halfDays = attendances.filter(a => a.status === 'Half Day').length;
  const actualPresentDays = presentDays + (halfDays * 0.5);

  const overtimeHours = attendances.reduce((acc, curr) => acc + parseFloat(curr.overtimeHours || 0), 0);

  // Get approved leaves in this month
  const leaves = await Leave.findAll({
    where: {
      userId,
      status: 'Approved',
      [Op.or]: [
        { startDate: { [Op.between]: [`${month}-01`, `${month}-${daysInMonth}`] } },
        { endDate: { [Op.between]: [`${month}-01`, `${month}-${daysInMonth}`] } }
      ]
    }
  });

  let leavesCount = 0;
  leaves.forEach(l => {
    const start = new Date(l.startDate);
    const end = new Date(l.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    leavesCount += diffDays;
  });

  // Calculate default working days (Mon-Fri, let's say 22 days or actual days in month minus weekends)
  let workingDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, monthStr - 1, d).getDay();
    if (day !== 0 && day !== 6) { // Exclude Sundays (0) and Saturdays (6)
      workingDays++;
    }
  }

  return {
    workingDays,
    presentDays: actualPresentDays,
    leavesCount,
    overtimeHours,
    employee
  };
};

// accountant prepares salary
const prepareSalary = async (req, res) => {
  try {
    const { userId, month, bonus, deductions } = req.body;
    const preparedById = req.user.id;

    if (!userId || !month) {
      return res.status(400).json({ error: 'userId and month are required.' });
    }

    // Check if payroll already exists for this employee/month
    const existingPayroll = await Payroll.findOne({ where: { userId, month } });
    if (existingPayroll) {
      return res.status(400).json({ error: 'Payroll has already been prepared for this month.' });
    }

    const params = await calculateSalaryParams(userId, month);
    const { workingDays, presentDays, leavesCount, overtimeHours, employee } = params;

    const baseBasic = parseFloat(employee.basicSalary || 0);
    const baseHra = parseFloat(employee.hra || 0);
    const baseConveyance = parseFloat(employee.conveyance || 0);
    const baseAllowances = parseFloat(employee.allowances || 0);
    
    // Prorate salary based on attendance
    // Formula: (Present Days + Allowed Paid Leaves) / Working Days
    // Let's assume up to 2 paid leaves allowed per month
    const paidLeavesLimit = 2;
    const effectivePresentDays = Math.min(workingDays, presentDays + Math.min(leavesCount, paidLeavesLimit));
    const prorationRatio = workingDays > 0 ? (effectivePresentDays / workingDays) : 1;

    const basicSalary = parseFloat((baseBasic * prorationRatio).toFixed(2));
    const hra = parseFloat((baseHra * prorationRatio).toFixed(2));
    const conveyance = parseFloat((baseConveyance * prorationRatio).toFixed(2));
    const allowances = parseFloat((baseAllowances * prorationRatio).toFixed(2));

    // Overtime pay: $20 per hour
    const overtimePay = parseFloat((overtimeHours * 20.00).toFixed(2));

    // Deductions: Loss of pay (LOP) for additional absent days
    const absentDays = Math.max(0, workingDays - (presentDays + leavesCount));
    const lopDeduction = parseFloat((absentDays * (baseBasic / workingDays || 0)).toFixed(2));
    const totalDeductions = parseFloat((lopDeduction + parseFloat(deductions || 0)).toFixed(2));

    // Bonus
    const bonusVal = parseFloat(bonus || 0);

    // Calculate gross
    const grossSalary = basicSalary + hra + conveyance + allowances + overtimePay + bonusVal;

    // Tax: flat 10%
    const tax = parseFloat((grossSalary * 0.10).toFixed(2));

    // Net
    const netSalary = parseFloat((grossSalary - totalDeductions - tax).toFixed(2));

    const payroll = await Payroll.create({
      userId,
      month,
      workingDays,
      presentDays,
      leavesCount,
      overtimeHours,
      basicSalary,
      hra,
      conveyance,
      allowances,
      bonus: bonusVal,
      overtimePay,
      deductions: totalDeductions,
      tax,
      netSalary,
      status: 'Pending Approval',
      preparedById
    });

    await AuditLog.create({
      userId: preparedById,
      action: 'PREPARE_PAYROLL',
      details: `Prepared payroll for ${employee.fullName} for month ${month}. Net Salary: ${netSalary}`
    });

    res.status(201).json({ message: 'Payroll prepared and sent for approval.', payroll });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin approves/rejects salary and triggers PDF generation
const reviewSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'
    const approvedById = req.user.id;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be Approved or Rejected.' });
    }

    const payroll = await Payroll.findByPk(id, {
      include: [{ model: User, as: 'user' }]
    });

    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found.' });
    }

    await payroll.update({
      status,
      approvedById: status === 'Approved' ? approvedById : null
    });

    await AuditLog.create({
      userId: approvedById,
      action: status === 'Approved' ? 'APPROVE_PAYROLL' : 'REJECT_PAYROLL',
      details: `${status} payroll ID ${id} for employee ${payroll.user.fullName}`
    });

    if (status === 'Approved') {
      // Create pdfs directory if not exists
      const pdfsDir = path.join(__dirname, '../uploads/payslips');
      if (!fs.existsSync(pdfsDir)) {
        fs.mkdirSync(pdfsDir, { recursive: true });
      }

      const pdfFilename = `payslip_${payroll.user.employeeId}_${payroll.month}.pdf`;
      const pdfFilePath = path.join(pdfsDir, pdfFilename);

      // Generate PDF
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(pdfFilePath);
      doc.pipe(stream);

      // PDF Content
      doc.fontSize(22).text('CISS MANAGEMENT SERVICES', { align: 'center', underline: true });
      doc.moveDown();
      doc.fontSize(16).text('MONTHLY PAY SLIP', { align: 'center' });
      doc.text(`Month: ${payroll.month}`, { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Employee ID: ${payroll.user.employeeId}`);
      doc.text(`Name: ${payroll.user.fullName}`);
      doc.text(`Department: ${payroll.user.department || 'N/A'}`);
      doc.text(`Designation: ${payroll.user.designation || 'N/A'}`);
      doc.moveDown();

      doc.text(`Working Days in Month: ${payroll.workingDays}`);
      doc.text(`Present Days: ${payroll.presentDays}`);
      doc.text(`Overtime Hours Worked: ${payroll.overtimeHours}`);
      doc.moveDown();

      doc.text('----------------------------------------------------');
      doc.text('EARNINGS', { underline: true });
      doc.text(`Basic Salary: $${payroll.basicSalary}`);
      doc.text(`HRA: $${payroll.hra}`);
      doc.text(`Conveyance: $${payroll.conveyance}`);
      doc.text(`Allowances: $${payroll.allowances}`);
      doc.text(`Overtime Pay: $${payroll.overtimePay}`);
      doc.text(`Bonus: $${payroll.bonus}`);
      doc.moveDown();

      doc.text('DEDUCTIONS', { underline: true });
      doc.text(`Tax: $${payroll.tax}`);
      doc.text(`Other Deductions: $${payroll.deductions}`);
      doc.text('----------------------------------------------------');
      doc.fontSize(14).text(`NET PAYABLE SALARY: $${payroll.netSalary}`, { bold: true });
      
      doc.moveDown(4);
      doc.fontSize(10).text('Prepared By: Accountant Department', { align: 'left' });
      doc.text('Approved By: HR / Administration', { align: 'right' });

      doc.end();

      // Update payroll record with PDF URL
      await payroll.update({
        pdfPath: `uploads/payslips/${pdfFilename}`
      });

      await Notification.create({
        userId: payroll.userId,
        title: 'Salary Slip Released',
        message: `Your payroll for ${payroll.month} has been approved. Net payable is $${payroll.netSalary}. Slip is ready for download.`
      });
    } else {
      await Notification.create({
        userId: payroll.userId,
        title: 'Salary Prepared Rejected',
        message: `Payroll preparation for ${payroll.month} was rejected by administration.`
      });
    }

    res.status(200).json({ message: `Payroll status updated to ${status}`, payroll });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Employee and admin can view payrolls
const getPayrollHistory = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    // Standard employee can only view their own
    if (req.user.role === 'Employee' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to view other salary details.' });
    }

    const history = await Payroll.findAll({
      where: { userId },
      order: [['month', 'DESC']]
    });

    res.status(200).json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin list all prepared payrolls
const listAllPayrolls = async (req, res) => {
  try {
    const payrolls = await Payroll.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['fullName', 'employeeId', 'department', 'designation']
        }
      ],
      order: [['month', 'DESC'], ['createdAt', 'DESC']]
    });

    res.status(200).json({ payrolls });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  prepareSalary,
  reviewSalary,
  getPayrollHistory,
  listAllPayrolls
};
