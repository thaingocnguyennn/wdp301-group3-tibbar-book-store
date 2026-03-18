import { useEffect, useMemo, useRef, useState } from "react";
import { supportApi } from "../../api/supportApi";

const POLL_INTERVAL_MS = 5000;

const AdminSupportPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messageListRef = useRef(null);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item._id === selectedConversationId) || null,
    [conversations, selectedConversationId],
  );

  const fetchConversations = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoadingConversations(true);
      }
      const response = await supportApi.getAdminConversations();
      const data = response?.data?.conversations || [];
      setConversations(data);

      if (!selectedConversationId && data.length > 0) {
        setSelectedConversationId(data[0]._id);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load conversations");
    } finally {
      if (!silent) {
        setLoadingConversations(false);
      }
    }
  };

  const fetchMessages = async (conversationId, { silent = false } = {}) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    try {
      if (!silent) {
        setLoadingMessages(true);
      }
      const response = await supportApi.getAdminConversationMessages(conversationId);
      setMessages(response?.data?.messages || []);
      setError("");
      await fetchConversations({ silent: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load messages");
    } finally {
      if (!silent) {
        setLoadingMessages(false);
      }
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId);
    }
  }, [selectedConversationId]);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      await fetchConversations({ silent: true });
      if (selectedConversationId) {
        await fetchMessages(selectedConversationId, { silent: true });
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [selectedConversationId]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedConversationId || !draft.trim() || sending) {
      return;
    }

    try {
      setSending(true);
      await supportApi.sendAdminMessage(selectedConversationId, draft.trim());
      setDraft("");
      await fetchMessages(selectedConversationId, { silent: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Admin Support Inbox</h1>
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>Conversations</div>
          {loadingConversations ? (
            <div style={styles.placeholder}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div style={styles.placeholder}>No customer conversations yet</div>
          ) : (
            conversations.map((conversation) => {
              const customer = conversation.customer;
              const displayName =
                `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim() ||
                customer?.email ||
                "Unknown customer";
              const isSelected = conversation._id === selectedConversationId;

              return (
                <button
                  key={conversation._id}
                  type="button"
                  onClick={() => setSelectedConversationId(conversation._id)}
                  style={{
                    ...styles.conversationItem,
                    ...(isSelected ? styles.conversationItemActive : {}),
                  }}
                >
                  <div style={styles.conversationTopRow}>
                    <span style={styles.customerName}>{displayName}</span>
                    {conversation.unreadForAdmin > 0 && (
                      <span style={styles.unreadBadge}>{conversation.unreadForAdmin}</span>
                    )}
                  </div>
                  <div style={styles.preview}>{conversation.lastMessagePreview || "No messages yet"}</div>
                </button>
              );
            })
          )}
        </aside>

        <section style={styles.chatSection}>
          {!selectedConversation ? (
            <div style={styles.placeholder}>Select a conversation to view messages.</div>
          ) : (
            <>
              <div style={styles.chatHeader}>
                <div>
                  <div style={styles.chatName}>
                    {(selectedConversation.customer?.firstName || "") + " " + (selectedConversation.customer?.lastName || "")}
                  </div>
                  <div style={styles.chatEmail}>{selectedConversation.customer?.email}</div>
                </div>
              </div>

              <div ref={messageListRef} style={styles.messages}>
                {loadingMessages ? (
                  <div style={styles.placeholder}>Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div style={styles.placeholder}>No messages yet.</div>
                ) : (
                  messages.map((message) => {
                    const isAdmin = message.senderRole === "admin";
                    return (
                      <div
                        key={message._id}
                        style={{
                          ...styles.messageRow,
                          justifyContent: isAdmin ? "flex-end" : "flex-start",
                        }}
                      >
                        <div
                          style={{
                            ...styles.messageBubble,
                            ...(isAdmin ? styles.adminBubble : styles.customerBubble),
                          }}
                        >
                          <div style={styles.messageRole}>{isAdmin ? "Admin" : "Customer"}</div>
                          <div>{message.content}</div>
                          <div style={styles.messageTime}>{new Date(message.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSend} style={styles.form}>
                <textarea
                  rows={3}
                  style={styles.textarea}
                  placeholder="Type your reply..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={sending}
                />
                <button type="submit" style={styles.sendButton} disabled={!draft.trim() || sending}>
                  {sending ? "Sending..." : "Reply"}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

const styles = {
  page: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "1.5rem",
  },
  title: {
    margin: "0 0 1rem",
    color: "#1f2d3d",
  },
  error: {
    marginBottom: "0.75rem",
    backgroundColor: "#ffeaea",
    color: "#a33838",
    borderRadius: "8px",
    padding: "0.65rem",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    gap: "1rem",
  },
  sidebar: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    border: "1px solid #dbe4ef",
    overflow: "hidden",
    maxHeight: "760px",
    overflowY: "auto",
  },
  sidebarHeader: {
    padding: "0.9rem",
    fontWeight: 700,
    borderBottom: "1px solid #e8eef6",
    color: "#334e68",
  },
  conversationItem: {
    width: "100%",
    textAlign: "left",
    border: "none",
    borderBottom: "1px solid #eef2f7",
    padding: "0.8rem",
    backgroundColor: "#fff",
    cursor: "pointer",
  },
  conversationItemActive: {
    backgroundColor: "#eff6ff",
  },
  conversationTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.4rem",
  },
  customerName: {
    fontWeight: 600,
    color: "#243447",
  },
  unreadBadge: {
    minWidth: "20px",
    textAlign: "center",
    padding: "0.1rem 0.4rem",
    borderRadius: "999px",
    backgroundColor: "#d62828",
    color: "#fff",
    fontSize: "0.75rem",
    fontWeight: 700,
  },
  preview: {
    marginTop: "0.3rem",
    color: "#627d98",
    fontSize: "0.86rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  chatSection: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    border: "1px solid #dbe4ef",
    display: "flex",
    flexDirection: "column",
    minHeight: "680px",
  },
  chatHeader: {
    borderBottom: "1px solid #e8eef6",
    padding: "0.85rem 1rem",
  },
  chatName: {
    fontWeight: 700,
    color: "#243447",
  },
  chatEmail: {
    color: "#627d98",
    fontSize: "0.88rem",
  },
  messages: {
    flex: 1,
    padding: "1rem",
    backgroundColor: "#f6f9fc",
    overflowY: "auto",
  },
  placeholder: {
    color: "#7b8794",
    textAlign: "center",
    marginTop: "1rem",
  },
  messageRow: {
    display: "flex",
    marginBottom: "0.8rem",
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: "12px",
    padding: "0.65rem 0.75rem",
    wordBreak: "break-word",
  },
  adminBubble: {
    backgroundColor: "#2f6fed",
    color: "#fff",
  },
  customerBubble: {
    backgroundColor: "#fff",
    border: "1px solid #dce4ee",
    color: "#243447",
  },
  messageRole: {
    fontSize: "0.76rem",
    fontWeight: 700,
    marginBottom: "0.2rem",
  },
  messageTime: {
    marginTop: "0.35rem",
    fontSize: "0.72rem",
    opacity: 0.8,
  },
  form: {
    borderTop: "1px solid #e8eef6",
    padding: "0.9rem",
    display: "flex",
    gap: "0.7rem",
    alignItems: "flex-end",
  },
  textarea: {
    flex: 1,
    resize: "vertical",
    borderRadius: "10px",
    border: "1px solid #cdd8e6",
    padding: "0.7rem",
    fontFamily: "inherit",
  },
  sendButton: {
    border: "none",
    backgroundColor: "#2f6fed",
    color: "#fff",
    borderRadius: "10px",
    fontWeight: 700,
    padding: "0.7rem 1rem",
    cursor: "pointer",
  },
};

export default AdminSupportPage;
