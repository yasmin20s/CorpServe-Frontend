import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { startConnection, stopConnection, subscribe, unsubscribe, setSignalRTokenGetter } from '../lib/signalr';
import { getAccessToken } from '../services/apiClient';
import { useAuth } from '../hooks/useAuth';
import { toast } from '../lib/toast';

const SignalRContext = createContext(null);

/** In-app SLA risk titles — prefer warning toast even if payload type is loose */
const SLA_WARN_TOAST_TITLES = new Set([
  'SLA deadline warning',
  'SLA delayed',
  'SLA blocked',
]);

function showNotificationToast(notification) {
  const title = notification?.title?.trim() || 'Notification';
  const body = notification?.message?.trim() || '';
  const opts = { title };

  if (!notification?.title && !body) return;

  const rawType = notification?.type;
  let variant = 'info';

  if (SLA_WARN_TOAST_TITLES.has(title)) {
    variant = 'warning';
  } else {
    if (typeof rawType === 'number') {
      switch (rawType) {
        case 2:
          variant = 'success';
          break;
        case 3:
          variant = 'warning';
          break;
        case 4:
          variant = 'error';
          break;
        case 1:
        default:
          variant = 'info';
          break;
      }
    } else {
      const typeStr = String(rawType ?? 'Info').toLowerCase();
      if (typeStr === 'success') variant = 'success';
      else if (typeStr === 'warning') variant = 'warning';
      else if (typeStr === 'error') variant = 'error';
      else variant = 'info';
    }
  }

  switch (variant) {
    case 'success':
      toast.success(body, opts);
      break;
    case 'warning':
      toast.warning(body, opts);
      break;
    case 'error':
      toast.error(body, opts);
      break;
    default:
      toast.info(body, opts);
      break;
  }
}

export function SignalRProvider({ children }) {
  const { user } = useAuth();
  const listenersRef = useRef(new Set());

  useEffect(() => {
    if (!user?.token) {
      stopConnection();
      return;
    }

    setSignalRTokenGetter(() => getAccessToken());
    startConnection();

    const handler = (notification) => {
      for (const entry of listenersRef.current) {
        try {
          const { titles, callback } = entry;
          if (!titles || titles.includes(notification?.title)) {
            callback(notification);
          }
        } catch { /* subscriber error */ }
      }

      showNotificationToast(notification);
    };

    subscribe(handler);

    return () => {
      unsubscribe(handler);
      stopConnection();
    };
  }, [user?.token]);

  const addListener = useCallback((titles, callback) => {
    const entry = { titles, callback };
    listenersRef.current.add(entry);
    return () => listenersRef.current.delete(entry);
  }, []);

  return (
    <SignalRContext.Provider value={{ addListener }}>
      {children}
    </SignalRContext.Provider>
  );
}

export function useSignalREvent(titleOrTitles, callback) {
  const ctx = useContext(SignalRContext);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!ctx) return;

    const titles = titleOrTitles
      ? (Array.isArray(titleOrTitles) ? titleOrTitles : [titleOrTitles])
      : null;

    return ctx.addListener(titles, (notification) => {
      callbackRef.current(notification);
    });
  }, [ctx, titleOrTitles]);
}
