import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { DollarSign, AlertCircle, MessageSquare, CheckCheck, FileCheck } from 'lucide-react';
import { useDashboardMenu } from '../../hooks/useDashboardMenu';
import { useRoleFromPath } from '../../hooks/useRoleFromPath';

export default function Notifications() {
  const role = useRoleFromPath();
  const menuItems = useDashboardMenu(role);
    const notifications = [
        {
            id: '1',
            type: 'sla',
            title: 'SLA Created',
            message: 'SLA agreement has been created for "IT Infrastructure Setup"',
            time: '2 hours ago',
            read: false,
            icon: FileCheck,
            iconColor: 'text-blue-600',
            iconBg: 'bg-blue-100',
        },
        {
            id: '2',
            type: 'proposal',
            title: 'New Proposal Received',
            message: 'You received a new proposal for "Security System Installation"',
            time: '5 hours ago',
            read: false,
            icon: MessageSquare,
            iconColor: 'text-green-600',
            iconBg: 'bg-green-100',
        },
        {
            id: '3',
            type: 'payment',
            title: 'Payment Due',
            message: 'Payment of $2,996 is pending for completed service',
            time: '1 day ago',
            read: false,
            icon: DollarSign,
            iconColor: 'text-orange-600',
            iconBg: 'bg-orange-100',
        },
        {
            id: '4',
            type: 'warning',
            title: 'Deadline Warning',
            message: 'Project "Marketing Campaign" deadline is approaching in 5 days',
            time: '1 day ago',
            read: true,
            icon: AlertCircle,
            iconColor: 'text-red-600',
            iconBg: 'bg-red-100',
        },
        {
            id: '5',
            type: 'approval',
            title: 'Vendor Approved',
            message: 'Your vendor account has been approved by admin',
            time: '2 days ago',
            read: true,
            icon: CheckCheck,
            iconColor: 'text-purple-600',
            iconBg: 'bg-purple-100',
        },
    ];
    return (<DashboardLayout menuItems={menuItems} userRole={role}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">Stay updated with all your activities</p>
          </div>
          <Button variant="outline">Mark All as Read</Button>
        </div>

        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = notification.icon;
            return (<Card key={notification.id} className={notification.read ? 'bg-white' : 'bg-blue-50 border-blue-200'}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg ${notification.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${notification.iconColor}`}/>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        {!notification.read && (<Badge className="bg-blue-600 text-white">New</Badge>)}
                      </div>
                      <p className="text-gray-600 mb-2">{notification.message}</p>
                      <p className="text-sm text-gray-500">{notification.time}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>);
        })}
        </div>
      </div>
    </DashboardLayout>);
}
