import { useState } from 'react';
import { useNavigate } from 'react-router';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Bot, Upload, Sparkles, LayoutDashboard, PlusCircle, FileStack, Activity, Wallet } from 'lucide-react';
import { toast } from '../../lib/toast';
const menuItems = [
    { label: 'Dashboard', path: '/client/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Create Request', path: '/client/create-request', icon: <PlusCircle className="w-5 h-5"/> },
    { label: 'My Requests', path: '/client/my-requests', icon: <FileStack className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/client/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Payments', path: '/client/payments', icon: <Wallet className="w-5 h-5"/> },
];
export default function CreateRequest() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        budgetMin: '',
        budgetMax: '',
        deadline: '',
    });
    const [aiEstimate, setAiEstimate] = useState(null);
    const categories = [
        'IT Support',
        'Maintenance',
        'Marketing',
        'Cleaning',
        'Security',
        'Consulting',
        'Design',
        'Device Maintenance',
    ];
    const generateAIEstimate = () => {
        // Mock AI estimation
        setAiEstimate({
            cost: '$4,500 - $6,500',
            time: '2-3 weeks',
            confidence: 87,
        });
        toast.success('AI estimation generated');
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        toast.success('Request created successfully!');
        navigate('/client/my-requests');
    };
    return (<DashboardLayout menuItems={menuItems} userRole="client">
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Service Request</h1>
          <p className="text-gray-600">Fill in the details for your service request</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Request Title</Label>
                <Input id="title" placeholder="e.g., IT Infrastructure Setup" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required/>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Provide detailed information about your service requirements..." rows={5} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required/>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category"/>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (<SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input id="deadline" type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} required/>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budgetMin">Budget Range (Min)</Label>
                  <Input id="budgetMin" type="number" placeholder="e.g., 5000" value={formData.budgetMin} onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })} required/>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budgetMax">Budget Range (Max)</Label>
                  <Input id="budgetMax" type="number" placeholder="e.g., 10000" value={formData.budgetMax} onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })} required/>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Attachments (Optional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2"/>
                  <p className="text-sm text-gray-600 mb-2">
                    Upload supporting documents, images, or files
                  </p>
                  <label htmlFor="attachments">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span className="cursor-pointer">Choose Files</span>
                    </Button>
                  </label>
                  <input id="attachments" type="file" className="hidden" multiple/>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Estimation */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600"/>
                  AI Cost & Time Estimation
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={generateAIEstimate} className="gap-2">
                  <Sparkles className="w-4 h-4"/>
                  Generate Estimate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {aiEstimate ? (<div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Estimated Cost</p>
                    <p className="text-2xl font-bold text-gray-900">{aiEstimate.cost}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Estimated Time</p>
                    <p className="text-2xl font-bold text-gray-900">{aiEstimate.time}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Confidence</p>
                    <p className="text-2xl font-bold text-gray-900">{aiEstimate.confidence}%</p>
                  </div>
                </div>) : (<p className="text-gray-600 text-center py-4">
                  Click "Generate Estimate" to get AI-powered cost and time predictions
                </p>)}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" size="lg" className="flex-1">
              Submit Request
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => navigate('/client/dashboard')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>);
}

