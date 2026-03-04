import addressService from '../services/addressService.js';
import ApiResponse from '../utils/ApiResponse.js';
import { HTTP_STATUS } from '../config/constants.js';

class AddressController {
  async getAddresses(req, res, next) {
    try {
      const addresses = await addressService.getUserAddresses(req.user.userId);
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

  async addAddress(req, res, next) {
    try {
      const address = await addressService.addAddress(req.user.userId, req.body);
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

  async updateAddress(req, res, next) {
    try {
      const address = await addressService.updateAddress(
        req.user.userId,
        req.params.addressId,
        req.body
      );
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

  async deleteAddress(req, res, next) {
    try {
      const result = await addressService.deleteAddress(req.user.userId, req.params.addressId);
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

  async setDefaultAddress(req, res, next) {
    try {
      const address = await addressService.setDefaultAddress(req.user.userId, req.params.addressId);
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
