import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { LayoutDashboard, Users, Briefcase, FileText, DollarSign, TrendingUp, UserCheck, Plus, Edit, Trash, Search, FolderTree, Sparkles, Flame, ArrowUpRight, Activity } from 'lucide-react';
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
const initialCategories = [
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
  const itemsPerPage = 6;
    const [newCategory, setNewCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState(initialCategories);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [deletingCategory, setDeletingCategory] = useState(null);

    const totalRequests = categories.reduce((sum, category) => sum + category.requestCount, 0);
  const averageRequests = categories.length ? Math.round(totalRequests / categories.length) : 0;
  const topCategory = categories.length
    ? categories.reduce((top, current) => (current.requestCount > top.requestCount ? current : top), categories[0])
    : null;
    const filteredCategories = categories.filter((category) => category.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const orderedCategories = [...filteredCategories].sort((a, b) => b.requestCount - a.requestCount);
    const totalPages = Math.max(1, Math.ceil(orderedCategories.length / itemsPerPage));
    const normalizedCurrentPage = Math.min(currentPage, totalPages);
    const pageStartIndex = (normalizedCurrentPage - 1) * itemsPerPage;
    const paginatedCategories = orderedCategories.slice(pageStartIndex, pageStartIndex + itemsPerPage);

    const handleCreate = () => {
        const normalizedName = newCategory.trim();
        if (!normalizedName) {
            toast.error('Please enter a category name.');
            return;
        }

        const alreadyExists = categories.some((category) => category.name.toLowerCase() === normalizedName.toLowerCase());
        if (alreadyExists) {
            toast.error('This category already exists.');
            return;
        }

        const newCategoryItem = {
            id: `${Date.now()}`,
            name: normalizedName,
            requestCount: 0,
        };

        const updatedCategories = [...categories, newCategoryItem];
        setCategories(updatedCategories);
        setCurrentPage(Math.max(1, Math.ceil(updatedCategories.length / itemsPerPage)));

        toast.success(`Category "${normalizedName}" created`);
        setNewCategory('');
        setIsAddDialogOpen(false);
    };

    const handleEdit = () => {
        if (!editingCategory) {
            return;
        }

        const normalizedName = editCategoryName.trim();
        if (!normalizedName) {
            toast.error('Please enter a category name.');
            return;
        }

        const duplicateExists = categories.some(
            (category) => category.id !== editingCategory.id && category.name.toLowerCase() === normalizedName.toLowerCase(),
        );
        if (duplicateExists) {
            toast.error('This category already exists.');
            return;
        }

        setCategories((prev) => prev.map((category) => (category.id === editingCategory.id ? { ...category, name: normalizedName } : category)));
        toast.success(`Category "${editingCategory.name}" updated`);
        setEditingCategory(null);
        setEditCategoryName('');
    };

    const openEditDialog = (category) => {
        setEditingCategory(category);
        setEditCategoryName(category.name);
    };

    const handleDelete = () => {
        if (!deletingCategory) {
            return;
        }

        const updatedCategories = categories.filter((category) => category.id !== deletingCategory.id);
        setCategories(updatedCategories);
        setCurrentPage((prevPage) => Math.min(prevPage, Math.max(1, Math.ceil(updatedCategories.length / itemsPerPage))));
        const deletedName = deletingCategory.name;
        setDeletingCategory(null);
        toast.success(`Category "${deletedName}" deleted`);
    };

    const closeEditDialog = () => {
        setEditingCategory(null);
        setEditCategoryName('');
    };

    const closeDeleteDialog = () => {
        setDeletingCategory(null);
    };

    return (<DashboardLayout menuItems={menuItems} userRole="admin">
      <Dialog open={Boolean(editingCategory)} onOpenChange={(open) => {
          if (!open)
              closeEditDialog();
      }}>
        <DialogContent className="border border-indigo-100" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">Update the category name then save to apply changes.</p>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                placeholder="e.g., Legal Services"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
              />
            </div>
            <Button onClick={handleEdit} className="w-full bg-[#6f74ea] text-white hover:bg-[#5f64da]">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingCategory)} onOpenChange={(open) => {
          if (!open)
              closeDeleteDialog();
      }}>
        <DialogContent className="border border-red-100" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            {deletingCategory
                ? `Are you sure you want to delete "${deletingCategory.name}"? This action cannot be undone.`
                : 'Are you sure you want to delete this category?'}
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={closeDeleteDialog}>Cancel</Button>
            <Button className="flex-1 bg-red-600 text-white hover:bg-red-700" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-indigo-300/70 bg-gradient-to-r from-indigo-100 via-violet-100 to-fuchsia-100 p-6 shadow-[0_16px_36px_rgba(99,102,241,0.2)] md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-indigo-300/50 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-violet-300/45 blur-3xl" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-200/30 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-black text-indigo-800">Service Categories</h1>
              <p className="text-indigo-700/80">Manage service categories and monitor demand per segment.</p>
            </div>

            <Badge className="inline-flex w-fit items-center gap-2 rounded-xl border border-indigo-300 bg-indigo-50/90 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm">
              <FolderTree className="h-4 w-4" />
              Categories Control Center
            </Badge>
          </div>

          <div className="relative z-10 mt-5 flex flex-wrap items-center gap-2">
            <Badge className="border border-indigo-200 bg-white/75 text-indigo-700">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              Smart Segmentation
            </Badge>
            <Badge className="border border-fuchsia-200 bg-white/75 text-fuchsia-700">
              <Flame className="mr-1 h-3.5 w-3.5" />
              Live Demand Pulse
            </Badge>
            <Badge className="border border-cyan-200 bg-white/75 text-cyan-700">
              <Activity className="mr-1 h-3.5 w-3.5" />
              Performance Tracking
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6f74ea] text-white">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Total Categories</p>
                <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Avg. Requests</p>
                <p className="text-2xl font-bold text-slate-900">{averageRequests}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Top Category</p>
                <p className="text-base font-bold text-slate-900">{topCategory ? topCategory.name : '-'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200 bg-white/90 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-[#6f74ea] text-white hover:bg-[#5f64da]">
                    <Plus className="w-4 h-4"/>
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="border border-indigo-100" aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-slate-600">Create a new service category to organize incoming requests.</p>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Category Name</Label>
                      <Input placeholder="e.g., Legal Services" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}/>
                    </div>
                    <Button onClick={handleCreate} className="w-full bg-[#6f74ea] text-white hover:bg-[#5f64da]">Create Category</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedCategories.map((category, index) => {
            const demandPercent = topCategory && topCategory.requestCount > 0
              ? Math.round((category.requestCount / topCategory.requestCount) * 100)
              : 0;
            const categoryRank = pageStartIndex + index + 1;

            return (
            <Card key={category.id} className="group relative overflow-hidden border-0 bg-white shadow-[0_10px_28px_rgba(30,41,59,0.08)] ring-1 ring-indigo-100/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(99,102,241,0.18)] hover:ring-indigo-200">
              <CardContent className="relative p-6">
                <div className="pointer-events-none absolute -left-14 -top-16 h-32 w-32 rounded-full bg-indigo-200/30 blur-2xl" />
                <div className="pointer-events-none absolute -right-10 -bottom-16 h-36 w-36 rounded-full bg-violet-200/30 blur-2xl" />
                <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[#6f74ea] via-indigo-500 to-violet-500" />

                <div className="relative mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{category.name}</h3>
                    <p className="text-sm text-slate-500">Rank #{categoryRank} in demand</p>
                  </div>
                  <Badge className="border border-indigo-200 bg-indigo-50 text-indigo-700">{category.requestCount} requests</Badge>
                </div>

                <div className="relative mb-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-indigo-700">
                    <span>Demand Meter</span>
                    <span>{demandPercent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-indigo-100">
                    <div className="h-2 rounded-full bg-gradient-to-r from-[#6f74ea] via-indigo-500 to-cyan-500 transition-all duration-500" style={{ width: `${demandPercent}%` }} />
                  </div>
                </div>

                <div className="relative flex gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 p-2">
                  <Button size="sm" variant="outline" className="h-9 flex-1 gap-2 border-slate-300 text-slate-700 hover:border-[#6f74ea] hover:text-[#6f74ea]" onClick={() => openEditDialog(category)}>
                    <Edit className="w-4 h-4"/>
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="h-9 flex-1 gap-2 border-red-200 text-red-600 hover:bg-red-50" onClick={() => setDeletingCategory(category)}>
                    <Trash className="w-4 h-4"/>
                    Delete
                  </Button>
                </div>

                {topCategory && category.id === topCategory.id && (
                  <div className="relative mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Highest performing category this period
                  </div>
                )}
              </CardContent>
            </Card>
            );
          })}
        </div>

        {orderedCategories.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white/80 p-3">
            <p className="text-sm text-slate-600">
              Page {normalizedCurrentPage} of {totalPages}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={normalizedCurrentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                <Button
                  key={page}
                  size="sm"
                  variant={page === normalizedCurrentPage ? 'default' : 'outline'}
                  className={page === normalizedCurrentPage ? 'bg-[#6f74ea] text-white hover:bg-[#5f64da]' : ''}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={normalizedCurrentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {filteredCategories.length === 0 && (
          <Card className="border border-slate-200 bg-slate-50/80">
            <CardContent className="p-8 text-center">
              <p className="text-slate-600">No categories match your search.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>);
}
