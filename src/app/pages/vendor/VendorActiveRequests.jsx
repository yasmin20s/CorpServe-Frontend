import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Slider } from '../../components/ui/slider';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { LayoutDashboard, Briefcase, Activity, CheckCircle, TrendingUp, FileText, AlertTriangle } from 'lucide-react';
import { toast } from '../../lib/toast';
const menuItems = [
    { label: 'Dashboard', path: '/vendor/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Available Requests', path: '/vendor/available-requests', icon: <Briefcase className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/vendor/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Completed', path: '/vendor/completed', icon: <CheckCircle className="w-5 h-5"/> },
    { label: 'Analytics', path: '/vendor/analytics', icon: <TrendingUp className="w-5 h-5"/> },
];
const activeRequests = [
    { id: '1', title: 'IT Infrastructure Setup', client: 'Acme Corp', budget: 'EGP 6,500', deadline: '2026-03-30', progress: 65, daysRemaining: 15 },
    { id: '2', title: 'Website Development', client: 'StartupXYZ', budget: 'EGP 12,000', deadline: '2026-04-05', progress: 80, daysRemaining: 8 },
];
export default function VendorActiveRequests() {
    const [progress, setProgress] = useState(65);
    const [workUpdate, setWorkUpdate] = useState('');
    const handleUpdateProgress = () => {
        toast.success('Progress updated successfully!');
        setWorkUpdate('');
    };
    return (<DashboardLayout menuItems={menuItems} userRole="vendor">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Active Requests</h1>
          <p className="text-gray-600">Manage ongoing projects and update progress</p>
        </div>

        <div className="space-y-4">
          {activeRequests.map((request) => (<Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{request.title}</h3>
                    <p className="text-gray-600">Client: {request.client}</p>
                  </div>
                  {request.daysRemaining < 10 && (<div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-600"/>
                      <span className="text-sm text-yellow-700">{request.daysRemaining} days left</span>
                    </div>)}
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Budget</p>
                    <p className="font-semibold">{request.budget}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Deadline</p>
                    <p className="font-semibold">{request.deadline}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Progress</p>
                    <p className="font-semibold">{request.progress}%</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>Update Progress</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Progress</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div className="space-y-3">
                          <Label>Progress: {progress}%</Label>
                          <Slider value={[progress]} onValueChange={(v) => setProgress(v[0])} max={100} step={5} className="w-full"/>
                        </div>
                        <div className="space-y-2">
                          <Label>Work Description</Label>
                          <Textarea rows={4} placeholder="Describe what you've completed..." value={workUpdate} onChange={(e) => setWorkUpdate(e.target.value)}/>
                        </div>
                        <Button onClick={handleUpdateProgress} className="w-full">Submit Update</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" className="gap-2">
                    <FileText className="w-4 h-4"/>
                    View SLA
                  </Button>
                </div>
              </CardContent>
            </Card>))}
        </div>
      </div>
    </DashboardLayout>);
}

