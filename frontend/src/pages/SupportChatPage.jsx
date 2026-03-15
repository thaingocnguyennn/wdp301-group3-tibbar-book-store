import { useEffect, useMemo, useRef, useState } from "react";
import { supportApi } from "../api/supportApi";

const POLL_INTERVAL_MS = 5000;

const SupportChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);

  const fetchConversation = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const response = await supportApi.getMyConversation();
      setConversationId(response?.data?.conversation?._id || null);
      setMessages(response?.data?.messages || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load support chat");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchConversation();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchConversation({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const canSend = useMemo(() => draft.trim().length > 0, [draft]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!canSend || sending) {
      return;
    }

    try {
      setSending(true);
      await supportApi.sendMyMessage(draft.trim());
      setDraft("");
      await fetchConversation({ silent: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Support Chat</h1>
          <p style={styles.subtitle}>Message our admin team for help with orders, payments, or your account.</p>
          {conversationId && <span style={styles.badge}>Conversation ID: {conversationId.slice(-8)}</span>}
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div ref={listRef} style={styles.messages}>
          {loading ? (
            <div style={styles.placeholder}>Loading messages...</div>
          ) : messages.length === 0 ? (
            <div style={styles.placeholder}>No messages yet. Start the conversation now.</div>
          ) : (
            messages.map((message) => {
              const isCustomer = message.senderRole === "customer";
              return (
                <div
                  key={message._id}
                  style={{
                    ...styles.messageRow,
                    justifyContent: isCustomer ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      ...styles.messageBubble,
                      ...(isCustomer ? styles.customerBubble : styles.adminBubble),
                    }}
                  >
                    <div style={styles.messageSender}>{isCustomer ? "You" : "Admin"}</div>
                    <div>{message.content}</div>
                    <div style={styles.messageTime}>
                      {new Date(message.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSendMessage} style={styles.form}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type your message..."
            rows={3}
            style={styles.textarea}
            disabled={sending}
          />
          <button type="submit" style={styles.sendButton} disabled={!canSend || sending}>
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  page: {
    maxWidth: "960px",
    margin: "0 auto",
    padding: "2rem 1rem",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
  },
  header: {
    padding: "1.25rem 1.25rem 0.5rem",
    borderBottom: "1px solid #eef2f7",
  },
  title: {
    margin: 0,
    fontSize: "1.8rem",
    color: "#243447",
  },
  subtitle: {
    marginTop: "0.4rem",
    color: "#5b6b7d",
  },
  badge: {
    display: "inline-block",
    marginTop: "0.3rem",
    fontSize: "0.8rem",
    color: "#2f5d99",
    backgroundColor: "#e9f2ff",
    borderRadius: "999px",
    padding: "0.2rem 0.65rem",
  },
  error: {
    margin: "0.8rem 1.25rem",
    padding: "0.7rem",
    borderRadius: "8px",
    backgroundColor: "#ffe9e9",
    color: "#a83a3a",
  },
  messages: {
    height: "420px",
    overflowY: "auto",
    padding: "1rem 1.25rem",
    backgroundColor: "#f5f8fb",
  },
  placeholder: {
    textAlign: "center",
    color: "#7b8794",
    marginTop: "1.25rem",
  },
  messageRow: {
    display: "flex",
    marginBottom: "0.75rem",
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: "12px",
    padding: "0.65rem 0.8rem",
    lineHeight: 1.4,
    wordBreak: "break-word",
  },
  customerBubble: {
    backgroundColor: "#4f7cf7",
    color: "#fff",
    borderTopRightRadius: "4px",
  },
  adminBubble: {
    backgroundColor: "#fff",
    color: "#243447",
    border: "1px solid #dce4ee",
    borderTopLeftRadius: "4px",
  },
  messageSender: {
    fontSize: "0.8rem",
    fontWeight: 700,
    marginBottom: "0.2rem",
    opacity: 0.9,
  },
  messageTime: {
    marginTop: "0.35rem",
    fontSize: "0.72rem",
    opacity: 0.8,
  },
  form: {
    borderTop: "1px solid #eef2f7",
    padding: "1rem 1.25rem",
    display: "flex",
    gap: "0.75rem",
    alignItems: "flex-end",
  },
  textarea: {
    flex: 1,
    resize: "vertical",
    minHeight: "64px",
    maxHeight: "140px",
    borderRadius: "10px",
    border: "1px solid #cdd8e6",
    padding: "0.7rem",
    fontFamily: "inherit",
    fontSize: "0.95rem",
  },
  sendButton: {
    border: "none",
    backgroundColor: "#2d6cdf",
    color: "#fff",
    borderRadius: "10px",
    padding: "0.7rem 1.1rem",
    fontWeight: 700,
    cursor: "pointer",
  },
};

export default SupportChatPage;
