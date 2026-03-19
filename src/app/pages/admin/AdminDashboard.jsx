import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LayoutDashboard, Users, Briefcase, FileText, DollarSign, TrendingUp, UserCheck } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
const revenueData = [
    { month: 'Jan', revenue: 8400, commission: 588 },
    { month: 'Feb', revenue: 12600, commission: 882 },
    { month: 'Mar', revenue: 15800, commission: 1106 },
    { month: 'Apr', revenue: 14200, commission: 994 },
    { month: 'May', revenue: 18500, commission: 1295 },
    { month: 'Jun', revenue: 22100, commission: 1547 },
];
const vendorPerformance = [
    { vendor: 'TechPro', rating: 4.8, jobs: 45 },
    { vendor: 'SecureGuard', rating: 4.6, jobs: 38 },
    { vendor: 'CleanCo', rating: 4.9, jobs: 52 },
    { vendor: 'Creative', rating: 4.7, jobs: 41 },
];
export default function AdminDashboard() {
    return (<DashboardLayout menuItems={menuItems} userRole="admin">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Platform overview and monitoring</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <StatsCard title="Total Users" value="1,234" icon={Users} iconColor="text-blue-600" iconBgColor="bg-blue-100" trend={{ value: '12% this month', isPositive: true }}/>
          <StatsCard title="Vendors" value="156" icon={UserCheck} iconColor="text-purple-600" iconBgColor="bg-purple-100"/>
          <StatsCard title="Requests" value="892" icon={Briefcase} iconColor="text-green-600" iconBgColor="bg-green-100"/>
          <StatsCard title="Active SLAs" value="234" icon={FileText} iconColor="text-orange-600" iconBgColor="bg-orange-100"/>
          <StatsCard title="Revenue" value="EGP 91,600" icon={DollarSign} iconColor="text-emerald-600" iconBgColor="bg-emerald-100"/>
          <StatsCard title="Commission" value="EGP 6,412" icon={TrendingUp} iconColor="text-cyan-600" iconBgColor="bg-cyan-100" trend={{ value: '8% this month', isPositive: true }}/>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Commission</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                  <XAxis dataKey="month" stroke="#6b7280"/>
                  <YAxis stroke="#6b7280"/>
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}/>
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue (EGP)"/>
                  <Line type="monotone" dataKey="commission" stroke="#3b82f6" strokeWidth={2} name="Commission (EGP)"/>
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Vendor Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={vendorPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                  <XAxis dataKey="vendor" stroke="#6b7280"/>
                  <YAxis stroke="#6b7280"/>
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}/>
                  <Legend />
                  <Bar dataKey="jobs" fill="#8b5cf6" name="Jobs Completed" radius={[8, 8, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>);
}
