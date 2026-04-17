import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    FileText,
    DollarSign,
    TrendingUp,
    UserCheck,
    Plus,
    Edit,
    Trash,
    Search,
    FolderTree,
    Sparkles,
    Flame,
    ArrowUpRight,
    Activity,
    Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import {
    createCategoryApi,
    deleteCategoryApi,
    getAdminCategoriesApi,
    updateCategoryApi,
} from '../../services/categoriesApi';

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

export default function Categories() {
    const itemsPerPage = 6;
    const { user } = useAuth();
    const [newCategory, setNewCategory] = useState('');
    const [newCategoryDescription, setNewCategoryDescription] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState([]);
    const [summary, setSummary] = useState({
        totalCategories: 0,
        totalVendors: 0,
        averageRequests: 0,
        topCategoryName: '',
        topCategoryRequestCount: 0,
    });
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editCategoryName, setEditCategoryName] = useState('');
    const [editCategoryDescription, setEditCategoryDescription] = useState('');
    const [deletingCategory, setDeletingCategory] = useState(null);
    const [viewingCategory, setViewingCategory] = useState(null);

    const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
    const normalizedCurrentPage = Math.min(currentPage, totalPages);
    const paginatedCategories = categories;

    useEffect(() => {
        const loadCategories = async () => {
            if (!user?.token) {
                setCategories([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const response = await getAdminCategoriesApi({
                    token: user.token,
                    search: searchQuery,
                    pageIndex: normalizedCurrentPage,
                    pageSize: itemsPerPage,
                });
                const summaryData = response?.summary || {};
                const categoryResult = response?.categories || {};
                setSummary({
                    totalCategories: summaryData.totalCategories || 0,
                    totalVendors: summaryData.totalVendors || 0,
                    averageRequests: summaryData.averageRequests || 0,
                    topCategoryName: summaryData.topCategoryName || '',
                    topCategoryRequestCount: summaryData.topCategoryRequestCount || 0,
                });
                setCategories(Array.isArray(categoryResult.data) ? categoryResult.data : []);
                setTotalCount(categoryResult.count || 0);
            } catch (error) {
                toast.error(error.message || 'Failed to load categories.');
            } finally {
                setIsLoading(false);
            }
        };

        loadCategories();
    }, [user?.token, searchQuery, normalizedCurrentPage, refreshKey]);

    const handleCreate = async () => {
        const normalizedName = newCategory.trim();
        const normalizedDescription = newCategoryDescription.trim();

        if (!normalizedName) {
            toast.error('Please enter a category name.');
            return;
        }

        if (!user?.token) {
            toast.error('You are not authorized. Please log in again.');
            return;
        }

        setIsSubmitting(true);
        try {
            await createCategoryApi({
                categoryName: normalizedName,
                description: normalizedDescription,
                token: user.token,
            });
            toast.success(`Category "${normalizedName}" created`);
            setNewCategory('');
            setNewCategoryDescription('');
            setIsAddDialogOpen(false);
            setCurrentPage(1);
            setRefreshKey((prev) => prev + 1);
        } catch (error) {
            toast.error(error.message || 'Failed to create category.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = async () => {
        if (!editingCategory) {
            return;
        }

        const normalizedName = editCategoryName.trim();
        const normalizedDescription = editCategoryDescription.trim();

        if (!normalizedName) {
            toast.error('Please enter a category name.');
            return;
        }

        if (!user?.token) {
            toast.error('You are not authorized. Please log in again.');
            return;
        }

        setIsSubmitting(true);
        try {
            await updateCategoryApi({
                categoryId: editingCategory.id,
                categoryName: normalizedName,
                description: normalizedDescription,
                token: user.token,
            });
            toast.success(`Category "${editingCategory.name}" updated`);
            setEditingCategory(null);
            setEditCategoryName('');
            setEditCategoryDescription('');
            setRefreshKey((prev) => prev + 1);
        } catch (error) {
            toast.error(error.message || 'Failed to update category.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditDialog = (category) => {
        setEditingCategory(category);
        setEditCategoryName(category.name);
        setEditCategoryDescription(category.description || '');
    };

    const handleDelete = async () => {
        if (!deletingCategory) {
            return;
        }
        if (!user?.token) {
            toast.error('You are not authorized. Please log in again.');
            return;
        }

        setIsSubmitting(true);
        try {
            await deleteCategoryApi({ categoryId: deletingCategory.id, token: user.token });
            const deletedName = deletingCategory.name;
            setDeletingCategory(null);
            if (categories.length === 1 && currentPage > 1) {
                setCurrentPage((prev) => prev - 1);
            }
            setRefreshKey((prev) => prev + 1);
            toast.success(`Category "${deletedName}" deleted`);
        } catch (error) {
            toast.error(error.message || 'Failed to delete category.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeEditDialog = () => {
        setEditingCategory(null);
        setEditCategoryName('');
        setEditCategoryDescription('');
    };

    const closeDeleteDialog = () => {
        setDeletingCategory(null);
    };

    const closeViewDialog = () => {
        setViewingCategory(null);
    };

    return (
        <DashboardLayout menuItems={menuItems} userRole="admin">
            <Dialog
                open={Boolean(editingCategory)}
                onOpenChange={(open) => {
                    if (!open) {
                        closeEditDialog();
                    }
                }}
            >
                <DialogContent className="border border-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Update the category details then save to apply changes.</p>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Category Name</Label>
                            <Input
                                placeholder="e.g., Legal Services"
                                value={editCategoryName}
                                onChange={(e) => setEditCategoryName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                placeholder="Briefly describe what this category covers"
                                value={editCategoryDescription}
                                onChange={(e) => setEditCategoryDescription(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleEdit} disabled={isSubmitting} className="w-full bg-[#6f74ea] text-white hover:bg-[#5f64da]">
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(viewingCategory)}
                onOpenChange={(open) => {
                    if (!open) {
                        closeViewDialog();
                    }
                }}
            >
                <DialogContent className="border border-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>View Category</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Review category details including request and vendor activity.</p>

                    {viewingCategory && (
                        <div className="space-y-3 py-2">
                            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/80">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category Name</p>
                                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{viewingCategory.name}</p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/85">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</p>
                                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{viewingCategory.description || 'No description provided yet.'}</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-3 dark:border-indigo-400/30 dark:bg-indigo-500/18">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Requests</p>
                                    <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{viewingCategory.requestCount}</p>
                                </div>
                                <div className="rounded-lg border border-cyan-100 bg-cyan-50/70 p-3 dark:border-cyan-400/30 dark:bg-cyan-500/18">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Vendors</p>
                                    <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{viewingCategory.vendorCount}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(deletingCategory)}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDeleteDialog();
                    }
                }}
            >
                <DialogContent className="border border-red-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>Delete Category</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        {deletingCategory
                            ? `Are you sure you want to delete "${deletingCategory.name}"? This action cannot be undone.`
                            : 'Are you sure you want to delete this category?'}
                    </p>
                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1" onClick={closeDeleteDialog}>Cancel</Button>
                        <Button className="flex-1 bg-red-600 text-white hover:bg-red-700" onClick={handleDelete} disabled={isSubmitting}>
                            {isSubmitting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="space-y-6">
                <div className="relative overflow-hidden rounded-3xl border border-indigo-300/70 bg-gradient-to-r from-indigo-100 via-violet-100 to-fuchsia-100 p-6 shadow-[0_16px_36px_rgba(99,102,241,0.2)] md:p-8 dark:border-indigo-400/30 dark:bg-gradient-to-r dark:from-[#1a2745] dark:via-[#233861] dark:to-[#2b4a75] dark:shadow-[0_18px_40px_rgba(2,6,23,0.5)]">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500" />
                    <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-indigo-300/50 blur-3xl dark:bg-indigo-500/16" />
                    <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-violet-300/45 blur-3xl dark:bg-violet-500/14" />
                    <div className="pointer-events-none absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-200/30 blur-3xl dark:bg-fuchsia-500/12" />

                    <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="mb-2 text-3xl font-black text-indigo-800 dark:text-indigo-100">Service Categories</h1>
                            <p className="text-indigo-700/80 dark:text-indigo-200/85">Manage service categories and monitor demand per segment.</p>
                        </div>

                        <Badge className="inline-flex w-fit items-center gap-2 rounded-xl border border-indigo-300 bg-indigo-50/90 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm dark:border-indigo-400/30 dark:bg-slate-900/80 dark:text-indigo-200 dark:shadow-none">
                            <FolderTree className="h-4 w-4" />
                            Categories Control Center
                        </Badge>
                    </div>

                    <div className="relative z-10 mt-5 flex flex-wrap items-center gap-2">
                        <Badge className="border border-indigo-200 bg-white/75 text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-500/14 dark:text-indigo-200">
                            <Sparkles className="mr-1 h-3.5 w-3.5" />
                            Smart Segmentation
                        </Badge>
                        <Badge className="border border-fuchsia-200 bg-white/75 text-fuchsia-700 dark:border-fuchsia-400/30 dark:bg-fuchsia-500/14 dark:text-fuchsia-200">
                            <Flame className="mr-1 h-3.5 w-3.5" />
                            Live Demand Pulse
                        </Badge>
                        <Badge className="border border-cyan-200 bg-white/75 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-500/14 dark:text-cyan-200">
                            <Activity className="mr-1 h-3.5 w-3.5" />
                            Performance Tracking
                        </Badge>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 shadow-sm dark:border-indigo-400/30 dark:bg-gradient-to-br dark:from-indigo-500/24 dark:to-violet-500/20 dark:shadow-none">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6f74ea] text-white">
                                <Briefcase className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Total Categories</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.totalCategories}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-sm dark:border-blue-400/30 dark:bg-gradient-to-br dark:from-blue-500/24 dark:to-cyan-500/20 dark:shadow-none">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Total Vendors</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.totalVendors}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm dark:border-emerald-400/30 dark:bg-gradient-to-br dark:from-emerald-500/24 dark:to-teal-500/20 dark:shadow-none">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Avg Requests</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.averageRequests}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border border-slate-200 bg-white/90 shadow-sm dark:border-slate-600 dark:bg-slate-800/78 dark:shadow-none">
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
                                    className="pl-10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
                                />
                            </div>

                            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2 bg-[#6f74ea] text-white hover:bg-[#5f64da]">
                                        <Plus className="w-4 h-4"/>
                                        Add Category
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="border border-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" aria-describedby={undefined}>
                                    <DialogHeader>
                                        <DialogTitle>Add New Category</DialogTitle>
                                    </DialogHeader>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Create a category with name and description to organize requests.</p>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Category Name</Label>
                                            <Input
                                                placeholder="e.g., Legal Services"
                                                value={newCategory}
                                                onChange={(e) => setNewCategory(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Input
                                                placeholder="Briefly describe what this category covers"
                                                value={newCategoryDescription}
                                                onChange={(e) => setNewCategoryDescription(e.target.value)}
                                            />
                                        </div>
                                        <Button onClick={handleCreate} disabled={isSubmitting} className="w-full bg-[#6f74ea] text-white hover:bg-[#5f64da]">
                                            {isSubmitting ? 'Creating...' : 'Create Category'}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedCategories.map((category, index) => {
                        const demandPercent = typeof category.demandMeter === 'number'
                            ? category.demandMeter
                            : 0;
                        const categoryRank = typeof category.demandRank === 'number'
                            ? category.demandRank
                            : ((normalizedCurrentPage - 1) * itemsPerPage) + index + 1;

                        return (
                            <Card
                                key={category.id}
                                className="group relative overflow-hidden border-0 bg-white shadow-[0_10px_28px_rgba(30,41,59,0.08)] ring-1 ring-indigo-100/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(99,102,241,0.18)] hover:ring-indigo-200 dark:bg-slate-700/70 dark:ring-indigo-400/25 dark:shadow-none dark:hover:shadow-none dark:hover:ring-indigo-400/40"
                            >
                                <CardContent className="relative p-6">
                                    <div className="pointer-events-none absolute -left-14 -top-16 h-32 w-32 rounded-full bg-indigo-200/30 blur-2xl dark:bg-indigo-500/20" />
                                    <div className="pointer-events-none absolute -right-10 -bottom-16 h-36 w-36 rounded-full bg-violet-200/30 blur-2xl dark:bg-violet-500/20" />
                                    <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[#6f74ea] via-indigo-500 to-violet-500" />

                                    <div className="relative mb-4 flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{category.name}</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Rank #{categoryRank} in demand</p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Badge className="border border-indigo-200 bg-indigo-50 text-indigo-700">{category.requestCount} requests</Badge>
                                            <Badge className="border border-cyan-200 bg-cyan-50 text-cyan-700">{category.vendorCount} vendors</Badge>
                                        </div>
                                    </div>

                                    <p className="relative mb-5 text-sm text-slate-600 line-clamp-2 dark:text-slate-200">{category.description || 'No description provided yet.'}</p>

                                    <div className="relative mb-5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 dark:border-indigo-400/30 dark:bg-indigo-500/28">
                                        <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-200">
                                            <span>Demand Meter</span>
                                            <span>{demandPercent}%</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-indigo-100">
                                            <div
                                                className="h-2 rounded-full bg-gradient-to-r from-[#6f74ea] via-indigo-500 to-cyan-500 transition-all duration-500"
                                                style={{ width: `${demandPercent}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="relative mt-1 flex gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5 dark:border-slate-500 dark:bg-slate-700/55">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-9 flex-1 gap-2 border-indigo-200 bg-indigo-100/90 text-indigo-800 hover:bg-indigo-200 dark:border-indigo-300/35 dark:bg-indigo-300/20 dark:text-indigo-100 dark:hover:bg-indigo-300/30"
                                            onClick={() => setViewingCategory(category)}
                                        >
                                            <Eye className="w-4 h-4"/>
                                            View
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-9 flex-1 gap-2 border-emerald-200 bg-emerald-100/90 text-emerald-800 hover:bg-emerald-200 dark:border-emerald-400/35 dark:bg-emerald-500/20 dark:text-emerald-100 dark:hover:bg-emerald-500/30"
                                            onClick={() => openEditDialog(category)}
                                        >
                                            <Edit className="w-4 h-4"/>
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-9 flex-1 gap-2 border-red-200 text-red-600 hover:bg-red-50"
                                            onClick={() => setDeletingCategory(category)}
                                        >
                                            <Trash className="w-4 h-4"/>
                                            Delete
                                        </Button>
                                    </div>

                                    {summary.topCategoryName && category.name === summary.topCategoryName && (
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

                {!isLoading && totalCount > 0 && (
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

                {isLoading && (
                    <Card className="border border-slate-200 bg-slate-50/80">
                        <CardContent className="p-8 text-center">
                            <p className="text-slate-600">Loading categories...</p>
                        </CardContent>
                    </Card>
                )}

                {!isLoading && totalCount === 0 && (
                    <Card className="border border-slate-200 bg-slate-50/80">
                        <CardContent className="p-8 text-center">
                            <p className="text-slate-600">No categories match your search.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
