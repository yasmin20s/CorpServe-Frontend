import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge'; 
import { 
  AlertCircle, 
  FileText,
  CreditCard,
  Bell,
  CheckCheck,
  X,
  FileStack,
  Clock,
  Check,
  ShieldCheck,
  Eye
} from 'lucide-react';

const menuItems = [
    { label: 'Dashboard', path: '/client/dashboard', icon: <Bell size={20}/> },
    { label: 'Create Request', path: '/client/create-request', icon: <FileStack size={20}/> },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState([
    { id: '1', period: 'Today', type: 'payment', title: 'Payment Due: Urgent Action Required', message: 'Your payment for invoice #INV-2026-004 ($3,500.00) is due today. Please complete the transaction.', isRead: false, time: '2m ago' },
    { id: '2', period: 'Today', type: 'sla', title: 'SLA Completed Successfully', message: "Request 'Maintenance Hardware' is completed and contract is ready for review.", isRead: false, time: '1h ago' },
    { id: '3', period: 'Yesterday', type: 'request', title: 'Request Progress Updated', message: "Vendor updated progress for request 'Network Setup' to 100%.", isRead: false, time: '1d ago' },
    { id: '4', period: 'Older', type: 'quote', title: 'New Quote Received', message: "A new quote has been submitted for your 'Office Renovation' request.", isRead: false, time: '3d ago' },
    { id: '5', period: 'Older', type: 'system', title: 'System Update', message: "The platform has been updated to version 2.4.1 for better performance.", isRead: true, time: '5d ago' }
  ]);

  const toggleRead = (id) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getActionConfig = (type) => {
    switch(type) {
      case 'payment': return { text: 'Pay Now', icon: <CreditCard size={16} />, className: 'bg-[#E65100] hover:bg-[#BF360C] text-white shadow-orange-200' };
      case 'sla': return { text: 'View Contract', icon: <FileText size={16} />, className: 'bg-emerald-100/50 text-emerald-700 border-emerald-200 hover:bg-emerald-200/50' };
      case 'quote': return { text: 'Review Quote', icon: <FileText size={16} />, className: 'bg-violet-100/50 text-violet-700 border-violet-200 hover:bg-violet-200/50' };
      case 'system': return { text: 'Learn More', icon: <ShieldCheck size={16} />, className: 'bg-slate-200/50 text-slate-700 border-slate-300 hover:bg-slate-300/50' };
      default: return { text: 'Track Progress', icon: <Clock size={16} />, className: 'bg-blue-100/50 text-blue-700 border-blue-200 hover:bg-blue-200/50' };
    }
  };

  const renderSection = (title, items) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-4 pt-4">
        <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[2px] px-2">{title}</h3>
        <div className="space-y-4">
          {items.map((n) => {
            const action = getActionConfig(n.type);
            return (
              <div 
                key={n.id} 
                onClick={() => toggleRead(n.id)}
                className={`group relative flex gap-5 p-6 rounded-[28px] border transition-all duration-300 transform cursor-pointer hover:scale-[1.01] hover:shadow-xl
                  ${n.type === 'payment' ? 'bg-[#FFFBEB] border-amber-200 shadow-amber-100/20' : 
                    n.type === 'sla' ? 'bg-[#F0FDF4] border-emerald-100 shadow-emerald-100/20' : 
                    n.type === 'quote' ? 'bg-[#F5F3FF] border-violet-100 shadow-violet-100/20' :
                    n.type === 'system' ? 'bg-[#F8FAFC] border-slate-200 shadow-slate-100/20' :
                    'bg-[#F0F9FF] border-blue-100 shadow-blue-100/20'}`}
              >
                {/* Icon Container */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner transition-colors
                  ${n.type === 'payment' ? 'bg-amber-100 text-amber-600' : 
                    n.type === 'sla' ? 'bg-emerald-100 text-emerald-600' : 
                    n.type === 'quote' ? 'bg-violet-100 text-violet-600' :
                    n.type === 'system' ? 'bg-slate-200 text-slate-600' :
                    'bg-blue-100 text-blue-600'}`}>
                  {n.type === 'payment' ? <AlertCircle size={26} strokeWidth={2.5}/> : 
                   n.type === 'sla' ? <CheckCheck size={26} strokeWidth={2.5}/> : 
                   n.type === 'system' ? <ShieldCheck size={26} strokeWidth={2.5}/> :
                   <Clock size={26} strokeWidth={2.5}/>}
                </div>

                {/* Content Area */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-black text-[17px] tracking-tight text-black">
                      {n.title}
                    </h4>
                    {n.type === 'payment' && !n.isRead && (
                      <Badge className="bg-rose-100 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-lg border-none uppercase tracking-wider">Overdue</Badge>
                    )}
                  </div>
                  
                  <p className="text-[14.5px] leading-relaxed max-w-4xl text-slate-900 font-semibold transition-colors duration-300">
                    {n.message}
                  </p>

                  <div className="flex items-center gap-4 mt-5">
                    <Button 
                      onClick={(e) => e.stopPropagation()} 
                      className={`h-10 px-6 rounded-2xl text-[13px] font-extrabold flex gap-2 transition-all active:scale-95 border-2 border-transparent ${action.className}`}>
                      {action.icon}
                      {action.text}
                    </Button>
                  </div>
                </div>

                {/* Metadata & Status Badges */}
                <div className="flex flex-col items-end justify-between py-1 min-w-[90px]">
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[11px] font-black text-slate-500 bg-white/60 px-2 py-1 rounded-md shadow-sm uppercase tracking-widest">
                      {n.time}
                    </span>
                    
                    {/* العلامة اللي بتميز الـ Read والـ New */}
                    {n.isRead ? (
                      <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                        <CheckCheck size={12} strokeWidth={3} />
                        <span className="text-[9px] font-black uppercase">Read</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100 animate-pulse">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        <span className="text-[9px] font-black uppercase tracking-tighter">New Update</span>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={(e) => deleteNotification(n.id, e)} 
                    className="opacity-0 group-hover:opacity-100 transition-all text-slate-300 hover:text-rose-500 bg-white shadow-sm p-2 rounded-xl border border-slate-100"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout menuItems={menuItems} userRole="client">
      <div className="space-y-8 max-w-6xl mx-auto pb-10">
        {/* Header Section */}
        <Card className="relative overflow-hidden rounded-[32px] border border-indigo-300/70 bg-gradient-to-r from-indigo-100 via-violet-100 to-blue-100 p-8 shadow-[0_16px_36px_rgba(79,70,229,0.12)]">
            <div className="relative z-10 flex justify-between items-center">
                <div>
                    <h1 className="mb-2 text-3xl font-black text-indigo-900 tracking-tight">Notifications</h1>
                    <p className="text-indigo-800/80 font-medium">Stay on top of your requests and payments.</p>
                </div>
                <Button variant="ghost" onClick={markAllAsRead} className="bg-white/50 hover:bg-white text-indigo-900 font-bold rounded-2xl gap-2 transition-all shadow-sm">
                    <Check size={18} /> Mark all as read
                </Button>
            </div>
        </Card>

        {/* تقسيم السيكشنز */}
        <div className="space-y-10">
            {renderSection('Today', notifications.filter(n => n.period === 'Today'))}
            {renderSection('Yesterday', notifications.filter(n => n.period === 'Yesterday'))}
            {renderSection('Older Notifications', notifications.filter(n => n.period === 'Older'))}
        </div>
      </div>
    </DashboardLayout>
  );
}