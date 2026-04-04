import addressService from '../services/addressService.js';
import ApiResponse from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';

class AddressController {
  // hàm để lấy danh sách địa chỉ của người dùng
  async getAddresses(req, res, next) {
    try {
      // gọi service để lấy danh sách địa chỉ của người dùng
      const addresses = await addressService.getUserAddresses(req.user.userId);
      // trả về danh sách địa chỉ cùng với thông báo thành công
      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        'Addresses retrieved successfully',
        addresses
      );
    } catch (error) {
      next(error);
    }
  }

  // hàm để thêm địa chỉ mới cho người dùng
  async addAddress(req, res, next) {
    try {
      // gọi service để thêm địa chỉ mới cho người dùng
      const address = await addressService.addAddress(req.user.userId, req.body);
      // trả về địa chỉ mới cùng với thông báo thành công
      return ApiResponse.success(
        res,
        HTTP_STATUS.CREATED,
        'Address added successfully',
        address
      );
    } catch (error) {
      next(error);
    }
  }

  // hàm để cập nhật địa chỉ của người dùng
  async updateAddress(req, res, next) {
    try {
      // gọi service để cập nhật địa chỉ của người dùng
      const address = await addressService.updateAddress(
        req.user.userId,
        req.params.addressId,
        req.body
      );
      // trả về địa chỉ đã cập nhật cùng với thông báo thành công
      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        'Address updated successfully',
        address
      );
    } catch (error) {
      next(error);
    }
  }

  // hàm để xóa địa chỉ của người dùng
  async deleteAddress(req, res, next) {
    try {
      // gọi service để xóa địa chỉ của người dùng
      const result = await addressService.deleteAddress(req.user.userId, req.params.addressId);
      // trả về kết quả xóa cùng với thông báo thành công
      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        'Address deleted successfully',
        result
      );
    } catch (error) {
      next(error);
    }
  }

  // hàm để đặt địa chỉ làm mặc định cho người dùng
  async setDefaultAddress(req, res, next) {
    try {
      // gọi service để đặt địa chỉ làm mặc định cho người dùng
      const address = await addressService.setDefaultAddress(req.user.userId, req.params.addressId);
      // trả về địa chỉ đã được đặt làm mặc định cùng với thông báo thành công
      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        'Default address set successfully',
        address
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new AddressController();
