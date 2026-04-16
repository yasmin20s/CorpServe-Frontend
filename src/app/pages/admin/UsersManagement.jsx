import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  DollarSign,
  TrendingUp,
  UserCheck,
  Search,
  Ban,
  UserRound,
  Building2,
  Sparkles,
  CalendarClock,
  ShieldCheck,
  UserX,
  Activity,
  Filter,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import { useAuth } from '../../hooks/useAuth';
import { activateAdminUserApi, getAdminUsersApi, suspendAdminUserApi } from '../../services/adminMonitorApi';
import { UserAvatarIconOnly } from '../../components/UserAvatar';

const menuItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Vendor Approvals', path: '/admin/vendor-approvals', icon: <UserCheck className="w-5 h-5" /> },
  { label: 'Users', path: '/admin/users', icon: <Users className="w-5 h-5" /> },
  { label: 'Categories', path: '/admin/categories', icon: <Briefcase className="w-5 h-5" /> },
  { label: 'Requests Monitor', path: '/admin/requests-monitor', icon: <FileText className="w-5 h-5" /> },
  { label: 'SLA Monitor', path: '/admin/sla-monitor', icon: <FileText className="w-5 h-5" /> },
  { label: 'Payments Monitor', path: '/admin/payments-monitor', icon: <DollarSign className="w-5 h-5" /> },
  { label: 'Analytics', path: '/admin/analytics', icon: <TrendingUp className="w-5 h-5" /> },
];

const ROLE_META = {
  client: {
    label: 'Client',
    icon: UserRound,
    badgeClass: 'border border-sky-200 bg-sky-50 text-sky-700',
    iconWrapClass: 'border-sky-200 bg-sky-100 text-sky-700',
  },
  vendor: {
    label: 'Vendor',
    icon: Building2,
    badgeClass: 'border border-indigo-200 bg-indigo-50 text-indigo-700',
    iconWrapClass: 'border-indigo-200 bg-indigo-100 text-indigo-700',
  },
};

const STATUS_META = {
  active: {
    label: 'Active',
    badgeClass: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
    dotClass: 'bg-emerald-500',
  },
  suspended: {
    label: 'Suspended',
    badgeClass: 'border border-rose-200 bg-rose-50 text-rose-700',
    dotClass: 'bg-rose-500',
  },
};

function formatDate(dateValue) {
  return new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

const USERS_PER_PAGE = 5;

export default function UsersManagement() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [usersPage, setUsersPage] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    clients: 0,
    vendors: 0,
  });
  const [selectedRole, setSelectedRole] = useState(() => searchParams.get('role') || 'all');
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || '');
  const [currentPage, setCurrentPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1));
  const [isLoading, setIsLoading] = useState(true);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);

  useEffect(() => {
    const next = new URLSearchParams();
    if (currentPage > 1) next.set('page', String(currentPage));
    if (searchTerm.trim()) next.set('q', searchTerm.trim());
    if (selectedRole !== 'all') next.set('role', selectedRole);
    setSearchParams(next, { replace: true });
  }, [currentPage, searchTerm, selectedRole, setSearchParams]);

  const loadUsers = useCallback(async () => {
    if (!user?.token) return;
    setIsLoading(true);
    try {
      const roleParam = selectedRole === 'all' ? undefined : selectedRole;
      const result = await getAdminUsersApi({
        token: user.token,
        pageIndex: currentPage,
        pageSize: USERS_PER_PAGE,
        role: roleParam,
        search: searchTerm,
      });
      setTotalCount(result.count);
      setSummary({
        total: result.summary?.totalUsers ?? result.count,
        active: result.summary?.activeCount ?? 0,
        suspended: result.summary?.suspendedCount ?? 0,
        clients: result.summary?.clientsCount ?? 0,
        vendors: result.summary?.vendorsCount ?? 0,
      });
      setUsersPage(
        result.data.map((u) => ({
          id: u.userId,
          name: u.fullName,
          email: u.email,
          role: u.role,
          status: u.status,
          joinedDate: u.joined,
          requests: u.role === 'client' ? u.requestsCreatedCount : u.requestsHandledCount,
          profilePictureUrl: u.profilePictureUrl,
        })),
      );
    } catch (error) {
      toast.error(error.message || 'Failed to load users');
      setUsersPage([]);
      setTotalCount(0);
      setSummary({ total: 0, active: 0, suspended: 0, clients: 0, vendors: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [user?.token, currentPage, searchTerm, selectedRole]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const totalPages = Math.max(1, Math.ceil(totalCount / USERS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleStatusToggleClick = (u) => {
    setPendingStatusChange({
      user: u,
      nextStatus: u.status === 'suspended' ? 'active' : 'suspended',
    });
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingStatusChange || !user?.token) return;
    const { user: targetUser, nextStatus } = pendingStatusChange;
    try {
      if (nextStatus === 'suspended') {
        await suspendAdminUserApi({ token: user.token, userId: targetUser.id });
        toast.success(`${targetUser.name} suspended`);
      } else {
        await activateAdminUserApi({ token: user.token, userId: targetUser.id });
        toast.success(`${targetUser.name} unsuspended`);
      }
      setPendingStatusChange(null);
      await loadUsers();
    } catch (error) {
      toast.error(error.message || 'Failed to update user status');
    }
  };

  return (
    <DashboardLayout menuItems={menuItems} userRole="admin">
      <div className="space-y-6">
        <Card className="group relative overflow-hidden border-indigo-300/80 bg-gradient-to-br from-indigo-100 via-blue-50 to-violet-100 shadow-[0_18px_45px_rgba(79,70,229,0.16)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_30px_60px_rgba(79,70,229,0.25)]">
          <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:linear-gradient(to_right,rgba(79,70,229,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(79,70,229,0.1)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-violet-500" />
          <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-indigo-300/35 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-10 h-36 w-36 rounded-full bg-cyan-200/35 blur-3xl" />
          <CardContent className="relative p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Admin Control Room
                </p>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  Users <span className="bg-gradient-to-r from-indigo-700 to-violet-700 bg-clip-text text-transparent">Management</span>
                </h1>
                <p className="mt-1 text-sm text-indigo-900/80 sm:text-base">Creative, high-contrast oversight for all platform users.</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {summary.active} Active
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-rose-700">
                    <UserX className="h-3.5 w-3.5" />
                    {summary.suspended} Suspended
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <div className="flex items-center gap-2 rounded-2xl border border-indigo-200 bg-white/85 px-3 py-2 text-xs font-semibold text-indigo-700 shadow-sm transition-all duration-300 group-hover:translate-x-0.5">
                  <Activity className="h-4 w-4 animate-pulse" />
                  <span>Live Directory</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-indigo-200 bg-white/85 px-3 py-2 text-xs font-semibold text-indigo-700 shadow-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>Policy Guard Enabled</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-white/85 px-2.5 py-2 shadow-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600">
                    <UserRound className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600">
                    <Building2 className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card className="group relative overflow-hidden border-indigo-200 bg-white/90 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo-600">Total</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{summary.total}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-indigo-500">Directory visibility</p>
                </div>
                <span className="rounded-xl border border-indigo-200 bg-indigo-50 p-2 text-indigo-700 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                  <Users className="h-4 w-4" />
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="group relative overflow-hidden border-emerald-200 bg-emerald-50/60 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Active</p>
                  <p className="mt-1 text-2xl font-black text-emerald-900">{summary.active}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-emerald-700">Healthy accounts</p>
                  <p className="mt-1 text-[10px] font-normal normal-case tracking-normal text-emerald-600/90">Whole platform data</p>
                </div>
                <span className="rounded-xl border border-emerald-200 bg-white/80 p-2 text-emerald-700 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                  <ShieldCheck className="h-4 w-4" />
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="group relative overflow-hidden border-rose-200 bg-rose-50/60 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 to-red-500" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-rose-700">Suspended</p>
                  <p className="mt-1 text-2xl font-black text-rose-900">{summary.suspended}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-rose-700">Needs review</p>
                  <p className="mt-1 text-[10px] font-normal normal-case tracking-normal text-rose-600/90">Whole platform data</p>
                </div>
                <span className="rounded-xl border border-rose-200 bg-white/80 p-2 text-rose-700 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                  <UserX className="h-4 w-4" />
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="group relative overflow-hidden border-sky-200 bg-sky-50/60 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 to-cyan-500" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-sky-700">Role Split</p>
                  <p className="mt-1 text-sm font-bold text-sky-900">{summary.clients} Clients / {summary.vendors} Vendors</p>
                  <p className="mt-0.5 text-[11px] font-medium text-sky-700">Balance indicator</p>
                  <p className="mt-1 text-[10px] font-normal normal-case tracking-normal text-sky-600/90">Whole platform data</p>
                </div>
                <span className="rounded-xl border border-sky-200 bg-white/80 p-2 text-sky-700 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                  <Filter className="h-4 w-4" />
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-indigo-200 bg-white/90 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="grid gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-indigo-400" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name or email..."
                  className="h-11 border-indigo-200 bg-indigo-50/30 pl-10 text-slate-800 placeholder:text-slate-400 focus-visible:border-indigo-300"
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {[
                { key: 'all', label: 'All Users', icon: Users },
                { key: 'client', label: 'Clients', icon: UserRound },
                { key: 'vendor', label: 'Vendors', icon: Building2 },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = selectedRole === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedRole(item.key)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
                      isActive
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-[0_8px_18px_rgba(79,70,229,0.35)]'
                        : 'border-indigo-200 bg-white text-indigo-700 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                    {selectedRole === item.key ? (
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                        {totalCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <p className="text-sm font-medium text-indigo-700">Loading users…</p>
        ) : null}

        <div className="space-y-2 text-xs font-semibold uppercase tracking-[0.1em] text-indigo-600 md:hidden">
          <span>Page {currentPage} of {totalPages} · {USERS_PER_PAGE} users per page</span>
        </div>

        <div className="md:hidden space-y-3">
          {usersPage.map((user) => {
            const role = ROLE_META[user.role];
            const status = STATUS_META[user.status];

            return (
              <Card key={user.id} className="group relative overflow-hidden border-indigo-200 bg-white/95 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-violet-500" />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <UserAvatarIconOnly
                        userId={user.id}
                        name={user.name}
                        profilePictureUrl={user.profilePictureUrl}
                        size="md"
                        className="shrink-0 ring-2 ring-white"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
                        <p className="truncate text-xs text-slate-600">{user.email}</p>
                      </div>
                    </div>
                    <Badge className={role.badgeClass}>{role.label}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5 text-indigo-500" />
                      {formatDate(user.joinedDate)}
                    </span>
                    <Badge className={status.badgeClass}>
                      <span className={`mr-1.5 h-2 w-2 rounded-full ${status.dotClass}`} />
                      {status.label}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Requests: <span className="text-slate-900">{user.requests}</span></p>
                    <Button
                      size="sm"
                      variant="outline"
                      className={`h-8 gap-1.5 ${user.status === 'suspended' ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'border-rose-200 text-rose-700 hover:bg-rose-50'}`}
                      onClick={() => handleStatusToggleClick(user)}
                    >
                      {user.status === 'suspended' ? <ShieldCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                      {user.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {!isLoading && usersPage.length === 0 && (
            <Card className="border-dashed border-indigo-300 bg-indigo-50/50">
              <CardContent className="p-6 text-center">
                <p className="text-sm font-medium text-indigo-700">No users match your search/filter.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="hidden md:block border-indigo-200 bg-white/95 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-indigo-100 bg-indigo-50/60">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.08em] text-indigo-700">User</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.08em] text-indigo-700">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.08em] text-indigo-700">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.08em] text-indigo-700">Joined</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-[0.08em] text-indigo-700">Requests</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-[0.08em] text-indigo-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersPage.map((user) => {
                    const role = ROLE_META[user.role];
                    const status = STATUS_META[user.status];

                    return (
                      <tr key={user.id} className="group border-b border-indigo-100/70 transition-colors hover:bg-indigo-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <UserAvatarIconOnly
                              userId={user.id}
                              name={user.name}
                              profilePictureUrl={user.profilePictureUrl}
                              size="md"
                              className="shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
                              <p className="truncate text-xs text-slate-600">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={role.badgeClass}>{role.label}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={status.badgeClass}>
                            <span className={`mr-1.5 h-2 w-2 rounded-full ${status.dotClass}`} />
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">{formatDate(user.joinedDate)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">
                            <Activity className="h-3 w-3" />
                            {user.requests}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className={`h-8 gap-1.5 ${user.status === 'suspended' ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'border-rose-200 text-rose-700 hover:bg-rose-50'}`}
                            onClick={() => handleStatusToggleClick(user)}
                          >
                            {user.status === 'suspended' ? <ShieldCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                            {user.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {!isLoading && usersPage.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm font-medium text-indigo-700">
                        No users match your search/filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {!isLoading && totalCount > 0 && (
          <Card className="border-indigo-200 bg-white/90 shadow-sm">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-indigo-700">
                Showing {(currentPage - 1) * USERS_PER_PAGE + 1}-{Math.min(currentPage * USERS_PER_PAGE, totalCount)} of {totalCount}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  Previous
                </Button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <Button
                    key={page}
                    type="button"
                    size="sm"
                    variant={page === currentPage ? 'default' : 'outline'}
                    className={page === currentPage
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'}
                    onClick={() => setCurrentPage(page)}
                    disabled={isLoading}
                  >
                    {page}
                  </Button>
                ))}

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || isLoading}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <AlertDialog open={Boolean(pendingStatusChange)} onOpenChange={(open) => !open && setPendingStatusChange(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{pendingStatusChange?.nextStatus === 'active' ? 'Confirm unsuspend' : 'Confirm suspension'}</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingStatusChange
                  ? (pendingStatusChange.nextStatus === 'active'
                    ? `Are you sure you want to unsuspend ${pendingStatusChange.user.name} (${pendingStatusChange.user.email}) and restore active status?`
                    : `Are you sure you want to suspend ${pendingStatusChange.user.name} (${pendingStatusChange.user.email})?`)
                  : 'Are you sure you want to change this user status?'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmStatusChange}
                className={pendingStatusChange?.nextStatus === 'active'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500'
                  : 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500'}
              >
                {pendingStatusChange?.nextStatus === 'active' ? 'Unsuspend user' : 'Suspend user'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}

