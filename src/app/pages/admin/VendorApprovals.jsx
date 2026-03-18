import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { LayoutDashboard, Users, Briefcase, FileText, DollarSign, TrendingUp, UserCheck, Eye, CheckCircle, X, File } from 'lucide-react';
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
const pendingVendors = [
    {
        id: '1',
        name: 'TechSolutions Pro',
        email: 'contact@techsolutions.com',
        category: 'IT Support',
        submittedDate: '2026-03-02',
        documents: [
            { name: 'Commercial_Registration.pdf', size: '2.3 MB' },
            { name: 'Tax_Card.pdf', size: '1.8 MB' },
            { name: 'Portfolio.pdf', size: '4.5 MB' },
        ],
    },
    {
        id: '2',
        name: 'SecureGuard Elite',
        email: 'info@secureguard.com',
        category: 'Security',
        submittedDate: '2026-03-03',
        documents: [
            { name: 'Company_License.pdf', size: '1.9 MB' },
            { name: 'Tax_Document.pdf', size: '1.2 MB' },
        ],
    },
];
export default function VendorApprovals() {
    const handleApprove = (vendorName) => {
        toast.success(`${vendorName} approved successfully!`);
    };
    const handleReject = (vendorName) => {
        toast.error(`${vendorName} rejected`);
    };
    return (<DashboardLayout menuItems={menuItems} userRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Approvals</h1>
          <p className="text-gray-600">Review and approve vendor applications</p>
        </div>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-900">
              ⚠️ You have {pendingVendors.length} pending vendor approval{pendingVendors.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {pendingVendors.map((vendor) => (<Card key={vendor.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{vendor.name}</h3>
                      <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Email: {vendor.email}</p>
                      <p>Category: {vendor.category}</p>
                      <p>Submitted: {vendor.submittedDate}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Documents ({vendor.documents.length})</h4>
                  <div className="grid md:grid-cols-3 gap-2">
                    {vendor.documents.map((doc, idx) => (<div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                        <File className="w-4 h-4 text-blue-600"/>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                          <p className="text-xs text-gray-500">{doc.size}</p>
                        </div>
                      </div>))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Eye className="w-4 h-4"/>
                        View Documents
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Vendor Documents - {vendor.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 py-4">
                        {vendor.documents.map((doc, idx) => (<div key={idx} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <File className="w-5 h-5 text-blue-600"/>
                                <div>
                                  <p className="font-medium">{doc.name}</p>
                                  <p className="text-sm text-gray-500">{doc.size}</p>
                                </div>
                              </div>
                              <Button size="sm" variant="outline">Download</Button>
                            </div>
                          </div>))}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button className="gap-2" onClick={() => handleApprove(vendor.name)}>
                    <CheckCircle className="w-4 h-4"/>
                    Approve
                  </Button>
                  <Button variant="outline" className="gap-2 text-red-600" onClick={() => handleReject(vendor.name)}>
                    <X className="w-4 h-4"/>
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>))}
        </div>
      </div>
    </DashboardLayout>);
}

