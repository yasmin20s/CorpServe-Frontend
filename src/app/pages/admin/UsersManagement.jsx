import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { LayoutDashboard, Users, Briefcase, FileText, DollarSign, TrendingUp, UserCheck, Search, Ban } from 'lucide-react';
import { toast } from 'sonner';
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
const users = [
    { id: '1', name: 'John Doe', email: 'john@acmecorp.com', role: 'client', status: 'active', joinedDate: '2026-01-15', requests: 12 },
    { id: '2', name: 'Jane Smith', email: 'jane@techpro.com', role: 'vendor', status: 'active', joinedDate: '2026-01-20', requests: 45 },
    { id: '3', name: 'Bob Johnson', email: 'bob@startup.com', role: 'client', status: 'suspended', joinedDate: '2026-02-10', requests: 3 },
    { id: '4', name: 'Alice Brown', email: 'alice@cleanc o.com', role: 'vendor', status: 'active', joinedDate: '2026-02-15', requests: 52 },
];
export default function UsersManagement() {
    const [selectedRole, setSelectedRole] = useState('all');
    const filteredUsers = selectedRole === 'all' ? users : users.filter(u => u.role === selectedRole);
    const handleSuspend = (name) => {
        toast.success(`${name} suspended`);
    };
    return (<DashboardLayout menuItems={menuItems} userRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Users Management</h1>
          <p className="text-gray-600">Manage all platform users</p>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400"/>
                <Input placeholder="Search users..." className="pl-10"/>
              </div>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="client">Clients</SelectItem>
                  <SelectItem value="vendor">Vendors</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">Name</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">Email</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">Role</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">Joined</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-600">Requests</th>
                    <th className="text-center py-4 px-6 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (<tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium">{user.name}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{user.email}</td>
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="capitalize">{user.role}</Badge>
                      </td>
                      <td className="py-4 px-6">
                        <Badge className={user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-sm">{user.joinedDate}</td>
                      <td className="py-4 px-6 text-right">{user.requests}</td>
                      <td className="py-4 px-6 text-center">
                        <Button size="sm" variant="outline" className="gap-2 text-red-600" onClick={() => handleSuspend(user.name)}>
                          <Ban className="w-4 h-4"/>
                          Suspend
                        </Button>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>);
}
