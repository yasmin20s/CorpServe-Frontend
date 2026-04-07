import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { LayoutDashboard, Briefcase, Activity, CheckCircle, TrendingUp, Wallet } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getVendorReceivablesApi } from '../../services/paymentsApi';
import { toast } from '../../lib/toast';
import { useSignalREvent } from '../../context/SignalRContext';

const menuItems = [
  { label: 'Dashboard', path: '/vendor/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Available Requests', path: '/vendor/available-requests', icon: <Briefcase className="w-5 h-5" /> },
  { label: 'Active Requests', path: '/vendor/active-requests', icon: <Activity className="w-5 h-5" /> },
  { label: 'Completed', path: '/vendor/completed', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'Payments', path: '/vendor/payments', icon: <Wallet className="w-5 h-5" /> },
  { label: 'Analytics', path: '/vendor/analytics', icon: <TrendingUp className="w-5 h-5" /> },
];

export default function VendorPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user?.token) return;
      try {
        const result = await getVendorReceivablesApi({ token: user.token });
        if (mounted) setPayments(result);
      } catch (error) {
        toast.error(error.message || 'Failed to load vendor payments');
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user?.token]);

  useSignalREvent(['Vendor payout available', 'Payment completed'], () => {
    if (user?.token) {
      getVendorReceivablesApi({ token: user.token })
        .then(setPayments)
        .catch(() => {});
    }
  });

  const totalReceivable = useMemo(
    () =>
      payments
        .filter((p) => (p.paymentStatus || '').toLowerCase() === 'completed')
        .reduce((sum, p) => sum + Number(p.vendorNetAmount || 0), 0),
    [payments],
  );

  return (
    <DashboardLayout menuItems={menuItems} userRole="vendor">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Payments</h1>
          <p className="text-gray-600">Track your receivables and settlement status.</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-1">Total Receivable (Net)</p>
            <p className="text-3xl font-bold text-gray-900">EGP {totalReceivable.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receivables History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Request</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Gross</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Commission</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Your Net</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Payout Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.paymentId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '-'}</td>
                      <td className="py-3 px-4 text-sm font-medium">{payment.requestTitle || `Request ${payment.requestId}`}</td>
                      <td className="py-3 px-4 text-sm text-right">EGP {Number(payment.amount || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-right">EGP {Number(payment.commision || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-right font-semibold">EGP {Number(payment.vendorNetAmount || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={(payment.payoutStatus || '').toLowerCase() === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                          {payment.payoutStatus || 'NotStarted'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
