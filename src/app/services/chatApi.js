import { request } from './apiClient';

function pick(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

function asCollection(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];

  const fromData = pick(raw, 'data', 'Data');
  if (Array.isArray(fromData)) return fromData;

  const fromItems = pick(raw, 'items', 'Items', 'messages', 'Messages', 'results', 'Results');
  if (Array.isArray(fromItems)) return fromItems;

  return [];
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
    mediaUrl: pick(raw, 'mediaUrl', 'MediaUrl', 'attachmentUrl', 'AttachmentUrl', 'fileUrl', 'FileUrl') ?? null,
    mediaMimeType: pick(raw, 'mediaMimeType', 'MediaMimeType', 'mimeType', 'MimeType', 'fileType', 'FileType') ?? null,
    mediaSizeBytes: pick(raw, 'mediaSizeBytes', 'MediaSizeBytes', 'fileSizeBytes', 'FileSizeBytes', 'size', 'Size') ?? null,
  };
}

export async function getChatRoomsApi({ token }) {
  const raw = await request('/api/Chat/rooms', { method: 'GET', token });
  return asCollection(raw).map(normalizeChatRoom).filter(Boolean);
}

export async function getChatMessagesApi({ chatRoomId, pageIndex = 1, pageSize = 30, token }) {
  const query = new URLSearchParams();
  query.set('pageIndex', String(pageIndex));
  query.set('pageSize', String(pageSize));

  const raw = await request(`/api/Chat/rooms/${chatRoomId}/messages?${query.toString()}`, {
    method: 'GET',
    token,
  });
  return asCollection(raw).map(normalizeMessage).filter(Boolean);
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
  const fieldVariants = [
    { fileKey: 'File', contentKey: 'Content' },
    { fileKey: 'file', contentKey: 'content' },
    { fileKey: 'Attachment', contentKey: 'Content' },
    { fileKey: 'attachment', contentKey: 'content' },
  ];

  let lastError;
  for (const variant of fieldVariants) {
    try {
      const formData = new FormData();
      formData.append(variant.fileKey, file);
      if (content) formData.append(variant.contentKey, content);

      const raw = await request(`/api/Chat/rooms/${chatRoomId}/attachment`, {
        method: 'POST',
        token,
        body: formData,
      });

      return normalizeMessage(raw);
    } catch (error) {
      lastError = error;
      const status = Number(error?.status || 0);
      const isLikelyFieldMismatch = status === 400 || status === 415 || status === 422;
      if (!isLikelyFieldMismatch) {
        throw error;
      }
    }
  }

  throw lastError;
}

export async function markMessagesReadApi({ chatRoomId, token }) {
  return request(`/api/Chat/rooms/${chatRoomId}/read`, { method: 'POST', token });
}

export async function getUnreadChatCountApi({ token }) {
  const raw = await request('/api/Chat/unread-count', { method: 'GET', token });
  const value = typeof raw === 'number' ? raw : Number(pick(raw, 'count', 'Count', 'data', 'Data') ?? 0);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export async function getChatRoomByRequestApi({ requestId, token }) {
  const raw = await request(`/api/Chat/room-by-request/${requestId}`, { method: 'GET', token });
  return typeof raw === 'string' ? raw : String(raw ?? '');
}
