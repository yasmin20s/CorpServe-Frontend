import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { LayoutDashboard, Briefcase, Activity, CheckCircle, TrendingUp, Eye, CheckSquare, X } from 'lucide-react';
import { toast } from '../../lib/toast';
const menuItems = [
    { label: 'Dashboard', path: '/vendor/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Available Requests', path: '/vendor/available-requests', icon: <Briefcase className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/vendor/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Completed', path: '/vendor/completed', icon: <CheckCircle className="w-5 h-5"/> },
    { label: 'Analytics', path: '/vendor/analytics', icon: <TrendingUp className="w-5 h-5"/> },
];
const requests = [
    { id: '1', title: 'Security System Installation', company: 'Acme Corp', category: 'Security', budget: 'EGP 15,000 - EGP 20,000', deadline: '2026-04-30', description: 'Need comprehensive security system with CCTV, access control, and monitoring.', posted: '2 days ago' },
    { id: '2', title: 'Network Infrastructure Upgrade', company: 'TechStart Inc', category: 'IT Support', budget: 'EGP 25,000 - EGP 30,000', deadline: '2026-05-15', description: 'Upgrade entire office network infrastructure including servers and switches.', posted: '1 week ago' },
];
export default function AvailableRequests() {
    const [proposal, setProposal] = useState({ budget: '', deadline: '', message: '' });
    const handleSubmitProposal = () => {
        toast.success('Proposal submitted successfully!');
        setProposal({ budget: '', deadline: '', message: '' });
    };
    return (<DashboardLayout menuItems={menuItems} userRole="vendor">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Requests</h1>
          <p className="text-gray-600">Browse and submit proposals for service requests</p>
        </div>

        <div className="space-y-4">
          {requests.map((request) => (<Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{request.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>{request.company}</span>
                      <span>•</span>
                      <Badge variant="outline">{request.category}</Badge>
                      <span>•</span>
                      <span>Posted {request.posted}</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{request.description}</p>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Budget Range</p>
                    <p className="font-semibold">{request.budget}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Deadline</p>
                    <p className="font-semibold">{request.deadline}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <CheckSquare className="w-4 h-4"/>
                        Submit Proposal
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Submit Proposal</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Proposed Budget</Label>
                          <Input type="number" placeholder="Enter amount" value={proposal.budget} onChange={(e) => setProposal({ ...proposal, budget: e.target.value })}/>
                        </div>
                        <div className="space-y-2">
                          <Label>Proposed Deadline</Label>
                          <Input type="date" value={proposal.deadline} onChange={(e) => setProposal({ ...proposal, deadline: e.target.value })}/>
                        </div>
                        <div className="space-y-2">
                          <Label>Proposal Message</Label>
                          <Textarea rows={4} placeholder="Describe your approach..." value={proposal.message} onChange={(e) => setProposal({ ...proposal, message: e.target.value })}/>
                        </div>
                        <Button onClick={handleSubmitProposal} className="w-full">Submit</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" className="gap-2">
                    <Eye className="w-4 h-4"/>
                    View Details
                  </Button>
                  <Button variant="outline" className="gap-2 text-red-600">
                    <X className="w-4 h-4"/>
                    Decline
                  </Button>
                </div>
              </CardContent>
            </Card>))}
        </div>
      </div>
    </DashboardLayout>);
}

