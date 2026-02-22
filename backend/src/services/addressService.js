import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';

class AddressService {
  // Get all addresses for a user
  async getUserAddresses(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user.addresses || [];
  }

  // Add a new address
  async addAddress(userId, addressData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // If this is set as default, unset all other defaults
    if (addressData.isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // If this is the first address, make it default
    if (user.addresses.length === 0) {
      addressData.isDefault = true;
    }

    user.addresses.push(addressData);
    await user.save();

    return user.addresses[user.addresses.length - 1];
  }

  // Update an address
  async updateAddress(userId, addressId, addressData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      throw new ApiError(404, 'Address not found');
    }

    // If setting this as default, unset all other defaults
    if (addressData.isDefault && !address.isDefault) {
      user.addresses.forEach(addr => {
        if (addr._id.toString() !== addressId) {
          addr.isDefault = false;
        }
      });
    }

    // Update fields
    Object.keys(addressData).forEach(key => {
      address[key] = addressData[key];
    });

    await user.save();
    return address;
  }

  // Delete an address
  async deleteAddress(userId, addressId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      throw new ApiError(404, 'Address not found');
    }

    const wasDefault = address.isDefault;
    address.deleteOne();

    // If deleted address was default and there are other addresses, make the first one default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return { message: 'Address deleted successfully' };
  }

  // Set an address as default
  async setDefaultAddress(userId, addressId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      throw new ApiError(404, 'Address not found');
    }

    // Unset all defaults
    user.addresses.forEach(addr => {
      addr.isDefault = false;
    });

    // Set this one as default
    address.isDefault = true;

    await user.save();
    return address;
  }
}

export default new AddressService();
