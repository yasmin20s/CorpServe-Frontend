import { useState } from 'react';
import { useParams } from 'react-router';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { LayoutDashboard, PlusCircle, FileStack, Activity, Wallet, CheckCircle, X, MessageSquare, Star } from 'lucide-react';
import { toast } from 'sonner';
const menuItems = [
    { label: 'Dashboard', path: '/client/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Create Request', path: '/client/create-request', icon: <PlusCircle className="w-5 h-5"/> },
    { label: 'My Requests', path: '/client/my-requests', icon: <FileStack className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/client/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Payments', path: '/client/payments', icon: <Wallet className="w-5 h-5"/> },
];
const proposals = [
    {
        id: '1',
        vendorName: 'SecureGuard Solutions',
        vendorRating: 4.8,
        vendorCompletedJobs: 127,
        proposedBudget: '$16,500',
        proposedDeadline: '2026-04-15',
        message: 'We specialize in enterprise security systems with over 10 years of experience. We can provide 24/7 monitoring, access control, and CCTV installation.',
        estimatedDuration: '3 weeks',
    },
    {
        id: '2',
        vendorName: 'TotalSecurity Inc',
        vendorRating: 4.6,
        vendorCompletedJobs: 89,
        proposedBudget: '$18,000',
        proposedDeadline: '2026-04-20',
        message: 'Comprehensive security solution including installation, configuration, and 6-month maintenance support. All equipment is enterprise-grade.',
        estimatedDuration: '4 weeks',
    },
    {
        id: '3',
        vendorName: 'SafetyFirst Systems',
        vendorRating: 4.9,
        vendorCompletedJobs: 203,
        proposedBudget: '$15,800',
        proposedDeadline: '2026-04-10',
        message: 'Fast and reliable security system installation. We use the latest technology and provide comprehensive training for your staff.',
        estimatedDuration: '2 weeks',
    },
];
export default function Proposals() {
    const { requestId } = useParams();
    const [showSLA, setShowSLA] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [negotiationData, setNegotiationData] = useState({
        budget: '',
        deadline: '',
        message: '',
    });
    const handleAccept = (proposal) => {
        setSelectedProposal(proposal);
        setShowSLA(true);
    };
    const handleReject = (vendorName) => {
        toast.success(`Proposal from ${vendorName} rejected`);
    };
    const handleNegotiate = () => {
        toast.success('Counter-offer sent to vendor');
    };
    return (<DashboardLayout menuItems={menuItems} userRole="client">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Proposals</h1>
          <p className="text-gray-600">
            Review proposals for: <span className="font-medium">Security System Installation</span>
          </p>
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Your Budget</p>
                <p className="text-lg font-semibold text-gray-900">$15,000 - $20,000</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Deadline</p>
                <p className="text-lg font-semibold text-gray-900">April 30, 2026</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Proposals Received</p>
                <p className="text-lg font-semibold text-gray-900">{proposals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {proposals.map((proposal) => (<Card key={proposal.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-2">{proposal.vendorName}</CardTitle>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400"/>
                        <span className="font-medium">{proposal.vendorRating}</span>
                      </div>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">{proposal.vendorCompletedJobs} jobs completed</span>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Verified</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Proposed Budget</p>
                    <p className="text-xl font-semibold text-gray-900">{proposal.proposedBudget}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Proposed Deadline</p>
                    <p className="text-xl font-semibold text-gray-900">{proposal.proposedDeadline}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Duration</p>
                    <p className="text-xl font-semibold text-gray-900">{proposal.estimatedDuration}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Proposal Message</h4>
                  <p className="text-gray-600">{proposal.message}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={() => handleAccept(proposal)} className="gap-2">
                    <CheckCircle className="w-4 h-4"/>
                    Accept
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <MessageSquare className="w-4 h-4"/>
                        Negotiate
                      </Button>
                    </DialogTrigger>
                    <DialogContent aria-describedby={undefined}>
                      <DialogHeader>
                        <DialogTitle>Negotiate with {proposal.vendorName}</DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-slate-600">Send a counter-offer with your preferred budget and deadline</p>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Your Counter Budget</Label>
                          <Input type="number" placeholder="Enter amount" value={negotiationData.budget} onChange={(e) => setNegotiationData({ ...negotiationData, budget: e.target.value })}/>
                        </div>
                        <div className="space-y-2">
                          <Label>Your Preferred Deadline</Label>
                          <Input type="date" value={negotiationData.deadline} onChange={(e) => setNegotiationData({ ...negotiationData, deadline: e.target.value })}/>
                        </div>
                        <div className="space-y-2">
                          <Label>Message</Label>
                          <Textarea placeholder="Explain your counter-offer..." rows={4} value={negotiationData.message} onChange={(e) => setNegotiationData({ ...negotiationData, message: e.target.value })}/>
                        </div>
                        <Button onClick={handleNegotiate} className="w-full">
                          Send Counter-Offer
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" className="gap-2 text-red-600 hover:text-red-700" onClick={() => handleReject(proposal.vendorName)}>
                    <X className="w-4 h-4"/>
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>))}
        </div>

        {/* SLA Dialog */}
        <Dialog open={showSLA} onOpenChange={setShowSLA}>
          <DialogContent className="max-w-2xl" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Service Level Agreement (SLA)</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-slate-600">Review the SLA for this service request</p>
            <div className="space-y-4 py-4">
              <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Client</p>
                  <p className="font-medium">Acme Corporation</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vendor</p>
                  <p className="font-medium">{selectedProposal?.vendorName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Budget</p>
                  <p className="font-medium">{selectedProposal?.proposedBudget}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Deadline</p>
                  <p className="font-medium">{selectedProposal?.proposedDeadline}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Terms & Conditions</h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Vendor will complete the work as per the agreed timeline</li>
                  <li>Client will provide necessary access and information</li>
                  <li>Payment will be released upon successful completion</li>
                  <li>7% platform commission will be added to the final amount</li>
                  <li>Both parties agree to maintain professional communication</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => {
            setShowSLA(false);
            toast.success('SLA accepted! Request is now active.');
        }} className="flex-1">
                  Accept SLA
                </Button>
                <Button variant="outline" onClick={() => setShowSLA(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>);
}
