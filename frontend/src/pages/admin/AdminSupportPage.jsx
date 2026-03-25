import { useEffect, useMemo, useRef, useState } from "react";
import useSocket from "../../hooks/useSocket";
import { supportApi } from "../../api/supportApi";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const serverBaseUrl = apiBase.replace(/\/api\/?$/, "");

const resolveImageUrl = (path) => {
  if (!path) return "";
  return path.startsWith("http") ? path : `${serverBaseUrl}${path}`;
};

const getMessagePreview = (message) => {
  if (message?.content?.trim()) return message.content;
  if (message?.imageUrl) return "[Image]";
  return "";
};

const AdminSupportPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messageListRef = useRef(null);
  const imageInputRef = useRef(null);
  const { socket, isConnected } = useSocket();

  const selectedConversation = useMemo(
    () => conversations.find((item) => item._id === selectedConversationId) || null,
    [conversations, selectedConversationId],
  );

  // Load initial conversations
  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const response = await supportApi.getAdminConversations();
      const data = response?.data?.conversations || [];
      setConversations(data);

      if (!selectedConversationId && data.length > 0) {
        setSelectedConversationId(data[0]._id);
      }
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load conversations");
    } finally {
      setLoadingConversations(false);
    }
  };

  // Load initial data on mount
  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;
    socket.emit("admin:join");
  }, [socket, isConnected]);

  useEffect(() => {
    if (!socket || !selectedConversationId || !isConnected) return;
    socket.emit("admin:view-conversation", { conversationId: selectedConversationId });

    // Optimistically clear unread badge for the opened conversation.
    setConversations((prev) =>
      prev.map((conv) =>
        conv._id === selectedConversationId
          ? { ...conv, unreadForAdmin: 0 }
          : conv
      ),
    );
  }, [socket, selectedConversationId, isConnected]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Handle new messages
    const handleNewMessage = (data) => {
      // Update message list if it's for current conversation
      if (data.conversationId === selectedConversationId) {
        setMessages((prev) => {
          if (prev.some((item) => item._id === data.message?._id)) {
            return prev;
          }
          return [...prev, data.message];
        });
      }

      // Update conversations list (last message preview)
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv._id === data.conversationId) {
            return {
              ...conv,
              lastMessagePreview: getMessagePreview(data.message).slice(0, 300),
              lastMessageAt: data.message.createdAt,
              unreadForAdmin:
                data.senderRole === "customer"
                  ? (data.conversationId === selectedConversationId
                    ? 0
                    : (conv.unreadForAdmin || 0) + 1)
                  : conv.unreadForAdmin,
            };
          }
          return conv;
        })
      );
    };

    // Handle admin joined
    const handleAdminJoined = () => {
      setError("");
    };

    // Handle errors
    const handleError = (data) => {
      setError(data?.message || "An error occurred");
    };

    socket.on("message:new", handleNewMessage);
    socket.on("admin:joined", handleAdminJoined);
    socket.on("error", handleError);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("admin:joined", handleAdminJoined);
      socket.off("error", handleError);
    };
  }, [selectedConversationId, socket]);

  // Load messages when conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversationId) {
        setMessages([]);
        return;
      }

      try {
        setLoadingMessages(true);
        const response = await supportApi.getAdminConversationMessages(selectedConversationId);
        setMessages(response?.data?.messages || []);
        setConversations((prev) =>
          prev.map((conv) =>
            conv._id === selectedConversationId
              ? { ...conv, unreadForAdmin: 0 }
              : conv
          ),
        );
        setError("");
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load messages");
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedConversationId]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const canSend = useMemo(
    () => draft.trim().length > 0 || Boolean(selectedImage),
    [draft, selectedImage],
  );

  const resetImageInput = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedImage(null);
    setImagePreviewUrl("");
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  useEffect(() => () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
  }, [imagePreviewUrl]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      resetImageInput();
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed");
      resetImageInput();
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("Image size must be 8MB or less");
      resetImageInput();
      return;
    }

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setSelectedImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setError("");
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedConversationId || !canSend || sending) {
      return;
    }

    if (!selectedImage && (!socket || !isConnected)) {
      return;
    }

    try {
      setSending(true);
      if (selectedImage) {
        await supportApi.sendAdminImage(selectedConversationId, selectedImage, draft.trim());
      } else {
        socket.emit("admin:send-message", {
          conversationId: selectedConversationId,
          content: draft.trim(),
        });
      }
      setDraft("");
      resetImageInput();
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to send message");
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
                          {message.imageUrl && (
                            <a
                              href={resolveImageUrl(message.imageUrl)}
                              target="_blank"
                              rel="noreferrer"
                              style={styles.imageLink}
                            >
                              <img
                                src={resolveImageUrl(message.imageUrl)}
                                alt="Support attachment"
                                style={styles.messageImage}
                              />
                            </a>
                          )}
                          {message.content?.trim() && <div>{message.content}</div>}
                          <div style={styles.messageTime}>{new Date(message.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSend} style={styles.form}>
                <label style={styles.attachButton}>
                  Attach Image
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={styles.hiddenInput}
                    disabled={sending}
                  />
                </label>
                <textarea
                  rows={3}
                  style={styles.textarea}
                  placeholder={selectedImage ? "Add an optional caption..." : "Type your reply..."}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={sending}
                />
                {imagePreviewUrl && (
                  <div style={styles.previewBox}>
                    <img src={imagePreviewUrl} alt="Selected upload" style={styles.previewImage} />
                    <button type="button" onClick={resetImageInput} style={styles.removeImageButton}>
                      Remove
                    </button>
                  </div>
                )}
                <button type="submit" style={styles.sendButton} disabled={!canSend || sending}>
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
    overflow: "hidden",
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
    height: "420px",
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
  imageLink: {
    display: "inline-block",
    marginBottom: "0.45rem",
  },
  messageImage: {
    display: "block",
    maxWidth: "220px",
    maxHeight: "220px",
    borderRadius: "8px",
    border: "1px solid rgba(0, 0, 0, 0.08)",
    objectFit: "cover",
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
    display: "grid",
    gap: "0.6rem",
  },
  attachButton: {
    width: "fit-content",
    border: "1px solid #cdd8e6",
    borderRadius: "8px",
    padding: "0.4rem 0.7rem",
    fontWeight: 600,
    color: "#324b64",
    cursor: "pointer",
    backgroundColor: "#f8fbff",
  },
  hiddenInput: {
    display: "none",
  },
  textarea: {
    flex: 1,
    resize: "vertical",
    borderRadius: "10px",
    border: "1px solid #cdd8e6",
    padding: "0.7rem",
    fontFamily: "inherit",
  },
  previewBox: {
    width: "fit-content",
    border: "1px solid #dce4ee",
    borderRadius: "10px",
    padding: "0.5rem",
    backgroundColor: "#f8fbff",
  },
  previewImage: {
    display: "block",
    width: "120px",
    height: "120px",
    objectFit: "cover",
    borderRadius: "8px",
    marginBottom: "0.45rem",
  },
  removeImageButton: {
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#ffe9e9",
    color: "#a83a3a",
    cursor: "pointer",
    padding: "0.3rem 0.55rem",
    fontWeight: 700,
  },
  sendButton: {
    width: "fit-content",
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
