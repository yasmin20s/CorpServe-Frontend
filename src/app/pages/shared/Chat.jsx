import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Send, Pin, MessageSquare, Image, FileText, X, ArrowLeft, Sparkles, ShieldCheck, Zap, Search } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router';
import { useDashboardMenu } from '../../hooks/useDashboardMenu';
import { useRoleFromPath } from '../../hooks/useRoleFromPath';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../../lib/toast';
import {
  getChatRoomsApi,
  getChatMessagesApi,
  sendMessageApi,
  sendAttachmentApi,
  markMessagesReadApi,
} from '../../services/chatApi';
import { getApiBaseUrl } from '../../services/apiClient';
import {
  joinRoom,
  leaveRoom,
  onMessage,
  onUserMessagesRead,
  onChatReconnected,
  startChatConnection,
} from '../../lib/chatSignalr';
import { UserAvatarIconOnly } from '../../components/UserAvatar';

function formatTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = now - d;
  const oneDay = 86400000;
  if (diffMs < oneDay && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffMs < oneDay * 2) return 'Yesterday';
  return d.toLocaleDateString('en-GB');
}

function formatMessageTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function messageDayKey(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function messageDayLabel(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startMsgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const oneDay = 86400000;

  if (startMsgDay === startToday) return 'Today';
  if (startMsgDay === startToday - oneDay) return 'Yesterday';

  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toEpochMs(value) {
  if (!value) return 0;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 0;
  return d.getTime();
}

function messageStableKey(message) {
  if (message?.id) return String(message.id);
  return [
    message?.chatRoomId || '',
    message?.sentAt || '',
    message?.sender || '',
    message?.content || '',
    message?.mediaUrl || '',
  ].join('|');
}

function sameChatRoomId(a, b) {
  return String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();
}

function sortMessagesByBackendOrder(items) {
  return [...items].sort((a, b) => {
    const tDiff = toEpochMs(a?.sentAt) - toEpochMs(b?.sentAt);
    if (tDiff !== 0) return tDiff;
    return messageStableKey(a).localeCompare(messageStableKey(b));
  });
}

function sortRoomsByLatestActivity(items) {
  return [...items].sort((a, b) => {
    const aTime = toEpochMs(a?.lastMessageTime || a?.createdAt);
    const bTime = toEpochMs(b?.lastMessageTime || b?.createdAt);
    return bTime - aTime;
  });
}

const CHAT_MESSAGES_PAGE_SIZE = 50;
const CHAT_MESSAGES_MAX_PAGES = 20;

function resolveMediaUrl(mediaUrl, mediaBaseUrl) {
  if (!mediaUrl) return '';
  if (/^https?:\/\//i.test(mediaUrl)) return mediaUrl;
  const normalizedBase = String(mediaBaseUrl || '').replace(/\/+$/, '');
  const normalizedPath = String(mediaUrl).replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedPath}`;
}

function isImageMedia(message) {
  const mime = String(message?.mediaMimeType || '').toLowerCase();
  if (mime.startsWith('image/')) return true;
  const type = String(message?.type || '').toLowerCase();
  if (type.includes('image')) return true;
  const url = String(message?.mediaUrl || '').toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/.test(url);
}

function attachmentDisplayName(message) {
  if (message?.content?.trim()) return message.content;
  const url = String(message?.mediaUrl || '');
  if (!url) return 'File';
  try {
    const rawName = url.split('/').pop() || 'File';
    return decodeURIComponent(rawName.split('?')[0] || 'File');
  } catch {
    return 'File';
  }
}

export default function Chat() {
  const role = useRoleFromPath();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const menuItems = useDashboardMenu(role);
  const { user } = useAuth();

  const targetRoomId = location.state?.chatRoomId || searchParams.get('roomId') || null;

  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesViewportRef = useRef(null);
  const currentRoomRef = useRef(null);
  const initialRoomApplied = useRef(false);
  const fileInputRef = useRef(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [mobileShowMessages, setMobileShowMessages] = useState(false);
  const [roomSearch, setRoomSearch] = useState('');
  const [filePickerAccept, setFilePickerAccept] = useState(
    'image/jpeg,image/png,image/gif,image/webp,image/bmp,image/svg+xml,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar',
  );

  const canonicalRoomId = useMemo(() => {
    if (selectedRoomId == null || selectedRoomId === '') return null;
    const room = rooms.find((r) => sameChatRoomId(r.id, selectedRoomId));
    return room ? room.id : String(selectedRoomId);
  }, [rooms, selectedRoomId]);

  const selectedRoom = useMemo(
    () => rooms.find((r) => sameChatRoomId(r.id, selectedRoomId)) || null,
    [rooms, selectedRoomId],
  );

  const hideHeroOnMobile = mobileShowMessages && Boolean(selectedRoom);
  const isClient = role === 'client';

  const counterpartyName = useMemo(() => {
    if (!selectedRoom) return '';
    return isClient ? selectedRoom.vendorName : selectedRoom.clientName;
  }, [selectedRoom, isClient]);
  const counterpartyId = useMemo(() => {
    if (!selectedRoom) return '';
    return isClient ? selectedRoom.vendorId : selectedRoom.clientId;
  }, [selectedRoom, isClient]);
  const counterpartyProfilePictureUrl = useMemo(() => {
    if (!selectedRoom) return null;
    return isClient ? selectedRoom.vendorProfilePictureUrl : selectedRoom.clientProfilePictureUrl;
  }, [selectedRoom, isClient]);

  const visibleRooms = useMemo(() => {
    const q = roomSearch.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((room) => {
      const peerName = (role === 'client' ? room.vendorName : room.clientName) || '';
      const preview = room.lastMessage || '';
      return `${peerName} ${preview}`.toLowerCase().includes(q);
    });
  }, [roomSearch, rooms, role]);

  const loadRooms = useCallback(async () => {
    if (!user?.token) return;
    setLoadingRooms(true);
    try {
      const result = await getChatRoomsApi({ token: user.token });
      setRooms(sortRoomsByLatestActivity(result));
    } catch (error) {
      toast.error(error.message || 'Failed to load chat rooms');
    } finally {
      setLoadingRooms(false);
    }
  }, [user?.token]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (initialRoomApplied.current || loadingRooms || rooms.length === 0) return;
    if (targetRoomId) {
      const exists = rooms.find((r) => sameChatRoomId(r.id, targetRoomId));
      if (exists) {
        setSelectedRoomId(exists.id);
        setMobileShowMessages(true);
        initialRoomApplied.current = true;
      }
    }
  }, [targetRoomId, rooms, loadingRooms]);

  const loadMessages = useCallback(async (roomId) => {
    if (!user?.token || !roomId) return;
    setLoadingMessages(true);
    try {
      const collected = [];
      const seen = new Set();

      for (let pageIndex = 1; pageIndex <= CHAT_MESSAGES_MAX_PAGES; pageIndex += 1) {
        const page = await getChatMessagesApi({
          chatRoomId: roomId,
          pageIndex,
          pageSize: CHAT_MESSAGES_PAGE_SIZE,
          token: user.token,
        });

        if (!Array.isArray(page) || page.length === 0) break;

        page.forEach((message) => {
          const key = messageStableKey(message);
          if (seen.has(key)) return;
          seen.add(key);
          collected.push(message);
        });

        if (page.length < CHAT_MESSAGES_PAGE_SIZE) break;
      }

      setMessages(sortMessagesByBackendOrder(collected));
    } catch (error) {
      toast.error(error.message || 'Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, [user?.token]);

  useEffect(() => {
    if (!selectedRoomId) {
      setMessages([]);
      return;
    }
    if (!canonicalRoomId) return;
    loadMessages(canonicalRoomId);
  }, [selectedRoomId, canonicalRoomId, loadMessages]);

  useEffect(() => {
    if (!canonicalRoomId || !user?.token) return;
    markMessagesReadApi({ chatRoomId: canonicalRoomId, token: user.token }).catch(() => {});
    setRooms((prev) =>
      prev.map((r) => (sameChatRoomId(r.id, canonicalRoomId) ? { ...r, unreadCount: 0 } : r)),
    );
  }, [canonicalRoomId, user?.token]);

  // ✅ scrollToBottom: الطريقتين مع بعض لضمان الشغل في normal + fullscreen
  const scrollToBottom = useCallback(() => {
    const vp = messagesViewportRef.current;
    const end = messagesEndRef.current;
    if (vp) vp.scrollTop = vp.scrollHeight;
    if (end) end.scrollIntoView({ block: 'end', behavior: 'instant' });
  }, []);

  // ✅ 3 توقيتات: فوري + 100ms (بعد framer-motion) + 300ms (للـ fullscreen)
  useEffect(() => {
    if (loadingMessages || messages.length === 0) return;
    scrollToBottom();
    const t1 = setTimeout(scrollToBottom, 100);
    const t2 = setTimeout(scrollToBottom, 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [messages, loadingMessages, scrollToBottom]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await startChatConnection();
      if (cancelled) return;
      const prev = currentRoomRef.current;
      const next = canonicalRoomId;
      if (prev && (!next || !sameChatRoomId(prev, next))) {
        await leaveRoom(prev);
      }
      if (cancelled) return;
      currentRoomRef.current = next;
      if (next) await joinRoom(next);
    })();
    return () => { cancelled = true; };
  }, [canonicalRoomId]);

  useEffect(() => {
    const unsub = onChatReconnected(() => {
      (async () => {
        await startChatConnection();
        const id = currentRoomRef.current;
        if (id) await joinRoom(id);
      })();
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsubMsg = onMessage((msg) => {
      const normalized = {
        id: String(msg?.id ?? msg?.Id ?? ''),
        chatRoomId: String(msg?.chatRoomId ?? msg?.ChatRoomId ?? ''),
        content: String(msg?.content ?? msg?.Content ?? ''),
        type: String(msg?.type ?? msg?.Type ?? 'text'),
        sender: String(msg?.sender ?? msg?.Sender ?? ''),
        sentAt: msg?.sentAt ?? msg?.SentAt ?? '',
        isRead: Boolean(msg?.isRead ?? msg?.IsRead ?? false),
        mediaUrl: msg?.mediaUrl ?? msg?.MediaUrl ?? msg?.attachmentUrl ?? msg?.AttachmentUrl ?? msg?.fileUrl ?? msg?.FileUrl ?? null,
        mediaMimeType: msg?.mediaMimeType ?? msg?.MediaMimeType ?? msg?.mimeType ?? msg?.MimeType ?? msg?.fileType ?? msg?.FileType ?? null,
        mediaSizeBytes: msg?.mediaSizeBytes ?? msg?.MediaSizeBytes ?? msg?.fileSizeBytes ?? msg?.FileSizeBytes ?? msg?.size ?? msg?.Size ?? null,
      };

      if (sameChatRoomId(normalized.chatRoomId, currentRoomRef.current)) {
        setMessages((prev) => {
          const nextKey = messageStableKey(normalized);
          if (prev.some((m) => messageStableKey(m) === nextKey)) return prev;
          return sortMessagesByBackendOrder([...prev, normalized]);
        });
        if (user?.token) {
          markMessagesReadApi({ chatRoomId: normalized.chatRoomId, token: user.token }).catch(() => {});
        }
      }

      setRooms((prev) => {
        const updated = prev.map((r) => {
          if (!sameChatRoomId(r.id, normalized.chatRoomId)) return r;
          const isCurrentRoom = sameChatRoomId(normalized.chatRoomId, currentRoomRef.current);
          return {
            ...r,
            lastMessage: normalized.content,
            lastMessageTime: normalized.sentAt,
            unreadCount: isCurrentRoom ? 0 : r.unreadCount + 1,
          };
        });
        return sortRoomsByLatestActivity(updated);
      });
    });

    const unsubRead = onUserMessagesRead((chatRoomId) => {
      if (!sameChatRoomId(chatRoomId, currentRoomRef.current)) return;
      const myType = isClient ? 'Client' : 'Vendor';
      setMessages((prev) =>
        prev.map((m) =>
          m.sender === myType && !m.isRead ? { ...m, isRead: true } : m,
        ),
      );
    });

    return () => {
      unsubMsg();
      unsubRead();
    };
  }, [user?.token, isClient]);

  const handleSelectRoom = (roomId) => {
    setSelectedRoomId(roomId);
    setMobileShowMessages(true);
  };

  const handleBackToRooms = () => {
    setMobileShowMessages(false);
  };

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || !canonicalRoomId || !user?.token || sending) return;
    setSending(true);
    setMessageText('');
    try {
      const created = await sendMessageApi({ chatRoomId: canonicalRoomId, content: text, token: user.token });
      if (created?.id) {
        setMessages((prev) => {
          const nextKey = messageStableKey(created);
          if (prev.some((m) => messageStableKey(m) === nextKey)) return prev;
          return sortMessagesByBackendOrder([...prev, created]);
        });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send message');
      setMessageText(text);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size cannot exceed 10 MB');
      return;
    }
    setPendingFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openFilePicker = (mode = 'all') => {
    if (sending) return;
    if (mode === 'image') {
      setFilePickerAccept('image/jpeg,image/png,image/gif,image/webp,image/bmp,image/svg+xml');
    } else if (mode === 'file') {
      setFilePickerAccept('.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar');
    } else {
      setFilePickerAccept('image/jpeg,image/png,image/gif,image/webp,image/bmp,image/svg+xml,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar');
    }
    requestAnimationFrame(() => { fileInputRef.current?.click(); });
  };

  const handleSendAttachment = async () => {
    if (!pendingFile || !canonicalRoomId || !user?.token || sending) return;
    setSending(true);
    const file = pendingFile;
    setPendingFile(null);
    try {
      const created = await sendAttachmentApi({
        chatRoomId: canonicalRoomId,
        file,
        content: messageText.trim() || undefined,
        token: user.token,
      });
      if (created?.id) {
        setMessages((prev) => {
          const nextKey = messageStableKey(created);
          if (prev.some((m) => messageStableKey(m) === nextKey)) return prev;
          return sortMessagesByBackendOrder([...prev, created]);
        });
      }
      setMessageText('');
    } catch (error) {
      toast.error(error.message || 'Failed to send attachment');
      setPendingFile(file);
    } finally {
      setSending(false);
    }
  };

  const mediaBaseUrl = getApiBaseUrl();
  const mySenderType = isClient ? 'Client' : 'Vendor';

  const roomsList = (
    <Card className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-indigo-200 bg-white/90 shadow-[0_14px_35px_rgba(79,70,229,0.08)]">
      <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-0">
        <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-sky-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-indigo-700 inline-flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              Conversations
            </h3>
            <Badge className="border border-indigo-200 bg-white text-indigo-700">{visibleRooms.length}</Badge>
          </div>
          <div className="mt-2 relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-indigo-400" />
            <Input
              value={roomSearch}
              onChange={(e) => setRoomSearch(e.target.value)}
              placeholder="Search conversation"
              className="h-8 border-indigo-200 bg-white/90 pl-8 text-xs text-slate-700"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(to_bottom,rgba(255,255,255,0.65),rgba(238,242,255,0.35))]">
          {loadingRooms && (
            <div className="p-6 text-center text-slate-500">Loading chats...</div>
          )}
          {!loadingRooms && rooms.length === 0 && (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <MessageSquare className="h-10 w-10 text-indigo-300" />
              <p className="text-sm font-semibold text-slate-700">No conversations yet</p>
              <p className="text-xs text-slate-500">
                Chat rooms are created when a proposal is accepted.
              </p>
            </div>
          )}
          {!loadingRooms && rooms.length > 0 && visibleRooms.length === 0 && (
            <div className="p-6 text-center text-sm text-indigo-700">No conversation matches your search.</div>
          )}
          {visibleRooms.map((room) => {
            const name = role === 'client' ? room.vendorName : room.clientName;
            const peerId = role === 'client' ? room.vendorId : room.clientId;
            const peerPic = role === 'client' ? room.vendorProfilePictureUrl : room.clientProfilePictureUrl;
            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22 }}
                onClick={() => handleSelectRoom(room.id)}
                className={`group mx-2 my-1.5 rounded-2xl border cursor-pointer transition-all duration-300 ${
                  sameChatRoomId(selectedRoomId, room.id)
                    ? 'border-indigo-300 bg-indigo-100/80 shadow-[0_10px_22px_rgba(79,70,229,0.16)]'
                    : 'border-transparent hover:border-indigo-200 hover:bg-indigo-50/80 hover:translate-x-0.5'
                }`}
              >
                <div className="flex items-start gap-3 p-3.5">
                  <div className="h-12 w-12 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <UserAvatarIconOnly
                      userId={peerId}
                      name={name}
                      profilePictureUrl={peerPic}
                      size="lg"
                      className="h-12 w-12 min-h-12 min-w-12 rounded-2xl shadow-md"
                      stopPropagation
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900 truncate">{name}</h4>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatTime(room.lastMessageTime || room.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 truncate">
                        {room.lastMessage || 'No messages yet'}
                      </p>
                      {room.unreadCount > 0 && (
                        <Badge className="ml-2 bg-indigo-600 text-white flex-shrink-0">
                          {room.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const messagePanel = (
    <Card className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-indigo-200 bg-white/95 shadow-[0_14px_35px_rgba(79,70,229,0.08)]">
      <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-0">
        {!selectedRoom ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <MessageSquare className="h-16 w-16 text-indigo-200" />
            <p className="text-lg font-semibold text-slate-700">Select a conversation</p>
            <p className="text-sm text-slate-500">Choose a chat room from the list to start messaging.</p>
          </div>
        ) : (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-indigo-100 bg-gradient-to-r from-white via-indigo-50/60 to-sky-50/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToRooms}
                  className="lg:hidden p-1 rounded-md hover:bg-gray-100 text-gray-600"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="h-10 w-10 shrink-0">
                  <UserAvatarIconOnly
                    userId={counterpartyId}
                    name={counterpartyName}
                    profilePictureUrl={counterpartyProfilePictureUrl}
                    size="md"
                    className="h-10 w-10 min-h-10 min-w-10 rounded-xl shadow-[0_10px_18px_rgba(79,70,229,0.3)]"
                    stopPropagation
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{counterpartyName}</h3>
                  <p className="text-sm text-gray-600 inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {isClient ? 'Vendor' : 'Client'}
                  </p>
                </div>
              </div>
            </div>

            {/* ✅ Messages — flex-[1_1_0%] فقط بدون flex-1 مكررة، وبدون overflowAnchor */}
            <div
              className="flex min-h-0 min-w-0 flex-[1_1_0%] flex-col overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.12),transparent_45%),linear-gradient(to_bottom,#f8faff,#eef2ff)] p-4"
              ref={messagesViewportRef}
            >
              {loadingMessages ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-slate-500">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <p className="text-sm font-semibold text-slate-600">No messages yet</p>
                  <p className="text-xs text-slate-400">Send the first message to start the conversation.</p>
                </div>
              ) : (
                <div className="flex min-h-0 w-full flex-col space-y-4">
                  <AnimatePresence initial={false}>
                    {messages.map((msg, index) => {
                      const isMe = msg.sender === mySenderType;
                      const prev = messages[index - 1];
                      const showDayDivider = index === 0 || messageDayKey(prev?.sentAt) !== messageDayKey(msg.sentAt);
                      return (
                        <motion.div
                          key={messageStableKey(msg)}
                          initial={{ opacity: 0, y: 12, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.98 }}
                          transition={{ duration: 0.22 }}
                          className="space-y-2"
                        >
                          {showDayDivider && (
                            <div className="flex justify-center">
                              <span className="rounded-full border border-indigo-200 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 shadow-sm">
                                {messageDayLabel(msg.sentAt)}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {(() => {
                              const mediaHref = resolveMediaUrl(msg.mediaUrl, mediaBaseUrl);
                              const imageMedia = isImageMedia(msg);
                              return (
                                <div
                                  className={`max-w-[78%] rounded-2xl p-3 shadow-sm ${
                                    isMe
                                      ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-md'
                                      : 'bg-white text-gray-900 rounded-bl-md border border-indigo-100'
                                  }`}
                                >
                                  {msg.mediaUrl && imageMedia && (
                                    <a href={mediaHref} target="_blank" rel="noopener noreferrer" className="block mb-2">
                                      <img
                                        src={mediaHref}
                                        alt={msg.content || 'Attachment'}
                                        className="max-w-full max-h-60 rounded-lg object-cover"
                                        onLoad={scrollToBottom}
                                      />
                                    </a>
                                  )}
                                  {msg.mediaUrl && !imageMedia && (
                                    <a
                                      href={mediaHref}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2 mb-2 rounded-lg border px-3 py-2 text-sm ${
                                        isMe
                                          ? 'border-indigo-300/40 bg-indigo-500/30 text-white hover:bg-indigo-500/50'
                                          : 'border-indigo-200 bg-indigo-50 text-slate-700 hover:bg-indigo-100/60'
                                      }`}
                                    >
                                      <FileText className="w-4 h-4 flex-shrink-0" />
                                      <span className="truncate">{attachmentDisplayName(msg)}</span>
                                      {msg.mediaSizeBytes && (
                                        <span className="text-xs opacity-70 flex-shrink-0">
                                          {(msg.mediaSizeBytes / 1024).toFixed(0)} KB
                                        </span>
                                      )}
                                    </a>
                                  )}
                                  {(!msg.mediaUrl || imageMedia) && (
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                  )}
                                  <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                                    <p className={`text-xs ${isMe ? 'text-indigo-200' : 'text-gray-500'}`}>
                                      {formatMessageTime(msg.sentAt)}
                                    </p>
                                    {isMe && (
                                      <span
                                        className={`text-xs font-medium ${msg.isRead ? 'text-sky-300' : 'text-indigo-300/50'}`}
                                        title={msg.isRead ? 'Read' : 'Sent'}
                                      >
                                        {msg.isRead ? '✓✓' : '✓'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {/* ✅ مرساة الـ scroll */}
                  <div ref={messagesEndRef} className="h-px w-full shrink-0" aria-hidden />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-indigo-100 bg-white flex-shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={filePickerAccept}
                onChange={handleFileSelect}
              />
              {pendingFile && (
                <div className="mb-2 flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm">
                  {pendingFile.type.startsWith('image/') ? (
                    <Image className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  )}
                  <span className="truncate text-slate-700">{pendingFile.name}</span>
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    {(pendingFile.size / 1024).toFixed(0)} KB
                  </span>
                  <button onClick={() => setPendingFile(null)} className="ml-auto text-slate-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100"
                  disabled={sending}
                  onClick={() => openFilePicker('all')}
                  title="Attach"
                >
                  <Pin className="w-4 h-4" />
                </Button>
                <Input
                  placeholder={pendingFile ? 'Add a caption (optional)...' : 'Type your message...'}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      pendingFile ? handleSendAttachment() : handleSend();
                    }
                  }}
                  className="flex-1 min-w-0"
                  disabled={sending}
                />
                <Button
                  onClick={pendingFile ? handleSendAttachment : handleSend}
                  className="gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 flex-shrink-0"
                  disabled={(!messageText.trim() && !pendingFile) || sending}
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout menuItems={menuItems} userRole={role}>
      <div className="-mt-4 flex h-[calc(100dvh-3.25rem)] max-h-[calc(100dvh-3.25rem)] flex-col overflow-hidden sm:-mt-6 sm:h-[calc(100dvh-3.75rem)] sm:max-h-[calc(100dvh-3.75rem)] lg:-mt-8 lg:h-[calc(100dvh-4.25rem)] lg:max-h-[calc(100dvh-4.25rem)]">
        <div className={`${hideHeroOnMobile ? 'hidden lg:block' : ''} relative mb-3 flex-shrink-0 overflow-hidden rounded-3xl border border-violet-200/50 bg-gradient-to-br from-violet-800 via-indigo-700 to-blue-700 p-3 text-white shadow-[0_16px_36px_rgba(37,18,94,0.34)] sm:p-4`}>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-900/55 via-indigo-900/50 to-blue-900/55" />
          <div className="pointer-events-none absolute -left-20 top-6 h-56 w-56 rounded-full bg-violet-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-blue-300/15 blur-3xl" />
          <div className="relative flex flex-col gap-3 md:gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-violet-200/40 bg-violet-200/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-violet-100">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Chat Lounge
              </p>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Messages <span className="text-violet-200">Live</span>
              </h1>
              <p className="mt-1 text-sm text-slate-200">
                Real-time conversation with {role === 'client' ? 'vendors' : 'clients'}
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200/60 bg-emerald-200/15 px-2.5 py-1 text-xs font-semibold text-emerald-100"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure
              </motion.div>
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.8, delay: 0.25, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200/70 bg-amber-200/15 px-2.5 py-1 text-xs font-semibold text-amber-100"
              >
                <Zap className="h-3.5 w-3.5" />
                Instant
              </motion.div>
            </div>
          </div>
        </div>

        {/* Desktop: side-by-side */}
        <div className="hidden min-h-0 flex-1 lg:grid lg:grid-cols-3 lg:gap-4">
          <div className="min-h-0 min-w-0 lg:col-span-1">{roomsList}</div>
          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden lg:col-span-2">{messagePanel}</div>
        </div>

        {/* Mobile: show one at a time */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:hidden">
          {mobileShowMessages && selectedRoom ? messagePanel : roomsList}
        </div>
      </div>
    </DashboardLayout>
  );
}