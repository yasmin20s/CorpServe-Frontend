import { Link, useLocation } from 'react-router';
import { Bell, MessageSquare, User, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { useAuth } from '../hooks/useAuth';

export default function DashboardLayout({ children, menuItems, userRole }) {
    const location = useLocation();
  const { logout } = useAuth();
  const isAdmin = userRole === 'admin';
    return (<div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 h-16 fixed top-0 left-0 right-0 z-10">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">CS</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">CorpServe</h1>
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
                <Button variant="ghost" className="gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600"/>
                  </div>
                  <span className="text-sm">John Doe</span>
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
                  <Link to="/login" className="text-red-600" onClick={logout}>
                    <LogOut className="w-4 h-4 mr-2"/>
                    Logout
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 fixed left-0 top-16 bottom-0 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (<Link key={item.path} to={item.path}>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'}`}>
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>);
        })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          {children}
        </main>
      </div>
    </div>);
}
