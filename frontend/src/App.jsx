import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AttendanceScreen from './pages/AttendanceScreen';
import EmployeeProfile from './pages/EmployeeProfile';
import LeaveManagement from './pages/LeaveManagement';
import EmployeeSalary from './pages/EmployeeSalary';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import AdminEmployees from './pages/AdminEmployees';
import AdminAttendance from './pages/AdminAttendance';
import AdminLeaveApproval from './pages/AdminLeaveApproval';
import AdminPayroll from './pages/AdminPayroll';
import AdminAuditLogs from './pages/AdminAuditLogs';

// Route guards
function PrivateRoute({ children, allowedRoles }) {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    // If employee attempts admin access, redirect appropriately
    return user.role === 'Employee' 
      ? <Navigate to="/employee" replace /> 
      : <Navigate to="/admin" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

function AccountantRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isDesignatedAccountant = user.designation?.toLowerCase() === 'accountant' && user.canPreparePayroll === true;
  const hasAccess = ['Super Admin', 'Admin', 'Accountant', 'Senior Accountant'].includes(user.role) || isDesignatedAccountant;

  if (!hasAccess) {
    return <Navigate to="/employee" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routing */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Employee routes */}
          <Route
            path="/employee"
            element={
              <PrivateRoute allowedRoles={['Employee']}>
                <EmployeeDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/employee/attendance"
            element={
              <PrivateRoute allowedRoles={['Employee']}>
                <AttendanceScreen />
              </PrivateRoute>
            }
          />
          <Route
            path="/employee/profile"
            element={
              <PrivateRoute allowedRoles={['Employee']}>
                <EmployeeProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/employee/leaves"
            element={
              <PrivateRoute allowedRoles={['Employee']}>
                <LeaveManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/employee/salary"
            element={
              <PrivateRoute allowedRoles={['Employee']}>
                <EmployeeSalary />
              </PrivateRoute>
            }
          />
          <Route
            path="/employee/payroll"
            element={
              <AccountantRoute>
                <AdminPayroll />
              </AccountantRoute>
            }
          />

          {/* Shared Settings route */}
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />

          {/* Protected Admin/Manager/Accountant Routes */}
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={['Super Admin', 'Admin', 'HR Manager', 'Accountant', 'Senior Accountant']}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/employees"
            element={
              <PrivateRoute allowedRoles={['Super Admin', 'Admin', 'HR Manager', 'Accountant', 'Senior Accountant']}>
                <AdminEmployees />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/attendance"
            element={
              <PrivateRoute allowedRoles={['Super Admin', 'Admin', 'HR Manager', 'Team Leader']}>
                <AdminAttendance />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/leaves"
            element={
              <PrivateRoute allowedRoles={['Super Admin', 'Admin', 'HR Manager']}>
                <AdminLeaveApproval />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/payroll"
            element={
              <PrivateRoute allowedRoles={['Super Admin', 'Admin', 'Accountant', 'Senior Accountant']}>
                <AdminPayroll />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <PrivateRoute allowedRoles={['Super Admin', 'Admin']}>
                <AdminAuditLogs />
              </PrivateRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
