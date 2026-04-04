import ApiError from "../utils/ApiError.js";
import SupportSystemTicket from "../models/SupportSystemTicket.js";

// Dữ liệu mẫu cho danh sách nhóm issue và các lựa chọn issue của khách hàng
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

// Service xử lý logic của Support System: tạo ticket, lấy ticket, admin reply, cập nhật trạng thái
class SupportSystemService {
  getIssueCatalog() {
    return ISSUE_CATALOG;
  }

  getStatusMeta() {
    return STATUS_LABELS;
  }

  // Tạo mã ticket duy nhất theo ngày và số ngẫu nhiên
  buildTicketCode() {
    const now = new Date(); // lấy thời điểm hiện tại
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`; // YYYYMMDD
    const randomPart = Math.floor(100000 + Math.random() * 900000); // số 6 chữ số
    return `TKT-${datePart}-${randomPart}`; // ví dụ: TKT-20260404-123456
  }

  // Validate và chuẩn hóa danh sách issue khách chọn
  normalizeIssueSelection(selectedIssueKeys) {
    if (!Array.isArray(selectedIssueKeys) || selectedIssueKeys.length === 0) {
      throw ApiError.badRequest("Please select at least one issue");
    }

    if (selectedIssueKeys.length > 3) {
      throw ApiError.badRequest("You can select at most 3 issues");
    }

    // Loại bỏ trùng, trim từng giá trị và chỉ giữ các key không rỗng
    const uniqueKeys = [...new Set(selectedIssueKeys.map((item) => String(item || "").trim()).filter(Boolean))];

    if (uniqueKeys.length === 0) {
      throw ApiError.badRequest("Please select at least one valid issue");
    }

    if (uniqueKeys.length > 3) {
      throw ApiError.badRequest("You can select at most 3 unique issues");
    }

    // Chuyển mỗi issueKey thành object issue chi tiết từ ISSUE_LOOKUP
    const normalizedIssues = uniqueKeys.map((issueKey) => ISSUE_LOOKUP[issueKey]).filter(Boolean);

    if (normalizedIssues.length !== uniqueKeys.length) {
      throw ApiError.badRequest("One or more selected issues are invalid");
    }

    return normalizedIssues;
  }

  // Validate mô tả chi tiết và loại bỏ khoảng trắng đầu/cuối
  // Chuẩn hóa nội dung mô tả của khách hàng
  normalizeDescription(description) {
    const normalized = String(description || "").trim(); // đảm bảo là chuỗi và xóa khoảng trắng đầu/cuối
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
  // Tạo ticket mới cho customer, lưu thông tin issue, nội dung và history
  async createCustomerTicket(customerId, payload = {}) {
    const selectedIssues = this.normalizeIssueSelection(payload.selectedIssueKeys);
    const description = this.normalizeDescription(payload.description);

    // Tạo ticket mới trong collection SupportSystemTicket
    const ticket = await SupportSystemTicket.create({
      ticketCode: this.buildTicketCode(), // mã ticket tự động
      customer: customerId, // id khách hàng tạo ticket
      selectedIssues, // mảng issue đã chuẩn hoá
      description, // mô tả chi tiết vấn đề
      status: "in_progress", // trạng thái ban đầu
      history: [
        {
          type: "created",
          actorRole: "customer",
          actorId: customerId,
          content: description,
          statusFrom: null,
          statusTo: "in_progress",
        },
      ], // lưu sự kiện tạo ticket vào lịch sử
    });

    return ticket;
  }

  // Lấy ticket của customer, kèm thông tin admin reply và history actor
  async getCustomerTickets(customerId) {
    return SupportSystemTicket.find({ customer: customerId })
      .sort({ updatedAt: -1 }) // sắp xếp ticket mới nhất lên đầu
      .populate("adminReplies.admin", "firstName lastName email") // lấy thông tin admin trả lời
      .populate("history.actorId", "firstName lastName email role") // lấy thông tin người thực hiện event trong history
      .lean();
  }

  // Lấy ticket cho admin, có thể lọc theo status và keyword
  async getAdminTickets(filters = {}) {
    const query = {};

    if (filters.status) {
      query.status = filters.status; // lọc theo trạng thái nếu admin truyền vào
    }

    if (filters.keyword) {
      const keywordRegex = new RegExp(String(filters.keyword).trim(), "i");
      query.$or = [
        { ticketCode: keywordRegex },
        { description: keywordRegex },
      ]; // tìm theo mã ticket hoặc mô tả
    }

    return SupportSystemTicket.find(query)
      .sort({ updatedAt: -1 }) // sắp xếp mới nhất trước
      .populate("customer", "firstName lastName email") // lấy thông tin customer
      .populate("adminReplies.admin", "firstName lastName email") // lấy thông tin admin reply
      .lean();
  }

  async getAdminResolvedTickets(filters = {}) {
    return this.getAdminTickets({ ...filters, status: "resolved_success" });
  }

  // UC-120: Admin trả lời ticket trong Support System
  // - push reply vào adminReplies và history
  // Admin gửi reply vào ticket, đồng thời ghi lịch sử admin reply
  async addAdminReply(adminId, ticketId, content) {
    const normalizedContent = String(content || "").trim(); // trim nội dung reply
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
          }, // thêm reply admin vào mảng
          history: {
            type: "admin_reply",
            actorRole: "admin",
            actorId: adminId,
            content: normalizedContent,
            statusFrom: null,
            statusTo: null,
          }, // thêm event admin reply vào lịch sử ticket
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
  // Admin cập nhật trạng thái ticket và ghi lại event status_changed vào history
  async updateTicketStatus(adminId, ticketId, nextStatus, note = "") {
    if (!["in_progress", "resolved_success"].includes(nextStatus)) {
      throw ApiError.badRequest("Invalid ticket status"); // chỉ cho phép 2 trạng thái hợp lệ
    }

    const ticket = await SupportSystemTicket.findById(ticketId); // tìm ticket theo id
    if (!ticket) {
      throw ApiError.notFound("Support ticket not found");
    }

    const statusFrom = ticket.status; // trạng thái hiện tại
    if (statusFrom === nextStatus) {
      return ticket.toObject(); // nếu không đổi status thì trả luôn ticket cũ
    }

    ticket.status = nextStatus;
    ticket.resolvedAt = nextStatus === "resolved_success" ? new Date() : null; // cập nhật resolvedAt khi ticket đã giải quyết

    ticket.history.push({
      type: "status_changed",
      actorRole: "admin",
      actorId: adminId,
      content: String(note || "").trim(),
      statusFrom,
      statusTo: nextStatus,
    }); // lưu event thay đổi trạng thái

    await ticket.save();

    return SupportSystemTicket.findById(ticketId)
      .populate("customer", "firstName lastName email")
      .populate("adminReplies.admin", "firstName lastName email")
      .lean();
  }
}

export default new SupportSystemService();
