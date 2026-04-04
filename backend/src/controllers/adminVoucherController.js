import voucherService from "../services/voucherService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

class AdminVoucherController {
  async getAllVouchers(req, res, next) {
    try {
      // UC-47: Controller trả danh sách voucher cho màn hình admin.
      // B1: gọi service đọc toàn bộ voucher sau khi đã sync trạng thái hết hạn.
      const vouchers = await voucherService.getAllVouchers();

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Vouchers retrieved successfully",
        { vouchers },
      );
    } catch (error) {
      next(error);
    }
  }

  async createVoucher(req, res, next) {
    try {
      // UC-48: Controller tạo voucher mới từ payload admin gửi lên.
      // B1: req.body chứa toàn bộ rule voucher (discount, minOrder, expiry, audience...).
      const voucher = await voucherService.createVoucher(req.body);

      return ApiResponse.success(
        res,
        HTTP_STATUS.CREATED,
        "Voucher created successfully",
        { voucher },
      );
    } catch (error) {
      next(error);
    }
  }

  async updateVoucher(req, res, next) {
    try {
      // Luồng cập nhật voucher: lấy voucherId từ params và patch data từ body.
      const voucher = await voucherService.updateVoucher(
        req.params.id,
        req.body,
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Voucher updated successfully",
        { voucher },
      );
    } catch (error) {
      next(error);
    }
  }

  async assignVoucherToUsers(req, res, next) {
    try {
      // UC-93: Controller xử lý yêu cầu gán voucher cho user cụ thể/segment.
      // req.params.id là voucherId; req.body chứa userIds/segments/segmentRules.
      const result = await voucherService.assignVoucherToUsers(
        req.params.id,
        req.body,
      );

      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Voucher assigned successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminVoucherController();
