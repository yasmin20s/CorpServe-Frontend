import * as signalR from '@microsoft/signalr';
import { refreshAccessToken } from '../services/apiClient';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://localhost:7170').replace(/\/+$/, '');
const HUB_URL = `${API_BASE_URL}/hubs/notifications`;

let connection = null;
let accessTokenGetter = () => '';
const subscribers = new Set();

export function setSignalRTokenGetter(getter) {
  accessTokenGetter = typeof getter === 'function' ? getter : () => '';
}

function buildConnection() {
  return new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => accessTokenGetter(),
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();
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
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return;
  }

  if (connection) {
    try {
      await connection.stop();
    } catch {
      /* ignore */
    }
  }

  connection = buildConnection();
  attachHubHandlers(connection);

  try {
    await connection.start();
    console.info('[SignalR] Connected.');
  } catch (err) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      console.error('[SignalR] Connection failed:', err);
      return;
    }
    connection = buildConnection();
    attachHubHandlers(connection);
    try {
      await connection.start();
      console.info('[SignalR] Connected.');
    } catch (retryErr) {
      console.error('[SignalR] Connection failed:', retryErr);
    }
  }
}

export async function stopConnection() {
  if (!connection) return;
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
