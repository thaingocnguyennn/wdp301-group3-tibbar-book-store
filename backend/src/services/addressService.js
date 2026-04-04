import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import axios from "axios";
class AddressService {
  //hàm để lấy danh sách địa chỉ của người dùng
  async getUserAddresses(userId) {
    // gọi database để lấy thông tin người dùng và danh sách địa chỉ của họ
    const user = await User.findById(userId);
    // nếu không tìm thấy người dùng, trả về lỗi 404
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user.addresses || [];
  }

  // hàm để thêm địa chỉ mới cho người dùng
  async addAddress(userId, addressData) {
    // gọi database để lấy thông tin người dùng
    const user = await User.findById(userId);
    // nếu không tìm thấy người dùng, trả về lỗi 404
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    //nếu địa chỉ mới được đánh dấu là mặc định, bỏ đánh dấu mặc định của tất cả địa chỉ khác
    if (addressData.isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // Nếu đây là địa chỉ đầu tiên của người dùng, tự động đặt nó làm mặc định
    if (user.addresses.length === 0) {
      addressData.isDefault = true;
    }
    // thêm địa chỉ mới vào danh sách địa chỉ của người dùng
    user.addresses.push(addressData);
    // lưu thông tin người dùng đã được cập nhật vào database
    await user.save();

    // trả về địa chỉ mới được thêm vào cùng với thông báo thành công
    return user.addresses[user.addresses.length - 1];
  }

  // hàm để cập nhật địa chỉ của người dùng
  async updateAddress(userId, addressId, addressData) {
    // gọi database để lấy thông tin người dùng
    const user = await User.findById(userId);
    // nếu không tìm thấy người dùng, trả về lỗi 404
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // tìm địa chỉ cần cập nhật trong danh sách địa chỉ của người dùng
    const address = user.addresses.id(addressId);
    // nếu không tìm thấy địa chỉ, trả về lỗi 404
    if (!address) {
      throw new ApiError(404, 'Address not found');
    }

    // nếu địa chỉ mới được đánh dấu là mặc định, bỏ đánh dấu mặc định của tất cả địa chỉ khác
    if (addressData.isDefault && !address.isDefault) {
      user.addresses.forEach(addr => {
        if (addr._id.toString() !== addressId) {
          addr.isDefault = false;
        }
      });
    }

    // cập nhật thông tin địa chỉ với dữ liệu mới
    Object.keys(addressData).forEach(key => {
      address[key] = addressData[key];
    });

    // lưu thông tin người dùng đã được cập nhật vào database
    await user.save();
    return address;
  }

  // hàm để xóa địa chỉ của người dùng
  async deleteAddress(userId, addressId) {
    // gọi database để lấy thông tin người dùng
    const user = await User.findById(userId);
    // nếu không tìm thấy người dùng, trả về lỗi 404
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // tìm địa chỉ cần xóa trong danh sách địa chỉ của người dùng
    const address = user.addresses.id(addressId);
    // nếu không tìm thấy địa chỉ, trả về lỗi 404
    if (!address) {
      throw new ApiError(404, 'Address not found');
    }

    // lưu trạng thái mặc định của địa chỉ trước khi xóa
    const wasDefault = address.isDefault;

    // xóa địa chỉ khỏi danh sách địa chỉ của người dùng
    user.addresses.pull({ _id: addressId });

    // nếu địa chỉ bị xóa là mặc định và vẫn còn địa chỉ khác, đặt địa chỉ đầu tiên trong danh sách làm mặc định
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    // lưu thông tin người dùng đã được cập nhật vào database
    await user.save();
    return { message: 'Address deleted successfully' };
  }

  // hàm để đặt địa chỉ làm mặc định cho người dùng
  async setDefaultAddress(userId, addressId) {
    // gọi database để lấy thông tin người dùng
    const user = await User.findById(userId);
    // nếu không tìm thấy người dùng, trả về lỗi 404
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // tìm địa chỉ cần đặt làm mặc định trong danh sách địa chỉ của người dùng
    const address = user.addresses.id(addressId);
    // nếu không tìm thấy địa chỉ, trả về lỗi 404
    if (!address) {
      throw new ApiError(404, 'Address not found');
    }

    // bỏ đánh dấu mặc định của tất cả địa chỉ khác
    user.addresses.forEach(addr => {
      addr.isDefault = false;
    });

    // đặt địa chỉ được chọn làm mặc định
    address.isDefault = true;

    // lưu thông tin người dùng đã được cập nhật vào database
    await user.save();
    return address;
  }
}

export default new AddressService();
