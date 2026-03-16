import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { LayoutDashboard, PlusCircle, FileStack, Activity, Wallet, FileText, MessageSquare, AlertCircle } from 'lucide-react';
const menuItems = [
    { label: 'Dashboard', path: '/client/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Create Request', path: '/client/create-request', icon: <PlusCircle className="w-5 h-5"/> },
    { label: 'My Requests', path: '/client/my-requests', icon: <FileStack className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/client/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Payments', path: '/client/payments', icon: <Wallet className="w-5 h-5"/> },
];
const activeRequests = [
    {
        id: '1',
        title: 'IT Infrastructure Setup',
        vendor: { name: 'TechPro Solutions', rating: 4.8, contact: 'contact@techpro.com' },
        budget: '$6,500',
        deadline: '2026-03-30',
        progress: 65,
        status: 'On Track',
        lastUpdate: 'Server installation completed. Network configuration in progress.',
        daysRemaining: 15,
    },
    {
        id: '2',
        title: 'Marketing Campaign Design',
        vendor: { name: 'Creative Agency', rating: 4.7, contact: 'hello@creative.com' },
        budget: '$12,000',
        deadline: '2026-04-10',
        progress: 40,
        status: 'At Risk',
        lastUpdate: 'Initial design concepts submitted for review.',
        daysRemaining: 25,
    },
];
export default function ActiveRequests() {
    return (<DashboardLayout menuItems={menuItems} userRole="client">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Active Requests</h1>
          <p className="text-gray-600">Track ongoing service requests and communicate with vendors</p>
        </div>

        <div className="space-y-4">
          {activeRequests.map((request) => (<Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{request.title}</h3>
                      <Badge className={request.status === 'On Track' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-2">Vendor: {request.vendor.name}</p>
                    <p className="text-sm text-gray-500">{request.lastUpdate}</p>
                  </div>
                  {request.status === 'At Risk' && (<div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-yellow-600"/>
                      <span className="text-sm text-yellow-700">Deadline Warning</span>
                    </div>)}
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Budget</p>
                    <p className="text-lg font-semibold">{request.budget}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Deadline</p>
                    <p className="text-lg font-semibold">{request.deadline}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Days Remaining</p>
                    <p className="text-lg font-semibold">{request.daysRemaining} days</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{request.progress}%</span>
                  </div>
                  <Progress value={request.progress} className="h-2"/>
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <FileText className="w-4 h-4"/>
                        View SLA
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Service Level Agreement</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm text-gray-600">Service</p>
                            <p className="font-medium">{request.title}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Vendor</p>
                            <p className="font-medium">{request.vendor.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Budget</p>
                            <p className="font-medium">{request.budget}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Deadline</p>
                            <p className="font-medium">{request.deadline}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Terms</h4>
                          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                            <li>Vendor commits to completing work by agreed deadline</li>
                            <li>Regular progress updates required</li>
                            <li>7% platform commission applies</li>
                            <li>Payment upon completion and approval</li>
                          </ul>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button className="gap-2">
                    <MessageSquare className="w-4 h-4"/>
                    Chat with Vendor
                  </Button>
                </div>
              </CardContent>
            </Card>))}
        </div>
      </div>
    </DashboardLayout>);
}
