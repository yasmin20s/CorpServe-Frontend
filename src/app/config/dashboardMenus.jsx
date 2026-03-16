import {
  Activity,
  Briefcase,
  CheckCircle,
  DollarSign,
  FileStack,
  FileText,
  LayoutDashboard,
  PlusCircle,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';

export const dashboardMenusByRole = {
  client: [
    { label: 'Dashboard', path: '/client/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Create Request', path: '/client/create-request', icon: <PlusCircle className="w-5 h-5" /> },
    { label: 'My Requests', path: '/client/my-requests', icon: <FileStack className="w-5 h-5" /> },
    { label: 'Active Requests', path: '/client/active-requests', icon: <Activity className="w-5 h-5" /> },
    { label: 'Payments', path: '/client/payments', icon: <Wallet className="w-5 h-5" /> },
  ],
  vendor: [
    { label: 'Dashboard', path: '/vendor/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Available Requests', path: '/vendor/available-requests', icon: <Briefcase className="w-5 h-5" /> },
    { label: 'Active Requests', path: '/vendor/active-requests', icon: <Activity className="w-5 h-5" /> },
    { label: 'Completed', path: '/vendor/completed', icon: <CheckCircle className="w-5 h-5" /> },
    { label: 'Analytics', path: '/vendor/analytics', icon: <TrendingUp className="w-5 h-5" /> },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Vendor Approvals', path: '/admin/vendor-approvals', icon: <UserCheck className="w-5 h-5" /> },
    { label: 'Users', path: '/admin/users', icon: <Users className="w-5 h-5" /> },
    { label: 'Categories', path: '/admin/categories', icon: <Briefcase className="w-5 h-5" /> },
    { label: 'Requests Monitor', path: '/admin/requests-monitor', icon: <FileText className="w-5 h-5" /> },
    { label: 'SLA Monitor', path: '/admin/sla-monitor', icon: <FileText className="w-5 h-5" /> },
    { label: 'Payments Monitor', path: '/admin/payments-monitor', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'Analytics', path: '/admin/analytics', icon: <TrendingUp className="w-5 h-5" /> },
  ],
};
