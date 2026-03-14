import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { LayoutDashboard, Users, Briefcase, FileText, DollarSign, TrendingUp, UserCheck, Eye, CheckCircle, AlertTriangle } from 'lucide-react';
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
const slas = [
    { id: '1', request: 'IT Infrastructure Setup', client: 'Acme Corp', vendor: 'TechPro', budget: '$6,500', deadline: '2026-03-30', status: 'compliant', daysRemaining: 15 },
    { id: '2', request: 'Marketing Campaign', client: 'BizCo', vendor: 'Creative', budget: '$12,000', deadline: '2026-04-10', status: 'at-risk', daysRemaining: 8 },
    { id: '3', request: 'Website Development', client: 'StartupXYZ', vendor: 'DevStudio', budget: '$15,000', deadline: '2026-04-20', status: 'compliant', daysRemaining: 25 },
];
export default function SLAMonitor() {
    return (<DashboardLayout menuItems={menuItems} userRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SLA Monitor</h1>
          <p className="text-gray-600">Monitor all active SLA agreements</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total SLAs</p>
                  <p className="text-3xl font-bold">{slas.length}</p>
                </div>
                <FileText className="w-12 h-12 text-blue-600"/>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Compliant</p>
                  <p className="text-3xl font-bold text-green-600">{slas.filter(s => s.status === 'compliant').length}</p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-600"/>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">At Risk</p>
                  <p className="text-3xl font-bold text-red-600">{slas.filter(s => s.status === 'at-risk').length}</p>
                </div>
                <AlertTriangle className="w-12 h-12 text-red-600"/>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {slas.map((sla) => (<Card key={sla.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{sla.request}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Client: {sla.client}</span>
                      <span>•</span>
                      <span>Vendor: {sla.vendor}</span>
                    </div>
                  </div>
                  <Badge className={sla.status === 'compliant' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    {sla.status === 'compliant' ? 'Compliant' : 'At Risk'}
                  </Badge>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Budget</p>
                    <p className="font-semibold">{sla.budget}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Deadline</p>
                    <p className="font-semibold">{sla.deadline}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Days Remaining</p>
                    <p className="font-semibold">{sla.daysRemaining} days</p>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="w-4 h-4"/>
                      View SLA Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>SLA Agreement Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Request</p>
                          <p className="font-medium">{sla.request}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Client</p>
                          <p className="font-medium">{sla.client}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Vendor</p>
                          <p className="font-medium">{sla.vendor}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Budget</p>
                          <p className="font-medium">{sla.budget}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Terms</p>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                          <li>Completion by {sla.deadline}</li>
                          <li>Regular progress updates required</li>
                          <li>7% platform commission</li>
                        </ul>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>))}
        </div>
      </div>
    </DashboardLayout>);
}
