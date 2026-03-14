import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Badge } from '../../components/ui/badge';
import { Send, Paperclip } from 'lucide-react';
import { useDashboardMenu } from '../../hooks/useDashboardMenu';
import { useRoleFromPath } from '../../hooks/useRoleFromPath';

export default function Chat() {
  const role = useRoleFromPath();
  const menuItems = useDashboardMenu(role);
    const [selectedChat, setSelectedChat] = useState(1);
    const [message, setMessage] = useState('');
    const conversations = [
        {
            id: 1,
            name: 'TechPro Solutions',
            project: 'IT Infrastructure Setup',
            lastMessage: 'Server installation is complete',
            time: '10:30 AM',
            unread: 2,
            avatar: 'TP',
        },
        {
            id: 2,
            name: 'Creative Agency',
            project: 'Marketing Campaign Design',
            lastMessage: 'I\'ve sent the updated designs',
            time: 'Yesterday',
            unread: 0,
            avatar: 'CA',
        },
        {
            id: 3,
            name: 'SecureGuard Solutions',
            project: 'Security System Installation',
            lastMessage: 'When can we start?',
            time: '2 days ago',
            unread: 1,
            avatar: 'SG',
        },
    ];
    const messages = [
        { id: 1, sender: 'them', text: 'Hello! I\'ve started working on the server installation.', time: '9:00 AM' },
        { id: 2, sender: 'me', text: 'Great! Please keep me updated on the progress.', time: '9:15 AM' },
        { id: 3, sender: 'them', text: 'Will do. I\'ll need access to the server room by tomorrow.', time: '9:20 AM' },
        { id: 4, sender: 'me', text: 'I\'ll arrange that. What time works best for you?', time: '9:25 AM' },
        { id: 5, sender: 'them', text: 'Server installation is complete. Moving to network configuration now.', time: '10:30 AM' },
    ];
    const handleSendMessage = () => {
        if (message.trim()) {
            setMessage('');
        }
    };
    return (<DashboardLayout menuItems={menuItems} userRole={role}>
      <div className="h-[calc(100vh-12rem)]">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">Communicate with vendors and clients</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 h-full">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                {conversations.map((conv) => (<div key={conv.id} onClick={() => setSelectedChat(conv.id)} className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedChat === conv.id ? 'bg-blue-50' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {conv.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 truncate">{conv.name}</h4>
                          <span className="text-xs text-gray-500">{conv.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1 truncate">{conv.project}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                          {conv.unread > 0 && (<Badge className="ml-2 bg-blue-600">{conv.unread}</Badge>)}
                        </div>
                      </div>
                    </div>
                  </div>))}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Message Panel */}
          <Card className="lg:col-span-2">
            <CardContent className="p-0 h-full flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {conversations.find((c) => c.id === selectedChat)?.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {conversations.find((c) => c.id === selectedChat)?.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {conversations.find((c) => c.id === selectedChat)?.project}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (<div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-lg p-3 ${msg.sender === 'me'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'}`}>
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-blue-100' : 'text-gray-500'}`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon">
                    <Paperclip className="w-4 h-4"/>
                  </Button>
                  <Input placeholder="Type your message..." value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} className="flex-1"/>
                  <Button onClick={handleSendMessage} className="gap-2">
                    <Send className="w-4 h-4"/>
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>);
}
