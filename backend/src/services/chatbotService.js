import axios from "axios";
import ApiError from "../utils/ApiError.js";

class ChatbotService {
  getConfig() {
    return {
      baseUrl: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    };
  }

  buildSystemPrompt(context = {}) {
    const page = context.page || "unknown";
    const role = context.userRole || "guest";
    const isAuthenticated = Boolean(context.isAuthenticated);

    return `
You are a helpful Vietnamese bookstore assistant for an online bookstore website.

Rules:
- Reply in Vietnamese.
- Keep answers short, clear, and practical.
- Only answer topics related to this bookstore: books, stock, pricing, shipping fee, vouchers, orders, ebook access, payment, return/refund policy, and support.
- If the question is outside bookstore scope, politely say you only support bookstore-related questions.
- If you are not sure, say so briefly and suggest contacting support.
- Do not invent order status, stock quantity, or user-private data.
- Prefer bullets only when useful, otherwise plain text.
- At the end, suggest 2-4 short follow-up prompts when appropriate.

Website context:
- Current page: ${page}
- User role: ${role}
- Authenticated: ${isAuthenticated ? "yes" : "no"}

Store facts you may use:
- Shipping fee is 30,000 VND.
- Orders above 200,000 VND get free shipping.
- Ebooks require successful payment before access.
- Customers can use vouchers if valid and meeting conditions.
- If chatbot cannot solve an issue, suggest using support chat.
`.trim();
  }

  buildConversation(messages = [], userMessage = "", context = {}) {
    const normalizedHistory = Array.isArray(messages)
      ? messages
          .filter(
            (item) =>
              item &&
              typeof item.content === "string" &&
              ["user", "assistant", "system"].includes(item.role),
          )
          .slice(-8)
          .map((item) => ({
            role: item.role,
            content: item.content.trim(),
          }))
          .filter((item) => item.content)
      : [];

    const finalMessages = [
      {
        role: "system",
        content: this.buildSystemPrompt(context),
      },
      ...normalizedHistory,
    ];

    if (userMessage?.trim()) {
      finalMessages.push({
        role: "user",
        content: userMessage.trim(),
      });
    }

    return finalMessages;
  }

  buildSuggestions(userMessage = "", reply = "") {
    const source = `${userMessage} ${reply}`.toLowerCase();

    if (source.includes("ship")) {
      return [
        "Có miễn phí ship không?",
        "Bao lâu nhận được hàng?",
        "Làm sao theo dõi đơn hàng?",
      ];
    }

    if (source.includes("voucher") || source.includes("giảm")) {
      return [
        "Điều kiện dùng voucher là gì?",
        "Tôi xem voucher ở đâu?",
        "Coin có dùng chung voucher được không?",
      ];
    }

    if (source.includes("ebook")) {
      return [
        "Tôi đọc ebook ở đâu?",
        "Vì sao tôi chưa mở được ebook?",
        "Ebook có hoàn tiền không?",
      ];
    }

    if (source.includes("đơn") || source.includes("order")) {
      return [
        "Làm sao xem lịch sử đơn hàng?",
        "Tôi có thể hủy đơn không?",
        "Tôi muốn liên hệ hỗ trợ",
      ];
    }

    return [
      "Phí ship là bao nhiêu?",
      "Cách dùng voucher",
      "Làm sao xem đơn hàng?",
      "Liên hệ hỗ trợ",
    ];
  }

  async ask({ message, messages = [], context = {} }) {
    const { baseUrl, apiKey, model } = this.getConfig();

    if (!apiKey) {
      throw ApiError.internal("Missing GROQ_API_KEY");
    }

    if (!message || !String(message).trim()) {
      throw ApiError.badRequest("Message is required");
    }

    try {
      const payload = {
        model,
        temperature: 0.3,
        messages: this.buildConversation(messages, message, context),
      };

      const response = await axios.post(
        `${baseUrl}/chat/completions`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 20000,
        },
      );

      const reply =
        response?.data?.choices?.[0]?.message?.content?.trim() ||
        "Xin lỗi, mình chưa có câu trả lời phù hợp lúc này.";

      return {
        reply,
        suggestions: this.buildSuggestions(message, reply),
        model,
      };
    } catch (error) {
      const providerMessage =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error.message;

      throw ApiError.internal(`Chatbot request failed: ${providerMessage}`);
    }
  }
}

export default new ChatbotService();
