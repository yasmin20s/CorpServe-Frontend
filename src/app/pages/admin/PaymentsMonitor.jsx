import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import StatsCard from '../../components/StatsCard';
import { Badge } from '../../components/ui/badge';
import { LayoutDashboard, Users, Briefcase, FileText, DollarSign, TrendingUp, UserCheck } from 'lucide-react';
const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Vendor Approvals', path: '/admin/vendor-approvals', icon: <UserCheck className="w-5 h-5"/> },
    { label: 'Users', path: '/admin/users', icon: <Users className="w-5 h-5"/> },
    { label: 'Categories', path: '/admin/categories', icon: <Briefcase className="w-5 h-5"/> },
    { label: 'Requests Monitor', path: '/admin/requests-monitor', icon: <FileText className="w-5 h-5"/> },
    { label: 'SLA Monitor', path: '/admin/sla-monitor', icon: <FileText className="w-5 h-5"/> },
    { label: 'Payments Monitor', path: '/admin/payments-monitor', icon: <DollarSign className="w-5 h-5"/> },
    { label: 'Analytics', path: '/admin/analytics', icon: <TrendingUp className="w-5 h-5"/> },
];
const payments = [
    { id: '1', date: '2026-03-01', request: 'Office Cleaning', client: 'Acme Corp', vendor: 'CleanCo', amount: 2800, commission: 196, status: 'completed' },
    { id: '2', date: '2026-02-28', request: 'Website Redesign', client: 'StartupXYZ', vendor: 'Creative Studio', amount: 11200, commission: 784, status: 'completed' },
    { id: '3', date: '2026-02-25', request: 'IT Support', client: 'BizCo', vendor: 'TechPro', amount: 5400, commission: 378, status: 'pending' },
];
export default function PaymentsMonitor() {
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalCommission = payments.reduce((sum, p) => sum + p.commission, 0);
    return (<DashboardLayout menuItems={menuItems} userRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payments Monitor</h1>
          <p className="text-gray-600">Track all payments and commission earnings</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <StatsCard title="Total Revenue" value={`EGP ${totalRevenue.toLocaleString()}`} icon={DollarSign} iconColor="text-green-600" iconBgColor="bg-green-100"/>
          <StatsCard title="Total Commission" value={`EGP ${totalCommission.toLocaleString()}`} icon={TrendingUp} iconColor="text-blue-600" iconBgColor="bg-blue-100"/>
          <StatsCard title="Transactions" value={payments.length} icon={FileText} iconColor="text-purple-600" iconBgColor="bg-purple-100"/>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Request</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Vendor</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Commission (7%)</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (<tr key={payment.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm">{payment.date}</td>
                      <td className="py-3 px-4 text-sm font-medium">{payment.request}</td>
                      <td className="py-3 px-4 text-sm">{payment.client}</td>
                      <td className="py-3 px-4 text-sm">{payment.vendor}</td>
                      <td className="py-3 px-4 text-sm text-right">EGP {payment.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-blue-600">EGP {payment.commission.toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={payment.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                          {payment.status}
                        </Badge>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>);
}
