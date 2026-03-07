"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  adminAuthAPI,
  chatAPI,
  ChatConversation,
  ChatConversationStatus,
  ChatMessage,
  SOCKET_BASE_URL,
} from "@/lib/api";
import { getApiErrorMessage, toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, RefreshCw, Send } from "lucide-react";
import {
  AdminPage,
  AdminPageHeader,
  AdminPanel,
} from "@/components/layouts/AdminPageShell";

type FilterStatus = ChatConversationStatus | "ALL";

const sortConversations = (
  conversations: ChatConversation[]
): ChatConversation[] => {
  return [...conversations].sort((a, b) => {
    const statusWeight = (value: ChatConversation["status"]) =>
      value === "ACTIVE" ? 0 : 1;

    if (statusWeight(a.status) !== statusWeight(b.status)) {
      return statusWeight(a.status) - statusWeight(b.status);
    }

    const aDate = new Date(a.lastMessageAt ?? a.updatedAt).getTime();
    const bDate = new Date(b.lastMessageAt ?? b.updatedAt).getTime();
    return bDate - aDate;
  });
};

const mergeConversation = (
  conversations: ChatConversation[],
  incoming: ChatConversation
): ChatConversation[] => {
  const index = conversations.findIndex(
    (conversation) => conversation.id === incoming.id
  );

  if (index < 0) {
    return sortConversations([incoming, ...conversations]);
  }

  const next = [...conversations];
  next[index] = incoming;
  return sortConversations(next);
};

const addMessageIfMissing = (
  messages: ChatMessage[],
  incoming: ChatMessage
): ChatMessage[] => {
  if (messages.some((message) => message.id === incoming.id)) {
    return messages;
  }
  return [...messages, incoming];
};

const formatDateTime = (value: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isDocumentInFocus = (): boolean => {
  if (typeof document === "undefined") {
    return true;
  }
  return document.visibilityState === "visible" && document.hasFocus();
};

export default function AdminChatsPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ACTIVE");
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [converting, setConverting] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    return Notification.permission;
  });
  const [windowFocused, setWindowFocused] = useState(true);
  const activeConversationIdRef = useRef<string | null>(null);
  const conversationsRef = useRef<ChatConversation[]>([]);
  const windowFocusedRef = useRef(true);
  const readInFlightRef = useRef<Set<string>>(new Set());
  const askedPermissionRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    windowFocusedRef.current = windowFocused;
  }, [windowFocused]);

  useEffect(() => {
    const updateFocusState = () => {
      setWindowFocused(isDocumentInFocus());
    };

    updateFocusState();
    window.addEventListener("focus", updateFocusState);
    window.addEventListener("blur", updateFocusState);
    document.addEventListener("visibilitychange", updateFocusState);

    return () => {
      window.removeEventListener("focus", updateFocusState);
      window.removeEventListener("blur", updateFocusState);
      document.removeEventListener("visibilitychange", updateFocusState);
    };
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    if (Notification.permission === "granted" || Notification.permission === "denied") {
      setNotificationPermission(Notification.permission);
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    setNotificationPermission(Notification.permission);
    if (Notification.permission === "default" && !askedPermissionRef.current) {
      askedPermissionRef.current = true;
      void requestNotificationPermission();
    }
  }, [requestNotificationPermission]);

  const showBrowserNotification = useCallback(
    (conversation: ChatConversation, message: ChatMessage) => {
      if (
        typeof window === "undefined" ||
        !("Notification" in window) ||
        Notification.permission !== "granted"
      ) {
        return;
      }

      const body =
        message.message.length > 140
          ? `${message.message.slice(0, 137)}...`
          : message.message;

      const notification = new Notification(
        `New customer message (${conversation.customerName})`,
        {
          body,
          icon: "/logo-new.png",
          tag: `admin-chat-${conversation.id}`,
        }
      );

      notification.onclick = () => {
        window.focus();
        setActiveConversationId(conversation.id);
      };
    },
    []
  );

  const markConversationRead = useCallback(async (conversationId: string) => {
    const target = conversationsRef.current.find(
      (conversation) => conversation.id === conversationId
    );

    if (!target || target.unreadForAdminCount <= 0) {
      return;
    }

    if (readInFlightRef.current.has(conversationId)) {
      return;
    }

    readInFlightRef.current.add(conversationId);
    try {
      const data = await chatAPI.markConversationRead(conversationId);
      if (data.conversation) {
        setConversations((previous) =>
          mergeConversation(previous, data.conversation)
        );
      }
    } catch (error) {
      console.error("Failed to mark admin chat as read", error);
    } finally {
      readInFlightRef.current.delete(conversationId);
    }
  }, []);

  const loadConversations = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoadingConversations(true);
      } else {
        setRefreshing(true);
      }

      try {
        const data = await chatAPI.getConversations({
          status: filterStatus,
          take: 200,
        });
        const next = sortConversations(Array.isArray(data) ? data : []);
        setConversations(next);

        if (!next.length) {
          setActiveConversationId(null);
          setMessages([]);
          return;
        }

        setActiveConversationId((previous) => {
          if (previous && next.some((conversation) => conversation.id === previous)) {
            return previous;
          }
          return next[0].id;
        });
      } catch (error) {
        console.error("Failed to load conversations", error);
      } finally {
        if (!silent) {
          setLoadingConversations(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [filterStatus]
  );

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const data = await chatAPI.getConversationMessages(conversationId);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      if (data.conversation) {
        setConversations((previous) =>
          mergeConversation(previous, data.conversation)
        );
      }
    } catch (error) {
      console.error("Failed to load messages", error);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    loadMessages(activeConversationId);
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    if (!activeConversationId || !windowFocused) {
      return;
    }

    const activeConversation = conversations.find(
      (conversation) => conversation.id === activeConversationId
    );

    if (activeConversation?.unreadForAdminCount) {
      void markConversationRead(activeConversationId);
    }
  }, [activeConversationId, conversations, markConversationRead, windowFocused]);

  useEffect(() => {
    const token = adminAuthAPI.getToken();
    if (!token) {
      return;
    }

    const socket = io(SOCKET_BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("chat:conversation:updated", (conversation: ChatConversation) => {
      if (!conversation?.id) {
        return;
      }

      setConversations((previous) => mergeConversation(previous, conversation));

      if (!activeConversationIdRef.current) {
        setActiveConversationId(conversation.id);
      }
    });

    socket.on("chat:message:new", (message: ChatMessage) => {
      if (!message?.id || !message.conversationId) {
        return;
      }

      const isCustomerMessage = message.senderType === "CUSTOMER";
      const isActiveConversation = activeConversationIdRef.current === message.conversationId;
      const shouldAutoRead = isCustomerMessage && isActiveConversation && windowFocusedRef.current;
      const conversationForNotification = conversationsRef.current.find(
        (conversation) => conversation.id === message.conversationId
      );

      setConversations((previous) => {
        const existing = previous.find(
          (conversation) => conversation.id === message.conversationId
        );

        if (!existing) {
          return previous;
        }

        const nextUnreadForAdminCount =
          isCustomerMessage && !shouldAutoRead
            ? existing.unreadForAdminCount + 1
            : shouldAutoRead
            ? 0
            : existing.unreadForAdminCount;

        return mergeConversation(previous, {
          ...existing,
          lastMessage: message.message,
          lastMessageAt: message.createdAt,
          latestMessage: message,
          unreadForAdminCount: nextUnreadForAdminCount,
          status: "ACTIVE",
        });
      });

      if (isActiveConversation) {
        setMessages((previous) => addMessageIfMissing(previous, message));
      }

      if (isCustomerMessage) {
        if (shouldAutoRead) {
          void markConversationRead(message.conversationId);
        } else if (conversationForNotification) {
          showBrowserNotification(conversationForNotification, message);
        }
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [markConversationRead, showBrowserNotification]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId
      ) ?? null,
    [activeConversationId, conversations]
  );

  const totalUnread = useMemo(
    () =>
      conversations.reduce(
        (total, conversation) => total + conversation.unreadForAdminCount,
        0
      ),
    [conversations]
  );

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!activeConversationId) {
      return;
    }

    const message = replyText.trim();
    if (!message) {
      return;
    }

    setSending(true);
    try {
      const data = await chatAPI.sendMessage(activeConversationId, message);
      if (data.message) {
        setMessages((previous) => addMessageIfMissing(previous, data.message));
      }
      setReplyText("");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to send reply"));
    } finally {
      setSending(false);
    }
  };

  const handleCloseConversation = async () => {
    if (!activeConversationId) {
      return;
    }

    setUpdatingStatus(true);
    try {
      const data = await chatAPI.closeConversation(activeConversationId);
      if (data.conversation) {
        setConversations((previous) =>
          mergeConversation(previous, data.conversation)
        );
      }
      toast.success("Conversation closed");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to close conversation"));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReopenConversation = async () => {
    if (!activeConversationId) {
      return;
    }

    setUpdatingStatus(true);
    try {
      const data = await chatAPI.reopenConversation(activeConversationId);
      if (data.conversation) {
        setConversations((previous) =>
          mergeConversation(previous, data.conversation)
        );
      }
      toast.success("Conversation reopened");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to reopen conversation"));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConvertToInquiry = async () => {
    if (!activeConversationId) {
      return;
    }

    setConverting(true);
    try {
      await chatAPI.convertToInquiry(activeConversationId);
      toast.success("Converted to inquiry");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to convert chat"));
    } finally {
      setConverting(false);
    }
  };

  return (
    <AdminPage className="flex h-full flex-col gap-4">
      <AdminPageHeader
        title="Live Chats"
        description="Instant customer conversations and admin replies."
        actions={
          <>
            <Button
              variant={filterStatus === "ACTIVE" ? "default" : "outline"}
              onClick={() => setFilterStatus("ACTIVE")}
            >
              Active
            </Button>
            <Button
              variant={filterStatus === "CLOSED" ? "default" : "outline"}
              onClick={() => setFilterStatus("CLOSED")}
            >
              Closed
            </Button>
            <Button
              variant={filterStatus === "ALL" ? "default" : "outline"}
              onClick={() => setFilterStatus("ALL")}
            >
              All
            </Button>
            <Button
              variant="outline"
              onClick={() => loadConversations(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {notificationPermission === "granted" ? (
              <Badge variant="secondary">Browser notifications on</Badge>
            ) : notificationPermission === "default" ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void requestNotificationPermission()}
              >
                Enable notifications
              </Button>
            ) : null}
          </>
        }
      >
        <Badge className="border-[#4f83f0] bg-[#e7efff] text-[#1f56cc]">
          Unread messages: {totalUnread}
        </Badge>
      </AdminPageHeader>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <AdminPanel className="min-h-0 overflow-hidden p-0">
          <div className="border-b border-[var(--shell-border)] px-4 py-3">
            <p className="text-sm font-medium">
              Conversations ({conversations.length})
            </p>
          </div>

          <div className="h-[520px] overflow-y-auto p-3">
            {loadingConversations ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No conversations
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setActiveConversationId(conversation.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                      activeConversationId === conversation.id
                        ? "border-primary bg-primary/10 shadow-[inset_0_0_0_1px_rgba(13,118,73,0.15)]"
                        : "border-border bg-[var(--surface-elevated)] hover:bg-muted/70"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {conversation.customerName}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            conversation.status === "ACTIVE" ? "default" : "secondary"
                          }
                        >
                          {conversation.status}
                        </Badge>
                        {conversation.unreadForAdminCount > 0 ? (
                          <Badge
                            variant="destructive"
                            className="h-5 min-w-[1.25rem] justify-center px-1"
                          >
                            {conversation.unreadForAdminCount}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {conversation.mobile}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {conversation.lastMessage || "No message"}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDateTime(conversation.lastMessageAt)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </AdminPanel>

        <AdminPanel className="min-h-0 overflow-hidden p-0">
          {!activeConversation ? (
            <div className="flex h-full min-h-[460px] items-center justify-center p-4 text-center text-sm text-muted-foreground">
              <div>
                <MessageCircle className="mx-auto mb-2 h-7 w-7" />
                Select a conversation to start replying.
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[460px] flex-col">
              <div className="border-b border-[var(--shell-border)] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold">
                      {activeConversation.customerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activeConversation.mobile}
                      {activeConversation.email
                        ? ` | ${activeConversation.email}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        activeConversation.status === "ACTIVE"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {activeConversation.status}
                    </Badge>

                    {activeConversation.status === "ACTIVE" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCloseConversation}
                        disabled={updatingStatus}
                      >
                        Close
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleReopenConversation}
                        disabled={updatingStatus}
                      >
                        Reopen
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleConvertToInquiry}
                      disabled={converting}
                    >
                      Convert to Inquiry
                    </Button>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--surface-soft)] p-4">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No messages in this conversation.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((message) => {
                      const isAdmin = message.senderType === "ADMIN";
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                              isAdmin
                                ? "bg-[var(--primary)] text-white"
                                : "bg-[var(--surface-elevated)] text-foreground"
                            }`}
                          >
                            <p>{message.message}</p>
                            <p
                              className={`mt-1 text-[11px] ${
                                isAdmin ? "text-white/75" : "text-[#6f6761]"
                              }`}
                            >
                              {formatDateTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <form
                onSubmit={handleSendMessage}
                className="border-t border-[var(--shell-border)] bg-card p-3"
              >
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type reply..."
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                  />
                  <Button type="submit" size="icon" disabled={sending}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </AdminPanel>
      </div>
    </AdminPage>
  );
}
