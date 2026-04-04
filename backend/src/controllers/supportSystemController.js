import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS, ROLES } from "../config/constants.js";
import supportSystemService from "../services/supportSystemService.js";

// Kiểm tra quyền của user, chỉ customer mới được truy cập chức năng ticket khách hàng
const ensureCustomer = (req) => {
  if (req.user?.role !== ROLES.CUSTOMER) {
    throw ApiError.forbidden("Only customers can access support tickets");
  }
};

// Support System Controller (Ticket system)
// UC-122 Ticket system (Customer tạo ticket và xem lịch sử)
// UC-123 Ticket status (Admin cập nhật trạng thái ticket)
class SupportSystemController {
  async getIssueCatalog(_req, res, next) {
    try {
      // Trả về danh sách issue và status để client hiển thị form tạo ticket
      return ApiResponse.success(res, HTTP_STATUS.OK, "Issue catalog fetched", {
        issueCatalog: supportSystemService.getIssueCatalog(),
        statuses: supportSystemService.getStatusMeta(),
      });
    } catch (error) {
      next(error);
    }
  }

  // Customer tạo ticket mới: validate role và gọi service tạo ticket
  async createMyTicket(req, res, next) {
    try {
      ensureCustomer(req);

      const ticket = await supportSystemService.createCustomerTicket(req.user._id, req.body);

      return ApiResponse.success(res, HTTP_STATUS.CREATED, "Support ticket created", {
        ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyTicketHistory(req, res, next) {
    try {
      ensureCustomer(req);

      // Lấy tất cả ticket của customer hiện tại
      const tickets = await supportSystemService.getCustomerTickets(req.user._id);

      return ApiResponse.success(res, HTTP_STATUS.OK, "Support ticket history fetched", {
        statuses: supportSystemService.getStatusMeta(),
        tickets,
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin xem inbox ticket với filter status/keyword
  async getAdminTicketInbox(req, res, next) {
    try {
      const tickets = await supportSystemService.getAdminTickets({
        status: req.query.status,
        keyword: req.query.keyword,
      });

      return ApiResponse.success(res, HTTP_STATUS.OK, "Support system inbox fetched", {
        statuses: supportSystemService.getStatusMeta(),
        tickets,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAdminTicketHistory(_req, res, next) {
    try {
      // Lấy danh sách ticket đã được giải quyết
      const tickets = await supportSystemService.getAdminResolvedTickets();

      return ApiResponse.success(res, HTTP_STATUS.OK, "Support system history fetched", {
        statuses: supportSystemService.getStatusMeta(),
        tickets,
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin thêm phản hồi vào ticket
  async addAdminReply(req, res, next) {
    try {
      const ticket = await supportSystemService.addAdminReply(
        req.user._id,
        req.params.ticketId,
        req.body.content,
      );

      return ApiResponse.success(res, HTTP_STATUS.OK, "Support ticket reply saved", {
        ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAdminTicketStatus(req, res, next) {
    try {
      const ticket = await supportSystemService.updateTicketStatus(
        req.user._id,
        req.params.ticketId,
        req.body.status,
        req.body.note,
      );

      return ApiResponse.success(res, HTTP_STATUS.OK, "Support ticket status updated", {
        ticket,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SupportSystemController();
