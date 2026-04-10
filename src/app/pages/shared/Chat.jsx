import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Send, Paperclip, MessageSquare, Image, FileText, X, ArrowLeft } from 'lucide-react';
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
} from '../../lib/chatSignalr';

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

function getInitials(name) {
  return (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '??';
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

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId) || null,
    [rooms, selectedRoomId],
  );

  const isClient = role === 'client';

  const counterpartyName = useMemo(() => {
    if (!selectedRoom) return '';
    return isClient ? selectedRoom.vendorName : selectedRoom.clientName;
  }, [selectedRoom, isClient]);

  const loadRooms = useCallback(async () => {
    if (!user?.token) return;
    setLoadingRooms(true);
    try {
      const result = await getChatRoomsApi({ token: user.token });
      setRooms(result);
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
      const exists = rooms.find((r) => r.id === targetRoomId);
      if (exists) {
        setSelectedRoomId(targetRoomId);
        setMobileShowMessages(true);
        initialRoomApplied.current = true;
      }
    }
  }, [targetRoomId, rooms, loadingRooms]);

  const loadMessages = useCallback(async (roomId) => {
    if (!user?.token || !roomId) return;
    setLoadingMessages(true);
    try {
      const result = await getChatMessagesApi({ chatRoomId: roomId, token: user.token });
      setMessages(result);
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
    loadMessages(selectedRoomId);
  }, [selectedRoomId, loadMessages]);

  useEffect(() => {
    if (!selectedRoomId || !user?.token) return;
    markMessagesReadApi({ chatRoomId: selectedRoomId, token: user.token }).catch(() => {});
    setRooms((prev) =>
      prev.map((r) => (r.id === selectedRoomId ? { ...r, unreadCount: 0 } : r)),
    );
  }, [selectedRoomId, user?.token]);

  const scrollToBottom = useCallback(() => {
    const viewport = messagesViewportRef.current;
    if (viewport) {
      requestAnimationFrame(() => {
        viewport.scrollTop = viewport.scrollHeight;
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const prev = currentRoomRef.current;
    if (prev && prev !== selectedRoomId) {
      leaveRoom(prev);
    }
    currentRoomRef.current = selectedRoomId;
    if (selectedRoomId) {
      joinRoom(selectedRoomId);
    }
  }, [selectedRoomId]);

  useEffect(() => {
    const unsubMsg = onMessage((msg) => {
      const normalized = {
        id: msg?.id || msg?.Id || '',
        chatRoomId: msg?.chatRoomId || msg?.ChatRoomId || '',
        content: msg?.content || msg?.Content || '',
        type: msg?.type || msg?.Type || 'text',
        sender: msg?.sender || msg?.Sender || '',
        sentAt: msg?.sentAt || msg?.SentAt || '',
        isRead: msg?.isRead || msg?.IsRead || false,
        mediaUrl: msg?.mediaUrl || msg?.MediaUrl || null,
        mediaMimeType: msg?.mediaMimeType || msg?.MediaMimeType || null,
        mediaSizeBytes: msg?.mediaSizeBytes || msg?.MediaSizeBytes || null,
      };

      if (normalized.chatRoomId === currentRoomRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === normalized.id)) return prev;
          return [...prev, normalized];
        });
        if (user?.token) {
          markMessagesReadApi({ chatRoomId: normalized.chatRoomId, token: user.token }).catch(() => {});
        }
      }

      setRooms((prev) =>
        prev.map((r) => {
          if (r.id !== normalized.chatRoomId) return r;
          const isCurrentRoom = normalized.chatRoomId === currentRoomRef.current;
          return {
            ...r,
            lastMessage: normalized.content,
            lastMessageTime: normalized.sentAt,
            unreadCount: isCurrentRoom ? 0 : r.unreadCount + 1,
          };
        }),
      );
    });

    const unsubRead = onUserMessagesRead((chatRoomId, readByUserId) => {
      if (chatRoomId !== currentRoomRef.current) return;
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
    if (!text || !selectedRoomId || !user?.token || sending) return;
    setSending(true);
    setMessageText('');
    try {
      await sendMessageApi({ chatRoomId: selectedRoomId, content: text, token: user.token });
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

  const handleSendAttachment = async () => {
    if (!pendingFile || !selectedRoomId || !user?.token || sending) return;
    setSending(true);
    const file = pendingFile;
    setPendingFile(null);
    try {
      await sendAttachmentApi({
        chatRoomId: selectedRoomId,
        file,
        content: messageText.trim() || undefined,
        token: user.token,
      });
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
    <Card className="h-full flex flex-col">
      <CardContent className="p-0 flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
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
          {rooms.map((room) => {
            const name = role === 'client' ? room.vendorName : room.clientName;
            return (
              <div
                key={room.id}
                onClick={() => handleSelectRoom(room.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedRoomId === room.id ? 'bg-indigo-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {getInitials(name)}
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
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const messagePanel = (
    <Card className="h-full flex flex-col">
      <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
        {!selectedRoom ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <MessageSquare className="h-16 w-16 text-indigo-200" />
            <p className="text-lg font-semibold text-slate-700">
              Select a conversation
            </p>
            <p className="text-sm text-slate-500">
              Choose a chat room from the list to start messaging.
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToRooms}
                  className="lg:hidden p-1 rounded-md hover:bg-gray-100 text-gray-600"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {getInitials(counterpartyName)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{counterpartyName}</h3>
                  <p className="text-sm text-gray-600">
                    {isClient ? 'Vendor' : 'Client'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4" ref={messagesViewportRef}>
              {loadingMessages ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-slate-500">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <p className="text-sm font-semibold text-slate-600">No messages yet</p>
                  <p className="text-xs text-slate-400">
                    Send the first message to start the conversation.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isMe = msg.sender === mySenderType;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl p-3 ${
                            isMe
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {msg.mediaUrl && msg.mediaMimeType?.startsWith('image/') && (
                            <a
                              href={`${mediaBaseUrl}${msg.mediaUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block mb-2"
                            >
                              <img
                                src={`${mediaBaseUrl}${msg.mediaUrl}`}
                                alt={msg.content || 'Attachment'}
                                className="max-w-full max-h-60 rounded-lg object-cover"
                              />
                            </a>
                          )}
                          {msg.mediaUrl && !msg.mediaMimeType?.startsWith('image/') && (
                            <a
                              href={`${mediaBaseUrl}${msg.mediaUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 mb-2 rounded-lg border px-3 py-2 text-sm ${
                                isMe
                                  ? 'border-indigo-400/40 bg-indigo-500/30 text-white hover:bg-indigo-500/50'
                                  : 'border-gray-200 bg-white text-slate-700 hover:bg-gray-50'
                              }`}
                            >
                              <FileText className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{msg.content || 'File'}</span>
                              {msg.mediaSizeBytes && (
                                <span className="text-xs opacity-70 flex-shrink-0">
                                  {(msg.mediaSizeBytes / 1024).toFixed(0)} KB
                                </span>
                              )}
                            </a>
                          )}
                          {(!msg.mediaUrl || msg.mediaMimeType?.startsWith('image/')) && (
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          )}
                          <div
                            className={`flex items-center gap-1 mt-1 ${
                              isMe ? 'justify-end' : ''
                            }`}
                          >
                            <p
                              className={`text-xs ${
                                isMe ? 'text-indigo-200' : 'text-gray-500'
                              }`}
                            >
                              {formatMessageTime(msg.sentAt)}
                            </p>
                            {isMe && (
                              <span
                                className={`text-xs font-medium ${
                                  msg.isRead ? 'text-sky-300' : 'text-indigo-300/50'
                                }`}
                                title={msg.isRead ? 'Read' : 'Sent'}
                              >
                                {msg.isRead ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 flex-shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/gif,image/webp,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                onChange={handleFileSelect}
              />
              {pendingFile && (
                <div className="mb-2 flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm">
                  {pendingFile.type.startsWith('image/') ? (
                    <Image className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  )}
                  <span className="truncate text-slate-700">{pendingFile.name}</span>
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    {(pendingFile.size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    onClick={() => setPendingFile(null)}
                    className="ml-auto text-slate-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0"
                  disabled={sending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-4 h-4" />
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
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700 flex-shrink-0"
                  disabled={(!messageText.trim() && !pendingFile) || sending}
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout menuItems={menuItems} userRole={role}>
      <div className="flex flex-col h-[calc(100vh-7rem)] overflow-hidden">
        <div className="mb-4 flex-shrink-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Messages</h1>
          <p className="text-gray-600 text-sm">
            Communicate with {role === 'client' ? 'vendors' : 'clients'}
          </p>
        </div>

        {/* Desktop: side-by-side */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-4 flex-1 min-h-0">
          <div className="lg:col-span-1 min-h-0">{roomsList}</div>
          <div className="lg:col-span-2 min-h-0">{messagePanel}</div>
        </div>

        {/* Mobile: show one at a time */}
        <div className="lg:hidden flex-1 min-h-0">
          {mobileShowMessages && selectedRoom ? messagePanel : roomsList}
        </div>
      </div>
    </DashboardLayout>
  );
}
