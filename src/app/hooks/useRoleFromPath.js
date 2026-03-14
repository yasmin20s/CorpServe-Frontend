import { useLocation } from 'react-router';

export function useRoleFromPath() {
  const location = useLocation();

  if (location.pathname.includes('/client/')) {
    return 'client';
  }

  if (location.pathname.includes('/vendor/')) {
    return 'vendor';
  }

  return 'admin';
}
