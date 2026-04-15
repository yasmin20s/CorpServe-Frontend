import DashboardLayout from '../../components/DashboardLayout';
import StatsCard from '../../components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { FileText, CheckCircle, Clock, DollarSign, TrendingUp, Package, LayoutDashboard, PlusCircle, FileStack, Activity, Wallet, } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
const menuItems = [
    { label: 'Dashboard', path: '/client/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Create Request', path: '/client/create-request', icon: <PlusCircle className="w-5 h-5"/> },
    { label: 'My Requests', path: '/client/my-requests', icon: <FileStack className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/client/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Payments', path: '/client/payments', icon: <Wallet className="w-5 h-5"/> },
];
const spendingData = [
    { month: 'Jan', amount: 4500 },
    { month: 'Feb', amount: 5200 },
    { month: 'Mar', amount: 4800 },
    { month: 'Apr', amount: 6100 },
    { month: 'May', amount: 5700 },
    { month: 'Jun', amount: 7200 },
];
const statusData = [
    { name: 'Completed', value: 45, color: '#10b981' },
    { name: 'Active', value: 25, color: '#3b82f6' },
    { name: 'Pending', value: 20, color: '#f59e0b' },
    { name: 'Cancelled', value: 10, color: '#ef4444' },
];
export default function ClientDashboard() {
    return (<DashboardLayout menuItems={menuItems} userRole="client">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your overview.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatsCard title="Total Requests" value="128" icon={FileText} iconColor="text-blue-600" iconBgColor="bg-blue-100" trend={{ value: '12% from last month', isPositive: true }}/>
          <StatsCard title="Active" value="25" icon={Clock} iconColor="text-orange-600" iconBgColor="bg-orange-100"/>
          <StatsCard title="Completed" value="89" icon={CheckCircle} iconColor="text-green-600" iconBgColor="bg-green-100"/>
          <StatsCard title="Pending Payments" value="EGP 5,400" icon={DollarSign} iconColor="text-red-600" iconBgColor="bg-red-100"/>
          <StatsCard title="Total Spent" value="EGP 127,500" icon={TrendingUp} iconColor="text-purple-600" iconBgColor="bg-purple-100" trend={{ value: '8% from last month', isPositive: true }}/>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Spending Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Monthly Spending</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={spendingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                  <XAxis dataKey="month" stroke="#6b7280"/>
                  <YAxis stroke="#6b7280"/>
                  <Tooltip contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
        }}/>
                  <Legend />
                  <Bar dataKey="amount" fill="#3b82f6" name="Amount (EGP)" radius={[8, 8, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Request Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {statusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
            {
                title: 'IT Infrastructure Setup',
                category: 'IT Support',
                status: 'Active',
                vendor: 'TechPro Solutions',
                progress: 65,
            },
            {
                title: 'Office Cleaning Service',
                category: 'Cleaning',
                status: 'Completed',
                vendor: 'CleanCo Services',
                progress: 100,
            },
            {
                title: 'Marketing Campaign Design',
                category: 'Marketing',
                status: 'Active',
                vendor: 'Creative Agency',
                progress: 40,
            },
            {
                title: 'Security System Installation',
                category: 'Security',
                status: 'Pending',
                vendor: '3 proposals',
                progress: 0,
            },
        ].map((request, index) => (<div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-600"/>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{request.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600">{request.category}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-600">{request.vendor}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${request.status === 'Completed'
                ? 'bg-green-100 text-green-700'
                : request.status === 'Active'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'}`}>
                        {request.status}
                      </div>
                      {request.progress > 0 && (<p className="text-sm text-gray-600 mt-1">{request.progress}% Complete</p>)}
                    </div>
                  </div>
                </div>))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>);
}
