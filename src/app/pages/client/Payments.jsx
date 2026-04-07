import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { LayoutDashboard, PlusCircle, FileStack, Activity, Wallet, DollarSign, CreditCard } from 'lucide-react';
import { toast } from '../../lib/toast';
import { useAuth } from '../../hooks/useAuth';
import { getMyPaymentHistoryApi, getMyPendingPaymentsApi, startCheckoutApi } from '../../services/paymentsApi';
const menuItems = [
    { label: 'Dashboard', path: '/client/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Create Request', path: '/client/create-request', icon: <PlusCircle className="w-5 h-5"/> },
    { label: 'My Requests', path: '/client/my-requests', icon: <FileStack className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/client/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Payments', path: '/client/payments', icon: <Wallet className="w-5 h-5"/> },
];
export default function Payments() {
    const { user } = useAuth();
    const [pendingPayments, setPendingPayments] = useState([]);
    const [historyPayments, setHistoryPayments] = useState([]);
    const [loadingId, setLoadingId] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const loadPayments = async () => {
      if (!user?.token) return;
      setIsLoading(true);
      try {
        const [pending, history] = await Promise.all([
          getMyPendingPaymentsApi({ token: user.token }),
          getMyPaymentHistoryApi({ token: user.token }),
        ]);
        setPendingPayments(pending);
        setHistoryPayments(history);
      } catch (error) {
        toast.error(error.message || 'Failed to load payments');
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
      loadPayments();
    }, [user?.token]);

    const totalSpent = useMemo(
      () =>
        historyPayments
          .filter((item) => (item.paymentStatus || '').toLowerCase() === 'completed')
          .reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
      [historyPayments],
    );

    const handlePayment = async (payment) => {
      if (!user?.token) return;
      setLoadingId(payment.requestId);
      try {
        const checkout = await startCheckoutApi({ requestId: payment.requestId, token: user.token });
        if (!checkout.checkoutUrl) {
          toast.error('Checkout URL was not returned from backend.');
          return;
        }
        window.location.assign(checkout.checkoutUrl);
      } catch (error) {
        toast.error(error.message || 'Failed to start checkout');
      } finally {
        setLoadingId('');
      }
    };
    return (<DashboardLayout menuItems={menuItems} userRole="client">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payments</h1>
          <p className="text-gray-600">Manage your payments and transaction history</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                  <p className="text-3xl font-bold text-gray-900">EGP {totalSpent.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600"/>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Payments</p>
                  <p className="text-3xl font-bold text-red-600">
                    EGP {pendingPayments.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-red-600"/>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Transactions</p>
                  <p className="text-3xl font-bold text-gray-900">{historyPayments.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-green-600"/>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Payments */}
        {pendingPayments.length > 0 && (<Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">Pending Payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-900">
                  ⚠️ You have pending payments. Please complete payment to create new requests.
                </p>
              </div>

              {pendingPayments.map((payment) => (<Card key={payment.paymentId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{payment.requestTitle || `Request ${payment.requestId}`}</h4>
                        <p className="text-sm text-gray-600">Merchant Ref: {payment.merchantOrderId}</p>
                        <p className="text-sm text-gray-600">Created: {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '-'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Service: EGP {Number(payment.amount || 0).toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Commission (7%): EGP {Number(payment.commision || 0).toLocaleString()}</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">EGP {Number(payment.totalAmount || 0).toLocaleString()}</p>
                        <Button onClick={() => handlePayment(payment)} className="mt-2" disabled={loadingId === payment.requestId}>
                          {loadingId === payment.requestId ? 'Redirecting...' : 'Pay Now'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>))}
            </CardContent>
          </Card>)}

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Request</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Vendor</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Commission</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Total</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyPayments.map((transaction) => (<tr key={transaction.paymentId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : '-'}</td>
                      <td className="py-3 px-4 text-sm font-medium">{transaction.requestTitle || `Request ${transaction.requestId}`}</td>
                      <td className="py-3 px-4 text-sm">{transaction.payoutStatus}</td>
                      <td className="py-3 px-4 text-sm text-right">EGP {Number(transaction.amount || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-right">EGP {Number(transaction.commision || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-right font-medium">
                        EGP {Number(transaction.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={(transaction.paymentStatus || '').toLowerCase() === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                          {transaction.paymentStatus}
                        </Badge>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        {isLoading && <p className="text-sm text-gray-500">Loading payments...</p>}
      </div>
    </DashboardLayout>);
}

