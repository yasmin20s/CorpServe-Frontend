import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { startConnection, stopConnection, subscribe, unsubscribe, setSignalRTokenGetter } from '../lib/signalr';
import { getAccessToken } from '../services/apiClient';
import { useAuth } from '../hooks/useAuth';
import { toast } from '../lib/toast';

const SignalRContext = createContext(null);

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

      if (notification?.title) {
        toast.info(notification.title, { description: notification.message });
      }
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
