import { useState } from 'react';
import { useNavigate } from 'react-router';
import DashboardLayout from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Bot, Upload, Sparkles, LayoutDashboard, PlusCircle, FileStack, Activity, Wallet } from 'lucide-react';
import { toast } from '../../lib/toast';
const menuItems = [
    { label: 'Dashboard', path: '/client/dashboard', icon: <LayoutDashboard size={20}/> },
    { label: 'Create Request', path: '/client/create-request', icon: <PlusCircle size={20}/> },
    { label: 'My Requests', path: '/client/my-requests', icon: <FileStack size={20}/> },
    { label: 'Active Requests', path: '/client/active-requests', icon: <Activity size={20}/> },
    { label: 'Payments', path: '/client/payments', icon: <Wallet size={20}/> },
];

export default function CreateRequest() {
    const navigate = useNavigate();
    const [isEstimating, setIsEstimating] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        budgetMin: '',
        budgetMax: '',
        deadline: '',
    });
    const [aiEstimate, setAiEstimate] = useState(null);

    const categories = ['IT Support', 'Maintenance', 'Marketing', 'Cleaning', 'Security', 'Consulting', 'Design', 'Device Maintenance'];

    // --- Logic الـ Estimation الحقيقي ---
    const generateAIEstimate = () => {
        if (!formData.budgetMin || !formData.budgetMax || !formData.title) {
            toast.error('Please fill in Title and Budget first for accurate estimation');
            return;
        }

        setIsEstimating(true);

        // محاكاة وقت تفكير الـ AI
        setTimeout(() => {
            const min = parseInt(formData.budgetMin);
            const max = parseInt(formData.budgetMax);
            
            // حساب تكلفة تقديرية في نطاق الميزانية المدخلة
            const estimatedMin = Math.floor(min + (max - min) * 0.2);
            const estimatedMax = Math.floor(max - (max - min) * 0.1);
            
            // حساب الوقت بناءً على الكلمات المفتاحية في الوصف
            let weeks = "1-2 weeks";
            if (formData.description.length > 100 || formData.title.toLowerCase().includes('setup')) {
                weeks = "3-4 weeks";
            } else if (formData.category === 'Cleaning' || formData.category === 'Maintenance') {
                weeks = "2-5 days";
            }

            // نسبة الثقة تتغير عشوائياً بين 85% لـ 98% لشكل أكثر واقعية
            const confidence = Math.floor(Math.random() * (98 - 85 + 1) + 85);

            setAiEstimate({
                cost: `$${estimatedMin.toLocaleString()} - $${estimatedMax.toLocaleString()}`,
                time: weeks,
                confidence: confidence
            });

            setIsEstimating(false);
            toast.success('AI estimation updated based on your data');
        }, 1200); 
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        toast.success('Request created successfully!');
        navigate('/client/my-requests');
    };

    return (
        <DashboardLayout menuItems={menuItems} userRole="client">
            <div className="p-8 bg-[#f8faff] min-h-screen space-y-8">
                
                {/* Header Card */}
                <Card className="border-none shadow-sm bg-gradient-to-r from-[#e0e7ff] to-[#f0f4ff] rounded-[24px] p-10">
                    <div className="flex justify-between items-center">
                        <div className="space-y-2">
                            <h1 className="text-[#3b448c] text-4xl font-bold">Create Service Request</h1>
                            <p className="text-[#7e89ac] text-lg">Provide details below to start your new service request.</p>
                        </div>
                    </div>
                </Card>

                <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl mx-auto">
                    
                    {/* Main Details Card */}
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px] p-8 bg-white">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[#1e293b] font-semibold">Request Title</Label>
                                    <Input 
                                        placeholder="e.g., IT Infrastructure Setup" 
                                        className="bg-[#f1f3f7] border-none py-6 rounded-xl"
                                        value={formData.title} 
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                                        required 
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[#1e293b] font-semibold">Category</Label>
                                        <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                                            <SelectTrigger className="bg-[#f1f3f7] border-none py-6 rounded-xl text-gray-500">
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-none shadow-lg">
                                                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[#1e293b] font-semibold">Deadline</Label>
                                        <Input type="date" className="bg-[#f1f3f7] border-none py-6 rounded-xl text-gray-500" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} required/>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[#1e293b] font-semibold">Description</Label>
                                    <Textarea 
                                        placeholder="Provide detailed information..." 
                                        rows={4} 
                                        className="bg-[#f1f3f7] border-none rounded-xl resize-none p-4"
                                        value={formData.description} 
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                                        required 
                                    />
                                </div>

                                <div className="space-y-3 pt-2">
                                    <Label className="text-[#1e293b] font-semibold italic text-gray-400">Attachments (Optional)</Label>
                                    <div className="border-2 border-dashed border-gray-100 rounded-[20px] p-10 flex flex-col items-center justify-center bg-[#fafbfc] transition-all hover:border-[#6366f1]/30">
                                        <Upload className="w-10 h-10 text-gray-300 mb-4" strokeWidth={1.5}/>
                                        <p className="text-sm text-gray-400 mb-5 text-center">Upload supporting documents, images, or files</p>
                                        <label htmlFor="attachments" className="cursor-pointer">
                                            <div className="bg-white border border-gray-200 text-gray-600 font-semibold py-2 px-8 rounded-xl shadow-sm hover:bg-gray-50 transition-all">
                                                Choose Files
                                            </div>
                                            <input id="attachments" type="file" className="hidden" multiple/>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Budget & AI Prediction Section */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card className="border-none shadow-sm rounded-[24px] p-8 bg-white">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Budget Range</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-400 font-bold uppercase">Min ($)</Label>
                                    <Input type="number" placeholder="e.g., 5000" className="bg-[#f1f3f7] border-none py-6 rounded-xl" value={formData.budgetMin} onChange={(e)=>setFormData({...formData, budgetMin: e.target.value})} required/>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-400 font-bold uppercase">Max ($)</Label>
                                    <Input type="number" placeholder="e.g., 10000" className="bg-[#f1f3f7] border-none py-6 rounded-xl" value={formData.budgetMax} onChange={(e)=>setFormData({...formData, budgetMax: e.target.value})} required/>
                                </div>
                            </div>
                        </Card>

                        <Card className={`border-none shadow-sm rounded-[24px] p-8 transition-all duration-500 ${aiEstimate ? 'bg-[#f5f3ff]' : 'bg-[#f1f3f7]'}`}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-bold text-[#6366f1] uppercase tracking-widest flex items-center gap-2">
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

                            {aiEstimate ? (
                                <div className="space-y-6 animate-in fade-in duration-700">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-xs text-gray-400 uppercase font-bold tracking-tight">Estimated Cost</p>
                                            <p className="text-2xl font-bold text-[#1e293b]">{aiEstimate.cost}</p>
                                        </div>
                                        <span className="text-sm font-bold text-[#6366f1] bg-white px-3 py-1 rounded-full shadow-sm">
                                            {aiEstimate.confidence}% Confidence
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-indigo-50">
                                            <div className="bg-[#6366f1] h-full rounded-full transition-all duration-1000" style={{ width: `${aiEstimate.confidence}%` }}></div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium italic">Predicted Timeframe: {aiEstimate.time}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center opacity-60">
                                    <p className="text-sm text-gray-400 italic">Fill in your requirements above to get instant predictions.</p>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex gap-4 justify-end items-center pt-4">
                        <Button type="button" variant="ghost" className="text-gray-400 hover:text-red-500 font-semibold" onClick={() => navigate('/client/dashboard')}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-[#6366f1] hover:bg-[#5558e6] text-white rounded-full px-12 py-7 shadow-xl shadow-indigo-100 font-bold text-lg transition-all transform hover:scale-[1.02]">
                            Submit Request <ChevronRight size={20} className="ml-2"/>
                        </Button>
                    </div>

                </form>
            </div>
        </DashboardLayout>
    );
}
