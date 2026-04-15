import * as signalR from '@microsoft/signalr';
import { refreshAccessToken } from '../services/apiClient';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://localhost:7170').replace(/\/+$/, '');
const HUB_URL = `${API_BASE_URL}/hubs/notifications`;

let connection = null;
let accessTokenGetter = () => '';
const subscribers = new Set();
let pendingStopAfterStart = false;
let connectionReadyPromise = null;

export function setSignalRTokenGetter(getter) {
  accessTokenGetter = typeof getter === 'function' ? getter : () => '';
}

function buildConnection(transport) {
  const transportOptions = transport ? { transport } : {};

  return new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => accessTokenGetter(),
      ...transportOptions,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}

function getSignalRErrorMessage(err) {
  return String(err?.message || err || '').toLowerCase();
}

function isUnauthorizedSignalRError(err) {
  const message = getSignalRErrorMessage(err);
  return message.includes('401') || message.includes('unauthorized');
}

function isWebSocketStartError(err) {
  const message = getSignalRErrorMessage(err);
  return message.includes('websocket failed to connect')
    || message.includes("failed to start the transport 'websockets'")
    || message.includes('transport websockets');
}

async function startWithLongPollingFallback() {
  connection = buildConnection(signalR.HttpTransportType.LongPolling);
  attachHubHandlers(connection);
  await connection.start();
}

function attachHubHandlers(conn) {
  conn.on('notificationReceived', (notification) => {
    for (const cb of subscribers) {
      try {
        cb(notification);
      } catch {
        /* subscriber error */
      }
    }
  });

  conn.onreconnecting(async () => {
    console.warn('[SignalR] Reconnecting...');
    try {
      await refreshAccessToken();
    } catch {
      /* hub will retry with existing token */
    }
  });

  conn.onreconnected(() => {
    console.info('[SignalR] Reconnected.');
  });

  conn.onclose(() => {
    console.warn('[SignalR] Connection closed.');
  });
}

export async function startConnection() {
  if (connection && connection.state === signalR.HubConnectionState.Connected) return;
  if (connectionReadyPromise) return connectionReadyPromise;

  connectionReadyPromise = (async () => {
    if (!connection) {
      connection = buildConnection();
      attachHubHandlers(connection);
    }

    try {
      await connection.start();
      if (pendingStopAfterStart) {
        pendingStopAfterStart = false;
        try {
          await connection.stop();
        } catch {
          /* ignore */
        }
        connection = null;
        return;
      }
      console.info('[SignalR] Connected.');
      return;
    } catch (err) {
      if (isWebSocketStartError(err)) {
        try {
          await startWithLongPollingFallback();
          if (pendingStopAfterStart) {
            pendingStopAfterStart = false;
            try {
              await connection.stop();
            } catch {
              /* ignore */
            }
            connection = null;
            return;
          }
          console.info('[SignalR] Connected (LongPolling fallback).');
          return;
        } catch (fallbackErr) {
          err = fallbackErr;
        }
      }

      if (!isUnauthorizedSignalRError(err)) {
        if (!pendingStopAfterStart) {
          console.error('[SignalR] Connection failed:', err);
        }
        return;
      }

      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        if (!pendingStopAfterStart) {
          console.error('[SignalR] Connection failed:', err);
        }
        return;
      }

      connection = buildConnection();
      attachHubHandlers(connection);

      try {
        await connection.start();
        if (pendingStopAfterStart) {
          pendingStopAfterStart = false;
          try {
            await connection.stop();
          } catch {
            /* ignore */
          }
          connection = null;
          return;
        }
        console.info('[SignalR] Connected.');
      } catch (retryErr) {
        if (!pendingStopAfterStart) {
          console.error('[SignalR] Connection failed:', retryErr);
        }
      }
    }
  })();

  try {
    await connectionReadyPromise;
  } finally {
    connectionReadyPromise = null;
  }
}

export async function stopConnection() {
  if (!connection) return;
  if (connection.state === signalR.HubConnectionState.Connecting) {
    pendingStopAfterStart = true;
    return;
  }
  try {
    await connection.stop();
  } catch {
    /* ignore */
  }
  connection = null;
}

export function subscribe(callback) {
  if (typeof callback === 'function') {
    subscribers.add(callback);
  }
}

export function unsubscribe(callback) {
  subscribers.delete(callback);
}

export function getConnectionState() {
  return connection?.state ?? signalR.HubConnectionState.Disconnected;
}
