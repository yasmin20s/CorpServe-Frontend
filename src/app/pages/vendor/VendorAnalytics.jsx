import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LayoutDashboard, Briefcase, Activity, CheckCircle, TrendingUp, DollarSign, Clock, Star } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
const menuItems = [
    { label: 'Dashboard', path: '/vendor/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Available Requests', path: '/vendor/available-requests', icon: <Briefcase className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/vendor/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Completed', path: '/vendor/completed', icon: <CheckCircle className="w-5 h-5"/> },
    { label: 'Analytics', path: '/vendor/analytics', icon: <TrendingUp className="w-5 h-5"/> },
];
const monthlyData = [
    { month: 'Jan', earnings: 15000, jobs: 8 },
    { month: 'Feb', earnings: 18500, jobs: 10 },
    { month: 'Mar', earnings: 22000, jobs: 12 },
    { month: 'Apr', earnings: 19500, jobs: 9 },
    { month: 'May', earnings: 24000, jobs: 13 },
    { month: 'Jun', earnings: 28000, jobs: 15 },
];
const categoryData = [
    { category: 'IT Support', count: 45 },
    { category: 'Security', count: 32 },
    { category: 'Maintenance', count: 28 },
    { category: 'Consulting', count: 22 },
];
export default function VendorAnalytics() {
    return (<DashboardLayout menuItems={menuItems} userRole="vendor">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
          <p className="text-gray-600">Detailed insights into your vendor performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title="Total Revenue" value="$127,000" icon={DollarSign} iconColor="text-green-600" iconBgColor="bg-green-100" trend={{ value: '15% from last month', isPositive: true }}/>
          <StatsCard title="Avg Response Time" value="2.3h" icon={Clock} iconColor="text-blue-600" iconBgColor="bg-blue-100"/>
          <StatsCard title="Avg Rating" value="4.8/5" icon={Star} iconColor="text-yellow-600" iconBgColor="bg-yellow-100"/>
          <StatsCard title="Completion Rate" value="96%" icon={CheckCircle} iconColor="text-purple-600" iconBgColor="bg-purple-100"/>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Jobs Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                  <XAxis dataKey="month" stroke="#6b7280"/>
                  <YAxis yAxisId="left" stroke="#6b7280"/>
                  <YAxis yAxisId="right" orientation="right" stroke="#6b7280"/>
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}/>
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={2} name="Revenue ($)"/>
                  <Line yAxisId="right" type="monotone" dataKey="jobs" stroke="#3b82f6" strokeWidth={2} name="Jobs"/>
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Jobs by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                  <XAxis dataKey="category" stroke="#6b7280"/>
                  <YAxis stroke="#6b7280"/>
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}/>
                  <Legend />
                  <Bar dataKey="count" fill="#8b5cf6" name="Jobs" radius={[8, 8, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>);
}
