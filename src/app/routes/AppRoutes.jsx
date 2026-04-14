import { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { getVendorVerificationStatusApi } from '../services/vendorVerifyApi';

const ActiveRequests = lazy(() => import('../pages/client/ActiveRequests'));
const ClientDashboard = lazy(() => import('../pages/client/ClientDashboard'));
const CreateRequest = lazy(() => import('../pages/client/CreateRequest'));
const MyRequests = lazy(() => import('../pages/client/MyRequests'));
const Payments = lazy(() => import('../pages/client/Payments'));
const Proposals = lazy(() => import('../pages/client/Proposals'));
const UserProfileClient = lazy(() => import('../pages/client/UserProfileClient'));

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
const VendorMyProposals = lazy(() => import('../pages/vendor/VendorMyProposals'));
const VendorPayments = lazy(() => import('../pages/vendor/VendorPayments'));

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

function parseVerificationStatus(raw) {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase();
    if (normalized === 'pending') return 1;
    if (normalized === 'approved') return 2;
    if (normalized === 'rejected') return 3;
    const numeric = Number.parseInt(raw, 10);
    if (!Number.isNaN(numeric)) return numeric;
  }
  return 0;
}

function isSafeInternalRedirectPath(path) {
  if (!path || typeof path !== 'string') return false;
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;
  return true;
}

function RequireAuth() {
  const { user, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return null;
  }

  if (!user?.isAuthenticated || !user?.token) {
    const redirect = `${location.pathname}${location.search || ''}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
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

function RequireVendorApproval() {
  const { user } = useAuth();
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkVendorStatus = async () => {
      if (!user?.token || (user?.role || '').toLowerCase() !== 'vendor') {
        if (isMounted) {
          setIsApproved(false);
          setIsCheckingStatus(false);
        }
        return;
      }

      setIsCheckingStatus(true);
      try {
        const verificationStatus = await getVendorVerificationStatusApi(user.token);
        const statusCode = parseVerificationStatus(verificationStatus?.status);
        if (isMounted) {
          setIsApproved(statusCode === 2);
        }
      } catch {
        if (isMounted) {
          setIsApproved(false);
        }
      } finally {
        if (isMounted) {
          setIsCheckingStatus(false);
        }
      }
    };

    checkVendorStatus();

    return () => {
      isMounted = false;
    };
  }, [user?.role, user?.token]);

  if (isCheckingStatus) {
    return null;
  }

  if (!isApproved) {
    return <Navigate to="/vendor-verification" replace />;
  }

  return <Outlet />;
}

function PublicOnlyRoute({ children }) {
  const { user, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return null;
  }

  if (user?.isAuthenticated && user?.token) {
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    if (isSafeInternalRedirectPath(redirect)) {
      return <Navigate to={redirect} replace />;
    }
    return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route
          path="/"
          element={
            <PublicOnlyRoute>
              <LandingPage />
            </PublicOnlyRoute>
          }
        />
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
        <Route path="/payment-success" element={<Navigate to="/client/payments?payment_result=success" replace />} />
        <Route path="/payment-failure" element={<Navigate to="/client/payments?payment_result=failure" replace />} />

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
              <Route path="user-profile" element={<UserProfileClient />} />
              <Route path="profile" element={<UserProfileClient />} />
            </Route>
          </Route>

          <Route element={<RequireRole allowedRoles={['vendor']} />}>
            <Route element={<RequireVendorApproval />}>
              <Route path="/vendor">
                <Route path="dashboard" element={<VendorDashboard />} />
                <Route path="available-requests" element={<AvailableRequests />} />
                <Route path="my-proposals" element={<VendorMyProposals />} />
                <Route path="active-requests" element={<VendorActiveRequests />} />
                <Route path="completed" element={<Completed />} />
                <Route path="payments" element={<VendorPayments />} />
                <Route path="analytics" element={<VendorAnalytics />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="chat" element={<Chat />} />
                <Route path="profile" element={<UserProfile />} />
              </Route>
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
