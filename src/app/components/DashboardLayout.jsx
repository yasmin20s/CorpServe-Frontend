import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Bell, MessageSquare, User, LogOut, ChevronLeft, ChevronRight, ShieldCheck, Menu, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { useAuth } from '../hooks/useAuth';
import { getUnreadNotificationCountApi } from '../services/notificationsApi';
import { useSignalREvent } from '../context/SignalRContext';

export default function DashboardLayout({ children, menuItems, userRole }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, isBootstrapping } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.token) return;
    getUnreadNotificationCountApi({ token: user.token })
      .then((result) => setUnreadCount(typeof result === 'number' ? result : (result?.data ?? 0)))
      .catch(() => {});
  }, [user?.token, location.pathname]);

  useEffect(() => {
    const onSync = (e) => {
      if (typeof e.detail === 'number' && Number.isFinite(e.detail)) {
        setUnreadCount(Math.max(0, e.detail));
      }
    };
    window.addEventListener('corpserve:notification-unread-sync', onSync);
    return () => window.removeEventListener('corpserve:notification-unread-sync', onSync);
  }, []);

  useSignalREvent(null, useCallback(() => {
    setUnreadCount((prev) => prev + 1);
  }, []));
  const isAdmin = userRole === 'admin';
  const roleLabel = userRole ? `${userRole.charAt(0).toUpperCase()}${userRole.slice(1)}` : 'User';
  const displayName = !isBootstrapping && user?.fullName?.trim() ? user.fullName.trim() : '';

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
    setIsLoggingOut(false);
  };

  return (<div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 h-16 fixed top-0 left-0 right-0 z-50">
        <div className="h-full px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <a
              href="/"
              aria-label="Go to home"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6f74ea] shadow-[0_8px_20px_rgba(111,116,234,0.35)] transition-transform hover:scale-105"
            >
              <span className="text-sm font-bold text-white">CS</span>
            </a>
            <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-black">CorpServe</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="md:hidden gap-2 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                  <Menu className="h-4 w-4" />
                  Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 md:hidden">
                <DropdownMenuLabel>Navigate</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {menuItems.map((item) => (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link to={item.path} className="flex items-center gap-2">
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-1 hidden md:inline-flex"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </Button>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
            {/* Notifications */}
            <Link to={`/${userRole}/notifications`}>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="w-5 h-5"/>
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-500">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {!isAdmin && (
              <Link to={`/${userRole}/chat`}>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
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
                <Button variant="ghost" className="h-auto gap-2 py-1.5 px-1 sm:px-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600"/>
                  </div>
                  <div className="text-left leading-tight hidden sm:block">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{roleLabel}</span>
                    </div>
                    {displayName && <span className="text-sm font-medium text-slate-800">{displayName}</span>}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-72 overflow-hidden rounded-2xl border border-indigo-100 bg-white/95 p-0 shadow-[0_20px_45px_rgba(79,70,229,0.18)] backdrop-blur supports-[backdrop-filter]:bg-white/90"
                sideOffset={10}
              >
                <DropdownMenuLabel className="p-0">
                  <div className="relative overflow-hidden px-3 py-2.5">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-100" />
                    <div className="absolute -bottom-7 -right-6 h-16 w-16 rounded-full bg-violet-200/45 blur-xl" />
                    <div className="relative flex items-center gap-2.5 text-slate-800">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-200 bg-white/80 shadow-sm">
                        <User className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">My Account</p>
                        <p className="truncate text-sm font-semibold">{displayName || 'CorpServe User'}</p>
                        <div className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white/75 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                          <ShieldCheck className="h-3 w-3" />
                          <span>{roleLabel}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {!isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link
                        to={`/${userRole}/profile`}
                        className="mx-2 my-1.5 flex items-center gap-2.5 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition hover:border-indigo-100 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 focus-visible:border-indigo-200 focus-visible:bg-indigo-50"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                          <Settings className="h-4 w-4" />
                        </span>
                        <span>Profile Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem asChild>
                  <button
                    type="button"
                    className="mx-2 mt-1 mb-2 flex w-auto items-center gap-2.5 rounded-xl border border-red-100 bg-red-50/70 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-100/70 disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-600">
                      <LogOut className="h-4 w-4"/>
                    </span>
                    <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)] pt-16">
        {/* Sidebar */}
        <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} hidden md:block shrink-0 border-r border-indigo-200 bg-gradient-to-b from-[#eef0ff] via-[#ece8ff] to-[#e1edff] transition-all duration-300`}>
          <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
            <div className={`${isSidebarOpen ? 'mx-4 mt-4' : 'mx-3 mt-4'} rounded-2xl border border-indigo-100 bg-white/90 p-3 shadow-sm`}>
              <div className={`flex items-center ${isSidebarOpen ? 'gap-2' : 'justify-center'}`}>
                <a
                  href="/"
                  aria-label="Go to home"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6f74ea] text-sm font-bold text-white shadow-[0_8px_20px_rgba(111,116,234,0.35)] transition-transform hover:scale-105"
                >
                  CS
                </a>
                {isSidebarOpen && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Workspace</p>
                    <p className="text-sm font-bold text-slate-900">CorpServe</p>
                  </div>
                )}
              </div>
            </div>

            <nav className="mt-3 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <div
                    className={`group relative flex items-center ${isSidebarOpen ? 'gap-3 px-3.5' : 'justify-center px-2'} py-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_10px_24px_rgba(79,70,229,0.28)]'
                        : 'text-slate-700 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-violet-100 hover:shadow-sm'
                    }`}
                  >
                    {!isActive && (
                      <div className="pointer-events-none absolute inset-0 rounded-xl border border-transparent group-hover:border-indigo-100" />
                    )}
                    <span className={isActive ? 'text-white' : 'text-indigo-600'}>{item.icon}</span>
                    {isSidebarOpen && <span className="font-semibold tracking-tight">{item.label}</span>}
                  </div>
                </Link>
              );
            })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1 p-4 pt-6 sm:p-6 sm:pt-8 lg:p-8 lg:pt-10">
          {children}
        </main>
      </div>
    </div>);
}
