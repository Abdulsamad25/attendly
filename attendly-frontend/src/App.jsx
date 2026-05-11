import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, PublicRoute } from "./routes/Guards";

// Auth pages
import RoleSelection from "./pages/auth/RoleSelection";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminRegister from "./pages/auth/AdminRegister";
import AdminLogin from "./pages/auth/AdminLogin";
import AwaitingActivation from "./pages/auth/AwaitingActivation";
import ForgotPassword from "./pages/auth/ForgotPassword";
import SetPassword from "./pages/auth/SetPassword";

// Staff pages
import StaffDashboard from "./pages/staff/StaffDashboard";
import MyAttendance from "./pages/staff/MyAttendance";
import LeaveRequest from "./pages/staff/LeaveRequest";
import MyLeaves from "./pages/staff/MyLeaves";
import MyDeductions from "./pages/staff/MyDeduction";
import StaffSettings from "./pages/staff/StaffSettings";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminHome from "./pages/admin/AdminHome";
import StaffDirectory from "./pages/admin/StaffDirectory";
import AttendanceOverview from "./pages/admin/AttendanceOverview";
import LeaveQueue from "./pages/admin/LeaveQueue";
import LeaveCalendar from "./pages/admin/LeaveCalendar";
import PayrollDeductionReport from "./pages/admin/PayrollDeductionReport";
import AdminSettings from "./pages/admin/AdminSettings";
import PendingApprovals from "./pages/admin/PendingApprovals";

const App = () => (
  <Routes>
    {/* Root - Role Selection */}
    <Route
      path="/"
      element={
        <PublicRoute>
          <RoleSelection />
        </PublicRoute>
      }
    />

    {/* Public routes */}
    <Route
      path="/login"
      element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      }
    />
    <Route
      path="/register"
      element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      }
    />
    <Route
      path="/admin-register"
      element={
        <PublicRoute>
          <AdminRegister />
        </PublicRoute>
      }
    />
    <Route
      path="/admin-login"
      element={
        <PublicRoute>
          <AdminLogin />
        </PublicRoute>
      }
    />
    <Route path="/awaiting-activation" element={<AwaitingActivation />} />
    <Route
      path="/forgot-password"
      element={
        <PublicRoute>
          <ForgotPassword />
        </PublicRoute>
      }
    />
    <Route path="/set-password" element={<SetPassword />} />
    <Route path="/reset-password" element={<SetPassword />} />

    {/* Staff routes */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <StaffDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/attendance"
      element={
        <ProtectedRoute>
          <MyAttendance />
        </ProtectedRoute>
      }
    />
    <Route
      path="/leave-request"
      element={
        <ProtectedRoute>
          <LeaveRequest />
        </ProtectedRoute>
      }
    />
    <Route
      path="/my-leaves"
      element={
        <ProtectedRoute>
          <MyLeaves />
        </ProtectedRoute>
      }
    />
    <Route
      path="/deductions"
      element={
        <ProtectedRoute>
          <MyDeductions />
        </ProtectedRoute>
      }
    />

    <Route
      path="/settings"
      element={
        <ProtectedRoute>
          <StaffSettings />
        </ProtectedRoute>
      }
    />

    {/* Admin routes — Phase 6 (Nested) */}
    <Route
      path="/admin"
      element={
        <ProtectedRoute adminOnly>
          <AdminDashboard />
        </ProtectedRoute>
      }
    >
      <Route index element={<AdminHome />} />
      <Route path="staff" element={<StaffDirectory />} />
      <Route path="pending-approvals" element={<PendingApprovals />} />
      <Route path="attendance" element={<AttendanceOverview />} />
      <Route path="leaves" element={<LeaveQueue />} />
      <Route path="calendar" element={<LeaveCalendar />} />
      <Route path="payroll" element={<PayrollDeductionReport />} />
      <Route path="settings" element={<AdminSettings />} />
    </Route>

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
