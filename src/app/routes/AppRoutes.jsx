import { Suspense, lazy } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router';
import { useAuth } from '../hooks/useAuth';

const ActiveRequests = lazy(() => import('../pages/client/ActiveRequests'));
const ClientDashboard = lazy(() => import('../pages/client/ClientDashboard'));
const CreateRequest = lazy(() => import('../pages/client/CreateRequest'));
const MyRequests = lazy(() => import('../pages/client/MyRequests'));
const Payments = lazy(() => import('../pages/client/Payments'));
const Proposals = lazy(() => import('../pages/client/Proposals'));

const AdminAnalytics = lazy(() => import('../pages/admin/AdminAnalytics'));
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const Categories = lazy(() => import('../pages/admin/Categories'));
const PaymentsMonitor = lazy(() => import('../pages/admin/PaymentsMonitor'));
const RequestsMonitor = lazy(() => import('../pages/admin/RequestsMonitor'));
const SLAMonitor = lazy(() => import('../pages/admin/SLAMonitor'));
const UsersManagement = lazy(() => import('../pages/admin/UsersManagement'));
const VendorApprovals = lazy(() => import('../pages/admin/VendorApprovals'));

const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const Login = lazy(() => import('../pages/auth/Login'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const Signup = lazy(() => import('../pages/auth/Signup'));
const VendorVerification = lazy(() => import('../pages/auth/VendorVerification'));

const UserProfile = lazy(() => import('../pages/profile/UserProfile'));
const LandingPage = lazy(() => import('../pages/public/LandingPage'));
const Chat = lazy(() => import('../pages/shared/Chat'));
const Notifications = lazy(() => import('../pages/shared/Notifications'));

const AvailableRequests = lazy(() => import('../pages/vendor/AvailableRequests'));
const Completed = lazy(() => import('../pages/vendor/Completed'));
const VendorActiveRequests = lazy(() => import('../pages/vendor/VendorActiveRequests'));
const VendorAnalytics = lazy(() => import('../pages/vendor/VendorAnalytics'));
const VendorDashboard = lazy(() => import('../pages/vendor/VendorDashboard'));

function getDashboardPathForRole(role) {
  switch ((role || '').toLowerCase()) {
    case 'admin':
      return '/admin/dashboard';
    case 'vendor':
      return '/vendor/dashboard';
    case 'client':
    default:
      return '/client/dashboard';
  }
}

function RequireAuth() {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return null;
  }

  if (!user?.isAuthenticated || !user?.token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function RequireRole({ allowedRoles }) {
  const { user } = useAuth();
  const normalizedRole = (user?.role || '').toLowerCase();

  if (!allowedRoles.includes(normalizedRole)) {
    return <Navigate to={getDashboardPathForRole(normalizedRole)} replace />;
  }

  return <Outlet />;
}

function PublicOnlyRoute({ children }) {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return null;
  }

  if (user?.isAuthenticated && user?.token) {
    return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <Signup />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPassword />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicOnlyRoute>
              <ResetPassword />
            </PublicOnlyRoute>
          }
        />

        <Route element={<RequireAuth />}>
          <Route element={<RequireRole allowedRoles={['vendor']} />}>
            <Route path="/vendor-verification" element={<VendorVerification />} />
          </Route>

          <Route element={<RequireRole allowedRoles={['client']} />}>
            <Route path="/client">
              <Route path="dashboard" element={<ClientDashboard />} />
              <Route path="create-request" element={<CreateRequest />} />
              <Route path="my-requests" element={<MyRequests />} />
              <Route path="proposals/:requestId" element={<Proposals />} />
              <Route path="active-requests" element={<ActiveRequests />} />
              <Route path="payments" element={<Payments />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="chat" element={<Chat />} />
              <Route path="profile" element={<UserProfile />} />
            </Route>
          </Route>

          <Route element={<RequireRole allowedRoles={['vendor']} />}>
            <Route path="/vendor">
              <Route path="dashboard" element={<VendorDashboard />} />
              <Route path="available-requests" element={<AvailableRequests />} />
              <Route path="active-requests" element={<VendorActiveRequests />} />
              <Route path="completed" element={<Completed />} />
              <Route path="analytics" element={<VendorAnalytics />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="chat" element={<Chat />} />
              <Route path="profile" element={<UserProfile />} />
            </Route>
          </Route>

          <Route element={<RequireRole allowedRoles={['admin']} />}>
            <Route path="/admin">
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="vendor-approvals" element={<VendorApprovals />} />
              <Route path="users" element={<UsersManagement />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="categories" element={<Categories />} />
              <Route path="requests-monitor" element={<RequestsMonitor />} />
              <Route path="sla-monitor" element={<SLAMonitor />} />
              <Route path="payments-monitor" element={<PaymentsMonitor />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
