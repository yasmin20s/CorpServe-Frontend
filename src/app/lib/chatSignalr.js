import * as signalR from '@microsoft/signalr';
import { refreshAccessToken, getAccessToken } from '../services/apiClient';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://localhost:7170').replace(/\/+$/, '');
const HUB_URL = `${API_BASE_URL}/hubs/chat`;

let connection = null;
const messageSubscribers = new Set();
const readSubscribers = new Set();
const userMessageSubscribers = new Set();
const userReadSubscribers = new Set();
let pendingStopAfterStart = false;
let connectionReadyPromise = null;

function buildConnection() {
  return new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => getAccessToken(),
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}

function attachHandlers(conn) {
  conn.on('ReceiveMessage', (message) => {
    for (const cb of messageSubscribers) {
      try { cb(message); } catch { /* subscriber error */ }
    }
  });

  conn.on('MessagesRead', (chatRoomId, readByUserId) => {
    for (const cb of readSubscribers) {
      try { cb(chatRoomId, readByUserId); } catch { /* subscriber error */ }
    }
  });

  conn.on('NewChatMessage', (message) => {
    for (const cb of userMessageSubscribers) {
      try { cb(message); } catch { /* subscriber error */ }
    }
  });

  conn.on('ChatMessagesRead', (chatRoomId, readByUserId) => {
    for (const cb of userReadSubscribers) {
      try { cb(chatRoomId, readByUserId); } catch { /* subscriber error */ }
    }
  });

  conn.onreconnecting(async () => {
    try { await refreshAccessToken(); } catch { /* retry with existing token */ }
  });
}

export async function startChatConnection() {
  if (connection && connection.state === signalR.HubConnectionState.Connected) return;
  if (connectionReadyPromise) return connectionReadyPromise;

  connectionReadyPromise = (async () => {
    if (connection) {
      try { await connection.stop(); } catch { /* ignore */ }
    }

    connection = buildConnection();
    attachHandlers(connection);

    try {
      await connection.start();
      if (pendingStopAfterStart) {
        pendingStopAfterStart = false;
        try { await connection.stop(); } catch { /* ignore */ }
        connection = null;
        return;
      }
    } catch {
      const refreshed = await refreshAccessToken();
      if (!refreshed) return;
      connection = buildConnection();
      attachHandlers(connection);
      try {
        await connection.start();
        if (pendingStopAfterStart) {
          pendingStopAfterStart = false;
          try { await connection.stop(); } catch { /* ignore */ }
          connection = null;
          return;
        }
      } catch { /* failed */ }
    }
  })();

  try { await connectionReadyPromise; } finally { connectionReadyPromise = null; }
}

export async function stopChatConnection() {
  if (!connection) return;
  if (connection.state === signalR.HubConnectionState.Connecting) {
    pendingStopAfterStart = true;
    return;
  }
  try { await connection.stop(); } catch { /* ignore */ }
  connection = null;
}

export async function joinRoom(chatRoomId) {
  if (connectionReadyPromise) await connectionReadyPromise;
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) return;
  try { await connection.invoke('JoinRoom', chatRoomId); } catch { /* ignore */ }
}

export async function leaveRoom(chatRoomId) {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) return;
  try { await connection.invoke('LeaveRoom', chatRoomId); } catch { /* ignore */ }
}

export function onMessage(callback) {
  messageSubscribers.add(callback);
  return () => messageSubscribers.delete(callback);
}

export function onMessagesRead(callback) {
  readSubscribers.add(callback);
  return () => readSubscribers.delete(callback);
}

export function onUserMessage(callback) {
  userMessageSubscribers.add(callback);
  return () => userMessageSubscribers.delete(callback);
}

export function onUserMessagesRead(callback) {
  userReadSubscribers.add(callback);
  return () => userReadSubscribers.delete(callback);
}

export function getChatConnectionState() {
  return connection?.state ?? signalR.HubConnectionState.Disconnected;
}
