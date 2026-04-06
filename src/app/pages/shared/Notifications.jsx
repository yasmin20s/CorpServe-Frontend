import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { DollarSign, AlertCircle, MessageSquare, CheckCheck, FileCheck, Bell } from 'lucide-react';
import { useDashboardMenu } from '../../hooks/useDashboardMenu';
import { useRoleFromPath } from '../../hooks/useRoleFromPath';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../../lib/toast';
import { getMyNotificationsApi, getUnreadNotificationCountApi, markNotificationReadApi, markAllNotificationsReadApi } from '../../services/notificationsApi';
import { useSignalREvent } from '../../context/SignalRContext';

const ITEMS_PER_PAGE = 10;

const iconByType = {
  Info: { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-100' },
  Success: { icon: CheckCheck, color: 'text-green-600', bg: 'bg-green-100' },
  Warning: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100' },
  Error: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
};

function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
}

export default function Notifications() {
  const role = useRoleFromPath();
  const menuItems = useDashboardMenu(role);
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const loadNotifications = useCallback(async () => {
    if (!user?.token) return;
    setIsLoading(true);
    try {
      const [notifResult, countResult] = await Promise.all([
        getMyNotificationsApi({ token: user.token, pageIndex: currentPage, pageSize: ITEMS_PER_PAGE }),
        getUnreadNotificationCountApi({ token: user.token }),
      ]);
      const items = Array.isArray(notifResult?.data) ? notifResult.data : [];
      setNotifications(items);
      setTotalCount(notifResult?.count || 0);
      setUnreadCount(typeof countResult === 'number' ? countResult : (countResult?.data ?? 0));
    } catch (error) {
      toast.error(error.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user?.token, currentPage]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useSignalREvent(null, useCallback((notification) => {
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  }, []));

  const handleMarkRead = async (notificationId) => {
    if (!user?.token) return;
    try {
      await markNotificationReadApi({ notificationId, token: user.token });
      setNotifications((prev) => prev.map((n) => n.id === notificationId ? { ...n, isRead: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error(error.message || 'Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.token) return;
    try {
      await markAllNotificationsReadApi({ token: user.token });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(error.message || 'Failed to mark all as read');
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  return (
    <DashboardLayout menuItems={menuItems} userRole={role}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">Stay updated with all your activities ({unreadCount} unread)</p>
          </div>
          <Button variant="outline" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
            Mark All as Read
          </Button>
        </div>

        {isLoading && (
          <Card className="bg-white">
            <CardContent className="p-8 text-center">
              <p className="text-lg font-semibold text-slate-800">Loading notifications...</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {!isLoading && notifications.length === 0 && (
            <Card className="bg-white">
              <CardContent className="p-8 text-center">
                <Bell className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                <p className="font-medium text-slate-700">No notifications yet</p>
                <p className="text-sm text-slate-500">You'll see updates about your requests, proposals, and SLA here.</p>
              </CardContent>
            </Card>
          )}
          {notifications.map((notification) => {
            const typeInfo = iconByType[notification.type] || iconByType.Info;
            const Icon = typeInfo.icon;
            return (
              <Card
                key={notification.id}
                className={notification.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200 cursor-pointer'}
                onClick={() => !notification.isRead && handleMarkRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg ${typeInfo.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${typeInfo.color}`}/>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        {!notification.isRead && (<Badge className="bg-blue-600 text-white">New</Badge>)}
                      </div>
                      <p className="text-gray-600 mb-2">{notification.message}</p>
                      <p className="text-sm text-gray-500">{formatTime(notification.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {totalCount > ITEMS_PER_PAGE && (
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">Page {safeCurrentPage} of {totalPages}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safeCurrentPage === 1}>Previous</Button>
              <Button size="sm" variant="outline" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safeCurrentPage === totalPages}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
