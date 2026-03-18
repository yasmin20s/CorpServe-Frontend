import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { LayoutDashboard, PlusCircle, FileStack, Activity, Wallet, DollarSign, CreditCard, Star } from 'lucide-react';
import { toast } from '../../lib/toast';
const menuItems = [
    { label: 'Dashboard', path: '/client/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Create Request', path: '/client/create-request', icon: <PlusCircle className="w-5 h-5"/> },
    { label: 'My Requests', path: '/client/my-requests', icon: <FileStack className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/client/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Payments', path: '/client/payments', icon: <Wallet className="w-5 h-5"/> },
];
const pendingPayments = [
    {
        id: '1',
        requestTitle: 'Office Cleaning Service',
        vendor: 'CleanCo Services',
        amount: 2800,
        commission: 196,
        total: 2996,
        completedDate: '2026-03-01',
    },
];
const transactions = [
    { id: '1', date: '2026-02-28', request: 'Website Redesign', vendor: 'Creative Studio', amount: 11200, commission: 784, status: 'Completed' },
    { id: '2', date: '2026-02-15', request: 'SEO Optimization', vendor: 'Digital Marketing Pro', amount: 4500, commission: 315, status: 'Completed' },
    { id: '3', date: '2026-01-30', request: 'Logo Design', vendor: 'Brand Masters', amount: 1500, commission: 105, status: 'Completed' },
    { id: '4', date: '2026-01-20', request: 'Content Writing', vendor: 'WordSmith Co', amount: 800, commission: 56, status: 'Completed' },
];
export default function Payments() {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [showRatingDialog, setShowRatingDialog] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const totalSpent = transactions.reduce((sum, t) => sum + t.amount + t.commission, 0);
    const handlePayment = (payment) => {
        setSelectedPayment(payment);
        setShowRatingDialog(true);
    };
    const submitRating = () => {
        toast.success('Payment processed and rating submitted!');
        setShowRatingDialog(false);
        setRating(0);
        setFeedback('');
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
                  <p className="text-3xl font-bold text-gray-900">${totalSpent.toLocaleString()}</p>
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
                    ${pendingPayments.reduce((sum, p) => sum + p.total, 0).toLocaleString()}
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
                  <p className="text-3xl font-bold text-gray-900">{transactions.length}</p>
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

              {pendingPayments.map((payment) => (<Card key={payment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{payment.requestTitle}</h4>
                        <p className="text-sm text-gray-600">Vendor: {payment.vendor}</p>
                        <p className="text-sm text-gray-600">Completed: {payment.completedDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Service: ${payment.amount}</p>
                        <p className="text-sm text-gray-600">Commission (7%): ${payment.commission}</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">${payment.total}</p>
                        <Button onClick={() => handlePayment(payment)} className="mt-2">
                          Pay Now
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
                  {transactions.map((transaction) => (<tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{transaction.date}</td>
                      <td className="py-3 px-4 text-sm font-medium">{transaction.request}</td>
                      <td className="py-3 px-4 text-sm">{transaction.vendor}</td>
                      <td className="py-3 px-4 text-sm text-right">${transaction.amount}</td>
                      <td className="py-3 px-4 text-sm text-right">${transaction.commission}</td>
                      <td className="py-3 px-4 text-sm text-right font-medium">
                        ${transaction.amount + transaction.commission}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className="bg-green-100 text-green-700">{transaction.status}</Badge>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Rating Dialog */}
        <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Payment & Rate Service</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-2xl font-bold">${selectedPayment?.total}</p>
                <p className="text-xs text-gray-500 mt-1">
                  (Service: ${selectedPayment?.amount} + Commission: ${selectedPayment?.commission})
                </p>
              </div>

              <div className="space-y-2">
                <Label>Rate this service</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (<button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none">
                      <Star className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}/>
                    </button>))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Feedback (Optional)</Label>
                <Textarea placeholder="Share your experience with this vendor..." rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)}/>
              </div>

              <Button onClick={submitRating} className="w-full" disabled={rating === 0}>
                Complete Payment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>);
}

