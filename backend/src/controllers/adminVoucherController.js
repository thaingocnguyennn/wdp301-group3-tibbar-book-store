import voucherService from "../services/voucherService.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";

class AdminVoucherController {
  async getAllVouchers(req, res, next) {
    try {
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
      const voucher = await voucherService.updateVoucher(req.params.id, req.body);

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
}

export default new AdminVoucherController();
