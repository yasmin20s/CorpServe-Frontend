import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { LayoutDashboard, Briefcase, Activity, CheckCircle, Star, Clock, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
const menuItems = [
    { label: 'Dashboard', path: '/vendor/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Available Requests', path: '/vendor/available-requests', icon: <Briefcase className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/vendor/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Completed', path: '/vendor/completed', icon: <CheckCircle className="w-5 h-5"/> },
    { label: 'Analytics', path: '/vendor/analytics', icon: <TrendingUp className="w-5 h-5"/> },
];
const earningsData = [
    { month: 'Jan', earnings: 15000 },
    { month: 'Feb', earnings: 18500 },
    { month: 'Mar', earnings: 22000 },
    { month: 'Apr', earnings: 19500 },
    { month: 'May', earnings: 24000 },
    { month: 'Jun', earnings: 28000 },
];
const completionData = [
    { status: 'On Time', count: 45 },
    { status: 'Delayed', count: 5 },
];
export default function VendorDashboard() {
    return (<DashboardLayout menuItems={menuItems} userRole="vendor">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Dashboard</h1>
          <p className="text-gray-600">Track your performance and manage requests</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatsCard title="Total Jobs" value="127" icon={Briefcase} iconColor="text-blue-600" iconBgColor="bg-blue-100"/>
          <StatsCard title="Active" value="8" icon={Activity} iconColor="text-orange-600" iconBgColor="bg-orange-100"/>
          <StatsCard title="Completed" value="115" icon={CheckCircle} iconColor="text-green-600" iconBgColor="bg-green-100"/>
          <StatsCard title="Rating" value="4.8" icon={Star} iconColor="text-yellow-600" iconBgColor="bg-yellow-100"/>
          <StatsCard title="Avg Response" value="2.3h" icon={Clock} iconColor="text-purple-600" iconBgColor="bg-purple-100"/>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={earningsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                  <XAxis dataKey="month" stroke="#6b7280"/>
                  <YAxis stroke="#6b7280"/>
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}/>
                  <Legend />
                  <Line type="monotone" dataKey="earnings" stroke="#3b82f6" strokeWidth={2} name="Earnings (EGP)"/>
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={completionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                  <XAxis dataKey="status" stroke="#6b7280"/>
                  <YAxis stroke="#6b7280"/>
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}/>
                  <Legend />
                  <Bar dataKey="count" fill="#10b981" name="Projects" radius={[8, 8, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>);
}
