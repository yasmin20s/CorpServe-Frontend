import { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { LayoutDashboard, Users, Briefcase, FileText, DollarSign, TrendingUp, UserCheck, Eye, CheckCircle, X, File, Mail, CalendarDays, FolderOpen, Clock3, XCircle } from 'lucide-react';
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
const initialVendorRequests = [
    {
        id: '1',
        vendorName: 'Ahmed Nasser',
        organizationName: 'TechSolutions Pro',
        email: 'contact@techsolutions.com',
        category: 'IT Support',
        submittedAt: '2026-03-02 10:15 AM',
        status: 'pending',
        documents: [
            { name: 'Commercial_Registration.pdf', size: '2.3 MB' },
            { name: 'Tax_Card.pdf', size: '1.8 MB' },
            { name: 'Portfolio.pdf', size: '4.5 MB' },
        ],
    },
    {
        id: '2',
        vendorName: 'Mona Adel',
        organizationName: 'SecureGuard Elite',
        email: 'info@secureguard.com',
        category: 'Security',
        submittedAt: '2026-03-03 02:40 PM',
        status: 'pending',
        documents: [
            { name: 'Company_License.pdf', size: '1.9 MB' },
            { name: 'Tax_Document.pdf', size: '1.2 MB' },
        ],
    },
];
export default function VendorApprovals() {
  const [vendorRequests, setVendorRequests] = useState(initialVendorRequests);
  const [openRejectDialogId, setOpenRejectDialogId] = useState(null);
  const [rejectReasonDraft, setRejectReasonDraft] = useState({});
  const [recentActions, setRecentActions] = useState([]);
  const actionTimeoutsRef = useRef([]);

  useEffect(() => {
    return () => {
      actionTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, []);

    const addRecentAction = (vendor, nextStatus, reason = '') => {
      const actionId = `${vendor.id}-${nextStatus}-${Date.now()}`;

      setRecentActions((prev) => [
        {
          id: actionId,
          vendorName: vendor.vendorName,
          organizationName: vendor.organizationName,
          status: nextStatus,
          reason,
        },
        ...prev,
      ]);

      const timeoutId = setTimeout(() => {
        setRecentActions((prev) => prev.filter((action) => action.id !== actionId));
      }, 4000);

      actionTimeoutsRef.current.push(timeoutId);
    };

    const handleApprove = (vendor) => {
        setVendorRequests((prev) => prev.filter((request) => request.id !== vendor.id));
        addRecentAction(vendor, 'accepted');
        toast.success(`${vendor.organizationName} approved successfully!`);
    };

  const handleReject = (vendor) => {
    const reason = (rejectReasonDraft[vendor.id] || '').trim();
    if (!reason) {
      toast.error('Please add a rejection reason first.');
      return;
    }

    setVendorRequests((prev) => prev.filter((request) => request.id !== vendor.id));
    addRecentAction(vendor, 'rejected', reason);
    setRejectReasonDraft((prev) => ({ ...prev, [vendor.id]: '' }));

    setOpenRejectDialogId(null);
    toast.error(`${vendor.organizationName} rejected. Reason sent to vendor.`);
    };
  const pendingRequests = vendorRequests.filter((request) => request.status === 'pending');
  const totalDocuments = pendingRequests.reduce((count, vendor) => count + vendor.documents.length, 0);
  const uniqueCategories = new Set(pendingRequests.map((vendor) => vendor.category)).size;

    return (<DashboardLayout menuItems={menuItems} userRole="admin">
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-indigo-300/70 bg-gradient-to-r from-indigo-100 via-violet-100 to-fuchsia-100 p-6 shadow-[0_16px_36px_rgba(99,102,241,0.2)] md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-indigo-300/50 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-violet-300/45 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-black text-indigo-800">Vendor Approvals</h1>
              <p className="text-indigo-700/80">Review and approve vendor applications</p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-indigo-300 bg-indigo-50/90 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm">
              <UserCheck className="h-4 w-4" />
              Admin Review Panel
            </div>
          </div>
        </div>

        <Card className="border border-amber-200 bg-amber-50/90 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-amber-900">
              ⚠️ You have {pendingRequests.length} pending vendor approval{pendingRequests.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6f74ea] text-white">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Pending Vendors</p>
                <p className="text-2xl font-bold text-slate-900">{pendingRequests.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Submitted Docs</p>
                <p className="text-2xl font-bold text-slate-900">{totalDocuments}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Categories</p>
                <p className="text-2xl font-bold text-slate-900">{uniqueCategories}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div
          className={`grid gap-4 ${
            recentActions.length > 0 ? 'xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start' : 'grid-cols-1'
          }`}
        >
          <div className="space-y-4">
          {pendingRequests.map((vendor) => (<Card key={vendor.id} className="group relative overflow-hidden border-0 bg-white shadow-[0_10px_28px_rgba(30,41,59,0.08)] ring-1 ring-indigo-100/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(99,102,241,0.18)] hover:ring-indigo-200">
              <CardContent className="relative p-6">
                <div className="pointer-events-none absolute -left-14 -top-16 h-32 w-32 rounded-full bg-indigo-200/35 blur-2xl" />
                <div className="pointer-events-none absolute -right-10 -bottom-16 h-36 w-36 rounded-full bg-violet-200/35 blur-2xl" />
                <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[#6f74ea] via-indigo-500 to-violet-500" />

                <div className="mb-5 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-2xl border border-indigo-100/80 bg-white/95 p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-slate-900">{vendor.organizationName}</h3>
                      <Badge className="border border-amber-200 bg-amber-100 text-amber-700 shadow-sm">
                        <Clock3 className="mr-1 h-3.5 w-3.5" />
                        Pending
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-slate-700">
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[#6f74ea]" />
                        <span>{vendor.email}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-[#6f74ea]" />
                        <span>Vendor Name: {vendor.vendorName}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-[#6f74ea]" />
                        <span>Organization Name: {vendor.organizationName}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-[#6f74ea]" />
                        <span>{vendor.category}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-[#6f74ea]" />
                        <span>Submitted At: {vendor.submittedAt}</span>
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
                    <h4 className="mb-2 flex items-center gap-2 font-medium text-slate-900">
                      <FolderOpen className="h-4 w-4 text-[#6f74ea]" />
                      Documents ({vendor.documents.length})
                    </h4>
                    <div className="grid gap-2">
                    {vendor.documents.map((doc, idx) => (<div key={idx} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/90 p-2 transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50/60 hover:shadow-sm">
                        <File className="h-4 w-4 text-[#6f74ea]"/>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{doc.name}</p>
                          <p className="text-xs text-slate-500">{doc.size}</p>
                        </div>
                      </div>))}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/75 p-3">
                  <div className="flex flex-wrap gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2 border-slate-300 text-slate-700 hover:border-[#6f74ea] hover:text-[#6f74ea]">
                        <Eye className="w-4 h-4"/>
                        View Documents
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border border-indigo-100">
                      <DialogHeader>
                        <DialogTitle>Vendor Documents - {vendor.organizationName}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 py-4">
                        {vendor.documents.map((doc, idx) => (<div key={idx} className="rounded-lg border border-slate-200 p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <File className="w-5 h-5 text-[#6f74ea]"/>
                                <div>
                                  <p className="font-medium">{doc.name}</p>
                                  <p className="text-sm text-slate-500">{doc.size}</p>
                                </div>
                              </div>
                              <Button size="sm" variant="outline">Download</Button>
                            </div>
                          </div>))}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button className="gap-2 bg-[#6f74ea] text-white hover:bg-[#5f64da]" onClick={() => handleApprove(vendor)}>
                    <CheckCircle className="w-4 h-4"/>
                    Approve
                  </Button>
                  <Dialog
                    open={openRejectDialogId === vendor.id}
                    onOpenChange={(isOpen) => setOpenRejectDialogId(isOpen ? vendor.id : null)}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2 border-red-200 text-red-600 hover:bg-red-50">
                        <X className="w-4 h-4"/>
                        Reject
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border border-red-100">
                      <DialogHeader>
                        <DialogTitle>Reject Vendor - {vendor.organizationName}</DialogTitle>
                      </DialogHeader>

                      <div className="space-y-3 py-2">
                        <p className="text-sm text-slate-600">
                          Add a rejection reason. This message will be shown to the vendor.
                        </p>
                        <Textarea
                          value={rejectReasonDraft[vendor.id] || ''}
                          onChange={(e) =>
                            setRejectReasonDraft((prev) => ({
                              ...prev,
                              [vendor.id]: e.target.value,
                            }))
                          }
                          placeholder="Example: Missing valid commercial registration document. Please upload an updated file."
                          className="min-h-28"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpenRejectDialogId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={() => handleReject(vendor)}
                          >
                            Confirm Rejection
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>))}

          {pendingRequests.length === 0 && (
            <Card className="border border-slate-200 bg-white">
              <CardContent className="p-8 text-center">
                <CheckCircle className="mx-auto mb-3 h-8 w-8 text-emerald-600" />
                <p className="text-lg font-semibold text-slate-900">No pending vendor requests</p>
                <p className="mt-1 text-sm text-slate-500">All pending applications have been reviewed.</p>
              </CardContent>
            </Card>
          )}
          </div>

          {recentActions.length > 0 && <div className="xl:sticky xl:top-20 xl:z-0">
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardContent className="space-y-3 p-4">
                <p className="text-sm font-semibold text-slate-800">Recent Status Updates</p>

                <div className="space-y-2">
                  {recentActions.map((action) => (
                    <div
                      key={action.id}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        action.status === 'accepted'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-red-200 bg-red-50 text-red-800'
                      }`}
                    >
                      <p className="flex items-center gap-2 font-semibold">
                        {action.status === 'accepted' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        {action.organizationName} ({action.vendorName}) {action.status}
                      </p>
                      {action.reason && <p className="mt-1 text-xs">Reason: {action.reason}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>}
        </div>
      </div>
    </DashboardLayout>);
}

