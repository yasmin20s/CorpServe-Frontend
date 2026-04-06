import { BrowserRouter } from 'react-router';
import { AuthProvider } from '../context/AuthContext';
import { SignalRProvider } from '../context/SignalRContext';

export default function AppProviders({ children }) {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SignalRProvider>{children}</SignalRProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
