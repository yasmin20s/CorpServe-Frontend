import { useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { LayoutDashboard, Users, Briefcase, FileText, DollarSign, TrendingUp, UserCheck, Search, Ban, CheckCircle2 } from 'lucide-react';
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
const users = [
  { id: '1', name: 'John Doe', companyName: 'Acme Corp', email: 'john@acmecorp.com', phoneNumber: '+20 100 111 2233', role: 'client', status: 'active', requestsCreated: 12, requestsHandled: 0 },
  { id: '2', name: 'Jane Smith', companyName: 'TechPro Solutions', email: 'jane@techpro.com', phoneNumber: '+20 101 765 8800', role: 'vendor', status: 'active', requestsCreated: 0, requestsHandled: 45 },
  { id: '3', name: 'Bob Johnson', companyName: 'Startup XYZ', email: 'bob@startup.com', phoneNumber: '+20 102 456 7788', role: 'client', status: 'suspended', requestsCreated: 3, requestsHandled: 0 },
  { id: '4', name: 'Alice Brown', companyName: 'CleanCo Services', email: 'alice@cleanco.com', phoneNumber: '+20 109 335 6621', role: 'vendor', status: 'active', requestsCreated: 0, requestsHandled: 52 },
];
export default function UsersManagement() {
    const [selectedRole, setSelectedRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userRows, setUserRows] = useState(users);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return userRows.filter((user) => {
      const roleMatched = selectedRole === 'all' || user.role === selectedRole;
      if (!roleMatched) return false;
      if (!normalizedQuery) return true;
      return user.name.toLowerCase().includes(normalizedQuery) || user.role.toLowerCase().includes(normalizedQuery);
    });
  }, [searchQuery, selectedRole, userRows]);

  const handleStatusToggle = (id) => {
    let nextStatus = 'active';
    let toggledUserName = '';

    setUserRows((prevUsers) => prevUsers.map((user) => {
      if (user.id !== id) return user;
      nextStatus = user.status === 'active' ? 'suspended' : 'active';
      toggledUserName = user.name;
      return { ...user, status: nextStatus };
    }));

    toast.success(`${toggledUserName} account is now ${nextStatus}`);
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
                <Input
                  placeholder="Search by name or role (client/vendor)..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
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
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">Company Name</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">Email</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">Phone Number</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">Role</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-600">Requests Created (Client)</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-600">Requests Handled (Vendor)</th>
                    <th className="text-center py-4 px-6 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (<tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium">{user.name}</td>
                      <td className="py-4 px-6 text-sm text-gray-700">{user.companyName}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{user.email}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{user.phoneNumber}</td>
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="capitalize">{user.role}</Badge>
                      </td>
                      <td className="py-4 px-6">
                        <Badge className={user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {user.status === 'active' ? 'Active' : 'Suspended'}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-gray-700">{user.role === 'client' ? user.requestsCreated : '-'}</td>
                      <td className="py-4 px-6 text-right font-medium text-gray-700">{user.role === 'vendor' ? user.requestsHandled : '-'}</td>
                      <td className="py-4 px-6 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className={user.status === 'active' ? 'gap-2 text-red-600 border-red-200 hover:bg-red-50' : 'gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50'}
                          onClick={() => handleStatusToggle(user.id)}
                        >
                          {user.status === 'active' ? <Ban className="w-4 h-4"/> : <CheckCircle2 className="w-4 h-4"/>}
                          {user.status === 'active' ? 'Suspend' : 'Activate Account'}
                        </Button>
                      </td>
                    </tr>))}
                  {filteredUsers.length === 0 && (<tr>
                      <td colSpan={9} className="py-8 text-center text-sm text-gray-500">
                        No users found for this search/filter.
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>);
}

