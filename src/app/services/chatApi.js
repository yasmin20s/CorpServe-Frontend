import { request } from './apiClient';

function pick(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

function normalizeChatRoom(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: String(pick(raw, 'id', 'Id') ?? ''),
    clientId: String(pick(raw, 'clientId', 'ClientId') ?? ''),
    clientName: String(pick(raw, 'clientName', 'ClientName') ?? 'Client'),
    vendorId: String(pick(raw, 'vendorId', 'VendorId') ?? ''),
    vendorName: String(pick(raw, 'vendorName', 'VendorName') ?? 'Vendor'),
    status: String(pick(raw, 'status', 'Status') ?? 'Active'),
    createdAt: pick(raw, 'createdAt', 'CreatedAt') ?? '',
    lastMessage: pick(raw, 'lastMessage', 'LastMessage') ?? null,
    lastMessageTime: pick(raw, 'lastMessageTime', 'LastMessageTime') ?? null,
    unreadCount: Number(pick(raw, 'unreadCount', 'UnreadCount') ?? 0),
  };
}

function normalizeMessage(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: String(pick(raw, 'id', 'Id') ?? ''),
    chatRoomId: String(pick(raw, 'chatRoomId', 'ChatRoomId') ?? ''),
    content: String(pick(raw, 'content', 'Content') ?? ''),
    type: String(pick(raw, 'type', 'Type') ?? 'text'),
    sender: String(pick(raw, 'sender', 'Sender') ?? ''),
    sentAt: pick(raw, 'sentAt', 'SentAt') ?? '',
    isRead: Boolean(pick(raw, 'isRead', 'IsRead')),
    mediaUrl: pick(raw, 'mediaUrl', 'MediaUrl') ?? null,
    mediaMimeType: pick(raw, 'mediaMimeType', 'MediaMimeType') ?? null,
    mediaSizeBytes: pick(raw, 'mediaSizeBytes', 'MediaSizeBytes') ?? null,
  };
}

export async function getChatRoomsApi({ token }) {
  const raw = await request('/api/Chat/rooms', { method: 'GET', token });
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeChatRoom).filter(Boolean);
}

export async function getChatMessagesApi({ chatRoomId, pageIndex = 1, pageSize = 30, token }) {
  const query = new URLSearchParams();
  query.set('pageIndex', String(pageIndex));
  query.set('pageSize', String(pageSize));

  const raw = await request(`/api/Chat/rooms/${chatRoomId}/messages?${query.toString()}`, {
    method: 'GET',
    token,
  });
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeMessage).filter(Boolean);
}

export async function sendMessageApi({ chatRoomId, content, type = 1, token }) {
  const raw = await request(`/api/Chat/rooms/${chatRoomId}/messages`, {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatRoomId, content, type }),
  });
  return normalizeMessage(raw);
}

export async function sendAttachmentApi({ chatRoomId, file, content, token }) {
  const formData = new FormData();
  formData.append('File', file);
  if (content) formData.append('Content', content);

  const raw = await request(`/api/Chat/rooms/${chatRoomId}/attachment`, {
    method: 'POST',
    token,
    body: formData,
  });
  return normalizeMessage(raw);
}

export async function markMessagesReadApi({ chatRoomId, token }) {
  return request(`/api/Chat/rooms/${chatRoomId}/read`, { method: 'POST', token });
}

export async function getUnreadChatCountApi({ token }) {
  const raw = await request('/api/Chat/unread-count', { method: 'GET', token });
  return typeof raw === 'number' ? raw : 0;
}

export async function getChatRoomByRequestApi({ requestId, token }) {
  const raw = await request(`/api/Chat/room-by-request/${requestId}`, { method: 'GET', token });
  return typeof raw === 'string' ? raw : String(raw ?? '');
}
