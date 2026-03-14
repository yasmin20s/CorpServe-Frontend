import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LayoutDashboard, Users, Briefcase, FileText, DollarSign, TrendingUp, UserCheck } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
const growthData = [
    { month: 'Jan', users: 850, vendors: 98, requests: 412 },
    { month: 'Feb', users: 920, vendors: 112, requests: 489 },
    { month: 'Mar', users: 1050, vendors: 128, requests: 567 },
    { month: 'Apr', users: 1124, vendors: 142, requests: 643 },
    { month: 'May', users: 1198, vendors: 156, requests: 721 },
    { month: 'Jun', users: 1234, vendors: 163, requests: 892 },
];
const categoryDistribution = [
    { name: 'IT Support', value: 25, color: '#3b82f6' },
    { name: 'Security', value: 18, color: '#10b981' },
    { name: 'Marketing', value: 22, color: '#f59e0b' },
    { name: 'Cleaning', value: 15, color: '#8b5cf6' },
    { name: 'Others', value: 20, color: '#6b7280' },
];
export default function AdminAnalytics() {
    return (<DashboardLayout menuItems={menuItems} userRole="admin">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Analytics</h1>
          <p className="text-gray-600">Comprehensive insights and trends</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title="User Growth" value="+384" icon={Users} iconColor="text-blue-600" iconBgColor="bg-blue-100" trend={{ value: '45% increase', isPositive: true }}/>
          <StatsCard title="Vendor Growth" value="+65" icon={UserCheck} iconColor="text-green-600" iconBgColor="bg-green-100" trend={{ value: '66% increase', isPositive: true }}/>
          <StatsCard title="Request Growth" value="+480" icon={Briefcase} iconColor="text-purple-600" iconBgColor="bg-purple-100" trend={{ value: '116% increase', isPositive: true }}/>
          <StatsCard title="Avg Response Time" value="3.2h" icon={TrendingUp} iconColor="text-orange-600" iconBgColor="bg-orange-100"/>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Platform Growth Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                <XAxis dataKey="month" stroke="#6b7280"/>
                <YAxis stroke="#6b7280"/>
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}/>
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} name="Users"/>
                <Line type="monotone" dataKey="vendors" stroke="#10b981" strokeWidth={2} name="Vendors"/>
                <Line type="monotone" dataKey="requests" stroke="#f59e0b" strokeWidth={2} name="Requests"/>
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                    {categoryDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Requests by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                  <XAxis dataKey="name" stroke="#6b7280"/>
                  <YAxis stroke="#6b7280"/>
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}/>
                  <Bar dataKey="value" fill="#8b5cf6" name="Requests (%)" radius={[8, 8, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>);
}
