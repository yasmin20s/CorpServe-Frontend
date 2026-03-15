import { Navigate, Route, Routes } from 'react-router';

import ActiveRequests from '../pages/client/ActiveRequests';
import ClientDashboard from '../pages/client/ClientDashboard';
import CreateRequest from '../pages/client/CreateRequest';
import MyRequests from '../pages/client/MyRequests';
import Payments from '../pages/client/Payments';
import Proposals from '../pages/client/Proposals';

import AdminAnalytics from '../pages/admin/AdminAnalytics';
import AdminDashboard from '../pages/admin/AdminDashboard';
import Categories from '../pages/admin/Categories';
import PaymentsMonitor from '../pages/admin/PaymentsMonitor';
import RequestsMonitor from '../pages/admin/RequestsMonitor';
import SLAMonitor from '../pages/admin/SLAMonitor';
import UsersManagement from '../pages/admin/UsersManagement';
import VendorApprovals from '../pages/admin/VendorApprovals';

import ForgotPassword from '../pages/auth/ForgotPassword';
import Login from '../pages/auth/Login';
import ResetPassword from '../pages/auth/ResetPassword';
import Signup from '../pages/auth/Signup';
import VendorVerification from '../pages/auth/VendorVerification';

import UserProfile from '../pages/profile/UserProfile';
import LandingPage from '../pages/public/LandingPage';
import Chat from '../pages/shared/Chat';
import Notifications from '../pages/shared/Notifications';

import AvailableRequests from '../pages/vendor/AvailableRequests';
import Completed from '../pages/vendor/Completed';
import VendorActiveRequests from '../pages/vendor/VendorActiveRequests';
import VendorAnalytics from '../pages/vendor/VendorAnalytics';
import VendorDashboard from '../pages/vendor/VendorDashboard';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/vendor-verification" element={<VendorVerification />} />

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

      <Route path="/admin">
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="vendor-approvals" element={<VendorApprovals />} />
        <Route path="users" element={<UsersManagement />} />
        <Route path="categories" element={<Categories />} />
        <Route path="requests-monitor" element={<RequestsMonitor />} />
        <Route path="sla-monitor" element={<SLAMonitor />} />
        <Route path="payments-monitor" element={<PaymentsMonitor />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
