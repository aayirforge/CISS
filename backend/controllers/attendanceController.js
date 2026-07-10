const { Attendance, AuditLog, Notification, LocationPing, User } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');

// Helper function to reverse geocode lat/lng to address
const reverseGeocode = async (lat, lng) => {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: {
        format: 'json',
        lat,
        lon: lng
      },
      headers: {
        'User-Agent': 'HRMSEnterpriseApp/1.0'
      },
      timeout: 3000
    });
    return response.data.display_name || `Lat: ${lat}, Lng: ${lng}`;
  } catch (error) {
    return `Location - Lat: ${lat}, Lng: ${lng} (Reverse Geocoding Unavailable)`;
  }
};

// Helper to calculate distance between two coordinates in meters (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
};

// Check-In Controller
const checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const { photo, lat, lng, isSimulated, isPhotoSimulated } = req.body; // Photo is base64 string, lat/lng are decimals

    if (!photo || isPhotoSimulated) {
      return res.status(400).json({ error: 'A valid face verification photo is required to mark attendance.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Check if check-in already exists for today
    const existingAttendance = await Attendance.findOne({
      where: {
        userId,
        date: todayStr
      }
    });

    if (existingAttendance) {
      return res.status(400).json({ error: 'You have already checked in for today.' });
    }

    // Geocoding
    let address = 'Location not available (GPS permission denied)';
    if (lat && lng) {
      address = await reverseGeocode(lat, lng);
    }

    // Geofencing Check
    let isOutOfBounds = false;
    if (lat && lng) {
      const distance = calculateDistance(parseFloat(lat), parseFloat(lng), 28.6139, 77.2090);
      if (distance > 250) { // 250 meters limit
        isOutOfBounds = true;
      }
    }

    // Detect Late Arrival
    const checkInTime = new Date();
    const hours = checkInTime.getHours();
    const minutes = checkInTime.getMinutes();
    let status = 'Present';

    // Rule: Shift starts at 9:00 AM, Late marking threshold is 9:15 AM
    if (hours > 9 || (hours === 9 && minutes > 15)) {
      status = 'Late';
    }

    const newRecord = await Attendance.create({
      userId,
      date: todayStr,
      checkInTime,
      checkInPhoto: photo || null,
      checkInLat: lat ? parseFloat(lat) : null,
      checkInLng: lng ? parseFloat(lng) : null,
      checkInAddress: address,
      status,
      checkInSimulated: !!isSimulated || !!isPhotoSimulated,
      checkOutSimulated: false,
      isOutOfBounds
    });

    await AuditLog.create({
      userId,
      action: 'CHECK_IN',
      details: `Checked in at ${checkInTime.toLocaleTimeString()} from ${address}. Status: ${status}.${isSimulated || isPhotoSimulated ? ' [Simulated Capture]' : ''}${isOutOfBounds ? ' [Out of Bounds]' : ''}`
    });

    await Notification.create({
      userId,
      title: 'Attendance Marked',
      message: `Successfully checked in for today at ${checkInTime.toLocaleTimeString()}.${status === 'Late' ? ' Status: Late Arrival.' : ''}${isOutOfBounds ? ' Note: Clocked in Off-site.' : ''}`
    });

    res.status(201).json({ message: 'Checked in successfully.', record: newRecord });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check-Out Controller
const checkOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const { photo, lat, lng, isSimulated, isPhotoSimulated } = req.body;

    if (!photo || isPhotoSimulated) {
      return res.status(400).json({ error: 'A valid face verification photo is required to check out.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Find today's check-in
    const attendance = await Attendance.findOne({
      where: {
        userId,
        date: todayStr
      }
    });

    if (!attendance) {
      return res.status(400).json({ error: 'No check-in record found for today. Please check in first.' });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({ error: 'You have already checked out for today.' });
    }

    // Geocoding
    let address = 'Location not available (GPS permission denied)';
    if (lat && lng) {
      address = await reverseGeocode(lat, lng);
    }

    // Geofencing Check
    let isOutOfBounds = attendance.isOutOfBounds;
    if (lat && lng) {
      const distance = calculateDistance(parseFloat(lat), parseFloat(lng), 28.6139, 77.2090);
      if (distance > 250) { // 250 meters limit
        isOutOfBounds = true;
      }
    }

    const checkOutTime = new Date();
    const inTime = new Date(attendance.checkInTime);
    
    // Calculate total working hours
    const diffMs = checkOutTime - inTime;
    const diffHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    // Attendance rules
    let status = attendance.status; // Default to 'Present' or 'Late'
    let overtime = 0.00;

    // Shift rules
    if (diffHours < 4.0) {
      status = 'Half Day';
    } else if (diffHours > 8.0) {
      overtime = parseFloat((diffHours - 8.0).toFixed(2));
      status = 'Overtime';
    }

    await attendance.update({
      checkOutTime,
      checkOutPhoto: photo || null,
      checkOutLat: lat ? parseFloat(lat) : null,
      checkOutLng: lng ? parseFloat(lng) : null,
      checkOutAddress: address,
      workingHours: diffHours,
      overtimeHours: overtime,
      status,
      checkOutSimulated: !!isSimulated || !!isPhotoSimulated,
      isOutOfBounds
    });

    await AuditLog.create({
      userId,
      action: 'CHECK_OUT',
      details: `Checked out at ${checkOutTime.toLocaleTimeString()} from ${address}. Working Hours: ${diffHours}, Overtime Hours: ${overtime}, Status: ${status}.${isSimulated || isPhotoSimulated ? ' [Simulated Capture]' : ''}${isOutOfBounds ? ' [Out of Bounds]' : ''}`
    });

    await Notification.create({
      userId,
      title: 'Attendance Checkout',
      message: `Successfully checked out. Total hours worked: ${diffHours} hrs.${isOutOfBounds ? ' Note: Clocked out Off-site.' : ''}`
    });

    res.status(200).json({ message: 'Checked out successfully.', record: attendance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Employee's Today Status
const getTodayStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const todayStr = new Date().toISOString().split('T')[0];

    const record = await Attendance.findOne({
      where: {
        userId,
        date: todayStr
      }
    });

    res.status(200).json({ record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Attendance History (with filtering options)
const getHistory = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { filter, startDate, endDate } = req.query;

    const whereClause = { userId };
    const today = new Date();

    if (filter === 'daily') {
      whereClause.date = today.toISOString().split('T')[0];
    } else if (filter === 'weekly') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);
      whereClause.date = {
        [Op.between]: [oneWeekAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]]
      };
    } else if (filter === 'monthly') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(today.getDate() - 30);
      whereClause.date = {
        [Op.between]: [oneMonthAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]]
      };
    } else if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    }

    const history = await Attendance.findAll({
      where: whereClause,
      order: [['date', 'DESC']]
    });

    res.status(200).json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin Endpoint: Get Daily Logs of all employees
const getDailyLogs = async (req, res) => {
  try {
    const { date, department } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const userWhere = {};
    if (department) {
      userWhere.department = department;
    }

    const logs = await Attendance.findAll({
      where: { date: targetDate },
      include: [
        {
          model: User,
          as: 'user',
          where: userWhere,
          attributes: ['fullName', 'employeeId', 'department', 'designation']
        }
      ],
      order: [['checkInTime', 'DESC']]
    });

    res.status(200).json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Employee: Submit a periodic GPS location ping
const submitLocationPing = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lat, lng } = req.body;

    if (lat == null || lng == null) {
      return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Find the active attendance record (checked in, not checked out)
    const activeAttendance = await Attendance.findOne({
      where: {
        userId,
        date: todayStr,
        checkOutTime: null
      }
    });

    if (!activeAttendance) {
      return res.status(400).json({ error: 'No active check-in session found.' });
    }

    await LocationPing.create({
      userId,
      attendanceId: activeAttendance.id,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      capturedAt: new Date()
    });

    res.status(200).json({ message: 'Location ping recorded.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: Get live locations of all currently checked-in employees
const getLiveLocations = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Get all active attendance records (checked in today, not yet checked out)
    const activeAttendances = await Attendance.findAll({
      where: {
        date: todayStr,
        checkOutTime: null
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'employeeId', 'department', 'designation']
        }
      ]
    });

    // For each active attendance, get the latest location ping
    const liveLocations = [];

    for (const attendance of activeAttendances) {
      const latestPing = await LocationPing.findOne({
        where: { attendanceId: attendance.id },
        order: [['capturedAt', 'DESC']]
      });

      liveLocations.push({
        userId: attendance.userId,
        attendanceId: attendance.id,
        fullName: attendance.user?.fullName,
        employeeId: attendance.user?.employeeId,
        department: attendance.user?.department,
        designation: attendance.user?.designation,
        checkInTime: attendance.checkInTime,
        checkInLat: attendance.checkInLat,
        checkInLng: attendance.checkInLng,
        // Latest live location (or fallback to check-in location)
        currentLat: latestPing?.lat || attendance.checkInLat,
        currentLng: latestPing?.lng || attendance.checkInLng,
        lastPingAt: latestPing?.capturedAt || attendance.checkInTime,
        hasPing: !!latestPing
      });
    }

    res.status(200).json({ liveLocations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getTodayStatus,
  getHistory,
  getDailyLogs,
  submitLocationPing,
  getLiveLocations
};
