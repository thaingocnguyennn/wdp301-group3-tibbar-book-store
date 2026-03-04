import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Book from "../models/Book.js";
import User from "../models/User.js";
import Voucher from "../models/Voucher.js";
import ApiError from "../utils/ApiError.js";
import { MESSAGES, SHIPPING } from "../config/constants.js";
import paymentService from "./paymentService.js";
import { ROLES } from "../config/constants.js";
import mongoose from "mongoose";
const MAX_ORDERS = 20;
class OrderService {
  normalizeDateBoundary(dateString, isEndOfDay = false) {
    const parsedDate = new Date(dateString);

    if (Number.isNaN(parsedDate.getTime())) {
      throw ApiError.badRequest("Invalid date filter format");
    }

    if (isEndOfDay) {
      parsedDate.setHours(23, 59, 59, 999);
    } else {
      parsedDate.setHours(0, 0, 0, 0);
    }

    return parsedDate;
  }

  // Calculate shipping fee based on subtotal
  calculateShippingFee(subtotalVnd) {
    // Free shipping for orders > 200,000 VND
    if (subtotalVnd > SHIPPING.FREE_THRESHOLD) {
      return 0;
    }
    return SHIPPING.FEE;
  }

  // Generate unique order number
  generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD${timestamp}${random}`;
  }

  // Validate cart before creating order
  async validateCartForCheckout(userId) {
    console.log("🔍 [OrderService] Validating cart for user:", userId);

    const cart = await Cart.findOne({ user: userId }).populate("items.book");

    console.log("📦 [OrderService] Cart found:", {
      cartExists: !!cart,
      itemsCount: cart?.items?.length || 0,
      items: cart?.items?.map(item => ({
        bookId: item.book?._id,
        bookTitle: item.book?.title,
        quantity: item.quantity
      }))
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      console.error("❌ [OrderService] Cart validation failed: Cart is empty");
      throw ApiError.badRequest("Cart is empty");
    }

    const validationErrors = [];
    const validItems = [];

    for (const item of cart.items) {
      if (!item.book) {
        validationErrors.push({ message: "Book not found", itemId: item._id });
        continue;
      }

      if (item.quantity <= 0) {
        validationErrors.push({
          message: "Invalid quantity",
          book: item.book.title,
        });
        continue;
      }
      // validate stock before create order
      if (item.book.stock < item.quantity) {
        validationErrors.push({
          message: `Not enough stock. Available: ${item.book.stock}`,
          book: item.book.title,
        });
        continue;
      }

      if (!item.book.price || item.book.price <= 0) {
        validationErrors.push({
          message: "Invalid price",
          book: item.book.title,
        });
        continue;
      }

      validItems.push(item);
    }

    if (validationErrors.length > 0) {
      throw ApiError.badRequest("Cart validation failed", { errors: validationErrors });
    }

    return { cart, validItems };
  }

  // Calculate order totals
  calculateOrderTotals(items, voucherDiscount = 0, shippingFee = 0) {
    const subtotal = items.reduce((sum, item) => {
      return sum + item.book.price * item.quantity;
    }, 0);

    const discount = voucherDiscount;
    const total = subtotal + shippingFee - discount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      shippingFee: Math.round(shippingFee * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  validateVoucherEligibility(voucher, orderAmount) {
    if (!voucher) {
      throw ApiError.badRequest("Voucher not found");
    }

    if (!voucher.isActive) {
      throw ApiError.badRequest("Voucher is inactive");
    }

    const now = new Date();
    if (new Date(voucher.expiryDate) < now) {
      throw ApiError.badRequest("Voucher has expired");
    }

    if (orderAmount < Number(voucher.minOrderValue || 0)) {
      throw ApiError.badRequest(
        `Order does not meet minimum value of ${Number(voucher.minOrderValue || 0).toLocaleString("vi-VN")}₫`,
      );
    }
  }

  calculateVoucherDiscount(voucher, orderAmount) {
    let discount = 0;

    if (voucher.discountType === "PERCENT") {
      discount = (orderAmount * Number(voucher.discountValue)) / 100;

      if (voucher.maxDiscountValue !== null && voucher.maxDiscountValue !== undefined) {
        discount = Math.min(discount, Number(voucher.maxDiscountValue));
      }
    } else {
      discount = Number(voucher.discountValue);
    }

    discount = Math.min(discount, orderAmount);

    return Math.round(discount * 100) / 100;
  }

  async resolveVoucher({ voucherId = null, voucherCode = null }, orderAmount) {
    if (!voucherId && !voucherCode) {
      return { voucher: null, voucherDiscount: 0 };
    }

    let voucher = null;

    if (voucherId) {
      voucher = await Voucher.findById(voucherId);
    } else if (voucherCode) {
      voucher = await Voucher.findOne({
        code: String(voucherCode).trim().toUpperCase(),
      });
    }

    this.validateVoucherEligibility(voucher, orderAmount);

    const voucherDiscount = this.calculateVoucherDiscount(voucher, orderAmount);

    return { voucher, voucherDiscount };
  }

  async validateVoucherForCheckout(userId, voucherCode) {
    if (!voucherCode || !String(voucherCode).trim()) {
      throw ApiError.badRequest("Voucher code is required");
    }

    const { validItems } = await this.validateCartForCheckout(userId);

    const subtotal = validItems.reduce((sum, item) => {
      return sum + item.book.price * item.quantity;
    }, 0);

    const shippingFee = this.calculateShippingFee(subtotal);
    const orderAmount = subtotal + shippingFee;

    const { voucher, voucherDiscount } = await this.resolveVoucher(
      { voucherCode },
      orderAmount,
    );

    const totals = this.calculateOrderTotals(validItems, voucherDiscount, shippingFee);

    return {
      voucher: {
        _id: voucher._id,
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        maxDiscountValue: voucher.maxDiscountValue,
      },
      totals,
    };
  }

  // Create order
  async createOrder(userId, orderData) {
    const {
      paymentMethod = "COD",
      shippingAddressId = null,
      voucherId = null,
      voucherCode = null,
      notes = "",
      ipAddress = "127.0.0.1",
    } = orderData;

    // Resolve shipping address from user's saved addresses
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    let resolvedAddress = null;
    if (shippingAddressId) {
      resolvedAddress = user.addresses.id(shippingAddressId);
      if (!resolvedAddress) throw ApiError.badRequest("Shipping address not found");
    } else {
      // Fall back to default address
      resolvedAddress = user.addresses.find((a) => a.isDefault) || user.addresses[0];
    }

    if (!resolvedAddress) {
      throw ApiError.badRequest("Please add a shipping address before placing an order");
    }

    const shippingAddressSnapshot = {
      addressId: resolvedAddress._id.toString(),
      fullName: resolvedAddress.fullName,
      phone: resolvedAddress.phone,
      province: resolvedAddress.province,
      district: resolvedAddress.district,
      commune: resolvedAddress.commune,
      description: resolvedAddress.description,
    };

    // Validate payment method
    const paymentProvider = paymentService.getProvider(paymentMethod);
    const canPay = await paymentProvider.canPay();
    if (!canPay) {
      throw ApiError.badRequest(`Payment method ${paymentMethod} is not available`);
    }

    // Validate cart
    const { cart, validItems } = await this.validateCartForCheckout(userId);

    // Calculate subtotal first
    const subtotal = validItems.reduce((sum, item) => {
      return sum + item.book.price * item.quantity;
    }, 0);

    // Calculate shipping fee based on subtotal (free if > 200,000 VND)
    const shippingFee = this.calculateShippingFee(subtotal);

    const orderAmount = subtotal + shippingFee;

    const { voucher, voucherDiscount } = await this.resolveVoucher(
      { voucherId, voucherCode },
      orderAmount,
    );

    const totals = this.calculateOrderTotals(validItems, voucherDiscount, shippingFee);

    // Generate order number
    const orderNumber = this.generateOrderNumber();

    // Prepare order items with snapshot of book data
    const orderItems = validItems.map((item) => ({
      book: item.book._id,
      title: item.book.title,
      author: item.book.author,
      price: item.book.price,
      quantity: item.quantity,
      subtotal: Math.round(item.book.price * item.quantity * 100) / 100,
    }));

    // Create payment
    console.log("💳 [OrderService] Creating payment with provider:", paymentMethod);
    console.log("💰 [OrderService] Payment details:", {
      orderNumber,
      total: totals.total,
      ipAddress
    });

    const paymentResult = await paymentProvider.createPayment({
      orderNumber,
      total: totals.total,
      ipAddress,
    });

    console.log("✅ [OrderService] Payment created:", {
      paymentMethod: paymentResult.paymentMethod,
      paymentStatus: paymentResult.paymentStatus,
      hasQrCode: !!paymentResult.qrCodeUrl
    });

    console.log("✅ [OrderService] Payment created:", {
      paymentMethod: paymentResult.paymentMethod,
      paymentStatus: paymentResult.paymentStatus,
      hasQrCode: !!paymentResult.qrCodeUrl
    });

    // Create order in database
    console.log("📝 [OrderService] Creating order in database...");
    const order = await Order.create({
      orderNumber,
      user: userId,
      items: orderItems,
      subtotal: totals.subtotal,
      discount: totals.discount,
      shippingFee: totals.shippingFee,
      total: totals.total,
      paymentMethod,
      paymentStatus: paymentResult.paymentStatus,
      orderStatus: "PENDING",
      shippingAddress: shippingAddressSnapshot,
      voucher: voucher?._id || null,
      notes,
      transactionId: paymentResult.transactionId || null,
    });
    // 🚀 AUTO ASSIGN NGAY
    await this.autoAssignShipper(order._id);
    // Update book stock safely + prevent overselling
    for (const item of validItems) { //Chỉ cập nhật nếu còn đủ stock, tránh overselling
      const updatedBook = await Book.findOneAndUpdate(  //Chỉ cập nhật nếu còn đủ stock, tránh overselling
        {
          _id: item.book._id, // tìm đúng sách
          stock: { $gte: item.quantity }, // chỉ cập nhật nếu còn đủ stock, tránh overselling
        },
        {
          $inc: { stock: -item.quantity },// decrease stock by ordered quantity
        },
        { new: true } //Trả về document sau khi cập nhật
      );

      if (!updatedBook) { // Nếu không tìm thấy hoặc không đủ stock, throw error
        throw ApiError.badRequest(
          `Product "${item.book.title}" is out of stock or not enough quantity available.`
        );
      }
    }


    // Clear cart only after successful order creation
    await Cart.findByIdAndUpdate(cart._id, { items: [] });

    // Populate order details
    await order.populate("items.book user");

    console.log("🎉 [OrderService] Order created successfully:", {
      orderNumber: order.orderNumber,
      orderId: order._id,
      total: order.total,
      paymentMethod: order.paymentMethod
    });

    return {
      order,
      payment: paymentResult,
    };
  }

  // Get user orders
  async getUserOrders(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: userId })
        .populate("items.book")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ user: userId }),
    ]);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Admin: get all orders with filters
  async getAllOrders({
    page = 1,
    limit = 10,
    status,
    paymentStatus,
    search,
    userId,
    fromDate,
    toDate,
  } = {}) {
    const skip = (page - 1) * limit;
    const filter = {};

    if (status && status !== "all") {
      filter.orderStatus = status;
    }

    if (paymentStatus && paymentStatus !== "all") {
      filter.paymentStatus = paymentStatus;
    }

    if (userId) {
      filter.user = userId;
    }

    if (fromDate || toDate) {
      filter.createdAt = {};

      if (fromDate) {
        filter.createdAt.$gte = this.normalizeDateBoundary(fromDate);
      }

      if (toDate) {
        filter.createdAt.$lte = this.normalizeDateBoundary(toDate, true);
      }

      if (filter.createdAt.$gte && filter.createdAt.$lte && filter.createdAt.$gte > filter.createdAt.$lte) {
        throw ApiError.badRequest("fromDate must be earlier than or equal to toDate");
      }
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      const matchedUsers = await User.find({
        $or: [
          { email: searchRegex },
          { firstName: searchRegex },
          { lastName: searchRegex },
        ],
      }).select("_id");

      const userIds = matchedUsers.map((user) => user._id);

      filter.$or = [
        { orderNumber: searchRegex },
        ...(userIds.length ? [{ user: { $in: userIds } }] : []),
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("items.book")
        .populate("user", "email firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Admin: get order by ID
  async getOrderByIdAdmin(orderId) {
    const order = await Order.findById(orderId)
      .populate("items.book")
      .populate("user", "email firstName lastName")
      .lean();

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    return order;
  }

  // Admin: update order status
  async updateOrderStatus(orderId, status) {
    const allowedStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

    if (!allowedStatuses.includes(status)) {
      throw ApiError.badRequest("Invalid order status");
    }

    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound("Order not found");

    const oldStatus = order.orderStatus;

    order.orderStatus = status;

    if (status === "DELIVERED" && !order.deliveredAt) {
      order.deliveredAt = new Date();

      // 🚀 TRỪ currentOrders
      if (order.shipper) {
        await User.findByIdAndUpdate(order.shipper, {
          $inc: { currentOrders: -1 }
        });
      }
    }

    await order.save();
    await order.populate("items.book user");

    return order;
  }

  // Get order by order number
  async getOrderByNumber(orderNumber, userId) {
    const order = await Order.findOne({ orderNumber })
      .populate("items.book")
      .populate("user", "name email")
      .lean();

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    // Verify order belongs to user
    if (order.user._id.toString() !== userId.toString()) {
      throw ApiError.forbidden("You are not authorized to view this order");
    }

    return order;
  }

  // Confirm payment (for VNPay callback)
  async confirmPayment(callbackParams) {
    // Extract order number from VNPay's vnp_TxnRef
    const orderNumber = callbackParams.vnp_TxnRef;

    if (!orderNumber) {
      throw ApiError.badRequest("Invalid payment callback: Order number not found");
    }

    const order = await Order.findOne({ orderNumber });

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (order.paymentStatus === "PAID") {
      return { order, payment: { success: true, paymentStatus: "PAID", message: "Payment already confirmed" } };
    }

    // Get payment provider and verify the callback
    const paymentProvider = paymentService.getProvider(order.paymentMethod);
    const confirmResult = await paymentProvider.confirmPayment(callbackParams);

    // Update order payment status
    order.paymentStatus = confirmResult.paymentStatus;

    if (confirmResult.success) {
      order.transactionId = confirmResult.transactionId || order.transactionId;
      order.paidAt = new Date();
      order.orderStatus = "PROCESSING"; // Move to processing after payment
    } else {
      order.paymentStatus = "FAILED";
    }

    await order.save();

    return {
      order,
      payment: confirmResult,
    };
  }

  // Cancel order (user can cancel only if order is PENDING)
  async cancelOrder(orderId, userId) {
    const order = await Order.findById(orderId);

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (order.user.toString() !== userId.toString()) {
      throw ApiError.forbidden("You are not authorized to cancel this order");
    }

    if (order.orderStatus !== "PENDING") {
      throw ApiError.badRequest("Order cannot be cancelled at this stage");
    }

    order.orderStatus = "CANCELLED";
    await order.save();

    // Restore book stock
    for (const item of order.items) {
      await Book.findByIdAndUpdate(item.book, {
        $inc: { stock: item.quantity },
      });
    }

    return order;
  }

  // Get available payment methods
  async getAvailablePaymentMethods() {
    return await paymentService.getAvailablePaymentMethods();
  }



  async getRevenue(range) { // Thống kê doanh thu, nếu range = "month" thì thống kê doanh thu trong tháng hiện tại, ngược lại thống kê toàn bộ
    const filter = { orderStatus: "DELIVERED" };// Chỉ tính doanh thu từ những đơn hàng đã được giao thành công

    const now = new Date();// Lấy ngày hiện tại để xác định khoảng thời gian thống kê

    if (range === "month") { // Nếu range là "month", chỉ thống kê doanh thu từ đầu tháng đến hiện tại
      filter.deliveredAt = { // Chỉ tính những đơn hàng được giao trong tháng hiện tại
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),// Ngày đầu tiên của tháng hiện tại
      };
    }

    const orders = await Order.find(filter);// Lấy tất cả đơn hàng đã được giao thành công (và nếu range là "month" thì chỉ lấy những đơn hàng được giao trong tháng hiện tại)

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);// Tính tổng doanh thu bằng cách cộng tổng tiền của tất cả đơn hàng đã được giao thành công (đã lọc theo khoảng thời gian nếu range là "month")

    // 👇 group theo ngày
    const chartMap = {};// Tạo một object để nhóm doanh thu theo ngày, key là ngày (yyyy-mm-dd) và value là tổng doanh thu của ngày đó

    orders.forEach(order => {
      const day = order.deliveredAt.toISOString().slice(0, 10); // yyyy-mm-dd
      chartMap[day] = (chartMap[day] || 0) + order.total;// Cộng dồn doanh thu của đơn hàng vào ngày tương ứng trong chartMap
    });

    const chartData = Object.keys(chartMap).map(day => ({// Chuyển đổi chartMap thành mảng để dễ sử dụng cho biểu đồ, mỗi phần tử có dạng { date: "yyyy-mm-dd", revenue: tổng doanh thu của ngày đó }
      date: day,// Ngày (yyyy-mm-dd)
      revenue: chartMap[day],// Tổng doanh thu của ngày đó
    }));

    return { // Trả về tổng doanh thu, số lượng đơn hàng đã giao thành công và dữ liệu để vẽ biểu đồ doanh thu theo ngày
      totalRevenue,
      totalOrders: orders.length,
      chartData,
    };
  }

  async getOrderById(orderId) {
    const order = await Order.findById(orderId)
      .populate("user", "email firstName lastName")
      .populate("shipper", "email firstName lastName")
      .populate("items.book");

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    return order;
  }

  async assignShipper(orderId, shipperId) { // Lấy orderId và shipperId từ tham số hàm
    const shipper = await User.findById(shipperId);// Tìm shipper trong database
    if (!shipper || shipper.role?.toLowerCase() !== "shipper") { // Kiểm tra nếu không tìm thấy hoặc không phải là shipper
      throw ApiError.badRequest("Invalid shipper"); // Trả về lỗi nếu shipper không hợp lệ
    }

    const order = await Order.findById(orderId); // Tìm order trong database
    if (!order) { // Kiểm tra nếu không tìm thấy order
      throw ApiError.notFound("Order not found");// Trả về lỗi nếu không tìm thấy order
    }

    // ❌ Không cho assign lại
    if (order.shipper) {
      throw ApiError.badRequest("Order already assigned to a shipper");
    }

    order.shipper = shipperId;
    order.assignedAt = new Date();

    // ⭐ CHUYỂN TRẠNG THÁI SANG SHIPPED
    order.orderStatus = "SHIPPED";

    await order.save(); // Lưu order sau khi gán shipper
    await order.populate("shipper", "email");// Populate thông tin shipper (chỉ lấy email)

    return order;
  }
  // Lấy số lượng đơn hàng đang được giao (SHIPPED hoặc PROCESSING) của shipper để kiểm tra giới hạn 20 đơn hàng
  async getActiveOrderCount(shipperId) {
    return await Order.countDocuments({
      shipper: shipperId,
      orderStatus: { $in: ["SHIPPED", "PROCESSING"] }
    });
  }
  // Tự động gán shipper cho đơn hàng dựa trên địa chỉ giao hàng và khu vực phục vụ của shipper

  async autoAssignShipper(orderId) {
    const order = await Order.findById(orderId);

    if (!order) {
      throw ApiError.notFound("Order not found");
    }

    if (order.shipper) {
      throw ApiError.badRequest("Order already assigned");
    }

    const { province, district } = order.shippingAddress || {};

    if (!province || !district) {
      throw ApiError.badRequest("Shipping address incomplete");
    }

    console.log("🔍 Looking for shipper:", province, district);

    const shipper = await User.findOne({
      role: ROLES.SHIPPER,
      isActive: true,
      currentOrders: { $lt: MAX_ORDERS },
      _id: { $nin: order.rejectedShippers || [] },
      addresses: {
        $elemMatch: {
          province: province.trim(),
          district: district.trim(),
        },
      },
    }).sort({ currentOrders: 1 });

    // ❌ Nếu không có shipper → KHÔNG throw
    if (!shipper) {
      console.log("❌ No available shipper found");

      // giữ order ở trạng thái PROCESSING thay vì SHIPPED
      order.orderStatus = "PROCESSING";
      await order.save();

      return order;
    }

    // ✅ Assign shipper
    order.shipper = shipper._id;
    order.assignedAt = new Date();
    order.orderStatus = "SHIPPED";
    order.assignmentStatus = "PENDING";

    await order.save();

    // tăng số đơn hiện tại
    await User.findByIdAndUpdate(shipper._id, {
      $inc: { currentOrders: 1 },
    });

    await order.populate("shipper", "email firstName lastName");

    console.log("✅ Assigned to shipper:", shipper.email);

    return order;
  }

  async respondAssignment(orderId, shipperId, action) {

    const order = await Order.findById(orderId);

    if (!order) throw ApiError.notFound("Order not found");

    // ✅ Kiểm tra đúng shipper
    if (!order.shipper || order.shipper.toString() !== shipperId.toString()) {
      throw ApiError.forbidden("Not your assignment");
    }

    if (order.assignmentStatus !== "PENDING") {
      throw ApiError.badRequest("Assignment already responded");
    }

    // ================= ACCEPT =================
    if (action === "ACCEPT") {

      order.assignmentStatus = "ACCEPTED";

      // ❌ KHÔNG đổi orderStatus nữa
      // order.orderStatus = "PROCESSING";

      await order.save();

      return { message: "Order accepted successfully" };
    }
    // ================= REJECT =================
    if (action === "REJECT") {

      // 1️⃣ Thêm shipper vào danh sách đã reject
      if (!order.rejectedShippers) {
        order.rejectedShippers = [];
      }

      order.rejectedShippers.push(shipperId);

      // 2️⃣ Trừ currentOrders
      await User.findByIdAndUpdate(shipperId, {
        $inc: { currentOrders: -1 }
      });

      const { province, district } = order.shippingAddress;

      // 3️⃣ Tìm shipper KHÔNG nằm trong rejectedShippers
      const newShipper = await User.find({
        role: ROLES.SHIPPER,
        isActive: true,
        currentOrders: { $lt: MAX_ORDERS },
        _id: { $nin: order.rejectedShippers }, // 🔥 CHỖ QUAN TRỌNG
        addresses: {
          $elemMatch: {
            province: province.trim(),
            district: district.trim()
          }
        }
      }).sort({ currentOrders: 1 });

      if (!newShipper || newShipper.length === 0) {

        console.log("⚠ All shippers rejected. Resetting order...");

        order.shipper = null;
        order.assignmentStatus = null;
        order.orderStatus = "PENDING";
        order.assignedAt = null;

        await order.save();

        return { message: "All shippers rejected. Order moved back to PENDING." };
      }

      const nextShipper = newShipper[0];

      order.shipper = nextShipper._id;
      order.assignmentStatus = "PENDING";
      order.orderStatus = "SHIPPED";
      order.assignedAt = new Date();

      await order.save();

      await User.findByIdAndUpdate(nextShipper._id, {
        $inc: { currentOrders: 1 }
      });

      return { message: "Reassigned to new shipper" };
    }

    throw ApiError.badRequest("Invalid action");
  }
}

export default new OrderService();
