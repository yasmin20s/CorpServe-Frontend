import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Bell, MessageSquare, User, LogOut, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { useAuth } from '../hooks/useAuth';

export default function DashboardLayout({ children, menuItems, userRole }) {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isAdmin = userRole === 'admin';
  const roleLabel = userRole ? `${userRole.charAt(0).toUpperCase()}${userRole.slice(1)}` : 'User';
  const displayName = user?.fullName?.trim() || 'John Doe';
  return (<div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 h-16 fixed top-0 left-0 right-0 z-10">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#6f74ea] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">CS</span>
            </div>
            <h1 className="text-xl font-semibold text-black">CorpServe</h1>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-1"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Link to={`/${userRole}/notifications`}>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5"/>
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-500">
                  3
                </Badge>
              </Button>
            </Link>

            {!isAdmin && (
              <Link to={`/${userRole}/chat`}>
                <Button variant="ghost" size="icon" className="relative">
                  <MessageSquare className="w-5 h-5"/>
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-blue-500">
                    5
                  </Badge>
                </Button>
              </Link>
            )}

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto gap-2 py-1.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600"/>
                  </div>
                  <div className="text-left leading-tight">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{roleLabel}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-800">{displayName}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {!isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to={`/${userRole}/profile`}>Profile Settings</Link>
                  </DropdownMenuItem>
                )}
                {!isAdmin && <DropdownMenuSeparator />}
                <DropdownMenuItem asChild>
                  <Link
                    to="/login"
                    className="flex w-full items-center gap-2 rounded-md border border-slate-200 bg-slate-50/70 px-2 py-1.5 text-slate-700 transition hover:bg-slate-100"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4"/>
                    Logout
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)] pt-16">
        {/* Sidebar */}
        <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} shrink-0 border-r border-gray-200 bg-white transition-all duration-300`}>
          <nav className="sticky top-16 h-[calc(100vh-4rem)] space-y-1 overflow-y-auto p-4">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (<Link key={item.path} to={item.path}>
                  <div className={`flex items-center ${isSidebarOpen ? 'gap-3 px-4' : 'justify-center px-2'} py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'}`}>
                    {item.icon}
                    {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                  </div>
                </Link>);
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1 p-8">
          {children}
        </main>
      </div>
    </div>);
}
