import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { chatbotApi } from "../../api/chatbotApi";
import { useAuth } from "../../hooks/useAuth";

const initialBotMessage = {
  role: "assistant",
  content:
    "Xin chao, minh la tro ly Bookstore. Ban co the hoi ve phi ship, voucher, don hang, ebook hoac ho tro.",
  suggestions: [
    "Phi ship la bao nhieu?",
    "Cach dung voucher",
    "Lam sao xem don hang?",
    "Lien he ho tro",
  ],
};

const ChatbotWidget = () => {
  // Chức năng chatbot nằm ở components/chatbot và được mount toàn cục trong App.
  // Mục tiêu: nhận câu hỏi người dùng, gửi API backend, hiển thị câu trả lời + gợi ý.
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([initialBotMessage]);

  const conversationHistory = useMemo(() => {
    // Chuẩn hóa lịch sử hội thoại trước khi gửi API:
    // chỉ giữ role user/assistant và nội dung text để backend dễ xử lý.
    return messages
      .filter((item) => item.role === "user" || item.role === "assistant")
      .map((item) => ({
        role: item.role,
        content: item.content,
      }));
  }, [messages]);

  const sendMessage = async (rawMessage) => {
    // B1: Làm sạch input; nếu rỗng hoặc đang loading thì không gửi request mới.
    const message = String(rawMessage || "").trim();
    if (!message || loading) return;

    // B2: Đẩy tin nhắn của user lên UI ngay để tạo cảm giác phản hồi tức thì.
    const nextUserMessage = { role: "user", content: message };
    setMessages((prev) => [...prev, nextUserMessage]);
    setInput("");
    setLoading(true);

    try {
      // B3: Gọi API chatbot, gửi kèm context hiện tại của trang/người dùng.
      const response = await chatbotApi.ask({
        message,
        messages: conversationHistory,
        context: {
          // UC-45: Truyền page hiện tại để chatbot có thể hướng dẫn xem chi tiết đơn đúng ngữ cảnh.
          page: location.pathname,
          isAuthenticated,
          userRole: user?.role || "guest",
        },
      });

      // B4: Ghi câu trả lời của bot vào danh sách message để render ra khung chat.
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response?.data?.reply || "Xin loi, minh chua tra loi duoc luc nay.",
          suggestions: response?.data?.suggestions || [],
        },
      ]);
    } catch (error) {
      // B5: Nếu API lỗi, hiển thị thông báo fallback thân thiện cho người dùng.
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error?.response?.data?.message ||
            "Chatbot dang ban. Ban thu lai sau hoac chuyen sang ho tro truc tiep.",
          suggestions: ["Lien he ho tro", "Phi ship la bao nhieu?", "Cach dung voucher"],
        },
      ]);
    } finally {
      // B6: Kết thúc request, mở lại khả năng gửi tin nhắn tiếp theo.
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    // Chặn reload trang và chuyển sang luồng gửi tin nhắn bằng JS.
    event.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {!open && (
        <button style={styles.fab} onClick={() => setOpen(true)}>
          💬 Chatbot
        </button>
      )}

      {open && (
        <div style={styles.widget}>
          <div style={styles.header}>
            <div>
              <div style={styles.headerTitle}>Bookstore Assistant</div>
              <div style={styles.headerSubtitle}>Hoi nhanh ve cua hang</div>
            </div>
            <button style={styles.closeButton} onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>

          <div style={styles.messages}>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                style={{
                  ...styles.messageRow,
                  justifyContent:
                    message.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    ...styles.messageBubble,
                    ...(message.role === "user"
                      ? styles.userBubble
                      : styles.botBubble),
                  }}
                >
                  {message.content}

                  {message.role === "assistant" &&
                    Array.isArray(message.suggestions) &&
                    message.suggestions.length > 0 && (
                      <div style={styles.suggestions}>
                        {message.suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            style={styles.suggestionChip}
                            onClick={() => sendMessage(suggestion)}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={styles.messageRow}>
                <div style={{ ...styles.messageBubble, ...styles.botBubble }}>
                  Dang tra loi...
                </div>
              </div>
            )}
          </div>

          <div style={styles.footer}>
            <form onSubmit={handleSubmit} style={styles.form}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhap cau hoi..."
                style={styles.input}
              />
              <button type="submit" style={styles.sendButton} disabled={loading}>
                Gui
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  fab: {
    position: "fixed",
    right: "20px",
    bottom: "20px",
    zIndex: 1200,
    border: "none",
    borderRadius: "999px",
    padding: "0.9rem 1.2rem",
    background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 25px rgba(37, 99, 235, 0.35)",
  },
  widget: {
    position: "fixed",
    right: "20px",
    bottom: "20px",
    width: "360px",
    maxWidth: "calc(100vw - 24px)",
    height: "560px",
    backgroundColor: "#fff",
    borderRadius: "18px",
    boxShadow: "0 20px 45px rgba(15, 23, 42, 0.2)",
    border: "1px solid #e2e8f0",
    zIndex: 1200,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    padding: "1rem",
    background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: "1rem",
  },
  headerSubtitle: {
    fontSize: "0.82rem",
    opacity: 0.9,
    marginTop: "0.2rem",
  },
  closeButton: {
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: "1.1rem",
    cursor: "pointer",
  },
  messages: {
    flex: 1,
    padding: "1rem",
    overflowY: "auto",
    backgroundColor: "#f8fafc",
  },
  messageRow: {
    display: "flex",
    marginBottom: "0.8rem",
  },
  messageBubble: {
    maxWidth: "85%",
    padding: "0.8rem 0.95rem",
    borderRadius: "14px",
    lineHeight: 1.5,
    fontSize: "0.95rem",
    whiteSpace: "pre-wrap",
  },
  botBubble: {
    backgroundColor: "#fff",
    color: "#0f172a",
    border: "1px solid #e2e8f0",
  },
  userBubble: {
    backgroundColor: "#2563eb",
    color: "#fff",
  },
  suggestions: {
    display: "flex",
    gap: "0.45rem",
    flexWrap: "wrap",
    marginTop: "0.75rem",
  },
  suggestionChip: {
    border: "1px solid #bfdbfe",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: "999px",
    padding: "0.4rem 0.7rem",
    fontSize: "0.78rem",
    cursor: "pointer",
  },
  footer: {
    borderTop: "1px solid #e2e8f0",
    padding: "0.9rem",
    backgroundColor: "#fff",
  },
  form: {
    display: "flex",
    gap: "0.5rem",
  },
  input: {
    flex: 1,
    padding: "0.8rem 0.9rem",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    outline: "none",
  },
  sendButton: {
    border: "none",
    borderRadius: "10px",
    padding: "0.8rem 1rem",
    backgroundColor: "#2563eb",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
};

export default ChatbotWidget;
