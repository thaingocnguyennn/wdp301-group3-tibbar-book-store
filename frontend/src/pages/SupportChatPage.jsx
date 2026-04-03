import { useEffect, useMemo, useRef, useState } from "react";
import useSocket from "../hooks/useSocket";
import { supportApi } from "../api/supportApi";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const serverBaseUrl = apiBase.replace(/\/api\/?$/, "");

const resolveImageUrl = (path) => {
  if (!path) return "";
  return path.startsWith("http") ? path : `${serverBaseUrl}${path}`;
};

// SupportChatPage: customer chat trực tiếp với admin
// Luồng:
// 1) component mount -> gọi supportApi.getMyConversation
// 2) Socket join conversation, lắng nghe message:new
// 3) Khi customer gửi text -> gọi socket event customer:send-message
//    Khi gửi ảnh -> gọi supportApi.sendMyImage (HTTP multipart)
// 4) Tin nhắn mới từ admin sẽ push vào `messages` qua event message:new
const SupportChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [draft, setDraft] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);
  const imageInputRef = useRef(null);
  const { socket, isConnected } = useSocket();

  // Load initial conversation data via REST API
  const loadInitialConversation = async () => {
    try {
      setLoading(true);
      const response = await supportApi.getMyConversation();
      const convId = response?.data?.conversation?._id;
      setConversationId(convId);
      setMessages(response?.data?.messages || []);
      setError("");

    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load support chat");
    } finally {
      setLoading(false);
    }
  };

  // Load initial data on mount
  useEffect(() => {
    loadInitialConversation();
  }, []);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      setMessages((prev) => {
        if (prev.some((item) => item._id === data.message?._id)) {
          return prev;
        }
        return [...prev, data.message];
      });
    };

    const handleCustomerJoined = () => {
      setError("");
    };

    const handleError = (data) => {
      setError(data?.message || "An error occurred");
    };

    socket.on("message:new", handleNewMessage);
    socket.on("customer:joined", handleCustomerJoined);
    socket.on("error", handleError);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("customer:joined", handleCustomerJoined);
      socket.off("error", handleError);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket || !conversationId || !isConnected) {
      return;
    }

    socket.emit("customer:join", { conversationId });
  }, [socket, conversationId, isConnected]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!canSend || sending) {
      return;
    }

    if (!selectedImage && (!conversationId || !socket || !isConnected)) {
      return;
    }

    try {
      setSending(true);
      if (selectedImage) {
        const response = await supportApi.sendMyImage(selectedImage, draft.trim());
        const message = response?.data?.message;
        if (message) {
          setMessages((prev) => {
            if (prev.some((item) => item._id === message._id)) {
              return prev;
            }
            return [...prev, message];
          });
          const messageConversationId = message?.conversation?._id || message?.conversation;
          if (messageConversationId && !conversationId) {
            setConversationId(messageConversationId.toString());
          }
        }
      } else {
        socket.emit("customer:send-message", {
          conversationId,
          content: draft.trim(),
        });
      }
      setDraft("");
      resetImageInput();
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to send message");
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
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={selectedImage ? "Add an optional caption..." : "Type your message..."}
            rows={3}
            style={styles.textarea}
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
    minHeight: "64px",
    maxHeight: "140px",
    borderRadius: "10px",
    border: "1px solid #cdd8e6",
    padding: "0.7rem",
    fontFamily: "inherit",
    fontSize: "0.95rem",
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
    backgroundColor: "#2d6cdf",
    color: "#fff",
    borderRadius: "10px",
    padding: "0.7rem 1.1rem",
    fontWeight: 700,
    cursor: "pointer",
  },
};

export default SupportChatPage;
