import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import DashboardLayout from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Bot, Upload, Sparkles, LayoutDashboard, PlusCircle, FileStack, Activity, Wallet, ChevronRight, FileText, X, AlertTriangle } from 'lucide-react';
import { toast } from '../../lib/toast';
import { useAuth } from '../../hooks/useAuth';
import { getCategoriesApi } from '../../services/categoriesApi';
import { createRequestApi, generateRequestEstimateApi } from '../../services/requestsApi';
import { calendarDateToIsoUtc, formatDeadlineDate, parseDdMmYyyy } from '../../lib/formatDeadlineDate';
import DeadlineCalendarPicker from '../../components/DeadlineCalendarPicker';
const menuItems = [
    { label: 'Dashboard', path: '/client/dashboard', icon: <LayoutDashboard size={20}/> },
    { label: 'Create Request', path: '/client/create-request', icon: <PlusCircle size={20}/> },
    { label: 'My Requests', path: '/client/my-requests', icon: <FileStack size={20}/> },
    { label: 'Active Requests', path: '/client/active-requests', icon: <Activity size={20}/> },
    { label: 'Payments', path: '/client/payments', icon: <Wallet size={20}/> },
];

export default function CreateRequest() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isEstimating, setIsEstimating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        budgetMin: '',
        budgetMax: '',
        deadline: '',
    });
    const [aiEstimate, setAiEstimate] = useState(null);
    const [aiEstimateError, setAiEstimateError] = useState(null);
    const [requestReviewWarning, setRequestReviewWarning] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data = await getCategoriesApi();
                setCategories(Array.isArray(data) ? data : []);
            } catch (error) {
                toast.error(error.message || 'Failed to load categories');
            }
        };

        loadCategories();
    }, []);

    useEffect(() => {
        if (!aiEstimateError) return;
        setAiEstimateError(null);
    }, [formData.title, formData.description, formData.category, formData.budgetMin, formData.budgetMax, formData.deadline]);

    useEffect(() => {
        if (!requestReviewWarning) return;
        setRequestReviewWarning(null);
    }, [formData.title, formData.description, formData.category, formData.budgetMin, formData.budgetMax, formData.deadline]);

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleAttachmentsChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setAttachments((prev) => {
            const existing = new Set(prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
            const merged = [...prev];

            files.forEach((file) => {
                const key = `${file.name}-${file.size}-${file.lastModified}`;
                if (!existing.has(key)) {
                    merged.push(file);
                }
            });

            return merged;
        });

        e.target.value = '';
    };

    const removeAttachment = (targetFile) => {
        setAttachments((prev) => prev.filter((file) => !(file.name === targetFile.name && file.size === targetFile.size && file.lastModified === targetFile.lastModified)));
    };

    const aiEstimateView = useMemo(() => {
        if (!aiEstimate) return null;
        const estimatedDate = new Date(aiEstimate.estimatedTime);
        return {
            cost: `EGP ${Number(aiEstimate.estimatedCost || 0).toLocaleString()}`,
            time: Number.isNaN(estimatedDate.getTime()) ? '-' : formatDeadlineDate(estimatedDate),
            confidence: aiEstimate.confidence ?? 0,
        };
    }, [aiEstimate]);

    const generateAIEstimate = async () => {
        if (!formData.budgetMin || !formData.budgetMax || !formData.title) {
            toast.error('Please fill in Title and Budget first for accurate estimation');
            return;
        }
        if (!formData.category) {
            toast.error('Please select category first');
            return;
        }
        const deadlineDate = parseDdMmYyyy(formData.deadline);
        if (!deadlineDate) {
            toast.error('Enter a valid deadline as dd/mm/yyyy');
            return;
        }
        if (!user?.token) {
            toast.error('Please login first');
            return;
        }

        setIsEstimating(true);
        setAiEstimateError(null);
        try {
            const estimate = await generateRequestEstimateApi({
                title: formData.title.trim(),
                description: formData.description.trim(),
                categoryId: formData.category,
                expectedDeadline: calendarDateToIsoUtc(deadlineDate),
                budgetMin: Number(formData.budgetMin),
                budgetMax: Number(formData.budgetMax),
                token: user.token,
            });
            setAiEstimate(estimate);
            toast.success('AI estimation updated based on your data');
        } catch (error) {
            const isUnauthorized = error?.status === 401;
            const isForbidden = error?.status === 403;
            const readableError = isUnauthorized
                ? 'Your session appears to be expired. Please login again, then try generating the estimate.'
                : isForbidden
                    ? 'This action is allowed for client accounts only. Please login with a client account.'
                    : error?.message || 'We could not generate an AI estimate. Please improve request details and try again.';
            const errorTitle = isUnauthorized
                ? 'Authentication required'
                : isForbidden
                    ? 'Access denied'
                    : 'AI needs clearer request details';
            setAiEstimate(null);
            setAiEstimateError({
                title: errorTitle,
                message: readableError,
                tone: isUnauthorized || isForbidden ? 'red' : 'amber',
            });
        } finally {
            setIsEstimating(false);
        }
    };

    const isAiClarityError = (error) => {
        const message = (error?.message || '').toLowerCase();
        const title = (error?.payload?.title || '').toLowerCase();
        const payloadErrors = error?.payload?.errors;

        const hasUnclearRequestKeyInPayload = (() => {
            if (!payloadErrors) return false;
            if (Array.isArray(payloadErrors)) {
                return payloadErrors.some((entry) => (entry?.key || '').toLowerCase().includes('ai.unclearrequest'));
            }
            if (typeof payloadErrors === 'object') {
                return Object.keys(payloadErrors).some((key) => key.toLowerCase().includes('ai.unclearrequest'));
            }
            return false;
        })();

        return message.includes('ai needs clearer request details')
            || message.includes('ai.unclearrequest')
            || message.includes('cannot generate a realistic estimate')
            || message.includes('please include:')
            || message.includes('please add:')
            || title.includes('ai.unclearrequest')
            || hasUnclearRequestKeyInPayload;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user?.token) {
            toast.error('Please login first');
            return;
        }
        if (!formData.category) {
            toast.error('Please select a category');
            return;
        }
        const deadlineDate = parseDdMmYyyy(formData.deadline);
        if (!deadlineDate) {
            toast.error('Enter a valid deadline as dd/mm/yyyy');
            return;
        }

        setIsSubmitting(true);
        setAiEstimateError(null);
        setRequestReviewWarning(null);
        try {
            await createRequestApi({
                title: formData.title.trim(),
                description: formData.description.trim(),
                categoryId: formData.category,
                expectedDeadline: calendarDateToIsoUtc(deadlineDate),
                budgetMin: Number(formData.budgetMin),
                budgetMax: Number(formData.budgetMax),
                estimatedCost: aiEstimate?.estimatedCost,
                estimatedTime: aiEstimate?.estimatedTime,
                confidence: aiEstimate?.confidence,
                attachments,
                token: user.token,
            });
            toast.success('Request created successfully!');
            navigate('/client/my-requests');
        } catch (error) {
            if (isAiClarityError(error)) {
                setRequestReviewWarning({
                    title: 'Request clarity review warning',
                    message: error.message || 'Please add clearer details before submitting this request.',
                });
                return;
            }
            toast.error(error.message || 'Failed to create request');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout menuItems={menuItems} userRole="client">
            <div className="space-y-6">
                
                {/* Header Card */}
                <Card className="relative overflow-hidden rounded-3xl border border-indigo-300/70 bg-gradient-to-r from-indigo-100 via-violet-100 to-blue-100 p-6 shadow-[0_16px_36px_rgba(79,70,229,0.2)] dark:border-indigo-400/25 dark:bg-gradient-to-r dark:from-[#121a35] dark:via-[#1c2a52] dark:to-[#1c3a69] dark:shadow-[0_18px_44px_rgba(2,6,23,0.56)] md:p-8">
                    <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(99,102,241,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.16)_1px,transparent_1px)] [background-size:34px_34px] dark:opacity-20" />
                    <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-indigo-300/45 blur-3xl dark:bg-indigo-500/30" />
                    <div className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-blue-300/40 blur-3xl dark:bg-blue-500/24" />

                    <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-300/80 bg-white/85 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-indigo-700 shadow-[0_8px_20px_rgba(79,70,229,0.22)] dark:border-indigo-300/35 dark:bg-indigo-500/18 dark:text-indigo-100">
                                <Sparkles className="h-3.5 w-3.5" />
                                Request Studio
                            </p>
                            <h1 className="mb-2 text-3xl font-black text-indigo-900 dark:text-slate-100">Create New Request</h1>
                            <p className="text-indigo-800/80 dark:text-slate-300">Fill in request details, add budget and timeline, then submit your service request.</p>
                        </div>
                        <Button type="button" className="gap-2 bg-[#6f74ea] text-white hover:bg-[#5f64da]" onClick={() => navigate('/client/my-requests')}>
                            <FileStack className="h-4 w-4" />
                            My Requests
                        </Button>
                    </div>
                </Card>

                <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl mx-auto">
                    
                    {/* Main Details Card */}
                    <Card className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-slate-700/70 dark:bg-slate-900/78 dark:shadow-[0_16px_34px_rgba(2,6,23,0.52)]">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="font-semibold text-[#1e293b] dark:text-slate-200">Request Title</Label>
                                    <Input 
                                        placeholder="e.g., IT Infrastructure Setup" 
                                        className="rounded-xl border-none bg-[#f1f3f7] py-6 dark:bg-slate-950/65 dark:text-slate-100 dark:placeholder:text-slate-400"
                                        value={formData.title} 
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                                        maxLength={200}
                                        required 
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{formData.title.length}/200</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold leading-none text-[#1e293b] dark:text-slate-200">Category</Label>
                                        <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                                            <SelectTrigger className="!h-auto rounded-xl border-none bg-[#f1f3f7] py-6 text-sm text-gray-500 dark:bg-slate-950/65 dark:text-slate-100">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-none shadow-lg dark:bg-slate-900 dark:text-slate-100">
                                                {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="create-request-deadline" className="text-sm font-semibold leading-none text-[#1e293b] dark:text-slate-200">
                                            Deadline
                                        </Label>
                                        <DeadlineCalendarPicker
                                            id="create-request-deadline"
                                            value={formData.deadline}
                                            onChange={(deadline) => setFormData({ ...formData, deadline })}
                                            placeholder="dd/mm/yyyy"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-semibold text-[#1e293b] dark:text-slate-200">Description</Label>
                                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                        Write 1-3 short sentences: what service you need, key tasks, and expected result.
                                        Clear and specific descriptions help vendors understand your needs and provide accurate proposals.
                                    </p>
                                    <Textarea 
                                        placeholder="Example: What do you need? What are the key tasks? What is the expected result?" 
                                        rows={4} 
                                        className="resize-none rounded-xl border-none bg-[#f1f3f7] p-4 dark:bg-slate-950/65 dark:text-slate-100 dark:placeholder:text-slate-400"
                                        value={formData.description} 
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                                        maxLength={500}
                                        required 
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{formData.description.length}/500</p>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <Label className="font-semibold italic text-[#1e293b] dark:text-slate-200">Attachments (Optional)</Label>
                                    <div className="flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-gray-100 bg-[#fafbfc] p-10 transition-all hover:border-[#6366f1]/30 dark:border-slate-700 dark:bg-slate-900/68 dark:hover:border-indigo-400/40">
                                        <Upload className="mb-4 h-10 w-10 text-gray-300 dark:text-slate-500" strokeWidth={1.5}/>
                                        <p className="mb-5 text-center text-sm text-gray-400 dark:text-slate-400">Upload supporting documents, images, or files</p>
                                        <label htmlFor="attachments" className="cursor-pointer">
                                            <div className="rounded-xl border border-gray-200 bg-white px-8 py-2 font-semibold text-gray-600 shadow-sm transition-all hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                                                Choose Files
                                            </div>
                                            <input id="attachments" type="file" className="hidden" multiple onChange={handleAttachmentsChange}/>
                                        </label>

                                        {attachments.length > 0 && (
                                            <div className="mt-6 w-full max-w-2xl space-y-2">
                                                {attachments.map((file) => (
                                                    <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center justify-between rounded-xl border border-indigo-100 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900/80">
                                                        <div className="min-w-0 flex items-center gap-2">
                                                            <FileText className="h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-300" />
                                                            <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{file.name}</p>
                                                            <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">({formatFileSize(file.size)})</span>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 px-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/15 dark:hover:text-red-300"
                                                            onClick={() => removeAttachment(file)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Budget & AI Prediction Section */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900/78">
                            <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-slate-400">Budget Range</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-gray-400 dark:text-slate-400">Min (EGP)</Label>
                                    <Input type="number" placeholder="e.g., 5000" className="rounded-xl border-none bg-[#f1f3f7] py-6 dark:bg-slate-950/65 dark:text-slate-100 dark:placeholder:text-slate-400" value={formData.budgetMin} onChange={(e)=>setFormData({...formData, budgetMin: e.target.value})} required/>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase text-gray-400 dark:text-slate-400">Max (EGP)</Label>
                                    <Input type="number" placeholder="e.g., 10000" className="rounded-xl border-none bg-[#f1f3f7] py-6 dark:bg-slate-950/65 dark:text-slate-100 dark:placeholder:text-slate-400" value={formData.budgetMax} onChange={(e)=>setFormData({...formData, budgetMax: e.target.value})} required/>
                                </div>
                            </div>
                        </Card>

                        <Card className={`rounded-[24px] border border-slate-200 p-8 shadow-sm transition-all duration-500 dark:border-slate-700 ${aiEstimate ? 'bg-[#f5f3ff] dark:bg-indigo-950/35' : 'bg-[#f1f3f7] dark:bg-slate-900/72'}`}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#6366f1] dark:text-indigo-300">
                                    <Bot size={18}/> AI Prediction
                                </h3>
                                <Button 
                                    type="button" 
                                    size="sm" 
                                    onClick={generateAIEstimate} 
                                    disabled={isEstimating}
                                    className="bg-[#6366f1] hover:bg-[#5558e6] text-white rounded-full px-4"
                                >
                                    <Sparkles size={14} className={`mr-2 ${isEstimating ? 'animate-spin' : ''}`}/> 
                                    {isEstimating ? 'Analyzing...' : aiEstimate ? 'Recalculate' : 'Generate Estimate'}
                                </Button>
                            </div>

                            {aiEstimateError && (
                                <div
                                    className={`mb-5 rounded-xl p-4 ${
                                        aiEstimateError.tone === 'red'
                                            ? 'border border-red-300 bg-red-50 text-red-900 dark:border-red-400/40 dark:bg-red-500/14 dark:text-red-200'
                                            : 'border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/14 dark:text-amber-200'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle
                                            className={`mt-0.5 h-5 w-5 shrink-0 ${
                                                aiEstimateError.tone === 'red' ? 'text-red-600 dark:text-red-300' : 'text-amber-600 dark:text-amber-300'
                                            }`}
                                        />
                                        <div>
                                            <p className="text-sm font-bold">{aiEstimateError.title}</p>
                                            <p className="mt-1 text-sm leading-relaxed">{aiEstimateError.message}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {aiEstimateView ? (
                                <div className="space-y-6 animate-in fade-in duration-700">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold uppercase tracking-tight text-gray-400 dark:text-slate-400">Estimated Cost</p>
                                            <p className="text-2xl font-bold text-[#1e293b] dark:text-slate-100">{aiEstimateView.cost}</p>
                                        </div>
                                        <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[#6366f1] shadow-sm dark:bg-slate-800 dark:text-indigo-300">
                                            {aiEstimateView.confidence}% Confidence
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-3 w-full overflow-hidden rounded-full border border-indigo-50 bg-white dark:border-slate-600 dark:bg-slate-700/70">
                                            <div className="bg-[#6366f1] h-full rounded-full transition-all duration-1000" style={{ width: `${aiEstimateView.confidence}%` }}></div>
                                        </div>
                                    </div>
                                    <p className="text-xs font-medium italic text-gray-500 dark:text-slate-400">Predicted completion date: {aiEstimateView.time}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center opacity-60">
                                    <p className="text-sm italic text-gray-400 dark:text-slate-400">Fill in your requirements above to get instant predictions.</p>
                                </div>
                            )}
                        </Card>
                    </div>

                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-400/45 dark:bg-amber-500/14 dark:text-amber-200">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
                            <div>
                                <p className="text-sm font-bold">Request clarity review before submission</p>
                                <p className="mt-1 text-sm leading-relaxed">
                                    On submit, this request will be reviewed by AI to ensure requirements are clear and actionable for vendors.
                                </p>
                            </div>
                        </div>
                    </div>

                    {requestReviewWarning && (
                        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-400/45 dark:bg-amber-500/14 dark:text-amber-200">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
                                <div>
                                    <p className="text-sm font-bold">{requestReviewWarning.title}</p>
                                    <p className="mt-1 text-sm leading-relaxed">{requestReviewWarning.message}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bottom Actions */}
                    <div className="flex gap-4 justify-end items-center pt-4">
                        <Button type="button" variant="ghost" className="font-semibold text-gray-400 hover:text-red-500 dark:text-slate-300 dark:hover:text-red-300" onClick={() => navigate('/client/dashboard')}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="transform rounded-full bg-[#6366f1] px-12 py-7 text-lg font-bold text-white shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] hover:bg-[#5558e6] dark:shadow-indigo-900/45">
                            {isSubmitting ? 'Reviewing by AI...' : 'Submit Request'} {!isSubmitting && <ChevronRight size={20} className="ml-2"/>}
                        </Button>
                    </div>

                </form>
            </div>
        </DashboardLayout>
    );
}
