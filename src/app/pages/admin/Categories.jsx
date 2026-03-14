import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { LayoutDashboard, Users, Briefcase, FileText, DollarSign, TrendingUp, UserCheck, Plus, Edit, Trash } from 'lucide-react';
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
const categories = [
    { id: '1', name: 'IT Support', requestCount: 145 },
    { id: '2', name: 'Maintenance', requestCount: 98 },
    { id: '3', name: 'Marketing', requestCount: 112 },
    { id: '4', name: 'Cleaning', requestCount: 87 },
    { id: '5', name: 'Security', requestCount: 76 },
    { id: '6', name: 'Consulting', requestCount: 124 },
    { id: '7', name: 'Design', requestCount: 103 },
    { id: '8', name: 'Device Maintenance', requestCount: 89 },
];
export default function Categories() {
    const [newCategory, setNewCategory] = useState('');
    const handleCreate = () => {
        toast.success(`Category "${newCategory}" created`);
        setNewCategory('');
    };
    const handleDelete = (name) => {
        toast.success(`Category "${name}" deleted`);
    };
    return (<DashboardLayout menuItems={menuItems} userRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Categories</h1>
            <p className="text-gray-600">Manage service categories</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4"/>
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Category Name</Label>
                  <Input placeholder="e.g., Legal Services" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}/>
                </div>
                <Button onClick={handleCreate} className="w-full">Create Category</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (<Card key={category.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Edit className="w-4 h-4"/>
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600" onClick={() => handleDelete(category.name)}>
                      <Trash className="w-4 h-4"/>
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{category.requestCount} requests</p>
              </CardContent>
            </Card>))}
        </div>
      </div>
    </DashboardLayout>);
}
