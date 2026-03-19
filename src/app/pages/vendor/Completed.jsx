import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { LayoutDashboard, Briefcase, Activity, CheckCircle, TrendingUp, Star } from 'lucide-react';
const menuItems = [
    { label: 'Dashboard', path: '/vendor/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Available Requests', path: '/vendor/available-requests', icon: <Briefcase className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/vendor/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Completed', path: '/vendor/completed', icon: <CheckCircle className="w-5 h-5"/> },
    { label: 'Analytics', path: '/vendor/analytics', icon: <TrendingUp className="w-5 h-5"/> },
];
const completed = [
    { id: '1', title: 'Office Cleaning Service', client: 'TechCorp', amount: 'EGP 2,800', completedDate: '2026-03-01', rating: 5, feedback: 'Excellent service!' },
    { id: '2', title: 'Logo Design', client: 'StartupABC', amount: 'EGP 1,500', completedDate: '2026-02-20', rating: 4, feedback: 'Great work, very professional' },
    { id: '3', title: 'Security Audit', client: 'FinanceInc', amount: 'EGP 8,500', completedDate: '2026-02-10', rating: 5, feedback: 'Thorough and detailed audit' },
];
export default function Completed() {
    return (<DashboardLayout menuItems={menuItems} userRole="vendor">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Completed Projects</h1>
          <p className="text-gray-600">View your successfully completed projects</p>
        </div>

        <div className="space-y-4">
          {completed.map((project) => (<Card key={project.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.title}</h3>
                    <p className="text-gray-600">Client: {project.client}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Completed</Badge>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Amount Earned</p>
                    <p className="font-semibold">{project.amount}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Completed Date</p>
                    <p className="font-semibold">{project.completedDate}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Rating</p>
                    <div className="flex items-center gap-1">
                      {[...Array(project.rating)].map((_, i) => (<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400"/>))}
                      <span className="font-semibold ml-1">{project.rating}.0</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Client Feedback</p>
                  <p className="text-gray-900 italic">"{project.feedback}"</p>
                </div>
              </CardContent>
            </Card>))}
        </div>
      </div>
    </DashboardLayout>);
}
