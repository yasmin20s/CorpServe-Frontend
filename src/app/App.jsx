import { Toaster } from './components/ui/sonner';
import { useLocation } from 'react-router';
import AppFooter from './components/AppFooter';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  const { pathname } = useLocation();
  const showGlobalFooter = pathname !== '/';

  return (
    <div className="flex min-h-dvh flex-col">
      <Toaster />
      <main className="flex-1">
        <AppRoutes />
      </main>
      {showGlobalFooter && <AppFooter />}
    </div>
  );
}
