import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
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
const requests = [
    { id: '1', title: 'IT Infrastructure Setup', client: 'Acme Corp', vendor: 'TechPro', category: 'IT Support', status: 'active', slaCompliance: 'compliant', progress: 65, budget: '$6,500' },
    { id: '2', title: 'Security System Installation', client: 'StartupXYZ', vendor: null, category: 'Security', status: 'pending', slaCompliance: 'n/a', progress: 0, budget: '$15,000' },
    { id: '3', title: 'Marketing Campaign', client: 'BizCo', vendor: 'Creative Agency', category: 'Marketing', status: 'active', slaCompliance: 'at-risk', progress: 40, budget: '$12,000' },
];
export default function RequestsMonitor() {
    return (<DashboardLayout menuItems={menuItems} userRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Requests Monitor</h1>
          <p className="text-gray-600">Track all service requests and SLA compliance</p>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Select>
                <SelectTrigger><SelectValue placeholder="All Categories"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="it">IT Support</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger><SelectValue placeholder="All Status"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger><SelectValue placeholder="SLA Compliance"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="compliant">Compliant</SelectItem>
                  <SelectItem value="at-risk">At Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {requests.map((request) => (<Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{request.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Client: {request.client}</span>
                      <span>•</span>
                      <span>Vendor: {request.vendor || 'None'}</span>
                      <span>•</span>
                      <Badge variant="outline">{request.category}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={request.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}>
                      {request.status}
                    </Badge>
                    {request.slaCompliance !== 'n/a' && (<Badge className={request.slaCompliance === 'compliant' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        SLA: {request.slaCompliance}
                      </Badge>)}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Budget</p>
                    <p className="font-semibold">{request.budget}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Progress: {request.progress}%</p>
                    <Progress value={request.progress} className="h-2"/>
                  </div>
                </div>
              </CardContent>
            </Card>))}
        </div>
      </div>
    </DashboardLayout>);
}
