import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { BellRing, MessageSquare, User, LogOut, ChevronLeft, ChevronRight, ShieldCheck, Menu, Settings, LayoutGrid, Activity } from 'lucide-react';
import { Button } from './ui/button';
import ThemeToggleButton from './ThemeToggleButton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { useAuth } from '../hooks/useAuth';
import { getUnreadNotificationCountApi } from '../services/notificationsApi';
import { getUnreadChatCountApi } from '../services/chatApi';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { useSignalREvent } from '../context/SignalRContext';
import { dashboardMenusByRole } from '../config/dashboardMenus';
import {
  startChatConnection,
  stopChatConnection,
  onUserMessage,
} from '../lib/chatSignalr';

export default function DashboardLayout({ children, menuItems, userRole }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, isBootstrapping } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [headerAvatar, setHeaderAvatar] = useState('');
  const lastContentPathRef = useRef(`/${userRole}/dashboard`);

  const normalizeCount = useCallback((value) => {
    const n = typeof value === 'number'
      ? value
      : Number(value?.data ?? value?.count ?? 0);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }, []);

  const refreshUnreadCount = useCallback(() => {
    if (!user?.token) return;
    getUnreadNotificationCountApi({ token: user.token })
      .then((result) => setUnreadCount(normalizeCount(result)))
      .catch(() => {});
  }, [normalizeCount, user?.token]);

  const refreshUnreadChatCount = useCallback(() => {
    if (!user?.token || userRole === 'admin') return;
    getUnreadChatCountApi({ token: user.token })
      .then((count) => setUnreadChatCount(count))
      .catch(() => {});
  }, [user?.token, userRole]);

  useEffect(() => {
    refreshUnreadCount();
    refreshUnreadChatCount();
  }, [refreshUnreadCount, refreshUnreadChatCount, location.pathname]);

  useEffect(() => {
    const notificationsPath = `/${userRole}/notifications`;
    const chatPath = `/${userRole}/chat`;
    if (location.pathname !== notificationsPath && location.pathname !== chatPath) {
      lastContentPathRef.current = `${location.pathname}${location.search || ''}`;
    }
  }, [location.pathname, location.search, userRole]);

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
    refreshUnreadCount();
    refreshUnreadChatCount();
  }, [refreshUnreadCount, refreshUnreadChatCount]));

  useEffect(() => {
    if (userRole === 'admin' || !user?.token) return;
    startChatConnection();
    return () => stopChatConnection();
  }, [user?.token, userRole]);

  useEffect(() => {
    if (userRole === 'admin') return;
    const unsub = onUserMessage(() => {
      refreshUnreadChatCount();
    });
    return unsub;
  }, [refreshUnreadChatCount, userRole]);

  const togglePanelRoute = useCallback((targetPath) => {
    if (location.pathname === targetPath) {
      navigate(lastContentPathRef.current || `/${userRole}/dashboard`);
      return;
    }
    navigate(targetPath);
  }, [location.pathname, navigate, userRole]);

  const handleNotificationToggle = useCallback(() => {
    togglePanelRoute(`/${userRole}/notifications`);
  }, [togglePanelRoute, userRole]);

  const handleChatToggle = useCallback(() => {
    togglePanelRoute(`/${userRole}/chat`);
  }, [togglePanelRoute, userRole]);

  const normalizedRole = (userRole || '').toLowerCase();
  const effectiveMenuItems = dashboardMenusByRole[normalizedRole] ?? menuItems;
  const sidebarMenuItems = effectiveMenuItems.filter((item) => !/\/chat\/?$/i.test(String(item?.path || '')));
  const isAdmin = userRole === 'admin';
  const roleLabel = userRole ? `${userRole.charAt(0).toUpperCase()}${userRole.slice(1)}` : 'User';
  const roleBasePath = normalizedRole || 'client';
  const userProfilePath = normalizedRole === 'client'
    ? '/client/user-profile'
    : normalizedRole === 'vendor'
      ? '/vendor/profile'
      : '/admin/profile';
  const profileSettingsPath = `/${roleBasePath}/profile-settings`;
  const displayName = !isBootstrapping && user?.fullName?.trim() ? user.fullName.trim() : '';

  useEffect(() => {
    setHeaderAvatar(resolveMediaUrl(user?.profilePictureUrl) || '');
  }, [user?.profilePictureUrl]);

  useEffect(() => {
    const onClientPic = (e) => {
      if (normalizedRole !== 'client') return;
      const url = e?.detail?.url;
      if (typeof url === 'string' && url) setHeaderAvatar(url);
    };
    const onVendorPic = (e) => {
      if (normalizedRole !== 'vendor') return;
      const url = e?.detail?.url;
      if (typeof url === 'string' && url) setHeaderAvatar(url);
    };
    window.addEventListener('corpserve:client-profile-picture-from-api', onClientPic);
    window.addEventListener('corpserve:vendor-profile-picture-from-api', onVendorPic);
    return () => {
      window.removeEventListener('corpserve:client-profile-picture-from-api', onClientPic);
      window.removeEventListener('corpserve:vendor-profile-picture-from-api', onVendorPic);
    };
  }, [normalizedRole]);

  const theme = {
    appShellClass: 'flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100',
    headerClass: 'h-16 fixed top-0 left-0 right-0 z-50 border-b border-indigo-200/90 bg-gradient-to-r from-[#f5f7ff]/95 via-[#eef0ff]/95 to-[#e7edff]/95 shadow-[0_10px_24px_rgba(79,70,229,0.14)] backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-indigo-500/30 dark:bg-gradient-to-r dark:from-[#111a33]/95 dark:via-[#162241]/95 dark:to-[#1f2d52]/95 dark:shadow-[0_10px_24px_rgba(2,6,23,0.5)] dark:supports-[backdrop-filter]:bg-slate-900/70',
    brandTitleClass: 'text-black dark:text-slate-100',
    mobileMenuButtonClass: 'md:hidden h-10 w-10 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
    themeToggleButtonClass: 'h-10 w-10 rounded-2xl border border-amber-200/90 bg-gradient-to-br from-white to-amber-100 text-amber-700 shadow-[0_6px_14px_rgba(251,191,36,0.22)] transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:from-amber-50 hover:to-yellow-100 hover:shadow-[0_10px_22px_rgba(245,158,11,0.3)] dark:border-amber-400/45 dark:bg-gradient-to-br dark:from-amber-500/25 dark:to-orange-500/15 dark:text-amber-200 dark:shadow-[0_10px_22px_rgba(245,158,11,0.25)] dark:hover:border-amber-300/60 dark:hover:from-amber-400/30 dark:hover:to-orange-400/20',
    notificationButtonClass: 'relative h-10 w-10 rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-white to-indigo-100 text-indigo-700 shadow-[0_6px_14px_rgba(99,102,241,0.14)] transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:from-indigo-50 hover:to-violet-100 hover:shadow-[0_10px_22px_rgba(79,70,229,0.22)] dark:border-fuchsia-400/40 dark:bg-gradient-to-br dark:from-violet-500/24 dark:to-fuchsia-500/16 dark:text-violet-200 dark:shadow-[0_10px_22px_rgba(139,92,246,0.28)] dark:hover:border-fuchsia-300/60 dark:hover:from-violet-400/30 dark:hover:to-fuchsia-400/24',
    notificationBadgeClass: 'absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-white bg-fuchsia-600 px-1.5 text-[10px] font-bold text-white shadow-[0_6px_14px_rgba(192,38,211,0.35)]',
    chatButtonClass: 'relative h-10 w-10 rounded-2xl border border-sky-200/80 bg-gradient-to-br from-white to-sky-100 text-sky-700 shadow-[0_6px_14px_rgba(14,165,233,0.16)] transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:from-sky-50 hover:to-cyan-100 hover:shadow-[0_10px_22px_rgba(14,165,233,0.24)] dark:border-cyan-400/40 dark:bg-gradient-to-br dark:from-cyan-500/22 dark:to-blue-500/16 dark:text-cyan-200 dark:shadow-[0_10px_22px_rgba(6,182,212,0.26)] dark:hover:border-cyan-300/60 dark:hover:from-cyan-400/28 dark:hover:to-blue-400/22',
    chatBadgeClass: 'absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-white bg-sky-600 px-1.5 text-[10px] font-bold text-white shadow-[0_6px_14px_rgba(2,132,199,0.35)]',
    profileTriggerClass: 'h-auto gap-2 rounded-2xl border border-transparent bg-transparent py-1.5 px-1 sm:px-2 transition-colors hover:border-indigo-200 hover:bg-white/60 dark:hover:border-slate-600 dark:hover:bg-slate-800/70',
    profileAvatarWrapClass: 'flex h-9 w-9 items-center justify-center rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-100 via-blue-100 to-cyan-100 shadow-[0_6px_14px_rgba(99,102,241,0.16)] dark:border-slate-600 dark:bg-gradient-to-br dark:from-slate-700 dark:via-slate-700 dark:to-slate-600 dark:shadow-[0_8px_16px_rgba(15,23,42,0.5)]',
    profileAvatarIconClass: 'w-4 h-4 text-indigo-700 dark:text-slate-100',
    profileRoleTextClass: 'text-emerald-600 dark:text-emerald-300',
    sidebarClass: 'border-r border-indigo-200 bg-gradient-to-b from-[#eef0ff] via-[#ece8ff] to-[#e1edff] dark:border-slate-700 dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900 dark:to-slate-800',
    workspaceCardClass: 'group flex items-center rounded-2xl border border-indigo-200 bg-gradient-to-r from-white to-indigo-50/70 p-3 shadow-[0_8px_18px_rgba(79,70,229,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-[0_14px_28px_rgba(79,70,229,0.2)] dark:border-slate-600 dark:bg-gradient-to-r dark:from-slate-800 dark:to-slate-700 dark:hover:border-slate-500 dark:hover:shadow-[0_14px_28px_rgba(15,23,42,0.45)]',
    workspaceIconWrapClass: 'flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 transition-colors duration-300 group-hover:bg-indigo-100 dark:border-slate-500 dark:bg-slate-700 dark:text-indigo-200 dark:group-hover:bg-slate-600',
    workspaceTitleClass: 'text-base font-bold tracking-tight text-indigo-700 dark:bg-gradient-to-r dark:from-[#A96DFF] dark:to-[#D8B9FF] dark:bg-clip-text dark:text-transparent',
    workspaceLiveBadgeClass: 'inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-red-700 shadow-[0_6px_14px_rgba(220,38,38,0.16)] dark:border-red-400/40 dark:bg-red-900/40 dark:text-red-200',
    workspaceLiveIconClass: 'h-3.5 w-3.5 text-red-500 animate-pulse',
    navActiveClass: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_10px_24_rgba(79,70,229,0.28)]',
    navInactiveClass: 'text-slate-700 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-violet-100 hover:shadow-sm dark:text-slate-200 dark:hover:from-slate-700 dark:hover:to-slate-600',
    navHoverBorderClass: 'pointer-events-none absolute inset-0 rounded-xl border border-transparent group-hover:border-indigo-100 dark:group-hover:border-slate-500/70',
    navIconInactiveClass: 'text-indigo-600 dark:text-indigo-200',
  };

  const roleStructure = {
    admin: {
      workspaceIcon: ShieldCheck,
      workspaceSubtitle: 'Admin Command',
      navItemShapeClass: 'rounded-xl',
    },
    vendor: {
      workspaceIcon: MessageSquare,
      workspaceSubtitle: 'Vendor Flow',
      navItemShapeClass: 'rounded-2xl',
    },
    client: {
      workspaceIcon: LayoutGrid,
      workspaceSubtitle: 'Dashboard Hub',
      navItemShapeClass: 'rounded-xl',
    },
  };

  const structure = roleStructure[userRole] || roleStructure.client;
  const WorkspaceIcon = structure.workspaceIcon;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
    setIsLoggingOut(false);
  };

  return (
    <div className={theme.appShellClass}>
      <header className={theme.headerClass}>
        <div className="h-full px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <a href="/" className="cs-brand-badge flex h-9 w-9 items-center justify-center rounded-lg transition-transform hover:scale-105">
              <span className="text-sm font-bold text-white">CS</span>
            </a>
            <h1 className={`hidden text-base sm:text-lg lg:text-xl font-semibold sm:block ${theme.brandTitleClass}`}>CorpServe</h1>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className={theme.mobileMenuButtonClass}>
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 border border-indigo-100 bg-white/95 md:hidden dark:border-slate-600 dark:bg-slate-900/95">
                <DropdownMenuLabel>Navigate</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {sidebarMenuItems.map((item) => (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link to={item.path} className="flex items-center gap-2">
                      {item.icon} <span>{item.label}</span>
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
            >
              {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </Button>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
            <ThemeToggleButton className={theme.themeToggleButtonClass} />

            <Button type="button" onClick={handleNotificationToggle} variant="ghost" size="icon" className={theme.notificationButtonClass}>
              <BellRing className="w-5 h-5"/>
              {unreadCount > 0 && <Badge className={theme.notificationBadgeClass}>{unreadCount > 99 ? '99+' : unreadCount}</Badge>}
            </Button>

            {!isAdmin && (
              <Button type="button" onClick={handleChatToggle} variant="ghost" size="icon" className={theme.chatButtonClass}>
                <MessageSquare className="w-5 h-5"/>
                {unreadChatCount > 0 && <Badge className={theme.chatBadgeClass}>{unreadChatCount > 99 ? '99+' : unreadChatCount}</Badge>}
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`${theme.profileTriggerClass} shrink-0`}>
                  <div className={theme.profileAvatarWrapClass}>
                    {headerAvatar ? (
                      <img src={headerAvatar} alt={displayName || 'Profile'} className="h-full w-full rounded-2xl object-cover" />
                    ) : (
                      <User className={theme.profileAvatarIconClass} />
                    )}
                  </div>
                  <div className="text-left leading-tight hidden sm:block">
                    <div className={`flex items-center gap-1 text-[11px] font-semibold ${theme.profileRoleTextClass}`}>
                      <ShieldCheck className="h-3.5 w-3.5" /> <span>{roleLabel}</span>
                    </div>
                    {displayName && <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{displayName}</span>}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 overflow-hidden rounded-2xl border border-indigo-100 bg-white/95 p-0 shadow-[0_20px_45px_rgba(79,70,229,0.18)] backdrop-blur dark:border-slate-600 dark:bg-slate-900/95 dark:shadow-[0_20px_45px_rgba(15,23,42,0.55)]" sideOffset={10}>
                <DropdownMenuLabel className="p-0">
                  <div className="relative overflow-hidden px-3 py-2.5">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-100 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700" />
                    <div className="relative flex items-center gap-2.5 text-slate-800 dark:text-slate-100">
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-indigo-200 bg-white/80 shadow-sm dark:border-slate-500 dark:bg-slate-700/80">
                        {headerAvatar ? (
                          <img src={headerAvatar} alt={displayName || 'Profile'} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-4 w-4 text-indigo-600 dark:text-indigo-200" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-200">My Account</p>
                        <p className="truncate text-sm font-semibold">{displayName || 'CorpServe User'}</p>
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {userProfilePath && (
                  <DropdownMenuItem asChild>
                    <Link
                      to={userProfilePath}
                      className="mx-2 my-1.5 flex items-center gap-2.5 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition hover:border-indigo-100 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:from-slate-700 dark:hover:to-slate-600"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-slate-700 dark:text-indigo-200">
                        <User className="h-4 w-4" />
                      </span>
                      <span>User Profile</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                {!isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link
                      to={profileSettingsPath}
                      className="mx-2 my-1.5 flex items-center gap-2.5 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition hover:border-indigo-100 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:from-slate-700 dark:hover:to-slate-600"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-slate-700 dark:text-violet-200">
                        <Settings className="h-4 w-4" />
                      </span>
                      <span>Profile Setting</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild>
                  <button
                    type="button"
                    className="mx-2 mt-1 mb-2 flex w-[calc(100%-1rem)] items-center gap-2.5 rounded-xl border border-red-100 bg-red-50/70 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-100/70 dark:border-red-400/40 dark:bg-red-900/40 dark:text-red-200 dark:hover:border-red-300/60 dark:hover:bg-red-900/60"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-600"><LogOut className="h-4 w-4"/></span>
                    <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 w-full flex-1 pt-16">
        <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} hidden md:block shrink-0 ${theme.sidebarClass} transition-all duration-300`}>
          <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
            <div className={`${isSidebarOpen ? 'mx-4 mt-4' : 'mx-3 mt-4'}`}>
              <Link to={`/${userRole}/dashboard`} className={`${theme.workspaceCardClass} ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : ''}`}>
                  <span className={theme.workspaceIconWrapClass}><WorkspaceIcon className="h-4 w-4" /></span>
                  {isSidebarOpen && (
                    <div className="leading-tight">
                      <p className={theme.workspaceTitleClass}>Workspace</p>
                      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-900 dark:text-slate-200">{structure.workspaceSubtitle}</p>
                    </div>
                  )}
                </div>
                {isSidebarOpen && <span className={theme.workspaceLiveBadgeClass}><Activity className={theme.workspaceLiveIconClass} /><span>Live</span></span>}
              </Link>
            </div>

            <nav className="mt-3 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
              {sidebarMenuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <div className={`group relative flex items-center ${isSidebarOpen ? 'gap-3 px-3.5' : 'justify-center px-2'} py-3 ${structure.navItemShapeClass} transition-all duration-300 ${isActive ? theme.navActiveClass : theme.navInactiveClass}`}>
                      {!isActive && <div className={`${theme.navHoverBorderClass} ${structure.navItemShapeClass}`} />}
                      <span className={isActive ? 'text-white' : theme.navIconInactiveClass}>{item.icon}</span>
                      {isSidebarOpen && <span className="font-semibold tracking-tight">{item.label}</span>}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 pt-6 sm:p-6 sm:pt-8 lg:p-8 lg:pt-10">
          {children}
        </main>
      </div>
    </div>
  );
}