import ApiError from "../utils/ApiError.js";
import SupportSystemTicket from "../models/SupportSystemTicket.js";

const ISSUE_CATALOG = [
  {
    groupKey: "account_login",
    groupLabel: "Loi tai khoan va dang nhap",
    issues: [
      { issueKey: "cannot_login", label: "Tai sao toi khong dang nhap duoc?" },
      { issueKey: "wrong_password", label: "Vi sao he thong bao sai mat khau du toi nhap dung?" },
      { issueKey: "missing_otp", label: "Tai sao toi khong nhan duoc email / ma OTP xac thuc?" },
      { issueKey: "account_locked", label: "Vi sao tai khoan cua toi bi khoa?" },
    ],
  },
  {
    groupKey: "display_access",
    groupLabel: "Loi hien thi va truy cap he thong",
    issues: [
      { issueKey: "site_unavailable", label: "Tai sao website / app khong mo duoc?" },
      { issueKey: "slow_page", label: "Vi sao trang tai rat lau?" },
      { issueKey: "http_error", label: "Tai sao he thong bao loi 404 / 500?" },
      { issueKey: "blank_screen", label: "Vi sao man hinh bi trang hoac khong hien thi du lieu?" },
      { issueKey: "book_detail_unavailable", label: "Tai sao toi bam vao sach nhung khong xem duoc chi tiet?" },
    ],
  },
];

const ISSUE_LOOKUP = ISSUE_CATALOG.reduce((acc, group) => {
  group.issues.forEach((issue) => {
    acc[issue.issueKey] = {
      groupKey: group.groupKey,
      issueKey: issue.issueKey,
      label: issue.label,
    };
  });
  return acc;
}, {});

const STATUS_LABELS = {
  in_progress: "Dang xu ly",
  resolved_success: "Da xu ly thanh cong",
};

class SupportSystemService {
  getIssueCatalog() {
    return ISSUE_CATALOG;
  }

  getStatusMeta() {
    return STATUS_LABELS;
  }

  buildTicketCode() {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    return `TKT-${datePart}-${randomPart}`;
  }

  normalizeIssueSelection(selectedIssueKeys) {
    if (!Array.isArray(selectedIssueKeys) || selectedIssueKeys.length === 0) {
      throw ApiError.badRequest("Please select at least one issue");
    }

    if (selectedIssueKeys.length > 3) {
      throw ApiError.badRequest("You can select at most 3 issues");
    }

    const uniqueKeys = [...new Set(selectedIssueKeys.map((item) => String(item || "").trim()).filter(Boolean))];

    if (uniqueKeys.length === 0) {
      throw ApiError.badRequest("Please select at least one valid issue");
    }

    if (uniqueKeys.length > 3) {
      throw ApiError.badRequest("You can select at most 3 unique issues");
    }

    const normalizedIssues = uniqueKeys.map((issueKey) => ISSUE_LOOKUP[issueKey]).filter(Boolean);

    if (normalizedIssues.length !== uniqueKeys.length) {
      throw ApiError.badRequest("One or more selected issues are invalid");
    }

    return normalizedIssues;
  }

  normalizeDescription(description) {
    const normalized = String(description || "").trim();
    if (!normalized) {
      throw ApiError.badRequest("Detailed description is required");
    }

    if (normalized.length > 2000) {
      throw ApiError.badRequest("Detailed description must be 2000 characters or less");
    }

    return normalized;
  }

  // Customer tạo ticket mới (UC-122)
  // 1) Validate issue chọn và mô tả
  // 2) Tạo đối tượng ticket trong bảng SupportSystemTicket
  // 3) Lưu ban đầu status = in_progress và history: created
  async createCustomerTicket(customerId, payload = {}) {
    const selectedIssues = this.normalizeIssueSelection(payload.selectedIssueKeys);
    const description = this.normalizeDescription(payload.description);

    const ticket = await SupportSystemTicket.create({
      ticketCode: this.buildTicketCode(),
      customer: customerId,
      selectedIssues,
      description,
      status: "in_progress",
      history: [
        {
          type: "created",
          actorRole: "customer",
          actorId: customerId,
          content: description,
          statusFrom: null,
          statusTo: "in_progress",
        },
      ],
    });

    return ticket;
  }

  async getCustomerTickets(customerId) {
    return SupportSystemTicket.find({ customer: customerId })
      .sort({ updatedAt: -1 })
      .populate("adminReplies.admin", "firstName lastName email")
      .populate("history.actorId", "firstName lastName email role")
      .lean();
  }

  async getAdminTickets(filters = {}) {
    const query = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.keyword) {
      const keywordRegex = new RegExp(String(filters.keyword).trim(), "i");
      query.$or = [
        { ticketCode: keywordRegex },
        { description: keywordRegex },
      ];
    }

    return SupportSystemTicket.find(query)
      .sort({ updatedAt: -1 })
      .populate("customer", "firstName lastName email")
      .populate("adminReplies.admin", "firstName lastName email")
      .lean();
  }

  async getAdminResolvedTickets(filters = {}) {
    return this.getAdminTickets({ ...filters, status: "resolved_success" });
  }

  // UC-120: Admin trả lời ticket trong Support System
  // - push reply vào adminReplies và history
  async addAdminReply(adminId, ticketId, content) {
    const normalizedContent = String(content || "").trim();
    if (!normalizedContent) {
      throw ApiError.badRequest("Reply content is required");
    }

    if (normalizedContent.length > 2000) {
      throw ApiError.badRequest("Reply content must be 2000 characters or less");
    }

    const updated = await SupportSystemTicket.findByIdAndUpdate(
      ticketId,
      {
        $push: {
          adminReplies: {
            admin: adminId,
            content: normalizedContent,
          },
          history: {
            type: "admin_reply",
            actorRole: "admin",
            actorId: adminId,
            content: normalizedContent,
            statusFrom: null,
            statusTo: null,
          },
        },
      },
      { new: true },
    )
      .populate("customer", "firstName lastName email")
      .populate("adminReplies.admin", "firstName lastName email")
      .lean();

    if (!updated) {
      throw ApiError.notFound("Support ticket not found");
    }

    return updated;
  }

  // UC-123: Admin cập nhật trạng thái ticket
  // - Xác thực trạng thái hợp lệ
  // - Lưu history sự kiện thay đổi status
  async updateTicketStatus(adminId, ticketId, nextStatus, note = "") {
    if (!["in_progress", "resolved_success"].includes(nextStatus)) {
      throw ApiError.badRequest("Invalid ticket status");
    }

    const ticket = await SupportSystemTicket.findById(ticketId);
    if (!ticket) {
      throw ApiError.notFound("Support ticket not found");
    }

    const statusFrom = ticket.status;
    if (statusFrom === nextStatus) {
      return ticket.toObject();
    }

    ticket.status = nextStatus;
    ticket.resolvedAt = nextStatus === "resolved_success" ? new Date() : null;

    ticket.history.push({
      type: "status_changed",
      actorRole: "admin",
      actorId: adminId,
      content: String(note || "").trim(),
      statusFrom,
      statusTo: nextStatus,
    });

    await ticket.save();

    return SupportSystemTicket.findById(ticketId)
      .populate("customer", "firstName lastName email")
      .populate("adminReplies.admin", "firstName lastName email")
      .lean();
  }
}

export default new SupportSystemService();
