import { BrowserRouter } from 'react-router';
import { AuthProvider } from '../context/AuthContext';

export default function AppProviders({ children }) {
  return (
    <AuthProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </AuthProvider>
  );
}
