import { Link } from 'react-router';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { LayoutDashboard, PlusCircle, FileStack, Activity, Wallet, Search, MessageSquare, Eye } from 'lucide-react';
const menuItems = [
    { label: 'Dashboard', path: '/client/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Create Request', path: '/client/create-request', icon: <PlusCircle className="w-5 h-5"/> },
    { label: 'My Requests', path: '/client/my-requests', icon: <FileStack className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/client/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Payments', path: '/client/payments', icon: <Wallet className="w-5 h-5"/> },
];
const requests = [
    {
        id: '1',
        title: 'IT Infrastructure Setup',
        category: 'IT Support',
        status: 'active',
        vendor: 'TechPro Solutions',
        proposals: null,
        budget: '$5,000 - $8,000',
        progress: 65,
        createdAt: '2026-02-15',
    },
    {
        id: '2',
        title: 'Office Cleaning Service',
        category: 'Cleaning',
        status: 'completed',
        vendor: 'CleanCo Services',
        proposals: null,
        budget: '$2,000 - $3,000',
        progress: 100,
        createdAt: '2026-01-20',
    },
    {
        id: '3',
        title: 'Marketing Campaign Design',
        category: 'Marketing',
        status: 'active',
        vendor: 'Creative Agency',
        proposals: null,
        budget: '$10,000 - $15,000',
        progress: 40,
        createdAt: '2026-02-28',
    },
    {
        id: '4',
        title: 'Security System Installation',
        category: 'Security',
        status: 'pending',
        vendor: null,
        proposals: 3,
        budget: '$15,000 - $20,000',
        progress: 0,
        createdAt: '2026-03-01',
    },
    {
        id: '5',
        title: 'Website Redesign',
        category: 'Design',
        status: 'pending',
        vendor: null,
        proposals: 5,
        budget: '$8,000 - $12,000',
        progress: 0,
        createdAt: '2026-03-03',
    },
];
export default function MyRequests() {
    const getStatusBadge = (status) => {
        const variants = {
            active: 'bg-blue-100 text-blue-700',
            completed: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            cancelled: 'bg-red-100 text-red-700',
        };
        return variants[status] || variants.pending;
    };
    return (<DashboardLayout menuItems={menuItems} userRole="client">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Requests</h1>
            <p className="text-gray-600">Manage and track all your service requests</p>
          </div>
          <Link to="/client/create-request">
            <Button className="gap-2">
              <PlusCircle className="w-4 h-4"/>
              New Request
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400"/>
                <Input placeholder="Search requests..." className="pl-10"/>
              </div>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="it">IT Support</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All Status"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <div className="space-y-4">
          {requests.map((request) => (<Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                      <Badge className={getStatusBadge(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Category:</span> {request.category}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Budget:</span> {request.budget}
                      </span>
                      <span>•</span>
                      <span>Created: {request.createdAt}</span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      {request.vendor ? 'Vendor' : 'Proposals'}
                    </p>
                    <p className="font-medium text-gray-900">
                      {request.vendor || `${request.proposals} proposals received`}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{request.progress}%</span>
                    </div>
                    <Progress value={request.progress} className="h-2"/>
                  </div>
                </div>

                <div className="flex gap-2">
                  {request.status === 'pending' && request.proposals ? (<Link to={`/client/proposals/${request.id}`}>
                      <Button size="sm" variant="default" className="gap-2">
                        <Eye className="w-4 h-4"/>
                        View Proposals ({request.proposals})
                      </Button>
                    </Link>) : null}
                  <Button size="sm" variant="outline" className="gap-2">
                    <Eye className="w-4 h-4"/>
                    View Details
                  </Button>
                  {request.vendor && (<Link to="/client/chat">
                      <Button size="sm" variant="outline" className="gap-2">
                        <MessageSquare className="w-4 h-4"/>
                        Chat
                      </Button>
                    </Link>)}
                </div>
              </CardContent>
            </Card>))}
        </div>
      </div>
    </DashboardLayout>);
}
