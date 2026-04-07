import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import StatsCard from '../../components/StatsCard';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { LayoutDashboard, Users, Briefcase, FileText, DollarSign, TrendingUp, UserCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getAdminPaymentsApi, markPayoutPaidApi } from '../../services/paymentsApi';
import { toast } from '../../lib/toast';
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
export default function PaymentsMonitor() {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loadingId, setLoadingId] = useState('');

    const loadPayments = async () => {
      if (!user?.token) return;
      try {
        const result = await getAdminPaymentsApi({ token: user.token });
        setPayments(result);
      } catch (error) {
        toast.error(error.message || 'Failed to load admin payments');
      }
    };

    useEffect(() => {
      loadPayments();
    }, [user?.token]);

    const totalRevenue = useMemo(
      () => payments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
      [payments],
    );
    const totalCommission = useMemo(
      () => payments.reduce((sum, p) => sum + Number(p.commision || 0), 0),
      [payments],
    );

    const handleMarkPaid = async (payment) => {
      if (!user?.token) return;
      setLoadingId(payment.paymentId);
      try {
        await markPayoutPaidApi({
          paymentId: payment.paymentId,
          payoutReference: `ADMIN_SETTLED_${Date.now()}`,
          token: user.token,
        });
        toast.success('Payout marked as paid.');
        await loadPayments();
      } catch (error) {
        toast.error(error.message || 'Failed to mark payout as paid');
      } finally {
        setLoadingId('');
      }
    };

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
                  {payments.map((payment) => (<tr key={payment.paymentId} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm">{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '-'}</td>
                      <td className="py-3 px-4 text-sm font-medium">{payment.requestTitle || `Request ${payment.requestId}`}</td>
                      <td className="py-3 px-4 text-sm">{payment.clientName || payment.clientId || '-'}</td>
                      <td className="py-3 px-4 text-sm">{payment.vendorName || payment.vendorId || '-'}</td>
                      <td className="py-3 px-4 text-sm text-right">EGP {Number(payment.amount || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-blue-600">EGP {Number(payment.commision || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Badge className={(payment.paymentStatus || '').toLowerCase() === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                            {payment.paymentStatus}
                          </Badge>
                          {(payment.paymentStatus || '').toLowerCase() === 'completed' && (payment.payoutStatus || '').toLowerCase() !== 'paid' && (
                            <Button size="sm" onClick={() => handleMarkPaid(payment)} disabled={loadingId === payment.paymentId}>
                              {loadingId === payment.paymentId ? 'Saving...' : 'Mark Payout Paid'}
                            </Button>
                          )}
                        </div>
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
