import Order from '../models/Order.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import orderService from "./orderService.js";
import { ROLES } from "../config/constants.js";
class ShipperService {
  // Get all orders assigned to a shipper with pagination
  async getShipperOrders(shipperId, filters = {}) {
    const { page = 1, limit = 10, status = null } = filters;
    const skip = (page - 1) * limit;


    const query = { shipper: shipperId };

    // Filter by order status if provided
    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .populate('user', 'firstName lastName email phone')
      .populate('shipper', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    return {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get order details with address snapshot for assigned shipper only
  async getOrderDetails(orderId, shipperId) {
    const order = await Order.findById(orderId)
      .populate('user', 'firstName lastName email phone')
      .populate({
        path: 'items.book',
        select: 'title author ISBN price'
      });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    // Verify the order belongs to this shipper
    if (order.shipper?.toString() !== shipperId?.toString()) {
      throw new ApiError(403, 'You do not have access to this order');
    }

    return order;
  }

  // Update order status
  async updateOrderStatus(orderId, shipperId, newStatus) {
    const allowedStatuses = ['DELIVERED', 'CANCELLED'];

    if (!allowedStatuses.includes(newStatus)) {
      throw new ApiError(400, 'Invalid order status');
    }

    const order = await Order.findById(orderId);

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (order.shipper?.toString() !== shipperId?.toString()) {
      throw new ApiError(403, 'You do not have access to this order');
    }

    if (order.orderStatus !== 'SHIPPED') {
      throw new ApiError(
        400,
        `Invalid status transition: ${order.orderStatus} -> ${newStatus}. Shipper can only update from SHIPPED.`
      );
    }

    // 🚨 BẮT BUỘC có ảnh nếu muốn DELIVERED
    if (newStatus === 'DELIVERED') {
      if (!order.deliveryProof?.imageUrl) {
        throw new ApiError(400, 'Please upload delivery proof before marking as delivered');
      }
    }

    // Nếu chuyển sang DELIVERED hoặc CANCELLED
    if (['DELIVERED', 'CANCELLED'].includes(newStatus)) {
      await User.findByIdAndUpdate(shipperId, {
        $inc: { currentOrders: -1 }
      });

      if (newStatus === 'DELIVERED' && !order.deliveredAt) {
        order.deliveredAt = new Date();

        // ⭐ Thưởng shipper
        const reward = 10000;
        await User.findByIdAndUpdate(shipperId, { $inc: { earnings: reward } });
      }
    }

    order.orderStatus = newStatus;
    await order.save();

    return order;
  }

  // Get shipper profile with statistics
  async getShipperProfile(shipperId) {
    const shipper = await User.findById(shipperId);

    if (!shipper) {
      throw new ApiError(404, 'Shipper not found');
    }

    if (shipper.role !== 'shipper') {
      throw new ApiError(403, 'User is not a shipper');
    }

    // Get statistics
    const totalOrders = await Order.countDocuments({ shipper: shipperId });
    const deliveredOrders = await Order.countDocuments({
      shipper: shipperId,
      orderStatus: 'DELIVERED'
    });
    const pendingOrders = await Order.countDocuments({
      shipper: shipperId,
      orderStatus: { $in: ['PENDING', 'PROCESSING', 'SHIPPED'] }
    });

    return {
      profile: shipper,
      statistics: {
        totalOrders,
        deliveredOrders,
        pendingOrders
      }
    };
  }

  // Get dashboard data
  async getShipperDashboard(shipperId) {
    const shipper = await User.findById(shipperId);

    if (!shipper) {
      throw new ApiError(404, 'Shipper not found');
    }

    if (shipper.role !== 'shipper') {
      throw new ApiError(403, 'User is not a shipper');
    }

    // Get statistics
    const totalOrders = await Order.countDocuments({ shipper: shipperId });
    const deliveredOrders = await Order.countDocuments({
      shipper: shipperId,
      orderStatus: 'DELIVERED'
    });
    const shippedOrders = await Order.countDocuments({
      shipper: shipperId,
      orderStatus: 'SHIPPED'
    });
    const cancelledOrders = await Order.countDocuments({
      shipper: shipperId,
      orderStatus: 'CANCELLED'
    });

    // Get recent orders
    const recentOrders = await Order.find({ shipper: shipperId })
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(5);
    const performance = await orderService.getShipperPerformance(shipperId);
    return {
      statistics: {
        totalOrders,
        deliveredOrders,
        shippedOrders,
        cancelledOrders
      },
      recentOrders,
      performance
    };
  }
  async uploadDeliveryProof(orderId, shipperId, imageUrl) {
    const order = await Order.findById(orderId);
    // 1. Check order tồn tại
    if (!order) {
      throw new ApiError(404, "Order not found");
    }
    // 2. Check đúng shipper
    if (order.shipper?.toString() !== shipperId.toString()) {
      throw new ApiError(403, "Not your order");
    }
    // 3. Chỉ cho phép khi đã SHIPPED
    if (order.orderStatus !== "SHIPPED") {
      throw new ApiError(400, "Only shipped orders can upload proof");
    }
    // 🔥 4. (QUAN TRỌNG) phải accept đơn trước
    if (order.assignmentStatus !== "ACCEPTED") {
      throw new ApiError(400, "You must accept the order before uploading proof");
    }

    // 🔥 5. Không cho upload lại (tránh overwrite)
    if (order.deliveryProof?.imageUrl) {
      throw new ApiError(400, "Delivery proof already uploaded");
    }

    // 6. Lưu proof
    order.deliveryProof = {
      imageUrl,
      uploadedAt: new Date()
    };

    await order.save();

    return order;
  }
  // Toggle shipper online/offline status
  async toggleOnlineStatus(userId) {
    const shipper = await User.findById(userId);

    if (!shipper) {
      throw new ApiError(404, "Shipper not found");
    }

    if (shipper.role !== ROLES.SHIPPER) {
      throw new ApiError(403, "User is not a shipper");
    }

    // toggle
    shipper.isOnline = !shipper.isOnline;
    await shipper.save();

    return {
      isOnline: shipper.isOnline,
    };
  }
  // Get shipper earnings and statistics
  async getShipperEarnings(shipperId) {
    const shipper = await User.findById(shipperId);

    if (!shipper) throw new ApiError(404, "Shipper not found");
    if (shipper.role !== ROLES.SHIPPER)
      throw new ApiError(403, "User is not a shipper");

    const deliveredOrdersCount = await Order.countDocuments({
      shipper: shipperId,
      orderStatus: "DELIVERED",
    });
    const totalCancelled = await Order.countDocuments({
      shipper: shipperId,
      orderStatus: "CANCELLED",
    });

    // Thưởng 10.000 VND/đơn
    const earnings = deliveredOrdersCount * 10000;

    return {
      earnings,
      totalDelivered: deliveredOrdersCount,
      totalCancelled,
    };
  }
  async getRoute(shipperId) {
    const AVERAGE_SPEED_KMH = 40; // km/h

    // Lấy đơn đã accept
    const orders = await Order.find({
      shipper: shipperId,
      orderStatus: { $in: ["PROCESSING", "SHIPPED"] },
      assignmentStatus: "ACCEPTED",
    }).lean();

    if (!orders.length) return { route: [], totalDistanceKm: 0 };

    // Lấy danh sách điểm (lat/lng)
    const points = orders
      .map(order => {
        const { latitude, longitude } = order.shippingAddress || {};

        // 🔥 BỎ THROW → CHỈ SKIP
        if (!latitude || !longitude) return null;

        return {
          orderId: order._id,
          lat: latitude,
          lng: longitude,
          address: order.shippingAddress.description || "",
        };
      })
      .filter(Boolean); // loại null
    if (points.length === 0) {
      return {
        route: [],
        totalDistanceKm: 0,
      };
    }
    // Tạo ma trận khoảng cách
    const origins = points.map(p => `${p.lat},${p.lng}`).join("|");
    const destinations = origins;
    const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json`,
      {
        params: {
          origins,
          destinations,
          key: GOOGLE_API_KEY,
          mode: "driving",
        },
      }
    );

    if (response.data.status !== "OK") {
      throw new ApiError(500, "Failed to get distance matrix from Google");
    }

    const distanceMatrix = response.data.rows.map(row =>
      row.elements.map(el => el.distance.value / 1000) // km
    );

    // Sắp xếp thứ tự đơn hàng theo Nearest Neighbor
    const visited = new Set();
    const route = [];
    let currentIndex = 0;
    visited.add(currentIndex);
    route.push(points[currentIndex]);

    while (visited.size < points.length) {
      let nearestIndex = null;
      let nearestDistance = Infinity;

      for (let i = 0; i < points.length; i++) {
        if (visited.has(i)) continue;
        if (distanceMatrix[currentIndex][i] < nearestDistance) {
          nearestDistance = distanceMatrix[currentIndex][i];
          nearestIndex = i;
        }
      }

      visited.add(nearestIndex);
      route.push(points[nearestIndex]);
      currentIndex = nearestIndex;
    }

    // Tính ETA
    let cumulativeTimeMin = 0;
    const routeWithETA = route.map((point, index) => {
      if (index === 0) {
        point.etaMinutes = cumulativeTimeMin;
      } else {
        const distance = distanceMatrix[index - 1][index]; // km
        const time = (distance / AVERAGE_SPEED_KMH) * 60; // phút
        cumulativeTimeMin += time;
        point.etaMinutes = cumulativeTimeMin;
      }
      return point;
    });

    return {
      route: routeWithETA,
      totalDistanceKm: distanceMatrix.flat().reduce((a, b) => a + b, 0),
    };
  }
}




export default new ShipperService();
