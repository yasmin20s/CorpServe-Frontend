import { BrowserRouter } from 'react-router';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '../context/AuthContext';
import { SignalRProvider } from '../context/SignalRContext';

export default function AppProviders({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="corpserve-theme">
      <AuthProvider>
        <BrowserRouter>
          <SignalRProvider>{children}</SignalRProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
